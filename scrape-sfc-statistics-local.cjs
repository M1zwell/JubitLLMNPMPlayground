/**
 * SFC Statistics Scraper - LOCAL FILES VERSION
 * Reads from locally downloaded XLSX files instead of fetching from URLs
 */

const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTYyODE3NywiZXhwIjoyMDY3MjA0MTc3fQ.5D9mVu_ssolTEW1ffotXoBFY65DuMvE7ERUHedj0t2E';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Local file paths - UPDATE THESE IF YOUR FILES ARE IN A DIFFERENT LOCATION
const LOCAL_FILES = {
  A1: 'C:\\Users\\user\\Downloads\\a01x (3).xlsx',
  A2: 'C:\\Users\\user\\Downloads\\a02x (1).xlsx',
  A3: 'C:\\Users\\user\\Downloads\\a03x (1).xlsx',
  C4: 'C:\\Users\\user\\Downloads\\c04x.xlsx',
  C5: 'C:\\Users\\user\\Downloads\\c05x.xlsx',
  D3: 'C:\\Users\\user\\Downloads\\d03x (1).xlsx',
  D4: 'C:\\Users\\user\\Downloads\\d04x.xlsx'
};

/**
 * Parse numeric value handling commas and parentheses (negatives)
 */
function parseNumeric(value) {
  if (value === null || value === undefined || value === '') return null;

  const str = String(value).trim();

  // Handle non-numeric values
  if (str === 'n.a.' || str === '-' || str === 'N/A' || str === '') return null;

  // Handle negative values in parentheses: (1,234.5) => -1234.5
  if (str.startsWith('(') && str.endsWith(')')) {
    const numStr = str.slice(1, -1).replace(/,/g, '');
    const num = parseFloat(numStr);
    return isNaN(num) ? null : -num;
  }

  // Handle regular numbers with commas: 1,234.5 => 1234.5
  const numStr = str.replace(/,/g, '');
  const num = parseFloat(numStr);
  return isNaN(num) ? null : num;
}

/**
 * Read XLSX file from local path
 */
function readLocalXLSX(filePath) {
  console.log(`📂 Reading local file: ${filePath}`);
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
  console.log(`✅ Loaded ${data.length} rows`);
  return data;
}

/**
 * Parse Table A1: Market Highlights (Annual Summary Format)
 * Local file structure:
 * [0:Year] [1:MB#] [2:MB Cap] [3:MB Turnover] [4:GEM#] [5:GEM Cap] [6:GEM Turnover] [7:Trading Days]
 */
function parseTableA1(data) {
  const records = [];
  let dataStartRow = -1;

  // Find data start row (skip headers)
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row[0] && String(row[0]).match(/^\d{4}$/)) {
      dataStartRow = i;
      break;
    }
  }

  if (dataStartRow === -1) {
    console.warn('⚠️  Could not find data start row for Table A1');
    return records;
  }

  for (let i = dataStartRow; i < data.length; i++) {
    const row = data[i];
    const year = row[0];

    if (!year || !String(year).match(/^\d{4}$/)) continue;

    // Calculate totals: Main Board + GEM
    const mainBoardCap = parseNumeric(row[2]);
    const gemCap = parseNumeric(row[5]);
    const totalMarketCap = (mainBoardCap || 0) + (gemCap || 0);

    const mainBoardTurnover = parseNumeric(row[3]);
    const gemTurnover = parseNumeric(row[6]);
    const totalTurnover = (mainBoardTurnover || 0) + (gemTurnover || 0);

    const mainBoardListings = parseNumeric(row[1]);
    const gemListings = parseNumeric(row[4]);
    const totalListings = (mainBoardListings || 0) + (gemListings || 0);

    records.push({
      period: String(year),
      period_type: 'annual',
      market_cap: totalMarketCap > 0 ? totalMarketCap : null,
      turnover: totalTurnover > 0 ? totalTurnover : null,
      total_listings: totalListings > 0 ? totalListings : null,
      new_listings: null, // Not available in annual summary
      funds_raised: null, // Not available in annual summary
      main_board_cap: mainBoardCap,
      gem_cap: gemCap
    });
  }

  return records;
}

/**
 * Parse Table A2: Market Cap by Type
 */
function parseTableA2(data) {
  const records = [];
  let dataStartRow = -1;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row[0] && String(row[0]).match(/^\d{4}$/)) {
      dataStartRow = i;
      break;
    }
  }

  if (dataStartRow === -1) {
    console.warn('⚠️  Could not find data start row for Table A2');
    return records;
  }

  for (let i = dataStartRow; i < data.length; i++) {
    const row = data[i];
    const year = row[0];
    const period = row[1];
    const stockType = row[2];

    if (!year || !period || !stockType) continue;

    records.push({
      year: parseInt(year),
      period: String(period).toLowerCase(),
      stock_type: String(stockType),
      number_of_companies: parseNumeric(row[3]),
      market_cap: parseNumeric(row[4]),
      percentage: parseNumeric(row[5])
    });
  }

  return records;
}

/**
 * Parse Table A3: Turnover by Type
 */
function parseTableA3(data) {
  const records = [];
  let dataStartRow = -1;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row[0] && String(row[0]).match(/^\d{4}$/)) {
      dataStartRow = i;
      break;
    }
  }

  if (dataStartRow === -1) {
    console.warn('⚠️  Could not find data start row for Table A3');
    return records;
  }

  for (let i = dataStartRow; i < data.length; i++) {
    const row = data[i];
    const year = row[0];
    const period = row[1];
    const stockType = row[2];

    if (!year || !period || !stockType) continue;

    records.push({
      year: parseInt(year),
      period: String(period).toLowerCase(),
      stock_type: String(stockType),
      avg_daily_turnover: parseNumeric(row[3]),
      percentage: parseNumeric(row[4])
    });
  }

  return records;
}

/**
 * Parse Table C4: Licensed Representatives
 */
function parseTableC4(data) {
  const records = [];
  let dataStartRow = -1;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row[0] && String(row[0]).match(/^\d{4}$/)) {
      dataStartRow = i;
      break;
    }
  }

  if (dataStartRow === -1) {
    console.warn('⚠️  Could not find data start row for Table C4');
    return records;
  }

  for (let i = dataStartRow; i < data.length; i++) {
    const row = data[i];
    const year = row[0];
    const period = row[1];
    const activity = row[2];

    if (!year || !period || !activity) continue;

    records.push({
      year: parseInt(year),
      period: String(period).toLowerCase(),
      activity_type: String(activity),
      representative_count: parseNumeric(row[3]),
      yoy_change: parseNumeric(row[4])
    });
  }

  return records;
}

/**
 * Parse Table C5: Responsible Officers
 */
function parseTableC5(data) {
  const records = [];
  let dataStartRow = -1;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row[0] && String(row[0]).match(/^\d{4}$/)) {
      dataStartRow = i;
      break;
    }
  }

  if (dataStartRow === -1) {
    console.warn('⚠️  Could not find data start row for Table C5');
    return records;
  }

  for (let i = dataStartRow; i < data.length; i++) {
    const row = data[i];
    const year = row[0];
    const period = row[1];
    const activity = row[2];

    if (!year || !period || !activity) continue;

    records.push({
      year: parseInt(year),
      period: String(period).toLowerCase(),
      activity_type: String(activity),
      officer_count: parseNumeric(row[3]),
      yoy_change: parseNumeric(row[4])
    });
  }

  return records;
}

/**
 * Parse Table D3: Mutual Fund NAV
 */
function parseTableD3(data) {
  const records = [];
  let dataStartRow = -1;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row[0] && String(row[0]).match(/^\d{4}$/)) {
      dataStartRow = i;
      break;
    }
  }

  if (dataStartRow === -1) {
    console.warn('⚠️  Could not find data start row for Table D3');
    return records;
  }

  for (let i = dataStartRow; i < data.length; i++) {
    const row = data[i];
    const year = row[0];
    const period = row[1];
    const fundType = row[2];

    if (!year || !period || !fundType) continue;

    records.push({
      year: parseInt(year),
      period: String(period).toLowerCase(),
      fund_type: String(fundType),
      fund_count: parseNumeric(row[3]),
      nav: parseNumeric(row[4]),
      percentage: parseNumeric(row[5])
    });
  }

  return records;
}

/**
 * Parse Table D4: Fund Flows
 */
function parseTableD4(data) {
  const records = [];
  let dataStartRow = -1;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row[0] && String(row[0]).match(/^\d{4}$/)) {
      dataStartRow = i;
      break;
    }
  }

  if (dataStartRow === -1) {
    console.warn('⚠️  Could not find data start row for Table D4');
    return records;
  }

  for (let i = dataStartRow; i < data.length; i++) {
    const row = data[i];
    const year = row[0];
    const period = row[1];

    if (!year || !period) continue;

    records.push({
      year: parseInt(year),
      period: String(period).toLowerCase(),
      subscriptions: parseNumeric(row[2]),
      redemptions: parseNumeric(row[3]),
      net_flows: parseNumeric(row[4]),
      flow_rate: parseNumeric(row[5])
    });
  }

  return records;
}

/**
 * Main execution
 */
async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('📊 SFC STATISTICS IMPORT - LOCAL FILES VERSION');
  console.log('='.repeat(70) + '\n');

  try {
    // Table A1: Market Highlights
    console.log('\n🔹 Table A1: Market Highlights');
    const dataA1 = readLocalXLSX(LOCAL_FILES.A1);
    const recordsA1 = parseTableA1(dataA1);
    console.log(`  Parsed ${recordsA1.length} records`);

    if (recordsA1.length > 0) {
      console.log('  Sample:', recordsA1[0]);
      const { data, error } = await supabase
        .from('sfc_market_highlights')
        .upsert(recordsA1, { onConflict: 'period,period_type', ignoreDuplicates: false });

      if (error) {
        console.error('  ❌ Error:', error.message);
      } else {
        console.log(`  ✅ Inserted/updated ${recordsA1.length} records`);
      }
    }

    // Table A2: Market Cap by Type
    console.log('\n🔹 Table A2: Market Cap by Type');
    const dataA2 = readLocalXLSX(LOCAL_FILES.A2);
    const recordsA2 = parseTableA2(dataA2);
    console.log(`  Parsed ${recordsA2.length} records`);

    if (recordsA2.length > 0) {
      console.log('  Sample:', recordsA2[0]);
      const { data, error } = await supabase
        .from('sfc_market_cap_by_type')
        .upsert(recordsA2, { onConflict: 'year,period,stock_type', ignoreDuplicates: false });

      if (error) {
        console.error('  ❌ Error:', error.message);
      } else {
        console.log(`  ✅ Inserted/updated ${recordsA2.length} records`);
      }
    }

    // Table A3: Turnover by Type
    console.log('\n🔹 Table A3: Turnover by Type');
    const dataA3 = readLocalXLSX(LOCAL_FILES.A3);
    const recordsA3 = parseTableA3(dataA3);
    console.log(`  Parsed ${recordsA3.length} records`);

    if (recordsA3.length > 0) {
      console.log('  Sample:', recordsA3[0]);
      const { data, error } = await supabase
        .from('sfc_turnover_by_type')
        .upsert(recordsA3, { onConflict: 'year,period,stock_type', ignoreDuplicates: false });

      if (error) {
        console.error('  ❌ Error:', error.message);
      } else {
        console.log(`  ✅ Inserted/updated ${recordsA3.length} records`);
      }
    }

    // Table C4: Licensed Representatives
    console.log('\n🔹 Table C4: Licensed Representatives');
    const dataC4 = readLocalXLSX(LOCAL_FILES.C4);
    const recordsC4 = parseTableC4(dataC4);
    console.log(`  Parsed ${recordsC4.length} records`);

    if (recordsC4.length > 0) {
      console.log('  Sample:', recordsC4[0]);
      const { data, error } = await supabase
        .from('sfc_licensed_representatives')
        .upsert(recordsC4, { onConflict: 'year,period,activity_type', ignoreDuplicates: false });

      if (error) {
        console.error('  ❌ Error:', error.message);
      } else {
        console.log(`  ✅ Inserted/updated ${recordsC4.length} records`);
      }
    }

    // Table C5: Responsible Officers
    console.log('\n🔹 Table C5: Responsible Officers');
    const dataC5 = readLocalXLSX(LOCAL_FILES.C5);
    const recordsC5 = parseTableC5(dataC5);
    console.log(`  Parsed ${recordsC5.length} records`);

    if (recordsC5.length > 0) {
      console.log('  Sample:', recordsC5[0]);
      const { data, error } = await supabase
        .from('sfc_responsible_officers')
        .upsert(recordsC5, { onConflict: 'year,period,activity_type', ignoreDuplicates: false });

      if (error) {
        console.error('  ❌ Error:', error.message);
      } else {
        console.log(`  ✅ Inserted/updated ${recordsC5.length} records`);
      }
    }

    // Table D3: Mutual Fund NAV
    console.log('\n🔹 Table D3: Mutual Fund NAV');
    const dataD3 = readLocalXLSX(LOCAL_FILES.D3);
    const recordsD3 = parseTableD3(dataD3);
    console.log(`  Parsed ${recordsD3.length} records`);

    if (recordsD3.length > 0) {
      console.log('  Sample:', recordsD3[0]);
      const { data, error } = await supabase
        .from('sfc_mutual_fund_nav')
        .upsert(recordsD3, { onConflict: 'year,period,fund_type', ignoreDuplicates: false });

      if (error) {
        console.error('  ❌ Error:', error.message);
      } else {
        console.log(`  ✅ Inserted/updated ${recordsD3.length} records`);
      }
    }

    // Table D4: Fund Flows
    console.log('\n🔹 Table D4: Fund Flows');
    const dataD4 = readLocalXLSX(LOCAL_FILES.D4);
    const recordsD4 = parseTableD4(dataD4);
    console.log(`  Parsed ${recordsD4.length} records`);

    if (recordsD4.length > 0) {
      console.log('  Sample:', recordsD4[0]);
      const { data, error } = await supabase
        .from('sfc_fund_flows')
        .upsert(recordsD4, { onConflict: 'year,period', ignoreDuplicates: false });

      if (error) {
        console.error('  ❌ Error:', error.message);
      } else {
        console.log(`  ✅ Inserted/updated ${recordsD4.length} records`);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('✨ SFC STATISTICS IMPORT COMPLETE!');
    console.log('='.repeat(70) + '\n');

  } catch (err) {
    console.error('\n❌ Fatal error:', err.message);
    console.error(err);
    process.exit(1);
  }
}

main().catch(console.error);
