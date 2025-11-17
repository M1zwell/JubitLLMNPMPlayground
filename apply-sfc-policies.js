import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function applyPolicies() {
  console.log('\n📊 Applying SFC Write Policies\n');
  console.log('='.repeat(70));

  // Read the SQL file
  const sql = readFileSync('supabase/migrations/20251113_add_sfc_write_policies.sql', 'utf-8');

  console.log('SQL to execute:');
  console.log(sql);
  console.log('='.repeat(70));

  // Split into individual statements and execute each one
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`\nFound ${statements.length} SQL statements to execute\n`);

  for (let i = 0; i < statements.length; i++) {
    const stmt = statements[i] + ';';
    console.log(`\n[${i + 1}/${statements.length}] Executing...`);
    console.log(stmt.substring(0, 100) + '...');

    try {
      const { error } = await supabase.rpc('exec_sql', { sql_query: stmt });

      if (error) {
        console.error('  ❌ Error:', error.message || JSON.stringify(error));
      } else {
        console.log('  ✅ Success');
      }
    } catch (err) {
      console.error('  ❌ Exception:', err.message);
    }
  }

  console.log('\n' + '='.repeat(70));
  console.log('\n⚠️ If exec_sql is not available, please manually execute the SQL in Supabase SQL Editor:');
  console.log('File: supabase/migrations/20251113_add_sfc_write_policies.sql\n');
}

applyPolicies().then(() => process.exit(0));
