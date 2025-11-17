/**
 * Run schema fix migration directly via Supabase client
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTYyODE3NywiZXhwIjoyMDY3MjA0MTc3fQ.5D9mVu_ssolTEW1ffotXoBFY65DuMvE7ERUHedj0t2E';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function runMigration() {
  console.log('Running schema fix migration...\n');

  const sql = fs.readFileSync('supabase/migrations/20251117000004_fix_sfc_numeric_fields.sql', 'utf8');

  // Split by semicolons and execute each statement
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 10 && !s.startsWith('--'));

  console.log(`Executing ${statements.length} ALTER TABLE statements...\n`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i];
    console.log(`[${i + 1}/${statements.length}] ${stmt.substring(0, 80)}...`);

    try {
      // Use the REST API to execute SQL
      const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_SERVICE_ROLE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sql: stmt + ';' })
      });

      if (!response.ok) {
        // Fallback: try using Supabase client (won't work for DDL but worth trying)
        console.log('  ⚠️  Direct SQL execution not available');
        console.log('  ℹ️  Please run this manually in Supabase Dashboard → SQL Editor\n');
        return false;
      }

      console.log('  ✅ Success\n');
    } catch (err) {
      console.error(`  ❌ Error: ${err.message}\n`);
    }
  }

  return true;
}

runMigration().then((success) => {
  if (!success) {
    console.log('\n' + '='.repeat(60));
    console.log('📝 MANUAL ACTION REQUIRED');
    console.log('='.repeat(60));
    console.log('\nPlease run the following SQL in Supabase Dashboard:');
    console.log('https://supabase.com/dashboard/project/kiztaihzanqnrcrqaxsv/sql\n');
    console.log('Copy and paste from:');
    console.log('supabase/migrations/20251117000004_fix_sfc_numeric_fields.sql\n');
  }
}).catch(console.error);
