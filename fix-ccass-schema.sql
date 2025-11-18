-- Fix HKEX CCASS Holdings table schema
-- Remove content_hash constraint or drop the column

-- Option 1: Make content_hash nullable if it exists
ALTER TABLE hkex_ccass_holdings
  ALTER COLUMN content_hash DROP NOT NULL;

-- Option 2: Or drop the column entirely if not needed
-- ALTER TABLE hkex_ccass_holdings DROP COLUMN IF EXISTS content_hash;

-- Verify the table structure
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'hkex_ccass_holdings'
ORDER BY ordinal_position;
