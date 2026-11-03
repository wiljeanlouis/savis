ALTER TABLE quotations
  ADD COLUMN source_quote_request_id UUID REFERENCES quote_requests(public_id),
  ADD COLUMN proposal_request_id UUID,
  ADD COLUMN proposal_fingerprint VARCHAR(64),
  ADD CONSTRAINT quotations_proposal_key UNIQUE(source_quote_request_id,proposal_request_id),
  ADD CONSTRAINT quotations_proposal_origin CHECK (
    (source_quote_request_id IS NULL AND proposal_request_id IS NULL AND proposal_fingerprint IS NULL)
    OR (source_quote_request_id IS NOT NULL AND proposal_request_id IS NOT NULL AND length(proposal_fingerprint)=64 AND proposal_fingerprint IS NOT NULL)
  );
CREATE INDEX quotations_source_request_idx ON quotations(source_quote_request_id,created_at,public_id);
-- Preserve operator exclusions for each proposal, independently of later qualification changes.
ALTER TABLE quotations ADD COLUMN proposal_exclusions JSONB;
