-- Migration: Create scraped data tables with deduplication and full-text search
-- Date: 2025-11-10
-- Purpose: Implement multi-source web scraping storage with auto-deduplication

-- ============================================================================
-- 1. HKSFC Filings Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS hksfc_filings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content Fields
  title text NOT NULL,
  content text,
  filing_type text CHECK (filing_type IN (
    'corporate', 'enforcement', 'policy', 'shareholding',
    'decisions', 'events', 'circular', 'consultation', 'news', 'other'
  )), -- Category: corporate, enforcement, policy, shareholding, decisions, events, circular, consultation, news, other
  company_code text, -- '0001', '0700', etc. (for cross-source correlation)
  company_name text,
  filing_date date,
  url text NOT NULL,

  -- Deduplication
  content_hash text NOT NULL,

  -- Metadata
  scraped_at timestamptz DEFAULT now(),
  first_seen timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now(),

  -- Full-Text Search
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
  ) STORED,

  -- Constraints
  CONSTRAINT hksfc_filings_url_key UNIQUE (url),
  CONSTRAINT hksfc_filings_content_hash_key UNIQUE (content_hash)
);

-- Indexes for HKSFC
CREATE INDEX IF NOT EXISTS idx_hksfc_filing_date ON hksfc_filings(filing_date DESC);
CREATE INDEX IF NOT EXISTS idx_hksfc_company_code ON hksfc_filings(company_code) WHERE company_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hksfc_filing_type ON hksfc_filings(filing_type);
CREATE INDEX IF NOT EXISTS idx_hksfc_scraped_at ON hksfc_filings(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_hksfc_search_vector ON hksfc_filings USING GIN(search_vector);

COMMENT ON TABLE hksfc_filings IS 'Hong Kong Securities & Futures Commission filings, news, enforcement actions';

-- ============================================================================
-- 2. HKEX Announcements Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS hkex_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content Fields
  announcement_title text NOT NULL,
  announcement_content text,
  announcement_type text, -- 'company', 'ipo', 'market_stats', 'ccass'
  company_code text,
  company_name text,
  announcement_date date,
  url text NOT NULL,

  -- CCASS-specific fields (if type = 'ccass')
  ccass_participant_id text,
  ccass_shareholding bigint,
  ccass_percentage numeric(5,2),

  -- Deduplication
  content_hash text NOT NULL,

  -- Metadata
  scraped_at timestamptz DEFAULT now(),
  first_seen timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now(),

  -- Full-Text Search
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(announcement_title, '') || ' ' || coalesce(announcement_content, ''))
  ) STORED,

  -- Constraints
  CONSTRAINT hkex_announcements_url_key UNIQUE (url),
  CONSTRAINT hkex_announcements_content_hash_key UNIQUE (content_hash)
);

-- Indexes for HKEX
CREATE INDEX IF NOT EXISTS idx_hkex_announcement_date ON hkex_announcements(announcement_date DESC);
CREATE INDEX IF NOT EXISTS idx_hkex_company_code ON hkex_announcements(company_code) WHERE company_code IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_hkex_announcement_type ON hkex_announcements(announcement_type);
CREATE INDEX IF NOT EXISTS idx_hkex_scraped_at ON hkex_announcements(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_hkex_search_vector ON hkex_announcements USING GIN(search_vector);

COMMENT ON TABLE hkex_announcements IS 'Hong Kong Stock Exchange company announcements, market data, CCASS holdings';

-- ============================================================================
-- 3. Legal Cases Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS legal_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content Fields
  case_title text NOT NULL,
  case_number text,
  case_type text, -- 'civil', 'criminal', 'administrative'
  court_name text,
  judge_name text,
  case_facts text,
  case_ruling text,
  judgment_date date,
  url text NOT NULL,

  -- Citations (for linking related cases)
  cited_cases text[], -- Array of case numbers cited

  -- Deduplication
  content_hash text NOT NULL,

  -- Metadata
  scraped_at timestamptz DEFAULT now(),
  first_seen timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now(),

  -- Full-Text Search
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(case_title, '') || ' ' ||
      coalesce(case_facts, '') || ' ' ||
      coalesce(case_ruling, '')
    )
  ) STORED,

  -- Constraints
  CONSTRAINT legal_cases_url_key UNIQUE (url),
  CONSTRAINT legal_cases_content_hash_key UNIQUE (content_hash)
);

-- Indexes for Legal Cases
CREATE INDEX IF NOT EXISTS idx_legal_judgment_date ON legal_cases(judgment_date DESC);
CREATE INDEX IF NOT EXISTS idx_legal_case_type ON legal_cases(case_type);
CREATE INDEX IF NOT EXISTS idx_legal_case_number ON legal_cases(case_number);
CREATE INDEX IF NOT EXISTS idx_legal_scraped_at ON legal_cases(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_legal_search_vector ON legal_cases USING GIN(search_vector);

COMMENT ON TABLE legal_cases IS 'Legal cases, court judgments, legislation updates';

-- ============================================================================
-- 4. NPM Packages Scraped Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS npm_packages_scraped (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content Fields
  package_name text NOT NULL,
  package_version text,
  description text,
  homepage_url text,
  repository_url text,
  npm_url text NOT NULL,

  -- Statistics
  downloads_weekly bigint,
  downloads_monthly bigint,
  github_stars int,
  github_forks int,
  github_issues int,

  -- Metadata
  author text,
  license text,
  keywords text[],
  has_typescript boolean DEFAULT false,

  -- Security
  security_advisories_count int DEFAULT 0,
  latest_security_advisory_date date,

  -- Deduplication
  content_hash text NOT NULL,

  -- Metadata
  scraped_at timestamptz DEFAULT now(),
  first_seen timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now(),

  -- Full-Text Search
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(package_name, '') || ' ' ||
      coalesce(description, '')
    )
  ) STORED,

  -- Constraints
  CONSTRAINT npm_packages_scraped_npm_url_key UNIQUE (npm_url),
  CONSTRAINT npm_packages_scraped_content_hash_key UNIQUE (content_hash)
);

-- Indexes for NPM Packages
CREATE INDEX IF NOT EXISTS idx_npm_package_name ON npm_packages_scraped(package_name);
CREATE INDEX IF NOT EXISTS idx_npm_downloads_weekly ON npm_packages_scraped(downloads_weekly DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_npm_github_stars ON npm_packages_scraped(github_stars DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_npm_scraped_at ON npm_packages_scraped(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_npm_search_vector ON npm_packages_scraped USING GIN(search_vector);

COMMENT ON TABLE npm_packages_scraped IS 'NPM package metadata, download trends, security advisories';

-- ============================================================================
-- 5. LLM Configs Table
-- ============================================================================
CREATE TABLE IF NOT EXISTS llm_configs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content Fields
  model_name text NOT NULL,
  provider text, -- 'openai', 'anthropic', 'google', 'meta', etc.
  model_id text,

  -- Specifications
  context_window int,
  max_output_tokens int,
  supports_vision boolean DEFAULT false,
  supports_function_calling boolean DEFAULT false,

  -- Pricing (per 1M tokens)
  price_input_per_1m numeric(10,4),
  price_output_per_1m numeric(10,4),
  currency text DEFAULT 'USD',

  -- Performance Benchmarks
  mmlu_score numeric(5,2), -- Multi-task Language Understanding
  humaneval_score numeric(5,2), -- Code generation benchmark
  quality_index numeric(5,2),

  -- Metadata
  release_date date,
  url text NOT NULL,

  -- Deduplication
  content_hash text NOT NULL,

  -- Metadata
  scraped_at timestamptz DEFAULT now(),
  first_seen timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now(),

  -- Full-Text Search
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english',
      coalesce(model_name, '') || ' ' ||
      coalesce(provider, '') || ' ' ||
      coalesce(model_id, '')
    )
  ) STORED,

  -- Constraints
  CONSTRAINT llm_configs_url_key UNIQUE (url),
  CONSTRAINT llm_configs_content_hash_key UNIQUE (content_hash)
);

-- Indexes for LLM Configs
CREATE INDEX IF NOT EXISTS idx_llm_provider ON llm_configs(provider);
CREATE INDEX IF NOT EXISTS idx_llm_model_name ON llm_configs(model_name);
CREATE INDEX IF NOT EXISTS idx_llm_quality_index ON llm_configs(quality_index DESC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_llm_price_input ON llm_configs(price_input_per_1m ASC NULLS LAST);
CREATE INDEX IF NOT EXISTS idx_llm_scraped_at ON llm_configs(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_llm_search_vector ON llm_configs USING GIN(search_vector);

COMMENT ON TABLE llm_configs IS 'LLM model specifications, pricing, benchmarks from various providers';

-- ============================================================================
-- 6. Scrape Logs Table (Monitoring)
-- ============================================================================
CREATE TABLE IF NOT EXISTS scrape_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Source Identification
  source text NOT NULL, -- 'hksfc', 'hkex', 'legal', 'npm', 'llm'
  source_type text, -- Optional: 'news', 'enforcement', etc.

  -- Execution Status
  status text NOT NULL, -- 'success', 'error', 'partial'
  records_inserted int DEFAULT 0,
  records_updated int DEFAULT 0,
  records_failed int DEFAULT 0,

  -- Performance
  duration_ms int,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,

  -- Error Details
  error_message text,
  error_stack text,

  -- Scraper Details
  scraper_engine text, -- 'firecrawl', 'puppeteer'
  scraper_version text,

  -- Metadata
  created_at timestamptz DEFAULT now()
);

-- Indexes for Scrape Logs
CREATE INDEX IF NOT EXISTS idx_scrape_logs_source_status ON scrape_logs(source, status, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_scrape_logs_started_at ON scrape_logs(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_scrape_logs_status ON scrape_logs(status);

COMMENT ON TABLE scrape_logs IS 'Scraping execution logs for monitoring and debugging';

-- ============================================================================
-- 7. Helper Functions
-- ============================================================================

-- Function to update last_seen timestamp on UPSERT
CREATE OR REPLACE FUNCTION update_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_seen = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply trigger to all scraped data tables
CREATE TRIGGER hksfc_filings_update_last_seen
  BEFORE UPDATE ON hksfc_filings
  FOR EACH ROW
  EXECUTE FUNCTION update_last_seen();

CREATE TRIGGER hkex_announcements_update_last_seen
  BEFORE UPDATE ON hkex_announcements
  FOR EACH ROW
  EXECUTE FUNCTION update_last_seen();

CREATE TRIGGER legal_cases_update_last_seen
  BEFORE UPDATE ON legal_cases
  FOR EACH ROW
  EXECUTE FUNCTION update_last_seen();

CREATE TRIGGER npm_packages_scraped_update_last_seen
  BEFORE UPDATE ON npm_packages_scraped
  FOR EACH ROW
  EXECUTE FUNCTION update_last_seen();

CREATE TRIGGER llm_configs_update_last_seen
  BEFORE UPDATE ON llm_configs
  FOR EACH ROW
  EXECUTE FUNCTION update_last_seen();

-- ============================================================================
-- 8. Unified View for Cross-Source Queries
-- ============================================================================

CREATE OR REPLACE VIEW all_scraped_data AS
-- HKSFC Filings
SELECT
  id,
  'hksfc' as source,
  title,
  content,
  url,
  scraped_at,
  first_seen,
  last_seen,
  search_vector,
  filing_date::timestamptz as event_date,
  company_code,
  filing_type as item_type
FROM hksfc_filings

UNION ALL

-- HKEX Announcements
SELECT
  id,
  'hkex' as source,
  announcement_title as title,
  announcement_content as content,
  url,
  scraped_at,
  first_seen,
  last_seen,
  search_vector,
  announcement_date::timestamptz as event_date,
  company_code,
  announcement_type as item_type
FROM hkex_announcements

UNION ALL

-- Legal Cases
SELECT
  id,
  'legal' as source,
  case_title as title,
  case_facts || ' ' || COALESCE(case_ruling, '') as content,
  url,
  scraped_at,
  first_seen,
  last_seen,
  search_vector,
  judgment_date::timestamptz as event_date,
  NULL::text as company_code,
  case_type as item_type
FROM legal_cases

UNION ALL

-- NPM Packages
SELECT
  id,
  'npm' as source,
  package_name as title,
  description as content,
  npm_url as url,
  scraped_at,
  first_seen,
  last_seen,
  search_vector,
  NULL::timestamptz as event_date,
  NULL::text as company_code,
  'package' as item_type
FROM npm_packages_scraped

UNION ALL

-- LLM Configs
SELECT
  id,
  'llm' as source,
  model_name as title,
  provider || ' - Context: ' || COALESCE(context_window::text, 'N/A') || ' tokens' as content,
  url,
  scraped_at,
  first_seen,
  last_seen,
  search_vector,
  release_date::timestamptz as event_date,
  NULL::text as company_code,
  provider as item_type
FROM llm_configs;

COMMENT ON VIEW all_scraped_data IS 'Unified view combining all scraped data sources for cross-source queries';

-- ============================================================================
-- 9. Row Level Security (RLS) - Public Read Access
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE hksfc_filings ENABLE ROW LEVEL SECURITY;
ALTER TABLE hkex_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE legal_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE npm_packages_scraped ENABLE ROW LEVEL SECURITY;
ALTER TABLE llm_configs ENABLE ROW LEVEL SECURITY;
ALTER TABLE scrape_logs ENABLE ROW LEVEL SECURITY;

-- Allow public read access to scraped data
CREATE POLICY "Allow public read access" ON hksfc_filings FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON hkex_announcements FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON legal_cases FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON npm_packages_scraped FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON llm_configs FOR SELECT USING (true);

-- Only service role can insert/update/delete scraped data
CREATE POLICY "Service role can insert" ON hksfc_filings FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role can update" ON hksfc_filings FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "Service role can delete" ON hksfc_filings FOR DELETE USING (auth.role() = 'service_role');

CREATE POLICY "Service role can insert" ON hkex_announcements FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role can update" ON hkex_announcements FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "Service role can delete" ON hkex_announcements FOR DELETE USING (auth.role() = 'service_role');

CREATE POLICY "Service role can insert" ON legal_cases FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role can update" ON legal_cases FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "Service role can delete" ON legal_cases FOR DELETE USING (auth.role() = 'service_role');

CREATE POLICY "Service role can insert" ON npm_packages_scraped FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role can update" ON npm_packages_scraped FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "Service role can delete" ON npm_packages_scraped FOR DELETE USING (auth.role() = 'service_role');

CREATE POLICY "Service role can insert" ON llm_configs FOR INSERT WITH CHECK (auth.role() = 'service_role');
CREATE POLICY "Service role can update" ON llm_configs FOR UPDATE USING (auth.role() = 'service_role');
CREATE POLICY "Service role can delete" ON llm_configs FOR DELETE USING (auth.role() = 'service_role');

-- Scrape logs: only service role can access
CREATE POLICY "Service role full access" ON scrape_logs FOR ALL USING (auth.role() = 'service_role');

-- ============================================================================
-- Migration Complete
-- ============================================================================

-- Summary:
-- ✅ Created 5 scraped data tables (hksfc, hkex, legal, npm, llm)
-- ✅ Created scrape_logs for monitoring
-- ✅ Implemented SHA-256 deduplication via content_hash unique constraints
-- ✅ Added full-text search with tsvector + GIN indexes
-- ✅ Created triggers for auto-updating last_seen timestamp
-- ✅ Created unified view (all_scraped_data) for cross-source queries
-- ✅ Enabled RLS with public read, service role write policies
-- ✅ Optimized indexes for query performance

-- Next steps:
-- 1. Deploy this migration: supabase db push
-- 2. Create Edge Function for unified scraping
-- 3. Set up pg_cron scheduled jobs
