-- Alter existing HKEX CCASS table to add missing columns

-- Add missing columns if they don't exist
DO $$
BEGIN
  -- Add stock_name column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='hkex_ccass_holdings' AND column_name='stock_name') THEN
    ALTER TABLE hkex_ccass_holdings ADD COLUMN stock_name TEXT;
    RAISE NOTICE 'Added column: stock_name';
  END IF;

  -- Add shareholding_date column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='hkex_ccass_holdings' AND column_name='shareholding_date') THEN
    ALTER TABLE hkex_ccass_holdings ADD COLUMN shareholding_date DATE;
    RAISE NOTICE 'Added column: shareholding_date';
  END IF;

  -- Add address column
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                 WHERE table_name='hkex_ccass_holdings' AND column_name='address') THEN
    ALTER TABLE hkex_ccass_holdings ADD COLUMN address TEXT;
    RAISE NOTICE 'Added column: address';
  END IF;

END $$;

-- Update shareholding column type if needed (from text to bigint)
ALTER TABLE hkex_ccass_holdings
  ALTER COLUMN shareholding TYPE BIGINT USING shareholding::BIGINT;

-- Update percentage column type if needed (from text to decimal)
ALTER TABLE hkex_ccass_holdings
  ALTER COLUMN percentage TYPE DECIMAL(10,4) USING percentage::DECIMAL;

-- Drop old unique constraint if it exists
ALTER TABLE hkex_ccass_holdings
  DROP CONSTRAINT IF EXISTS hkex_ccass_holdings_pkey;

-- Drop old unique constraint if it exists
ALTER TABLE hkex_ccass_holdings
  DROP CONSTRAINT IF EXISTS unique_ccass_holding;

-- Add new unique constraint
ALTER TABLE hkex_ccass_holdings
  ADD CONSTRAINT unique_ccass_holding UNIQUE (stock_code, shareholding_date, participant_id);

-- Create or update indexes
DROP INDEX IF EXISTS idx_ccass_stock_date;
CREATE INDEX idx_ccass_stock_date ON hkex_ccass_holdings(stock_code, shareholding_date DESC);

DROP INDEX IF EXISTS idx_ccass_participant;
CREATE INDEX idx_ccass_participant ON hkex_ccass_holdings(participant_id);

DROP INDEX IF EXISTS idx_ccass_scraped_at;
CREATE INDEX idx_ccass_scraped_at ON hkex_ccass_holdings(scraped_at DESC);

DROP INDEX IF EXISTS idx_ccass_stock_code;
CREATE INDEX idx_ccass_stock_code ON hkex_ccass_holdings(stock_code);

DROP INDEX IF EXISTS idx_ccass_date;
CREATE INDEX idx_ccass_date ON hkex_ccass_holdings(shareholding_date DESC);

-- Add comments
COMMENT ON COLUMN hkex_ccass_holdings.stock_name IS 'Full name of the stock';
COMMENT ON COLUMN hkex_ccass_holdings.shareholding_date IS 'Date of the shareholding snapshot';
COMMENT ON COLUMN hkex_ccass_holdings.address IS 'Address of the CCASS participant';

DO $$
BEGIN
  RAISE NOTICE 'CCASS table migration completed successfully';
END $$;
