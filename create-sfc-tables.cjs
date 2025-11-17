/**
 * Create SFC Statistics Tables Directly
 * Uses Supabase client to execute SQL
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTYyODE3NywiZXhwIjoyMDY3MjA0MTc3fQ.5D9mVu_ssolTEW1ffotXoBFY65DuMvE7ERUHedj0t2E';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  console.log('Creating SFC Statistics tables...\n');

  const migrationSQL = fs.readFileSync(
    path.join(__dirname, 'supabase/migrations/20251117000003_create_sfc_statistics_tables.sql'),
    'utf8'
  );

  // Split into statements
  const statements = migrationSQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 10 && !s.startsWith('--') && !s.match(/^COMMENT ON/));

  console.log(`Executing ${statements.length} SQL statements...\n`);

  let success = 0;
  let errors = 0;

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i] + ';';

    // Skip comments
    if (stmt.match(/^--.*/)) continue;

    console.log(`[${i + 1}/${statements.length}] ${stmt.substring(0, 60)}...`);

    try {
      const { data, error } = await supabase.rpc('query', { query_text: stmt });

      if (error) {
        // Ignore "already exists" errors
        if (error.message.includes('already exists') || error.message.includes('duplicate')) {
          console.log(`  ✓ Already exists, skipping`);
          success++;
        } else {
          console.error(`  ✗ Error: ${error.message}`);
          errors++;
        }
      } else {
        console.log(`  ✓ Success`);
        success++;
      }
    } catch (err) {
      console.error(`  ✗ Exception: ${err.message}`);
      errors++;
    }
  }

  console.log(`\nSummary: ${success} succeeded, ${errors} errors`);
}

main().catch(console.error);
