-- Replays are resolved under the receipt lock before mutable Catalog validation.
create or replace function public.submit_quote_request(payload jsonb)
returns uuid
language plpgsql
security definer
set search_path = ''
as $$
declare
  request_uuid uuid;
  request_type text;
  expected_services jsonb;
  services jsonb;
  item jsonb;
  configuration jsonb;
  configured_value jsonb;
  offering record;
  fingerprint text;
  existing_fingerprint text;
  reception_id uuid;
  scope_value constant text := 'savouretplus.quote-request.v1';
begin
  if payload is null
    or pg_catalog.jsonb_typeof(payload) is distinct from 'object'
    or pg_catalog.octet_length(pg_catalog.convert_to(payload::text, 'UTF8')) > 131072
  then
    raise exception using errcode = '22023', message = 'QUOTE_INVALID_PAYLOAD';
  end if;

  if exists (
    select 1 from pg_catalog.jsonb_object_keys(payload) as key_name
    where key_name not in (
      'request_id', 'type', 'customer', 'requested_services', 'event_details', 'items'
    )
  ) then
    raise exception using errcode = '22023', message = 'QUOTE_INVALID_PAYLOAD';
  end if;

  if pg_catalog.jsonb_typeof(payload -> 'request_id') is distinct from 'string' then
    raise exception using errcode = '22023', message = 'QUOTE_INVALID_REQUEST_ID';
  end if;
  begin
    request_uuid := (payload ->> 'request_id')::uuid;
  exception when invalid_text_representation then
    raise exception using errcode = '22023', message = 'QUOTE_INVALID_REQUEST_ID';
  end;

  if payload ->> 'type' is distinct from 'QUOTE_REQUEST' then
    raise exception using errcode = '22023', message = 'QUOTE_INVALID_CUSTOMER';
  end if;

  fingerprint := private.customer_order_sha256(payload::text);

  insert into private.quote_request_receipts (scope, request_id, payload_fingerprint)
  values (scope_value, request_uuid, fingerprint)
  on conflict (scope, request_id) do nothing;

  select payload_fingerprint, quote_request_id
    into existing_fingerprint, reception_id
  from private.quote_request_receipts
  where scope = scope_value and request_id = request_uuid
  for update;

  if existing_fingerprint <> fingerprint then
    raise exception using errcode = '23505', message = 'QUOTE_IDEMPOTENCY_CONFLICT';
  end if;
  if reception_id is not null then
    return reception_id;
  end if;

  if payload ->> 'type' is distinct from 'QUOTE_REQUEST'
    or pg_catalog.jsonb_typeof(payload -> 'customer') is distinct from 'object'
    or pg_catalog.jsonb_typeof(payload #> '{customer,name}') is distinct from 'string'
    or pg_catalog.char_length(pg_catalog.btrim(payload #>> '{customer,name}')) not between 1 and 200
    or pg_catalog.jsonb_typeof(payload #> '{customer,phone}') is distinct from 'string'
    or pg_catalog.char_length(pg_catalog.btrim(payload #>> '{customer,phone}')) not between 1 and 50
  then
    raise exception using errcode = '22023', message = 'QUOTE_INVALID_CUSTOMER';
  end if;

  if exists (
    select 1 from pg_catalog.jsonb_object_keys(payload -> 'customer') as key_name
    where key_name not in ('name', 'phone', 'email', 'note')
  ) or (
    payload #> '{customer,email}' is not null
    and payload #> '{customer,email}' <> 'null'::jsonb
    and (
      pg_catalog.jsonb_typeof(payload #> '{customer,email}') is distinct from 'string'
      or pg_catalog.char_length(payload #>> '{customer,email}') > 254
    )
  ) or (
    payload #> '{customer,note}' is not null
    and payload #> '{customer,note}' <> 'null'::jsonb
    and (
      pg_catalog.jsonb_typeof(payload #> '{customer,note}') is distinct from 'string'
      or pg_catalog.char_length(payload #>> '{customer,note}') > 2000
    )
  ) then
    raise exception using errcode = '22023', message = 'QUOTE_INVALID_CUSTOMER';
  end if;

  if pg_catalog.jsonb_typeof(payload -> 'event_details') is distinct from 'object'
    or exists (
      select 1 from pg_catalog.jsonb_object_keys(payload -> 'event_details') as key_name
      where key_name not in (
        'request_type', 'event_type', 'event_date', 'event_time', 'event_address',
        'guest_count', 'budget', 'allergies', 'note'
      )
    )
  then
    raise exception using errcode = '22023', message = 'QUOTE_INVALID_EVENT';
  end if;

  request_type := payload #>> '{event_details,request_type}';
  expected_services := case request_type
    when 'traiteur' then '["traiteur"]'::jsonb
    when 'decoration' then '["decoration"]'::jsonb
    when 'organisation' then '["organisation"]'::jsonb
    when 'decoration-organisation' then '["decoration","organisation"]'::jsonb
    when 'traiteur-decoration' then '["traiteur","decoration"]'::jsonb
    when 'traiteur-decoration-organisation' then '["traiteur","decoration","organisation"]'::jsonb
    else null
  end;
  services := payload -> 'requested_services';

  if expected_services is null
    or pg_catalog.jsonb_typeof(services) is distinct from 'array'
    or pg_catalog.jsonb_array_length(
      case when pg_catalog.jsonb_typeof(services) = 'array' then services else '[]'::jsonb end
    ) <> pg_catalog.jsonb_array_length(expected_services)
    or not (services @> expected_services and expected_services @> services)
  then
    raise exception using errcode = '22023', message = 'QUOTE_INCOHERENT_SERVICES';
  end if;

  if pg_catalog.jsonb_typeof(payload #> '{event_details,event_type}') is distinct from 'string'
    or pg_catalog.char_length(pg_catalog.btrim(payload #>> '{event_details,event_type}')) not between 1 and 100
    or pg_catalog.jsonb_typeof(payload #> '{event_details,event_date}') is distinct from 'string'
    or not ((payload #>> '{event_details,event_date}') ~ '^\d{4}-\d{2}-\d{2}$')
    or pg_catalog.jsonb_typeof(payload #> '{event_details,event_address}') is distinct from 'string'
    or pg_catalog.char_length(pg_catalog.btrim(payload #>> '{event_details,event_address}')) not between 1 and 500
    or pg_catalog.jsonb_typeof(payload #> '{event_details,budget}') is distinct from 'string'
    or pg_catalog.char_length(pg_catalog.btrim(payload #>> '{event_details,budget}')) not between 1 and 100
  then
    raise exception using errcode = '22023', message = 'QUOTE_INVALID_EVENT';
  end if;
  begin
    perform (payload #>> '{event_details,event_date}')::date;
  exception when datetime_field_overflow then
    raise exception using errcode = '22023', message = 'QUOTE_INVALID_EVENT';
  end;

  if payload #> '{event_details,event_time}' is not null
    and payload #> '{event_details,event_time}' <> 'null'::jsonb
    and (
      pg_catalog.jsonb_typeof(payload #> '{event_details,event_time}') is distinct from 'string'
      or not ((payload #>> '{event_details,event_time}') ~ '^([01][0-9]|2[0-3]):[0-5][0-9]$')
    )
  then
    raise exception using errcode = '22023', message = 'QUOTE_INVALID_EVENT';
  end if;

  if (payload #> '{event_details,allergies}' is not null
      and payload #> '{event_details,allergies}' <> 'null'::jsonb
      and (
        pg_catalog.jsonb_typeof(payload #> '{event_details,allergies}') is distinct from 'string'
        or pg_catalog.char_length(payload #>> '{event_details,allergies}') > 2000
      ))
    or (payload #> '{event_details,note}' is not null
      and payload #> '{event_details,note}' <> 'null'::jsonb
      and (
        pg_catalog.jsonb_typeof(payload #> '{event_details,note}') is distinct from 'string'
        or pg_catalog.char_length(payload #>> '{event_details,note}') > 4000
      ))
  then
    raise exception using errcode = '22023', message = 'QUOTE_INVALID_EVENT';
  end if;

  if payload #> '{event_details,guest_count}' is not null
    and payload #> '{event_details,guest_count}' <> 'null'::jsonb
    and (
      pg_catalog.jsonb_typeof(payload #> '{event_details,guest_count}') is distinct from 'number'
      or not ((payload #>> '{event_details,guest_count}') ~ '^[1-9][0-9]*$')
      or (payload #>> '{event_details,guest_count}')::numeric > 100000
    )
  then
    raise exception using errcode = '22023', message = 'QUOTE_INVALID_EVENT';
  end if;

  if pg_catalog.jsonb_typeof(payload -> 'items') is distinct from 'array'
    or pg_catalog.jsonb_array_length(
      case when pg_catalog.jsonb_typeof(payload -> 'items') = 'array'
        then payload -> 'items' else '[]'::jsonb end
    ) > 100
  then
    raise exception using errcode = '22023', message = 'QUOTE_LIMIT_EXCEEDED';
  end if;

  for item in select value from pg_catalog.jsonb_array_elements(payload -> 'items')
  loop
    if pg_catalog.jsonb_typeof(item) is distinct from 'object'
      or exists (
        select 1 from pg_catalog.jsonb_object_keys(item) as key_name
        where key_name not in ('offering_id', 'name', 'requested_quantity', 'configuration', 'note')
      )
      or pg_catalog.jsonb_typeof(item -> 'offering_id') is distinct from 'string'
      or not ((item ->> 'offering_id') ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$')
      or pg_catalog.jsonb_typeof(item -> 'name') is distinct from 'string'
      or pg_catalog.char_length(pg_catalog.btrim(item ->> 'name')) not between 1 and 300
      or pg_catalog.jsonb_typeof(item -> 'requested_quantity') is distinct from 'number'
      or not ((item ->> 'requested_quantity') ~ '^[1-9][0-9]*$')
      or (item ->> 'requested_quantity')::numeric > 1000
      or pg_catalog.jsonb_typeof(item -> 'configuration') is distinct from 'object'
      or (item ? 'note' and item -> 'note' <> 'null'::jsonb and (
        pg_catalog.jsonb_typeof(item -> 'note') is distinct from 'string'
        or pg_catalog.char_length(item ->> 'note') > 2000
      ))
    then
      raise exception using errcode = '22023', message = 'QUOTE_INVALID_ITEM';
    end if;

    select id, slug, name, category, subcategory, product_type,
           purchase_modes, choice_group, ingredient_options
      into offering
    from public.published_catalog_products
    where id = item ->> 'offering_id' and is_available = true;

    if not found then
      raise exception using errcode = '22023', message = 'QUOTE_UNKNOWN_OFFERING';
    end if;

    configuration := item -> 'configuration';
    if offering.category not in ('tasting', 'decoration')
      or pg_catalog.jsonb_typeof(configuration -> 'catalog_slug') is distinct from 'string'
      or pg_catalog.jsonb_typeof(configuration -> 'category') is distinct from 'string'
      or item ->> 'name' <> offering.name
      or configuration ->> 'catalog_slug' <> offering.slug
      or configuration ->> 'category' <> offering.category
      or (configuration ? 'subcategory'
        and configuration -> 'subcategory' <> 'null'::jsonb
        and configuration ->> 'subcategory' is distinct from offering.subcategory)
      or (configuration ? 'product_type'
        and configuration ->> 'product_type' is distinct from offering.product_type)
      or exists (
        select 1 from pg_catalog.jsonb_object_keys(configuration) as key_name
        where key_name not in (
          'catalog_slug', 'category', 'subcategory', 'product_type', 'purchase_mode',
          'selection', 'allocation', 'ingredients'
        )
      )
    then
      raise exception using errcode = '22023', message = 'QUOTE_INVALID_CONFIGURATION';
    end if;

    if offering.category = 'tasting' and not (services @> '["traiteur"]'::jsonb) then
      raise exception using errcode = '22023', message = 'QUOTE_INCOHERENT_SERVICES';
    elsif offering.category = 'decoration' and not (services @> '["decoration"]'::jsonb) then
      raise exception using errcode = '22023', message = 'QUOTE_INCOHERENT_SERVICES';
    end if;

    configured_value := configuration -> 'purchase_mode';
    if configured_value is not null and configured_value <> 'null'::jsonb and (
      pg_catalog.jsonb_typeof(configured_value) is distinct from 'object'
      or exists (
        select 1 from pg_catalog.jsonb_object_keys(
          case when pg_catalog.jsonb_typeof(configured_value) = 'object'
            then configured_value else '{}'::jsonb end
        ) as key_name
        where key_name not in ('id', 'label', 'quantity', 'allocation_type')
      )
      or not exists (
        select 1
        from pg_catalog.jsonb_array_elements(offering.purchase_modes) as mode
        where mode ->> 'id' = configured_value ->> 'id'
          and mode ->> 'quantity' = configured_value ->> 'quantity'
          and mode ->> 'allocation_type' = configured_value ->> 'allocation_type'
      )
    ) then
      raise exception using errcode = '22023', message = 'QUOTE_INVALID_CONFIGURATION';
    end if;

    configured_value := configuration -> 'selection';
    if configured_value is not null and configured_value <> 'null'::jsonb and (
      pg_catalog.jsonb_typeof(configured_value) is distinct from 'object'
      or exists (
        select 1 from pg_catalog.jsonb_object_keys(
          case when pg_catalog.jsonb_typeof(configured_value) = 'object'
            then configured_value else '{}'::jsonb end
        ) as key_name
        where key_name not in ('choice_id', 'choice_name', 'group_label')
      )
      or not exists (
        select 1
        from pg_catalog.jsonb_array_elements(coalesce(offering.choice_group -> 'options', '[]'::jsonb)) as choice
        where choice ->> 'id' = configured_value ->> 'choice_id'
      )
    ) then
      raise exception using errcode = '22023', message = 'QUOTE_INVALID_CONFIGURATION';
    end if;

    if configuration ? 'allocation' then
      if pg_catalog.jsonb_typeof(configuration -> 'allocation') is distinct from 'array'
        or pg_catalog.jsonb_array_length(
          case when pg_catalog.jsonb_typeof(configuration -> 'allocation') = 'array'
            then configuration -> 'allocation' else '[]'::jsonb end
        ) > 100
        or exists (
          select 1 from pg_catalog.jsonb_array_elements(
            case when pg_catalog.jsonb_typeof(configuration -> 'allocation') = 'array'
              then configuration -> 'allocation' else '[]'::jsonb end
          ) as allocation
          where pg_catalog.jsonb_typeof(allocation) is distinct from 'object'
            or exists (
              select 1 from pg_catalog.jsonb_object_keys(
                case when pg_catalog.jsonb_typeof(allocation) = 'object'
                  then allocation else '{}'::jsonb end
              ) as key_name
              where key_name not in ('choice_id', 'choice_name', 'quantity')
            )
            or not ((allocation ->> 'quantity') ~ '^[1-9][0-9]*$')
            or (allocation ->> 'quantity')::numeric > 1000
            or not exists (
              select 1
              from pg_catalog.jsonb_array_elements(coalesce(offering.choice_group -> 'options', '[]'::jsonb)) as choice
              where choice ->> 'id' = allocation ->> 'choice_id'
            )
        )
      then
        raise exception using errcode = '22023', message = 'QUOTE_INVALID_CONFIGURATION';
      end if;
    end if;

    if configuration ? 'ingredients' then
      if pg_catalog.jsonb_typeof(configuration -> 'ingredients') is distinct from 'array'
        or pg_catalog.jsonb_array_length(
          case when pg_catalog.jsonb_typeof(configuration -> 'ingredients') = 'array'
            then configuration -> 'ingredients' else '[]'::jsonb end
        ) > 100
        or exists (
          select 1 from pg_catalog.jsonb_array_elements(
            case when pg_catalog.jsonb_typeof(configuration -> 'ingredients') = 'array'
              then configuration -> 'ingredients' else '[]'::jsonb end
          ) as ingredient
          where pg_catalog.jsonb_typeof(ingredient) is distinct from 'object'
            or exists (
              select 1 from pg_catalog.jsonb_object_keys(
                case when pg_catalog.jsonb_typeof(ingredient) = 'object'
                  then ingredient else '{}'::jsonb end
              ) as key_name
              where key_name not in ('id', 'name', 'quantity', 'default_quantity', 'extra_price_cents')
            )
            or not ((ingredient ->> 'quantity') ~ '^(0|[1-9][0-9]*)$')
            or (ingredient ->> 'quantity')::numeric > 1000
            or not exists (
              select 1 from pg_catalog.jsonb_array_elements(offering.ingredient_options) as option
              where option ->> 'id' = ingredient ->> 'id'
                and (ingredient ->> 'quantity')::integer between
                  (option ->> 'min_quantity')::integer and (option ->> 'max_quantity')::integer
            )
        )
      then
        raise exception using errcode = '22023', message = 'QUOTE_INVALID_CONFIGURATION';
      end if;
    end if;
  end loop;

  insert into public.quote_requests (payload, status, source)
  values (payload, 'new', 'savouretplus')
  returning id into reception_id;

  update private.quote_request_receipts
  set quote_request_id = reception_id, completed_at = pg_catalog.now()
  where scope = scope_value and request_id = request_uuid;

  return reception_id;
end;
$$;

comment on function public.submit_quote_request(jsonb) is
  'Validates and atomically receives an idempotent event quote request containing published tasting and/or decoration offerings.';

revoke all on function public.submit_quote_request(jsonb) from public;
grant execute on function public.submit_quote_request(jsonb) to anon, authenticated;

