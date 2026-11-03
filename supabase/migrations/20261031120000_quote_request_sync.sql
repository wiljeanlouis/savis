-- Technical acknowledgement is independent from the public business status.
ALTER TABLE public.quote_requests
  ADD COLUMN sync_status text NOT NULL DEFAULT 'pending' CHECK (sync_status IN ('pending','synced','failed')),
  ADD COLUMN synced_at timestamptz,
  ADD COLUMN sync_error text;
CREATE INDEX quote_requests_pending_idx ON public.quote_requests(created_at,id) WHERE sync_status='pending';
REVOKE ALL ON public.quote_requests FROM PUBLIC, anon, authenticated;
REVOKE ALL ON public.quote_requests FROM service_role;
GRANT SELECT ON public.quote_requests TO service_role;
GRANT UPDATE (sync_status,synced_at,sync_error) ON public.quote_requests TO service_role;
