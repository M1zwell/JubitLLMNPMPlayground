-- Create table for HKEX CCASS Holdings data
CREATE TABLE IF NOT EXISTS hkex_ccass_holdings (
  id BIGSERIAL PRIMARY KEY,
  stock_code TEXT NOT NULL,
  stock_name TEXT,
  shareholding_date DATE NOT NULL,
  participant_id TEXT NOT NULL,
  participant_name TEXT NOT NULL,
  address TEXT,
  shareholding BIGINT NOT NULL,
  percentage DECIMAL(10, 4),
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint to prevent duplicates
  CONSTRAINT unique_ccass_holding UNIQUE (stock_code, shareholding_date, participant_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_ccass_stock_code ON hkex_ccass_holdings(stock_code);
CREATE INDEX IF NOT EXISTS idx_ccass_date ON hkex_ccass_holdings(shareholding_date);
CREATE INDEX IF NOT EXISTS idx_ccass_stock_date ON hkex_ccass_holdings(stock_code, shareholding_date);
CREATE INDEX IF NOT EXISTS idx_ccass_participant ON hkex_ccass_holdings(participant_id);

-- Enable Row Level Security
ALTER TABLE hkex_ccass_holdings ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all operations for authenticated and anon users
CREATE POLICY "Allow public read access" ON hkex_ccass_holdings
  FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Allow public insert access" ON hkex_ccass_holdings
  FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Allow public update access" ON hkex_ccass_holdings
  FOR UPDATE
  TO public
  USING (true);

-- Add comment
COMMENT ON TABLE hkex_ccass_holdings IS 'HKEX CCASS (Central Clearing and Settlement System) shareholding data scraped from www3.hkexnews.hk';
