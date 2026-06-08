create extension if not exists pgcrypto;

create table public.published_catalog_products (
  id text primary key,
  slug text not null unique,
  name text not null,
  category text not null default 'degustation',
  description text not null default '',
  product_type text not null check (
    product_type in (
      'standard',
      'single_choice',
      'single_choice_bundle',
      'ingredient_customization'
    )
  ),
  purchase_modes jsonb not null default '[]'::jsonb,
  choice_group jsonb,
  ingredient_options jsonb not null default '[]'::jsonb,
  unit_label text not null default 'unité',
  price_cents integer not null check (price_cents >= 0),
  dozen_price_cents integer check (dozen_price_cents >= 0),
  image_url text not null,
  gallery jsonb not null default '[]'::jsonb,
  availability_note text not null default 'Disponible sur commande',
  is_available boolean not null default true,
  display_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.customer_orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  customer_email text,
  note text,
  status text not null default 'new',
  source text not null default 'savouretplus',
  total_cents integer not null check (total_cents >= 0),
  items jsonb not null check (jsonb_typeof(items) = 'array'),
  created_at timestamptz not null default now()
);

create table public.quote_requests (
  id uuid primary key default gen_random_uuid(),
  payload jsonb not null check (jsonb_typeof(payload) = 'object'),
  status text not null default 'new',
  source text not null default 'savouretplus',
  created_at timestamptz not null default now()
);

alter table public.published_catalog_products enable row level security;
alter table public.customer_orders enable row level security;
alter table public.quote_requests enable row level security;

create policy "Published catalog is readable"
on public.published_catalog_products
for select
to anon, authenticated
using (is_available = true);

create policy "Public customers can create orders"
on public.customer_orders
for insert
to anon, authenticated
with check (
  source = 'savouretplus'
  and status = 'new'
  and length(trim(customer_name)) > 0
  and length(trim(customer_phone)) > 0
);

grant select on public.published_catalog_products to anon, authenticated;
grant all on public.published_catalog_products to service_role;
grant insert (
  customer_name,
  customer_phone,
  customer_email,
  note,
  status,
  source,
  total_cents,
  items
) on public.customer_orders to anon, authenticated;

create or replace function public.submit_quote_request(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_id uuid;
begin
  if $1 is null or jsonb_typeof($1) <> 'object' then
    raise exception 'A quote request payload must be a JSON object';
  end if;

  if coalesce($1 #>> '{customer,name}', '') = ''
    or coalesce($1 #>> '{customer,phone}', '') = ''
    or coalesce($1 #>> '{event_details,event_date}', '') = ''
  then
    raise exception 'Customer name, phone and event date are required';
  end if;

  insert into public.quote_requests (payload)
  values ($1)
  returning id into request_id;

  return request_id;
end;
$$;

revoke all on function public.submit_quote_request(jsonb) from public;
grant execute on function public.submit_quote_request(jsonb) to anon, authenticated;
