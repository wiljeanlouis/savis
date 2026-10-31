begin;

create extension if not exists pgtap with schema extensions;

select extensions.plan(22);

insert into public.published_catalog_products (
  id, slug, name, category, subcategory, description, commercial_type, product_type,
  purchase_modes, choice_group, ingredient_options, image_url, is_available
) values
(
  '91000000-0000-4000-8000-000000000001', 'arche-test', 'Arche décorative',
  'decoration', 'decorative-arch', '', 'service', 'standard', '[]', null, '[]', '/arche.jpg', true
),
(
  '91000000-0000-4000-8000-000000000002', 'centre-test', 'Centre de table',
  'decoration', 'centerpiece', '', 'goods', 'standard', '[]', null, '[]', '/centre.jpg', true
),
(
  '91000000-0000-4000-8000-000000000003', 'pate-test', 'Pâté au four',
  'tasting', null, '', 'goods', 'single_choice_bundle',
  '[{"id":"dozen","label":"Douzaine","quantity":12,"price_cents":3000,"allocation_type":"choice_allocation"}]',
  '{"label":"Farce","required":true,"options":[{"id":"chicken","name":"Poulet"},{"id":"beef","name":"Boeuf"}]}',
  '[]', '/pate.jpg', true
),
(
  '91000000-0000-4000-8000-000000000004', 'griot-test', 'Plateau de griot',
  'tasting', null, '', 'goods', 'standard', '[]', null, '[]', '/griot.jpg', true
),
(
  '91000000-0000-4000-8000-000000000005', 'cache-test', 'Offre non publiée',
  'decoration', 'decorative-arch', '', 'service', 'standard', '[]', null, '[]', '/cache.jpg', false
)
on conflict (id) do update set is_available = excluded.is_available;

create or replace function pg_temp.mixed_quote_payload(id uuid)
returns jsonb
language sql
as $$
  select jsonb_build_object(
    'request_id', id::text,
    'type', 'QUOTE_REQUEST',
    'customer', jsonb_build_object(
      'name', 'Marie Tremblay', 'phone', '+15145551234', 'email', 'marie@example.com'
    ),
    'requested_services', jsonb_build_array('traiteur', 'decoration'),
    'event_details', jsonb_build_object(
      'request_type', 'traiteur-decoration', 'event_type', 'Mariage',
      'event_date', '2027-06-12', 'event_time', '18:30',
      'event_address', 'Montréal', 'guest_count', 80,
      'budget', '1000$ et plus', 'allergies', 'Noix', 'note', null
    ),
    'items', jsonb_build_array(
      jsonb_build_object(
        'offering_id', '91000000-0000-4000-8000-000000000001',
        'name', 'Arche décorative', 'requested_quantity', 1,
        'configuration', jsonb_build_object(
          'catalog_slug', 'arche-test', 'category', 'decoration',
          'subcategory', 'decorative-arch', 'product_type', 'standard',
          'purchase_mode', null, 'selection', null,
          'allocation', jsonb_build_array(), 'ingredients', jsonb_build_array()
        ), 'note', 'Fleurs blanches'
      ),
      jsonb_build_object(
        'offering_id', '91000000-0000-4000-8000-000000000002',
        'name', 'Centre de table', 'requested_quantity', 6,
        'configuration', jsonb_build_object(
          'catalog_slug', 'centre-test', 'category', 'decoration',
          'product_type', 'standard', 'allocation', jsonb_build_array(),
          'ingredients', jsonb_build_array()
        ), 'note', null
      ),
      jsonb_build_object(
        'offering_id', '91000000-0000-4000-8000-000000000003',
        'name', 'Pâté au four', 'requested_quantity', 4,
        'configuration', jsonb_build_object(
          'catalog_slug', 'pate-test', 'category', 'tasting',
          'product_type', 'single_choice_bundle',
          'purchase_mode', jsonb_build_object(
            'id', 'dozen', 'label', 'Douzaine', 'quantity', 12,
            'allocation_type', 'choice_allocation'
          ),
          'selection', null,
          'allocation', jsonb_build_array(
            jsonb_build_object('choice_id', 'chicken', 'choice_name', 'Poulet', 'quantity', 12)
          ),
          'ingredients', jsonb_build_array()
        ), 'note', 'Poulet'
      ),
      jsonb_build_object(
        'offering_id', '91000000-0000-4000-8000-000000000004',
        'name', 'Plateau de griot', 'requested_quantity', 2,
        'configuration', jsonb_build_object(
          'catalog_slug', 'griot-test', 'category', 'tasting',
          'product_type', 'standard', 'allocation', jsonb_build_array(),
          'ingredients', jsonb_build_array()
        ), 'note', 'Sauce à part'
      )
    )
  );
$$;

create or replace function pg_temp.tasting_quote_payload(id uuid)
returns jsonb
language sql
as $$
  select jsonb_set(
    jsonb_set(
      jsonb_set(
        pg_temp.mixed_quote_payload(id),
        '{requested_services}', '["traiteur"]'::jsonb
      ),
      '{event_details,request_type}', '"traiteur"'::jsonb
    ),
    '{items}', jsonb_build_array(
      pg_temp.mixed_quote_payload(id) #> '{items,2}',
      pg_temp.mixed_quote_payload(id) #> '{items,3}'
    )
  );
$$;

create or replace function pg_temp.decoration_quote_payload(id uuid)
returns jsonb
language sql
as $$
  select jsonb_set(
    jsonb_set(
      jsonb_set(
        pg_temp.mixed_quote_payload(id),
        '{requested_services}', '["decoration"]'::jsonb
      ),
      '{event_details,request_type}', '"decoration"'::jsonb
    ),
    '{items}', jsonb_build_array(
      pg_temp.mixed_quote_payload(id) #> '{items,0}',
      pg_temp.mixed_quote_payload(id) #> '{items,1}'
    )
  );
$$;

select extensions.has_function(
  'public', 'submit_quote_request', array['jsonb'], 'the existing quote RPC remains the public boundary'
);
select extensions.ok(
  has_function_privilege('anon', 'public.submit_quote_request(jsonb)', 'EXECUTE'),
  'anon can execute the quote RPC'
);
select extensions.ok(
  not has_table_privilege('anon', 'public.quote_requests', 'SELECT'),
  'anon cannot read quote request PII'
);
select extensions.ok(
  not has_table_privilege('anon', 'public.quote_requests', 'INSERT'),
  'anon cannot bypass the quote RPC'
);

select extensions.lives_ok(
  $$select public.submit_quote_request(
    pg_temp.tasting_quote_payload('92000000-0000-4000-8000-000000000009')
  )$$,
  'the existing tasting-only quote flow remains accepted'
);
select extensions.lives_ok(
  $$select public.submit_quote_request(
    pg_temp.decoration_quote_payload('92000000-0000-4000-8000-000000000010')
  )$$,
  'the existing decoration-only quote flow remains accepted'
);

select extensions.ok(
  public.submit_quote_request(
    pg_temp.mixed_quote_payload('92000000-0000-4000-8000-000000000001')
  ) is not null,
  'one mixed catering and decoration request is accepted without organisation'
);
select extensions.is(
  (select jsonb_array_length(payload -> 'items') from public.quote_requests
   where payload ->> 'request_id' = '92000000-0000-4000-8000-000000000001'),
  4,
  'all lines from both categories are stored in one request'
);
select extensions.ok(
  (select
    payload -> 'requested_services' @> '["traiteur","decoration"]'::jsonb
    and not (payload -> 'requested_services' @> '["organisation"]'::jsonb)
    and payload #>> '{items,2,configuration,purchase_mode,id}' = 'dozen'
    and payload #>> '{items,2,configuration,allocation,0,choice_id}' = 'chicken'
    and payload #>> '{items,1,requested_quantity}' = '6'
   from public.quote_requests
   where payload ->> 'request_id' = '92000000-0000-4000-8000-000000000001'),
  'service choice, quantities, notes and tasting configuration are preserved'
);
select extensions.is(
  public.submit_quote_request(
    pg_temp.mixed_quote_payload('92000000-0000-4000-8000-000000000001')
  ),
  (select quote_request_id from private.quote_request_receipts
   where request_id = '92000000-0000-4000-8000-000000000001'),
  'an identical replay returns the same reference'
);
select extensions.is(
  (select count(*)::bigint from public.quote_requests
   where payload ->> 'request_id' = '92000000-0000-4000-8000-000000000001'),
  1::bigint,
  'an identical replay creates no duplicate'
);
select extensions.throws_ok(
  $$select public.submit_quote_request(
    jsonb_set(
      pg_temp.mixed_quote_payload('92000000-0000-4000-8000-000000000001'),
      '{customer,name}', '"Autre cliente"'
    )
  )$$,
  '23505', 'QUOTE_IDEMPOTENCY_CONFLICT', 'a contradictory replay conflicts'
);
select extensions.throws_ok(
  $$select public.submit_quote_request(
    jsonb_set(
      pg_temp.mixed_quote_payload('92000000-0000-4000-8000-000000000002'),
      '{items,0,requested_quantity}', '0'
    )
  )$$,
  '22023', 'QUOTE_INVALID_ITEM', 'an invalid quantity is rejected'
);
select extensions.throws_ok(
  $$select public.submit_quote_request(
    jsonb_set(
      pg_temp.mixed_quote_payload('92000000-0000-4000-8000-000000000003'),
      '{items,0,offering_id}', '"99900000-0000-4000-8000-000000000001"'
    )
  )$$,
  '22023', 'QUOTE_UNKNOWN_OFFERING', 'an unknown offering is rejected'
);
select extensions.throws_ok(
  $$select public.submit_quote_request(
    jsonb_set(
      jsonb_set(
        pg_temp.mixed_quote_payload('92000000-0000-4000-8000-000000000004'),
        '{items,0,offering_id}', '"91000000-0000-4000-8000-000000000005"'
      ), '{items,0,name}', '"Offre non publiée"'
    )
  )$$,
  '22023', 'QUOTE_UNKNOWN_OFFERING', 'an unpublished offering is rejected'
);
select extensions.throws_ok(
  $$select public.submit_quote_request(
    jsonb_set(
      pg_temp.mixed_quote_payload('92000000-0000-4000-8000-000000000005'),
      '{requested_services}', '["decoration"]'
    )
  )$$,
  '22023', 'QUOTE_INCOHERENT_SERVICES', 'incoherent requested services are rejected'
);
select extensions.throws_ok(
  $$select public.submit_quote_request(
    jsonb_set(
      pg_temp.mixed_quote_payload('92000000-0000-4000-8000-000000000006'),
      '{items,2,configuration,purchase_mode,id}', '"unknown"'
    )
  )$$,
  '22023', 'QUOTE_INVALID_CONFIGURATION', 'an unauthorized tasting configuration is rejected'
);

create function pg_temp.reject_quote_request()
returns trigger language plpgsql as $$
begin
  if new.payload #>> '{event_details,note}' = 'Force rollback' then
    raise exception using errcode = 'P0001', message = 'TEST_QUOTE_INSERT_FAILURE';
  end if;
  return new;
end;
$$;
create trigger quote_request_rollback_test
before insert on public.quote_requests
for each row execute function pg_temp.reject_quote_request();

select extensions.throws_ok(
  $$select public.submit_quote_request(
    jsonb_set(
      pg_temp.mixed_quote_payload('92000000-0000-4000-8000-000000000007'),
      '{event_details,note}', '"Force rollback"'
    )
  )$$,
  'P0001', 'TEST_QUOTE_INSERT_FAILURE', 'a line persistence failure aborts reception'
);
select extensions.is(
  (select count(*)::bigint from private.quote_request_receipts
   where request_id = '92000000-0000-4000-8000-000000000007'),
  0::bigint,
  'the idempotency reservation rolls back on failure'
);
select extensions.is(
  (select count(*)::bigint from public.quote_requests
   where payload ->> 'request_id' = '92000000-0000-4000-8000-000000000007'),
  0::bigint,
  'no partial quote request remains after failure'
);
drop trigger quote_request_rollback_test on public.quote_requests;

select pg_catalog.set_config(
  'savis_test.anon_quote_payload',
  pg_temp.mixed_quote_payload('92000000-0000-4000-8000-000000000008')::text,
  false
);
set local role anon;
select extensions.lives_ok(
  $$select public.submit_quote_request(
    pg_catalog.current_setting('savis_test.anon_quote_payload')::jsonb
  )$$,
  'anon can submit a valid mixed request through SECURITY DEFINER'
);
reset role;

select extensions.is(
  (select count(*)::bigint from public.quote_requests
   where payload ->> 'request_id' in (
     '92000000-0000-4000-8000-000000000001',
     '92000000-0000-4000-8000-000000000008'
   )),
  2::bigint,
  'only the two valid logical requests were persisted'
);

select * from extensions.finish();
rollback;

