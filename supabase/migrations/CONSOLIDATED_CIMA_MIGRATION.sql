-- ================================================
-- CIMA & BVI Database Migration - Consolidated
-- ================================================
-- This script combines all CIMA migration files into one
-- Run this in Supabase Dashboard > SQL Editor
-- ================================================

-- ================================================
-- STEP 1: Create cima_entities and bvi_entities tables
-- ================================================

-- Create table for CIMA (Cayman Islands Monetary Authority) Regulated Entities
CREATE TABLE IF NOT EXISTS cima_entities (
  id BIGSERIAL PRIMARY KEY,
  entity_name TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- Banking, Trust, Insurance, etc.
  entity_category TEXT, -- Class I, Class II, etc. for Trust providers
  license_number TEXT,
  license_status TEXT, -- Active, Suspended, Revoked, etc.
  registration_date DATE,
  expiry_date DATE,
  registered_agent_status BOOLEAN,
  address TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  website TEXT,
  jurisdiction TEXT DEFAULT 'Cayman Islands',
  additional_info JSONB, -- For flexible storage of extra fields
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_cima_entity_name ON cima_entities(entity_name);
CREATE INDEX IF NOT EXISTS idx_cima_entity_type ON cima_entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_cima_entity_category ON cima_entities(entity_category);
CREATE INDEX IF NOT EXISTS idx_cima_license_status ON cima_entities(license_status);
CREATE INDEX IF NOT EXISTS idx_cima_jurisdiction ON cima_entities(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_cima_scraped_at ON cima_entities(scraped_at DESC);

-- Create GIN index for JSONB additional_info field
CREATE INDEX IF NOT EXISTS idx_cima_additional_info ON cima_entities USING GIN (additional_info);

-- Enable Row Level Security
ALTER TABLE cima_entities ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated and anon users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cima_entities' AND policyname = 'Allow public read access'
  ) THEN
    CREATE POLICY "Allow public read access" ON cima_entities
      FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cima_entities' AND policyname = 'Allow public insert access'
  ) THEN
    CREATE POLICY "Allow public insert access" ON cima_entities
      FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'cima_entities' AND policyname = 'Allow public update access'
  ) THEN
    CREATE POLICY "Allow public update access" ON cima_entities
      FOR UPDATE
      TO public
      USING (true);
  END IF;
END $$;

-- Add comment
COMMENT ON TABLE cima_entities IS 'CIMA (Cayman Islands Monetary Authority) regulated entities data scraped from www.cima.ky';

-- Create table for BVI FSC (Financial Services Commission) Regulated Entities
CREATE TABLE IF NOT EXISTS bvi_entities (
  id BIGSERIAL PRIMARY KEY,
  entity_name TEXT NOT NULL,
  entity_type TEXT NOT NULL, -- Banking, Trust, Insurance, Fund, etc.
  entity_category TEXT,
  license_number TEXT,
  license_status TEXT,
  registration_date DATE,
  expiry_date DATE,
  registered_agent TEXT,
  address TEXT,
  contact_phone TEXT,
  contact_email TEXT,
  website TEXT,
  jurisdiction TEXT DEFAULT 'British Virgin Islands',
  additional_info JSONB,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_bvi_entity_name ON bvi_entities(entity_name);
CREATE INDEX IF NOT EXISTS idx_bvi_entity_type ON bvi_entities(entity_type);
CREATE INDEX IF NOT EXISTS idx_bvi_entity_category ON bvi_entities(entity_category);
CREATE INDEX IF NOT EXISTS idx_bvi_license_status ON bvi_entities(license_status);
CREATE INDEX IF NOT EXISTS idx_bvi_jurisdiction ON bvi_entities(jurisdiction);
CREATE INDEX IF NOT EXISTS idx_bvi_scraped_at ON bvi_entities(scraped_at DESC);

-- Create GIN index for JSONB additional_info field
CREATE INDEX IF NOT EXISTS idx_bvi_additional_info ON bvi_entities USING GIN (additional_info);

-- Enable Row Level Security
ALTER TABLE bvi_entities ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated and anon users
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bvi_entities' AND policyname = 'Allow public read access'
  ) THEN
    CREATE POLICY "Allow public read access" ON bvi_entities
      FOR SELECT
      TO public
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bvi_entities' AND policyname = 'Allow public insert access'
  ) THEN
    CREATE POLICY "Allow public insert access" ON bvi_entities
      FOR INSERT
      TO public
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'bvi_entities' AND policyname = 'Allow public update access'
  ) THEN
    CREATE POLICY "Allow public update access" ON bvi_entities
      FOR UPDATE
      TO public
      USING (true);
  END IF;
END $$;

-- Add comment
COMMENT ON TABLE bvi_entities IS 'BVI FSC (Financial Services Commission) regulated entities data';

-- ================================================
-- STEP 2: Add content_hash column for deduplication
-- ================================================

-- Add content_hash column if it doesn't exist
ALTER TABLE cima_entities
ADD COLUMN IF NOT EXISTS content_hash TEXT;

-- Create unique index on content_hash for deduplication
CREATE UNIQUE INDEX IF NOT EXISTS idx_cima_content_hash
ON cima_entities(content_hash);

-- Update existing records to generate content_hash
-- Format: sha256(entity_name||license_number||entity_type)
UPDATE cima_entities
SET content_hash = encode(
  digest(
    entity_name || '||' || COALESCE(license_number, 'NONE') || '||' || entity_type,
    'sha256'
  ),
  'hex'
)
WHERE content_hash IS NULL;

-- Make content_hash NOT NULL after populating (only if table has data)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM cima_entities LIMIT 1) THEN
    ALTER TABLE cima_entities
    ALTER COLUMN content_hash SET NOT NULL;
  END IF;
END $$;

-- Drop old unique constraint if it exists
ALTER TABLE cima_entities
DROP CONSTRAINT IF EXISTS unique_cima_entity;

-- Add comment
COMMENT ON COLUMN cima_entities.content_hash IS 'SHA256 hash for deduplication: entity_name||license_number||entity_type';

-- ================================================
-- STEP 3: Create monitoring and audit tables
-- ================================================

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

-- ================================================
-- MIGRATION COMPLETE
-- ================================================
-- Next steps:
-- 1. Run populate-sample-cima-data.js to insert sample data
-- 2. Configure cron jobs (see 20251113_create_cima_cron_jobs.sql)
-- 3. Deploy cima-scraper Edge Function
-- 4. Test manual scraping via frontend
-- ================================================
