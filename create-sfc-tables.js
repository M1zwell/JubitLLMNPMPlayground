import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function createTables() {
  console.log('\n📊 Creating SFC Financial Statistics Tables\n');
  console.log('='.repeat(70));

  // Read the migration SQL file
  const sql = readFileSync('supabase/migrations/20251113_create_sfc_financial_statistics.sql', 'utf-8');

  try {
    // Execute the SQL
    const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('❌ Error creating tables:', error);

      // If exec_sql doesn't exist, try alternative
      console.log('\n⚠️  exec_sql function not available.');
      console.log('Please manually execute the SQL in Supabase SQL Editor:');
      console.log('File: supabase/migrations/20251113_create_sfc_financial_statistics.sql');
      process.exit(1);
    } else {
      console.log('✅ All tables created successfully!');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.log('\n⚠️  Please manually execute the SQL in Supabase SQL Editor:');
    console.log('File: supabase/migrations/20251113_create_sfc_financial_statistics.sql');
    process.exit(1);
  }

  console.log('='.repeat(70));
}

createTables().then(() => process.exit(0));
