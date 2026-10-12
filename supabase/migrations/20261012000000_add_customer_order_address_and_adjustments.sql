alter table public.customer_orders
  add column customer_address jsonb check (
    customer_address is null or jsonb_typeof(customer_address) = 'object'
  ),
  add column discount_cents integer not null default 0 check (discount_cents >= 0),
  add column delivery_fee_cents integer not null default 0 check (delivery_fee_cents >= 0);

grant insert (
  customer_address,
  discount_cents,
  delivery_fee_cents
) on public.customer_orders to anon, authenticated;
