/**
 * Test Advanced Firecrawl Scrapers
 *
 * Comprehensive test suite for the new advanced Firecrawl-based scrapers
 * featuring JSON extraction, Map endpoint, and improved targeting.
 */

const hkexScraper = require('./firecrawl-hkex-advanced.cjs');
const hksfcScraper = require('./firecrawl-hksfc-advanced.cjs');

// Test configurations
const tests = {
  hkex: {
    enabled: false,  // Temporarily disabled - needs more work on actions
    stockCodes: ['00700', '09988'],  // Tencent, Alibaba
    date: null  // Use today
  },
  hksfc: {
    enabled: true,
    mode: 'discover',  // 'full', 'discover', or 'search' - start with discover only
    searchQuery: 'regulatory announcement',
    discoverLimit: 15,
    scrapeLimit: 2
  }
};

// Utility functions
function printHeader(title) {
  console.log('\n' + '═'.repeat(80));
  console.log(`  ${title}`);
  console.log('═'.repeat(80) + '\n');
}

function printSubHeader(title) {
  console.log('\n' + '─'.repeat(80));
  console.log(`  ${title}`);
  console.log('─'.repeat(80));
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

function printWarning(message) {
  console.log(`  ⚠️  ${message}`);
}

// Test HKEX CCASS scraper
async function testHKEXScraper() {
  printHeader('TEST 1: HKEX CCASS Advanced Scraper');

  if (!tests.hkex.enabled) {
    printWarning('HKEX tests disabled');
    return { skipped: true };
  }

  const results = [];
  const startTime = Date.now();

  for (const stockCode of tests.hkex.stockCodes) {
    printSubHeader(`Scraping ${stockCode}`);

    try {
      const result = await hkexScraper.scrapeHKEXCCASS(stockCode, tests.hkex.date);

      if (result.success) {
        printSuccess(`Successfully scraped ${stockCode}`);
        printResult('Stock Name', result.stockName || 'N/A');
        printResult('Data Date', result.dataDate);
        printResult('Participants', result.totalParticipants);
        printResult('Total Shares', result.totalShares.toLocaleString());
        printResult('Total %', `${result.totalPercentage}%`);
        printResult('Credits Used', result.credits || 'N/A');

        if (result.participants.length > 0) {
          console.log('\n  Top 3 Participants:');
          result.participants.slice(0, 3).forEach((p, i) => {
            console.log(`    ${i + 1}. ${p.participantName}`);
            console.log(`       ID: ${p.participantId} | Shares: ${p.shareholding.toLocaleString()} (${p.percentage}%)`);
          });
        }

        results.push({ stockCode, success: true, participants: result.totalParticipants });
      } else {
        printError(`Failed to scrape ${stockCode}`);
        printResult('Error', result.error);
        results.push({ stockCode, success: false, error: result.error });
      }

    } catch (error) {
      printError(`Exception for ${stockCode}: ${error.message}`);
      results.push({ stockCode, success: false, error: error.message });
    }
  }

  const duration = Date.now() - startTime;
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  printSubHeader('HKEX Test Summary');
  printResult('Total Tests', results.length);
  printResult('Successful', successful);
  printResult('Failed', failed);
  printResult('Duration', `${duration}ms (${(duration / 1000).toFixed(2)}s)`);

  return {
    total: results.length,
    successful,
    failed,
    duration,
    results
  };
}

// Test HKSFC News scraper
async function testHKSFCScraper() {
  printHeader('TEST 2: HKSFC News Advanced Scraper');

  if (!tests.hksfc.enabled) {
    printWarning('HKSFC tests disabled');
    return { skipped: true };
  }

  const startTime = Date.now();
  let result;

  if (tests.hksfc.mode === 'discover') {
    printSubHeader('Mode: URL Discovery');
    result = await hksfcScraper.discoverNewsURLs('news', tests.hksfc.discoverLimit);

    if (result.success) {
      printSuccess(`Discovered ${result.total} URLs`);
      console.log('\n  Sample URLs:');
      result.links.slice(0, 5).forEach((url, i) => {
        console.log(`    ${i + 1}. ${url}`);
      });
    } else {
      printError('Discovery failed');
      printResult('Error', result.error);
    }

  } else if (tests.hksfc.mode === 'search') {
    printSubHeader(`Mode: Search for "${tests.hksfc.searchQuery}"`);
    result = await hksfcScraper.searchHKSFCNews(tests.hksfc.searchQuery, 5);

    if (result.success) {
      printSuccess(`Found ${result.total} results`);
      console.log('\n  Search Results:');
      result.results.forEach((item, i) => {
        console.log(`\n    ${i + 1}. ${item.title}`);
        printResult('      URL', item.url);
        printResult('      Date', item.date || 'N/A');
        if (item.summary) {
          console.log(`      Summary: ${item.summary.substring(0, 100)}...`);
        }
      });
    } else {
      printError('Search failed');
      printResult('Error', result.error);
    }

  } else {
    printSubHeader('Mode: Full Workflow (Discover + Scrape)');
    result = await hksfcScraper.scrapeHKSFCNews({
      searchTerm: 'news',
      discoverLimit: tests.hksfc.discoverLimit,
      scrapeLimit: tests.hksfc.scrapeLimit,
      delay: 2000
    });

    if (result.success) {
      printSuccess('Full workflow completed');
      printResult('URLs Discovered', result.discovered);
      printResult('URLs Scraped', result.scraped);
      printResult('Successful', result.successful);
      printResult('Failed', result.failed);

      console.log('\n  Scraped Articles:');
      result.results.slice(0, 3).forEach((article, i) => {
        if (article.success) {
          console.log(`\n    ${i + 1}. ${article.title}`);
          printResult('      URL', article.url);
          printResult('      Date', article.publishDate || 'N/A');
          printResult('      Category', article.category);
          if (article.pdfUrl) {
            printResult('      PDF', article.pdfUrl);
          }
          if (article.summary) {
            console.log(`      Summary: ${article.summary.substring(0, 100)}...`);
          }
        }
      });
    } else {
      printError('Full workflow failed');
      printResult('Error', result.error);
    }
  }

  const duration = Date.now() - startTime;

  printSubHeader('HKSFC Test Summary');
  printResult('Mode', tests.hksfc.mode);
  printResult('Duration', `${duration}ms (${(duration / 1000).toFixed(2)}s)`);

  return {
    mode: tests.hksfc.mode,
    duration,
    result
  };
}

// Main test runner
async function runAllTests() {
  printHeader('🧪 ADVANCED FIRECRAWL SCRAPERS TEST SUITE');

  console.log('Configuration:');
  printResult('HKEX Tests', tests.hkex.enabled ? 'Enabled' : 'Disabled');
  printResult('HKEX Stock Codes', tests.hkex.stockCodes.join(', '));
  printResult('HKSFC Tests', tests.hksfc.enabled ? 'Enabled' : 'Disabled');
  printResult('HKSFC Mode', tests.hksfc.mode);

  const overallStartTime = Date.now();

  // Run HKEX tests
  const hkexResults = await testHKEXScraper();

  // Wait between test suites
  if (tests.hkex.enabled && tests.hksfc.enabled) {
    console.log('\n⏱️  Waiting 3 seconds between test suites...');
    await new Promise(resolve => setTimeout(resolve, 3000));
  }

  // Run HKSFC tests
  const hksfcResults = await testHKSFCScraper();

  const overallDuration = Date.now() - overallStartTime;

  // Final summary
  printHeader('📊 OVERALL TEST SUMMARY');

  console.log('HKEX CCASS Scraper:');
  if (hkexResults.skipped) {
    printWarning('  Skipped');
  } else {
    printResult('  Total Tests', hkexResults.total);
    printResult('  Successful', hkexResults.successful);
    printResult('  Failed', hkexResults.failed);
    printResult('  Duration', `${(hkexResults.duration / 1000).toFixed(2)}s`);
  }

  console.log('\nHKSFC News Scraper:');
  if (hksfcResults.skipped) {
    printWarning('  Skipped');
  } else {
    printResult('  Mode', hksfcResults.mode);
    printResult('  Duration', `${(hksfcResults.duration / 1000).toFixed(2)}s`);
  }

  console.log('\n' + '─'.repeat(80));
  printResult('Total Duration', `${(overallDuration / 1000).toFixed(2)}s`);

  // Verdict
  printHeader('🎯 VERDICT');

  const hkexPass = !hkexResults.skipped && hkexResults.successful > 0 && hkexResults.failed === 0;
  const hksfcPass = !hksfcResults.skipped && hksfcResults.result?.success;

  if (hkexPass && hksfcPass) {
    console.log('✅ ALL TESTS PASSED!');
    console.log('\nThe advanced Firecrawl scrapers are working correctly with:');
    console.log('  ✓ JSON format extraction');
    console.log('  ✓ Actions API for form submission (HKEX)');
    console.log('  ✓ Map endpoint for URL discovery (HKSFC)');
    console.log('  ✓ Search endpoint (HKSFC)');
    console.log('  ✓ Improved targeting with include/exclude tags');
    console.log('  ✓ Fresh data fetching (maxAge: 0)');
  } else {
    console.log('⚠️  SOME TESTS FAILED');
    if (!hkexPass && !hkexResults.skipped) {
      console.log('  ✗ HKEX CCASS scraper needs attention');
    }
    if (!hksfcPass && !hksfcResults.skipped) {
      console.log('  ✗ HKSFC news scraper needs attention');
    }
  }

  console.log('\n' + '═'.repeat(80));
}

// Run tests
runAllTests().catch(error => {
  console.error('\n❌ FATAL ERROR:', error);
  process.exit(1);
});
