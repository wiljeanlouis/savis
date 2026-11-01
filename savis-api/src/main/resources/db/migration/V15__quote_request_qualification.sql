ALTER TABLE quote_requests
  ADD COLUMN version BIGINT NOT NULL DEFAULT 0,
  ADD COLUMN status VARCHAR(255) NOT NULL DEFAULT 'RECEIVED' CHECK(status IN ('RECEIVED','IN_PROGRESS','QUOTED','CLOSED')),
  ADD COLUMN qualification JSONB,
  ADD COLUMN closed_reason TEXT,
  ADD COLUMN history JSONB NOT NULL DEFAULT '[]',
  ADD COLUMN need_keys JSONB NOT NULL DEFAULT '[]',
  ADD CONSTRAINT quote_requests_closed_reason CHECK(status<>'CLOSED' OR length(trim(closed_reason))>0 AND closed_reason IS NOT NULL);
CREATE INDEX quote_requests_status_idx ON quote_requests(status,received_at,public_id);
