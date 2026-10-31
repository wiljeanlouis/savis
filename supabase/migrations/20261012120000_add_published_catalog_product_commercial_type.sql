alter table public.published_catalog_products
add column commercial_type text not null default 'goods'
check (commercial_type in ('goods', 'service'));
