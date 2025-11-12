/**
 * Test Deployed Scrapers on Production
 *
 * Tests the deployed unified-scraper Edge Function with V2 adapters
 */

const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

function printHeader(title) {
  console.log('\n' + '═'.repeat(80));
  console.log(`  ${title}`);
  console.log('═'.repeat(80) + '\n');
}

function printResult(label, value) {
  console.log(`  ${label.padEnd(25)}: ${value}`);
}

function printSuccess(message) {
  console.log(`  ✅ ${message}`);
}

function printError(message) {
  console.log(`  ❌ ${message}`);
}

async function testScraper(source, options = {}) {
  const testName = source === 'hksfc' ? 'HKSFC News Scraper' : 'CCASS Scraper';
  printHeader(`Testing ${testName}`);

  const startTime = Date.now();

  try {
    const payload = {
      source,
      limit: options.limit || 5,
      test_mode: false,
      use_v2: true,
      ...(source === 'ccass' && { stock_code: options.stock_code || '00700' })
    };

    console.log('  Request:');
    console.log(`    URL: ${SUPABASE_URL}/functions/v1/unified-scraper`);
    console.log(`    Payload: ${JSON.stringify(payload, null, 2)}`);
    console.log('');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/unified-scraper`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`,
        'apikey': ANON_KEY
      },
      body: JSON.stringify(payload)
    });

    const duration = Date.now() - startTime;

    if (!response.ok) {
      const errorText = await response.text();
      printError(`HTTP ${response.status}: ${errorText}`);
      return { success: false, error: errorText, duration };
    }

    const result = await response.json();

    console.log('  Response:');
    if (result.success) {
      printSuccess('Scraping successful!');
      console.log('');
      printResult('Records Inserted', result.records_inserted || 0);
      printResult('Records Updated', result.records_updated || 0);
      printResult('Records Failed', result.records_failed || 0);
      printResult('Duration', `${result.duration_ms}ms`);
      printResult('Total Time', `${duration}ms`);
      console.log('');

      // Check if V2 was used by looking at duration or records
      if (result.records_inserted > 0) {
        printSuccess('Data successfully inserted into database');
      }

      if (source === 'hksfc' && result.duration_ms < 5000) {
        printSuccess('Fast response suggests V2 Map endpoint was used!');
      }

    } else {
      printError('Scraping failed');
      printResult('Error', result.error || 'Unknown error');
    }

    return { ...result, duration };

  } catch (error) {
    const duration = Date.now() - startTime;
    printError(`Exception: ${error.message}`);
    printResult('Duration', `${duration}ms`);
    return { success: false, error: error.message, duration };
  }
}

async function checkDatabase() {
  printHeader('Checking Database');

  try {
    // Check recent scrape logs
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/scrape_logs?select=*&order=started_at.desc&limit=5`,
      {
        headers: {
          'Authorization': `Bearer ${ANON_KEY}`,
          'apikey': ANON_KEY
        }
      }
    );

    if (!response.ok) {
      printError(`Failed to fetch logs: ${response.status}`);
      return;
    }

    const logs = await response.json();

    if (logs.length === 0) {
      console.log('  ℹ️  No scrape logs found');
      return;
    }

    console.log(`  📋 Recent Scrapes (last ${logs.length}):`);
    console.log('');

    logs.forEach((log, index) => {
      const engine = log.scraper_engine || 'unknown';
      const isV2 = engine.includes('v2');
      const status = log.status === 'success' ? '✅' : '❌';
      const timestamp = new Date(log.started_at).toLocaleString();

      console.log(`  ${index + 1}. ${status} ${log.source}`);
      printResult('      Engine', `${engine} ${isV2 ? '(V2!)' : ''}`);
      printResult('      Inserted', log.records_inserted || 0);
      printResult('      Updated', log.records_updated || 0);
      printResult('      Duration', `${log.duration_ms}ms`);
      printResult('      Time', timestamp);
      console.log('');
    });

    // Count V2 usage
    const v2Count = logs.filter(log => log.scraper_engine?.includes('v2')).length;
    const v1Count = logs.filter(log => log.scraper_engine?.includes('v1')).length;

    if (v2Count > 0) {
      printSuccess(`V2 adapters are being used! (${v2Count}/${logs.length} recent scrapes)`);
    } else if (v1Count > 0) {
      console.log(`  ⚠️  Only V1 adapters detected (${v1Count}/${logs.length} scrapes)`);
    }

  } catch (error) {
    printError(`Database check failed: ${error.message}`);
  }
}

async function runTests() {
  printHeader('🧪 PRODUCTION SCRAPER DEPLOYMENT TEST');

  console.log('Configuration:');
  printResult('Supabase URL', SUPABASE_URL);
  printResult('Test Mode', 'Production (test_mode: false)');
  printResult('Use V2', 'true (advanced features)');
  console.log('');

  // Test 1: HKSFC
  const hksfcResult = await testScraper('hksfc', { limit: 5 });

  // Wait between tests
  console.log('\n⏱️  Waiting 3 seconds before next test...\n');
  await new Promise(resolve => setTimeout(resolve, 3000));

  // Test 2: CCASS
  const ccassResult = await testScraper('ccass', {
    stock_code: '00700',  // Tencent
    limit: 10
  });

  // Wait before database check
  console.log('\n⏱️  Waiting 2 seconds before database check...\n');
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Check database
  await checkDatabase();

  // Summary
  printHeader('📊 TEST SUMMARY');

  const hksfcPass = hksfcResult.success && hksfcResult.records_inserted > 0;
  const ccassPass = ccassResult.success && ccassResult.records_inserted > 0;

  printResult('HKSFC Test', hksfcPass ? '✅ PASS' : '❌ FAIL');
  printResult('CCASS Test', ccassPass ? '✅ PASS' : '❌ FAIL');
  console.log('');

  if (hksfcPass && ccassPass) {
    printSuccess('All tests passed! Deployment successful!');
    console.log('');
    console.log('  Next steps:');
    console.log('  1. Test via UI at: https://chathogs.com');
    console.log('  2. Monitor logs: supabase functions logs unified-scraper');
    console.log('  3. Check database for new records');
  } else {
    console.log('  ⚠️  Some tests failed. Check logs for details.');
    console.log('');
    console.log('  Troubleshooting:');
    console.log('  1. Verify FIRECRAWL_API_KEY is set in Supabase');
    console.log('  2. Check Edge Function logs for errors');
    console.log('  3. Ensure database tables exist');
    console.log('  4. Try test_mode: true for mock data');
  }

  console.log('');
  console.log('═'.repeat(80));
}

// Run tests
runTests().catch(error => {
  console.error('\n❌ FATAL ERROR:', error);
  process.exit(1);
});
