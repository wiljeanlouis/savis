-- Install the secured RPC and make it the only public order-ingestion path.
-- Coordinate application of this migration with the savouretplus.com RPC client.

create schema if not exists private;

revoke all on schema private from public, anon, authenticated;

create table private.customer_order_requests (
  scope text not null,
  request_id uuid not null,
  payload_fingerprint text not null check (length(payload_fingerprint) = 64),
  customer_order_id uuid,
  created_at timestamptz not null default now(),
  completed_at timestamptz,
  primary key (scope, request_id),
  constraint customer_order_requests_customer_order_fk
    foreign key (customer_order_id)
    references public.customer_orders(id)
    on delete restrict,
  constraint customer_order_requests_completion_check check (
    (customer_order_id is null and completed_at is null)
    or (customer_order_id is not null and completed_at is not null)
  )
);

comment on table private.customer_order_requests is
  'Private idempotency ledger for public ingestion. Retain rows at least as long as the linked customer_orders row; do not purge independently. Archive/delete only with the linked order under the SAVIS retention policy.';

revoke all on table private.customer_order_requests from public, anon, authenticated;

create or replace function private.customer_order_sha256(value text)
returns text
language plpgsql
security definer
set search_path = ''
as $$
declare
  extension_schema name;
  fingerprint text;
begin
  select nsp.nspname
    into extension_schema
  from pg_catalog.pg_extension as ext
  join pg_catalog.pg_namespace as nsp on nsp.oid = ext.extnamespace
  where ext.extname = 'pgcrypto';

  if extension_schema is null then
    raise exception 'pgcrypto extension is required';
  end if;

  execute pg_catalog.format(
    'select pg_catalog.encode(%I.digest(pg_catalog.convert_to($1, ''UTF8''), ''sha256''), ''hex'')',
    extension_schema
  ) into fingerprint using value;

  return fingerprint;
end;
$$;

revoke all on function private.customer_order_sha256(text) from public, anon, authenticated;

create or replace function public.receive_customer_order(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_uuid uuid;
  fingerprint text;
  existing_fingerprint text;
  reception_id uuid;
  item jsonb;
  nested jsonb;
  address jsonb;
  item_count integer;
  quantity_value integer;
  unit_price_value integer;
  estimated_total bigint := 0;
  scope_value constant text := 'savouretplus.customer-order.v1';
begin
  if payload is null
    or pg_catalog.jsonb_typeof(payload) is distinct from 'object'
    or pg_catalog.octet_length(pg_catalog.convert_to(payload::text, 'UTF8')) > 65536
  then
    raise exception using
      errcode = '22023',
      message = 'ORDER_INVALID_PAYLOAD',
      detail = 'payload must be a JSON object no larger than 65536 bytes';
  end if;

  if exists (
    select 1
    from pg_catalog.jsonb_object_keys(payload) as key_name
    where key_name not in (
      'request_id', 'customer_name', 'customer_phone', 'customer_email',
      'customer_address', 'note', 'total_cents', 'items'
    )
  ) then
    raise exception using
      errcode = '22023',
      message = 'ORDER_INVALID_PAYLOAD',
      detail = 'payload contains an unknown or server-managed field';
  end if;

  if pg_catalog.jsonb_typeof(payload -> 'request_id') is distinct from 'string' then
    raise exception using errcode = '22023', message = 'ORDER_INVALID_REQUEST_ID';
  end if;
  begin
    request_uuid := (payload ->> 'request_id')::uuid;
  exception when invalid_text_representation then
    raise exception using errcode = '22023', message = 'ORDER_INVALID_REQUEST_ID';
  end;

  if pg_catalog.jsonb_typeof(payload -> 'customer_name') is distinct from 'string'
    or pg_catalog.char_length(pg_catalog.btrim(payload ->> 'customer_name')) not between 1 and 200
    or pg_catalog.jsonb_typeof(payload -> 'customer_phone') is distinct from 'string'
    or pg_catalog.char_length(pg_catalog.btrim(payload ->> 'customer_phone')) not between 1 and 50
  then
    raise exception using
      errcode = '22023', message = 'ORDER_INVALID_PAYLOAD',
      detail = 'customer_name and customer_phone are required';
  end if;

  if payload ? 'customer_email'
    and payload -> 'customer_email' <> 'null'::jsonb
    and (
      pg_catalog.jsonb_typeof(payload -> 'customer_email') is distinct from 'string'
      or pg_catalog.char_length(payload ->> 'customer_email') > 254
    )
  then
    raise exception using errcode = '22023', message = 'ORDER_INVALID_PAYLOAD', detail = 'invalid customer_email';
  end if;

  if payload ? 'note'
    and payload -> 'note' <> 'null'::jsonb
    and (
      pg_catalog.jsonb_typeof(payload -> 'note') is distinct from 'string'
      or pg_catalog.char_length(payload ->> 'note') > 2000
    )
  then
    raise exception using errcode = '22023', message = 'ORDER_INVALID_PAYLOAD', detail = 'invalid note';
  end if;

  address := payload -> 'customer_address';
  if address is not null and address <> 'null'::jsonb then
    if pg_catalog.jsonb_typeof(address) is distinct from 'object'
      or exists (
        select 1 from pg_catalog.jsonb_object_keys(address) as key_name
        where key_name not in ('line1', 'line2', 'city', 'province', 'postal_code')
      )
    then
      raise exception using errcode = '22023', message = 'ORDER_INVALID_PAYLOAD', detail = 'invalid customer_address';
    end if;

    if exists (
      select 1
      from pg_catalog.jsonb_each(address) as address_field(key_name, field_value)
      where field_value <> 'null'::jsonb
        and (
          pg_catalog.jsonb_typeof(field_value) is distinct from 'string'
          or pg_catalog.char_length(field_value #>> '{}') > 200
        )
    ) then
      raise exception using errcode = '22023', message = 'ORDER_INVALID_PAYLOAD', detail = 'invalid customer_address field';
    end if;
  end if;

  if pg_catalog.jsonb_typeof(payload -> 'items') is distinct from 'array' then
    raise exception using errcode = '22023', message = 'ORDER_INVALID_PAYLOAD', detail = 'items must be an array';
  end if;
  item_count := pg_catalog.jsonb_array_length(payload -> 'items');
  if item_count not between 1 and 100 then
    raise exception using errcode = '22023', message = 'ORDER_LIMIT_EXCEEDED', detail = 'items must contain between 1 and 100 entries';
  end if;

  if pg_catalog.jsonb_typeof(payload -> 'total_cents') is distinct from 'number'
    or not ((payload ->> 'total_cents') ~ '^(0|[1-9][0-9]*)$')
    or (payload ->> 'total_cents')::numeric > 2147483647
  then
    raise exception using errcode = '22023', message = 'ORDER_INVALID_PAYLOAD', detail = 'total_cents must be a non-negative 32-bit integer';
  end if;

  for item in select value from pg_catalog.jsonb_array_elements(payload -> 'items')
  loop
    if pg_catalog.jsonb_typeof(item) is distinct from 'object'
      or exists (
        select 1 from pg_catalog.jsonb_object_keys(item) as key_name
        where key_name not in (
          'product_id', 'name', 'category', 'product_type', 'image_url', 'quantity',
          'base_price_cents', 'unit_price_cents', 'purchase_mode', 'selection',
          'allocation', 'ingredients', 'key'
        )
      )
    then
      raise exception using errcode = '22023', message = 'ORDER_INVALID_PAYLOAD', detail = 'invalid item object';
    end if;

    if pg_catalog.jsonb_typeof(item -> 'product_id') is distinct from 'string' then
      raise exception using errcode = '22023', message = 'ORDER_INVALID_PRODUCT_ID';
    end if;
    begin
      perform (item ->> 'product_id')::uuid;
    exception when invalid_text_representation then
      raise exception using errcode = '22023', message = 'ORDER_INVALID_PRODUCT_ID';
    end;

    if pg_catalog.jsonb_typeof(item -> 'name') is distinct from 'string'
      or pg_catalog.char_length(pg_catalog.btrim(item ->> 'name')) not between 1 and 300
      or pg_catalog.jsonb_typeof(item -> 'category') is distinct from 'string'
      or (item ->> 'category') not in ('tasting', 'decoration')
      or pg_catalog.jsonb_typeof(item -> 'product_type') is distinct from 'string'
      or (item ->> 'product_type') not in (
        'standard', 'single_choice', 'single_choice_bundle', 'ingredient_customization'
      )
    then
      raise exception using errcode = '22023', message = 'ORDER_INVALID_CATEGORY_OR_TYPE';
    end if;

    if item ? 'image_url' and item -> 'image_url' <> 'null'::jsonb
      and (
        pg_catalog.jsonb_typeof(item -> 'image_url') is distinct from 'string'
        or pg_catalog.char_length(item ->> 'image_url') > 2048
      )
    then
      raise exception using errcode = '22023', message = 'ORDER_INVALID_PAYLOAD', detail = 'invalid image_url';
    end if;
    if item ? 'key' and item -> 'key' <> 'null'::jsonb
      and (
        pg_catalog.jsonb_typeof(item -> 'key') is distinct from 'string'
        or pg_catalog.char_length(item ->> 'key') > 1000
      )
    then
      raise exception using errcode = '22023', message = 'ORDER_INVALID_PAYLOAD', detail = 'invalid item key';
    end if;

    if pg_catalog.jsonb_typeof(item -> 'quantity') is distinct from 'number'
      or not ((item ->> 'quantity') ~ '^[1-9][0-9]*$')
      or (item ->> 'quantity')::numeric > 1000
      or pg_catalog.jsonb_typeof(item -> 'unit_price_cents') is distinct from 'number'
      or not ((item ->> 'unit_price_cents') ~ '^(0|[1-9][0-9]*)$')
      or (item ->> 'unit_price_cents')::numeric > 100000000
    then
      raise exception using errcode = '22023', message = 'ORDER_LIMIT_EXCEEDED', detail = 'invalid quantity or estimated unit price';
    end if;
    quantity_value := (item ->> 'quantity')::integer;
    unit_price_value := (item ->> 'unit_price_cents')::integer;
    estimated_total := estimated_total + quantity_value::bigint * unit_price_value::bigint;

    if item ? 'base_price_cents' and item -> 'base_price_cents' <> 'null'::jsonb
      and (
        pg_catalog.jsonb_typeof(item -> 'base_price_cents') is distinct from 'number'
        or not ((item ->> 'base_price_cents') ~ '^(0|[1-9][0-9]*)$')
        or (item ->> 'base_price_cents')::numeric > 100000000
      )
    then
      raise exception using errcode = '22023', message = 'ORDER_LIMIT_EXCEEDED', detail = 'invalid estimated base price';
    end if;

    nested := item -> 'purchase_mode';
    if nested is not null and nested <> 'null'::jsonb then
      if pg_catalog.jsonb_typeof(nested) is distinct from 'object'
        or exists (
          select 1 from pg_catalog.jsonb_object_keys(nested) as key_name
          where key_name not in ('id', 'label', 'quantity', 'allocation_type')
        )
        or pg_catalog.jsonb_typeof(nested -> 'id') is distinct from 'string'
        or pg_catalog.char_length(pg_catalog.btrim(nested ->> 'id')) not between 1 and 100
        or pg_catalog.jsonb_typeof(nested -> 'label') is distinct from 'string'
        or pg_catalog.char_length(pg_catalog.btrim(nested ->> 'label')) not between 1 and 200
        or pg_catalog.jsonb_typeof(nested -> 'quantity') is distinct from 'number'
        or not ((nested ->> 'quantity') ~ '^[1-9][0-9]*$')
        or (nested ->> 'quantity')::numeric > 1000
        or pg_catalog.jsonb_typeof(nested -> 'allocation_type') is distinct from 'string'
        or (nested ->> 'allocation_type') not in ('none', 'single_choice', 'choice_allocation')
      then
        raise exception using errcode = '22023', message = 'ORDER_INVALID_CONFIGURATION', detail = 'invalid purchase_mode';
      end if;
    end if;

    nested := item -> 'selection';
    if nested is not null and nested <> 'null'::jsonb then
      if pg_catalog.jsonb_typeof(nested) is distinct from 'object'
        or exists (
          select 1 from pg_catalog.jsonb_object_keys(nested) as key_name
          where key_name not in ('choice_id', 'choice_name', 'group_label')
        )
        or pg_catalog.jsonb_typeof(nested -> 'choice_id') is distinct from 'string'
        or pg_catalog.char_length(pg_catalog.btrim(nested ->> 'choice_id')) not between 1 and 100
        or pg_catalog.jsonb_typeof(nested -> 'choice_name') is distinct from 'string'
        or pg_catalog.char_length(pg_catalog.btrim(nested ->> 'choice_name')) not between 1 and 200
        or pg_catalog.jsonb_typeof(nested -> 'group_label') is distinct from 'string'
        or pg_catalog.char_length(pg_catalog.btrim(nested ->> 'group_label')) not between 1 and 200
      then
        raise exception using errcode = '22023', message = 'ORDER_INVALID_CONFIGURATION', detail = 'invalid selection';
      end if;
    end if;

    if item ? 'allocation' and pg_catalog.jsonb_typeof(item -> 'allocation') is distinct from 'array' then
      raise exception using errcode = '22023', message = 'ORDER_INVALID_CONFIGURATION', detail = 'allocation must be an array';
    end if;
    if pg_catalog.jsonb_array_length(coalesce(item -> 'allocation', '[]'::jsonb)) > 100 then
      raise exception using errcode = '22023', message = 'ORDER_LIMIT_EXCEEDED', detail = 'too many allocations';
    end if;
    for nested in select value from pg_catalog.jsonb_array_elements(coalesce(item -> 'allocation', '[]'::jsonb))
    loop
      if pg_catalog.jsonb_typeof(nested) is distinct from 'object'
        or exists (
          select 1 from pg_catalog.jsonb_object_keys(nested) as key_name
          where key_name not in ('choice_id', 'choice_name', 'quantity')
        )
        or pg_catalog.jsonb_typeof(nested -> 'choice_id') is distinct from 'string'
        or pg_catalog.char_length(pg_catalog.btrim(nested ->> 'choice_id')) not between 1 and 100
        or pg_catalog.jsonb_typeof(nested -> 'choice_name') is distinct from 'string'
        or pg_catalog.char_length(pg_catalog.btrim(nested ->> 'choice_name')) not between 1 and 200
        or pg_catalog.jsonb_typeof(nested -> 'quantity') is distinct from 'number'
        or not ((nested ->> 'quantity') ~ '^[1-9][0-9]*$')
        or (nested ->> 'quantity')::numeric > 1000
      then
        raise exception using errcode = '22023', message = 'ORDER_INVALID_CONFIGURATION', detail = 'invalid allocation';
      end if;
    end loop;

    if item ? 'ingredients' and pg_catalog.jsonb_typeof(item -> 'ingredients') is distinct from 'array' then
      raise exception using errcode = '22023', message = 'ORDER_INVALID_CONFIGURATION', detail = 'ingredients must be an array';
    end if;
    if pg_catalog.jsonb_array_length(coalesce(item -> 'ingredients', '[]'::jsonb)) > 100 then
      raise exception using errcode = '22023', message = 'ORDER_LIMIT_EXCEEDED', detail = 'too many ingredients';
    end if;
    for nested in select value from pg_catalog.jsonb_array_elements(coalesce(item -> 'ingredients', '[]'::jsonb))
    loop
      if pg_catalog.jsonb_typeof(nested) is distinct from 'object'
        or exists (
          select 1 from pg_catalog.jsonb_object_keys(nested) as key_name
          where key_name not in ('id', 'name', 'quantity', 'default_quantity', 'extra_price_cents')
        )
        or pg_catalog.jsonb_typeof(nested -> 'id') is distinct from 'string'
        or pg_catalog.char_length(pg_catalog.btrim(nested ->> 'id')) not between 1 and 100
        or pg_catalog.jsonb_typeof(nested -> 'name') is distinct from 'string'
        or pg_catalog.char_length(pg_catalog.btrim(nested ->> 'name')) not between 1 and 200
        or pg_catalog.jsonb_typeof(nested -> 'quantity') is distinct from 'number'
        or not ((nested ->> 'quantity') ~ '^(0|[1-9][0-9]*)$')
        or (nested ->> 'quantity')::numeric > 1000
        or (nested ? 'default_quantity' and (
          pg_catalog.jsonb_typeof(nested -> 'default_quantity') is distinct from 'number'
          or not ((nested ->> 'default_quantity') ~ '^(0|[1-9][0-9]*)$')
          or (nested ->> 'default_quantity')::numeric > 1000
        ))
        or pg_catalog.jsonb_typeof(nested -> 'extra_price_cents') is distinct from 'number'
        or not ((nested ->> 'extra_price_cents') ~ '^(0|[1-9][0-9]*)$')
        or (nested ->> 'extra_price_cents')::numeric > 100000000
      then
        raise exception using errcode = '22023', message = 'ORDER_INVALID_CONFIGURATION', detail = 'invalid ingredient';
      end if;
    end loop;
  end loop;

  if estimated_total > 2147483647
    or estimated_total <> (payload ->> 'total_cents')::bigint
  then
    raise exception using errcode = '22023', message = 'ORDER_ESTIMATE_MISMATCH';
  end if;

  -- jsonb::text has deterministic key ordering; the digest therefore ignores
  -- JSON object key order and insignificant input whitespace.
  fingerprint := private.customer_order_sha256(payload::text);

  insert into private.customer_order_requests (scope, request_id, payload_fingerprint)
  values (scope_value, request_uuid, fingerprint)
  on conflict (scope, request_id) do nothing;

  select payload_fingerprint, customer_order_id
    into existing_fingerprint, reception_id
  from private.customer_order_requests
  where scope = scope_value and request_id = request_uuid
  for update;

  if existing_fingerprint <> fingerprint then
    raise exception using errcode = '23505', message = 'ORDER_IDEMPOTENCY_CONFLICT';
  end if;

  if reception_id is not null then
    return reception_id;
  end if;

  insert into public.customer_orders (
    customer_name,
    customer_phone,
    customer_email,
    customer_address,
    note,
    status,
    source,
    discount_cents,
    delivery_fee_cents,
    total_cents,
    items,
    sync_status,
    synced_at,
    sync_error,
    notified_at
  ) values (
    pg_catalog.btrim(payload ->> 'customer_name'),
    pg_catalog.btrim(payload ->> 'customer_phone'),
    nullif(pg_catalog.btrim(payload ->> 'customer_email'), ''),
    case when address = 'null'::jsonb then null else address end,
    nullif(pg_catalog.btrim(payload ->> 'note'), ''),
    'new',
    'savouretplus',
    0,
    0,
    (payload ->> 'total_cents')::integer,
    payload -> 'items',
    'pending',
    null,
    null,
    null
  ) returning id into reception_id;

  update private.customer_order_requests
  set customer_order_id = reception_id, completed_at = pg_catalog.now()
  where scope = scope_value and request_id = request_uuid;

  return reception_id;
end;
$$;

comment on function public.receive_customer_order(jsonb) is
  'Validates and atomically receives an unaccepted SavouretPlus order request. Monetary values are untrusted estimates; no authoritative pricing occurs here.';

revoke all on function public.receive_customer_order(jsonb) from public;
grant execute on function public.receive_customer_order(jsonb) to anon, authenticated;

revoke insert on public.customer_orders from anon, authenticated;
revoke insert (
  customer_name,
  customer_phone,
  customer_email,
  customer_address,
  note,
  status,
  source,
  discount_cents,
  delivery_fee_cents,
  total_cents,
  items
) on public.customer_orders from anon, authenticated;

drop policy if exists "Public customers can create orders"
  on public.customer_orders;

