import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkData() {
  console.log('\n📊 SFC Financial Statistics Database Check\n');
  console.log('='.repeat(70));

  // Check raw data table
  const { data: rawData, error: rawError } = await supabase
    .from('sfc_statistics_raw')
    .select('table_name, period, year, quarter');

  if (rawError) {
    console.error('Error querying raw data:', rawError);
  } else {
    console.log(`\n✅ Raw Statistics Data: ${rawData?.length || 0} records`);
    if (rawData && rawData.length > 0) {
      const tables = {};
      rawData.forEach(r => {
        if (!tables[r.table_name]) tables[r.table_name] = 0;
        tables[r.table_name]++;
      });
      console.log('\nRecords by table:');
      Object.entries(tables).forEach(([table, count]) => {
        console.log(`  ${table}: ${count} records`);
      });
    }
  }

  console.log('\n' + '='.repeat(70));
}

checkData().then(() => process.exit(0));
