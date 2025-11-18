-- Fix HKEX CCASS Holdings table: Remove content_hash NOT NULL constraint
-- This column is not used by the scraper and causes insertion failures

-- Check if content_hash column exists and make it nullable
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'hkex_ccass_holdings'
      AND column_name = 'content_hash'
  ) THEN
    -- Make content_hash nullable
    ALTER TABLE hkex_ccass_holdings
      ALTER COLUMN content_hash DROP NOT NULL;

    RAISE NOTICE 'Made content_hash column nullable';
  ELSE
    RAISE NOTICE 'content_hash column does not exist';
  END IF;
END $$;

-- Alternative: Drop the column entirely if not needed
-- Uncomment if you want to remove content_hash completely:
-- ALTER TABLE hkex_ccass_holdings DROP COLUMN IF EXISTS content_hash;
