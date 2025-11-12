-- Create HKEX CCASS Holdings Table
-- Stores shareholding data from CCASS participants

CREATE TABLE IF NOT EXISTS hkex_ccass_holdings (
  id BIGSERIAL PRIMARY KEY,
  stock_code TEXT NOT NULL,
  stock_name TEXT,
  shareholding_date DATE NOT NULL,
  participant_id TEXT NOT NULL,
  participant_name TEXT NOT NULL,
  address TEXT,
  shareholding BIGINT NOT NULL,
  percentage DECIMAL(10,4) NOT NULL,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Unique constraint to prevent duplicate entries
  CONSTRAINT unique_ccass_holding UNIQUE (stock_code, shareholding_date, participant_id)
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_ccass_stock_date ON hkex_ccass_holdings(stock_code, shareholding_date DESC);
CREATE INDEX IF NOT EXISTS idx_ccass_participant ON hkex_ccass_holdings(participant_id);
CREATE INDEX IF NOT EXISTS idx_ccass_scraped_at ON hkex_ccass_holdings(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_ccass_stock_code ON hkex_ccass_holdings(stock_code);
CREATE INDEX IF NOT EXISTS idx_ccass_date ON hkex_ccass_holdings(shareholding_date DESC);

-- Create a view for easy querying of latest holdings
CREATE OR REPLACE VIEW hkex_ccass_latest_holdings AS
SELECT DISTINCT ON (h.stock_code, h.participant_id)
  h.id,
  h.stock_code,
  h.stock_name,
  h.shareholding_date,
  h.participant_id,
  h.participant_name,
  h.address,
  h.shareholding,
  h.percentage,
  h.scraped_at
FROM hkex_ccass_holdings h
ORDER BY h.stock_code, h.participant_id, h.shareholding_date DESC;

-- Create a view for top shareholders by stock
CREATE OR REPLACE VIEW hkex_ccass_top_shareholders AS
WITH ranked_holdings AS (
  SELECT
    h.*,
    ROW_NUMBER() OVER (PARTITION BY h.stock_code, h.shareholding_date ORDER BY h.shareholding DESC) as rank
  FROM hkex_ccass_holdings h
)
SELECT
  stock_code,
  stock_name,
  shareholding_date,
  participant_id,
  participant_name,
  address,
  shareholding,
  percentage,
  rank,
  scraped_at
FROM ranked_holdings
WHERE rank <= 20
ORDER BY stock_code, shareholding_date DESC, rank;

-- Add comments
COMMENT ON TABLE hkex_ccass_holdings IS 'HKEX CCASS participant shareholding data';
COMMENT ON COLUMN hkex_ccass_holdings.stock_code IS 'Stock code (e.g., 00700 for Tencent)';
COMMENT ON COLUMN hkex_ccass_holdings.shareholding_date IS 'Date of the shareholding snapshot';
COMMENT ON COLUMN hkex_ccass_holdings.participant_id IS 'CCASS Participant ID (e.g., C00019)';
COMMENT ON COLUMN hkex_ccass_holdings.shareholding IS 'Number of shares held';
COMMENT ON COLUMN hkex_ccass_holdings.percentage IS 'Percentage of total issued shares';

-- Enable Row Level Security (RLS)
ALTER TABLE hkex_ccass_holdings ENABLE ROW LEVEL SECURITY;

-- Create policy for public read access
CREATE POLICY "Allow public read access" ON hkex_ccass_holdings
  FOR SELECT
  USING (true);

-- Create policy for authenticated users to insert
CREATE POLICY "Allow authenticated insert" ON hkex_ccass_holdings
  FOR INSERT
  WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Create policy for authenticated users to update
CREATE POLICY "Allow authenticated update" ON hkex_ccass_holdings
  FOR UPDATE
  USING (auth.role() = 'authenticated' OR auth.role() = 'service_role');

-- Sample query examples (commented out)
/*
-- Get latest holdings for a stock
SELECT * FROM hkex_ccass_latest_holdings
WHERE stock_code = '00700'
ORDER BY shareholding DESC
LIMIT 20;

-- Get top 10 shareholders across all dates
SELECT * FROM hkex_ccass_top_shareholders
WHERE stock_code = '00700'
AND shareholding_date >= CURRENT_DATE - INTERVAL '30 days'
ORDER BY shareholding_date DESC, rank;

-- Track a specific participant's holdings over time
SELECT
  shareholding_date,
  stock_code,
  stock_name,
  shareholding,
  percentage
FROM hkex_ccass_holdings
WHERE participant_id = 'C00019'
ORDER BY shareholding_date DESC, shareholding DESC;

-- Calculate concentration (top 5 shareholders' percentage)
WITH top_5 AS (
  SELECT
    stock_code,
    shareholding_date,
    SUM(percentage) as top_5_percentage
  FROM (
    SELECT
      stock_code,
      shareholding_date,
      percentage,
      ROW_NUMBER() OVER (PARTITION BY stock_code, shareholding_date ORDER BY shareholding DESC) as rank
    FROM hkex_ccass_holdings
  ) ranked
  WHERE rank <= 5
  GROUP BY stock_code, shareholding_date
)
SELECT * FROM top_5
WHERE stock_code = '00700'
ORDER BY shareholding_date DESC;
*/
