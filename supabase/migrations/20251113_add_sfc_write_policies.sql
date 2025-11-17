-- Add INSERT and UPDATE policies for SFC Financial Statistics tables
-- This allows the scraper to write data to these tables

-- Raw statistics table
DROP POLICY IF EXISTS "Allow public insert to raw statistics" ON sfc_statistics_raw;
CREATE POLICY "Allow public insert to raw statistics"
  ON sfc_statistics_raw FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update to raw statistics" ON sfc_statistics_raw;
CREATE POLICY "Allow public update to raw statistics"
  ON sfc_statistics_raw FOR UPDATE
  USING (true);

-- Market highlights table
DROP POLICY IF EXISTS "Allow public insert to market highlights" ON sfc_market_highlights;
CREATE POLICY "Allow public insert to market highlights"
  ON sfc_market_highlights FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update to market highlights" ON sfc_market_highlights;
CREATE POLICY "Allow public update to market highlights"
  ON sfc_market_highlights FOR UPDATE
  USING (true);

-- Market cap by type table
DROP POLICY IF EXISTS "Allow public insert to market cap by type" ON sfc_market_cap_by_type;
CREATE POLICY "Allow public insert to market cap by type"
  ON sfc_market_cap_by_type FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update to market cap by type" ON sfc_market_cap_by_type;
CREATE POLICY "Allow public update to market cap by type"
  ON sfc_market_cap_by_type FOR UPDATE
  USING (true);

-- Turnover by type table
DROP POLICY IF EXISTS "Allow public insert to turnover by type" ON sfc_turnover_by_type;
CREATE POLICY "Allow public insert to turnover by type"
  ON sfc_turnover_by_type FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update to turnover by type" ON sfc_turnover_by_type;
CREATE POLICY "Allow public update to turnover by type"
  ON sfc_turnover_by_type FOR UPDATE
  USING (true);

-- Licensed representatives table
DROP POLICY IF EXISTS "Allow public insert to licensed reps" ON sfc_licensed_representatives;
CREATE POLICY "Allow public insert to licensed reps"
  ON sfc_licensed_representatives FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update to licensed reps" ON sfc_licensed_representatives;
CREATE POLICY "Allow public update to licensed reps"
  ON sfc_licensed_representatives FOR UPDATE
  USING (true);

-- Responsible officers table
DROP POLICY IF EXISTS "Allow public insert to responsible officers" ON sfc_responsible_officers;
CREATE POLICY "Allow public insert to responsible officers"
  ON sfc_responsible_officers FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update to responsible officers" ON sfc_responsible_officers;
CREATE POLICY "Allow public update to responsible officers"
  ON sfc_responsible_officers FOR UPDATE
  USING (true);

-- Mutual fund NAV table
DROP POLICY IF EXISTS "Allow public insert to mutual fund NAV" ON sfc_mutual_fund_nav;
CREATE POLICY "Allow public insert to mutual fund NAV"
  ON sfc_mutual_fund_nav FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public update to mutual fund NAV" ON sfc_mutual_fund_nav;
CREATE POLICY "Allow public update to mutual fund NAV"
  ON sfc_mutual_fund_nav FOR UPDATE
  USING (true);
