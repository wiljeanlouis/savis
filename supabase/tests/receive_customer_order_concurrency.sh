#!/usr/bin/env bash
set -euo pipefail

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL must point to a disposable migrated Supabase PostgreSQL database" >&2
  exit 2
fi

request_id="15000000-0000-4000-8000-000000000001"
payload="{\"request_id\":\"${request_id}\",\"customer_name\":\"Concurrent test\",\"customer_phone\":\"514-555-0199\",\"total_cents\":100,\"items\":[{\"product_id\":\"25000000-0000-4000-8000-000000000001\",\"name\":\"Test\",\"category\":\"tasting\",\"product_type\":\"standard\",\"quantity\":1,\"unit_price_cents\":100,\"allocation\":[],\"ingredients\":[]}]}"
tmp_dir="$(mktemp -d)"
trap 'rm -rf "$tmp_dir"' EXIT

psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -At \
  -v payload="$payload" \
  -c "select public.receive_customer_order(:'payload'::jsonb)" >"$tmp_dir/first" &
first_pid=$!
psql "$DATABASE_URL" -X -v ON_ERROR_STOP=1 -At \
  -v payload="$payload" \
  -c "select public.receive_customer_order(:'payload'::jsonb)" >"$tmp_dir/second" &
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
  -c "select count(*) from private.customer_order_requests r join public.customer_orders o on o.id = r.customer_order_id where r.scope = 'savouretplus.customer-order.v1' and r.request_id = :'request_id'::uuid")"

if [[ "$row_count" != "1" ]]; then
  echo "expected one linked order after concurrent calls, got $row_count" >&2
  exit 1
fi

echo "ok - concurrent calls returned $first_id and created one order"

