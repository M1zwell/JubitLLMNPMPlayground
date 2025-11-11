/**
 * Test Firecrawl Scraping Capabilities
 *
 * Tests both HKSFC and HKEX scraping via scrape-orchestrator Edge Function
 * to determine if Puppeteer service (Fly.io) is needed.
 */

const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

// Test configurations
const tests = [
  {
    name: 'HKSFC News Scraping (JavaScript SPA)',
    endpoint: `${SUPABASE_URL}/functions/v1/scrape-orchestrator`,
    payload: {
      source: 'hksfc-news',
      strategy: 'firecrawl',
      options: {
        url: 'https://apps.sfc.hk/edistributionWeb/gateway/EN/news-and-announcements/news/',
      }
    },
    critical: false, // Nice to have
    description: 'Tests Firecrawl ability to render React SPA with news articles'
  },
  {
    name: 'HKEX CCASS Scraping (Form Submission)',
    endpoint: `${SUPABASE_URL}/functions/v1/scrape-orchestrator`,
    payload: {
      source: 'hkex-ccass',
      strategy: 'firecrawl',
      options: {
        stockCodes: ['00700'], // Tencent
        dateRange: {
          start: '2025-11-10',
          end: '2025-11-10'
        }
      }
    },
    critical: true, // Must work
    description: 'Tests Firecrawl actions API to submit form and extract table data'
  }
];

// Test runner
async function runTest(test) {
  console.log('\n' + '='.repeat(80));
  console.log(`TEST: ${test.name}`);
  console.log('='.repeat(80));
  console.log(`Description: ${test.description}`);
  console.log(`Critical: ${test.critical ? 'YES ⚠️' : 'NO'}`);
  console.log('\nPayload:');
  console.log(JSON.stringify(test.payload, null, 2));
  console.log('\nSending request...\n');

  const startTime = Date.now();

  try {
    const response = await fetch(test.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${ANON_KEY}`
      },
      body: JSON.stringify(test.payload)
    });

    const executionTime = Date.now() - startTime;
    const responseText = await response.text();

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      data = { raw: responseText };
    }

    console.log(`Status: ${response.status} ${response.ok ? '✅' : '❌'}`);
    console.log(`Execution Time: ${executionTime}ms`);
    console.log('\nResponse:');
    console.log(JSON.stringify(data, null, 2));

    // Analyze results
    if (response.ok && data.success) {
      console.log('\n✅ SUCCESS - Firecrawl worked!');

      // Check data quality
      if (data.data) {
        if (Array.isArray(data.data)) {
          console.log(`   Records returned: ${data.data.length}`);
          if (data.data.length > 0) {
            console.log(`   Sample record keys: ${Object.keys(data.data[0]).join(', ')}`);
          }
        } else if (typeof data.data === 'object') {
          console.log(`   Data keys: ${Object.keys(data.data).join(', ')}`);

          // For HKEX CCASS, check participants
          if (data.data.participants) {
            console.log(`   Participants found: ${data.data.participants?.length || 0}`);
          }
        }
      }

      return { success: true, test: test.name, executionTime, data };
    } else {
      console.log('\n❌ FAILED');
      console.log(`   Error: ${data.error || 'Unknown error'}`);
      console.log(`   Strategy used: ${data.strategy || 'unknown'}`);

      return { success: false, test: test.name, executionTime, error: data.error };
    }

  } catch (error) {
    const executionTime = Date.now() - startTime;
    console.log('\n❌ REQUEST FAILED');
    console.log(`   Error: ${error.message}`);

    return { success: false, test: test.name, executionTime, error: error.message };
  }
}

// Main execution
async function main() {
  console.log('🧪 FIRECRAWL CAPABILITY TEST');
  console.log('Testing if Firecrawl can handle all scraping needs...\n');
  console.log(`Target: ${SUPABASE_URL}`);
  console.log(`Tests: ${tests.length}`);

  const results = [];

  for (const test of tests) {
    const result = await runTest(test);
    results.push(result);

    // Wait between tests
    if (tests.indexOf(test) < tests.length - 1) {
      console.log('\nWaiting 3 seconds before next test...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  // Summary
  console.log('\n' + '='.repeat(80));
  console.log('TEST SUMMARY');
  console.log('='.repeat(80));

  const passed = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const criticalFailed = results.filter(r => !r.success && tests.find(t => t.name === r.test)?.critical).length;

  console.log(`\nTotal Tests: ${results.length}`);
  console.log(`Passed: ${passed} ✅`);
  console.log(`Failed: ${failed} ❌`);
  console.log(`Critical Failed: ${criticalFailed} ${criticalFailed > 0 ? '⚠️' : '✅'}`);

  console.log('\nDetailed Results:');
  results.forEach(r => {
    const testConfig = tests.find(t => t.name === r.test);
    const criticalMarker = testConfig?.critical ? '⚠️ CRITICAL' : '  Optional';
    console.log(`  ${r.success ? '✅' : '❌'} ${r.test} (${r.executionTime}ms) ${criticalMarker}`);
    if (!r.success) {
      console.log(`     Error: ${r.error}`);
    }
  });

  // Decision
  console.log('\n' + '='.repeat(80));
  console.log('RECOMMENDATION');
  console.log('='.repeat(80));

  if (criticalFailed === 0) {
    console.log('\n✅ FIRECRAWL ONLY - All critical tests passed!');
    console.log('\n   Decision: Use Firecrawl for all scraping');
    console.log('   Cost: $0-50/month (already paying)');
    console.log('   Action: No additional infrastructure needed');
    console.log('   ');
    console.log('   ✅ Keep current setup');
    console.log('   ✅ No Fly.io deployment');
    console.log('   ✅ No Netlify Functions');
    console.log('   ✅ Simple architecture');
  } else {
    console.log('\n⚠️ FIRECRAWL INSUFFICIENT - Critical test(s) failed');
    console.log('\n   Failed critical tests:');
    results.filter(r => !r.success && tests.find(t => t.name === r.test)?.critical)
      .forEach(r => {
        console.log(`   - ${r.test}: ${r.error}`);
      });

    console.log('\n   Decision: Add Puppeteer fallback');
    console.log('   ');
    console.log('   OPTION 1 (Recommended): Netlify Functions');
    console.log('   ✅ Cost: $0 (free tier: 125k requests/month)');
    console.log('   ✅ Uses existing infrastructure');
    console.log('   ⚠️ Limitation: 10-second timeout');
    console.log('   ');
    console.log('   OPTION 2: Fly.io Puppeteer Service');
    console.log('   ⚠️ Cost: $2-4/month (512MB RAM)');
    console.log('   ✅ No timeout limits');
    console.log('   ❌ Additional infrastructure to manage');
  }

  console.log('\n' + '='.repeat(80));
  console.log('🎯 Next Steps:');

  if (criticalFailed === 0) {
    console.log('   1. Continue using Firecrawl');
    console.log('   2. Remove unused Puppeteer service code (optional)');
    console.log('   3. Test via HK Scraper UI');
  } else {
    console.log('   1. Review failed test logs above');
    console.log('   2. Check Supabase function logs for details');
    console.log('   3. Decide: Netlify Functions or Fly.io');
    console.log('   4. Implement chosen solution');
  }

  console.log('='.repeat(80));
}

// Run tests
main().catch(console.error);
