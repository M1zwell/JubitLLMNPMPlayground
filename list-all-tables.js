import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function listTables() {
  console.log('\n📊 Checking Database Tables\n');
  console.log('='.repeat(70));

  // Try to query some known tables
  const tablesToCheck = [
    'hkex_disclosure_interests',
    'hksfc_filings',
    'sfc_statistics_raw',
    'sfc_market_highlights',
    'llm_models',
    'npm_packages'
  ];

  for (const tableName of tablesToCheck) {
    const { data, error } = await supabase
      .from(tableName)
      .select('*', { count: 'exact', head: true });

    if (error) {
      console.log(`❌ ${tableName}: Does not exist (${error.code})`);
    } else {
      console.log(`✅ ${tableName}: Exists (${data?.length || 0} rows)`);
    }
  }

  console.log('\n' + '='.repeat(70));
}

listTables().then(() => process.exit(0));
