-- Migration: Create normalized a1_market_highlights table
-- Purpose: Replace sfc_market_highlights with proper normalized schema per user spec

-- Create new normalized table
CREATE TABLE IF NOT EXISTS a1_market_highlights (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  period_type text NOT NULL,           -- 'year' or 'quarter'
  year int NOT NULL,
  quarter int,                          -- 1–4 or NULL for annual
  main_listed int,                      -- Number of listed companies on Main Board
  main_mktcap_hkbn numeric(12,2),      -- HK$ billion
  main_turnover_hkmm numeric(12,2),    -- HK$ million (average daily)
  gem_listed int,                       -- Number of listed companies on GEM
  gem_mktcap_hkbn numeric(12,2),       -- HK$ billion
  gem_turnover_hkmm numeric(12,2),     -- HK$ million (average daily)
  trading_days int,                     -- Number of trading days in period
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  CONSTRAINT a1_unique_period UNIQUE (period_type, year, quarter)
);

-- Add indexes for common queries
CREATE INDEX IF NOT EXISTS idx_a1_year ON a1_market_highlights(year DESC);
CREATE INDEX IF NOT EXISTS idx_a1_period_type ON a1_market_highlights(period_type);
CREATE INDEX IF NOT EXISTS idx_a1_year_quarter ON a1_market_highlights(year, quarter) WHERE quarter IS NOT NULL;

-- Add comment
COMMENT ON TABLE a1_market_highlights IS 'SFC Table A1 - Highlights of Hong Kong Stock Market (normalized schema)';
COMMENT ON COLUMN a1_market_highlights.main_mktcap_hkbn IS 'Main Board market capitalisation in HK$ billions';
COMMENT ON COLUMN a1_market_highlights.main_turnover_hkmm IS 'Main Board average daily turnover in HK$ millions';
COMMENT ON COLUMN a1_market_highlights.gem_mktcap_hkbn IS 'GEM market capitalisation in HK$ billions';
COMMENT ON COLUMN a1_market_highlights.gem_turnover_hkmm IS 'GEM average daily turnover in HK$ millions';

-- Create dashboard_prompts table for LLM integration
CREATE TABLE IF NOT EXISTS dashboard_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  chart_key text NOT NULL,              -- e.g. 'a1_market_cap_trend'
  title text NOT NULL,
  prompt_template text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE (table_name, chart_key)
);

CREATE INDEX IF NOT EXISTS idx_dashboard_prompts_table ON dashboard_prompts(table_name);
CREATE INDEX IF NOT EXISTS idx_dashboard_prompts_chart ON dashboard_prompts(chart_key);

COMMENT ON TABLE dashboard_prompts IS 'LLM prompt templates for dashboard chart analysis';
COMMENT ON COLUMN dashboard_prompts.chart_key IS 'Unique identifier for chart (e.g., a1_market_cap_trend)';
COMMENT ON COLUMN dashboard_prompts.prompt_template IS 'Template to send to LLM with chart data';

-- Insert A1 prompt templates
INSERT INTO dashboard_prompts (table_name, chart_key, title, prompt_template) VALUES
(
  'a1_market_highlights',
  'a1_market_cap_trend',
  'HKEX Main Board Market Cap Trend',
  'You are a Hong Kong equity market analyst. Using data from table a1_market_highlights with columns (year, main_mktcap_hkbn), generate a concise analysis of the long-term change in Main Board market capitalisation from 1997 to the latest year. Highlight major peaks and troughs, link them to likely market cycles, and comment on how current levels compare with historical highs.'
),
(
  'a1_market_highlights',
  'a1_turnover_trend',
  'Long-term Average Daily Turnover',
  'Using table a1_market_highlights with columns (year, main_turnover_hkmm), analyze the evolution of average daily turnover on the Main Board from 1997 to present. Identify liquidity regimes (boom years vs quiet years) and explain what these patterns reveal about market participation and trading activity over time.'
),
(
  'a1_market_highlights',
  'a1_turnover_quarterly',
  'Quarterly Average Daily Turnover',
  'Using table a1_market_highlights filtered on period_type = ''quarter'', describe the trend in main_turnover_hkmm over the last 8 quarters. Quantify quarter-on-quarter and year-on-year changes and comment whether market liquidity is improving, stable, or declining.'
),
(
  'a1_market_highlights',
  'a1_listed_companies',
  'Number of Listed Companies – Main vs GEM',
  'From table a1_market_highlights, compare the evolution of main_listed and gem_listed across years. Explain how the role of GEM has changed relative to the Main Board and what this implies for new listing trends. Comment on the structural decline of GEM listings and its implications.'
)
ON CONFLICT (table_name, chart_key) DO UPDATE SET
  title = EXCLUDED.title,
  prompt_template = EXCLUDED.prompt_template,
  updated_at = now();

-- Grant permissions (adjust as needed for your RLS policies)
-- ALTER TABLE a1_market_highlights ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE dashboard_prompts ENABLE ROW LEVEL SECURITY;
