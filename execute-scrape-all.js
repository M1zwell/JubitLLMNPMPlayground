// Execute *scrape-all command for BMAD Data Collector Agent
// Scrapes all enabled sources: HKEX, HKSFC, NPM, LLM

const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

console.log('━'.repeat(80));
console.log('🚀 DATA COLLECTOR AGENT - *scrape-all');
console.log('━'.repeat(80));
console.log('Starting scraping for enabled sources: HKEX, HKSFC, NPM, LLM');
console.log('');

const results = {
  hkex: null,
  hksfc: null,
  npm: null,
  llm: null,
  startTime: Date.now()
};

async function scrapeHKEX() {
  console.log('📊 HKEX - Hong Kong Stock Exchange');
  console.log('   Scraping CCASS data...');

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/unified-scraper`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        source: 'hkex',
        limit: 100,
        test_mode: false
      })
    });

    results.hkex = await response.json();

    if (results.hkex.success) {
      console.log('   ✅ New:', results.hkex.records_inserted);
      console.log('   🔄 Updated:', results.hkex.records_updated);
      console.log('   ❌ Failed:', results.hkex.records_failed);
      console.log('   ⏱️ Duration:', results.hkex.duration_ms + 'ms');
    } else {
      console.log('   ❌ Error:', results.hkex.error || 'Unknown error');
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    results.hkex = { success: false, error: error.message };
  }
  console.log('');
}

async function scrapeHKSFC() {
  console.log('📰 HKSFC - Securities & Futures Commission');
  console.log('   Scraping filings and news...');

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/unified-scraper`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        source: 'hksfc',
        limit: 100,
        test_mode: false
      })
    });

    results.hksfc = await response.json();

    if (results.hksfc.success) {
      console.log('   ✅ New:', results.hksfc.records_inserted);
      console.log('   🔄 Updated:', results.hksfc.records_updated);
      console.log('   ❌ Failed:', results.hksfc.records_failed);
      console.log('   ⏱️ Duration:', results.hksfc.duration_ms + 'ms');
    } else {
      console.log('   ❌ Error:', results.hksfc.error || 'Unknown error');
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    results.hksfc = { success: false, error: error.message };
  }
  console.log('');
}

async function scrapeNPM() {
  console.log('📦 NPM - Package Registry');
  console.log('   Importing popular packages...');

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/npm-import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        searchQuery: 'popular',
        limit: 100,
        pages: 1,
        importType: 'daily_batch'
      })
    });

    results.npm = await response.json();

    if (results.npm.success) {
      console.log('   📊 Processed:', results.npm.packagesProcessed);
      console.log('   ➕ Added:', results.npm.packagesAdded);
      console.log('   🔄 Updated:', results.npm.packagesUpdated);
    } else {
      console.log('   ❌ Error:', results.npm.error || 'Unknown error');
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    results.npm = { success: false, error: error.message };
  }
  console.log('');
}

async function scrapeLLM() {
  console.log('🤖 LLM Models - artificialanalysis.ai');
  console.log('   Updating model database...');

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/llm-update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        update_type: 'daily_batch',
        force_refresh: false
      })
    });

    results.llm = await response.json();

    if (results.llm.success) {
      console.log('   ✅ Updated:', results.llm.stats.models_updated);
      console.log('   ➕ New:', results.llm.stats.models_added);
      console.log('   📊 Total:', results.llm.stats.total_processed);
      console.log('   🏢 Providers:', results.llm.stats.providers_found.length);
    } else {
      console.log('   ❌ Error:', results.llm.error || 'Unknown error');
    }
  } catch (error) {
    console.log('   ❌ Error:', error.message);
    results.llm = { success: false, error: error.message };
  }
  console.log('');
}

async function generateReport() {
  const duration = Date.now() - results.startTime;
  const durationSec = (duration / 1000).toFixed(2);

  console.log('━'.repeat(80));
  console.log('SCRAPING REPORT: ALL SOURCES');
  console.log('━'.repeat(80));
  console.log('');

  // Calculate totals
  let totalNew = 0;
  let totalUpdated = 0;
  let totalFailed = 0;
  let successCount = 0;

  if (results.hkex?.success) {
    totalNew += results.hkex.records_inserted || 0;
    totalUpdated += results.hkex.records_updated || 0;
    totalFailed += results.hkex.records_failed || 0;
    successCount++;
  }

  if (results.hksfc?.success) {
    totalNew += results.hksfc.records_inserted || 0;
    totalUpdated += results.hksfc.records_updated || 0;
    totalFailed += results.hksfc.records_failed || 0;
    successCount++;
  }

  if (results.npm?.success) {
    totalNew += results.npm.packagesAdded || 0;
    totalUpdated += results.npm.packagesUpdated || 0;
    successCount++;
  }

  if (results.llm?.success) {
    totalNew += results.llm.stats?.models_added || 0;
    totalUpdated += results.llm.stats?.models_updated || 0;
    successCount++;
  }

  const totalRecords = totalNew + totalUpdated;
  const failureRate = totalRecords > 0 ? ((totalFailed / (totalRecords + totalFailed)) * 100).toFixed(2) : 0;

  console.log('✅ Success: ' + successCount + '/4 sources');
  console.log('📝 New Records: ' + totalNew);
  console.log('🔄 Updated Records: ' + totalUpdated);
  console.log('❌ Failed: ' + totalFailed);
  console.log('⏱️ Total Execution Time: ' + durationSec + 's');
  console.log('📊 Failure Rate: ' + failureRate + '%');
  console.log('');

  // Detailed results
  console.log('RESULTS BY SOURCE:');
  console.log('');

  console.log('📊 HKEX:        ' + (results.hkex?.success ? '✅ Success' : '❌ Failed'));
  console.log('📰 HKSFC:       ' + (results.hksfc?.success ? '✅ Success' : '❌ Failed'));
  console.log('📦 NPM:         ' + (results.npm?.success ? '✅ Success' : '❌ Failed'));
  console.log('🤖 LLM Models:  ' + (results.llm?.success ? '✅ Success' : '❌ Failed'));
  console.log('');

  // Alert level
  let alertLevel = 'SUCCESS';
  let alertMessage = 'Daily scraping completed successfully';

  if (failureRate > 20) {
    alertLevel = 'WARNING';
    alertMessage = `Failure rate (${failureRate}%) exceeds threshold (20%)`;
  }

  if (totalRecords === 0) {
    alertLevel = 'CRITICAL';
    alertMessage = 'No records scraped from any source';
  }

  console.log('Status: ' + alertLevel);
  console.log('Message: ' + alertMessage);
  console.log('');
  console.log('Next Action: ' + (alertLevel === 'SUCCESS' ? 'Continue monitoring' : 'Review failures and retry'));
  console.log('━'.repeat(80));
}

async function executeScrapeAll() {
  try {
    await scrapeHKEX();
    await scrapeHKSFC();
    await scrapeNPM();
    await scrapeLLM();
    await generateReport();
  } catch (error) {
    console.error('💥 Fatal error:', error.message);
  }
}

executeScrapeAll();
