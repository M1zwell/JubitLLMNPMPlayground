# HK Financial Data Scraping System - Comprehensive Implementation Plan

## Executive Summary

This document provides a production-ready implementation plan for a comprehensive Hong Kong financial data scraping system that collects data from 4 primary sources:

1. **CCASS Shareholding Search** (https://www3.hkexnews.hk/sdw/search/searchsdw.aspx)
2. **SFC Statistics Tables** (XLSX files from SFC website)
3. **SFC Filings & RSS** (Various SFC regulatory announcements)
4. **HKEX Disclosure of Interests** (https://di.hkex.com.hk/di/NSSrchCorp.aspx)

**Key Features:**
- SHA-256 hash-based deduplication
- Retry logic with exponential backoff
- Real-time progress tracking via Supabase Realtime
- pg_cron scheduling (daily/weekly)
- Manual trigger via RPC functions
- WCAG 2.1 AA compliant admin dashboard

---

## 1. Architecture Overview

### 1.1 System Components

```
┌─────────────────────────────────────────────────────────────┐
│                     Admin Dashboard (React)                  │
│  - Job configuration modal                                   │
│  - Real-time job monitoring                                  │
│  - Historical logs viewer                                    │
│  - Multi-stock/table selection                               │
└──────────────────┬──────────────────────────────────────────┘
                   │ RPC: trigger_scraping_job()
                   ▼
┌─────────────────────────────────────────────────────────────┐
│              Unified Scraper Edge Function                   │
│  - Job orchestration                                         │
│  - Progress tracking                                         │
│  - Error handling & retries                                  │
│  - Deduplication layer                                       │
└──────────────────┬──────────────────────────────────────────┘
                   │
    ┌──────────────┼──────────────┬──────────────┐
    ▼              ▼              ▼              ▼
┌────────┐   ┌────────┐    ┌────────┐    ┌────────┐
│ CCASS  │   │  SFC   │    │  SFC   │    │ HKEX   │
│Scraper │   │ Stats  │    │Filings │    │  DI    │
│        │   │Scraper │    │Scraper │    │Scraper │
└────┬───┘   └───┬────┘    └───┬────┘    └───┬────┘
     │           │             │             │
     └───────────┴─────────────┴─────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│                  Supabase PostgreSQL                         │
│  - hkex_ccass_shareholdings                                  │
│  - hksfc_statistics                                          │
│  - hksfc_filings                                             │
│  - hkex_di_disclosures                                       │
│  - scraping_jobs (job tracking)                              │
└─────────────────────────────────────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│              pg_cron Scheduler                               │
│  - Daily SFC stats (2 AM HKT)                                │
│  - Weekly CCASS batch (Sunday 3 AM)                          │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 Data Flow

**Manual Trigger Flow:**
1. User fills config form in dashboard
2. Frontend calls `trigger_scraping_job()` RPC function
3. RPC creates job record with `status='pending'`
4. RPC invokes unified-scraper edge function via HTTP POST
5. Edge function updates job to `status='running'`
6. Scraper executes with retry logic
7. Records are deduplicated using SHA-256 hashes
8. New records inserted to database
9. Job updated to `status='completed'` with counts
10. Dashboard receives real-time update via Supabase subscription

**Scheduled Flow:**
1. pg_cron executes SQL at scheduled time
2. SQL uses `net.http_post()` to invoke edge function
3. Rest of flow identical to manual trigger

### 1.3 Deduplication Strategy

Each data source uses a unique deduplication key:

```typescript
// CCASS: stock_code + participant_id + shareholding_date
hash(stock_code='00700' + participant_id='C00001' + shareholding_date='2025-01-20')
→ dedup_key: '5f4dcc3b5aa765d61d8327deb882cf99...'

// SFC Filings: document_url + published_date
hash(url='https://www.sfc.hk/doc123' + date='2025-01-20')
→ dedup_key: '098f6bcd4621d373cade4e832627b4f6...'

// SFC Stats: table_name + report_period + file_hash
hash(table='A1' + period='December 2024' + file_hash='abc123...')
→ dedup_key: 'e4da3b7fbbce2345d7772b0674a318d5...'

// HKEX DI: company_code + disclosure_date + di_number
hash(company='00700' + date='2025-01-20' + di='DI123456')
→ dedup_key: '8f14e45fceea167a5a36dedd4bea2543...'
```

**Database Constraint:**
```sql
ALTER TABLE hkex_ccass_shareholdings ADD CONSTRAINT unique_dedup_key UNIQUE (dedup_key);
```

This ensures:
- ✅ No duplicate imports across scraping runs
- ✅ Idempotent operations (can re-run safely)
- ✅ Fast lookups via indexed unique column
- ✅ Works with `forceRescrape` override flag

---

## 2. Database Schema

### 2.1 Complete SQL Migration

```sql
-- =====================================================
-- HK Financial Data Scraping System
-- Database Schema Migration
-- =====================================================

-- Enable extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";
CREATE EXTENSION IF NOT EXISTS "http" WITH SCHEMA extensions;

-- =====================================================
-- 1. Core Infrastructure
-- =====================================================

-- Scraping jobs tracking table
CREATE TABLE scraping_jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  source TEXT NOT NULL CHECK (source IN ('ccass', 'sfc-stats', 'sfc-filings', 'hkex-di')),
  config JSONB NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  dedup_count INTEGER DEFAULT 0,
  inserted_count INTEGER DEFAULT 0,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_by UUID REFERENCES auth.users(id),
  CONSTRAINT valid_timestamps CHECK (
    (started_at IS NULL OR started_at >= created_at) AND
    (completed_at IS NULL OR completed_at >= started_at)
  )
);

CREATE INDEX idx_scraping_jobs_source_status ON scraping_jobs(source, status);
CREATE INDEX idx_scraping_jobs_created_at ON scraping_jobs(created_at DESC);
CREATE INDEX idx_scraping_jobs_user ON scraping_jobs(created_by) WHERE created_by IS NOT NULL;

-- =====================================================
-- 2. CCASS Shareholding Data
-- =====================================================

CREATE TABLE hkex_ccass_shareholdings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dedup_key TEXT UNIQUE NOT NULL,

  -- Stock information
  stock_code TEXT NOT NULL,
  stock_name TEXT,

  -- Participant information
  participant_id TEXT NOT NULL,
  participant_name TEXT,

  -- Shareholding data
  shareholding BIGINT NOT NULL,
  percentage DECIMAL(7,4),
  shareholding_date DATE NOT NULL,

  -- Metadata
  source_url TEXT,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),

  -- Audit fields
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_ccass_stock_date ON hkex_ccass_shareholdings(stock_code, shareholding_date DESC);
CREATE INDEX idx_ccass_participant ON hkex_ccass_shareholdings(participant_id);
CREATE INDEX idx_ccass_dedup ON hkex_ccass_shareholdings(dedup_key);
CREATE INDEX idx_ccass_date_only ON hkex_ccass_shareholdings(shareholding_date DESC);
CREATE INDEX idx_ccass_percentage ON hkex_ccass_shareholdings(percentage DESC NULLS LAST) WHERE percentage IS NOT NULL;

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$ LANGUAGE plpgsql;

CREATE TRIGGER update_ccass_updated_at BEFORE UPDATE ON hkex_ccass_shareholdings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 3. SFC Statistics Tables
-- =====================================================

CREATE TABLE hksfc_statistics (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dedup_key TEXT UNIQUE NOT NULL,

  -- Table information
  table_name TEXT NOT NULL,
  table_title TEXT,
  report_period TEXT NOT NULL,

  -- File tracking
  file_hash TEXT NOT NULL,
  file_url TEXT,

  -- Data payload (JSONB for flexibility)
  data JSONB NOT NULL,

  -- Metadata
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sfc_stats_table_period ON hksfc_statistics(table_name, report_period DESC);
CREATE INDEX idx_sfc_stats_table ON hksfc_statistics(table_name);
CREATE INDEX idx_sfc_stats_dedup ON hksfc_statistics(dedup_key);
CREATE INDEX idx_sfc_stats_date ON hksfc_statistics(scraped_at DESC);

-- GIN index for JSONB data queries
CREATE INDEX idx_sfc_stats_data ON hksfc_statistics USING GIN (data);

CREATE TRIGGER update_sfc_stats_updated_at BEFORE UPDATE ON hksfc_statistics
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 4. SFC Filings & Announcements
-- =====================================================

CREATE TABLE hksfc_filings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dedup_key TEXT UNIQUE NOT NULL,

  -- Filing information
  title TEXT NOT NULL,
  document_url TEXT NOT NULL,
  filing_type TEXT,
  category TEXT,

  -- Content
  summary TEXT,
  pdf_url TEXT,
  tags TEXT[],

  -- Dates
  published_date DATE NOT NULL,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),

  -- Audit
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_sfc_filings_date ON hksfc_filings(published_date DESC);
CREATE INDEX idx_sfc_filings_type ON hksfc_filings(filing_type);
CREATE INDEX idx_sfc_filings_category ON hksfc_filings(category);
CREATE INDEX idx_sfc_filings_dedup ON hksfc_filings(dedup_key);
CREATE INDEX idx_sfc_filings_tags ON hksfc_filings USING GIN (tags);

CREATE TRIGGER update_sfc_filings_updated_at BEFORE UPDATE ON hksfc_filings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 5. HKEX Disclosure of Interests
-- =====================================================

CREATE TABLE hkex_di_disclosures (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  dedup_key TEXT UNIQUE NOT NULL,

  -- Company information
  company_code TEXT NOT NULL,
  company_name TEXT,

  -- Disclosure details
  di_number TEXT NOT NULL,
  disclosure_date DATE NOT NULL,
  disclosure_type TEXT,

  -- Shareholding information
  substantial_shareholder TEXT,
  number_of_shares BIGINT,
  percentage DECIMAL(7,4),
  nature_of_interest TEXT,

  -- Metadata
  source_url TEXT,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_di_company_date ON hkex_di_disclosures(company_code, disclosure_date DESC);
CREATE INDEX idx_di_shareholder ON hkex_di_disclosures(substantial_shareholder);
CREATE INDEX idx_di_dedup ON hkex_di_disclosures(dedup_key);
CREATE INDEX idx_di_date ON hkex_di_disclosures(disclosure_date DESC);
CREATE INDEX idx_di_type ON hkex_di_disclosures(disclosure_type);

CREATE TRIGGER update_di_updated_at BEFORE UPDATE ON hkex_di_disclosures
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- 6. Row Level Security (RLS) Policies
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE scraping_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE hkex_ccass_shareholdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE hksfc_statistics ENABLE ROW LEVEL SECURITY;
ALTER TABLE hksfc_filings ENABLE ROW LEVEL SECURITY;
ALTER TABLE hkex_di_disclosures ENABLE ROW LEVEL SECURITY;

-- Scraping jobs policies
CREATE POLICY "Allow authenticated users to view scraping jobs"
  ON scraping_jobs FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated users to create scraping jobs"
  ON scraping_jobs FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Service role can do everything on scraping_jobs"
  ON scraping_jobs FOR ALL
  TO service_role
  USING (true);

-- Data tables policies (read-only for authenticated users)
CREATE POLICY "Allow authenticated read on CCASS data"
  ON hkex_ccass_shareholdings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated read on SFC stats"
  ON hksfc_statistics FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated read on SFC filings"
  ON hksfc_filings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow authenticated read on HKEX DI"
  ON hkex_di_disclosures FOR SELECT
  TO authenticated
  USING (true);

-- Service role has full access to data tables
CREATE POLICY "Service role full access on CCASS"
  ON hkex_ccass_shareholdings FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Service role full access on SFC stats"
  ON hksfc_statistics FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Service role full access on SFC filings"
  ON hksfc_filings FOR ALL
  TO service_role
  USING (true);

CREATE POLICY "Service role full access on HKEX DI"
  ON hkex_di_disclosures FOR ALL
  TO service_role
  USING (true);

-- =====================================================
-- 7. RPC Functions
-- =====================================================

-- Manual trigger function
CREATE OR REPLACE FUNCTION trigger_scraping_job(
  p_source TEXT,
  p_config JSONB
) RETURNS UUID
SECURITY DEFINER
SET search_path = public
LANGUAGE plpgsql
AS $
DECLARE
  v_job_id UUID;
  v_function_url TEXT;
  v_anon_key TEXT;
BEGIN
  -- Validate source
  IF p_source NOT IN ('ccass', 'sfc-stats', 'sfc-filings', 'hkex-di') THEN
    RAISE EXCEPTION 'Invalid source: %', p_source;
  END IF;

  -- Create job record
  INSERT INTO scraping_jobs (source, config, status, created_by)
  VALUES (p_source, p_config, 'pending', auth.uid())
  RETURNING id INTO v_job_id;

  -- Get Supabase URL and anon key from environment
  v_function_url := current_setting('app.settings.supabase_url') || '/functions/v1/unified-scraper';
  v_anon_key := current_setting('app.settings.supabase_anon_key');

  -- Invoke edge function asynchronously
  PERFORM extensions.http_post(
    url := v_function_url,
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || v_anon_key,
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'source', p_source,
      'config', p_config,
      'jobId', v_job_id
    )
  );

  RETURN v_job_id;
END;
$;

-- Grant execute to authenticated users
GRANT EXECUTE ON FUNCTION trigger_scraping_job(TEXT, JSONB) TO authenticated;

-- =====================================================
-- 8. pg_cron Scheduled Jobs
-- =====================================================

-- Daily SFC Statistics Update (2 AM HKT = 6 PM UTC previous day)
SELECT cron.schedule(
  'daily-sfc-stats-update',
  '0 18 * * *',
  $
  SELECT extensions.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/unified-scraper',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key'),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'source', 'sfc-stats',
      'config', jsonb_build_object(
        'tableIds', ARRAY['A1','A2','A3','C4','C5','D3','D4'],
        'forceRefresh', false
      )
    )
  );
  $
);

-- Weekly CCASS Batch for Top 20 Stocks (Sunday 3 AM HKT = Saturday 7 PM UTC)
SELECT cron.schedule(
  'weekly-ccass-top-stocks',
  '0 19 * * 6',
  $
  SELECT extensions.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/unified-scraper',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key'),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'source', 'ccass',
      'config', jsonb_build_object(
        'stockCodes', ARRAY['00700','00941','00388','00981','01810','09988','01299','02318','02382','00883','01109','09618','00011','01093','00005','03690','01398','00175','01113','00016'],
        'dateRange', jsonb_build_object(
          'start', (CURRENT_DATE - INTERVAL '7 days')::TEXT,
          'end', CURRENT_DATE::TEXT
        ),
        'forceRescrape', false
      )
    )
  );
  $
);

-- Daily SFC Filings RSS Fetch (10 AM HKT = 2 AM UTC)
SELECT cron.schedule(
  'daily-sfc-filings-update',
  '0 2 * * *',
  $
  SELECT extensions.http_post(
    url := current_setting('app.settings.supabase_url') || '/functions/v1/unified-scraper',
    headers := jsonb_build_object(
      'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key'),
      'Content-Type', 'application/json'
    ),
    body := jsonb_build_object(
      'source', 'sfc-filings',
      'config', jsonb_build_object(
        'sources', ARRAY['press-releases','enforcement','circulars','virtual-assets'],
        'dateRange', jsonb_build_object(
          'start', (CURRENT_DATE - INTERVAL '7 days')::TEXT,
          'end', CURRENT_DATE::TEXT
        )
      )
    )
  );
  $
);

-- =====================================================
-- 9. Materialized Views for Performance
-- =====================================================

-- Latest CCASS holdings per stock
CREATE MATERIALIZED VIEW ccass_latest_holdings AS
SELECT DISTINCT ON (stock_code, participant_id)
  stock_code,
  stock_name,
  participant_id,
  participant_name,
  shareholding,
  percentage,
  shareholding_date
FROM hkex_ccass_shareholdings
ORDER BY stock_code, participant_id, shareholding_date DESC;

CREATE UNIQUE INDEX idx_ccass_latest_unique ON ccass_latest_holdings(stock_code, participant_id);
CREATE INDEX idx_ccass_latest_stock ON ccass_latest_holdings(stock_code);
CREATE INDEX idx_ccass_latest_percentage ON ccass_latest_holdings(percentage DESC NULLS LAST);

-- Refresh materialized view function
CREATE OR REPLACE FUNCTION refresh_ccass_latest_holdings()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $
  REFRESH MATERIALIZED VIEW CONCURRENTLY ccass_latest_holdings;
$;

-- Auto-refresh after CCASS inserts
CREATE OR REPLACE FUNCTION trigger_refresh_ccass_view()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $
BEGIN
  PERFORM refresh_ccass_latest_holdings();
  RETURN NEW;
END;
$;

CREATE TRIGGER after_ccass_insert
  AFTER INSERT ON hkex_ccass_shareholdings
  FOR EACH STATEMENT
  EXECUTE FUNCTION trigger_refresh_ccass_view();

-- =====================================================
-- 10. Utility Functions
-- =====================================================

-- Get job statistics
CREATE OR REPLACE FUNCTION get_scraping_stats(
  p_source TEXT DEFAULT NULL,
  p_days INTEGER DEFAULT 7
)
RETURNS TABLE (
  source TEXT,
  total_jobs INTEGER,
  successful_jobs INTEGER,
  failed_jobs INTEGER,
  avg_duration_ms NUMERIC,
  total_records_inserted INTEGER
)
LANGUAGE SQL
SECURITY DEFINER
AS $
SELECT
  source,
  COUNT(*)::INTEGER AS total_jobs,
  COUNT(*) FILTER (WHERE status = 'completed')::INTEGER AS successful_jobs,
  COUNT(*) FILTER (WHERE status = 'failed')::INTEGER AS failed_jobs,
  AVG(EXTRACT(EPOCH FROM (completed_at - started_at)) * 1000)::NUMERIC(10,2) AS avg_duration_ms,
  COALESCE(SUM(inserted_count), 0)::INTEGER AS total_records_inserted
FROM scraping_jobs
WHERE created_at >= CURRENT_DATE - p_days
  AND (p_source IS NULL OR source = p_source)
GROUP BY source
ORDER BY source;
$;

GRANT EXECUTE ON FUNCTION get_scraping_stats(TEXT, INTEGER) TO authenticated;

-- =====================================================
-- END OF MIGRATION
-- =====================================================
```

### 2.2 Migration Deployment

**Step 1: Save migration file**
```bash
# Save to Supabase migration folder
supabase/migrations/20250120_hk_financial_scraping_schema.sql
```

**Step 2: Apply to local database (testing)**
```bash
supabase db reset
```

**Step 3: Apply to production**
```bash
supabase db push
```

**Step 4: Configure environment variables**
```sql
-- Set required config (run in Supabase SQL editor)
ALTER DATABASE postgres SET app.settings.supabase_url = 'https://[project-id].supabase.co';
ALTER DATABASE postgres SET app.settings.supabase_anon_key = '[your-anon-key]';
```

---

## 3. Scraper Implementations

All specialized scraper classes have been created in `supabase/functions/scrapers/`:

### 3.1 CCASScraper.ts
**Status:** ✅ Created
**Location:** `supabase/functions/scrapers/CCASScraper.ts`
**Key Features:**
- Puppeteer-based for JavaScript-heavy pages
- Date range iteration
- Rate limiting (10 req/min)
- Handles "No data" responses gracefully

### 3.2 SFCStatsScraper.ts
**Status:** ✅ Created
**Location:** `supabase/functions/scrapers/SFCStatsScraper.ts`
**Key Features:**
- Direct XLSX file downloads
- SheetJS (deno_xlsx) parsing
- SHA-256 file hash calculation
- Smart header detection

### 3.3 SFCFilingsScraper.ts
**Status:** ✅ Created
**Location:** `supabase/functions/scrapers/SFCFilingsScraper.ts`
**Key Features:**
- RSS feed parsing (XML)
- HTML scraping fallback
- Multiple date format handling
- PDF URL extraction

### 3.4 HKEXDIScraper.ts
**Status:** ✅ Created
**Location:** `supabase/functions/scrapers/HKEXDIScraper.ts`
**Key Features:**
- Multi-page pagination support
- Complex form interactions
- Language switching (EN)
- Shareholder data extraction

---

## 4. Edge Function Architecture

### 4.1 Unified Scraper Function

**File:** `supabase/functions/unified-scraper/index.ts` (exists, needs enhancement)

**Current Status:** Existing file uses Firecrawl adapters with V1/V2 switching
**Enhancement Plan:** Extend to support new scrapers while maintaining backward compatibility

**Key Enhancements Needed:**
1. Add new source types to `ScraperRequest` interface
2. Import new scraper classes
3. Add routing logic in `switch` statement
4. Update `getTableName()` mapping
5. Update `generateContentHashForRecord()` for new sources

**Enhanced Routing Logic:**
```typescript
switch (source) {
  // Existing sources (keep as-is for backward compatibility)
  case 'hksfc':
    if (use_v2) {
      scrapeResults = await scrapeHKSFCV2(limit, test_mode);
    } else {
      scrapeResults = await scrapeHKSFCV1(limit, test_mode);
    }
    break;

  // NEW: CCASS via specialized scraper
  case 'ccass-v2':
    const ccassScraper = new CCASScraper();
    scrapeResults = await ccassScraper.scrape({
      stockCodes: config.stockCodes || ['00700'],
      dateRange: config.dateRange
    });
    break;

  // NEW: SFC Stats via XLSX scraper
  case 'sfc-stats-v2':
    const statsScraper = new SFCStatsScraper();
    scrapeResults = await statsScraper.scrape({
      tableIds: config.tableIds || ['A1','A2','A3']
    });
    break;

  // NEW: SFC Filings via RSS scraper
  case 'sfc-filings-v2':
    const filingsScraper = new SFCFilingsScraper();
    scrapeResults = await filingsScraper.scrape({
      sources: config.sources || ['press-releases'],
      dateRange: config.dateRange
    });
    break;

  // NEW: HKEX DI via specialized scraper
  case 'hkex-di':
    const diScraper = new HKEXDIScraper();
    scrapeResults = await diScraper.scrape({
      companyCodes: config.companyCodes || ['00700'],
      dateRange: config.dateRange
    });
    break;
}
```

### 4.2 Retry Logic Enhancement

Add circuit breaker pattern to existing edge function:

```typescript
// Add at top of index.ts
const RETRY_CONFIG: Record<string, { maxRetries: number; backoffMs: number; timeout: number }> = {
  'ccass-v2': { maxRetries: 3, backoffMs: 2000, timeout: 30000 },
  'sfc-stats-v2': { maxRetries: 2, backoffMs: 5000, timeout: 60000 },
  'sfc-filings-v2': { maxRetries: 2, backoffMs: 3000, timeout: 45000 },
  'hkex-di': { maxRetries: 3, backoffMs: 3000, timeout: 45000 }
};

async function scrapeWithRetry(
  source: string,
  config: any,
  onProgress: (progress: number) => Promise<void>
): Promise<any[]> {
  const retryConfig = RETRY_CONFIG[source] || { maxRetries: 2, backoffMs: 3000, timeout: 45000 };
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= retryConfig.maxRetries; attempt++) {
    try {
      await onProgress(10 + (attempt * 20));

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), retryConfig.timeout);

      const result = await Promise.race([
        executeScraper(source, config),
        new Promise((_, reject) => {
          controller.signal.addEventListener('abort', () =>
            reject(new Error(`Timeout after ${retryConfig.timeout}ms`))
          );
        })
      ]) as any[];

      clearTimeout(timeoutId);
      return result;

    } catch (error: any) {
      lastError = error;
      console.error(`[Attempt ${attempt + 1}/${retryConfig.maxRetries + 1}] Failed:`, error.message);

      if (attempt < retryConfig.maxRetries) {
        const backoff = retryConfig.backoffMs * Math.pow(2, attempt);
        console.log(`Retrying in ${backoff}ms...`);
        await new Promise(resolve => setTimeout(resolve, backoff));
      }
    }
  }

  throw new Error(
    `Failed after ${retryConfig.maxRetries + 1} attempts: ${lastError?.message}`
  );
}
```

---

## 5. Frontend Implementation

### 5.1 Admin Dashboard Component

**File:** `src/components/HKDataScrapingDashboard.tsx` (new)

**Purpose:** WCAG 2.1 AA compliant admin interface for managing HK financial data scraping

**Component Structure:**
```tsx
HKDataScrapingDashboard/
├── Header (Quick Stats)
├── Source Cards Grid (4 cards)
│   ├── CCASS Shareholding Card
│   ├── SFC Statistics Card
│   ├── SFC Filings Card
│   └── HKEX DI Card
├── Real-time Job Monitor
│   ├── Active Jobs List
│   ├── Progress Bars
│   └── Status Badges
└── Scraping Config Modal
    ├── Source-specific Forms
    ├── Date Range Picker
    ├── Multi-select Inputs
    └── Submit Button
```

**Full Implementation:**
```typescript
import React, { useState, useEffect } from 'react';
import { useSupabaseClient } from '@supabase/auth-helpers-react';
import {
  Database, Activity, Calendar, TrendingUp,
  CheckCircle, AlertCircle, Clock, Play, Pause
} from 'lucide-react';

interface ScrapingJob {
  id: string;
  source: 'ccass' | 'sfc-stats' | 'sfc-filings' | 'hkex-di';
  config: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  dedup_count: number;
  inserted_count: number;
  error_message?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
}

interface ScrapingConfig {
  source: string;
  dateRange: { start: string; end: string };
  stockCodes?: string[];
  companyCodes?: string[];
  tableIds?: string[];
  sources?: string[];
  forceRescrape: boolean;
}

export function HKDataScrapingDashboard() {
  const supabase = useSupabaseClient();
  const [jobs, setJobs] = useState<ScrapingJob[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [activeSource, setActiveSource] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Real-time job updates
  useEffect(() => {
    // Load initial jobs
    loadJobs();

    // Subscribe to job updates
    const subscription = supabase
      .channel('scraping_jobs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scraping_jobs'
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setJobs(prev => [payload.new as ScrapingJob, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setJobs(prev =>
              prev.map(job =>
                job.id === payload.new.id ? (payload.new as ScrapingJob) : job
              )
            );
          }
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Load stats
  useEffect(() => {
    loadStats();
    const interval = setInterval(loadStats, 60000); // Refresh every minute
    return () => clearInterval(interval);
  }, []);

  async function loadJobs() {
    const { data } = await supabase
      .from('scraping_jobs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) setJobs(data);
  }

  async function loadStats() {
    const { data } = await supabase.rpc('get_scraping_stats', { p_days: 7 });
    if (data) setStats(data);
  }

  async function triggerScrape(config: ScrapingConfig) {
    setLoading(true);
    try {
      const { data, error } = await supabase.rpc('trigger_scraping_job', {
        p_source: config.source,
        p_config: {
          dateRange: config.dateRange,
          stockCodes: config.stockCodes,
          companyCodes: config.companyCodes,
          tableIds: config.tableIds,
          sources: config.sources,
          forceRescrape: config.forceRescrape
        }
      });

      if (error) throw error;

      console.log('Job triggered:', data);
      setActiveSource(null);
    } catch (error: any) {
      console.error('Failed to trigger scrape:', error);
      alert(`Error: ${error.message}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <header className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          HK Financial Data Scraping Control Center
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Manage and monitor automated scraping from HKEX, SFC, and regulatory sources
        </p>

        {/* Quick Stats */}
        {stats && (
          <div className="grid grid-cols-4 gap-4 mt-6">
            <StatCard
              icon={<Activity size={20} />}
              label="Jobs Today"
              value={jobs.filter(j => isToday(j.created_at)).length}
              color="teal"
            />
            <StatCard
              icon={<CheckCircle size={20} />}
              label="Success Rate"
              value={calculateSuccessRate(jobs)}
              color="green"
            />
            <StatCard
              icon={<Database size={20} />}
              label="Records Added (7d)"
              value={formatNumber(stats.reduce((sum: number, s: any) => sum + s.total_records_inserted, 0))}
              color="blue"
            />
            <StatCard
              icon={<Clock size={20} />}
              label="Next Scheduled"
              value={getNextScheduledTime()}
              color="yellow"
            />
          </div>
        )}
      </header>

      {/* Source Cards */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <SourceCard
          title="CCASS Shareholding Search"
          description="Stock participant holdings from HKEX CCASS system"
          icon={<TrendingUp size={24} />}
          color="teal"
          onConfigure={() => setActiveSource('ccass')}
        />
        <SourceCard
          title="SFC Statistics Tables"
          description="XLSX tables (A1-A3, C4-C5, D3-D4) from SFC website"
          icon={<Database size={24} />}
          color="blue"
          onConfigure={() => setActiveSource('sfc-stats')}
        />
        <SourceCard
          title="SFC Filings & RSS"
          description="Regulatory announcements, circulars, enforcement news"
          icon={<Calendar size={24} />}
          color="green"
          onConfigure={() => setActiveSource('sfc-filings')}
        />
        <SourceCard
          title="HKEX Disclosure of Interests"
          description="Substantial shareholder disclosure submissions"
          icon={<Activity size={24} />}
          color="pink"
          onConfigure={() => setActiveSource('hkex-di')}
        />
      </div>

      {/* Real-time Job Monitor */}
      <JobMonitor jobs={jobs} />

      {/* Config Modal */}
      {activeSource && (
        <ScrapingConfigModal
          source={activeSource}
          onClose={() => setActiveSource(null)}
          onSubmit={triggerScrape}
          loading={loading}
        />
      )}
    </div>
  );
}

// Continue with sub-components...
```

**Complete implementation file will be created separately with full accessibility features.**

---

## 6. Testing Strategy

### 6.1 Unit Tests

**Deduplication Logic Tests:**
```typescript
// Test file: supabase/functions/scrapers/tests/deduplication.test.ts
Deno.test('CCASS deduplication key generation', () => {
  const record1 = {
    stock_code: '00700',
    participant_id: 'C00001',
    shareholding_date: '2025-01-20'
  };

  const record2 = { ...record1 };

  const key1 = generateDedupKey('ccass', record1);
  const key2 = generateDedupKey('ccass', record2);

  assertEquals(key1, key2);
  assertEquals(key1.length, 64); // SHA-256 hash length
});
```

### 6.2 Integration Tests

**Edge Function Test:**
```typescript
// Test file: supabase/functions/unified-scraper/tests/integration.test.ts
Deno.test('SFC Stats scraper integration', async () => {
  const scraper = new SFCStatsScraper();

  const results = await scraper.scrape({
    tableIds: ['A1'],
    forceRefresh: false
  });

  assert(results.length > 0);
  assert(results[0].table_name === 'A1');
  assert(results[0].file_hash.length === 64);
  assert(typeof results[0].data === 'object');
});
```

### 6.3 E2E Tests

**Full Scraping Workflow:**
```typescript
// Test file: tests/e2e/scraping-workflow.test.ts
test('Complete CCASS scraping workflow', async ({ page }) => {
  // 1. Login
  await page.goto('/');
  await page.click('[data-testid="login-button"]');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('[type="submit"]');

  // 2. Navigate to scraping dashboard
  await page.click('[data-testid="scraping-nav"]');

  // 3. Open CCASS config modal
  await page.click('[data-testid="configure-ccass"]');

  // 4. Fill config form
  await page.fill('[name="start-date"]', '2025-01-01');
  await page.fill('[name="end-date"]', '2025-01-20');
  await page.fill('[name="stock-codes"]', '00700');

  // 5. Submit
  await page.click('[data-testid="submit-scrape"]');

  // 6. Wait for job to appear
  await page.waitForSelector('[data-testid="job-status"][data-status="running"]');

  // 7. Wait for completion (timeout 60s)
  await page.waitForSelector('[data-testid="job-status"][data-status="completed"]', {
    timeout: 60000
  });

  // 8. Verify inserted count
  const insertedCount = await page.textContent('[data-testid="inserted-count"]');
  expect(parseInt(insertedCount!)).toBeGreaterThan(0);
});
```

---

## 7. Deployment Checklist

### Phase 1: Database Setup ✅
- [ ] Apply SQL migration to production
- [ ] Verify all tables created with correct indexes
- [ ] Test RLS policies with test user account
- [ ] Configure app.settings for Supabase URL/key
- [ ] Verify pg_cron extension enabled

### Phase 2: Edge Functions ✅
- [ ] Create `scrapers/` directory in Supabase functions
- [ ] Deploy CCASScraper.ts
- [ ] Deploy SFCStatsScraper.ts
- [ ] Deploy SFCFilingsScraper.ts
- [ ] Deploy HKEXDIScraper.ts
- [ ] Update unified-scraper/index.ts with new routes
- [ ] Deploy unified-scraper function
- [ ] Test each scraper via Postman/curl

### Phase 3: Scheduling ✅
- [ ] Enable pg_cron jobs in production
- [ ] Verify daily SFC stats schedule (2 AM HKT)
- [ ] Verify weekly CCASS schedule (Sunday 3 AM HKT)
- [ ] Verify daily SFC filings schedule (10 AM HKT)
- [ ] Monitor first automated run logs

### Phase 4: Frontend ✅
- [ ] Create HKDataScrapingDashboard component
- [ ] Add to main App navigation
- [ ] Test real-time job updates
- [ ] Test all config modals (4 sources)
- [ ] Verify accessibility (WCAG 2.1 AA)
- [ ] Add to protected routes (auth required)

### Phase 5: Monitoring ✅
- [ ] Set up Sentry error tracking
- [ ] Configure Supabase log retention
- [ ] Create alerts for failed jobs
- [ ] Build analytics dashboard (Metabase/Grafana)
- [ ] Document troubleshooting procedures

---

## 8. Performance Optimization

### 8.1 Scraper Performance

**CCASS Optimization:**
- Batch stock codes into groups of 5
- Parallel scraping with concurrency limit
- Cache participant ID mappings

**SFC Stats Optimization:**
- Download all XLSX files in parallel
- Stream parsing for large files
- Cache file hashes to skip re-downloads

**Database Optimization:**
- Batch inserts (1000 records per transaction)
- Use COPY for bulk inserts
- Partition large tables by date

### 8.2 Query Performance

**Indexes Created:**
- All `dedup_key` columns (UNIQUE)
- Date columns (DESC for recent data)
- Stock/company code + date composite indexes
- GIN indexes for JSONB and array columns

**Materialized Views:**
- `ccass_latest_holdings` for current shareholdings
- Auto-refresh on data insert
- Concurrent refresh to avoid locks

---

## 9. Security Considerations

### 9.1 Rate Limiting

**Implemented:**
- CCASS: 10 requests/minute
- SFC Stats: 20 requests/minute
- SFC Filings: 20 requests/minute
- HKEX DI: 10 requests/minute

**Monitoring:**
- Log all rate limit errors
- Auto-retry with exponential backoff
- Alert if consistently hitting limits

### 9.2 Authentication

**RLS Policies:**
- ✅ Authenticated users can view data (SELECT)
- ✅ Authenticated users can trigger jobs (INSERT via RPC)
- ✅ Service role has full access (edge functions)
- ❌ Users cannot directly modify data tables

**Edge Function Security:**
- Service role key stored in environment
- CORS headers restrict origin
- Request validation before processing

---

## 10. Monitoring & Alerts

### 10.1 Key Metrics

**Track:**
- Job success rate (target: >95%)
- Average job duration per source
- Records inserted per job
- Deduplication rate
- Error rate by source

### 10.2 Alert Triggers

**Configure alerts for:**
1. Job failure rate >10% in 1 hour
2. Job duration >5x average
3. Zero records inserted (potential scraping issue)
4. pg_cron job missed (schedule failure)
5. Database connection errors

**Notification Channels:**
- Email to admin team
- Slack webhook
- Supabase dashboard

---

## 11. Troubleshooting Guide

### Common Issues

**Issue: CCASS scraper times out**
- **Cause:** HKEX server slow response
- **Solution:** Increase timeout in RETRY_CONFIG, reduce concurrent requests

**Issue: SFC Stats file hash duplicates**
- **Cause:** SFC hasn't updated file yet
- **Solution:** Expected behavior, deduplication working correctly

**Issue: pg_cron job not running**
- **Cause:** Timezone misconfiguration
- **Solution:** Verify cron expression uses UTC, not HKT

**Issue: RPC function permission denied**
- **Cause:** RLS policy blocking execution
- **Solution:** Verify GRANT EXECUTE to authenticated role

---

## 12. Future Enhancements

### Phase 2 Features (Post-Launch)

1. **Email Notifications**: Alert users when specific stocks/companies are updated
2. **Data Export**: CSV/Excel export of scraped data
3. **Historical Comparison**: Charts showing shareholding changes over time
4. **Smart Scheduling**: ML-based optimal scraping times
5. **Multi-tenant Support**: Allow multiple organizations with isolated data

### Performance Improvements

1. **Distributed Scraping**: Use worker pools for parallel execution
2. **CDN Caching**: Cache XLSX files for 24 hours
3. **GraphQL API**: More efficient data fetching for frontend
4. **Incremental Updates**: Only scrape changed data (delta sync)

---

## Appendix A: API Reference

### RPC Functions

**`trigger_scraping_job(p_source, p_config)`**
- **Description**: Manually trigger a scraping job
- **Parameters**:
  - `p_source`: 'ccass' | 'sfc-stats' | 'sfc-filings' | 'hkex-di'
  - `p_config`: JSONB configuration object
- **Returns**: UUID (job ID)
- **Example**:
  ```sql
  SELECT trigger_scraping_job(
    'ccass',
    '{"stockCodes": ["00700"], "dateRange": {"start": "2025-01-01", "end": "2025-01-20"}}'::JSONB
  );
  ```

**`get_scraping_stats(p_source, p_days)`**
- **Description**: Get scraping statistics
- **Parameters**:
  - `p_source`: Filter by source (optional)
  - `p_days`: Number of days to look back (default: 7)
- **Returns**: Table of statistics per source
- **Example**:
  ```sql
  SELECT * FROM get_scraping_stats('ccass', 30);
  ```

---

## Appendix B: Configuration Examples

### CCASS Configuration
```json
{
  "stockCodes": ["00700", "00941", "00388"],
  "dateRange": {
    "start": "2025-01-01",
    "end": "2025-01-20"
  },
  "forceRescrape": false
}
```

### SFC Stats Configuration
```json
{
  "tableIds": ["A1", "A2", "A3", "C4", "C5", "D3", "D4"],
  "forceRefresh": false
}
```

### SFC Filings Configuration
```json
{
  "sources": ["press-releases", "enforcement", "circulars", "virtual-assets"],
  "dateRange": {
    "start": "2025-01-01",
    "end": "2025-01-20"
  }
}
```

### HKEX DI Configuration
```json
{
  "companyCodes": ["00700", "00941"],
  "dateRange": {
    "start": "2025-01-01",
    "end": "2025-01-20"
  },
  "forceRescrape": false
}
```

---

**Document Version:** 1.0.0
**Last Updated:** 2025-01-20
**Status:** Implementation Ready
**Contributors:** BMad Master, Amelia (Developer), Winston (Architect), Sally (UX Designer), UI/UX Expert, Architecture Expert
