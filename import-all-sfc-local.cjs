/**
 * Complete SFC Statistics Import from Local Files
 * Imports all 7 tables from Desktop location
 */

const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTYyODE3NywiZXhwIjoyMDY3MjA0MTc3fQ.5D9mVu_ssolTEW1ffotXoBFY65DuMvE7ERUHedj0t2E';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// Updated file paths - Desktop location
const LOCAL_FILES = {
  A1: 'C:\\Users\\user\\Downloads\\a01x (3).xlsx', // Keep A1 from Downloads (already working)
  A2: 'c:\\Users\\user\\Desktop\\Oyin AM\\SFC statistics\\a02x.xlsx',
  A3: 'c:\\Users\\user\\Desktop\\Oyin AM\\SFC statistics\\a03x.xlsx',
  C4: 'c:\\Users\\user\\Desktop\\Oyin AM\\SFC statistics\\c04x.xlsx',
  C5: 'c:\\Users\\user\\Desktop\\Oyin AM\\SFC statistics\\c05x.xlsx',
  D3: 'c:\\Users\\user\\Desktop\\Oyin AM\\SFC statistics\\d03x.xlsx',
  D4: 'c:\\Users\\user\\Desktop\\Oyin AM\\SFC statistics\\d04x.xlsx'
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
  console.log(`📂 Reading: ${filePath}`);
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });
  console.log(`✅ Loaded ${data.length} rows`);
  return data;
}

/**
 * Parse Table A1: Market Highlights
 * [0:Year] [1:MB#] [2:MB Cap] [3:MB Turnover] [4:GEM#] [5:GEM Cap] [6:GEM Turnover] [7:Trading Days]
 */
function parseTableA1(data) {
  const recordsMap = new Map();
  let dataStartRow = -1;

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row[0] && String(row[0]).match(/^\d{4}$/)) {
      dataStartRow = i;
      break;
    }
  }

  if (dataStartRow === -1) {
    console.warn('⚠️  Could not find data start row for Table A1');
    return [];
  }

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

/**
 * Parse Table A2: Market Cap by Type
 * [0:Year] [1:Total MB] [2:HSI Const] [3:Non-H Mainland] [4:H-shares] [5:Total GEM] [6:Non-H Mainland GEM] [7:H-shares GEM]
 */
function parseTableA2(data) {
  const recordsMap = new Map();
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
    return [];
  }

  for (let i = dataStartRow; i < data.length; i++) {
    const row = data[i];
    const year = row[0];

    if (!year || !String(year).match(/^\d{4}$/)) continue;

    // Main Board - Total
    const key1 = `${year}-annual-Main Board`;
    recordsMap.set(key1, {
      period: String(year),
      period_type: 'annual',
      stock_type: 'Main Board',
      number_of_companies: null,
      market_cap: parseNumeric(row[1]),
      percentage: null
    });

    // Main Board - HSI Constituents
    if (row[2]) {
      const key2 = `${year}-annual-HSI Constituents`;
      recordsMap.set(key2, {
        period: String(year),
        period_type: 'annual',
        stock_type: 'HSI Constituents',
        number_of_companies: null,
        market_cap: parseNumeric(row[2]),
        percentage: null
      });
    }

    // Main Board - Non-H share Mainland
    if (row[3]) {
      const key3 = `${year}-annual-Non-H share Mainland`;
      recordsMap.set(key3, {
        period: String(year),
        period_type: 'annual',
        stock_type: 'Non-H share Mainland',
        number_of_companies: null,
        market_cap: parseNumeric(row[3]),
        percentage: null
      });
    }

    // Main Board - H-shares
    if (row[4]) {
      const key4 = `${year}-annual-H-shares`;
      recordsMap.set(key4, {
        period: String(year),
        period_type: 'annual',
        stock_type: 'H-shares',
        number_of_companies: null,
        market_cap: parseNumeric(row[4]),
        percentage: null
      });
    }

    // GEM - Total
    if (row[5]) {
      const key5 = `${year}-annual-GEM`;
      recordsMap.set(key5, {
        period: String(year),
        period_type: 'annual',
        stock_type: 'GEM',
        number_of_companies: null,
        market_cap: parseNumeric(row[5]),
        percentage: null
      });
    }
  }

  return Array.from(recordsMap.values());
}

/**
 * Parse Table A3: Turnover by Type
 * [0:Year] [1:Total MB] [2:HSI Const] [3:Non-H Mainland] [4:H-shares] [5:Total GEM] [6:Non-H Mainland GEM] [7:H-shares GEM]
 */
function parseTableA3(data) {
  const recordsMap = new Map();
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
    return [];
  }

  for (let i = dataStartRow; i < data.length; i++) {
    const row = data[i];
    const year = row[0];

    if (!year || !String(year).match(/^\d{4}$/)) continue;

    // Main Board - Total
    const key1 = `${year}-annual-Main Board`;
    recordsMap.set(key1, {
      period: String(year),
      period_type: 'annual',
      stock_type: 'Main Board',
      avg_daily_turnover: parseNumeric(row[1]),
      percentage: null
    });

    // Main Board - HSI Constituents
    if (row[2]) {
      const key2 = `${year}-annual-HSI Constituents`;
      recordsMap.set(key2, {
        period: String(year),
        period_type: 'annual',
        stock_type: 'HSI Constituents',
        avg_daily_turnover: parseNumeric(row[2]),
        percentage: null
      });
    }

    // Main Board - Non-H share Mainland
    if (row[3]) {
      const key3 = `${year}-annual-Non-H share Mainland`;
      recordsMap.set(key3, {
        period: String(year),
        period_type: 'annual',
        stock_type: 'Non-H share Mainland',
        avg_daily_turnover: parseNumeric(row[3]),
        percentage: null
      });
    }

    // Main Board - H-shares
    if (row[4]) {
      const key4 = `${year}-annual-H-shares`;
      recordsMap.set(key4, {
        period: String(year),
        period_type: 'annual',
        stock_type: 'H-shares',
        avg_daily_turnover: parseNumeric(row[4]),
        percentage: null
      });
    }

    // GEM - Total
    if (row[5]) {
      const key5 = `${year}-annual-GEM`;
      recordsMap.set(key5, {
        period: String(year),
        period_type: 'annual',
        stock_type: 'GEM',
        avg_daily_turnover: parseNumeric(row[5]),
        percentage: null
      });
    }
  }

  return Array.from(recordsMap.values());
}

/**
 * Parse Table C4: Licensed Representatives
 * [0:Year] [1:RA1] [2:RA2] [3:RA3] [4:RA4] [5:RA5] [6:RA6] [7:RA7] [8:RA8] [9:RA9] [10:RA10] [11:RA13] [12:Total]
 */
function parseTableC4(data) {
  const recordsMap = new Map();
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
    return [];
  }

  const activities = ['RA1', 'RA2', 'RA3', 'RA4', 'RA5', 'RA6', 'RA7', 'RA8', 'RA9', 'RA10', 'RA13', 'Total'];

  for (let i = dataStartRow; i < data.length; i++) {
    const row = data[i];
    const year = row[0];

    if (!year || !String(year).match(/^\d{4}$/)) continue;

    for (let j = 0; j < activities.length; j++) {
      const activity = activities[j];
      const count = parseNumeric(row[j + 1]);

      if (count !== null) {
        const key = `${year}-annual-${activity}`;
        recordsMap.set(key, {
          period: String(year),
          period_type: 'annual',
          activity_type: activity,
          representative_count: count,
          yoy_change: null
        });
      }
    }
  }

  return Array.from(recordsMap.values());
}

/**
 * Parse Table C5: Responsible Officers
 * Same structure as C4
 */
function parseTableC5(data) {
  const recordsMap = new Map();
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
    return [];
  }

  const activities = ['RA1', 'RA2', 'RA3', 'RA4', 'RA5', 'RA6', 'RA7', 'RA8', 'RA9', 'RA10', 'RA11', 'RA12', 'RA13', 'Total'];

  for (let i = dataStartRow; i < data.length; i++) {
    const row = data[i];
    const year = row[0];

    if (!year || !String(year).match(/^\d{4}$/)) continue;

    for (let j = 0; j < activities.length; j++) {
      const activity = activities[j];
      const count = parseNumeric(row[j + 1]);

      if (count !== null) {
        const key = `${year}-annual-${activity}`;
        recordsMap.set(key, {
          period: String(year),
          period_type: 'annual',
          activity_type: activity,
          officer_count: count,
          yoy_change: null
        });
      }
    }
  }

  return Array.from(recordsMap.values());
}

/**
 * Parse Table D3: Mutual Fund NAV
 * Format: [0:Date like "Sep-25"] [1:Bond] [2:Equity] [3:Mixed] [4:Money Market] [5:Feeder] [6:Index] [7:Guaranteed] [8:Hedge] [9:Commodity] [10:Total]
 */
function parseTableD3(data) {
  const recordsMap = new Map();
  let dataStartRow = -1;

  // Look for date pattern like "Sep-25", "Jun-25", "Dec-24"
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row[0] && String(row[0]).match(/^[A-Za-z]{3}-\d{2}$/)) {
      dataStartRow = i;
      break;
    }
  }

  if (dataStartRow === -1) {
    console.warn('⚠️  Could not find data start row for Table D3');
    return [];
  }

  const fundTypes = ['Bond', 'Equity', 'Mixed', 'Money Market', 'Feeder Funds', 'Index', 'Guaranteed', 'Hedge', 'Commodity', 'Total'];

  for (let i = dataStartRow; i < data.length; i++) {
    const row = data[i];
    const dateStr = row[0];

    // Match format like "Sep-25", "Dec-24"
    if (!dateStr || !String(dateStr).match(/^[A-Za-z]{3}-\d{2}$/)) continue;

    // Convert "Sep-25" to "2025-Q3" format for period
    // For simplicity, use annual and extract year
    const yearPart = String(dateStr).split('-')[1];
    const fullYear = yearPart.startsWith('2') ? `20${yearPart}` : `19${yearPart}`;
    const monthPart = String(dateStr).split('-')[0];
    const period = `${fullYear}-${monthPart}`;

    for (let j = 0; j < fundTypes.length; j++) {
      const navValue = parseNumeric(row[j + 1]);

      if (navValue !== null) {
        const key = `${period}-quarterly-${fundTypes[j]}`;
        recordsMap.set(key, {
          period: period,
          period_type: 'quarterly',
          fund_category: fundTypes[j],
          fund_count: null,
          nav: navValue,
          percentage: null
        });
      }
    }
  }

  return Array.from(recordsMap.values());
}

/**
 * Parse Table D4: Fund Flows
 * Format: [0:Year like "2025", "2024"] [1-10: Various fund types] [11:Total]
 * Database stores aggregate totals, so we use the Total column
 */
function parseTableD4(data) {
  const recordsMap = new Map();
  let dataStartRow = -1;

  // Look for rows that start with year (may have extra text like "2025 (up to nine mon" or "20211")
  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (row[0] && String(row[0]).match(/^20\d{2}/)) {
      dataStartRow = i;
      break;
    }
  }

  if (dataStartRow === -1) {
    console.warn('⚠️  Could not find data start row for Table D4');
    return [];
  }

  for (let i = dataStartRow; i < data.length; i++) {
    const row = data[i];
    const yearStr = row[0];

    if (!yearStr || !String(yearStr).match(/^20\d{2}/)) continue;

    // Extract year from strings like "2025 (up to nine mon" or "20211" or "2024"
    const yearMatch = String(yearStr).match(/^(20\d{2})/);
    if (!yearMatch) continue;

    const year = yearMatch[1];
    const key = `${year}-annual`;

    // Column 11 is Total net flows
    // Since the file shows net flows by fund type, we'll use Total as net_flows
    const totalNetFlows = parseNumeric(row[11]);

    recordsMap.set(key, {
      period: String(year),
      period_type: 'annual',
      fund_category: 'Total',
      subscriptions: null,  // Not available in this format
      redemptions: null,    // Not available in this format
      net_flows: totalNetFlows,
      flow_rate: null       // Not available in this format
    });
  }

  return Array.from(recordsMap.values());
}

/**
 * Main execution
 */
async function main() {
  console.log('\n' + '='.repeat(70));
  console.log('📊 SFC STATISTICS - COMPLETE LOCAL IMPORT');
  console.log('='.repeat(70) + '\n');

  const results = {
    A1: 0,
    A2: 0,
    A3: 0,
    C4: 0,
    C5: 0,
    D3: 0,
    D4: 0
  };

  try {
    // Table A1: Market Highlights
    console.log('\n🔹 Table A1: Market Highlights');
    const dataA1 = readLocalXLSX(LOCAL_FILES.A1);
    const recordsA1 = parseTableA1(dataA1);
    console.log(`  Parsed ${recordsA1.length} records`);

    if (recordsA1.length > 0) {
      const { error } = await supabase
        .from('sfc_market_highlights')
        .upsert(recordsA1, { onConflict: 'period,period_type', ignoreDuplicates: false });

      if (error) {
        console.error('  ❌ Error:', error.message);
      } else {
        results.A1 = recordsA1.length;
        console.log(`  ✅ Inserted/updated ${recordsA1.length} records`);
      }
    }

    // Table A2: Market Cap by Type
    console.log('\n🔹 Table A2: Market Cap by Type');
    const dataA2 = readLocalXLSX(LOCAL_FILES.A2);
    const recordsA2 = parseTableA2(dataA2);
    console.log(`  Parsed ${recordsA2.length} records`);

    if (recordsA2.length > 0) {
      const { error } = await supabase
        .from('sfc_market_cap_by_type')
        .upsert(recordsA2, { onConflict: 'period,period_type,stock_type', ignoreDuplicates: false });

      if (error) {
        console.error('  ❌ Error:', error.message);
      } else {
        results.A2 = recordsA2.length;
        console.log(`  ✅ Inserted/updated ${recordsA2.length} records`);
      }
    }

    // Table A3: Turnover by Type
    console.log('\n🔹 Table A3: Turnover by Type');
    const dataA3 = readLocalXLSX(LOCAL_FILES.A3);
    const recordsA3 = parseTableA3(dataA3);
    console.log(`  Parsed ${recordsA3.length} records`);

    if (recordsA3.length > 0) {
      const { error } = await supabase
        .from('sfc_turnover_by_type')
        .upsert(recordsA3, { onConflict: 'period,period_type,stock_type', ignoreDuplicates: false });

      if (error) {
        console.error('  ❌ Error:', error.message);
      } else {
        results.A3 = recordsA3.length;
        console.log(`  ✅ Inserted/updated ${recordsA3.length} records`);
      }
    }

    // Table C4: Licensed Representatives
    console.log('\n🔹 Table C4: Licensed Representatives');
    const dataC4 = readLocalXLSX(LOCAL_FILES.C4);
    const recordsC4 = parseTableC4(dataC4);
    console.log(`  Parsed ${recordsC4.length} records`);

    if (recordsC4.length > 0) {
      const { error } = await supabase
        .from('sfc_licensed_representatives')
        .upsert(recordsC4, { onConflict: 'period,period_type,activity_type', ignoreDuplicates: false });

      if (error) {
        console.error('  ❌ Error:', error.message);
      } else {
        results.C4 = recordsC4.length;
        console.log(`  ✅ Inserted/updated ${recordsC4.length} records`);
      }
    }

    // Table C5: Responsible Officers
    console.log('\n🔹 Table C5: Responsible Officers');
    const dataC5 = readLocalXLSX(LOCAL_FILES.C5);
    const recordsC5 = parseTableC5(dataC5);
    console.log(`  Parsed ${recordsC5.length} records`);

    if (recordsC5.length > 0) {
      const { error } = await supabase
        .from('sfc_responsible_officers')
        .upsert(recordsC5, { onConflict: 'period,period_type,activity_type', ignoreDuplicates: false });

      if (error) {
        console.error('  ❌ Error:', error.message);
      } else {
        results.C5 = recordsC5.length;
        console.log(`  ✅ Inserted/updated ${recordsC5.length} records`);
      }
    }

    // Table D3: Mutual Fund NAV
    console.log('\n🔹 Table D3: Mutual Fund NAV');
    const dataD3 = readLocalXLSX(LOCAL_FILES.D3);
    const recordsD3 = parseTableD3(dataD3);
    console.log(`  Parsed ${recordsD3.length} records`);

    if (recordsD3.length > 0) {
      const { error } = await supabase
        .from('sfc_mutual_fund_nav')
        .upsert(recordsD3, { onConflict: 'period,period_type,fund_category', ignoreDuplicates: false });

      if (error) {
        console.error('  ❌ Error:', error.message);
      } else {
        results.D3 = recordsD3.length;
        console.log(`  ✅ Inserted/updated ${recordsD3.length} records`);
      }
    }

    // Table D4: Fund Flows
    console.log('\n🔹 Table D4: Fund Flows');
    const dataD4 = readLocalXLSX(LOCAL_FILES.D4);
    const recordsD4 = parseTableD4(dataD4);
    console.log(`  Parsed ${recordsD4.length} records`);

    if (recordsD4.length > 0) {
      const { error } = await supabase
        .from('sfc_fund_flows')
        .upsert(recordsD4, { onConflict: 'period,period_type,fund_category', ignoreDuplicates: false });

      if (error) {
        console.error('  ❌ Error:', error.message);
      } else {
        results.D4 = recordsD4.length;
        console.log(`  ✅ Inserted/updated ${recordsD4.length} records`);
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log('✨ SFC STATISTICS IMPORT COMPLETE!');
    console.log('='.repeat(70));
    console.log('\n📊 SUMMARY:');
    console.log(`  Table A1 (Market Highlights):        ${results.A1} records`);
    console.log(`  Table A2 (Market Cap by Type):       ${results.A2} records`);
    console.log(`  Table A3 (Turnover by Type):         ${results.A3} records`);
    console.log(`  Table C4 (Licensed Representatives): ${results.C4} records`);
    console.log(`  Table C5 (Responsible Officers):     ${results.C5} records`);
    console.log(`  Table D3 (Mutual Fund NAV):          ${results.D3} records`);
    console.log(`  Table D4 (Fund Flows):               ${results.D4} records`);
    console.log(`\n  TOTAL: ${Object.values(results).reduce((a, b) => a + b, 0)} records\n`);

  } catch (err) {
    console.error('\n❌ Fatal error:', err.message);
    console.error(err);
    process.exit(1);
  }
}

main().catch(console.error);
