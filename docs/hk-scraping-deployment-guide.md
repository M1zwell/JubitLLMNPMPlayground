# HK Financial Data Scraping - Deployment Guide

Complete step-by-step deployment guide for the HK Financial Data Scraping System.

---

## 📋 Prerequisites

- Supabase CLI installed and authenticated
- Firecrawl API account and API key
- Access to Supabase project dashboard
- Node.js 18+ installed

---

## 🚀 Deployment Steps

### Step 1: Authenticate Supabase CLI

```bash
# Login to Supabase
supabase login

# Link to your project (if not already linked)
supabase link --project-ref kiztaihzanqnrcrqaxsv
```

**Verification:**
```bash
supabase projects list
# Should show your project as linked
```

---

### Step 2: Deploy Edge Functions

Deploy all 4 edge functions to Supabase:

```bash
# Deploy HKEX Disclosure of Interests scraper
supabase functions deploy hkex-disclosure-scraper

# Deploy SFC RSS Feed sync
supabase functions deploy hksfc-rss-sync

# Deploy SFC Statistics sync
supabase functions deploy sfc-statistics-sync

# Deploy Unified Scraper (CCASS + multi-source)
supabase functions deploy unified-scraper
```

**Expected Output:**
```
Deploying function hkex-disclosure-scraper...
✔️ Function deployed successfully
URL: https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/hkex-disclosure-scraper
```

**Verification:**
```bash
# List deployed functions
supabase functions list

# Should show all 4 functions as "ACTIVE"
```

---

### Step 3: Configure Firecrawl API Key

The scraping functions use Firecrawl API for web scraping. You need to configure the API key as a Supabase secret.

#### Option A: Via Supabase CLI (Recommended)

```bash
# Set Firecrawl API key as secret
supabase secrets set FIRECRAWL_API_KEY=fc-YOUR_ACTUAL_API_KEY_HERE
```

#### Option B: Via Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/kiztaihzanqnrcrqaxsv/settings/functions
2. Navigate to **Edge Functions** → **Secrets**
3. Click **Add Secret**
4. Name: `FIRECRAWL_API_KEY`
5. Value: Your Firecrawl API key (starts with `fc-`)
6. Click **Save**

**Get Firecrawl API Key:**
- Sign up at: https://firecrawl.dev
- Go to dashboard → API Keys
- Copy your API key

**Verification:**
```bash
# List secrets (values are hidden)
supabase secrets list

# Should show FIRECRAWL_API_KEY in the list
```

---

### Step 4: Apply Job Tracking Migration

Apply the database migration that creates the job tracking infrastructure:

#### Option A: Via Supabase CLI (Recommended)

```bash
# Apply migration
supabase db push

# This will apply all migrations in supabase/migrations/
# including 20250120150000_hk_scraping_job_tracking.sql
```

#### Option B: Via Supabase SQL Editor

1. Go to: https://supabase.com/dashboard/project/kiztaihzanqnrcrqaxsv/editor
2. Open the SQL editor
3. Copy contents of `supabase/migrations/20250120150000_hk_scraping_job_tracking.sql`
4. Paste into SQL editor
5. Click **Run** (bottom right)

**Verification:**
```sql
-- Check if scraping_jobs table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'scraping_jobs'
);
-- Should return: true

-- Check if RPC functions exist
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name LIKE 'trigger_%_scrape%';
-- Should return: trigger_hkex_di_scrape, trigger_sfc_rss_sync,
--                trigger_sfc_stats_sync, trigger_ccass_scrape
```

---

### Step 5: Configure Database Settings for pg_cron

pg_cron scheduled jobs need access to Supabase project URL and anon key. Set these as database-level config:

```sql
-- Run in Supabase SQL Editor
ALTER DATABASE postgres SET app.supabase_url = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
ALTER DATABASE postgres SET app.supabase_anon_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';
```

**⚠️ Security Note:** The anon key is safe to use here as it's already public-facing in your frontend. These settings are only accessible within your database.

**Verification:**
```sql
-- Check config values
SELECT name, setting FROM pg_settings
WHERE name LIKE 'app.supabase%';

-- Should return:
-- app.supabase_url | https://kiztaihzanqnrcrqaxsv.supabase.co
-- app.supabase_anon_key | eyJhbGci...
```

---

### Step 6: Enable pg_cron Scheduled Jobs

The migration already includes pg_cron schedule definitions, but you need to verify they're enabled:

```sql
-- Check existing cron jobs
SELECT * FROM cron.job;

-- Should show:
-- 1. daily-sfc-rss-sync (0 2 * * *)
-- 2. weekly-sfc-stats-sync (0 19 * * 6)
-- 3. weekly-hkex-di-top-stocks (0 20 * * 6)
```

**If cron jobs are NOT shown**, manually create them:

```sql
-- Daily SFC RSS Sync (10 AM HKT = 2 AM UTC)
SELECT cron.schedule(
  'daily-sfc-rss-sync',
  '0 2 * * *',
  $$
  SELECT public.trigger_sfc_rss_sync();
  $$
);

-- Weekly SFC Statistics (Sunday 3 AM HKT = Saturday 7 PM UTC)
SELECT cron.schedule(
  'weekly-sfc-stats-sync',
  '0 19 * * 6',
  $$
  SELECT public.trigger_sfc_stats_sync();
  $$
);

-- Weekly HKEX DI for Top 10 Stocks (Sunday 4 AM HKT = Saturday 8 PM UTC)
SELECT cron.schedule(
  'weekly-hkex-di-top-stocks',
  '0 20 * * 6',
  $$
  DO $$
  DECLARE
    stock TEXT;
  BEGIN
    FOREACH stock IN ARRAY ARRAY['00700','00941','00388','00981','01810','09988','01299','02318','02382','00883']
    LOOP
      PERFORM public.trigger_hkex_di_scrape(stock);
      PERFORM pg_sleep(2); -- Rate limiting: 30 req/min
    END LOOP;
  END;
  $$;
  $$
);
```

**Cron Schedule Explanation:**
- `0 2 * * *` = Every day at 2 AM UTC (10 AM HKT)
- `0 19 * * 6` = Every Saturday at 7 PM UTC (Sunday 3 AM HKT)
- `0 20 * * 6` = Every Saturday at 8 PM UTC (Sunday 4 AM HKT)

**Manage Cron Jobs:**
```sql
-- List all jobs
SELECT * FROM cron.job;

-- Unschedule a job
SELECT cron.unschedule('job-name-here');

-- Re-schedule with updated config
SELECT cron.schedule('job-name', 'cron-expression', $$SQL-command$$);
```

---

### Step 7: Test the System

#### Test Edge Functions Directly

```bash
# Run integration tests
node tests/test-hk-scrapers.js
```

**Expected Output:**
```
=== Test 1: HKEX Disclosure of Interests Scraper ===
✅ HKEX DI Scraper: PASSED
   - Stock: Tencent Holdings Limited (00700)
   - Shareholders found: 25
   - Inserted: 12, Updated: 13

=== Test 2: SFC RSS Feed Sync ===
✅ SFC RSS Sync: PASSED
   - Total fetched: 45
   - Inserted: 8, Updated: 37

=== Test 3: SFC Statistics Sync ===
✅ SFC Statistics Sync: PASSED
   - Tables processed: 2
   - Total records: 156

=== Test 4: CCASS Unified Scraper ===
✅ CCASS Unified Scraper: PASSED
   - Source: ccass
   - Inserted: 5, Updated: 45
   - Duration: 8952ms

Overall: 4/4 tests passed
✅ All systems operational!
```

#### Test RPC Trigger Functions

```sql
-- Manually trigger CCASS scrape via RPC
SELECT public.trigger_ccass_scrape('00700', 50);

-- Manually trigger SFC RSS sync
SELECT public.trigger_sfc_rss_sync();

-- Manually trigger SFC Statistics sync
SELECT public.trigger_sfc_stats_sync(ARRAY['D3', 'D4']);

-- Manually trigger HKEX DI scrape
SELECT public.trigger_hkex_di_scrape('00700', '2024-01-01', '2025-01-20');

-- Check job status
SELECT
  id, source, status, progress,
  records_inserted, records_updated,
  created_at, duration_ms
FROM scraping_jobs
ORDER BY created_at DESC
LIMIT 10;
```

#### Test Real-time Subscriptions

1. Open the admin dashboard: `http://localhost:8080` (or your deployed URL)
2. Navigate to **HK Financial Data Scraping** view
3. Click one of the trigger buttons (e.g., "CCASS Holdings")
4. Watch the job appear in "Job History" table in real-time
5. Status should update from `pending` → `running` → `completed`

---

### Step 8: Add Dashboard to App Navigation

Add the new dashboard to your main App.tsx navigation:

```tsx
// In src/App.tsx

import { HKDataScrapingDashboard } from './components/HKDataScrapingDashboard';

// In your navigation section, add:
<button
  onClick={() => setCurrentView('hk-scraping-admin')}
  className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
>
  HK Scraping Admin
</button>

// In your view rendering section, add:
{currentView === 'hk-scraping-admin' && <HKDataScrapingDashboard />}
```

---

## 🔍 Verification Checklist

Use this checklist to ensure everything is working:

- [ ] Supabase CLI authenticated (`supabase projects list` shows project)
- [ ] All 4 edge functions deployed (`supabase functions list` shows ACTIVE)
- [ ] Firecrawl API key configured (`supabase secrets list` includes FIRECRAWL_API_KEY)
- [ ] Database migration applied (`scraping_jobs` table exists)
- [ ] RPC functions exist (4 trigger functions + 1 stats function)
- [ ] Database config set (`app.supabase_url` and `app.supabase_anon_key`)
- [ ] pg_cron jobs scheduled (3 jobs in `cron.job` table)
- [ ] Integration tests pass (4/4 tests in `test-hk-scrapers.js`)
- [ ] Manual RPC triggers work (creates job records)
- [ ] Real-time subscriptions work (dashboard updates live)
- [ ] Admin dashboard accessible in app navigation

---

## 📊 Monitoring & Maintenance

### View Job Statistics

```sql
-- Get 7-day statistics for all sources
SELECT * FROM public.get_scraping_stats(NULL, 7);

-- Get 30-day statistics for CCASS only
SELECT * FROM public.get_scraping_stats('ccass', 30);
```

### View Recent Jobs

```sql
-- Last 10 jobs (all sources)
SELECT
  source, status,
  records_inserted, records_updated, records_failed,
  duration_ms, created_at
FROM scraping_jobs
ORDER BY created_at DESC
LIMIT 10;

-- Failed jobs in last 24 hours
SELECT
  id, source, error_message, created_at
FROM scraping_jobs
WHERE status = 'failed'
  AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;
```

### View Cron Job History

```sql
-- Check cron job run history
SELECT
  jobid, runid, job_pid, status,
  return_message, start_time, end_time
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 20;
```

### Update Cron Schedules

```sql
-- Change daily RSS sync to run at 3 AM UTC instead
SELECT cron.unschedule('daily-sfc-rss-sync');
SELECT cron.schedule(
  'daily-sfc-rss-sync',
  '0 3 * * *',  -- 3 AM UTC = 11 AM HKT
  $$SELECT public.trigger_sfc_rss_sync();$$
);
```

---

## 🐛 Troubleshooting

### Issue: Edge Function Returns 404

**Symptoms:**
```json
{"code": "NOT_FOUND", "message": "Requested function was not found"}
```

**Solution:**
```bash
# Redeploy the function
supabase functions deploy function-name-here

# Verify it's deployed
supabase functions list
```

---

### Issue: "Unauthorized: Invalid token" from Firecrawl

**Symptoms:**
```json
{"success": false, "error": "Firecrawl API error: Unauthorized: Invalid token"}
```

**Solution:**
```bash
# Check if FIRECRAWL_API_KEY is set
supabase secrets list

# If missing, set it
supabase secrets set FIRECRAWL_API_KEY=fc-your-key-here

# Redeploy functions to pick up new secret
supabase functions deploy hkex-disclosure-scraper
```

---

### Issue: RPC Function Not Found

**Symptoms:**
```sql
ERROR: function trigger_ccass_scrape(text, integer) does not exist
```

**Solution:**
```bash
# Re-apply migration
supabase db push

# Or run the SQL manually in Supabase SQL Editor
```

---

### Issue: pg_cron Jobs Not Running

**Symptoms:**
- Jobs scheduled but never execute
- `cron.job_run_details` is empty

**Solution:**
```sql
-- Check if jobs are scheduled
SELECT * FROM cron.job;

-- Check if database config is set
SELECT name, setting FROM pg_settings WHERE name LIKE 'app.supabase%';

-- If config missing, set it:
ALTER DATABASE postgres SET app.supabase_url = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
ALTER DATABASE postgres SET app.supabase_anon_key = 'your-anon-key';

-- Manually trigger job to test
SELECT cron.schedule('test-job', '* * * * *', $$SELECT NOW();$$);

-- Wait 1 minute, then check:
SELECT * FROM cron.job_run_details WHERE jobid = (SELECT jobid FROM cron.job WHERE jobname = 'test-job');

-- Clean up test
SELECT cron.unschedule('test-job');
```

---

### Issue: Real-time Subscriptions Not Working

**Symptoms:**
- Dashboard doesn't update when jobs change
- Console shows subscription errors

**Solution:**
```typescript
// Check Supabase Realtime settings in dashboard:
// https://supabase.com/dashboard/project/kiztaihzanqnrcrqaxsv/settings/realtime

// Ensure 'scraping_jobs' table has Realtime enabled

// Test subscription in browser console:
const { data } = await supabase
  .channel('test')
  .on('postgres_changes',
    { event: '*', schema: 'public', table: 'scraping_jobs' },
    (payload) => console.log('Change received!', payload)
  )
  .subscribe();
```

---

## 📚 Additional Resources

- **Supabase Edge Functions Docs:** https://supabase.com/docs/guides/functions
- **Supabase CLI Docs:** https://supabase.com/docs/reference/cli
- **Firecrawl API Docs:** https://docs.firecrawl.dev
- **pg_cron Documentation:** https://github.com/citusdata/pg_cron
- **Implementation Docs:** `docs/hk-financial-scraping-consolidated-implementation.md`

---

## 🎉 Success!

If all verification steps pass, your HK Financial Data Scraping System is fully operational:

✅ **4 Edge Functions** deployed and scraping data
✅ **Job Tracking** enabled with real-time monitoring
✅ **Admin Dashboard** for manual triggers and monitoring
✅ **Automated Scheduling** via pg_cron (daily/weekly)
✅ **Deduplication** via SHA-256 content hashing
✅ **Real-time Updates** via Supabase subscriptions

The system will now automatically:
- Sync SFC RSS feeds every day at 10 AM HKT
- Update SFC statistics every Sunday at 3 AM HKT
- Scrape HKEX DI for top stocks every Sunday at 4 AM HKT

**Next Steps:**
- Monitor job logs in the admin dashboard
- Adjust cron schedules based on data freshness requirements
- Add more stock codes to the weekly HKEX DI scraper
- Configure alerts for failed jobs (via Supabase webhooks)
