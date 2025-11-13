-- Create automated cron jobs for CIMA data updates
-- Requires pg_cron extension (should already be installed in Supabase)

-- Note: These SQL statements should be run manually in Supabase SQL Editor
-- or via the Supabase Dashboard > Database > Cron Jobs interface

-- Weekly full sync: Every Monday at 2 AM UTC
-- Scrapes all entity types
/*
SELECT cron.schedule(
  'cima-weekly-full-sync',
  '0 2 * * 1',
  $$
  SELECT
    net.http_post(
      url:='YOUR_SUPABASE_URL/functions/v1/cima-scraper',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
      body:='{"entity_types": ["Banking, Financing and Money Services", "Trust & Corporate Services Providers", "Insurance", "Investment Business", "Insolvency Practitioners", "Registered Agents", "Virtual Assets Service Providers"]}'::jsonb
    ) as request_id;
  $$
);
*/

-- Daily VASP sync: Every day at 3 AM UTC
-- Virtual Asset Service Providers change frequently
/*
SELECT cron.schedule(
  'cima-daily-vasp-sync',
  '0 3 * * *',
  $$
  SELECT
    net.http_post(
      url:='YOUR_SUPABASE_URL/functions/v1/cima-scraper',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
      body:='{"entity_types": ["Virtual Assets Service Providers"]}'::jsonb
    ) as request_id;
  $$
);
*/

-- Monthly comprehensive sync with cleanup: First day of month at 1 AM UTC
-- Includes clearing old data
/*
SELECT cron.schedule(
  'cima-monthly-comprehensive-sync',
  '0 1 1 * *',
  $$
  SELECT
    net.http_post(
      url:='YOUR_SUPABASE_URL/functions/v1/cima-scraper',
      headers:='{"Content-Type": "application/json", "Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb,
      body:='{"entity_types": ["Banking, Financing and Money Services", "Trust & Corporate Services Providers", "Insurance", "Investment Business", "Insolvency Practitioners", "Registered Agents", "Virtual Assets Service Providers"], "clear_existing": false}'::jsonb
    ) as request_id;
  $$
);
*/

-- View all scheduled cron jobs
-- SELECT * FROM cron.job;

-- Unschedule a job (if needed)
-- SELECT cron.unschedule('cima-weekly-full-sync');

-- MANUAL SETUP INSTRUCTIONS:
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Replace YOUR_SUPABASE_URL with your project URL (e.g., https://xxx.supabase.co)
-- 3. Replace YOUR_SERVICE_ROLE_KEY with your service role key from Settings > API
-- 4. Uncomment the desired cron.schedule() statements above
-- 5. Execute the SQL
-- 6. Verify jobs are created: SELECT * FROM cron.job;

-- Alternative: Use GitHub Actions for scheduling
-- See .github/workflows/cima-sync.yml
