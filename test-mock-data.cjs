const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';
const FUNCTION_URL = `${SUPABASE_URL}/functions/v1/unified-scraper`;

async function testMockData() {
  console.log('\n🧪 Testing with MOCK DATA (test_mode: true)\n');

  // Test HKSFC with mock data
  console.log('Testing HKSFC with mock data...');
  const hksfcResponse = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ANON_KEY}`
    },
    body: JSON.stringify({
      source: 'hksfc',
      limit: 3,
      test_mode: true,  // Use mock data
      use_v2: true
    })
  });

  const hksfcResult = await hksfcResponse.json();
  console.log('HKSFC Mock Result:', JSON.stringify(hksfcResult, null, 2));

  // Test CCASS with mock data
  console.log('\nTesting CCASS with mock data...');
  const ccassResponse = await fetch(FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${ANON_KEY}`
    },
    body: JSON.stringify({
      source: 'ccass',
      limit: 3,
      test_mode: true,  // Use mock data
      use_v2: true,
      stock_code: '00700'
    })
  });

  const ccassResult = await ccassResponse.json();
  console.log('CCASS Mock Result:', JSON.stringify(ccassResult, null, 2));

  console.log('\n📊 Summary:');
  if (hksfcResult.records_inserted > 0 && ccassResult.records_inserted > 0) {
    console.log('  ✅ Mock data inserts successfully - Real data has formatting issue');
  } else {
    console.log('  ❌ Even mock data fails - Database/RLS issue');
  }
}

testMockData().catch(console.error);
