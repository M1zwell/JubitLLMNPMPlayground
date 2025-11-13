-- Migration: Create HKEX Disclosure of Interests Table
-- Date: 2025-11-13
-- Purpose: Store shareholding disclosure data from HKEX

-- ============================================================================
-- Table: hkex_disclosure_interests
-- Purpose: Store substantial shareholder disclosure data
-- ============================================================================

CREATE TABLE IF NOT EXISTS hkex_disclosure_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Stock information
  stock_code VARCHAR(5) NOT NULL,
  stock_name TEXT,
  company_name TEXT,

  -- Shareholder information
  form_serial_number TEXT NOT NULL,
  shareholder_name TEXT NOT NULL,
  shareholder_type TEXT, -- 'substantial_shareholder' or 'director'

  -- Shareholding details
  shares_long BIGINT,           -- Long position shares
  shares_short BIGINT,          -- Short position shares
  shares_lending_pool BIGINT,   -- Lending pool shares
  percentage_long DECIMAL(10, 4),    -- Long position %
  percentage_short DECIMAL(10, 4),   -- Short position %
  percentage_lending_pool DECIMAL(10, 4), -- Lending pool %

  -- Filing information
  filing_date DATE NOT NULL,
  notice_url TEXT,

  -- Metadata
  search_date DATE,             -- Date when this data was searched/retrieved
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Deduplication
  content_hash VARCHAR(255) UNIQUE NOT NULL,

  -- Constraints
  CONSTRAINT unique_disclosure_filing UNIQUE (stock_code, form_serial_number, shareholder_name)
);

-- ============================================================================
-- Indexes
-- ============================================================================

CREATE INDEX IF NOT EXISTS idx_hkex_di_stock_code ON hkex_disclosure_interests(stock_code);
CREATE INDEX IF NOT EXISTS idx_hkex_di_shareholder_name ON hkex_disclosure_interests(shareholder_name);
CREATE INDEX IF NOT EXISTS idx_hkex_di_filing_date ON hkex_disclosure_interests(filing_date DESC);
CREATE INDEX IF NOT EXISTS idx_hkex_di_scraped_at ON hkex_disclosure_interests(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_hkex_di_stock_filing_date ON hkex_disclosure_interests(stock_code, filing_date DESC);
CREATE INDEX IF NOT EXISTS idx_hkex_di_content_hash ON hkex_disclosure_interests(content_hash);

-- Index for searching by shareholder type
CREATE INDEX IF NOT EXISTS idx_hkex_di_shareholder_type ON hkex_disclosure_interests(shareholder_type);

-- Index for percentage ranges (for finding major shareholders)
CREATE INDEX IF NOT EXISTS idx_hkex_di_percentage_long ON hkex_disclosure_interests(percentage_long DESC) WHERE percentage_long IS NOT NULL;

-- ============================================================================
-- Trigger for updated_at
-- ============================================================================

CREATE OR REPLACE FUNCTION update_hkex_di_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_hkex_di_updated_at_trigger ON hkex_disclosure_interests;
CREATE TRIGGER update_hkex_di_updated_at_trigger
  BEFORE UPDATE ON hkex_disclosure_interests
  FOR EACH ROW
  EXECUTE FUNCTION update_hkex_di_updated_at();

-- ============================================================================
-- Row Level Security (RLS)
-- ============================================================================

ALTER TABLE hkex_disclosure_interests ENABLE ROW LEVEL SECURITY;

-- Allow public read access (disclosure data is public)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'hkex_disclosure_interests'
    AND policyname = 'Allow public read access to disclosure interests'
  ) THEN
    CREATE POLICY "Allow public read access to disclosure interests"
      ON hkex_disclosure_interests FOR SELECT
      USING (true);
  END IF;
END $$;

-- Allow authenticated users to insert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'hkex_disclosure_interests'
    AND policyname = 'Allow authenticated insert to disclosure interests'
  ) THEN
    CREATE POLICY "Allow authenticated insert to disclosure interests"
      ON hkex_disclosure_interests FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

-- Allow authenticated users to update
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'hkex_disclosure_interests'
    AND policyname = 'Allow authenticated update to disclosure interests'
  ) THEN
    CREATE POLICY "Allow authenticated update to disclosure interests"
      ON hkex_disclosure_interests FOR UPDATE
      USING (true);
  END IF;
END $$;

-- ============================================================================
-- Comments
-- ============================================================================

COMMENT ON TABLE hkex_disclosure_interests IS 'HKEX Disclosure of Interests - Substantial shareholder and director shareholdings';
COMMENT ON COLUMN hkex_disclosure_interests.stock_code IS 'HKEx stock code (5 digits, e.g., 00700)';
COMMENT ON COLUMN hkex_disclosure_interests.form_serial_number IS 'Unique form serial number (e.g., CS20180918E00218)';
COMMENT ON COLUMN hkex_disclosure_interests.shares_long IS 'Number of shares in long position';
COMMENT ON COLUMN hkex_disclosure_interests.shares_short IS 'Number of shares in short position';
COMMENT ON COLUMN hkex_disclosure_interests.shares_lending_pool IS 'Number of shares in lending pool';
COMMENT ON COLUMN hkex_disclosure_interests.percentage_long IS 'Percentage of issued voting shares (long position)';
COMMENT ON COLUMN hkex_disclosure_interests.percentage_short IS 'Percentage of issued voting shares (short position)';
COMMENT ON COLUMN hkex_disclosure_interests.percentage_lending_pool IS 'Percentage of issued voting shares (lending pool)';
COMMENT ON COLUMN hkex_disclosure_interests.filing_date IS 'Date when the disclosure notice was filed';
COMMENT ON COLUMN hkex_disclosure_interests.search_date IS 'Date when the search was performed';
COMMENT ON COLUMN hkex_disclosure_interests.content_hash IS 'SHA-256 hash for deduplication';
COMMENT ON COLUMN hkex_disclosure_interests.shareholder_type IS 'Type of shareholder: substantial_shareholder or director';
