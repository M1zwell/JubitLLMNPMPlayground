# Table A1 Refinement - Setup Guide

## Step 1: Create Tables in Supabase

**Run this SQL in Supabase SQL Editor** (Dashboard → SQL Editor → New Query):

```sql
-- Create normalized a1_market_highlights table
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
  UNIQUE (period_type, year, COALESCE(quarter, 0))
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_a1_year ON a1_market_highlights(year DESC);
CREATE INDEX IF NOT EXISTS idx_a1_period_type ON a1_market_highlights(period_type);
CREATE INDEX IF NOT EXISTS idx_a1_year_quarter ON a1_market_highlights(year, quarter) WHERE quarter IS NOT NULL;

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

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_dashboard_prompts_table ON dashboard_prompts(table_name);
CREATE INDEX IF NOT EXISTS idx_dashboard_prompts_chart ON dashboard_prompts(chart_key);

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
```

## Step 2: Import Data from Excel

After creating the tables, run:

```bash
node import-a1-data.cjs
```

This will:
1. Read data from `c:\Users\user\Desktop\Oyin AM\SFC statistics\a01x.xlsx`
2. Parse Main Board and GEM data (1997-2025)
3. Insert into `a1_market_highlights` table

## Step 3: Verify Data

Check the data was imported:

```sql
SELECT
  year,
  main_listed,
  main_mktcap_hkbn,
  gem_listed,
  gem_mktcap_hkbn
FROM a1_market_highlights
WHERE period_type = 'year'
ORDER BY year DESC
LIMIT 10;
```

## Step 4: Test Dashboard

The frontend components will automatically use the new normalized schema.

## Dashboard Elements (for reference)

### KPI Cards (Latest Year)
1. **Main Board Market Cap** - YoY change
2. **Average Daily Turnover** - YoY change
3. **Listed Companies** (Main + GEM) - YoY change
4. **GEM Market Share** - % of total market cap

### Charts
1. **Long-term Market Cap Trend (1997-latest)**
   - Line chart: year vs main_mktcap_hkbn
   - Shows structural growth from ~HK$3trn to ~HK$50trn

2. **Long-term Turnover Trend**
   - Line: year vs main_turnover_hkmm
   - Identifies liquidity regimes

3. **Listed Companies - Main vs GEM**
   - Dual line: main_listed and gem_listed by year
   - Shows GEM's structural decline

4. **Quarterly Turnover (Recent 2-3 years)**
   - Line: main_turnover_hkmm where period_type='quarter'
   - Tactical market "heat"

## LLM Integration (Future)

The `dashboard_prompts` table stores templates for AI-powered chart analysis:

```typescript
// Example: Fetch prompt and send to LLM
const { data: prompt } = await supabase
  .from('dashboard_prompts')
  .select('*')
  .eq('chart_key', 'a1_market_cap_trend')
  .single();

// Get chart data
const { data: chartData } = await supabase
  .from('a1_market_highlights')
  .select('year, main_mktcap_hkbn')
  .eq('period_type', 'year')
  .order('year');

// Send to LLM
const analysis = await callLLM(prompt.prompt_template, chartData);
```

## Schema Benefits

1. **Normalized**: Separate annual and quarterly data
2. **Flexible**: Easy to add new periods
3. **Performant**: Indexed for common queries
4. **Clean**: No nulls in core metrics (separate Main/GEM columns)
5. **Scalable**: Ready for LLM integration

## Next Steps

After tables are created:
1. Run data import script
2. Frontend automatically uses new schema
3. Implement LLM "Analyze" button per chart
4. Repeat pattern for tables A2, A3, C4, C5, D3, D4
