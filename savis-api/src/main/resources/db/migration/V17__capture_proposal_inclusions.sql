-- No backfill: existing quotations and historical decisions remain untouched.
ALTER TABLE quotations ADD COLUMN proposal_inclusions jsonb;
