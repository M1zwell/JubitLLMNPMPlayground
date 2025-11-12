/**
 * Setup HKEX CCASS Holdings table in Supabase
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const SQL_CREATE_TABLE = `
-- Create table for HKEX CCASS Holdings data
CREATE TABLE IF NOT EXISTS hkex_ccass_holdings (
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
CREATE INDEX IF NOT EXISTS idx_ccass_stock_code ON hkex_ccass_holdings(stock_code);
CREATE INDEX IF NOT EXISTS idx_ccass_date ON hkex_ccass_holdings(shareholding_date);
CREATE INDEX IF NOT EXISTS idx_ccass_stock_date ON hkex_ccass_holdings(stock_code, shareholding_date);
CREATE INDEX IF NOT EXISTS idx_ccass_participant ON hkex_ccass_holdings(participant_id);

-- Enable RLS
ALTER TABLE hkex_ccass_holdings ENABLE ROW LEVEL SECURITY;

-- Create policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'hkex_ccass_holdings'
    AND policyname = 'Allow public read access'
  ) THEN
    CREATE POLICY "Allow public read access" ON hkex_ccass_holdings
      FOR SELECT TO public USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'hkex_ccass_holdings'
    AND policyname = 'Allow public insert access'
  ) THEN
    CREATE POLICY "Allow public insert access" ON hkex_ccass_holdings
      FOR INSERT TO public WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'hkex_ccass_holdings'
    AND policyname = 'Allow public update access'
  ) THEN
    CREATE POLICY "Allow public update access" ON hkex_ccass_holdings
      FOR UPDATE TO public USING (true);
  END IF;
END $$;
`;

async function setupTable() {
  console.log('🔧 Setting up hkex_ccass_holdings table...\n');
  console.log('Please run this SQL in your Supabase SQL Editor:\n');
  console.log('Dashboard: https://supabase.com/dashboard/project/kiztaihzanqnrcrqaxsv/sql/new\n');
  console.log('='.repeat(80));
  console.log(SQL_CREATE_TABLE);
  console.log('='.repeat(80));
  console.log('\nAfter running the SQL, test the table:');
  console.log('node scrape-ccass-complete.cjs 00700 2025/11/08 --supabase');
}

setupTable();
