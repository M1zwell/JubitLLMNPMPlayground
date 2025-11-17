/**
 * SFC Statistics XLSX Scraper
 * Downloads and parses SFC statistical XLSX files
 * Stores real data in Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const https = require('https');
const fs = require('fs');
const path = require('path');
const XLSX = require('xlsx');

// Supabase configuration with SERVICE ROLE KEY
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTYyODE3NywiZXhwIjoyMDY3MjA0MTc3fQ.5D9mVu_ssolTEW1ffotXoBFY65DuMvE7ERUHedj0t2E';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// SFC Statistics XLSX URLs
const STATISTICS_TABLES = {
  'A1': {
    title: 'Highlights of HK Stock Market',
    url: 'https://www.sfc.hk/-/media/EN/files/SOM/MarketStatistics/a01x.xlsx',
    table: 'sfc_market_highlights'
  },
  'A2': {
    title: 'Market Capitalisation by Stock Type',
    url: 'https://www.sfc.hk/-/media/EN/files/SOM/MarketStatistics/a02x.xlsx',
    table: 'sfc_market_cap_by_type'
  },
  'A3': {
    title: 'Average Daily Turnover by Stock Type',
    url: 'https://www.sfc.hk/-/media/EN/files/SOM/MarketStatistics/a03x.xlsx',
    table: 'sfc_turnover_by_type'
  },
  'C4': {
    title: 'Licensed Representatives',
    url: 'https://www.sfc.hk/-/media/EN/files/SOM/MarketStatistics/c04x.xlsx',
    table: 'sfc_licensed_representatives'
  },
  'C5': {
    title: 'Responsible Officers',
    url: 'https://www.sfc.hk/-/media/EN/files/SOM/MarketStatistics/c05x.xlsx',
    table: 'sfc_responsible_officers'
  },
  'D3': {
    title: 'Mutual Fund NAV',
    url: 'https://www.sfc.hk/-/media/EN/files/SOM/MarketStatistics/d03x.xlsx',
    table: 'sfc_mutual_fund_nav'
  },
  'D4': {
    title: 'Fund Flows',
    url: 'https://www.sfc.hk/-/media/EN/files/SOM/MarketStatistics/d04x.xlsx',
    table: 'sfc_fund_flows'
  }
};

const stats = {
  downloaded: 0,
  parsed: 0,
  inserted: 0,
  errors: 0
};

/**
 * Download file via HTTPS
 */
function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(dest);

    https.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (response) => {
      if (response.statusCode === 301 || response.statusCode === 302) {
        // Handle redirect
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }

      if (response.statusCode !== 200) {
        return reject(new Error(`HTTP ${response.statusCode}: ${url}`));
      }

      response.pipe(file);

      file.on('finish', () => {
        file.close();
        resolve(dest);
      });
    }).on('error', (err) => {
      fs.unlinkSync(dest);
      reject(err);
    });
  });
}

/**
 * Parse period from various formats
 */
function parsePeriod(periodStr) {
  if (!periodStr) return { period: null, period_type: 'quarterly' };

  const str = String(periodStr).trim();

  // Check for quarterly: "2024-Q1", "Q1 2024", "2024Q1"
  if (/Q[1-4]/i.test(str)) {
    const match = str.match(/(\d{4}).*Q([1-4])/i) || str.match(/Q([1-4]).*(\d{4})/i);
    if (match) {
      const year = match[1].length === 4 ? match[1] : match[2];
      const quarter = match[1].length === 4 ? match[2] : match[1];
      return { period: `${year}-Q${quarter}`, period_type: 'quarterly' };
    }
  }

  // Check for monthly: "2024-09", "Sep 2024", "September 2024"
  if (/\d{4}-\d{2}/.test(str)) {
    return { period: str, period_type: 'monthly' };
  }

  // Check for annual: "2024"
  if (/^\d{4}$/.test(str)) {
    return { period: str, period_type: 'annual' };
  }

  return { period: str, period_type: 'quarterly' };
}

/**
 * Check if tables exist
 */
async function checkTables() {
  console.log('\n🔍 Checking if tables exist...');

  try {
    const { data, error } = await supabase
      .from('sfc_market_highlights')
      .select('id')
      .limit(1);

    if (error) {
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        console.log('\n⚠️  TABLES DO NOT EXIST!');
        console.log('\n📝 Please create the tables first by running this SQL in Supabase Dashboard:');
        console.log('   Dashboard → SQL Editor → New Query → Paste the SQL from:');
        console.log('   supabase/migrations/20251117000003_create_sfc_statistics_tables.sql\n');
        console.log('   Or visit: https://supabase.com/dashboard/project/kiztaihzanqnrcrqaxsv/sql\n');
        return false;
      }
    }

    console.log('✅ Tables exist, continuing...');
    return true;
  } catch (err) {
    console.error('❌ Error checking tables:', err.message);
    return false;
  }
}

/**
 * Parse Table A1 - Market Highlights
 */
function parseTableA1(workbook) {
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const records = [];

  // Find data rows (skip headers)
  for (let i = 5; i < Math.min(data.length, 50); i++) {
    const row = data[i];
    if (!row || !row[0]) continue;

    const { period, period_type } = parsePeriod(row[0]);
    if (!period) continue;

    records.push({
      period,
      period_type,
      market_cap: parseFloat(row[1]) || null,
      turnover: parseFloat(row[2]) || null,
      total_listings: parseInt(row[3]) || null,
      new_listings: parseInt(row[4]) || null,
      funds_raised: parseFloat(row[5]) || null
    });
  }

  return records.slice(0, 20); // Latest 20 periods
}

/**
 * Parse Table A2 - Market Cap by Type
 */
function parseTableA2(workbook) {
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const records = [];
  let currentPeriod = null;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[0]) continue;

    // Check if this is a period header
    const { period, period_type } = parsePeriod(row[0]);
    if (period && !row[1]) {
      currentPeriod = { period, period_type };
      continue;
    }

    // Data row with stock type
    if (currentPeriod && row[0] && row[1]) {
      records.push({
        ...currentPeriod,
        stock_type: String(row[0]).trim(),
        market_cap: parseFloat(row[1]) || null,
        percentage: parseFloat(row[2]) || null,
        number_of_companies: parseInt(row[3]) || null
      });
    }
  }

  return records.slice(-30); // Latest period data
}

/**
 * Parse Table D4 - Fund Flows
 */
function parseTableD4(workbook) {
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const records = [];
  let currentPeriod = null;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[0]) continue;

    // Check for period
    const { period, period_type } = parsePeriod(row[0]);
    if (period && !row[1]) {
      currentPeriod = { period, period_type };
      continue;
    }

    // Data row
    if (currentPeriod && row[0] && (row[1] || row[2])) {
      const subscriptions = parseFloat(row[1]) || 0;
      const redemptions = parseFloat(row[2]) || 0;

      records.push({
        ...currentPeriod,
        fund_category: String(row[0]).trim(),
        subscriptions,
        redemptions,
        net_flows: subscriptions - redemptions,
        flow_rate: parseFloat(row[3]) || null
      });
    }
  }

  return records.slice(-30);
}

/**
 * Parse Table A3 - Turnover by Type
 */
function parseTableA3(workbook) {
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const records = [];
  let currentPeriod = null;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[0]) continue;

    const { period, period_type } = parsePeriod(row[0]);
    if (period && !row[1]) {
      currentPeriod = { period, period_type };
      continue;
    }

    if (currentPeriod && row[0] && row[1]) {
      records.push({
        ...currentPeriod,
        stock_type: String(row[0]).trim(),
        avg_daily_turnover: parseFloat(row[1]) || null,
        percentage: parseFloat(row[2]) || null
      });
    }
  }

  return records.slice(-30);
}

/**
 * Parse Table C4 - Licensed Representatives
 */
function parseTableC4(workbook) {
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const records = [];
  let currentPeriod = null;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[0]) continue;

    const { period, period_type } = parsePeriod(row[0]);
    if (period && !row[1]) {
      currentPeriod = { period, period_type };
      continue;
    }

    if (currentPeriod && row[0] && row[1]) {
      records.push({
        ...currentPeriod,
        activity_type: String(row[0]).trim(),
        representative_count: parseInt(row[1]) || null,
        yoy_change: parseFloat(row[2]) || null
      });
    }
  }

  return records.slice(-30);
}

/**
 * Parse Table C5 - Responsible Officers
 */
function parseTableC5(workbook) {
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const records = [];
  let currentPeriod = null;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[0]) continue;

    const { period, period_type } = parsePeriod(row[0]);
    if (period && !row[1]) {
      currentPeriod = { period, period_type };
      continue;
    }

    if (currentPeriod && row[0] && row[1]) {
      records.push({
        ...currentPeriod,
        activity_type: String(row[0]).trim(),
        officer_count: parseInt(row[1]) || null,
        yoy_change: parseFloat(row[2]) || null
      });
    }
  }

  return records.slice(-30);
}

/**
 * Parse Table D3 - Mutual Fund NAV
 */
function parseTableD3(workbook) {
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  const records = [];
  let currentPeriod = null;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || !row[0]) continue;

    const { period, period_type } = parsePeriod(row[0]);
    if (period && !row[1]) {
      currentPeriod = { period, period_type };
      continue;
    }

    if (currentPeriod && row[0] && row[1]) {
      records.push({
        ...currentPeriod,
        fund_category: String(row[0]).trim(),
        nav: parseFloat(row[1]) || null,
        fund_count: parseInt(row[2]) || null,
        percentage: parseFloat(row[3]) || null
      });
    }
  }

  return records.slice(-30);
}

/**
 * Import table data
 */
async function importTable(tableId, config) {
  console.log(`\n📊 Processing Table ${tableId}: ${config.title}`);

  try {
    // Download XLSX
    const tempFile = path.join(__dirname, `temp_${tableId}.xlsx`);
    console.log(`  📥 Downloading ${config.url}...`);

    await downloadFile(config.url, tempFile);
    stats.downloaded++;
    console.log(`  ✅ Downloaded`);

    // Parse XLSX
    console.log(`  📖 Parsing XLSX...`);
    const workbook = XLSX.readFile(tempFile);

    let records = [];

    // Use specific parser based on table
    if (tableId === 'A1') {
      records = parseTableA1(workbook);
    } else if (tableId === 'A2') {
      records = parseTableA2(workbook);
    } else if (tableId === 'A3') {
      records = parseTableA3(workbook);
    } else if (tableId === 'C4') {
      records = parseTableC4(workbook);
    } else if (tableId === 'C5') {
      records = parseTableC5(workbook);
    } else if (tableId === 'D3') {
      records = parseTableD3(workbook);
    } else if (tableId === 'D4') {
      records = parseTableD4(workbook);
    }

    console.log(`  ✅ Parsed ${records.length} records`);
    stats.parsed += records.length;

    // Clean up temp file
    fs.unlinkSync(tempFile);

    if (records.length === 0) {
      console.log(`  ⚠️  No records parsed, skipping insert`);
      return;
    }

    // Insert into Supabase (upsert)
    console.log(`  💾 Inserting into ${config.table}...`);

    // Determine unique constraint fields
    let conflictFields = 'period,period_type';
    if (tableId === 'A2' || tableId === 'A3') {
      conflictFields = 'period,period_type,stock_type';
    } else if (tableId === 'C4' || tableId === 'C5') {
      conflictFields = 'period,period_type,activity_type';
    } else if (tableId === 'D3' || tableId === 'D4') {
      conflictFields = 'period,period_type,fund_category';
    }

    const { data, error } = await supabase
      .from(config.table)
      .upsert(records, { onConflict: conflictFields });

    if (error) {
      console.error(`  ❌ Insert error:`, error.message);
      stats.errors++;
    } else {
      console.log(`  ✅ Inserted ${records.length} records`);
      stats.inserted += records.length;

      // Update metadata
      await supabase
        .from('sfc_statistics_metadata')
        .upsert({
          table_id: tableId,
          table_name: config.title,
          last_updated: new Date().toISOString(),
          data_period: records[records.length - 1]?.period || null,
          xlsx_url: config.url,
          import_status: 'success'
        }, { onConflict: 'table_id' });
    }

  } catch (error) {
    console.error(`  ❌ Error:`, error.message);
    stats.errors++;

    // Update metadata with error
    await supabase
      .from('sfc_statistics_metadata')
      .upsert({
        table_id: tableId,
        table_name: config.title,
        xlsx_url: config.url,
        import_status: 'failed',
        import_error: error.message
      }, { onConflict: 'table_id' });
  }
}

/**
 * Main execution
 */
async function main() {
  const tablesToImport = process.argv[2] ? process.argv[2].split(',') : Object.keys(STATISTICS_TABLES);

  console.log('═══════════════════════════════════════════════════════');
  console.log('   SFC Statistics XLSX Scraper');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Tables to import: ${tablesToImport.join(', ')}`);

  const startTime = Date.now();

  // Check if tables exist first
  const tablesExist = await checkTables();
  if (!tablesExist) {
    console.error('\n❌ Cannot continue without tables. Please create them first.');
    process.exit(1);
  }

  // Import each table
  for (const tableId of tablesToImport) {
    const config = STATISTICS_TABLES[tableId];
    if (!config) {
      console.warn(`⚠️  Unknown table: ${tableId}`);
      continue;
    }

    await importTable(tableId, config);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

  // Print summary
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('   IMPORT SUMMARY');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`Tables downloaded: ${stats.downloaded}`);
  console.log(`Total records parsed: ${stats.parsed}`);
  console.log(`Total records inserted: ${stats.inserted}`);
  console.log(`Errors: ${stats.errors}`);
  console.log(`Time elapsed: ${elapsed}s`);
  console.log('\n✅ Import complete!');
}

// Run
main().catch(console.error);
