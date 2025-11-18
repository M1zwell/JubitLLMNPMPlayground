-- Table D3: Net Asset Value of Authorised Unit Trusts and Mutual Funds
-- Source: SFC Statistical Archive - Table D03x
-- Grain: quarterly; fund category + domicile type

CREATE TABLE IF NOT EXISTS d3_mutual_fund_nav (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  year INTEGER NOT NULL,
  quarter INTEGER NOT NULL CHECK (quarter BETWEEN 1 AND 4),
  domicile TEXT NOT NULL CHECK (domicile IN ('HK', 'Non-HK')),
  fund_category TEXT NOT NULL CHECK (fund_category IN (
    'Bond', 'Equity', 'Mixed', 'Money Market', 'Feeder Funds',
    'Index', 'Guaranteed', 'Hedge', 'Commodity/Virtual Asset', 'Total'
  )),
  nav_usd_million NUMERIC,  -- Net Asset Value in US$ millions
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (year, quarter, domicile, fund_category)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_d3_year_quarter ON d3_mutual_fund_nav(year DESC, quarter DESC);
CREATE INDEX IF NOT EXISTS idx_d3_domicile ON d3_mutual_fund_nav(domicile);
CREATE INDEX IF NOT EXISTS idx_d3_fund_category ON d3_mutual_fund_nav(fund_category);

-- Enable Row Level Security
ALTER TABLE d3_mutual_fund_nav ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access
CREATE POLICY "Allow public read access to d3_mutual_fund_nav"
  ON d3_mutual_fund_nav
  FOR SELECT
  TO public
  USING (true);

-- Policy: Allow public insert
CREATE POLICY "Allow public insert to d3_mutual_fund_nav"
  ON d3_mutual_fund_nav
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy: Allow public update
CREATE POLICY "Allow public update to d3_mutual_fund_nav"
  ON d3_mutual_fund_nav
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Policy: Allow public delete
CREATE POLICY "Allow public delete to d3_mutual_fund_nav"
  ON d3_mutual_fund_nav
  FOR DELETE
  TO public
  USING (true);

-- Comments
COMMENT ON TABLE d3_mutual_fund_nav IS 'SFC Table D3 - Net Asset Value of Authorised Unit Trusts and Mutual Funds by Type';
COMMENT ON COLUMN d3_mutual_fund_nav.year IS 'Calendar year';
COMMENT ON COLUMN d3_mutual_fund_nav.quarter IS 'Quarter (1-4)';
COMMENT ON COLUMN d3_mutual_fund_nav.domicile IS 'Fund domicile: HK or Non-HK';
COMMENT ON COLUMN d3_mutual_fund_nav.fund_category IS 'Fund type: Bond, Equity, Mixed, Money Market, Feeder Funds, Index, Guaranteed, Hedge, Commodity/Virtual Asset, or Total';
COMMENT ON COLUMN d3_mutual_fund_nav.nav_usd_million IS 'Net Asset Value in US$ millions';
