-- SFC Financial Statistics Tables
-- Stores data scraped from https://www.sfc.hk/en/Published-resources/Statistics

-- Table A1: Highlights of Hong Kong Stock Market
CREATE TABLE IF NOT EXISTS sfc_market_highlights (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period VARCHAR(50) NOT NULL,
  period_type VARCHAR(20) NOT NULL, -- 'quarterly', 'yearly'
  year INTEGER NOT NULL,
  quarter INTEGER, -- 1, 2, 3, 4 for quarterly data

  -- Market metrics
  market_cap_hkd_billion DECIMAL(20, 2),
  daily_avg_turnover_hkd_billion DECIMAL(20, 2),
  number_of_listed_companies INTEGER,
  number_of_new_listings INTEGER,
  funds_raised_hkd_billion DECIMAL(20, 2),

  -- Additional data (flexible JSON for extensibility)
  additional_data JSONB,

  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_market_highlights UNIQUE (period, period_type, year, quarter)
);

-- Table A2: Market Capitalisation by Stock Type
CREATE TABLE IF NOT EXISTS sfc_market_cap_by_type (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period VARCHAR(50) NOT NULL,
  year INTEGER NOT NULL,
  quarter INTEGER,

  stock_type VARCHAR(100) NOT NULL, -- 'H-shares', 'Red chips', 'Main Board', etc.
  market_cap_hkd_billion DECIMAL(20, 2),
  percentage_of_total DECIMAL(10, 4),

  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_market_cap_by_type UNIQUE (period, year, quarter, stock_type)
);

-- Table A3: Average Daily Turnover by Stock Type
CREATE TABLE IF NOT EXISTS sfc_turnover_by_type (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period VARCHAR(50) NOT NULL,
  year INTEGER NOT NULL,
  quarter INTEGER,

  stock_type VARCHAR(100) NOT NULL,
  avg_daily_turnover_hkd_billion DECIMAL(20, 2),
  percentage_of_total DECIMAL(10, 4),

  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_turnover_by_type UNIQUE (period, year, quarter, stock_type)
);

-- Table C4: Licensed Representatives
CREATE TABLE IF NOT EXISTS sfc_licensed_representatives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period VARCHAR(50) NOT NULL,
  year INTEGER NOT NULL,
  quarter INTEGER,

  regulated_activity VARCHAR(200) NOT NULL, -- 'Type 1', 'Type 2', etc.
  number_of_representatives INTEGER,

  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_licensed_reps UNIQUE (period, year, quarter, regulated_activity)
);

-- Table C5: Responsible Officers
CREATE TABLE IF NOT EXISTS sfc_responsible_officers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period VARCHAR(50) NOT NULL,
  year INTEGER NOT NULL,
  quarter INTEGER,

  regulated_activity VARCHAR(200) NOT NULL,
  number_of_officers INTEGER,

  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_responsible_officers UNIQUE (period, year, quarter, regulated_activity)
);

-- Table D3: Net Asset Value of Mutual Funds
CREATE TABLE IF NOT EXISTS sfc_mutual_fund_nav (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  period VARCHAR(50) NOT NULL,
  year INTEGER NOT NULL,
  quarter INTEGER,

  fund_category VARCHAR(200) NOT NULL, -- 'Equity funds', 'Bond funds', etc.
  nav_hkd_billion DECIMAL(20, 2),
  number_of_funds INTEGER,
  percentage_of_total DECIMAL(10, 4),

  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_mutual_fund_nav UNIQUE (period, year, quarter, fund_category)
);

-- Generic table for storing raw XLSX data
CREATE TABLE IF NOT EXISTS sfc_statistics_raw (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name VARCHAR(100) NOT NULL, -- 'A1', 'A2', 'A3', 'C4', 'C5', 'D3'
  table_title VARCHAR(500) NOT NULL,
  file_url TEXT NOT NULL,
  data JSONB NOT NULL, -- Raw parsed XLSX data

  period VARCHAR(50),
  year INTEGER,
  quarter INTEGER,

  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT unique_statistics_raw UNIQUE (table_name, period, year, quarter)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_market_highlights_period ON sfc_market_highlights(year, quarter);
CREATE INDEX IF NOT EXISTS idx_market_cap_period ON sfc_market_cap_by_type(year, quarter);
CREATE INDEX IF NOT EXISTS idx_turnover_period ON sfc_turnover_by_type(year, quarter);
CREATE INDEX IF NOT EXISTS idx_licensed_reps_period ON sfc_licensed_representatives(year, quarter);
CREATE INDEX IF NOT EXISTS idx_responsible_officers_period ON sfc_responsible_officers(year, quarter);
CREATE INDEX IF NOT EXISTS idx_mutual_fund_period ON sfc_mutual_fund_nav(year, quarter);
CREATE INDEX IF NOT EXISTS idx_statistics_raw_table ON sfc_statistics_raw(table_name);
CREATE INDEX IF NOT EXISTS idx_statistics_raw_period ON sfc_statistics_raw(year, quarter);

-- Enable Row Level Security (RLS)
ALTER TABLE sfc_market_highlights ENABLE ROW LEVEL SECURITY;
ALTER TABLE sfc_market_cap_by_type ENABLE ROW LEVEL SECURITY;
ALTER TABLE sfc_turnover_by_type ENABLE ROW LEVEL SECURITY;
ALTER TABLE sfc_licensed_representatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE sfc_responsible_officers ENABLE ROW LEVEL SECURITY;
ALTER TABLE sfc_mutual_fund_nav ENABLE ROW LEVEL SECURITY;
ALTER TABLE sfc_statistics_raw ENABLE ROW LEVEL SECURITY;

-- Create policies for public read access
CREATE POLICY "Allow public read access to market highlights" ON sfc_market_highlights FOR SELECT USING (true);
CREATE POLICY "Allow public read access to market cap by type" ON sfc_market_cap_by_type FOR SELECT USING (true);
CREATE POLICY "Allow public read access to turnover by type" ON sfc_turnover_by_type FOR SELECT USING (true);
CREATE POLICY "Allow public read access to licensed reps" ON sfc_licensed_representatives FOR SELECT USING (true);
CREATE POLICY "Allow public read access to responsible officers" ON sfc_responsible_officers FOR SELECT USING (true);
CREATE POLICY "Allow public read access to mutual fund NAV" ON sfc_mutual_fund_nav FOR SELECT USING (true);
CREATE POLICY "Allow public read access to raw statistics" ON sfc_statistics_raw FOR SELECT USING (true);

-- Add comments for documentation
COMMENT ON TABLE sfc_market_highlights IS 'SFC Table A1 - Highlights of the Hong Kong Stock Market';
COMMENT ON TABLE sfc_market_cap_by_type IS 'SFC Table A2 - Market Capitalisation by Stock Type';
COMMENT ON TABLE sfc_turnover_by_type IS 'SFC Table A3 - Average Daily Turnover by Stock Type';
COMMENT ON TABLE sfc_licensed_representatives IS 'SFC Table C4 - Number of Regulated Activities of Licensed Representatives';
COMMENT ON TABLE sfc_responsible_officers IS 'SFC Table C5 - Number of Regulated Activities of Responsible/Approved Officers';
COMMENT ON TABLE sfc_mutual_fund_nav IS 'SFC Table D3 - Net Asset Value of Authorised Unit Trusts and Mutual Funds';
COMMENT ON TABLE sfc_statistics_raw IS 'Raw XLSX data from SFC statistics tables';
