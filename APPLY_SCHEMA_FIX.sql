-- ============================================================
-- SFC STATISTICS SCHEMA FIX - COPY AND PASTE INTO SUPABASE
-- ============================================================
-- Go to: https://supabase.com/dashboard/project/kiztaihzanqnrcrqaxsv/sql
-- Paste this entire file and click "Run"
-- ============================================================

-- Table A2: number_of_companies can have decimals
ALTER TABLE sfc_market_cap_by_type
  ALTER COLUMN number_of_companies TYPE DECIMAL(20,2);

-- Tables C4, C5: counts can be very large (use BIGINT instead of INTEGER)
ALTER TABLE sfc_licensed_representatives
  ALTER COLUMN representative_count TYPE BIGINT;

ALTER TABLE sfc_responsible_officers
  ALTER COLUMN officer_count TYPE BIGINT;

-- Table D3: fund_count can have decimals
ALTER TABLE sfc_mutual_fund_nav
  ALTER COLUMN fund_count TYPE DECIMAL(20,2);

-- Also increase precision for large values (some market caps exceed 20 digits)
-- Change DECIMAL(20,2) to NUMERIC to allow unlimited precision
ALTER TABLE sfc_market_highlights
  ALTER COLUMN market_cap TYPE NUMERIC,
  ALTER COLUMN turnover TYPE NUMERIC,
  ALTER COLUMN total_listings TYPE BIGINT,
  ALTER COLUMN new_listings TYPE BIGINT,
  ALTER COLUMN funds_raised TYPE NUMERIC,
  ALTER COLUMN main_board_cap TYPE NUMERIC,
  ALTER COLUMN gem_cap TYPE NUMERIC;

ALTER TABLE sfc_market_cap_by_type
  ALTER COLUMN market_cap TYPE NUMERIC,
  ALTER COLUMN percentage TYPE NUMERIC;

ALTER TABLE sfc_turnover_by_type
  ALTER COLUMN avg_daily_turnover TYPE NUMERIC,
  ALTER COLUMN percentage TYPE NUMERIC;

ALTER TABLE sfc_licensed_representatives
  ALTER COLUMN yoy_change TYPE NUMERIC;

ALTER TABLE sfc_responsible_officers
  ALTER COLUMN yoy_change TYPE NUMERIC;

ALTER TABLE sfc_mutual_fund_nav
  ALTER COLUMN nav TYPE NUMERIC,
  ALTER COLUMN percentage TYPE NUMERIC;

ALTER TABLE sfc_fund_flows
  ALTER COLUMN subscriptions TYPE NUMERIC,
  ALTER COLUMN redemptions TYPE NUMERIC,
  ALTER COLUMN net_flows TYPE NUMERIC,
  ALTER COLUMN flow_rate TYPE NUMERIC;

-- ============================================================
-- DONE! Now run: node scrape-sfc-statistics-local.cjs
-- ============================================================
