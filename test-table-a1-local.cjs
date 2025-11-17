/**
 * Test Table A1 parsing from local file
 */

const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTYyODE3NywiZXhwIjoyMDY3MjA0MTc3fQ.5D9mVu_ssolTEW1ffotXoBFY65DuMvE7ERUHedj0t2E';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const LOCAL_FILE = 'C:\\Users\\user\\Downloads\\a01x (3).xlsx';

function parseNumeric(value) {
  if (value === null || value === undefined || value === '') return null;
  const str = String(value).trim();
  if (str === 'n.a.' || str === '-' || str === 'N/A' || str === '') return null;
  if (str.startsWith('(') && str.endsWith(')')) {
    const numStr = str.slice(1, -1).replace(/,/g, '');
    const num = parseFloat(numStr);
    return isNaN(num) ? null : -num;
  }
  const numStr = str.replace(/,/g, '');
  const num = parseFloat(numStr);
  return isNaN(num) ? null : num;
}

function parseTableA1(data) {
  const recordsMap = new Map(); // Use Map to handle duplicates
  let dataStartRow = -1;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row[0] && String(row[0]).match(/^\d{4}$/)) {
      dataStartRow = i;
      break;
    }
  }

  if (dataStartRow === -1) {
    console.warn('⚠️  Could not find data start row');
    return [];
  }

  console.log(`Data starts at row ${dataStartRow}\n`);

  for (let i = dataStartRow; i < data.length; i++) {
    const row = data[i];
    const year = row[0];

    if (!year || !String(year).match(/^\d{4}$/)) continue;

    const mainBoardCap = parseNumeric(row[2]);
    const gemCap = parseNumeric(row[5]);
    const totalMarketCap = (mainBoardCap || 0) + (gemCap || 0);

    const mainBoardTurnover = parseNumeric(row[3]);
    const gemTurnover = parseNumeric(row[6]);
    const totalTurnover = (mainBoardTurnover || 0) + (gemTurnover || 0);

    const mainBoardListings = parseNumeric(row[1]);
    const gemListings = parseNumeric(row[4]);
    const totalListings = (mainBoardListings || 0) + (gemListings || 0);

    const key = `${year}-annual`;

    // Use Map to automatically handle duplicates (keeps last occurrence)
    recordsMap.set(key, {
      period: String(year),
      period_type: 'annual',
      market_cap: totalMarketCap > 0 ? totalMarketCap : null,
      turnover: totalTurnover > 0 ? totalTurnover : null,
      total_listings: totalListings > 0 ? totalListings : null,
      new_listings: null,
      funds_raised: null,
      main_board_cap: mainBoardCap,
      gem_cap: gemCap
    });
  }

  return Array.from(recordsMap.values());
}

async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('📊 TEST TABLE A1 - LOCAL FILE');
  console.log('='.repeat(70) + '\n');

  console.log(`📂 Reading: ${LOCAL_FILE}\n`);
  const workbook = XLSX.readFile(LOCAL_FILE);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });

  console.log(`✅ Loaded ${data.length} rows\n`);

  const records = parseTableA1(data);
  console.log(`✅ Parsed ${records.length} records\n`);

  // Check for duplicates
  const seen = new Set();
  const duplicates = [];
  records.forEach((rec, idx) => {
    const key = `${rec.period}-${rec.period_type}`;
    if (seen.has(key)) {
      duplicates.push({ idx, period: rec.period, period_type: rec.period_type });
    }
    seen.add(key);
  });

  if (duplicates.length > 0) {
    console.log(`⚠️  Found ${duplicates.length} duplicate records:`, duplicates);
  }

  if (records.length > 0) {
    console.log('First 3 records:');
    records.slice(0, 3).forEach((rec, idx) => {
      console.log(`\nRecord ${idx + 1}:`, JSON.stringify(rec, null, 2));
    });

    console.log('\n' + '='.repeat(70));
    console.log('💾 Inserting into database...\n');

    const { data: inserted, error } = await supabase
      .from('sfc_market_highlights')
      .upsert(records, { onConflict: 'period,period_type', ignoreDuplicates: false });

    if (error) {
      console.error('❌ Error:', error.message);
      console.error('Full error:', error);
    } else {
      console.log(`✅ Successfully inserted/updated ${records.length} records!`);
    }
  }

  console.log('\n' + '='.repeat(70) + '\n');
}

main().catch(console.error);
