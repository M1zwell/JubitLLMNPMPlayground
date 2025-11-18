# Fix Supabase Schema and Restart Batch Scraper

## Issue
The `hkex_ccass_holdings` table has a `content_hash` column with NOT NULL constraint that our scraper doesn't provide.

## Quick Fix

### Step 1: Fix Supabase Table

Open Supabase SQL Editor:
**URL**: https://supabase.com/dashboard/project/kiztaihzanqnrcrqaxsv/sql/new

**Run this SQL**:
```sql
-- Make content_hash nullable
ALTER TABLE hkex_ccass_holdings
  ALTER COLUMN content_hash DROP NOT NULL;
```

**OR** if you don't need content_hash at all:
```sql
-- Drop the column entirely
ALTER TABLE hkex_ccass_holdings
  DROP COLUMN IF EXISTS content_hash;
```

### Step 2: Restart Batch Scraper

After fixing the schema, run:

```bash
timeout 1800 node scrape-ccass-batch.cjs stock-codes-top30.txt 2025/11/10 2025/11/11
```

This will:
- ✅ Scrape 30 stocks × 2 dates = 60 operations
- ✅ Extract full participant details
- ✅ Save to Supabase database automatically
- ✅ Generate JSON summary file

**Estimated time**: 18-20 minutes

## Alternative: Drop and Recreate Table

If you want a clean start:

```sql
-- Drop existing table
DROP TABLE IF EXISTS hkex_ccass_holdings CASCADE;

-- Recreate with correct schema
CREATE TABLE hkex_ccass_holdings (
  id BIGSERIAL PRIMARY KEY,
  stock_code TEXT NOT NULL,
  stock_name TEXT,
  shareholding_date DATE NOT NULL,
  participant_id TEXT NOT NULL,
  participant_name TEXT NOT NULL,
  address TEXT,
  shareholding BIGINT NOT NULL,
  percentage DECIMAL(10, 4),
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_ccass_holding UNIQUE (stock_code, shareholding_date, participant_id)
);

-- Create indexes
CREATE INDEX idx_ccass_stock_code ON hkex_ccass_holdings(stock_code);
CREATE INDEX idx_ccass_date ON hkex_ccass_holdings(shareholding_date);
CREATE INDEX idx_ccass_stock_date ON hkex_ccass_holdings(stock_code, shareholding_date);
CREATE INDEX idx_ccass_participant ON hkex_ccass_holdings(participant_id);

-- Enable RLS
ALTER TABLE hkex_ccass_holdings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Allow public read" ON hkex_ccass_holdings FOR SELECT TO public USING (true);
CREATE POLICY "Allow public insert" ON hkex_ccass_holdings FOR INSERT TO public WITH CHECK (true);
CREATE POLICY "Allow public update" ON hkex_ccass_holdings FOR UPDATE TO public USING (true);
```

Then restart the scraper.
