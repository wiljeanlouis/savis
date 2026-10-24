#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL must point to a disposable migrated Supabase PostgreSQL database" >&2
  exit 2
fi

request_id="95000000-0000-4000-8000-000000000001"
offering_id="94000000-0000-4000-8000-000000000001"

psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 \
  -v offering_id="$offering_id" \
  -c "insert into public.published_catalog_products (id, slug, name, category, subcategory, description, commercial_type, product_type, purchase_modes, choice_group, ingredient_options, image_url, is_available) values (:'offering_id', 'concurrent-arch-test', 'Arche concurrence', 'decoration', 'decorative-arch', '', 'service', 'standard', '[]', null, '[]', '/test.jpg', true) on conflict (id) do update set is_available = true"

payload="{\"request_id\":\"${request_id}\",\"type\":\"QUOTE_REQUEST\",\"customer\":{\"name\":\"Concurrent test\",\"phone\":\"+15145550199\",\"email\":null},\"requested_services\":[\"decoration\"],\"event_details\":{\"request_type\":\"decoration\",\"event_type\":\"Mariage\",\"event_date\":\"2027-06-12\",\"event_time\":null,\"event_address\":\"Montréal\",\"guest_count\":null,\"budget\":\"À discuter\",\"allergies\":null,\"note\":null},\"items\":[{\"offering_id\":\"${offering_id}\",\"name\":\"Arche concurrence\",\"requested_quantity\":1,\"configuration\":{\"catalog_slug\":\"concurrent-arch-test\",\"category\":\"decoration\",\"subcategory\":\"decorative-arch\"},\"note\":null}]}"
tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -At \
  -v payload="$payload" \
  -c "select public.submit_quote_request(:'payload'::jsonb)" >"$tmp_dir/first" &
first_pid=$!
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -At \
  -v payload="$payload" \
  -c "select public.submit_quote_request(:'payload'::jsonb)" >"$tmp_dir/second" &
second_pid=$!

wait "$first_pid"
wait "$second_pid"

first_id="$(tr -d '[:space:]' <"$tmp_dir/first")"
second_id="$(tr -d '[:space:]' <"$tmp_dir/second")"

if [[ -z "$first_id" || "$first_id" != "$second_id" ]]; then
  echo "concurrent calls did not return the same reception id" >&2
  exit 1
fi

row_count="$(psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -At \
  -v request_id="$request_id" \
  -c "select count(*) from private.quote_request_receipts r join public.quote_requests q on q.id = r.quote_request_id where r.scope = 'savouretplus.quote-request.v1' and r.request_id = :'request_id'::uuid")"

if [[ "$row_count" != "1" ]]; then
  echo "expected one linked quote request after concurrent calls, got $row_count" >&2
  exit 1
fi

echo "ok - concurrent calls returned $first_id and created one quote request"
