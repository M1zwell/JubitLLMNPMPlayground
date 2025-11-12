const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkDatabase() {
  console.log('\n🔍 Checking database tables...\n');

  // Check HKSFC table
  const { data: hksfc, error: hksfcError } = await supabase
    .from('hksfc_filings')
    .select('*')
    .limit(1);

  console.log('HKSFC Table:');
  console.log('  Exists:', !hksfcError);
  if (hksfcError) console.log('  Error:', hksfcError.message);
  else console.log('  Sample columns:', hksfc[0] ? Object.keys(hksfc[0]).join(', ') : 'No records');

  // Check CCASS table
  const { data: ccass, error: ccassError } = await supabase
    .from('hkex_ccass_holdings')
    .select('*')
    .limit(1);

  console.log('\nCCASS Table:');
  console.log('  Exists:', !ccassError);
  if (ccassError) console.log('  Error:', ccassError.message);
  else console.log('  Sample columns:', ccass[0] ? Object.keys(ccass[0]).join(', ') : 'No records');

  // Check scrape_logs
  const { data: logs, error: logsError } = await supabase
    .from('scrape_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5);

  console.log('\nRecent Scrape Logs:');
  console.log('  Exists:', !logsError);
  if (logsError) {
    console.log('  Error:', logsError.message);
  } else if (logs && logs.length > 0) {
    console.log(`  Found ${logs.length} recent logs:`);
    logs.forEach((log, i) => {
      const engine = log.scraper_engine || 'N/A';
      console.log(`  ${i+1}. ${log.source}: ${log.status} - inserted:${log.records_inserted} failed:${log.records_failed} - engine:${engine}`);
    });
  } else {
    console.log('  No logs found');
  }

  // Test HKSFC insert with sample data
  console.log('\n🧪 Testing HKSFC insert...');
  const testRecord = {
    title: 'Test Article V2',
    content: 'Test content from V2 adapter',
    filing_type: 'news',
    url: 'https://test.com/v2-test',
    content_hash: 'test-hash-' + Date.now()
  };

  const { data: insertData, error: insertError } = await supabase
    .from('hksfc_filings')
    .insert(testRecord)
    .select();

  if (insertError) {
    console.log('  ❌ Insert failed:', insertError.message);
    console.log('  Error details:', insertError);
  } else {
    console.log('  ✅ Insert successful:', insertData);
  }
}

checkDatabase().catch(console.error);
