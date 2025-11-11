-- ============================================================================
-- HKSFC News Schema Update
-- ============================================================================
-- INSTRUCTIONS:
-- 1. Go to https://supabase.com/dashboard/project/kiztaihzanqnrcrqaxsv/sql
-- 2. Paste this entire SQL into the editor
-- 3. Click "Run" button
-- 4. After success, run: node test-hksfc-news.js
-- ============================================================================

-- Add missing columns
ALTER TABLE hksfc_filings ADD COLUMN IF NOT EXISTS summary text;
ALTER TABLE hksfc_filings ADD COLUMN IF NOT EXISTS pdf_url text;
ALTER TABLE hksfc_filings ADD COLUMN IF NOT EXISTS tags text[];

-- Add column comments (optional)
COMMENT ON COLUMN hksfc_filings.summary IS 'Article excerpt or description';
COMMENT ON COLUMN hksfc_filings.pdf_url IS 'URL to PDF attachment if available';
COMMENT ON COLUMN hksfc_filings.tags IS 'Keywords/tags for categorization';

-- Verify columns were added
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'hksfc_filings'
  AND column_name IN ('summary', 'pdf_url', 'tags')
ORDER BY column_name;
