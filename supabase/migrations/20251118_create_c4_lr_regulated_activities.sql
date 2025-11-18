-- Table C4: Licensed Representatives by Regulated Activity
-- Source: SFC Statistical Archive - Table C04x
-- Grain: annual/quarterly; all regulated activities (RA1-RA10, RA13)

CREATE TABLE IF NOT EXISTS c4_lr_regulated_activities (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  period_type TEXT NOT NULL CHECK (period_type IN ('year', 'quarter')),
  year INTEGER NOT NULL,
  quarter INTEGER CHECK (quarter BETWEEN 1 AND 4),
  ra1 INTEGER,  -- Type 1: Dealing in securities
  ra2 INTEGER,  -- Type 2: Dealing in futures contracts
  ra3 INTEGER,  -- Type 3: Leveraged foreign exchange trading
  ra4 INTEGER,  -- Type 4: Advising on securities
  ra5 INTEGER,  -- Type 5: Advising on futures contracts
  ra6 INTEGER,  -- Type 6: Advising on corporate finance
  ra7 INTEGER,  -- Type 7: Providing automated trading services
  ra8 INTEGER,  -- Type 8: Securities margin financing
  ra9 INTEGER,  -- Type 9: Asset management
  ra10 INTEGER, -- Type 10: Providing credit rating services
  ra13 INTEGER, -- Type 13: OTC derivative product dealing
  lr_total INTEGER, -- Pre-computed total of all regulated activities
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE (period_type, year, quarter)
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_c4_year ON c4_lr_regulated_activities(year DESC);
CREATE INDEX IF NOT EXISTS idx_c4_period_type ON c4_lr_regulated_activities(period_type);

-- Enable Row Level Security
ALTER TABLE c4_lr_regulated_activities ENABLE ROW LEVEL SECURITY;

-- Policy: Allow public read access
CREATE POLICY "Allow public read access to c4_lr_regulated_activities"
  ON c4_lr_regulated_activities
  FOR SELECT
  TO public
  USING (true);

-- Policy: Allow public insert
CREATE POLICY "Allow public insert to c4_lr_regulated_activities"
  ON c4_lr_regulated_activities
  FOR INSERT
  TO public
  WITH CHECK (true);

-- Policy: Allow public update
CREATE POLICY "Allow public update to c4_lr_regulated_activities"
  ON c4_lr_regulated_activities
  FOR UPDATE
  TO public
  USING (true)
  WITH CHECK (true);

-- Policy: Allow public delete
CREATE POLICY "Allow public delete to c4_lr_regulated_activities"
  ON c4_lr_regulated_activities
  FOR DELETE
  TO public
  USING (true);

-- Comments
COMMENT ON TABLE c4_lr_regulated_activities IS 'SFC Table C4 - Number of Regulated Activities of Licensed Representatives';
COMMENT ON COLUMN c4_lr_regulated_activities.period_type IS 'Annual (year) or Quarterly (quarter)';
COMMENT ON COLUMN c4_lr_regulated_activities.year IS 'Calendar year';
COMMENT ON COLUMN c4_lr_regulated_activities.quarter IS 'Quarter (1-4), null for annual data';
COMMENT ON COLUMN c4_lr_regulated_activities.ra1 IS 'Type 1: Dealing in securities';
COMMENT ON COLUMN c4_lr_regulated_activities.ra2 IS 'Type 2: Dealing in futures contracts';
COMMENT ON COLUMN c4_lr_regulated_activities.ra3 IS 'Type 3: Leveraged foreign exchange trading';
COMMENT ON COLUMN c4_lr_regulated_activities.ra4 IS 'Type 4: Advising on securities';
COMMENT ON COLUMN c4_lr_regulated_activities.ra5 IS 'Type 5: Advising on futures contracts';
COMMENT ON COLUMN c4_lr_regulated_activities.ra6 IS 'Type 6: Advising on corporate finance';
COMMENT ON COLUMN c4_lr_regulated_activities.ra7 IS 'Type 7: Providing automated trading services';
COMMENT ON COLUMN c4_lr_regulated_activities.ra8 IS 'Type 8: Securities margin financing';
COMMENT ON COLUMN c4_lr_regulated_activities.ra9 IS 'Type 9: Asset management';
COMMENT ON COLUMN c4_lr_regulated_activities.ra10 IS 'Type 10: Providing credit rating services';
COMMENT ON COLUMN c4_lr_regulated_activities.ra13 IS 'Type 13: OTC derivative product dealing';
COMMENT ON COLUMN c4_lr_regulated_activities.lr_total IS 'Total count of all regulated activities';
