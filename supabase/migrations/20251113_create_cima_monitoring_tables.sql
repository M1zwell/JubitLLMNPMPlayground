-- Create monitoring and audit tables for CIMA scraper
-- These tables track scrape execution and entity changes

-- Scrape execution logs
CREATE TABLE IF NOT EXISTS cima_scrape_logs (
  id BIGSERIAL PRIMARY KEY,
  entity_type TEXT,
  entity_category TEXT,
  status TEXT NOT NULL CHECK (status IN ('success', 'partial', 'failed')),
  records_found INT DEFAULT 0,
  records_inserted INT DEFAULT 0,
  records_updated INT DEFAULT 0,
  records_failed INT DEFAULT 0,
  duration_ms INT,
  error_message TEXT,
  firecrawl_credits_used INT,
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  metadata JSONB
);

-- Entity change tracking
CREATE TABLE IF NOT EXISTS cima_entity_changes (
  id BIGSERIAL PRIMARY KEY,
  entity_id BIGINT REFERENCES cima_entities(id) ON DELETE CASCADE,
  entity_name TEXT NOT NULL,
  field_name TEXT NOT NULL,
  old_value TEXT,
  new_value TEXT,
  changed_at TIMESTAMPTZ DEFAULT NOW(),
  change_type TEXT CHECK (change_type IN ('created', 'updated', 'status_change', 'deleted'))
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scrape_logs_status
ON cima_scrape_logs(status);

CREATE INDEX IF NOT EXISTS idx_scrape_logs_started_at
ON cima_scrape_logs(started_at DESC);

CREATE INDEX IF NOT EXISTS idx_scrape_logs_entity_type
ON cima_scrape_logs(entity_type);

CREATE INDEX IF NOT EXISTS idx_entity_changes_entity_id
ON cima_entity_changes(entity_id);

CREATE INDEX IF NOT EXISTS idx_entity_changes_changed_at
ON cima_entity_changes(changed_at DESC);

CREATE INDEX IF NOT EXISTS idx_entity_changes_field_name
ON cima_entity_changes(field_name);

-- RLS Policies
ALTER TABLE cima_scrape_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE cima_entity_changes ENABLE ROW LEVEL SECURITY;

-- Public read access for monitoring
CREATE POLICY "Allow public read on scrape logs"
ON cima_scrape_logs FOR SELECT
USING (true);

CREATE POLICY "Allow public read on entity changes"
ON cima_entity_changes FOR SELECT
USING (true);

-- Service role can insert/update
CREATE POLICY "Service role can insert scrape logs"
ON cima_scrape_logs FOR INSERT
WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

CREATE POLICY "Service role can insert entity changes"
ON cima_entity_changes FOR INSERT
WITH CHECK (auth.role() = 'service_role' OR auth.role() = 'authenticated');

-- Comments
COMMENT ON TABLE cima_scrape_logs IS 'Tracks execution history and performance of CIMA scraper';
COMMENT ON TABLE cima_entity_changes IS 'Audit trail of all changes to CIMA entities';
COMMENT ON COLUMN cima_scrape_logs.duration_ms IS 'Total execution time in milliseconds';
COMMENT ON COLUMN cima_scrape_logs.firecrawl_credits_used IS 'Approximate Firecrawl API credits consumed';
COMMENT ON COLUMN cima_entity_changes.change_type IS 'Type of change: created, updated, status_change, deleted';
