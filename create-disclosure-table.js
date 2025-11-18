/**
 * Create HKEX Disclosure of Interests table directly via Supabase client
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTYyODE3NywiZXhwIjoyMDY3MjA0MTc3fQ.q3JwLvIJaLjN2gPy7ux-RaMkJ2LHUPL42mR-_5MjJFE';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const createTableSQL = `
-- Create HKEX Disclosure of Interests Table
CREATE TABLE IF NOT EXISTS hkex_disclosure_interests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Stock information
  stock_code VARCHAR(5) NOT NULL,
  stock_name TEXT,
  company_name TEXT,

  -- Shareholder information
  form_serial_number TEXT NOT NULL,
  shareholder_name TEXT NOT NULL,
  shareholder_type TEXT,

  -- Shareholding details
  shares_long BIGINT,
  shares_short BIGINT,
  shares_lending_pool BIGINT,
  percentage_long DECIMAL(10, 4),
  percentage_short DECIMAL(10, 4),
  percentage_lending_pool DECIMAL(10, 4),

  -- Filing information
  filing_date DATE NOT NULL,
  notice_url TEXT,

  -- Metadata
  search_date DATE,
  scraped_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Deduplication
  content_hash VARCHAR(255) UNIQUE NOT NULL,

  -- Constraints
  CONSTRAINT unique_disclosure_filing UNIQUE (stock_code, form_serial_number, shareholder_name)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_hkex_di_stock_code ON hkex_disclosure_interests(stock_code);
CREATE INDEX IF NOT EXISTS idx_hkex_di_shareholder_name ON hkex_disclosure_interests(shareholder_name);
CREATE INDEX IF NOT EXISTS idx_hkex_di_filing_date ON hkex_disclosure_interests(filing_date DESC);
CREATE INDEX IF NOT EXISTS idx_hkex_di_scraped_at ON hkex_disclosure_interests(scraped_at DESC);
CREATE INDEX IF NOT EXISTS idx_hkex_di_stock_filing_date ON hkex_disclosure_interests(stock_code, filing_date DESC);
CREATE INDEX IF NOT EXISTS idx_hkex_di_content_hash ON hkex_disclosure_interests(content_hash);
CREATE INDEX IF NOT EXISTS idx_hkex_di_shareholder_type ON hkex_disclosure_interests(shareholder_type);
CREATE INDEX IF NOT EXISTS idx_hkex_di_percentage_long ON hkex_disclosure_interests(percentage_long DESC) WHERE percentage_long IS NOT NULL;

-- Trigger function for updated_at
CREATE OR REPLACE FUNCTION update_hkex_di_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_hkex_di_updated_at_trigger ON hkex_disclosure_interests;
CREATE TRIGGER update_hkex_di_updated_at_trigger
  BEFORE UPDATE ON hkex_disclosure_interests
  FOR EACH ROW
  EXECUTE FUNCTION update_hkex_di_updated_at();

-- Row Level Security
ALTER TABLE hkex_disclosure_interests ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow public read access to disclosure interests" ON hkex_disclosure_interests;
DROP POLICY IF EXISTS "Allow authenticated insert to disclosure interests" ON hkex_disclosure_interests;
DROP POLICY IF EXISTS "Allow authenticated update to disclosure interests" ON hkex_disclosure_interests;

-- Allow public read access
CREATE POLICY "Allow public read access to disclosure interests"
  ON hkex_disclosure_interests FOR SELECT
  USING (true);

-- Allow authenticated users to insert
CREATE POLICY "Allow authenticated insert to disclosure interests"
  ON hkex_disclosure_interests FOR INSERT
  WITH CHECK (true);

-- Allow authenticated users to update
CREATE POLICY "Allow authenticated update to disclosure interests"
  ON hkex_disclosure_interests FOR UPDATE
  USING (true);
`;

async function createTable() {
  try {
    console.log('🔨 Creating hkex_disclosure_interests table...');

    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: createTableSQL
    });

    if (error) {
      console.error('❌ Error creating table:', error);

      // Try alternative approach - direct table creation
      console.log('🔄 Trying alternative approach...');
      const { error: altError } = await supabase
        .from('hkex_disclosure_interests')
        .select('count')
        .limit(1);

      if (altError && altError.code === '42P01') {
        console.log('⚠️  Table does not exist. Please create it manually via Supabase dashboard.');
        console.log('📋 SQL to execute:');
        console.log(createTableSQL);
      } else if (!altError) {
        console.log('✅ Table already exists!');
      }
    } else {
      console.log('✅ Table created successfully!');
      console.log('📊 Result:', data);
    }
  } catch (err) {
    console.error('❌ Exception:', err);
  }
}

createTable();
