# Supabase commerce boundary

Supabase owns the public catalog projection and raw order/quote-request inboxes.
SAVIS owns normalized orders, qualified requests and commercial quotations in
its local PostgreSQL schema.

## Manual order import

`public.receive_customer_order(payload jsonb)` validates and receives storefront
submissions into `public.customer_orders` with `sync_status = 'pending'`.
Public roles cannot insert into the table directly. The RPC contract is
documented in `../docs/integration/customer-order-reception-rpc.md`. There is
deliberately no polling job. An
administrator starts the import from **Commandes > Récupérer commandes web** in
SAVIS Admin. The browser calls SAVIS API, and SAVIS API reads Supabase with the
service-role key. That key must never be configured in the storefront or Admin
frontend.

Successful imports are acknowledged with `sync_status = 'synced'` and
`synced_at`. Invalid payloads or local persistence failures receive
`sync_status = 'failed'` and a diagnostic in `sync_error`. A failed row must be
reviewed and reset to `pending` before it can be retried.

The local unique constraint on `(source, external_order_id)` is the definitive
duplicate guard. If local persistence succeeds but the Supabase acknowledgement
fails, the row remains pending; the next manual import recognizes the local
order and repairs the acknowledgement without creating a duplicate.

## New-order email notification

Email notification is infrastructure configured in Supabase, not code hosted
in `savis-api`:

1. Configure a Supabase Database Webhook for `INSERT` events on
   `public.customer_orders`.
2. Target a deployed Supabase Edge Function dedicated to administrative order
   notification.
3. Store the email-provider token and destination address as Edge Function
   secrets.
4. Send only the order identifier and non-sensitive summary needed by the
   administrator; do not include the service-role key.
5. After a successful email, update `notified_at` with a privileged Supabase
   client. Log notification failures for operational follow-up.
6. The email links the administrator to the private SAVIS Admin deployment; it
   must not call or expose SAVIS API publicly.

The Edge Function and email-provider integration are intentionally outside this
repository for the MVP.

## Public event quote reception

`public.submit_quote_request(payload jsonb)` receives generic or catalog-backed
event quote requests, including one mixed Catering + Decoration request without
Organisation. It validates published offering snapshots and uses a private,
transaction-safe idempotency ledger. Public roles can execute the RPC but
cannot read or write the inbox tables directly.

The RPC itself does not price or create a commercial quotation. SAVIS manually
imports the need into the separate `QuoteRequest` aggregate in `sales.quotation`,
qualifies it and can explicitly create multiple independent quotations.
The [public payload contract](../docs/integration/mixed-event-quote-request-rpc.md)
and [SAVIS workflow](../docs/integration/quote-request-implementation.md) describe
the two boundaries.

`20261031120000_quote_request_sync.sql` adds `sync_status` (`pending`, `synced`,
`failed`), `synced_at`, `sync_error` and a pending index. Public roles have no direct
table privileges; service-role can SELECT and UPDATE only sync columns. The
business `status='new'` remains separate. Local commits precede acknowledgements;
retrying a pending acknowledgement never resets SAVIS qualification.

`20261031130000_fix_quote_request_replays.sql` rejects missing/null `type` and
resolves an existing receipt before current Catalog validation. An identical
replay therefore survives product changes or unpublication. New receptions still
validate the published catalogue. Apply both migrations forward-only.

Run `python3 test/integration/quote_requests_supabase.py` from the repository root
to apply the full chain, SQL contract/privilege tests and concurrent submissions
in a disposable database. Set `SAVIS_TEST_SUPABASE_LINT=1` to also lint that database.
The existing local application database is not reset.

## Demandes de soumission Sales

La réception manuelle, la qualification et les propositions multiples appartiennent
à `sales.quotation`. Voir le [contrat et les procédures QuoteRequest](../docs/integration/quote-request-implementation.md)
pour les routes, migrations, tests et la reprise.
