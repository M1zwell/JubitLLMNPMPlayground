const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Supabase client
const supabase = createClient(
  'https://kiztaihzanqnrcrqaxsv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8'
);

// Excel file path
const filePath = path.join('c:', 'Users', 'user', 'Desktop', 'Oyin AM', 'SFC statistics', 'd03x.xlsx');

// Convert Excel serial date to JavaScript Date
function excelDateToJSDate(serial) {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate());
}

// Convert date to year and quarter
function dateToYearQuarter(date) {
  const year = date.getFullYear();
  const month = date.getMonth() + 1; // 0-indexed
  const quarter = Math.ceil(month / 3);
  return { year, quarter };
}

// Helper function to parse number, handling strings with commas
function parseNumber(val) {
  if (val === null || val === undefined || val === '' || val === 'n.a.') return null;

  // If it's already a number, return it
  if (typeof val === 'number') return val;

  // If it's a string, remove commas and parse
  if (typeof val === 'string') {
    const cleaned = val.replace(/,/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }

  return null;
}

async function importD3Data() {
  console.log('═══ D3 Data Import ═══\n');
  console.log('Reading Excel file:', filePath);

  // Read Excel file (first sheet only)
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0]; // "Table D3a & Table D3b"
  const sheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

  console.log('Total rows in Excel:', rawData.length);
  console.log('Sheet:', sheetName);

  const allRecords = [];

  // Fund categories (columns 1-10, with column 10 being Total)
  const categories = [
    'Bond',               // Col 1
    'Equity',             // Col 2
    'Mixed',              // Col 3
    'Money Market',       // Col 4
    'Feeder Funds',       // Col 5
    'Index',              // Col 6
    'Guaranteed',         // Col 7
    'Hedge',              // Col 8
    'Commodity/Virtual Asset', // Col 9 (for HK) or 'Commodity' for non-HK
    'Total'               // Col 10
  ];

  // Parse D3a - HK domiciled (rows 4-23, 20 quarters)
  console.log('\n═══ Parsing D3a (HK Domiciled) ═══');
  for (let rowIdx = 4; rowIdx <= 23; rowIdx++) {
    const row = rawData[rowIdx];
    const excelSerial = row[0];

    if (!excelSerial || typeof excelSerial !== 'number') continue;

    const jsDate = excelDateToJSDate(excelSerial);
    const { year, quarter } = dateToYearQuarter(jsDate);

    // Create records for each fund category
    for (let catIdx = 0; catIdx < categories.length; catIdx++) {
      const category = categories[catIdx];
      const value = parseNumber(row[catIdx + 1]); // +1 because column 0 is the date

      if (value !== null) {
        allRecords.push({
          year,
          quarter,
          domicile: 'HK',
          fund_category: category,
          nav_usd_million: value
        });
      }
    }
  }

  console.log(`Parsed ${allRecords.length} HK domiciled records`);

  // Parse D3b - Non-HK domiciled (rows 29-48, 20 quarters)
  console.log('\n═══ Parsing D3b (Non-HK Domiciled) ═══');
  const nonHKStart = allRecords.length;

  for (let rowIdx = 29; rowIdx <= 48; rowIdx++) {
    const row = rawData[rowIdx];
    const excelSerial = row[0];

    if (!excelSerial || typeof excelSerial !== 'number') continue;

    const jsDate = excelDateToJSDate(excelSerial);
    const { year, quarter } = dateToYearQuarter(jsDate);

    // Create records for each fund category
    for (let catIdx = 0; catIdx < categories.length; catIdx++) {
      const category = categories[catIdx];
      const value = parseNumber(row[catIdx + 1]); // +1 because column 0 is the date

      if (value !== null) {
        allRecords.push({
          year,
          quarter,
          domicile: 'Non-HK',
          fund_category: category,
          nav_usd_million: value
        });
      }
    }
  }

  console.log(`Parsed ${allRecords.length - nonHKStart} Non-HK domiciled records`);
  console.log(`Total records to import: ${allRecords.length}`);

  // Sample records
  console.log('\nSample HK record (latest quarter):');
  const latestHK = allRecords.filter(r => r.domicile === 'HK').sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return b.quarter - a.quarter;
  })[0];
  console.log(JSON.stringify(latestHK, null, 2));

  console.log('\nSample Non-HK record (latest quarter):');
  const latestNonHK = allRecords.filter(r => r.domicile === 'Non-HK').sort((a, b) => {
    if (b.year !== a.year) return b.year - a.year;
    return b.quarter - a.quarter;
  })[0];
  console.log(JSON.stringify(latestNonHK, null, 2));

  // Clear existing data
  console.log('\n═══ Clearing Existing Data ═══');
  const { error: deleteError } = await supabase
    .from('d3_mutual_fund_nav')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

  if (deleteError) {
    console.error('Error clearing data:', deleteError);
    return;
  }
  console.log('✓ Cleared existing records');

  // Import all records
  console.log('\n═══ Importing to Supabase ═══\n');

  // Import in batches of 100
  const batchSize = 100;
  for (let i = 0; i < allRecords.length; i += batchSize) {
    const batch = allRecords.slice(i, i + batchSize);

    const { data, error } = await supabase
      .from('d3_mutual_fund_nav')
      .upsert(batch, {
        onConflict: 'year,quarter,domicile,fund_category'
      });

    if (error) {
      console.error(`Batch ${Math.floor(i / batchSize) + 1} error:`, error);
      return;
    }

    console.log(`✓ Batch ${Math.floor(i / batchSize) + 1}: Imported ${batch.length} records`);
  }

  // Verification
  console.log('\n═══ Import Complete ═══');

  const { data: verifyData, error: verifyError } = await supabase
    .from('d3_mutual_fund_nav')
    .select('*')
    .order('year', { ascending: false })
    .order('quarter', { ascending: false })
    .limit(20);

  if (verifyError) {
    console.error('Verification error:', verifyError);
    return;
  }

  console.log(`✓ Successfully imported ${allRecords.length} records`);
  console.log('\nLatest 10 records:');
  verifyData.slice(0, 10).forEach(r => {
    console.log(`  ${r.year} Q${r.quarter} | ${r.domicile.padEnd(6)} | ${r.fund_category.padEnd(25)} | US$${r.nav_usd_million?.toLocaleString()}M`);
  });

  // Summary stats
  console.log('\n═══ Summary Statistics ═══');
  const latest = verifyData.filter(r => r.year === latestHK.year && r.quarter === latestHK.quarter);

  const hkTotal = latest.find(r => r.domicile === 'HK' && r.fund_category === 'Total');
  const nonHKTotal = latest.find(r => r.domicile === 'Non-HK' && r.fund_category === 'Total');

  if (hkTotal && nonHKTotal) {
    console.log(`Latest period: ${hkTotal.year} Q${hkTotal.quarter}`);
    console.log(`HK Domiciled Total NAV: US$${hkTotal.nav_usd_million?.toLocaleString()} million`);
    console.log(`Non-HK Domiciled Total NAV: US$${nonHKTotal.nav_usd_million?.toLocaleString()} million`);
    console.log(`Combined Total NAV: US$${((hkTotal.nav_usd_million || 0) + (nonHKTotal.nav_usd_million || 0)).toLocaleString()} million`);
  }
}

// Run the import
importD3Data();
