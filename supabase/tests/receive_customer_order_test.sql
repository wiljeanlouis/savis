begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(33);

create or replace function pg_temp.valid_order_payload(id uuid)
returns jsonb
language sql
immutable
as $$
  select jsonb_build_object(
    'request_id', id::text,
    'customer_name', 'Ada Lovelace',
    'customer_phone', '514-555-0100',
    'customer_email', 'ada@example.com',
    'customer_address', jsonb_build_object(
      'line1', '1 rue Test', 'city', 'Montréal',
      'province', 'QC', 'postal_code', 'H0H 0H0'
    ),
    'note', 'Demande de test',
    'total_cents', 2850,
    'items', jsonb_build_array(jsonb_build_object(
      'key', 'cookie:unit:none::sprinkles:2',
      'product_id', '20000000-0000-4000-8000-000000000002',
      'name', 'Biscuit personnalisé',
      'category', 'tasting',
      'product_type', 'ingredient_customization',
      'image_url', '/cookie.jpg',
      'quantity', 3,
      'base_price_cents', 800,
      'unit_price_cents', 950,
      'purchase_mode', jsonb_build_object(
        'id', 'unit', 'label', 'À l''unité', 'quantity', 1, 'allocation_type', 'none'
      ),
      'selection', null,
      'allocation', jsonb_build_array(),
      'ingredients', jsonb_build_array(jsonb_build_object(
        'id', 'sprinkles', 'name', 'Confettis', 'quantity', 2,
        'default_quantity', 1, 'extra_price_cents', 150
      ))
    ))
  );
$$;

select extensions.has_function(
  'public', 'receive_customer_order', array['jsonb'],
  'the public ingestion RPC exists'
);
select extensions.ok(
  has_function_privilege('anon', 'public.receive_customer_order(jsonb)', 'EXECUTE'),
  'anon can execute only the ingestion boundary'
);
select extensions.ok(
  not has_table_privilege('anon', 'public.customer_orders', 'SELECT'),
  'anon cannot read customer PII from the inbox'
);
select extensions.ok(
  not has_table_privilege('anon', 'public.customer_orders', 'INSERT'),
  'anon cannot insert directly into the inbox'
);
select extensions.ok(
  not has_table_privilege('authenticated', 'public.customer_orders', 'INSERT'),
  'authenticated clients cannot insert directly into the inbox'
);
select extensions.ok(
  not has_schema_privilege('anon', 'private', 'USAGE'),
  'anon cannot access the private idempotency ledger'
);

select extensions.ok(
  public.receive_customer_order(
    pg_temp.valid_order_payload('11000000-0000-4000-8000-000000000001')
  ) is not null,
  'a valid request returns a reception UUID'
);
select extensions.is(
  (select count(*)::bigint from public.customer_orders
   where customer_email = 'ada@example.com' and note = 'Demande de test'),
  1::bigint,
  'a valid request creates one inbox row'
);
select extensions.is(
  (select status || ':' || source || ':' || sync_status
   from public.customer_orders
   where customer_email = 'ada@example.com' and note = 'Demande de test'),
  'new:savouretplus:pending',
  'server-managed workflow fields are forced'
);
select extensions.is(
  (select discount_cents + delivery_fee_cents
   from public.customer_orders
   where customer_email = 'ada@example.com' and note = 'Demande de test'),
  0,
  'discount and delivery fee are forced to zero'
);
select extensions.ok(
  (select
      items -> 0 ->> 'product_id' = '20000000-0000-4000-8000-000000000002'
      and items -> 0 ->> 'product_type' = 'ingredient_customization'
      and items -> 0 -> 'ingredients' -> 0 ->> 'default_quantity' = '1'
      and total_cents = 2850
    from public.customer_orders
    where customer_email = 'ada@example.com' and note = 'Demande de test'),
  'the persisted snapshot has every field required by the SAVIS mapper'
);

select extensions.is(
  public.receive_customer_order(
    jsonb_build_object(
      'items', pg_temp.valid_order_payload('11000000-0000-4000-8000-000000000001') -> 'items',
      'total_cents', 2850,
      'note', 'Demande de test',
      'customer_address', pg_temp.valid_order_payload('11000000-0000-4000-8000-000000000001') -> 'customer_address',
      'customer_email', 'ada@example.com',
      'customer_phone', '514-555-0100',
      'customer_name', 'Ada Lovelace',
      'request_id', '11000000-0000-4000-8000-000000000001'
    )
  ),
  (select customer_order_id from private.customer_order_requests
   where scope = 'savouretplus.customer-order.v1'
     and request_id = '11000000-0000-4000-8000-000000000001'),
  'a canonical replay with reordered JSON keys returns the same reference'
);
select extensions.is(
  (select count(*)::bigint from private.customer_order_requests
   where scope = 'savouretplus.customer-order.v1'
     and request_id = '11000000-0000-4000-8000-000000000001'),
  1::bigint,
  'a replay keeps one ledger row'
);
select extensions.throws_ok(
  $$select public.receive_customer_order(
      jsonb_set(
        jsonb_set(pg_temp.valid_order_payload('11000000-0000-4000-8000-000000000001'), '{items,0,quantity}', '2'),
        '{total_cents}', '1900'
      )
    )$$,
  '23505', 'ORDER_IDEMPOTENCY_CONFLICT',
  'the same request_id with different valid content conflicts'
);
select extensions.is(
  (select count(*)::bigint from public.customer_orders
   where customer_email = 'ada@example.com' and note = 'Demande de test'),
  1::bigint,
  'a contradictory replay does not create another order'
);

select extensions.throws_ok(
  $$select public.receive_customer_order('[]'::jsonb)$$,
  '22023', 'ORDER_INVALID_PAYLOAD', 'a non-object payload is rejected'
);
select extensions.throws_ok(
  $$select public.receive_customer_order(
      pg_temp.valid_order_payload('12000000-0000-4000-8000-000000000001') - 'customer_name'
    )$$,
  '22023', 'ORDER_INVALID_PAYLOAD', 'a required customer field is enforced'
);
select extensions.throws_ok(
  $$select public.receive_customer_order(
      jsonb_set(pg_temp.valid_order_payload('12000000-0000-4000-8000-000000000002'), '{request_id}', '"not-a-uuid"')
    )$$,
  '22023', 'ORDER_INVALID_REQUEST_ID', 'an invalid request UUID is rejected'
);
select extensions.throws_ok(
  $$select public.receive_customer_order(
      jsonb_set(pg_temp.valid_order_payload('12000000-0000-4000-8000-000000000003'), '{items,0,product_id}', '"bad"')
    )$$,
  '22023', 'ORDER_INVALID_PRODUCT_ID', 'an invalid product UUID is rejected'
);
select extensions.throws_ok(
  $$select public.receive_customer_order(
      jsonb_set(pg_temp.valid_order_payload('12000000-0000-4000-8000-000000000004'), '{items,0,quantity}', '0')
    )$$,
  '22023', 'ORDER_LIMIT_EXCEEDED', 'zero item quantity is rejected'
);
select extensions.throws_ok(
  $$select public.receive_customer_order(
      jsonb_set(
        pg_temp.valid_order_payload('12000000-0000-4000-8000-000000000005'),
        '{items}',
        (select jsonb_agg(pg_temp.valid_order_payload('12000000-0000-4000-8000-000000000005') -> 'items' -> 0)
         from generate_series(1, 101))
      )
    )$$,
  '22023', 'ORDER_LIMIT_EXCEEDED', 'more than 100 items is rejected'
);
select extensions.throws_ok(
  $$select public.receive_customer_order(
      jsonb_set(pg_temp.valid_order_payload('12000000-0000-4000-8000-000000000006'), '{items,0,category}', '"unknown"')
    )$$,
  '22023', 'ORDER_INVALID_CATEGORY_OR_TYPE', 'an unknown category is rejected'
);
select extensions.throws_ok(
  $$select public.receive_customer_order(
      jsonb_set(pg_temp.valid_order_payload('12000000-0000-4000-8000-000000000007'), '{items,0,purchase_mode,allocation_type}', '"other"')
    )$$,
  '22023', 'ORDER_INVALID_CONFIGURATION', 'an invalid configuration shape is rejected'
);
select extensions.throws_ok(
  $$select public.receive_customer_order(
      pg_temp.valid_order_payload('12000000-0000-4000-8000-000000000008') || '{"status":"synced"}'::jsonb
    )$$,
  '22023', 'ORDER_INVALID_PAYLOAD', 'a forged internal field is rejected'
);
select extensions.is(
  (select count(*)::bigint from private.customer_order_requests
   where request_id = '12000000-0000-4000-8000-000000000008'),
  0::bigint,
  'a forged request leaves no idempotency record'
);
select extensions.throws_ok(
  $$select public.receive_customer_order(
      jsonb_set(pg_temp.valid_order_payload('12000000-0000-4000-8000-000000000009'), '{total_cents}', '2849')
    )$$,
  '22023', 'ORDER_ESTIMATE_MISMATCH', 'an inconsistent estimated total is rejected'
);

create function pg_temp.reject_test_order()
returns trigger
language plpgsql
as $$
begin
  if new.note = 'Force rollback' then
    raise exception using errcode = 'P0001', message = 'TEST_INSERT_FAILURE';
  end if;
  return new;
end;
$$;
create trigger receive_order_rollback_test
before insert on public.customer_orders
for each row execute function pg_temp.reject_test_order();

select extensions.throws_ok(
  $$select public.receive_customer_order(
      jsonb_set(pg_temp.valid_order_payload('13000000-0000-4000-8000-000000000001'), '{note}', '"Force rollback"')
    )$$,
  'P0001', 'TEST_INSERT_FAILURE', 'an insert failure escapes the RPC'
);
select extensions.is(
  (select count(*)::bigint from private.customer_order_requests
   where request_id = '13000000-0000-4000-8000-000000000001'),
  0::bigint,
  'the idempotency reservation rolls back with a failed insert'
);
select extensions.is(
  (select count(*)::bigint from public.customer_orders where note = 'Force rollback'),
  0::bigint,
  'the order insert is atomic'
);
drop trigger receive_order_rollback_test on public.customer_orders;

set local role anon;
select extensions.lives_ok(
  $$select public.receive_customer_order(
    '{
      "request_id":"14000000-0000-4000-8000-000000000001",
      "customer_name":"Client anonyme",
      "customer_phone":"514-555-0101",
      "total_cents":1200,
      "items":[{
        "product_id":"20000000-0000-4000-8000-000000000003",
        "name":"Service",
        "category":"decoration",
        "product_type":"standard",
        "quantity":1,
        "unit_price_cents":1200,
        "allocation":[],
        "ingredients":[]
      }]
    }'::jsonb
  )$$,
  'anon can submit through the SECURITY DEFINER RPC'
);
reset role;

select extensions.is(
  (select status || ':' || source || ':' || discount_cents || ':' || delivery_fee_cents
   from public.customer_orders where customer_name = 'Client anonyme'),
  'new:savouretplus:0:0',
  'an anonymous submission cannot choose internal values'
);
select extensions.is(
  (select count(*)::bigint from public.customer_orders
   where customer_name in ('Ada Lovelace', 'Client anonyme')),
  2::bigint,
  'the suite produced only the two expected orders'
);
select extensions.ok(
  (select completed_at is not null and customer_order_id is not null
   from private.customer_order_requests
   where request_id = '14000000-0000-4000-8000-000000000001'),
  'the ledger links the anonymous request to its completed order'
);

select * from extensions.finish();

rollback;

