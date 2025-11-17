/**
 * Verify SFC Statistics Data in Supabase
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkSFCData() {
  console.log('📊 Verifying SFC Statistics Data in Database\n');
  console.log('═'.repeat(60));

  const tables = [
    { id: 'A1', name: 'sfc_market_highlights', description: 'Market Highlights' },
    { id: 'A2', name: 'sfc_market_cap_by_type', description: 'Market Cap by Type' },
    { id: 'A3', name: 'sfc_turnover_by_type', description: 'Turnover by Type' },
    { id: 'C4', name: 'sfc_licensed_representatives', description: 'Licensed Representatives' },
    { id: 'C5', name: 'sfc_responsible_officers', description: 'Responsible Officers' },
    { id: 'D3', name: 'sfc_mutual_fund_nav', description: 'Mutual Fund NAV' },
    { id: 'D4', name: 'sfc_fund_flows', description: 'Fund Flows' }
  ];

  let totalRecords = 0;

  for (const table of tables) {
    try {
      const { data, error, count } = await supabase
        .from(table.name)
        .select('*', { count: 'exact', head: false })
        .limit(3);

      if (error) {
        console.log(`\n❌ Table ${table.id} (${table.description}): ERROR`);
        console.log(`   ${error.message}`);
      } else {
        const recordCount = count || 0;
        totalRecords += recordCount;

        console.log(`\n✅ Table ${table.id} (${table.description}): ${recordCount} records`);

        if (data && data.length > 0) {
          console.log(`   Latest record: ${JSON.stringify(data[0], null, 2).substring(0, 150)}...`);
        }
      }
    } catch (err) {
      console.log(`\n❌ Table ${table.id}: ${err.message}`);
    }
  }

  console.log('\n' + '═'.repeat(60));
  console.log(`📊 TOTAL RECORDS ACROSS ALL SFC TABLES: ${totalRecords}`);
  console.log('═'.repeat(60) + '\n');
}

checkSFCData().catch(console.error);
