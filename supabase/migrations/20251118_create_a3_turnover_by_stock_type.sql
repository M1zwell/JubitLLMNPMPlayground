-- Table A3: Average Daily Turnover by Stock Type
-- Source: HKEX Statistical Archive - Table A03x
-- Grain: annual/quarterly; board + stock type

CREATE TABLE IF NOT EXISTS a3_turnover_by_stock_type (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  period_type TEXT NOT NULL CHECK (period_type IN ('year', 'quarter')),
  year INTEGER NOT NULL,
  quarter INTEGER CHECK (quarter BETWEEN 1 AND 4),
  board TEXT NOT NULL CHECK (board IN ('Main', 'GEM')),
  stock_type TEXT NOT NULL CHECK (stock_type IN ('Total', 'HSI_constituents', 'nonH_mainland', 'H_shares')),
  avg_turnover_hkmm NUMERIC,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (period_type, year, quarter, board, stock_type)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_a3_year ON a3_turnover_by_stock_type(year DESC);
CREATE INDEX IF NOT EXISTS idx_a3_period_type ON a3_turnover_by_stock_type(period_type);
CREATE INDEX IF NOT EXISTS idx_a3_board ON a3_turnover_by_stock_type(board);
CREATE INDEX IF NOT EXISTS idx_a3_stock_type ON a3_turnover_by_stock_type(stock_type);

-- Enable Row Level Security
ALTER TABLE a3_turnover_by_stock_type ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access
CREATE POLICY "Allow public read access to a3_turnover_by_stock_type"
  ON a3_turnover_by_stock_type
  FOR SELECT
  TO public
  USING (true);

-- Policy: Allow public insert
CREATE POLICY "Allow public insert to a3_turnover_by_stock_type"
  ON a3_turnover_by_stock_type
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy: Allow public update
CREATE POLICY "Allow public update to a3_turnover_by_stock_type"
  ON a3_turnover_by_stock_type
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Policy: Allow public delete
CREATE POLICY "Allow public delete to a3_turnover_by_stock_type"
  ON a3_turnover_by_stock_type
  FOR DELETE
  TO public
  USING (true);

-- Comments
COMMENT ON TABLE a3_turnover_by_stock_type IS 'HKEX Table A3 - Average Daily Turnover by Stock Type (Main Board and GEM)';
COMMENT ON COLUMN a3_turnover_by_stock_type.period_type IS 'Annual (year) or Quarterly (quarter)';
COMMENT ON COLUMN a3_turnover_by_stock_type.year IS 'Calendar year';
COMMENT ON COLUMN a3_turnover_by_stock_type.quarter IS 'Quarter (1-4), null for annual data';
COMMENT ON COLUMN a3_turnover_by_stock_type.board IS 'Main Board or GEM';
COMMENT ON COLUMN a3_turnover_by_stock_type.stock_type IS 'Total, HSI_constituents, nonH_mainland, H_shares';
COMMENT ON COLUMN a3_turnover_by_stock_type.avg_turnover_hkmm IS 'Average Daily Turnover in HK$ millions';
