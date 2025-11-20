-- HK Scraping Job Tracking - pg_cron Configuration
-- Run this in Supabase SQL Editor AFTER verifying migration

-- ===========================================================================
-- STEP 1: Configure Database Settings for pg_cron
-- ===========================================================================

-- Set Supabase project URL (required for HTTP requests from cron jobs)
ALTER DATABASE postgres SET app.supabase_url = 'https://kiztaihzanqnrcrqaxsv.supabase.co';

-- Set Supabase anon key (required for authenticated HTTP requests)
ALTER DATABASE postgres SET app.supabase_anon_key = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

-- ===========================================================================
-- STEP 2: Verify Configuration
-- ===========================================================================

-- Check if settings were applied
SELECT name, setting
FROM pg_settings
WHERE name LIKE 'app.supabase%';

-- Expected output:
-- app.supabase_url | https://kiztaihzanqnrcrqaxsv.supabase.co
-- app.supabase_anon_key | eyJhbGci...

-- ===========================================================================
-- STEP 3: Verify pg_cron Jobs are Scheduled
-- ===========================================================================

-- List all cron jobs
SELECT
  jobid,
  jobname,
  schedule,
  active,
  database
FROM cron.job
ORDER BY jobname;

-- Expected: 3 jobs
-- 1. daily-sfc-rss-sync (0 2 * * *)
-- 2. weekly-sfc-stats-sync (0 19 * * 6)
-- 3. weekly-hkex-di-top-stocks (0 20 * * 6)

-- ===========================================================================
-- STEP 4: Test Manual Job Trigger (Optional)
-- ===========================================================================

-- Manually trigger a test job to verify everything works
-- This will create a job record and attempt to call the edge function

-- Test trigger (will fail if edge function not deployed or Firecrawl key missing)
SELECT trigger_ccass_scrape('00700', 10);

-- Check if job was created
SELECT
  id,
  source,
  status,
  created_at,
  error_message
FROM scraping_jobs
ORDER BY created_at DESC
LIMIT 1;

-- Expected: 1 job record with status 'pending' (will stay pending if edge function not responding)

-- ===========================================================================
-- STEP 5: View Cron Job Execution History (After Jobs Run)
-- ===========================================================================

-- View recent cron job executions
SELECT
  jobid,
  runid,
  job_pid,
  database,
  username,
  command,
  status,
  return_message,
  start_time,
  end_time
FROM cron.job_run_details
ORDER BY start_time DESC
LIMIT 10;

-- This will be empty until cron jobs actually execute at their scheduled times

-- ===========================================================================
-- STEP 6: Manual Cron Job Execution (Optional Testing)
-- ===========================================================================

-- If you want to test a cron job manually without waiting for the schedule,
-- you can call the trigger functions directly:

-- Test SFC RSS sync
SELECT trigger_sfc_rss_sync();

-- Test SFC Statistics sync
SELECT trigger_sfc_stats_sync(ARRAY['D3', 'D4']);

-- Test HKEX DI scrape for Tencent
SELECT trigger_hkex_di_scrape('00700', '2024-01-01', '2025-01-20');

-- View all recent jobs
SELECT
  id,
  source,
  status,
  progress,
  records_inserted,
  records_updated,
  records_failed,
  duration_ms,
  created_at,
  error_message
FROM scraping_jobs
ORDER BY created_at DESC
LIMIT 10;

-- ===========================================================================
-- TROUBLESHOOTING
-- ===========================================================================

-- If cron jobs aren't executing:

-- 1. Check if pg_cron extension is enabled
SELECT * FROM pg_extension WHERE extname = 'pg_cron';
-- Expected: 1 row

-- 2. Check cron job status
SELECT * FROM cron.job WHERE active = false;
-- Expected: Empty (all jobs should be active)

-- 3. Enable a disabled job
-- UPDATE cron.job SET active = true WHERE jobname = 'job-name-here';

-- 4. Check for job errors
SELECT
  jobname,
  status,
  return_message,
  start_time
FROM cron.job_run_details
WHERE status != 'succeeded'
ORDER BY start_time DESC
LIMIT 10;

-- 5. Manually unschedule and reschedule a job if needed
-- SELECT cron.unschedule('job-name-here');
-- Then run the cron.schedule() command again from the migration

-- ===========================================================================
-- NEXT STEPS
-- ===========================================================================

-- ✅ If configuration successful:
-- 1. Deploy missing edge functions (hksfc-rss-sync, sfc-statistics-sync, hkex-disclosure-scraper)
-- 2. Configure Firecrawl API key in Supabase secrets
-- 3. Test integration via dashboard or test suite
-- 4. Wait for scheduled jobs to execute automatically

-- ⚠️ Remember:
-- - Daily SFC RSS sync runs at 10 AM HKT (2 AM UTC)
-- - Weekly SFC stats sync runs Sunday 3 AM HKT (Saturday 7 PM UTC)
-- - Weekly HKEX DI sync runs Sunday 4 AM HKT (Saturday 8 PM UTC)

-- ===========================================================================
-- ✅ CONFIGURATION COMPLETE
-- ===========================================================================
