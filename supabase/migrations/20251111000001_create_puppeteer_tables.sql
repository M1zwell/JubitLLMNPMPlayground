-- Create tables for Puppeteer-scraped HKEx data
-- 1. CCASS Holdings table
-- 2. Market Statistics table

-- Table: hkex_ccass_holdings
-- Stores CCASS participant shareholding data
CREATE TABLE IF NOT EXISTS hkex_ccass_holdings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_code VARCHAR(5) NOT NULL,
  participant_id VARCHAR(10) NOT NULL,
  participant_name TEXT NOT NULL,
  shareholding TEXT NOT NULL,
  percentage TEXT NOT NULL,
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  content_hash VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for CCASS holdings
CREATE INDEX IF NOT EXISTS idx_hkex_ccass_stock_code ON hkex_ccass_holdings(stock_code);
CREATE INDEX IF NOT EXISTS idx_hkex_ccass_participant_id ON hkex_ccass_holdings(participant_id);
CREATE INDEX IF NOT EXISTS idx_hkex_ccass_scraped_at ON hkex_ccass_holdings(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_hkex_ccass_content_hash ON hkex_ccass_holdings(content_hash);

-- Table: hkex_market_stats
-- Stores market trading statistics
CREATE TABLE IF NOT EXISTS hkex_market_stats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  date VARCHAR(50) NOT NULL,
  turnover TEXT,
  volume TEXT,
  data JSONB, -- Store full row data as JSON
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  content_hash VARCHAR(255) UNIQUE NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for market stats
CREATE INDEX IF NOT EXISTS idx_hkex_market_stats_date ON hkex_market_stats(date);
CREATE INDEX IF NOT EXISTS idx_hkex_market_stats_scraped_at ON hkex_market_stats(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_hkex_market_stats_content_hash ON hkex_market_stats(content_hash);

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_hkex_ccass_holdings_updated_at ON hkex_ccass_holdings;
CREATE TRIGGER update_hkex_ccass_holdings_updated_at
  BEFORE UPDATE ON hkex_ccass_holdings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_hkex_market_stats_updated_at ON hkex_market_stats;
CREATE TRIGGER update_hkex_market_stats_updated_at
  BEFORE UPDATE ON hkex_market_stats
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS) policies
ALTER TABLE hkex_ccass_holdings ENABLE ROW LEVEL SECURITY;
ALTER TABLE hkex_market_stats ENABLE ROW LEVEL SECURITY;

-- Allow public read access
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'hkex_ccass_holdings' AND policyname = 'Allow public read access to CCASS holdings'
  ) THEN
    CREATE POLICY "Allow public read access to CCASS holdings"
      ON hkex_ccass_holdings FOR SELECT
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'hkex_market_stats' AND policyname = 'Allow public read access to market stats'
  ) THEN
    CREATE POLICY "Allow public read access to market stats"
      ON hkex_market_stats FOR SELECT
      USING (true);
  END IF;
END $$;

-- Allow authenticated insert/update
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'hkex_ccass_holdings' AND policyname = 'Allow authenticated insert to CCASS holdings'
  ) THEN
    CREATE POLICY "Allow authenticated insert to CCASS holdings"
      ON hkex_ccass_holdings FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'hkex_ccass_holdings' AND policyname = 'Allow authenticated update to CCASS holdings'
  ) THEN
    CREATE POLICY "Allow authenticated update to CCASS holdings"
      ON hkex_ccass_holdings FOR UPDATE
      USING (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'hkex_market_stats' AND policyname = 'Allow authenticated insert to market stats'
  ) THEN
    CREATE POLICY "Allow authenticated insert to market stats"
      ON hkex_market_stats FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'hkex_market_stats' AND policyname = 'Allow authenticated update to market stats'
  ) THEN
    CREATE POLICY "Allow authenticated update to market stats"
      ON hkex_market_stats FOR UPDATE
      USING (true);
  END IF;
END $$;

-- Comments
COMMENT ON TABLE hkex_ccass_holdings IS 'CCASS participant shareholding data scraped via Puppeteer';
COMMENT ON TABLE hkex_market_stats IS 'Market trading statistics scraped via Puppeteer';

COMMENT ON COLUMN hkex_ccass_holdings.stock_code IS 'HKEx stock code (5 digits)';
COMMENT ON COLUMN hkex_ccass_holdings.participant_id IS 'CCASS participant ID';
COMMENT ON COLUMN hkex_ccass_holdings.participant_name IS 'CCASS participant name (e.g., HSBC Nominees)';
COMMENT ON COLUMN hkex_ccass_holdings.shareholding IS 'Number of shares held';
COMMENT ON COLUMN hkex_ccass_holdings.percentage IS 'Percentage of total issued shares';
COMMENT ON COLUMN hkex_ccass_holdings.content_hash IS 'SHA-256 hash for deduplication';

COMMENT ON COLUMN hkex_market_stats.date IS 'Trading date';
COMMENT ON COLUMN hkex_market_stats.turnover IS 'Market turnover';
COMMENT ON COLUMN hkex_market_stats.volume IS 'Trading volume';
COMMENT ON COLUMN hkex_market_stats.data IS 'Full row data as JSON';
COMMENT ON COLUMN hkex_market_stats.content_hash IS 'SHA-256 hash for deduplication';
