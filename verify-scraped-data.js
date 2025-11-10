// Verify Scraped Data in Production Database
import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

// Load anon key from .env
let SUPABASE_ANON_KEY = '';
try {
  const envFile = readFileSync('.env', 'utf-8');
  const match = envFile.match(/VITE_SUPABASE_ANON_KEY=(.+)/);
  if (match) {
    SUPABASE_ANON_KEY = match[1].trim();
  }
} catch (err) {
  console.error('Could not read .env file');
  process.exit(1);
}

const supabase = createClient(
  'https://kiztaihzanqnrcrqaxsv.supabase.co',
  SUPABASE_ANON_KEY
);

async function verifyData() {
  console.log('╔══════════════════════════════════════════════════════════╗');
  console.log('║     Production Scraping Infrastructure Verification     ║');
  console.log('╚══════════════════════════════════════════════════════════╝\n');

  // Check HKSFC filings
  console.log('📊 HKSFC Filings:');
  const { data: hksfc, error: hksfcError } = await supabase
    .from('hksfc_filings')
    .select('*')
    .order('scraped_at', { ascending: false })
    .limit(5);

  if (hksfcError) {
    console.log(`   ❌ Error: ${hksfcError.message}`);
  } else {
    console.log(`   ✅ Total records: ${hksfc.length}`);
    hksfc.forEach((record, i) => {
      console.log(`   ${i + 1}. ${record.title?.substring(0, 60)}...`);
      console.log(`      Type: ${record.filing_type}, Date: ${record.filing_date || 'N/A'}`);
      console.log(`      URL: ${record.url.substring(0, 70)}...`);
    });
  }

  console.log('');

  // Check HKEX announcements
  console.log('📊 HKEX Announcements:');
  const { data: hkex, error: hkexError } = await supabase
    .from('hkex_announcements')
    .select('*')
    .order('scraped_at', { ascending: false })
    .limit(5);

  if (hkexError) {
    console.log(`   ❌ Error: ${hkexError.message}`);
  } else {
    console.log(`   ✅ Total records: ${hkex.length}`);
    hkex.forEach((record, i) => {
      console.log(`   ${i + 1}. ${record.announcement_title?.substring(0, 60)}...`);
      console.log(`      Type: ${record.announcement_type}, Company: ${record.company_code || 'N/A'}`);
      console.log(`      URL: ${record.url.substring(0, 70)}...`);
    });
  }

  console.log('');

  // Check scrape logs
  console.log('📋 Scrape Logs (Recent Activity):');
  const { data: logs, error: logsError } = await supabase
    .from('scrape_logs')
    .select('*')
    .order('started_at', { ascending: false })
    .limit(10);

  if (logsError) {
    console.log(`   ❌ Error: ${logsError.message}`);
  } else {
    console.log(`   ✅ Total log entries: ${logs.length}\n`);

    // Group by source
    const bySource = logs.reduce((acc, log) => {
      if (!acc[log.source]) acc[log.source] = [];
      acc[log.source].push(log);
      return acc;
    }, {});

    Object.entries(bySource).forEach(([source, sourceLogs]) => {
      const total = sourceLogs.length;
      const success = sourceLogs.filter(l => l.status === 'success').length;
      const totalInserted = sourceLogs.reduce((sum, l) => sum + (l.records_inserted || 0), 0);
      const totalUpdated = sourceLogs.reduce((sum, l) => sum + (l.records_updated || 0), 0);
      const avgDuration = (sourceLogs.reduce((sum, l) => sum + (l.duration_ms || 0), 0) / total).toFixed(0);

      console.log(`   ${source.toUpperCase()}:`);
      console.log(`      Runs: ${total}, Success: ${success}/${total}`);
      console.log(`      Inserted: ${totalInserted}, Updated: ${totalUpdated}`);
      console.log(`      Avg Duration: ${avgDuration}ms`);
    });
  }

  console.log('');

  // Check unified view
  console.log('🔍 Unified View (all_scraped_data):');
  const { data: unified, error: unifiedError } = await supabase
    .from('all_scraped_data')
    .select('source, title, url, scraped_at')
    .order('scraped_at', { ascending: false })
    .limit(10);

  if (unifiedError) {
    console.log(`   ❌ Error: ${unifiedError.message}`);
  } else {
    console.log(`   ✅ Total records across all sources: ${unified.length}\n`);
    unified.forEach((record, i) => {
      console.log(`   ${i + 1}. [${record.source.toUpperCase()}] ${record.title?.substring(0, 50)}...`);
      console.log(`      Scraped: ${new Date(record.scraped_at).toLocaleString()}`);
    });
  }

  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('✅ Verification Complete!');
  console.log('═══════════════════════════════════════════════════════════\n');
}

verifyData();
