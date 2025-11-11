// Test script for BMAD HK Data Pipeline scraping functions
// Tests all four data sources: HKEX, HKSFC, NPM, LLM

const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

async function testLLMUpdate() {
  console.log('\n🤖 Testing LLM Update Function...');
  console.log('━'.repeat(60));

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/llm-update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        update_type: 'manual',
        force_refresh: false
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ LLM Update Success!');
      console.log('  Response format:', {
        success: data.success,
        stats: data.stats,
        logId: data.logId,
        message: data.message?.substring(0, 100)
      });
      console.log('  Stats:', data.stats);
      return { success: true, data };
    } else {
      console.log('❌ LLM Update Failed:', data);
      return { success: false, error: data };
    }
  } catch (error) {
    console.error('💥 Error calling llm-update:', error.message);
    return { success: false, error: error.message };
  }
}

async function testUnifiedScraper(source) {
  console.log(`\n📊 Testing Unified Scraper: ${source.toUpperCase()}...`);
  console.log('━'.repeat(60));

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/unified-scraper`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        source,
        limit: 10,
        test_mode: true
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`✅ ${source.toUpperCase()} Scraping Success!`);
      console.log('  Response format:', {
        success: data.success,
        source: data.source,
        records_inserted: data.records_inserted,
        records_updated: data.records_updated,
        records_failed: data.records_failed,
        duration_ms: data.duration_ms
      });
      return { success: true, data };
    } else {
      console.log(`❌ ${source.toUpperCase()} Scraping Failed:`, data);
      return { success: false, error: data };
    }
  } catch (error) {
    console.error(`💥 Error calling unified-scraper (${source}):`, error.message);
    return { success: false, error: error.message };
  }
}

async function testNPMImport() {
  console.log('\n📦 Testing NPM Import Function...');
  console.log('━'.repeat(60));

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/npm-import`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        searchQuery: 'react',
        limit: 5,
        pages: 1,
        importType: 'manual'
      })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ NPM Import Success!');
      console.log('  Response format:', {
        success: data.success,
        packagesProcessed: data.packagesProcessed,
        packagesAdded: data.packagesAdded,
        packagesUpdated: data.packagesUpdated,
        errors: data.errors?.length
      });
      return { success: true, data };
    } else {
      console.log('❌ NPM Import Failed:', data);
      return { success: false, error: data };
    }
  } catch (error) {
    console.error('💥 Error calling npm-import:', error.message);
    return { success: false, error: error.message };
  }
}

async function runAllTests() {
  console.log('🚀 BMAD HK Data Pipeline - Scraping Function Tests');
  console.log('═'.repeat(60));
  console.log(`Supabase URL: ${SUPABASE_URL}`);
  console.log('═'.repeat(60));

  const results = {
    hksfc: await testUnifiedScraper('hksfc'),
    hkex: await testUnifiedScraper('hkex'),
    npm: await testNPMImport(),
    llm: await testLLMUpdate()
  };

  console.log('\n' + '═'.repeat(60));
  console.log('📋 TEST SUMMARY');
  console.log('═'.repeat(60));

  const summary = {
    hksfc: results.hksfc.success ? '✅ PASS' : '❌ FAIL',
    hkex: results.hkex.success ? '✅ PASS' : '❌ FAIL',
    npm: results.npm.success ? '✅ PASS' : '❌ FAIL',
    llm: results.llm.success ? '✅ PASS' : '❌ FAIL'
  };

  console.log('HKSFC:', summary.hksfc);
  console.log('HKEX:', summary.hkex);
  console.log('NPM:', summary.npm);
  console.log('LLM:', summary.llm);

  const passCount = Object.values(results).filter(r => r.success).length;
  console.log('\n' + '━'.repeat(60));
  console.log(`Total: ${passCount}/4 tests passed`);
  console.log('━'.repeat(60));

  // Response format analysis
  console.log('\n📐 RESPONSE FORMAT ANALYSIS:');
  console.log('━'.repeat(60));
  console.log('unified-scraper (HKEX/HKSFC):');
  console.log('  - records_inserted, records_updated, records_failed, duration_ms');
  console.log('\nnpm-import:');
  console.log('  - packagesProcessed, packagesAdded, packagesUpdated');
  console.log('\nllm-update:');
  console.log('  - stats.models_added, stats.models_updated, stats.total_processed');
  console.log('━'.repeat(60));

  return results;
}

// Run tests
runAllTests().catch(console.error);
