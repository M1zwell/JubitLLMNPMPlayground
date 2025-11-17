-- SFC Statistics Tables
-- Stores real data from SFC published statistics

-- Table A1: Highlights of Hong Kong Stock Market
CREATE TABLE IF NOT EXISTS sfc_market_highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period TEXT NOT NULL, -- e.g., "2024-Q1", "2024-09"
  period_type TEXT NOT NULL CHECK (period_type IN ('monthly', 'quarterly', 'annual')),
  market_cap DECIMAL(20, 2), -- Market capitalisation in HK$ billion
  turnover DECIMAL(20, 2), -- Average daily turnover in HK$ billion
  total_listings INTEGER, -- Total number of listed companies
  new_listings INTEGER, -- New listings in period
  funds_raised DECIMAL(20, 2), -- Funds raised in HK$ billion
  main_board_cap DECIMAL(20, 2), -- Main board market cap
  gem_cap DECIMAL(20, 2), -- GEM market cap
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(period, period_type)
);

-- Table A2: Market Capitalisation by Stock Type
CREATE TABLE IF NOT EXISTS sfc_market_cap_by_type (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period TEXT NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('monthly', 'quarterly', 'annual')),
  stock_type TEXT NOT NULL, -- e.g., "Main Board - HK", "H-shares", "Red chips", "GEM"
  market_cap DECIMAL(20, 2), -- Market cap in HK$ billion
  percentage DECIMAL(5, 2), -- Percentage of total
  number_of_companies INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(period, period_type, stock_type)
);

-- Table A3: Average Daily Turnover by Stock Type
CREATE TABLE IF NOT EXISTS sfc_turnover_by_type (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period TEXT NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('monthly', 'quarterly', 'annual')),
  stock_type TEXT NOT NULL,
  avg_daily_turnover DECIMAL(20, 2), -- in HK$ billion
  percentage DECIMAL(5, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(period, period_type, stock_type)
);

-- Table C4: Licensed Representatives
CREATE TABLE IF NOT EXISTS sfc_licensed_representatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period TEXT NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('monthly', 'quarterly', 'annual')),
  activity_type TEXT NOT NULL, -- e.g., "Type 1 - Dealing in securities"
  representative_count INTEGER NOT NULL,
  yoy_change DECIMAL(5, 2), -- Year-over-year change percentage
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(period, period_type, activity_type)
);

-- Table C5: Responsible Officers
CREATE TABLE IF NOT EXISTS sfc_responsible_officers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period TEXT NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('monthly', 'quarterly', 'annual')),
  activity_type TEXT NOT NULL,
  officer_count INTEGER NOT NULL,
  yoy_change DECIMAL(5, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(period, period_type, activity_type)
);

-- Table D3: Mutual Fund NAV
CREATE TABLE IF NOT EXISTS sfc_mutual_fund_nav (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period TEXT NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('monthly', 'quarterly', 'annual')),
  fund_category TEXT NOT NULL, -- e.g., "Equity funds", "Bond funds"
  nav DECIMAL(20, 2), -- Net Asset Value in HK$ billion
  fund_count INTEGER,
  percentage DECIMAL(5, 2),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(period, period_type, fund_category)
);

-- Table D4: Fund Flows
CREATE TABLE IF NOT EXISTS sfc_fund_flows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period TEXT NOT NULL,
  period_type TEXT NOT NULL CHECK (period_type IN ('monthly', 'quarterly', 'annual')),
  fund_category TEXT NOT NULL,
  subscriptions DECIMAL(20, 2), -- in HK$ billion
  redemptions DECIMAL(20, 2), -- in HK$ billion
  net_flows DECIMAL(20, 2), -- subscriptions - redemptions
  flow_rate DECIMAL(5, 2), -- percentage
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(period, period_type, fund_category)
);

-- Metadata table to track XLSX imports
CREATE TABLE IF NOT EXISTS sfc_statistics_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_id TEXT NOT NULL UNIQUE, -- e.g., "A1", "D4"
  table_name TEXT NOT NULL,
  last_updated TIMESTAMPTZ,
  data_period TEXT, -- Latest period in the data
  xlsx_url TEXT,
  import_status TEXT CHECK (import_status IN ('pending', 'success', 'failed')),
  import_error TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert metadata for tracking
INSERT INTO sfc_statistics_metadata (table_id, table_name, xlsx_url) VALUES
  ('A1', 'Highlights of HK Stock Market', 'https://www.sfc.hk/-/media/EN/files/SOM/MarketStatistics/a01x.xlsx'),
  ('A2', 'Market Capitalisation by Stock Type', 'https://www.sfc.hk/-/media/EN/files/SOM/MarketStatistics/a02x.xlsx'),
  ('A3', 'Average Daily Turnover by Stock Type', 'https://www.sfc.hk/-/media/EN/files/SOM/MarketStatistics/a03x.xlsx'),
  ('C4', 'Licensed Representatives', 'https://www.sfc.hk/-/media/EN/files/SOM/MarketStatistics/c04x.xlsx'),
  ('C5', 'Responsible Officers', 'https://www.sfc.hk/-/media/EN/files/SOM/MarketStatistics/c05x.xlsx'),
  ('D3', 'Mutual Fund NAV', 'https://www.sfc.hk/-/media/EN/files/SOM/MarketStatistics/d03x.xlsx'),
  ('D4', 'Fund Flows', 'https://www.sfc.hk/-/media/EN/files/SOM/MarketStatistics/d04x.xlsx')
ON CONFLICT (table_id) DO NOTHING;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_market_highlights_period ON sfc_market_highlights(period, period_type);
CREATE INDEX IF NOT EXISTS idx_market_cap_period ON sfc_market_cap_by_type(period, period_type);
CREATE INDEX IF NOT EXISTS idx_turnover_period ON sfc_turnover_by_type(period, period_type);
CREATE INDEX IF NOT EXISTS idx_licensed_reps_period ON sfc_licensed_representatives(period, period_type);
CREATE INDEX IF NOT EXISTS idx_responsible_officers_period ON sfc_responsible_officers(period, period_type);
CREATE INDEX IF NOT EXISTS idx_fund_nav_period ON sfc_mutual_fund_nav(period, period_type);
CREATE INDEX IF NOT EXISTS idx_fund_flows_period ON sfc_fund_flows(period, period_type);

-- Enable RLS
ALTER TABLE sfc_market_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE sfc_market_cap_by_type ENABLE ROW LEVEL SECURITY;
ALTER TABLE sfc_turnover_by_type ENABLE ROW LEVEL SECURITY;
ALTER TABLE sfc_licensed_representatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE sfc_responsible_officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sfc_mutual_fund_nav ENABLE ROW LEVEL SECURITY;
ALTER TABLE sfc_fund_flows ENABLE ROW LEVEL SECURITY;
ALTER TABLE sfc_statistics_metadata ENABLE ROW LEVEL SECURITY;

-- RLS Policies (read-only for all users, write for service role)
CREATE POLICY "Allow public read access" ON sfc_market_highlights FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON sfc_market_cap_by_type FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON sfc_turnover_by_type FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON sfc_licensed_representatives FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON sfc_responsible_officers FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON sfc_mutual_fund_nav FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON sfc_fund_flows FOR SELECT USING (true);
CREATE POLICY "Allow public read access" ON sfc_statistics_metadata FOR SELECT USING (true);

-- Comments
COMMENT ON TABLE sfc_market_highlights IS 'SFC Table A1: Hong Kong Stock Market highlights including market cap, turnover, listings';
COMMENT ON TABLE sfc_market_cap_by_type IS 'SFC Table A2: Market capitalisation breakdown by stock type';
COMMENT ON TABLE sfc_turnover_by_type IS 'SFC Table A3: Average daily turnover by stock type';
COMMENT ON TABLE sfc_licensed_representatives IS 'SFC Table C4: Number of licensed representatives by activity type';
COMMENT ON TABLE sfc_responsible_officers IS 'SFC Table C5: Number of responsible officers by activity type';
COMMENT ON TABLE sfc_mutual_fund_nav IS 'SFC Table D3: Net asset value of authorized mutual funds by category';
COMMENT ON TABLE sfc_fund_flows IS 'SFC Table D4: Fund flows (subscriptions/redemptions) by category';
