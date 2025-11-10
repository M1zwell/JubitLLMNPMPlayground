-- Clean up old/expired scraping data from broken URLs
-- All data scraped before 2025-11-10 10:05:00 UTC is from OLD URLs

-- Reason for cleanup:
-- 1. HKSFC old URL: https://apps.sfc.hk/edistributionWeb/gateway/EN/news-and-announcements/ (BROKEN)
-- 2. HKEX date format was incorrect (dd/mm/yyyy instead of YYYY/MM/DD)
-- 3. Data contains mock/test articles and malformed records

-- Delete all HKSFC filings (all current data is from old URL)
DELETE FROM hksfc_filings WHERE scraped_at < '2025-11-10 10:05:00+00';

-- Delete all HKEX announcements (all current data is from old URL)
DELETE FROM hkex_announcements WHERE scraped_at < '2025-11-10 10:05:00+00';

-- Verify cleanup
SELECT
  'HKSFC filings' as table_name,
  COUNT(*) as remaining_records,
  MAX(scraped_at) as latest_scrape
FROM hksfc_filings
UNION ALL
SELECT
  'HKEX announcements' as table_name,
  COUNT(*) as remaining_records,
  MAX(scraped_at) as latest_scrape
FROM hkex_announcements;
