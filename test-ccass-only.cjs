const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/unified-scraper`;

async function testCCASS() {
  console.log('🧪 Testing CCASS V2 with mock data...\n');

  const response = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ANON_KEY}`
    },
    body: JSON.stringify({
      source: 'ccass',
      stock_code: '00700',
      limit: 5,
      test_mode: true,  // Use mock data
      use_v2: true
    })
  });

  const result = await response.json();
  console.log('Result:', JSON.stringify(result, null, 2));

  if (result.success && result.records_inserted > 0) {
    console.log('\n✅ SUCCESS: CCASS V2 is working!');
    console.log(`   Inserted: ${result.records_inserted}`);
    console.log(`   Failed: ${result.records_failed}`);
  } else if (result.success && result.records_updated > 0) {
    console.log('\n✅ SUCCESS: CCASS V2 updated existing records!');
    console.log(`   Updated: ${result.records_updated}`);
    console.log(`   Failed: ${result.records_failed}`);
  } else {
    console.log('\n❌ FAILED: Schema mismatch or other error');
    console.log(`   Failed: ${result.records_failed}`);
  }
}

testCCASS().catch(console.error);
