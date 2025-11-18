-- Table D3: Net Asset Value of Authorised Unit Trusts and Mutual Funds
-- Source: SFC Statistical Archive - Table D03x
-- Grain: quarterly; fund type + domicile type

-- Drop old table if exists
DROP TABLE IF EXISTS d3_mutual_fund_nav CASCADE;

CREATE TABLE IF NOT EXISTS d3_fund_nav_by_type (
  as_at_date DATE NOT NULL,
  domicile TEXT NOT NULL CHECK (domicile IN ('HK', 'NonHK', 'All')),
  fund_type TEXT NOT NULL CHECK (fund_type IN (
    'Bond', 'Equity', 'Mixed', 'MoneyMarket', 'Feeder', 'Index',
    'Hedge', 'Guaranteed', 'CommodityVirtual', 'OtherSpecialised', 'Total'
  )),
  nav_usd_mn NUMERIC,  -- Net Asset Value in US$ millions
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (as_at_date, domicile, fund_type)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_d3_as_at_date ON d3_fund_nav_by_type(as_at_date DESC);
CREATE INDEX IF NOT EXISTS idx_d3_domicile ON d3_fund_nav_by_type(domicile);
CREATE INDEX IF NOT EXISTS idx_d3_fund_type ON d3_fund_nav_by_type(fund_type);

-- Enable Row Level Security
ALTER TABLE d3_fund_nav_by_type ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access
CREATE POLICY "Allow public read access to d3_fund_nav_by_type"
  ON d3_fund_nav_by_type
  FOR SELECT
  TO public
  USING (true);

-- Policy: Allow public insert
CREATE POLICY "Allow public insert to d3_fund_nav_by_type"
  ON d3_fund_nav_by_type
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy: Allow public update
CREATE POLICY "Allow public update to d3_fund_nav_by_type"
  ON d3_fund_nav_by_type
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Policy: Allow public delete
CREATE POLICY "Allow public delete to d3_fund_nav_by_type"
  ON d3_fund_nav_by_type
  FOR DELETE
  TO public
  USING (true);

-- Comments
COMMENT ON TABLE d3_fund_nav_by_type IS 'SFC Table D3 - Net Asset Value of Authorised Unit Trusts and Mutual Funds by Type';
COMMENT ON COLUMN d3_fund_nav_by_type.as_at_date IS 'Quarter end date';
COMMENT ON COLUMN d3_fund_nav_by_type.domicile IS 'Fund domicile: HK, NonHK, or All';
COMMENT ON COLUMN d3_fund_nav_by_type.fund_type IS 'Fund type: Bond, Equity, Mixed, MoneyMarket, Feeder, Index, Hedge, Guaranteed, CommodityVirtual, OtherSpecialised, or Total';
COMMENT ON COLUMN d3_fund_nav_by_type.nav_usd_mn IS 'Net Asset Value in US$ millions';
