// Test Scraping Infrastructure Setup
// Verifies database tables and tests Edge Function when deployed

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load environment variables from .env
let SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_ANON_KEY) {
  try {
    const envFile = readFileSync('.env', 'utf-8');
    const match = envFile.match(/VITE_SUPABASE_ANON_KEY=(.+)/);
    if (match) {
      SUPABASE_ANON_KEY = match[1].trim();
    }
  } catch (err) {
    console.error('⚠️  Could not read .env file. Using empty anon key.');
  }
}

const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testDatabaseSetup() {
  console.log('🔍 Testing Database Setup...\n');

  const tables = [
    'hksfc_filings',
    'hkex_announcements',
    'legal_cases',
    'npm_packages_scraped',
    'llm_configs',
    'scrape_logs'
  ];

  for (const table of tables) {
    try {
      const { data, error } = await supabase
        .from(table)
        .select('count(*)', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${table}: ERROR - ${error.message}`);
      } else {
        console.log(`✅ ${table}: Table exists (${data?.length || 0} records)`);
      }
    } catch (err) {
      console.log(`❌ ${table}: EXCEPTION - ${err.message}`);
    }
  }

  console.log('\n');
}

async function testUnifiedView() {
  console.log('🔍 Testing Unified View (all_scraped_data)...\n');

  try {
    const { data, error } = await supabase
      .from('all_scraped_data')
      .select('source, title, url, scraped_at')
      .limit(5);

    if (error) {
      console.log(`❌ all_scraped_data view: ERROR - ${error.message}`);
    } else {
      console.log(`✅ all_scraped_data view: Working`);
      if (data && data.length > 0) {
        console.log(`   Found ${data.length} records across all sources`);
        data.forEach(record => {
          console.log(`   - ${record.source}: ${record.title?.substring(0, 50)}...`);
        });
      } else {
        console.log(`   (No data yet - waiting for scraping to run)`);
      }
    }
  } catch (err) {
    console.log(`❌ all_scraped_data view: EXCEPTION - ${err.message}`);
  }

  console.log('\n');
}

async function testEdgeFunction(testMode = true) {
  console.log(`🔍 Testing Edge Function (test_mode: ${testMode})...\n`);

  const sources = ['hksfc', 'hkex', 'npm'];

  for (const source of sources) {
    try {
      console.log(`Testing ${source} scraper...`);

      const response = await fetch(`${SUPABASE_URL}/functions/v1/unified-scraper`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify({
          source,
          limit: 10,
          test_mode: testMode
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        console.log(`✅ ${source}: SUCCESS`);
        console.log(`   - Records inserted: ${data.records_inserted}`);
        console.log(`   - Records updated: ${data.records_updated}`);
        console.log(`   - Duration: ${data.duration_ms}ms`);
      } else {
        console.log(`❌ ${source}: FAILED`);
        console.log(`   - Error: ${data.error || 'Unknown error'}`);
      }
    } catch (err) {
      console.log(`❌ ${source}: EXCEPTION - ${err.message}`);
    }

    console.log('');
  }
}

async function checkScrapeLogs() {
  console.log('🔍 Checking Scrape Logs...\n');

  try {
    const { data, error } = await supabase
      .from('scrape_logs')
      .select('*')
      .order('started_at', { ascending: false })
      .limit(10);

    if (error) {
      console.log(`❌ scrape_logs: ERROR - ${error.message}`);
    } else {
      console.log(`✅ scrape_logs: ${data?.length || 0} recent logs found`);

      if (data && data.length > 0) {
        console.log('\nRecent scraping activity:');
        data.forEach(log => {
          const status = log.status === 'success' ? '✅' : '❌';
          console.log(`${status} ${log.source} - ${log.status} - ${log.records_inserted} inserted - ${new Date(log.started_at).toLocaleString()}`);
        });
      } else {
        console.log('   (No scraping activity yet)');
      }
    }
  } catch (err) {
    console.log(`❌ scrape_logs: EXCEPTION - ${err.message}`);
  }

  console.log('\n');
}

async function runTests() {
  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║   Scraping Infrastructure Test Suite                  ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  await testDatabaseSetup();
  await testUnifiedView();
  await checkScrapeLogs();

  console.log('═══════════════════════════════════════════════════════\n');
  console.log('📋 Next Steps:\n');
  console.log('1. Deploy Edge Function:');
  console.log('   - Enable GitHub integration in Supabase Dashboard');
  console.log('   - OR fix Docker and run: npx supabase functions deploy unified-scraper\n');
  console.log('2. Set Firecrawl API key:');
  console.log('   - npx supabase secrets set FIRECRAWL_API_KEY=your_key\n');
  console.log('3. Test Edge Function:');
  console.log('   - node test-scraping-setup.js test\n');
  console.log('═══════════════════════════════════════════════════════\n');
}

// Main execution
const args = process.argv.slice(2);

(async () => {
  if (args.includes('test')) {
    await testEdgeFunction(true);
  } else if (args.includes('real')) {
    await testEdgeFunction(false);
  } else {
    await runTests();
  }
})();
