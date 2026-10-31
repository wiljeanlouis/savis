alter table public.customer_orders
  add column sync_status text not null default 'pending',
  add column synced_at timestamptz,
  add column sync_error text,
  add column notified_at timestamptz;

alter table public.customer_orders
  add constraint customer_orders_sync_status_check
  check (sync_status in ('pending', 'synced', 'failed'));

create index customer_orders_pending_sync_idx
  on public.customer_orders(created_at)
  where sync_status = 'pending';

grant select, update on public.customer_orders to service_role;
