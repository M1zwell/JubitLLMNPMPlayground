import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

/**
 * Test batch scraping functionality for HKEX CCASS
 *
 * This script demonstrates:
 * 1. Sequential batch scraping with delays
 * 2. Concurrent batch scraping
 * 3. Custom delay and batch size configuration
 */

// ============================================================================
// Test Configuration
// ============================================================================

const TEST_STOCKS = {
  // Small batch for quick testing
  small: ['00700', '00005', '00941'],  // Tencent, HSBC, China Mobile

  // Medium batch for comprehensive testing
  medium: ['00700', '00005', '00941', '00388', '03988', '01299', '02318', '01398'],

  // Large batch (use with caution - may take 10+ minutes)
  large: ['00700', '00005', '00941', '00388', '03988', '01299', '02318', '01398',
          '00939', '00883', '02331', '09988', '01810', '02382', '00688']
};

// ============================================================================
// Test Functions
// ============================================================================

async function testSequentialBatch() {
  console.log('='.repeat(70));
  console.log('TEST 1: Sequential Batch Scraping');
  console.log('='.repeat(70));
  console.log('Stock Codes:', TEST_STOCKS.small);
  console.log('Batch Mode: Sequential');
  console.log('Delay: 5000ms (default)');
  console.log('Expected Duration: ~50 seconds (3 stocks × ~15s each + 2 delays × 5s)');
  console.log('');

  const startTime = Date.now();

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/scrape-orchestrator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        source: 'hkex-ccass',
        strategy: 'firecrawl',
        options: {
          stockCodes: TEST_STOCKS.small,
          dateRange: {
            start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          },
          batchMode: 'sequential',
          batchDelay: 5000  // 5 second delay between requests
        }
      })
    });

    const data = await response.json();
    const duration = Date.now() - startTime;

    console.log('\n📊 Results:');
    console.log(JSON.stringify(data, null, 2));

    console.log('\n📈 Summary:');
    console.log(`Total Stocks: ${data.batchSummary?.totalStocks || 0}`);
    console.log(`Succeeded: ${data.batchSummary?.successCount || 0}`);
    console.log(`Failed: ${data.batchSummary?.failureCount || 0}`);
    console.log(`Total Participants: ${data.batchSummary?.totalParticipants || 0}`);
    console.log(`Duration: ${(duration / 1000).toFixed(1)}s`);

    // Save results
    writeFileSync('batch-sequential-results.json', JSON.stringify(data, null, 2), 'utf8');
    console.log('\n✅ Results saved to: batch-sequential-results.json');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

async function testConcurrentBatch() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST 2: Concurrent Batch Scraping');
  console.log('='.repeat(70));
  console.log('Stock Codes:', TEST_STOCKS.small);
  console.log('Batch Mode: Concurrent');
  console.log('Batch Size: 3 (process 3 stocks in parallel)');
  console.log('Delay: 5000ms between batches');
  console.log('Expected Duration: ~20 seconds (1 batch × ~15s + overhead)');
  console.log('');

  const startTime = Date.now();

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/scrape-orchestrator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        source: 'hkex-ccass',
        strategy: 'firecrawl',
        options: {
          stockCodes: TEST_STOCKS.small,
          dateRange: {
            start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          },
          batchMode: 'concurrent',
          batchSize: 3,      // Process 3 stocks concurrently
          batchDelay: 5000   // 5 second delay between batches
        }
      })
    });

    const data = await response.json();
    const duration = Date.now() - startTime;

    console.log('\n📊 Results:');
    console.log(JSON.stringify(data, null, 2));

    console.log('\n📈 Summary:');
    console.log(`Total Stocks: ${data.batchSummary?.totalStocks || 0}`);
    console.log(`Succeeded: ${data.batchSummary?.successCount || 0}`);
    console.log(`Failed: ${data.batchSummary?.failureCount || 0}`);
    console.log(`Total Participants: ${data.batchSummary?.totalParticipants || 0}`);
    console.log(`Duration: ${(duration / 1000).toFixed(1)}s`);
    console.log(`Speed Improvement: ${((50 - duration / 1000) / 50 * 100).toFixed(1)}% faster than sequential`);

    // Save results
    writeFileSync('batch-concurrent-results.json', JSON.stringify(data, null, 2), 'utf8');
    console.log('\n✅ Results saved to: batch-concurrent-results.json');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

async function testCustomDelayBatch() {
  console.log('\n' + '='.repeat(70));
  console.log('TEST 3: Custom Delay Sequential Batch');
  console.log('='.repeat(70));
  console.log('Stock Codes:', TEST_STOCKS.small.slice(0, 2));  // Only 2 stocks for quick test
  console.log('Batch Mode: Sequential');
  console.log('Delay: 10000ms (10 seconds - conservative for rate limiting)');
  console.log('Expected Duration: ~40 seconds (2 stocks × ~15s each + 1 delay × 10s)');
  console.log('');

  const startTime = Date.now();

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/scrape-orchestrator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        source: 'hkex-ccass',
        strategy: 'firecrawl',
        options: {
          stockCodes: TEST_STOCKS.small.slice(0, 2),
          dateRange: {
            start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
          },
          batchMode: 'sequential',
          batchDelay: 10000  // 10 second delay (more conservative)
        }
      })
    });

    const data = await response.json();
    const duration = Date.now() - startTime;

    console.log('\n📊 Results:');
    console.log(JSON.stringify(data, null, 2));

    console.log('\n📈 Summary:');
    console.log(`Total Stocks: ${data.batchSummary?.totalStocks || 0}`);
    console.log(`Succeeded: ${data.batchSummary?.successCount || 0}`);
    console.log(`Failed: ${data.batchSummary?.failureCount || 0}`);
    console.log(`Duration: ${(duration / 1000).toFixed(1)}s`);

    // Save results
    writeFileSync('batch-custom-delay-results.json', JSON.stringify(data, null, 2), 'utf8');
    console.log('\n✅ Results saved to: batch-custom-delay-results.json');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function runAllTests() {
  console.log('\n');
  console.log('█'.repeat(70));
  console.log('  HKEX CCASS Batch Scraping Test Suite');
  console.log('█'.repeat(70));
  console.log('');
  console.log('⚠️  WARNING: These tests will make multiple API calls to Firecrawl');
  console.log('    and HKEX. Wait at least 2-3 hours since last scrape to avoid');
  console.log('    rate limiting.');
  console.log('');
  console.log('Running tests in 5 seconds... (Press Ctrl+C to cancel)');

  await new Promise(resolve => setTimeout(resolve, 5000));

  // Test 1: Sequential batch
  await testSequentialBatch();

  console.log('\n⏳ Waiting 2 minutes before next test to avoid rate limiting...\n');
  await new Promise(resolve => setTimeout(resolve, 120000));

  // Test 2: Concurrent batch
  await testConcurrentBatch();

  console.log('\n⏳ Waiting 2 minutes before next test to avoid rate limiting...\n');
  await new Promise(resolve => setTimeout(resolve, 120000));

  // Test 3: Custom delay batch
  await testCustomDelayBatch();

  console.log('\n');
  console.log('█'.repeat(70));
  console.log('  All Tests Complete!');
  console.log('█'.repeat(70));
  console.log('');
  console.log('📁 Results saved to:');
  console.log('   - batch-sequential-results.json');
  console.log('   - batch-concurrent-results.json');
  console.log('   - batch-custom-delay-results.json');
  console.log('');
}

// Run tests
runAllTests().catch(console.error);
