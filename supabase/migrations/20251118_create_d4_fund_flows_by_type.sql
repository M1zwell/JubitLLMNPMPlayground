-- Table D4: Fund Flows of Authorised Unit Trusts and Mutual Funds
-- Source: SFC Statistical Archive - Table D04x
-- Grain: annual; fund type + domicile type (HK only)

CREATE TABLE IF NOT EXISTS d4_fund_flows_by_type (
  year INTEGER NOT NULL,
  domicile TEXT NOT NULL CHECK (domicile IN ('HK')),
  fund_type TEXT NOT NULL CHECK (fund_type IN (
    'Bond', 'Equity', 'Mixed', 'MoneyMarket', 'Feeder', 'FundOfFunds',
    'Index', 'Guaranteed', 'CommodityVirtual', 'OtherSpecialised', 'Total'
  )),
  net_flow_usd_mn NUMERIC,  -- Annual net subscription/(redemption) in US$ millions
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (year, domicile, fund_type)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_d4_year ON d4_fund_flows_by_type(year DESC);
CREATE INDEX IF NOT EXISTS idx_d4_domicile ON d4_fund_flows_by_type(domicile);
CREATE INDEX IF NOT EXISTS idx_d4_fund_type ON d4_fund_flows_by_type(fund_type);

-- Enable Row Level Security
ALTER TABLE d4_fund_flows_by_type ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access
CREATE POLICY "Allow public read access to d4_fund_flows_by_type"
  ON d4_fund_flows_by_type
  FOR SELECT
  TO public
  USING (true);

-- Policy: Allow public insert
CREATE POLICY "Allow public insert to d4_fund_flows_by_type"
  ON d4_fund_flows_by_type
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy: Allow public update
CREATE POLICY "Allow public update to d4_fund_flows_by_type"
  ON d4_fund_flows_by_type
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Policy: Allow public delete
CREATE POLICY "Allow public delete to d4_fund_flows_by_type"
  ON d4_fund_flows_by_type
  FOR DELETE
  TO public
  USING (true);

-- Comments
COMMENT ON TABLE d4_fund_flows_by_type IS 'SFC Table D4 - Annual Fund Flows of Authorised Unit Trusts and Mutual Funds by Type';
COMMENT ON COLUMN d4_fund_flows_by_type.year IS 'Calendar year';
COMMENT ON COLUMN d4_fund_flows_by_type.domicile IS 'Fund domicile: HK (Hong Kong-domiciled only)';
COMMENT ON COLUMN d4_fund_flows_by_type.fund_type IS 'Fund type: Bond, Equity, Mixed, MoneyMarket, Feeder, FundOfFunds, Index, Guaranteed, CommodityVirtual, OtherSpecialised, or Total';
COMMENT ON COLUMN d4_fund_flows_by_type.net_flow_usd_mn IS 'Annual net subscription/(redemption) in US$ millions';
