import { writeFileSync } from 'fs';

const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

/**
 * Comprehensive Test Suite for all Firecrawl v2 Features
 *
 * Tests:
 * 1. Screenshot capture
 * 2. JSON extraction
 * 3. Batch scraping (sequential)
 * 4. Change tracking
 * 5. Combined features
 */

// ============================================================================
// Helper Functions
// ============================================================================

async function scrapeHKEX(options) {
  const response = await fetch(`${SUPABASE_URL}/functions/v1/scrape-orchestrator`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
    },
    body: JSON.stringify({
      source: 'hkex-ccass',
      strategy: 'firecrawl',
      options
    })
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  return await response.json();
}

function printResult(title, data) {
  console.log('\n' + '='.repeat(80));
  console.log(`  ${title}`);
  console.log('='.repeat(80));
  console.log(JSON.stringify(data, null, 2));
}

function saveResult(filename, data) {
  writeFileSync(filename, JSON.stringify(data, null, 2), 'utf8');
  console.log(`\n💾 Saved to: ${filename}`);
}

// ============================================================================
// Test 1: Screenshot Capture
// ============================================================================

async function test1_ScreenshotCapture() {
  console.log('\n📸 TEST 1: Screenshot Capture');
  console.log('─'.repeat(80));

  const startTime = Date.now();

  try {
    const result = await scrapeHKEX({
      stockCodes: ['00700'],
      dateRange: { start: '2025-11-04' },
      captureScreenshot: true  // Enable screenshot
    });

    const duration = Date.now() - startTime;

    printResult('Screenshot Capture Result', {
      success: result.success,
      stockCode: result.data[0]?.stockCode,
      participants: result.data[0]?.participants?.length,
      screenshotUrl: result.data[0]?.screenshotUrl,  // Should have URL
      executionTime: duration
    });

    if (result.data[0]?.screenshotUrl) {
      console.log('\n✅ Screenshot captured successfully!');
      console.log(`🔗 URL: ${result.data[0].screenshotUrl}`);
      console.log('⚠️  Screenshot expires in 24 hours');
    } else {
      console.log('\n❌ Screenshot not captured');
    }

    saveResult('test1-screenshot-result.json', result);
    return result;

  } catch (error) {
    console.error(`\n❌ Test 1 failed:`, error.message);
    return null;
  }
}

// ============================================================================
// Test 2: JSON Extraction
// ============================================================================

async function test2_JSONExtraction() {
  console.log('\n\n🤖 TEST 2: JSON Extraction (AI-based)');
  console.log('─'.repeat(80));

  const startTime = Date.now();

  try {
    const result = await scrapeHKEX({
      stockCodes: ['00700'],
      dateRange: { start: '2025-11-04' },
      useJsonExtraction: true  // Enable JSON extraction
    });

    const duration = Date.now() - startTime;

    printResult('JSON Extraction Result', {
      success: result.success,
      stockCode: result.data[0]?.stockCode,
      stockName: result.data[0]?.stockName,
      participants: result.data[0]?.participants?.length,
      totalShares: result.data[0]?.totalShares,
      sample_participant: result.data[0]?.participants?.[0],
      executionTime: duration
    });

    if (result.data[0]?.participants?.length > 0) {
      console.log('\n✅ JSON extraction successful!');
      console.log(`📊 Extracted ${result.data[0].participants.length} participants`);

      // Verify data types
      const firstParticipant = result.data[0].participants[0];
      console.log(`\n🔍 Data type verification:`);
      console.log(`   shareholding: ${typeof firstParticipant.shareholding} (should be number)`);
      console.log(`   percentage: ${typeof firstParticipant.percentage} (should be number)`);
    } else {
      console.log('\n❌ JSON extraction failed - no participants extracted');
    }

    saveResult('test2-json-result.json', result);
    return result;

  } catch (error) {
    console.error(`\n❌ Test 2 failed:`, error.message);
    return null;
  }
}

// ============================================================================
// Test 3: Batch Scraping
// ============================================================================

async function test3_BatchScraping() {
  console.log('\n\n📦 TEST 3: Batch Scraping (Sequential, 2 stocks)');
  console.log('─'.repeat(80));

  const startTime = Date.now();

  try {
    const result = await scrapeHKEX({
      stockCodes: ['00700', '00005'],  // Tencent + HSBC
      dateRange: { start: '2025-11-04' },
      batchMode: 'sequential',
      batchDelay: 3000  // 3 second delay (shorter for testing)
    });

    const duration = Date.now() - startTime;

    printResult('Batch Scraping Result', {
      success: result.success,
      batchSummary: result.batchSummary,
      stocks: result.data?.map(d => ({
        stockCode: d.stockCode,
        participants: d.participants?.length,
        error: d.error
      })),
      executionTime: duration
    });

    if (result.batchSummary) {
      console.log('\n✅ Batch scraping completed!');
      console.log(`📊 Total stocks: ${result.batchSummary.totalStocks}`);
      console.log(`✅ Succeeded: ${result.batchSummary.successCount}`);
      console.log(`❌ Failed: ${result.batchSummary.failureCount}`);
      console.log(`👥 Total participants: ${result.batchSummary.totalParticipants}`);
      console.log(`⏱️  Average time per stock: ${(duration / result.batchSummary.totalStocks / 1000).toFixed(1)}s`);
    }

    saveResult('test3-batch-result.json', result);
    return result;

  } catch (error) {
    console.error(`\n❌ Test 3 failed:`, error.message);
    return null;
  }
}

// ============================================================================
// Test 4: Change Tracking
// ============================================================================

async function test4_ChangeTracking() {
  console.log('\n\n📊 TEST 4: Change Tracking');
  console.log('─'.repeat(80));

  const startTime = Date.now();

  try {
    const result = await scrapeHKEX({
      stockCodes: ['00700'],
      dateRange: { start: '2025-11-04' },
      enableChangeTracking: true  // Enable change tracking
    });

    const duration = Date.now() - startTime;

    printResult('Change Tracking Result', {
      success: result.success,
      stockCode: result.data[0]?.stockCode,
      participants: result.data[0]?.participants?.length,
      snapshotId: result.data[0]?.snapshotId,  // Should have snapshot ID
      changeCount: result.data[0]?.changeCount,  // Number of changes detected
      changes: result.data[0]?.changes?.slice(0, 3),  // First 3 changes
      executionTime: duration
    });

    if (result.data[0]?.snapshotId) {
      console.log('\n✅ Snapshot saved successfully!');
      console.log(`📸 Snapshot ID: ${result.data[0].snapshotId}`);
      console.log(`📊 Changes detected: ${result.data[0].changeCount || 0}`);

      if (result.data[0].changes?.length > 0) {
        console.log(`\n🔍 Top changes:`);
        result.data[0].changes.slice(0, 3).forEach((change, i) => {
          console.log(`   ${i + 1}. ${change.participantName} (${change.participantId})`);
          console.log(`      ${change.changeType}: ${change.percentChangeMagnitude.toFixed(2)}%`);
        });
      } else {
        console.log(`\nℹ️  No changes detected (this may be the first snapshot)`);
      }
    } else {
      console.log('\n❌ Change tracking failed - no snapshot ID');
    }

    saveResult('test4-changes-result.json', result);
    return result;

  } catch (error) {
    console.error(`\n❌ Test 4 failed:`, error.message);
    return null;
  }
}

// ============================================================================
// Test 5: All Features Combined
// ============================================================================

async function test5_AllFeatures() {
  console.log('\n\n🚀 TEST 5: All Features Combined');
  console.log('─'.repeat(80));
  console.log('⚠️  WARNING: This test uses many Firecrawl credits!');
  console.log('   Screenshot: +1 credit');
  console.log('   JSON extraction: +2 credits');
  console.log('   Total per stock: ~4 credits');

  const startTime = Date.now();

  try {
    const result = await scrapeHKEX({
      stockCodes: ['00700'],
      dateRange: { start: '2025-11-04' },
      captureScreenshot: true,      // Enable all features
      useJsonExtraction: true,
      enableChangeTracking: true
    });

    const duration = Date.now() - startTime;

    printResult('All Features Result', {
      success: result.success,
      features: {
        screenshot: !!result.data[0]?.screenshotUrl,
        jsonExtraction: !!result.data[0]?.participants,
        changeTracking: !!result.data[0]?.snapshotId,
      },
      data: {
        stockCode: result.data[0]?.stockCode,
        stockName: result.data[0]?.stockName,
        participants: result.data[0]?.participants?.length,
        screenshotUrl: result.data[0]?.screenshotUrl,
        snapshotId: result.data[0]?.snapshotId,
        changeCount: result.data[0]?.changeCount,
      },
      executionTime: duration
    });

    console.log('\n✅ Feature Status:');
    console.log(`   📸 Screenshot: ${result.data[0]?.screenshotUrl ? '✅' : '❌'}`);
    console.log(`   🤖 JSON Extraction: ${result.data[0]?.participants?.length > 0 ? '✅' : '❌'}`);
    console.log(`   📊 Change Tracking: ${result.data[0]?.snapshotId ? '✅' : '❌'}`);

    saveResult('test5-all-features-result.json', result);
    return result;

  } catch (error) {
    console.error(`\n❌ Test 5 failed:`, error.message);
    return null;
  }
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function runAllTests() {
  console.log('\n');
  console.log('█'.repeat(80));
  console.log('  🧪 FIRECRAWL V2 COMPREHENSIVE TEST SUITE');
  console.log('█'.repeat(80));
  console.log('\n⚠️  IMPORTANT:');
  console.log('   - Ensure rate limit period has passed (wait 2-3 hours since last scrape)');
  console.log('   - Tests will use Firecrawl credits');
  console.log('   - Results will be saved to test*-result.json files');
  console.log('\nStarting tests in 5 seconds... (Press Ctrl+C to cancel)\n');

  await new Promise(resolve => setTimeout(resolve, 5000));

  const results = {
    test1: null,
    test2: null,
    test3: null,
    test4: null,
    test5: null,
  };

  // Run tests
  results.test1 = await test1_ScreenshotCapture();
  await new Promise(resolve => setTimeout(resolve, 5000));  // Wait 5s between tests

  results.test2 = await test2_JSONExtraction();
  await new Promise(resolve => setTimeout(resolve, 5000));

  results.test3 = await test3_BatchScraping();
  await new Promise(resolve => setTimeout(resolve, 10000));  // Wait 10s before change tracking

  results.test4 = await test4_ChangeTracking();
  await new Promise(resolve => setTimeout(resolve, 10000));

  results.test5 = await test5_AllFeatures();

  // Summary
  console.log('\n\n');
  console.log('█'.repeat(80));
  console.log('  📊 TEST SUITE SUMMARY');
  console.log('█'.repeat(80));

  const tests = [
    { name: 'Screenshot Capture', result: results.test1 },
    { name: 'JSON Extraction', result: results.test2 },
    { name: 'Batch Scraping', result: results.test3 },
    { name: 'Change Tracking', result: results.test4 },
    { name: 'All Features Combined', result: results.test5 },
  ];

  tests.forEach((test, i) => {
    const status = test.result?.success ? '✅ PASSED' : '❌ FAILED';
    console.log(`\n${i + 1}. ${test.name}: ${status}`);
  });

  const passCount = tests.filter(t => t.result?.success).length;
  const failCount = tests.length - passCount;

  console.log('\n' + '─'.repeat(80));
  console.log(`Total: ${tests.length} tests | Passed: ${passCount} | Failed: ${failCount}`);
  console.log('─'.repeat(80));

  console.log('\n📁 Result files:');
  console.log('   - test1-screenshot-result.json');
  console.log('   - test2-json-result.json');
  console.log('   - test3-batch-result.json');
  console.log('   - test4-changes-result.json');
  console.log('   - test5-all-features-result.json');

  console.log('\n✨ Test suite complete!\n');
}

// Run tests
runAllTests().catch(console.error);
