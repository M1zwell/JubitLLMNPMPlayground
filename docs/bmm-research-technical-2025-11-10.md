# Technical Research Report: Web Scraping Integration with Supabase

**Date**: 2025-11-10
**Project**: JubitLLMNPMPlayground
**Research Type**: Technical Architecture Research
**Workflow**: BMad Method - Phase 0: Discovery (Research)
**Researcher**: BMad Analyst Agent

---

## Executive Summary

This technical research report provides comprehensive analysis and recommendations for implementing a **multi-source web scraping system** integrated with **Supabase** (PostgreSQL + Edge Functions). The research covers 4 critical technical areas: web scraping architecture, data management strategies, Supabase integration patterns, and security/performance considerations.

### Key Recommendations

1. **Scraping Engine**: Continue dual-engine approach (Firecrawl primary, Puppeteer fallback) with Firecrawl for 80% of use cases
2. **Architecture**: Supabase Edge Functions with direct database insert pattern (Queue → Scrape → Parse → Insert → Notify)
3. **Scheduling**: Use Supabase pg_cron for automated scheduled scraping (≤8 concurrent jobs, ≤10 min each)
4. **Deduplication**: Content hash-based with PostgreSQL unique constraints and B-tree index deduplication
5. **Real-time Updates**: Use Supabase Realtime Broadcast (not Postgres Changes) for playground notifications
6. **Search**: PostgreSQL full-text search (FTS) with GIN indexes and tsvector columns
7. **Security**: Implement exponential backoff, rate limiting, and IP rotation for ethical scraping

### Technology Stack (Validated 2025)

| Component | Technology | Version/Status |
|-----------|-----------|----------------|
| **Scraping (Primary)** | Firecrawl API | 2025 (34K+ GitHub stars) |
| **Scraping (Fallback)** | Puppeteer | Latest (90K+ GitHub stars) |
| **Backend Runtime** | Supabase Edge Functions | Deno-based, 2025 |
| **Database** | PostgreSQL (via Supabase) | v14+ with pg_cron, pgvector |
| **Scheduling** | pg_cron | Built-in Supabase extension |
| **Real-time** | Supabase Realtime | WebSocket-based, 2025 |
| **Full-Text Search** | PostgreSQL FTS | Native with GIN indexes |
| **Deduplication** | SHA-256 + UNIQUE constraints | PostgreSQL v13+ B-tree dedup |

---

## Table of Contents

1. [Research Context](#research-context)
2. [Area 1: Web Scraping Architecture](#area-1-web-scraping-architecture)
3. [Area 2: Data Management Strategies](#area-2-data-management-strategies)
4. [Area 3: Supabase Integration Patterns](#area-3-supabase-integration-patterns)
5. [Area 4: Security & Performance](#area-4-security--performance)
6. [Comparative Analysis](#comparative-analysis)
7. [Recommendations & Decision Framework](#recommendations--decision-framework)
8. [Architecture Decision Records (ADRs)](#architecture-decision-records-adrs)
9. [Implementation Roadmap](#implementation-roadmap)
10. [References](#references)

---

## Research Context

### Project Background

**JubitLLMNPMPlayground** is a unified platform for exploring LLM models and NPM packages, combining:
- **Frontend**: React 18 + TypeScript + Vite (35 components)
- **Backend**: Supabase (PostgreSQL + 11 Edge Functions)
- **Current Features**: LLM Market (143+ models), NPM Marketplace (100+ packages), Multi-Model Chat, HK Financial Scraper

### Integration Goal

Enhance the platform with **multi-source web scraping** to aggregate data from:
1. **HKSFC** (Hong Kong Securities & Futures Commission) - News, enforcement actions, circulars
2. **HKEX** (Hong Kong Stock Exchange) - Company announcements, market stats, CCASS holdings
3. **Legal Sites** - Court cases, legislation updates, legal opinions
4. **NPM Registry** - Package metadata, download trends, security advisories
5. **LLM Config Sites** - Model specifications, pricing, benchmarks
6. **Local MySQL** - Existing proprietary datasets (migrate to Supabase)

### Technical Requirements

**Functional:**
- Scheduled non-real-time scraping (daily/weekly batch jobs)
- Direct database storage (Supabase PostgreSQL tables)
- Automatic deduplication on insert
- Real-time playground notifications when new data arrives
- Full-text search across all sources
- Cross-source correlation (e.g., link HKSFC enforcement to HKEX announcements)

**Non-Functional:**
- Handle 100K+ records per data source
- Sub-second query performance for playground searches
- 99.9% scraping reliability with auto-retry
- Minimal maintenance overhead (self-healing scrapers preferred)

**Constraints:**
- Platform: Supabase (cannot change)
- Existing scraping: Firecrawl API + Puppeteer already implemented
- Budget: Prefer open-source, minimize API costs
- Timeline: Phase 1 implementation in 4-6 weeks

---

## Area 1: Web Scraping Architecture

### 1.1 Architecture Patterns (2025)

**Source**: [ScraperAPI Best Practices](https://www.scraperapi.com/web-scraping/best-practices/), [Research AIMMultiple](https://research.aimultiple.com/large-scale-web-scraping/)

Modern web scraping follows **three fundamental architectural approaches**:

#### **Pattern A: HTTP-based Scraping**
```
HTTP Request → Receive HTML → Parse DOM (CSS/XPath) → Extract Data
```
- **Pros**: Lightweight, fast (ms latency), low resource usage
- **Cons**: Cannot handle JavaScript-rendered content, fails on dynamic sites
- **Use Cases**: Static content (HKSFC news, legal documents)

#### **Pattern B: Browser Automation**
```
Launch Browser → Navigate → Wait for JS → Interact → Extract Data
```
- **Pros**: Handles dynamic content, executes JavaScript, can interact with UI
- **Cons**: Heavy (200-500MB RAM per instance), slow (seconds latency)
- **Use Cases**: JavaScript-heavy sites (HKEX with dynamic tables, NPM search)

#### **Pattern C: Distributed Scraping**
```
URL Queue (Kafka/RabbitMQ) → Worker Pool → Scraper Instances → Data Pipeline
```
- **Pros**: Scales to millions of pages, fault-tolerant, parallel processing
- **Cons**: Complex infrastructure, operational overhead
- **Use Cases**: Large-scale scraping (not needed for 6 sources)

### 1.2 Recommended Pattern for Your Use Case

**Hybrid Approach: Dual-Engine with Queue-Based Orchestration**

```
┌─────────────────────────────────────────────────────────────┐
│  Supabase pg_cron Scheduler (Daily/Weekly triggers)         │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Edge Function: unified-scraper                             │
│  ├─ Routing Logic (select engine per source)                │
│  ├─ Engine A: Firecrawl API (HKSFC, Legal, NPM, LLM)       │
│  └─ Engine B: Puppeteer (HKEX dynamic tables)               │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Parser & Validator                                         │
│  ├─ HTML → Structured Data (JSON)                           │
│  ├─ Data Validation (required fields, types)                │
│  └─ Deduplication Check (SHA-256 hash)                      │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase PostgreSQL (Direct Insert)                        │
│  ├─ hksfc_filings                                           │
│  ├─ hkex_announcements                                      │
│  ├─ legal_cases                                             │
│  ├─ npm_packages_scraped                                    │
│  ├─ llm_configs                                             │
│  └─ scrape_logs (metadata, errors)                          │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│  Supabase Realtime Broadcast                                │
│  └─ Notify Playground: "new_data_available"                 │
└─────────────────────────────────────────────────────────────┘
```

**Rationale**:
- **Firecrawl for 80%**: Static content (HKSFC, legal, NPM, LLM) - fast, low-code, API-based
- **Puppeteer for 20%**: Dynamic content (HKEX tables) - when Firecrawl cannot extract properly
- **Edge Functions**: Serverless execution, auto-scaling, near-database processing
- **Direct Insert**: No intermediate CSV files, data immediately queryable

### 1.3 Technology Comparison: Firecrawl vs Puppeteer

**Sources**: [Firecrawl Blog](https://www.firecrawl.dev/blog/best-open-source-web-scraping-libraries), [Browser Automation Tools Comparison](https://www.firecrawl.dev/blog/browser-automation-tools-comparison-2025)

| Dimension | Firecrawl | Puppeteer |
|-----------|-----------|-----------|
| **Type** | Cloud API | Self-hosted library |
| **GitHub Stars** | 34K+ (2025) | 90K+ (2025) |
| **Development Time** | 2-3 days for typical project | 3-4 weeks for equivalent |
| **Code Volume** | 10-50 lines | 100-500 lines (5-10x more) |
| **Output Format** | Clean Markdown/JSON (LLM-ready) | Raw HTML (requires parsing) |
| **JavaScript Handling** | Built-in (cloud browsers) | Full control (headless Chrome) |
| **Anti-Bot Bypass** | Built-in (managed service) | Manual (requires libraries) |
| **Resource Usage** | Zero (cloud-based) | 200-500MB RAM per instance |
| **Maintenance** | Managed (automatic updates) | High (script breakage on site changes) |
| **Performance** | 50x faster on complex sites | Slower (browser overhead) |
| **Cost** | API pricing (pay per request) | Infrastructure costs (Deno RAM) |
| **Use Case Fit** | Static content extraction | Browser automation, testing, screenshots |

**Decision**: [Verified 2025 source]
- **Primary Engine**: Firecrawl (80% of sources) - fastest development, lowest maintenance
- **Fallback Engine**: Puppeteer (20% of sources) - when Firecrawl fails or for complex interactions

### 1.4 Best Practices for Scraping (2025)

**Sources**: [ScraperAPI](https://www.scraperapi.com/web-scraping/best-practices/), [Medium - DOs and DON'Ts](https://medium.com/@datajournal/dos-and-donts-of-web-scraping-e4f9b2a49431)

#### **Asynchronous Architecture** [High Confidence]
- Send multiple requests concurrently rather than sequentially
- **Impact**: 10-100x throughput improvement
- **Implementation**: Use Deno's `Promise.all()` for parallel scraping

#### **Rate Limiting & Throttling** [High Confidence]
- Adaptive rate limits based on website response times
- Recommended: 1-2 requests/second per domain
- **Implementation**: Exponential backoff on 429 errors (see Section 4.2)

#### **IP Rotation** [Medium Confidence - depends on target sites]
- Switch IPs to avoid blocks (if scraping at scale)
- **Not needed for your use case**: 6 sources, non-aggressive scraping (daily/weekly)
- **Alternative**: Use Firecrawl's built-in proxy rotation

#### **Ethical Scraping** [High Confidence]
- Respect `robots.txt` (check allowed paths)
- Prefer official APIs when available (e.g., NPM registry has official API)
- Rate-limit to avoid DDoS-like behavior
- User-Agent: Identify your scraper with contact email

#### **AI-Powered Scrapers** [Low Confidence - emerging trend]
- LLM-based scrapers understand page semantics (89% accuracy on new structures)
- **Future consideration**: Self-healing scrapers when HTML changes (see Section 1.5)
- **Not recommended for Phase 1**: Adds complexity, unproven at scale

### 1.5 Self-Healing Scrapers (Advanced)

**Concept**: Scrapers that auto-fix when website HTML structure changes

**Traditional Scraper** (brittle):
```typescript
const title = page.querySelector('.news-title'); // Breaks if class changes
```

**Self-Healing Scraper** (resilient):
```typescript
// LLM analyzes page, identifies title element even if selectors change
const title = await llm.extract(html, { field: 'title', examples: [...] });
```

**Pros**:
- Zero maintenance when sites change structure
- Adapts to new page layouts automatically

**Cons**:
- LLM API costs (~$0.01 per scrape vs $0.001 rule-based)
- Slower (LLM inference adds 1-3 seconds)
- Unproven reliability (89% accuracy = 11% failure rate)

**Recommendation**:
- ❌ **Not for Phase 1** - adds complexity, unproven ROI
- ✅ **Consider for Phase 3** - if maintenance burden becomes high (>10 hrs/month fixing broken scrapers)

---

## Area 2: Data Management Strategies

### 2.1 Database Schema Design for Scraped Data

**Sources**: [Web Scraping to SQL](https://crawlbase.com/blog/web-scraping-to-sql-store-and-analyze-data/), [StackOverflow - Database Design](https://stackoverflow.com/questions/25032294/database-design-suggestions-for-a-data-scraping-warehouse-application)

#### **SQL vs NoSQL Decision**

| Factor | SQL (PostgreSQL) | NoSQL (MongoDB) |
|--------|------------------|-----------------|
| **Data Structure** | Highly structured, fixed schema | Flexible, changing schema |
| **Relationships** | Strong (foreign keys, joins) | Weak (embedded documents) |
| **Query Complexity** | Complex (JOINs, aggregations) | Simple (key-value lookups) |
| **Full-Text Search** | Native (PostgreSQL FTS) | Requires Atlas Search |
| **Your Use Case Fit** | ✅ **Perfect match** | ❌ Overkill |

**Decision**: PostgreSQL (via Supabase) ✅
- Structured data (news, announcements, cases have predictable schemas)
- Cross-source correlation requires JOINs (HKSFC ↔ HKEX by company)
- Already using Supabase PostgreSQL (no migration needed)

#### **Recommended Schema Design**

**Pattern: One Table Per Data Source** (not one table for all scraped data)

**Rationale**:
- Different schemas (HKSFC news ≠ HKEX announcements ≠ legal cases)
- Easier to query (no type filtering needed)
- Better performance (smaller indexes, faster queries)
- Cleaner RLS policies (per-table security rules)

**Schema Example**:

```sql
-- HKSFC Filings Table
CREATE TABLE hksfc_filings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Content Fields
  title text NOT NULL,
  content text,
  filing_type text, -- 'news', 'enforcement', 'circular'
  company_code text, -- '0001', '0700', etc. (for correlation)
  company_name text,
  filing_date date,
  url text UNIQUE NOT NULL,

  -- Metadata Fields
  content_hash text UNIQUE NOT NULL, -- SHA-256 for deduplication
  scraped_at timestamptz DEFAULT now(),
  first_seen timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now(),

  -- Full-Text Search
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
  ) STORED
);

-- Indexes
CREATE INDEX idx_hksfc_filing_date ON hksfc_filings(filing_date DESC);
CREATE INDEX idx_hksfc_company_code ON hksfc_filings(company_code) WHERE company_code IS NOT NULL;
CREATE UNIQUE INDEX idx_hksfc_content_hash ON hksfc_filings(content_hash);
CREATE INDEX idx_hksfc_search_vector ON hksfc_filings USING GIN(search_vector);

-- Trigger for last_seen update on re-scrape
CREATE OR REPLACE FUNCTION update_last_seen()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_seen = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hksfc_filings_update_last_seen
  BEFORE UPDATE ON hksfc_filings
  FOR EACH ROW
  EXECUTE FUNCTION update_last_seen();
```

**Similar tables**: `hkex_announcements`, `legal_cases`, `npm_packages_scraped`, `llm_configs`

#### **Unified View for Cross-Source Queries**

```sql
-- Create view for searching across all sources
CREATE VIEW all_scraped_data AS
SELECT
  id,
  'hksfc' as source,
  title,
  content,
  url,
  scraped_at,
  search_vector
FROM hksfc_filings

UNION ALL

SELECT
  id,
  'hkex' as source,
  announcement_title as title,
  announcement_content as content,
  url,
  scraped_at,
  search_vector
FROM hkex_announcements

UNION ALL

SELECT
  id,
  'legal' as source,
  case_title as title,
  case_facts as content,
  url,
  scraped_at,
  search_vector
FROM legal_cases

-- ... (npm, llm sources)
```

**Usage**:
```sql
-- Search across all sources
SELECT * FROM all_scraped_data
WHERE search_vector @@ plainto_tsquery('fraud investigation')
ORDER BY scraped_at DESC
LIMIT 50;
```

### 2.2 Deduplication Strategies

**Sources**: [PostgreSQL Deduplication](https://www.alibabacloud.com/blog/postgresql-data-deduplication-methods_596032), [B-tree Index Deduplication](https://www.cybertec-postgresql.com/en/b-tree-index-deduplication/)

#### **Problem**: Re-scraping Creates Duplicates

When scraping daily, the same articles/announcements appear again:
- Day 1: Scrape HKSFC → 50 articles
- Day 2: Re-scrape HKSFC → 30 new + **50 duplicate** articles
- Without dedup: 130 records (50 duplicates)

#### **Solution A: Content Hash-Based Deduplication** (Recommended)

**Approach**: Hash article content (SHA-256), use UNIQUE constraint

```sql
-- Add content hash column (already in schema above)
ALTER TABLE hksfc_filings
  ADD COLUMN content_hash text UNIQUE NOT NULL;

-- Create unique index (prevents duplicates)
CREATE UNIQUE INDEX idx_hksfc_content_hash
  ON hksfc_filings(content_hash);
```

**Scraper Logic** (Edge Function):
```typescript
import { createHash } from 'crypto';

async function insertScrapedData(article: Article) {
  // Hash content for deduplication
  const contentHash = createHash('sha256')
    .update(article.title + article.content + article.url)
    .digest('hex');

  // UPSERT: Insert if new, update last_seen if exists
  const { data, error } = await supabase
    .from('hksfc_filings')
    .upsert({
      title: article.title,
      content: article.content,
      url: article.url,
      filing_date: article.date,
      content_hash: contentHash,
      last_seen: new Date()
    }, {
      onConflict: 'content_hash' // Update if hash exists
    });

  return { data, error };
}
```

**Benefits**:
- Zero duplicates (enforced by database constraint)
- Tracks first_seen and last_seen (know when data appeared/disappeared)
- Fast lookups (unique index on hash)

**PostgreSQL v13+ Optimization**: [Verified 2025 source]
- B-tree index deduplication automatically reduces index size for repeated values
- Saves disk space and RAM (index cached in shared buffers)
- No configuration needed (enabled by default)

#### **Solution B: URL-Based Deduplication** (Alternative)

If article URL is stable:

```sql
CREATE UNIQUE INDEX idx_hksfc_url ON hksfc_filings(url);
```

**Pros**: Simpler (no hash calculation)
**Cons**: Fails if URL changes but content stays same (rare but possible)

**Recommendation**: Use content hash (more robust)

#### **Performance Benchmark** [Verified 2025 source]

For UUID-like strings:
- Plain UNIQUE constraint: 32-50 seconds for 1M inserts
- Hash-based UNIQUE: 12-16 seconds for 1M inserts
- **Improvement**: 2-3x faster

### 2.3 Data Versioning & Change Tracking

**Use Case**: Track when scraped data changes over time

**Example**: HKSFC enforcement action updated with new penalty amount

#### **Pattern A: History Table** (Full Versioning)

```sql
-- Main table (current version)
CREATE TABLE hksfc_filings (
  id uuid PRIMARY KEY,
  title text,
  content text,
  -- ... fields
  version int DEFAULT 1
);

-- History table (all versions)
CREATE TABLE hksfc_filings_history (
  id uuid, -- Same as main table
  version int,
  title text,
  content text,
  -- ... fields
  valid_from timestamptz,
  valid_to timestamptz,
  PRIMARY KEY (id, version)
);

-- Trigger to archive on update
CREATE OR REPLACE FUNCTION archive_version()
RETURNS TRIGGER AS $$
BEGIN
  -- Insert old version to history
  INSERT INTO hksfc_filings_history
  SELECT OLD.*, now() AS valid_to;

  -- Increment version
  NEW.version = OLD.version + 1;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hksfc_archive_on_update
  BEFORE UPDATE ON hksfc_filings
  FOR EACH ROW
  WHEN (OLD.* IS DISTINCT FROM NEW.*)
  EXECUTE FUNCTION archive_version();
```

**Query Historical Data**:
```sql
-- Get all versions of record
SELECT * FROM hksfc_filings_history
WHERE id = 'abc-123'
ORDER BY version;

-- Get version at specific date
SELECT * FROM hksfc_filings_history
WHERE id = 'abc-123'
  AND valid_from <= '2024-06-01'
  AND (valid_to IS NULL OR valid_to >= '2024-06-01');
```

**Pros**: Complete audit trail, temporal queries
**Cons**: Storage overhead (2x space), complex queries

#### **Pattern B: Change Detection Only** (Lightweight)

```sql
-- Just track if content changed
ALTER TABLE hksfc_filings
  ADD COLUMN change_count int DEFAULT 0,
  ADD COLUMN last_changed timestamptz;

CREATE OR REPLACE FUNCTION detect_content_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.content_hash IS DISTINCT FROM NEW.content_hash THEN
    NEW.change_count = OLD.change_count + 1;
    NEW.last_changed = now();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

**Pros**: Minimal storage overhead
**Cons**: No historical data (only know *that* it changed, not *what* changed)

**Recommendation for Phase 1**:
- ✅ **Pattern B** (change detection only) - simpler, sufficient for most use cases
- 🔄 **Pattern A** (full versioning) - if regulatory compliance requires audit trail

### 2.4 Scheduled Scraping with pg_cron

**Sources**: [Supabase pg_cron Docs](https://supabase.com/docs/guides/database/extensions/pg_cron), [Scheduling Edge Functions](https://supabase.com/docs/guides/functions/schedule-functions)

#### **Supabase pg_cron Limits** [Verified 2025 source]

- **Max concurrent jobs**: 8
- **Max job duration**: 10 minutes per job
- **Scheduling**: Standard cron syntax (minute, hour, day, month, weekday)
- **Job storage**: `cron.job` table
- **Run history**: `cron.job_run_details` table

#### **Recommended Schedule**

Based on your 6 data sources and update frequency needs:

| Source | Update Frequency | Cron Expression | Rationale |
|--------|-----------------|-----------------|-----------|
| **HKSFC News** | Daily (9 AM HKT) | `0 1 * * *` (9 AM HKT = 1 AM UTC) | Business days only |
| **HKEX Announcements** | Every 6 hours | `0 */6 * * *` | Market hours + after-hours |
| **Legal Cases** | Weekly (Sunday) | `0 2 * * 0` | Low update frequency |
| **NPM Packages** | Weekly (Monday) | `0 3 * * 1` | Only tracked packages |
| **LLM Configs** | Monthly (1st day) | `0 4 1 * *` | Pricing changes rare |
| **MySQL Sync** | Manual trigger | N/A | One-time migration |

**Total**: 5 scheduled jobs (well under 8 limit)

#### **Implementation**

**Step 1: Create Edge Function Wrapper**

```typescript
// supabase/functions/scheduled-scraper/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const { source } = await req.json(); // 'hksfc', 'hkex', etc.

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  try {
    // Call main scraping logic
    const result = await scrapeSource(source);

    // Log success
    await supabase.from('scrape_logs').insert({
      source,
      status: 'success',
      records_inserted: result.count,
      duration_ms: result.duration
    });

    return new Response(JSON.stringify({ success: true }), {
      headers: { 'Content-Type': 'application/json' }
    });
  } catch (error) {
    // Log error
    await supabase.from('scrape_logs').insert({
      source,
      status: 'error',
      error_message: error.message
    });

    return new Response(JSON.stringify({ error: error.message }), {
      status: 500
    });
  }
});
```

**Step 2: Schedule with pg_cron**

```sql
-- HKSFC daily scrape at 9 AM HKT (1 AM UTC)
SELECT cron.schedule(
  'scrape-hksfc-daily',
  '0 1 * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/scheduled-scraper',
    body := '{"source": "hksfc"}'::jsonb,
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);

-- HKEX every 6 hours
SELECT cron.schedule(
  'scrape-hkex-6hourly',
  '0 */6 * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/scheduled-scraper',
    body := '{"source": "hkex"}'::jsonb,
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);

-- Legal cases weekly (Sunday 2 AM UTC)
SELECT cron.schedule(
  'scrape-legal-weekly',
  '0 2 * * 0',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/scheduled-scraper',
    body := '{"source": "legal"}'::jsonb,
    headers := '{"Authorization": "Bearer YOUR_ANON_KEY"}'::jsonb
  );
  $$
);
```

**Step 3: Monitor Job Status**

```sql
-- View scheduled jobs
SELECT * FROM cron.job;

-- View job run history (last 10 runs)
SELECT
  job_id,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;

-- View scrape logs (custom table)
SELECT * FROM scrape_logs
ORDER BY created_at DESC
LIMIT 20;
```

#### **Security Best Practice** [Verified 2025 source]

Store auth tokens in **Supabase Vault** (not hardcoded in SQL):

```sql
-- Store secret
SELECT vault.create_secret('SCHEDULED_SCRAPER_AUTH_TOKEN', 'your-secret-token');

-- Use in cron job
SELECT cron.schedule(
  'scrape-hksfc-daily',
  '0 1 * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/scheduled-scraper',
    body := '{"source": "hksfc"}'::jsonb,
    headers := jsonb_build_object(
      'Authorization',
      'Bearer ' || vault.decrypted_secrets('SCHEDULED_SCRAPER_AUTH_TOKEN')
    )
  );
  $$
);
```

---

## Area 3: Supabase Integration Patterns

### 3.1 Edge Functions Best Practices

**Sources**: [Supabase Edge Functions Docs](https://supabase.com/docs/guides/functions), [Limits](https://supabase.com/docs/guides/functions/limits), [Best Practices](https://www.leanware.co/insights/supabase-best-practices)

#### **Edge Function Limits** [Verified 2025 source]

| Limit | Value | Impact on Your Use Case |
|-------|-------|-------------------------|
| **CPU time** | 2 seconds per request | ✅ Scraping: 1-5 sec (may exceed if complex) |
| **Wall clock time** | 400 seconds total | ✅ Sufficient for batch scraping |
| **Request idle timeout** | 150 seconds | ✅ Network requests covered |
| **Memory** | ~500 MB | ✅ Parsing HTML fits easily |
| **Max function size** | 20 MB bundled | ✅ Firecrawl SDK + deps < 5 MB |
| **Outgoing ports** | NOT 25, 587 (email) | ✅ HTTP/HTTPS (80, 443) allowed |

#### **Best Practices** [High Confidence]

**1. Code Organization**
```
supabase/functions/
├── _shared/              # Shared utilities
│   ├── supabase.ts      # Supabase client
│   ├── firecrawl.ts     # Firecrawl wrapper
│   └── parsers.ts       # HTML parsers
├── hk-scraper/          # Existing function (expand)
│   └── index.ts
└── scheduled-scraper/   # New cron wrapper
    └── index.ts
```

**2. Performance Optimization**

**❌ Bad**: Synchronous scraping
```typescript
for (const url of urls) {
  const data = await scrape(url); // Sequential: 30 URLs = 30 seconds
  await insert(data);
}
```

**✅ Good**: Parallel scraping
```typescript
const results = await Promise.all(
  urls.map(url => scrape(url)) // Parallel: 30 URLs = 3 seconds
);
await insertBatch(results);
```

**3. Handle Edge Function Timeouts**

For heavy scraping (>400 seconds):

**Option A**: Break into smaller jobs
```typescript
// Scrape in batches
const batchSize = 50; // Scrape 50 articles per job
const batches = chunk(allUrls, batchSize);

for (const batch of batches) {
  await invoke('scheduled-scraper', { urls: batch });
}
```

**Option B**: Use Database Functions for heavy processing
```sql
-- Complex aggregations run in database (no Edge Function timeout)
CREATE OR REPLACE FUNCTION process_scraped_data()
RETURNS void AS $$
BEGIN
  -- Heavy data processing here
END;
$$ LANGUAGE plpgsql;

-- Call from Edge Function
await supabase.rpc('process_scraped_data');
```

**4. Dependency Optimization**

**❌ Bad**: Import entire package
```typescript
import _ from 'lodash'; // Entire library (~500 KB)
```

**✅ Good**: Import specific functions
```typescript
import chunk from 'lodash/chunk'; // Only chunk (~5 KB)
```

**5. Error Handling**

```typescript
try {
  const data = await scrapeHKSFC();
  await supabase.from('hksfc_filings').insert(data);
} catch (error) {
  // Log error to database
  await supabase.from('scrape_logs').insert({
    source: 'hksfc',
    status: 'error',
    error_message: error.message,
    error_stack: error.stack
  });

  // Return error response
  return new Response(
    JSON.stringify({ error: error.message }),
    { status: 500, headers: { 'Content-Type': 'application/json' } }
  );
}
```

### 3.2 Supabase Realtime Integration

**Sources**: [Realtime Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes), [Benchmarks](https://supabase.com/docs/guides/realtime/benchmarks)

#### **Critical Recommendation: Use Broadcast, Not Postgres Changes** [High Confidence]

**Why?**
- **Postgres Changes**: Every change event checked against user RLS policies (slow at scale)
- **Broadcast**: Lightweight WebSocket messages (no database queries)

**Supabase Recommendation** [Verified 2025 source]:
> "Consider using Broadcast for most use cases, as Postgres Changes have some limitations as your application scales."

#### **Implementation Pattern**

**Step 1: Edge Function Broadcasts After Insert**

```typescript
// supabase/functions/scheduled-scraper/index.ts
async function scrapeAndNotify(source: string) {
  // Scrape data
  const articles = await scrapeSource(source);

  // Insert to database
  const { data, error } = await supabase
    .from(`${source}_data`)
    .insert(articles);

  if (!error) {
    // Broadcast to playground
    const channel = supabase.channel('scrape-updates');
    await channel.send({
      type: 'broadcast',
      event: 'new_data',
      payload: {
        source: source,
        count: articles.length,
        timestamp: new Date().toISOString()
      }
    });
  }
}
```

**Step 2: Playground Subscribes to Broadcasts**

```typescript
// src/components/IntegratedPlaygroundHub.tsx
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';

function DataPlayground() {
  const [newDataNotification, setNewDataNotification] = useState(null);

  useEffect(() => {
    // Subscribe to broadcast channel
    const channel = supabase
      .channel('scrape-updates')
      .on('broadcast', { event: 'new_data' }, (payload) => {
        // Show toast notification
        setNewDataNotification({
          source: payload.payload.source,
          count: payload.payload.count
        });

        // Auto-refresh data (optional)
        refetchData();
      })
      .subscribe();

    // Cleanup on unmount
    return () => {
      channel.unsubscribe();
    };
  }, []);

  return (
    <div>
      {newDataNotification && (
        <Toast>
          New data available: {newDataNotification.count} records from {newDataNotification.source}
        </Toast>
      )}
      {/* Data display */}
    </div>
  );
}
```

**Benefits**:
- ✅ No RLS overhead (broadcast doesn't query database)
- ✅ Low latency (WebSocket push)
- ✅ Scalable (100K+ concurrent connections supported)

#### **Alternative: Postgres Changes (If Needed)**

If you need to listen to specific row changes:

```typescript
// Listen to inserts on hksfc_filings
const channel = supabase
  .channel('hksfc-changes')
  .on('postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'hksfc_filings',
      filter: 'filing_type=eq.enforcement' // Optional filter
    },
    (payload) => {
      console.log('New enforcement action:', payload.new);
    }
  )
  .subscribe();
```

**Limitations**:
- Max 100 values for filters using `= ANY`
- RLS policies checked for every event (performance impact)
- Cannot resubscribe same channel (create new instance)

**Recommendation**: Use Broadcast for general notifications, Postgres Changes only for specific row monitoring

### 3.3 PostgreSQL Full-Text Search (FTS)

**Sources**: [PostgreSQL FTS Performance](https://blog.vectorchord.ai/postgresql-full-text-search-fast-when-done-right-debunking-the-slow-myth), [Optimization Guide](https://blog.poespas.me/posts/2024/04/30/optimize-postgresql-fts-search-performance/)

#### **Performance Benchmark** [Verified 2025 source]

- **Optimized FTS**: ~50x speed improvement over unindexed search
- **200M rows**: Sub-second query times with proper indexes
- **GIN index build**: Fast with `maintenance_work_mem` tuning

#### **Implementation Steps**

**Step 1: Add tsvector Column**

Already in schema (Section 2.1):
```sql
ALTER TABLE hksfc_filings
  ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
  ) STORED;
```

**Step 2: Create GIN Index** (Recommended over GiST)

```sql
CREATE INDEX idx_hksfc_search_vector
  ON hksfc_filings
  USING GIN(search_vector);

-- Performance tuning for index build
SET maintenance_work_mem = '1GB'; -- Increase for faster index creation
```

**Why GIN over GiST?** [Verified 2025 source]
- **GIN**: Fast lookups, ideal for read-heavy workloads (your use case)
- **GiST**: Smaller indexes, faster updates, but slower queries (lossy matching)

**Step 3: Optimize for Read-Heavy Workloads**

```sql
-- Disable fastupdate for better read performance
ALTER INDEX idx_hksfc_search_vector SET (fastupdate = off);
```

**Step 4: Query with Full-Text Search**

```typescript
// Search across all HKSFC filings
const { data, error } = await supabase
  .from('hksfc_filings')
  .select('*')
  .textSearch('search_vector', 'fraud investigation', {
    type: 'websearch', // Supports "and", "or", quotes
    config: 'english'
  })
  .order('scraped_at', { ascending: false })
  .limit(50);
```

**SQL Equivalent**:
```sql
SELECT * FROM hksfc_filings
WHERE search_vector @@ websearch_to_tsquery('english', 'fraud investigation')
ORDER BY scraped_at DESC
LIMIT 50;
```

**Step 5: Ranked Search (Relevance Scoring)**

```sql
SELECT
  id,
  title,
  ts_rank(search_vector, query) as relevance
FROM hksfc_filings,
     websearch_to_tsquery('english', 'fraud investigation') query
WHERE search_vector @@ query
ORDER BY relevance DESC
LIMIT 50;
```

**Note**: Ranking adds overhead - use only when needed (search results page), not for simple existence checks

#### **Multi-Table Search (Across All Sources)**

Use unified view from Section 2.1:

```typescript
const { data } = await supabase
  .from('all_scraped_data') // View combining all sources
  .select('*')
  .textSearch('search_vector', 'company investigation')
  .limit(100);
```

**Performance**:
- 6 sources × 100K records = 600K total rows
- With GIN indexes: Sub-second queries (verified for 200M+ rows)

#### **Maintenance**

```sql
-- Regularly vacuum to maintain performance
VACUUM ANALYZE hksfc_filings;
VACUUM ANALYZE hkex_announcements;
-- ... (all scraped data tables)
```

**Automated**: Supabase runs autovacuum by default (no manual intervention needed)

---

## Area 4: Security & Performance

### 4.1 Web Scraping Security & Ethics

**Sources**: [Bypass Bot Detection](https://www.zenrows.com/blog/bypass-bot-detection), [Anti-Scraping Protection](https://rebrowser.net/blog/anti-scraping-protection-from-basic-defense-to-advanced-implementation)

#### **Bot Detection Methods (2025)** [High Confidence]

Modern websites use sophisticated detection:

1. **Rate Limiting**: Track requests per IP/User-Agent
2. **Behavioral Analysis**: Mouse movements, scroll patterns (not applicable to backend scraping)
3. **JavaScript Challenges**: Cloudflare, reCAPTCHA
4. **Device Fingerprinting**: CPU, battery, accelerometer data (browser-only)
5. **AI/ML Detection**: Analyze request patterns, timing, headers

#### **Ethical Scraping Best Practices** [High Confidence]

**1. Respect robots.txt**

```typescript
// Check robots.txt before scraping
import robotsParser from 'robots-parser';

async function canScrape(url: string): Promise<boolean> {
  const robotsUrl = new URL('/robots.txt', url).href;
  const response = await fetch(robotsUrl);
  const robotsTxt = await response.text();

  const robots = robotsParser(robotsUrl, robotsTxt);
  return robots.isAllowed(url, 'JubitScraper/1.0'); // Your User-Agent
}
```

**2. Use Informative User-Agent**

```typescript
const headers = {
  'User-Agent': 'JubitScraper/1.0 (+https://chathogs.com/scraper-info; contact@yourproject.com)'
};
```

**3. Rate Limiting** (see Section 4.2)

**4. Prefer Official APIs**

For NPM packages:
```typescript
// ✅ Use official NPM registry API
const response = await fetch('https://registry.npmjs.org/react');
const packageData = await response.json();

// ❌ Don't scrape npmjs.com website
```

### 4.2 Rate Limiting & Exponential Backoff

**Sources**: [Exponential Backoff Guide](https://substack.thewebscraping.club/p/rate-limit-scraping-exponential-backoff), [Retry Strategies](https://www.zenrows.com/blog/python-requests-retry)

#### **Exponential Backoff Algorithm**

**Formula**: `wait_time = backoff_factor × (2 ** retry_attempt) + random_jitter`

**Example**:
- Attempt 1: 1 × 2^0 = 1 second + jitter
- Attempt 2: 1 × 2^1 = 2 seconds + jitter
- Attempt 3: 1 × 2^2 = 4 seconds + jitter
- Attempt 4: 1 × 2^3 = 8 seconds + jitter

**Jitter**: Small random delay (0-1 sec) to avoid "retry storm" (multiple clients retrying simultaneously)

#### **Implementation** (TypeScript/Deno)

```typescript
async function fetchWithRetry(
  url: string,
  options: RequestInit = {},
  maxRetries = 3,
  backoffFactor = 1
): Promise<Response> {

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        signal: AbortSignal.timeout(30000) // 30 second timeout
      });

      // Success
      if (response.ok) {
        return response;
      }

      // 429 Too Many Requests - retry with backoff
      if (response.status === 429 && attempt < maxRetries) {
        const waitTime = backoffFactor * (2 ** attempt) * 1000; // Convert to ms
        const jitter = Math.random() * 1000; // 0-1 sec jitter

        console.log(`Rate limited. Retrying in ${(waitTime + jitter) / 1000}s...`);
        await new Promise(resolve => setTimeout(resolve, waitTime + jitter));
        continue;
      }

      // 5xx Server Error - retry
      if (response.status >= 500 && attempt < maxRetries) {
        const waitTime = backoffFactor * (2 ** attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      // 4xx Client Error (except 429) - don't retry
      if (response.status >= 400) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;

    } catch (error) {
      // Network error - retry
      if (attempt < maxRetries) {
        const waitTime = backoffFactor * (2 ** attempt) * 1000;
        await new Promise(resolve => setTimeout(resolve, waitTime));
        continue;
      }

      // Max retries exceeded
      throw error;
    }
  }

  throw new Error(`Max retries (${maxRetries}) exceeded for ${url}`);
}
```

**Usage**:
```typescript
const response = await fetchWithRetry('https://www.sfc.hk/en/News-and-announcements', {
  headers: { 'User-Agent': 'JubitScraper/1.0' }
}, 3, 1);
```

#### **Rate Limiting Configuration**

**Recommended**: 1-2 requests/second per domain

```typescript
class RateLimiter {
  private lastRequest: Record<string, number> = {};
  private minDelay = 1000; // 1 second between requests

  async throttle(domain: string): Promise<void> {
    const now = Date.now();
    const lastTime = this.lastRequest[domain] || 0;
    const timeSinceLastRequest = now - lastTime;

    if (timeSinceLastRequest < this.minDelay) {
      const waitTime = this.minDelay - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, waitTime));
    }

    this.lastRequest[domain] = Date.now();
  }
}

// Usage
const limiter = new RateLimiter();

for (const url of urls) {
  const domain = new URL(url).hostname;
  await limiter.throttle(domain);

  const response = await fetchWithRetry(url);
  // ... process response
}
```

### 4.3 Database Query Performance

#### **Index Strategy**

From Section 2.1 schema:

```sql
-- Essential indexes (already defined)
CREATE INDEX idx_hksfc_filing_date ON hksfc_filings(filing_date DESC); -- Time-range queries
CREATE INDEX idx_hksfc_company_code ON hksfc_filings(company_code) WHERE company_code IS NOT NULL; -- Partial index
CREATE UNIQUE INDEX idx_hksfc_content_hash ON hksfc_filings(content_hash); -- Deduplication
CREATE INDEX idx_hksfc_search_vector ON hksfc_filings USING GIN(search_vector); -- FTS
```

**Index Selection Guidelines**:

| Query Type | Index Type | Example |
|------------|-----------|---------|
| Equality | B-tree | `WHERE company_code = '0001'` |
| Range | B-tree | `WHERE filing_date > '2024-01-01'` |
| Full-text | GIN | `WHERE search_vector @@ query` |
| Unique constraint | B-tree (unique) | `WHERE content_hash = 'abc123'` |

#### **Query Optimization**

**❌ Bad**: N+1 queries
```typescript
const filings = await supabase.from('hksfc_filings').select('*');

for (const filing of filings.data) {
  // N queries for company data (slow)
  const company = await supabase
    .from('companies')
    .select('*')
    .eq('code', filing.company_code)
    .single();
}
```

**✅ Good**: Join query
```typescript
const { data } = await supabase
  .from('hksfc_filings')
  .select(`
    *,
    companies (
      code,
      name,
      sector
    )
  `)
  .eq('filing_date', '2024-11-10');
```

#### **Caching Strategy**

For frequently accessed data:

**Client-Side Cache** (React Query):
```typescript
import { useQuery } from '@tanstack/react-query';

function useScrapedData(source: string) {
  return useQuery({
    queryKey: ['scraped-data', source],
    queryFn: async () => {
      const { data } = await supabase
        .from(`${source}_data`)
        .select('*')
        .limit(100);
      return data;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    cacheTime: 10 * 60 * 1000 // Keep in memory for 10 minutes
  });
}
```

**Server-Side Cache** (Database Materialized View):
```sql
-- Pre-compute expensive aggregations
CREATE MATERIALIZED VIEW company_stats AS
SELECT
  company_code,
  COUNT(*) as total_filings,
  COUNT(*) FILTER (WHERE filing_type = 'enforcement') as enforcement_count,
  MAX(filing_date) as latest_filing
FROM hksfc_filings
GROUP BY company_code;

-- Refresh periodically (via pg_cron)
REFRESH MATERIALIZED VIEW CONCURRENTLY company_stats;
```

### 4.4 Error Handling & Monitoring

#### **Scrape Logs Table**

```sql
CREATE TABLE scrape_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source text NOT NULL, -- 'hksfc', 'hkex', etc.
  status text NOT NULL, -- 'success', 'error', 'partial'
  records_inserted int DEFAULT 0,
  records_failed int DEFAULT 0,
  duration_ms int,
  error_message text,
  error_stack text,
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz
);

CREATE INDEX idx_scrape_logs_source_status ON scrape_logs(source, status, started_at DESC);
```

**Usage**:
```typescript
const startTime = Date.now();

try {
  const articles = await scrapeHKSFC();
  const inserted = await insertToDatabase(articles);

  await supabase.from('scrape_logs').insert({
    source: 'hksfc',
    status: 'success',
    records_inserted: inserted.length,
    duration_ms: Date.now() - startTime,
    completed_at: new Date()
  });
} catch (error) {
  await supabase.from('scrape_logs').insert({
    source: 'hksfc',
    status: 'error',
    error_message: error.message,
    error_stack: error.stack,
    duration_ms: Date.now() - startTime,
    completed_at: new Date()
  });
}
```

#### **Dashboard Query**

```sql
-- Success rate by source (last 30 days)
SELECT
  source,
  COUNT(*) as total_runs,
  COUNT(*) FILTER (WHERE status = 'success') as successes,
  COUNT(*) FILTER (WHERE status = 'error') as errors,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'success') / COUNT(*), 2) as success_rate_pct,
  AVG(duration_ms) as avg_duration_ms
FROM scrape_logs
WHERE started_at > NOW() - INTERVAL '30 days'
GROUP BY source
ORDER BY success_rate_pct DESC;
```

---

## Comparative Analysis

### Technology Decision Matrix

| Dimension | Firecrawl API | Puppeteer | Score |
|-----------|--------------|-----------|-------|
| **Development Speed** | ⭐⭐⭐⭐⭐ Fast (10-50 lines) | ⭐⭐⭐ Slower (100-500 lines) | Firecrawl +2 |
| **Maintenance** | ⭐⭐⭐⭐⭐ Managed (zero) | ⭐⭐ High (script breakage) | Firecrawl +3 |
| **JavaScript Handling** | ⭐⭐⭐⭐ Built-in (cloud) | ⭐⭐⭐⭐⭐ Full control | Puppeteer +1 |
| **Resource Usage** | ⭐⭐⭐⭐⭐ Zero (cloud) | ⭐⭐ Heavy (200-500MB) | Firecrawl +3 |
| **Cost** | ⭐⭐⭐ API pricing | ⭐⭐⭐⭐ Infra only | Puppeteer +1 |
| **Flexibility** | ⭐⭐⭐ Limited to extraction | ⭐⭐⭐⭐⭐ Full browser control | Puppeteer +2 |
| **Performance** | ⭐⭐⭐⭐⭐ 50x faster (complex) | ⭐⭐⭐ Slower (browser overhead) | Firecrawl +2 |
| **Anti-Bot Bypass** | ⭐⭐⭐⭐⭐ Built-in | ⭐⭐ Manual config | Firecrawl +3 |

**Total Score**: Firecrawl +13, Puppeteer +4

**Recommendation**: Firecrawl primary (80%), Puppeteer fallback (20%)

### Database Schema Pattern Comparison

| Pattern | Multi-Table (Recommended) | Single Table (All Sources) |
|---------|---------------------------|----------------------------|
| **Schema Flexibility** | ✅ Each source has custom fields | ❌ Generic JSONB blob |
| **Query Performance** | ✅ Smaller tables, faster indexes | ❌ Large table, type filtering |
| **Type Safety** | ✅ Typed columns (TypeScript types) | ❌ Untyped JSON |
| **RLS Policies** | ✅ Per-table policies (granular) | ❌ Complex filter logic |
| **Maintenance** | ⚠️ Schema changes per table | ✅ Single table updates |
| **Cross-Source Queries** | ✅ View combines all (Section 2.1) | ✅ Native single query |

**Recommendation**: Multi-table (better performance, type safety, maintainability)

### Deduplication Strategy Comparison

| Strategy | Content Hash (Recommended) | URL-Based | Row Comparison |
|----------|---------------------------|-----------|----------------|
| **Accuracy** | ⭐⭐⭐⭐⭐ Detects content changes | ⭐⭐⭐⭐ Assumes stable URLs | ⭐⭐⭐ Slow (full row scan) |
| **Performance** | ⭐⭐⭐⭐⭐ Fast (unique index) | ⭐⭐⭐⭐⭐ Fast (unique index) | ⭐ Very slow (no index) |
| **Storage** | ⭐⭐⭐⭐ +32 bytes (SHA-256) | ⭐⭐⭐⭐⭐ No extra storage | ⭐⭐⭐⭐⭐ No extra storage |
| **Robustness** | ⭐⭐⭐⭐⭐ Handles URL changes | ⭐⭐⭐ Breaks on URL change | ⭐⭐ Breaks on trivial changes |

**Recommendation**: Content hash (most robust, minimal overhead)

### Realtime Pattern Comparison

| Pattern | Broadcast (Recommended) | Postgres Changes |
|---------|------------------------|------------------|
| **Scalability** | ⭐⭐⭐⭐⭐ 100K+ connections | ⭐⭐⭐ Limited by RLS overhead |
| **Performance** | ⭐⭐⭐⭐⭐ No database queries | ⭐⭐⭐ RLS check per event |
| **Latency** | ⭐⭐⭐⭐⭐ WebSocket push | ⭐⭐⭐⭐ WebSocket push |
| **Data Accuracy** | ⭐⭐⭐⭐ Manual payload | ⭐⭐⭐⭐⭐ Automatic (DB row) |
| **Use Case Fit** | ✅ General notifications | ⚠️ Specific row monitoring |

**Recommendation**: Broadcast (better scalability, Supabase-recommended)

---

## Recommendations & Decision Framework

### Top Recommendation: Dual-Engine Scraping with Supabase-Native Patterns

**Architecture**:
1. **Scraping**: Firecrawl (primary) + Puppeteer (fallback)
2. **Scheduling**: Supabase pg_cron (5 jobs: HKSFC daily, HKEX 6-hourly, Legal weekly, NPM weekly, LLM monthly)
3. **Storage**: PostgreSQL with dedicated tables per source (hksfc_filings, hkex_announcements, etc.)
4. **Deduplication**: SHA-256 content hash with unique constraints
5. **Real-time**: Supabase Realtime Broadcast (not Postgres Changes)
6. **Search**: PostgreSQL FTS with GIN indexes on tsvector columns
7. **Security**: Exponential backoff, rate limiting (1-2 req/sec), informative User-Agent

**Why This Works**:
- ✅ Leverages Supabase strengths (Edge Functions, pg_cron, Realtime, PostgreSQL)
- ✅ Minimal external dependencies (Firecrawl API only)
- ✅ Low maintenance (Firecrawl managed, Puppeteer fallback for edge cases)
- ✅ Scalable (handles 100K+ records per source, sub-second queries)
- ✅ Fits timeline (4-6 weeks for Phase 1)

### Key Benefits

1. **Fast Development**: Firecrawl reduces scraping code by 5-10x vs Puppeteer-only
2. **Low Maintenance**: Managed Firecrawl service auto-handles website changes
3. **Supabase-Native**: All components (Edge Functions, pg_cron, Realtime, FTS) built-in
4. **Performance**: Sub-second queries on 600K+ records (6 sources × 100K each)
5. **Cost-Effective**: Minimize API costs (Firecrawl pay-per-use, no idle infrastructure)

### Risks & Mitigation

| Risk | Mitigation |
|------|------------|
| **Firecrawl API failure** | Puppeteer fallback for critical sources |
| **Edge Function timeout (>400s)** | Batch scraping (50 URLs per job), split large jobs |
| **pg_cron limit (8 concurrent jobs)** | Schedule 5 jobs (under limit), stagger timing |
| **Website structure changes** | Monitor scrape_logs for errors, manual fixes (Phase 1), self-healing AI (Phase 3) |
| **Rate limiting by target sites** | Exponential backoff, 1-2 req/sec throttling, informative User-Agent |
| **Database growth (storage costs)** | Auto-archival (6 months retention), compress old data to Supabase Storage |

### Implementation Priorities

**Phase 1 (Weeks 1-2): Core Infrastructure**
- ✅ Create dedicated Supabase tables (hksfc_filings, hkex_announcements, legal_cases, npm_packages_scraped, llm_configs)
- ✅ Implement SHA-256 deduplication
- ✅ Build unified-scraper Edge Function (Firecrawl + Puppeteer routing)
- ✅ Add scrape_logs table for monitoring

**Phase 2 (Weeks 3-4): Automation & Search**
- ✅ Set up pg_cron scheduled jobs (5 sources)
- ✅ Implement PostgreSQL FTS with GIN indexes
- ✅ Create all_scraped_data view for cross-source search
- ✅ Test end-to-end scraping pipeline

**Phase 3 (Weeks 5-6): Real-time & Polish**
- ✅ Integrate Supabase Realtime Broadcast
- ✅ Build playground UI updates (toast notifications)
- ✅ Implement error handling and retry logic
- ✅ Performance testing (100K records per source)

---

## Architecture Decision Records (ADRs)

### ADR-001: Use Firecrawl as Primary Scraping Engine

**Status**: Accepted

**Context**:
- Need to scrape 6 data sources with varying complexity (static HTML, JavaScript-rendered content)
- Team has limited time (4-6 weeks) and maintenance budget
- Existing implementation has Firecrawl + Puppeteer dual-engine

**Decision Drivers**:
1. Development speed (time to market)
2. Maintenance overhead (ongoing costs)
3. Reliability (success rate)
4. Cost (API vs infrastructure)

**Considered Options**:
1. **Firecrawl API** (cloud-based managed service)
2. **Puppeteer** (self-hosted browser automation)
3. **Scrapy** (Python framework - requires separate service)
4. **Playwright** (similar to Puppeteer, newer)

**Decision**:
Use **Firecrawl as primary engine (80% of sources)** with **Puppeteer as fallback (20%)**.

**Consequences**:

**Positive**:
- ✅ 5-10x less code than Puppeteer-only solution
- ✅ Zero maintenance for website structure changes (managed service)
- ✅ Built-in anti-bot bypass (no manual configuration)
- ✅ Clean Markdown/JSON output (LLM-ready)
- ✅ 50x faster performance on complex sites

**Negative**:
- ❌ API costs (pay per request, ~$0.01-0.05 per page vs $0.001 self-hosted)
- ❌ Vendor lock-in (dependency on Firecrawl service uptime)
- ❌ Less control than full browser automation

**Neutral**:
- ⚪ Requires Puppeteer fallback for edge cases (complex interactions)

**Implementation Notes**:
- Monitor Firecrawl success rate (scrape_logs table)
- If success rate < 95% for a source, switch to Puppeteer permanently for that source
- Budget $50-100/month for Firecrawl API costs (estimated 1,000-2,000 pages/month)

**References**:
- [Firecrawl vs Puppeteer Comparison](https://www.firecrawl.dev/blog/best-open-source-web-scraping-libraries)
- [Browser Automation Tools 2025](https://www.firecrawl.dev/blog/browser-automation-tools-comparison-2025)

---

### ADR-002: Use SHA-256 Content Hashing for Deduplication

**Status**: Accepted

**Context**:
- Daily/weekly re-scraping creates duplicate records
- Need to identify when scraped content actually changes
- Database must enforce uniqueness constraints

**Decision Drivers**:
1. Accuracy (detect actual content changes)
2. Performance (fast duplicate detection)
3. Robustness (handle URL changes)

**Considered Options**:
1. **Content hash (SHA-256)** - Hash title + content + URL
2. **URL-based uniqueness** - Assume URL is stable identifier
3. **Row comparison** - Compare full row before insert

**Decision**:
Use **SHA-256 content hash** with PostgreSQL UNIQUE constraint.

**Consequences**:

**Positive**:
- ✅ Detects content changes even if URL changes
- ✅ Fast duplicate detection (unique index lookup)
- ✅ Tracks first_seen and last_seen timestamps
- ✅ PostgreSQL v13+ B-tree deduplication optimizes index storage

**Negative**:
- ❌ +32 bytes storage per record (SHA-256 hash)
- ❌ Hash computation overhead (~1ms per record)

**Neutral**:
- ⚪ Requires hash calculation in scraper logic

**Implementation Notes**:
```typescript
import { createHash } from 'crypto';

const contentHash = createHash('sha256')
  .update(article.title + article.content + article.url)
  .digest('hex');
```

**References**:
- [PostgreSQL Deduplication Methods](https://www.alibabacloud.com/blog/postgresql-data-deduplication-methods_596032)
- [B-tree Index Deduplication](https://www.cybertec-postgresql.com/en/b-tree-index-deduplication/)

---

### ADR-003: Use Supabase Realtime Broadcast (Not Postgres Changes)

**Status**: Accepted

**Context**:
- Playground needs real-time notifications when new scraped data arrives
- Two options: Realtime Broadcast (WebSocket messages) or Postgres Changes (database triggers)

**Decision Drivers**:
1. Scalability (concurrent users)
2. Performance (latency, database overhead)
3. Supabase recommendation

**Considered Options**:
1. **Realtime Broadcast** - Manual WebSocket messages
2. **Realtime Postgres Changes** - Automatic database change events

**Decision**:
Use **Realtime Broadcast** for playground notifications.

**Consequences**:

**Positive**:
- ✅ No RLS policy overhead (Broadcast doesn't query database)
- ✅ Scalable to 100K+ concurrent connections
- ✅ Recommended by Supabase for most use cases
- ✅ Low latency (direct WebSocket push)

**Negative**:
- ❌ Requires manual event emission in Edge Function
- ❌ Not automatic (must remember to broadcast after insert)

**Neutral**:
- ⚪ Slightly more code (3-5 lines to send broadcast)

**Implementation Notes**:
```typescript
// Edge Function: Broadcast after insert
const channel = supabase.channel('scrape-updates');
await channel.send({
  type: 'broadcast',
  event: 'new_data',
  payload: { source: 'hksfc', count: 50 }
});
```

**References**:
- [Supabase Realtime Docs](https://supabase.com/docs/guides/realtime/postgres-changes)
- [Benchmarks](https://supabase.com/docs/guides/realtime/benchmarks)

---

### ADR-004: Use PostgreSQL Full-Text Search (Not External Search Engine)

**Status**: Accepted

**Context**:
- Need full-text search across all scraped data sources
- Options: PostgreSQL FTS, Elasticsearch, Algolia, Meilisearch

**Decision Drivers**:
1. Performance (query speed)
2. Cost (infrastructure)
3. Complexity (additional services)
4. Integration (with existing Supabase stack)

**Considered Options**:
1. **PostgreSQL FTS** - Native full-text search with GIN indexes
2. **Elasticsearch** - Dedicated search engine (requires separate service)
3. **Algolia** - Managed search API ($$$ per operation)
4. **Meilisearch** - Open-source search (requires hosting)

**Decision**:
Use **PostgreSQL FTS** with GIN indexes and tsvector columns.

**Consequences**:

**Positive**:
- ✅ Native to Supabase (no additional services)
- ✅ Sub-second queries on 200M+ rows (verified)
- ✅ ~50x performance improvement with proper indexes
- ✅ Zero additional cost (included in Supabase)
- ✅ Tightly integrated with database (atomic updates)

**Negative**:
- ❌ Less feature-rich than Elasticsearch (no facets, autocomplete basic)
- ❌ Ranking slower than dedicated search engines (ts_rank overhead)

**Neutral**:
- ⚪ Good enough for 600K records (6 sources × 100K each)
- ⚪ Can migrate to Elasticsearch later if needed (without code changes if using abstraction layer)

**Implementation Notes**:
```sql
-- tsvector column + GIN index
ALTER TABLE hksfc_filings
  ADD COLUMN search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
  ) STORED;

CREATE INDEX idx_hksfc_search_vector
  ON hksfc_filings USING GIN(search_vector);
```

**References**:
- [PostgreSQL FTS Performance](https://blog.vectorchord.ai/postgresql-full-text-search-fast-when-done-right-debunking-the-slow-myth)
- [Optimization Guide](https://blog.poespas.me/posts/2024/04/30/optimize-postgresql-fts-search-performance/)

---

## Implementation Roadmap

### Phase 1: Core Infrastructure (Weeks 1-2)

**Week 1: Database Schema & Deduplication**

**Tasks**:
1. Create dedicated tables (hksfc_filings, hkex_announcements, legal_cases, npm_packages_scraped, llm_configs)
2. Add content_hash columns with unique constraints
3. Implement first_seen, last_seen timestamps
4. Create indexes (filing_date, company_code, content_hash)
5. Build scrape_logs table for monitoring

**Deliverables**:
- ✅ SQL migration files in `supabase/migrations/`
- ✅ TypeScript types generated from schema

**Success Criteria**:
- Insert 1,000 test records, verify zero duplicates
- Query performance < 100ms for basic queries

---

**Week 2: Scraping Engine**

**Tasks**:
1. Refactor existing hk-scraper Edge Function
2. Implement scraper adapter pattern (one adapter per source)
3. Add Firecrawl routing logic (HKSFC, Legal, NPM, LLM → Firecrawl)
4. Add Puppeteer routing logic (HKEX → Puppeteer)
5. Implement SHA-256 hashing and UPSERT logic
6. Add error handling and logging to scrape_logs

**Deliverables**:
- ✅ `supabase/functions/unified-scraper/index.ts`
- ✅ `_shared/scrapers/` directory with adapters

**Success Criteria**:
- Scrape 100 articles from each source
- Deduplication works (re-scrape creates 0 new records)
- Error rate < 5%

---

### Phase 2: Automation & Search (Weeks 3-4)

**Week 3: Scheduled Scraping**

**Tasks**:
1. Create scheduled-scraper Edge Function wrapper
2. Set up pg_cron jobs for 5 sources
3. Configure cron timing (daily/weekly per source)
4. Test cron execution (manual trigger + wait for scheduled run)
5. Build monitoring dashboard query

**Deliverables**:
- ✅ `supabase/functions/scheduled-scraper/index.ts`
- ✅ SQL migration with cron job definitions
- ✅ Dashboard query in `docs/monitoring.sql`

**Success Criteria**:
- All 5 cron jobs run successfully
- Logs show consistent execution times
- Zero missed executions over 7 days

---

**Week 4: Full-Text Search**

**Tasks**:
1. Add search_vector tsvector columns to all tables
2. Create GIN indexes on search_vector
3. Build all_scraped_data view combining all sources
4. Implement search API endpoint (Edge Function or direct Supabase query)
5. Test search performance with 100K records

**Deliverables**:
- ✅ SQL migration with tsvector columns + indexes
- ✅ `all_scraped_data` view definition
- ✅ Search API documentation

**Success Criteria**:
- Search across 600K records in < 500ms
- Relevance ranking works (most relevant results first)
- Multi-word queries work ("fraud investigation")

---

### Phase 3: Real-time & Polish (Weeks 5-6)

**Week 5: Real-time Integration**

**Tasks**:
1. Add Realtime Broadcast to unified-scraper Edge Function
2. Update playground components to subscribe to 'scrape-updates' channel
3. Implement toast notifications for new data
4. Add auto-refresh option (optional - user can enable/disable)
5. Test with concurrent users

**Deliverables**:
- ✅ Updated Edge Function with broadcast logic
- ✅ Updated React components with Realtime subscriptions
- ✅ Toast notification UI component

**Success Criteria**:
- Notifications appear within 2 seconds of new data
- No memory leaks (subscriptions cleaned up on unmount)
- Works with 10+ concurrent users

---

**Week 6: Testing & Optimization**

**Tasks**:
1. Load testing (insert 100K records per source)
2. Query performance testing (complex joins, full-text search)
3. Error handling testing (simulate network failures, rate limits)
4. Documentation (README, API docs, architecture diagrams)
5. Code review and refinement

**Deliverables**:
- ✅ Performance test results
- ✅ Updated documentation
- ✅ Code review sign-off

**Success Criteria**:
- Sub-second queries on 600K total records
- 95%+ scraping success rate
- Zero unhandled errors in production
- Documentation complete and accurate

---

## References

### Web Scraping Architecture
1. [ScraperAPI - Best Practices 2025](https://www.scraperapi.com/web-scraping/best-practices/) - Comprehensive guide to modern web scraping
2. [Research AIMMultiple - Large-Scale Scraping](https://research.aimultiple.com/large-scale-web-scraping/) - Architecture patterns for distributed scraping
3. [Medium - DOs and DON'Ts 2025](https://medium.com/@datajournal/dos-and-donts-of-web-scraping-in-2025-e4f9b2a49431) - Ethical scraping practices

### Firecrawl vs Puppeteer
4. [Firecrawl Blog - Best Open-Source Libraries](https://www.firecrawl.dev/blog/best-open-source-web-scraping-libraries) - Comparison of scraping tools
5. [Firecrawl - Browser Automation Tools Comparison 2025](https://www.firecrawl.dev/blog/browser-automation-tools-comparison-2025) - Detailed benchmarks

### Supabase Edge Functions
6. [Supabase Docs - Edge Functions](https://supabase.com/docs/guides/functions) - Official documentation
7. [Supabase Docs - Limits](https://supabase.com/docs/guides/functions/limits) - Performance limits and constraints
8. [Leanware - Supabase Best Practices](https://www.leanware.co/insights/supabase-best-practices) - Production deployment guide

### PostgreSQL Deduplication
9. [Alibaba Cloud - PostgreSQL Deduplication Methods](https://www.alibabacloud.com/blog/postgresql-data-deduplication-methods_596032) - Hash-based deduplication
10. [CYBERTEC - B-tree Index Deduplication](https://www.cybertec-postgresql.com/en/b-tree-index-deduplication/) - PostgreSQL v13 improvements

### Supabase pg_cron
11. [Supabase Docs - pg_cron](https://supabase.com/docs/guides/database/extensions/pg_cron) - Official pg_cron documentation
12. [Supabase Docs - Scheduling Edge Functions](https://supabase.com/docs/guides/functions/schedule-functions) - Cron + Edge Functions integration

### PostgreSQL Full-Text Search
13. [VectorChord - PostgreSQL FTS Performance](https://blog.vectorchord.ai/postgresql-full-text-search-fast-when-done-right-debunking-the-slow-myth) - Performance optimization
14. [Poespas - Optimize PostgreSQL FTS](https://blog.poespas.me/posts/2024/04/30/optimize-postgresql-fts-search-performance/) - GIN index tuning

### Supabase Realtime
15. [Supabase Docs - Realtime Postgres Changes](https://supabase.com/docs/guides/realtime/postgres-changes) - Official Realtime documentation
16. [Supabase Docs - Realtime Benchmarks](https://supabase.com/docs/guides/realtime/benchmarks) - Performance characteristics

### Web Scraping Security
17. [ZenRows - Bypass Bot Detection](https://www.zenrows.com/blog/bypass-bot-detection) - Anti-bot strategies
18. [Rebrowser - Anti-Scraping Protection](https://rebrowser.net/blog/anti-scraping-protection-from-basic-defense-to-advanced-implementation) - 2025 detection methods

### Exponential Backoff & Retry
19. [The Web Scraping Club - Exponential Backoff](https://substack.thewebscraping.club/p/rate-limit-scraping-exponential-backoff) - Implementation guide
20. [ZenRows - Python Requests Retry](https://www.zenrows.com/blog/python-requests-retry) - Retry strategies (adaptable to TypeScript)

---

## Appendix: Quick Start Commands

### Create Database Tables

```sql
-- Run in Supabase SQL Editor
-- See full schema in Section 2.1

CREATE TABLE hksfc_filings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text,
  filing_type text,
  company_code text,
  company_name text,
  filing_date date,
  url text UNIQUE NOT NULL,
  content_hash text UNIQUE NOT NULL,
  scraped_at timestamptz DEFAULT now(),
  first_seen timestamptz DEFAULT now(),
  last_seen timestamptz DEFAULT now(),
  search_vector tsvector GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
  ) STORED
);

CREATE INDEX idx_hksfc_filing_date ON hksfc_filings(filing_date DESC);
CREATE INDEX idx_hksfc_company_code ON hksfc_filings(company_code) WHERE company_code IS NOT NULL;
CREATE UNIQUE INDEX idx_hksfc_content_hash ON hksfc_filings(content_hash);
CREATE INDEX idx_hksfc_search_vector ON hksfc_filings USING GIN(search_vector);

-- Repeat for other tables: hkex_announcements, legal_cases, npm_packages_scraped, llm_configs
```

### Deploy Edge Function

```bash
# Deploy unified scraper
supabase functions deploy unified-scraper

# Test locally
supabase functions serve unified-scraper
curl -X POST http://localhost:54321/functions/v1/unified-scraper \
  -H "Content-Type: application/json" \
  -d '{"source": "hksfc", "limit": 10}'
```

### Schedule Scraping Jobs

```sql
-- HKSFC daily scrape
SELECT cron.schedule(
  'scrape-hksfc-daily',
  '0 1 * * *', -- 9 AM HKT = 1 AM UTC
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/scheduled-scraper',
    body := '{"source": "hksfc"}'::jsonb
  );
  $$
);
```

### Search Scraped Data

```typescript
// Full-text search
const { data } = await supabase
  .from('all_scraped_data')
  .select('*')
  .textSearch('search_vector', 'fraud investigation')
  .limit(50);

// Filter by source
const { data: hksfcOnly } = await supabase
  .from('all_scraped_data')
  .select('*')
  .eq('source', 'hksfc')
  .textSearch('search_vector', 'enforcement')
  .order('scraped_at', { ascending: false });
```

---

**End of Technical Research Report**

**Next Steps**:
1. Review findings with team
2. Proceed to PRD (Product Requirements Document) workflow
3. Begin Phase 1 implementation (Weeks 1-2)

**Questions?** Refer to specific sections for implementation details.
