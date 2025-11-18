-- Table A2: Market Capitalisation by Stock Type
-- Source: HKEX Statistical Archive - Table A02x
-- Grain: annual/quarterly; board + stock type

CREATE TABLE IF NOT EXISTS a2_mktcap_by_stock_type (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  period_type TEXT NOT NULL CHECK (period_type IN ('year', 'quarter')),
  year INTEGER NOT NULL,
  quarter INTEGER CHECK (quarter BETWEEN 1 AND 4),
  board TEXT NOT NULL CHECK (board IN ('Main', 'GEM')),
  stock_type TEXT NOT NULL CHECK (stock_type IN ('Total', 'HSI_constituents', 'nonH_mainland', 'H_shares')),
  mktcap_hkbn NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (period_type, year, quarter, board, stock_type)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_a2_year ON a2_mktcap_by_stock_type(year DESC);
CREATE INDEX IF NOT EXISTS idx_a2_period_type ON a2_mktcap_by_stock_type(period_type);
CREATE INDEX IF NOT EXISTS idx_a2_board ON a2_mktcap_by_stock_type(board);
CREATE INDEX IF NOT EXISTS idx_a2_stock_type ON a2_mktcap_by_stock_type(stock_type);

-- Enable Row Level Security
ALTER TABLE a2_mktcap_by_stock_type ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access
CREATE POLICY "Allow public read access to a2_mktcap_by_stock_type"
  ON a2_mktcap_by_stock_type
  FOR SELECT
  TO public
  USING (true);

-- Comments
COMMENT ON TABLE a2_mktcap_by_stock_type IS 'HKEX Table A2 - Market Capitalisation by Stock Type (Main Board and GEM)';
COMMENT ON COLUMN a2_mktcap_by_stock_type.period_type IS 'Annual (year) or Quarterly (quarter)';
COMMENT ON COLUMN a2_mktcap_by_stock_type.year IS 'Calendar year';
COMMENT ON COLUMN a2_mktcap_by_stock_type.quarter IS 'Quarter (1-4), null for annual data';
COMMENT ON COLUMN a2_mktcap_by_stock_type.board IS 'Main Board or GEM';
COMMENT ON COLUMN a2_mktcap_by_stock_type.stock_type IS 'Total, HSI_constituents, nonH_mainland, H_shares';
COMMENT ON COLUMN a2_mktcap_by_stock_type.mktcap_hkbn IS 'Market Capitalisation in HK$ billions';
