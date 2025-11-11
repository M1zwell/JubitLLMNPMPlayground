/**
 * Test Unified Scraper (simpler auth)
 *
 * Tests the unified-scraper function which might have different auth requirements
 */

const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

// Test HKSFC scraping via unified-scraper
async function testHKSFC() {
  console.log('Testing HKSFC via unified-scraper...\n');

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/unified-scraper`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY
      },
      body: JSON.stringify({
        source: 'hksfc',
        limit: 5,
        test_mode: false
      })
    });

    console.log(`Status: ${response.status}`);
    const data = await response.json();
    console.log('\nResponse:');
    console.log(JSON.stringify(data, null, 2));

    if (response.ok && data.success) {
      console.log('\n✅ HKSFC Scraping works!');
      console.log(`   Records: ${data.records_inserted + data.records_updated}`);
      console.log(`   Duration: ${data.duration_ms}ms`);
    } else {
      console.log('\n❌ HKSFC Scraping failed');
      console.log(`   Error: ${data.error || 'Unknown'}`);
    }

    return response.ok;

  } catch (error) {
    console.log('\n❌ Request failed:', error.message);
    return false;
  }
}

// Test HKEX scraping via unified-scraper
async function testHKEX() {
  console.log('\n' + '='.repeat(80) + '\n');
  console.log('Testing HKEX via unified-scraper...\n');

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/unified-scraper`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY
      },
      body: JSON.stringify({
        source: 'hkex',
        limit: 3,
        test_mode: false
      })
    });

    console.log(`Status: ${response.status}`);
    const data = await response.json();
    console.log('\nResponse:');
    console.log(JSON.stringify(data, null, 2));

    if (response.ok && data.success) {
      console.log('\n✅ HKEX Scraping works!');
      console.log(`   Records: ${data.records_inserted + data.records_updated}`);
      console.log(`   Duration: ${data.duration_ms}ms`);
    } else {
      console.log('\n❌ HKEX Scraping failed');
      console.log(`   Error: ${data.error || 'Unknown'}`);
    }

    return response.ok;

  } catch (error) {
    console.log('\n❌ Request failed:', error.message);
    return false;
  }
}

// Main
async function main() {
  console.log('🧪 Testing Unified Scraper\n');
  console.log('='.repeat(80) + '\n');

  const hksfcWorks = await testHKSFC();

  await new Promise(r => setTimeout(r, 3000));

  const hkexWorks = await testHKEX();

  console.log('\n' + '='.repeat(80));
  console.log('SUMMARY');
  console.log('='.repeat(80));
  console.log(`HKSFC: ${hksfcWorks ? '✅ Works' : '❌ Failed'}`);
  console.log(`HKEX: ${hkexWorks ? '✅ Works' : '❌ Failed (expected - uses mock data)'}`);

  if (hksfcWorks) {
    console.log('\n✅ Firecrawl works for HKSFC!');
    console.log('   Decision: Use Firecrawl only, no Fly.io needed');
  } else {
    console.log('\n❌ Need to investigate Firecrawl setup');
  }
}

main().catch(console.error);
