-- HK Scraping Job Tracking - Migration Verification Script
-- Run this in Supabase SQL Editor to verify the migration was applied successfully

-- ===========================================================================
-- 1. Verify Tables Exist
-- ===========================================================================

-- Check if scraping_jobs table exists
SELECT EXISTS (
  SELECT FROM information_schema.tables
  WHERE table_schema = 'public'
  AND table_name = 'scraping_jobs'
) AS "scraping_jobs_table_exists";
-- Expected: true

-- Check table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'scraping_jobs'
ORDER BY ordinal_position;
-- Expected: 16 columns including id, source, status, progress, etc.

-- ===========================================================================
-- 2. Verify RPC Functions Exist
-- ===========================================================================

-- Check if all 5 functions exist
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'trigger_hkex_di_scrape',
  'trigger_sfc_rss_sync',
  'trigger_sfc_stats_sync',
  'trigger_ccass_scrape',
  'get_scraping_stats'
)
ORDER BY routine_name;
-- Expected: 5 rows

-- ===========================================================================
-- 3. Verify RLS Policies
-- ===========================================================================

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
AND tablename = 'scraping_jobs';
-- Expected: rowsecurity = true

-- Check policies exist
SELECT policyname, cmd, roles
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'scraping_jobs';
-- Expected: 3 policies (read, insert, service_role)

-- ===========================================================================
-- 4. Verify Indexes
-- ===========================================================================

-- Check indexes exist
SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'scraping_jobs';
-- Expected: 4 indexes

-- ===========================================================================
-- 5. Verify pg_cron Jobs
-- ===========================================================================

-- Check if cron jobs are scheduled
SELECT jobid, jobname, schedule, command
FROM cron.job
WHERE jobname IN (
  'daily-sfc-rss-sync',
  'weekly-sfc-stats-sync',
  'weekly-hkex-di-top-stocks'
);
-- Expected: 3 jobs (if cron extension enabled)

-- ===========================================================================
-- 6. Test RPC Functions (Dry Run)
-- ===========================================================================

-- Test that functions are callable (won't actually trigger jobs without proper config)
-- These should return UUIDs if successful

-- Test CCASS scraper trigger (safest to test)
SELECT trigger_ccass_scrape('00700', 10);

-- Test SFC RSS sync trigger
SELECT trigger_sfc_rss_sync();

-- Check if jobs were created
SELECT
  id,
  source,
  status,
  created_at,
  config
FROM scraping_jobs
ORDER BY created_at DESC
LIMIT 5;
-- Expected: 2 job records with status 'pending'

-- ===========================================================================
-- 7. Test Statistics Function
-- ===========================================================================

-- Get stats for all sources (last 7 days)
SELECT * FROM get_scraping_stats(NULL, 7);
-- Expected: Empty table or rows for each source with jobs

-- ===========================================================================
-- 8. Cleanup Test Jobs (Optional)
-- ===========================================================================

-- Delete test jobs if you don't want to actually run them
DELETE FROM scraping_jobs
WHERE created_at > NOW() - INTERVAL '5 minutes'
AND status = 'pending';

-- ===========================================================================
-- VERIFICATION SUMMARY
-- ===========================================================================

-- Quick check: Count all key objects
SELECT
  'Tables' AS object_type,
  COUNT(*) AS count
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'scraping_jobs'

UNION ALL

SELECT
  'Functions' AS object_type,
  COUNT(*) AS count
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'trigger_hkex_di_scrape',
  'trigger_sfc_rss_sync',
  'trigger_sfc_stats_sync',
  'trigger_ccass_scrape',
  'get_scraping_stats'
)

UNION ALL

SELECT
  'RLS Policies' AS object_type,
  COUNT(*) AS count
FROM pg_policies
WHERE schemaname = 'public'
AND tablename = 'scraping_jobs'

UNION ALL

SELECT
  'Indexes' AS object_type,
  COUNT(*) AS count
FROM pg_indexes
WHERE schemaname = 'public'
AND tablename = 'scraping_jobs'

UNION ALL

SELECT
  'Cron Jobs' AS object_type,
  COUNT(*) AS count
FROM cron.job
WHERE jobname IN (
  'daily-sfc-rss-sync',
  'weekly-sfc-stats-sync',
  'weekly-hkex-di-top-stocks'
);

-- Expected Results:
-- Tables: 1
-- Functions: 5
-- RLS Policies: 3
-- Indexes: 4
-- Cron Jobs: 3

-- ===========================================================================
-- ✅ If all checks pass, migration is successful!
-- Next steps: Configure database settings for pg_cron
-- ===========================================================================
