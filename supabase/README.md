# Supabase commerce boundary

Supabase owns the public catalog projection and the raw web-order inbox. SAVIS
owns the normalized business orders in its local PostgreSQL schema.

## Manual order import

`public.customer_orders` receives storefront submissions with
`sync_status = 'pending'`. There is deliberately no polling job. An
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
