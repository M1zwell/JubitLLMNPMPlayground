const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const path = require('path');

// Supabase setup
const supabaseUrl = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';
const supabase = createClient(supabaseUrl, supabaseKey);

// Excel file path
const filePath = path.join('c:', 'Users', 'user', 'Desktop', 'Oyin AM', 'SFC statistics', 'd03x.xlsx');

console.log('═══ D3 Fund NAV by Type Import ═══\n');
console.log('File:', filePath);

// Read Excel file
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets[workbook.SheetNames[0]]; // "Table D3a & Table D3b"
const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

// Convert Excel serial date to JavaScript Date
function excelDateToJSDate(serial) {
  const utc_days = Math.floor(serial - 25569);
  const utc_value = utc_days * 86400;
  const date_info = new Date(utc_value * 1000);
  return new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate());
}

// Parse number from string or number (handles commas and quotes)
function parseNumber(val) {
  if (val === null || val === undefined || val === '' || val === 'n.a.') {
    return null;
  }
  if (typeof val === 'number') {
    return val;
  }
  if (typeof val === 'string') {
    // Remove commas and quotes
    const cleaned = val.replace(/[,"]/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }
  return null;
}

// Map Excel column to fund_type
const fundTypeMap = [
  'Bond',                    // Column 1
  'Equity',                  // Column 2
  'Mixed',                   // Column 3
  'MoneyMarket',             // Column 4
  'Feeder',                  // Column 5
  'Index',                   // Column 6
  'Guaranteed',              // Column 7
  'Hedge',                   // Column 8
  'CommodityVirtual',        // Column 9
  'Total'                    // Column 10
];

const allRecords = [];

console.log('\n═══ Parsing D3a - HK Domiciled (Rows 4-23) ═══\n');

// D3a: HK domiciled (rows 4-23)
for (let rowIdx = 4; rowIdx <= 23; rowIdx++) {
  const row = rawData[rowIdx];
  if (!row || !row[0]) continue;

  const excelDate = row[0];
  const jsDate = excelDateToJSDate(excelDate);
  const dateStr = jsDate.toISOString().split('T')[0]; // YYYY-MM-DD format

  console.log(`Row ${rowIdx}: ${dateStr} (Excel: ${excelDate})`);

  // Create record for each fund type
  for (let catIdx = 0; catIdx < fundTypeMap.length; catIdx++) {
    const fundType = fundTypeMap[catIdx];
    const navValue = parseNumber(row[catIdx + 1]);

    allRecords.push({
      as_at_date: dateStr,
      domicile: 'HK',
      fund_type: fundType,
      nav_usd_mn: navValue
    });
  }
}

console.log(`\nParsed ${allRecords.length} HK records`);

console.log('\n═══ Parsing D3b - Non-HK Domiciled (Rows 29-48) ═══\n');

// D3b: Non-HK domiciled (rows 29-48)
const nonHKStartIdx = allRecords.length;

for (let rowIdx = 29; rowIdx <= 48; rowIdx++) {
  const row = rawData[rowIdx];
  if (!row || !row[0]) continue;

  const excelDate = row[0];
  const jsDate = excelDateToJSDate(excelDate);
  const dateStr = jsDate.toISOString().split('T')[0];

  console.log(`Row ${rowIdx}: ${dateStr} (Excel: ${excelDate})`);

  // Create record for each fund type (column structure same as D3a)
  for (let catIdx = 0; catIdx < fundTypeMap.length; catIdx++) {
    const fundType = fundTypeMap[catIdx];
    const navValue = parseNumber(row[catIdx + 1]);

    allRecords.push({
      as_at_date: dateStr,
      domicile: 'NonHK',
      fund_type: fundType,
      nav_usd_mn: navValue
    });
  }
}

console.log(`\nParsed ${allRecords.length - nonHKStartIdx} Non-HK records`);

// Compute 'All' domicile (HK + NonHK) for each date and fund_type
console.log('\n═══ Computing All Domicile (HK + NonHK) ═══\n');

// Group by date and fund_type
const dateMap = new Map();

allRecords.forEach(rec => {
  const key = `${rec.as_at_date}|${rec.fund_type}`;
  if (!dateMap.has(key)) {
    dateMap.set(key, { hk: null, nonhk: null });
  }
  const entry = dateMap.get(key);
  if (rec.domicile === 'HK') {
    entry.hk = rec.nav_usd_mn;
  } else {
    entry.nonhk = rec.nav_usd_mn;
  }
});

const allDomicileRecords = [];
dateMap.forEach((value, key) => {
  const [date, fundType] = key.split('|');
  const totalNav = (value.hk || 0) + (value.nonhk || 0);

  allDomicileRecords.push({
    as_at_date: date,
    domicile: 'All',
    fund_type: fundType,
    nav_usd_mn: totalNav > 0 ? totalNav : null
  });
});

console.log(`Computed ${allDomicileRecords.length} All domicile records`);

// Combine all records
const finalRecords = [...allRecords, ...allDomicileRecords];

console.log(`\n═══ Summary ═══`);
console.log(`Total records to import: ${finalRecords.length}`);
console.log(`  HK domiciled: ${allRecords.filter(r => r.domicile === 'HK').length}`);
console.log(`  Non-HK domiciled: ${allRecords.filter(r => r.domicile === 'NonHK').length}`);
console.log(`  All domiciled: ${allDomicileRecords.length}`);

// Sample records
console.log('\n═══ Sample Records ═══');
console.log('First HK record:', JSON.stringify(finalRecords.find(r => r.domicile === 'HK'), null, 2));
console.log('First Non-HK record:', JSON.stringify(finalRecords.find(r => r.domicile === 'NonHK'), null, 2));
console.log('First All record:', JSON.stringify(finalRecords.find(r => r.domicile === 'All'), null, 2));

// Latest quarter summary
const latestDate = finalRecords.reduce((max, r) => r.as_at_date > max ? r.as_at_date : max, '');
const latestRecords = finalRecords.filter(r => r.as_at_date === latestDate);
console.log(`\n═══ Latest Quarter (${latestDate}) ═══`);
const latestHKTotal = latestRecords.find(r => r.domicile === 'HK' && r.fund_type === 'Total');
const latestNonHKTotal = latestRecords.find(r => r.domicile === 'NonHK' && r.fund_type === 'Total');
const latestAllTotal = latestRecords.find(r => r.domicile === 'All' && r.fund_type === 'Total');
console.log(`HK Total NAV: $${latestHKTotal?.nav_usd_mn?.toLocaleString()} million`);
console.log(`Non-HK Total NAV: $${latestNonHKTotal?.nav_usd_mn?.toLocaleString()} million`);
console.log(`All Total NAV: $${latestAllTotal?.nav_usd_mn?.toLocaleString()} million`);

// Import to Supabase
console.log('\n═══ Importing to Supabase ═══\n');

async function importRecords() {
  // Import in batches of 100
  const batchSize = 100;
  let imported = 0;
  let errors = 0;

  for (let i = 0; i < finalRecords.length; i += batchSize) {
    const batch = finalRecords.slice(i, i + batchSize);

    const { data, error } = await supabase
      .from('d3_fund_nav_by_type')
      .upsert(batch, { onConflict: 'as_at_date,domicile,fund_type' });

    if (error) {
      console.error(`Batch ${Math.floor(i / batchSize) + 1} error:`, JSON.stringify(error, null, 2));
      errors++;
    } else {
      imported += batch.length;
      console.log(`Batch ${Math.floor(i / batchSize) + 1}: Imported ${batch.length} records (${imported}/${finalRecords.length})`);
    }
  }

  console.log(`\n═══ Import Complete ═══`);
  console.log(`Successfully imported: ${imported} records`);
  console.log(`Errors: ${errors}`);

  // Verify import
  const { data: verifyData, error: verifyError } = await supabase
    .from('d3_fund_nav_by_type')
    .select('*', { count: 'exact', head: true });

  if (!verifyError) {
    console.log(`\nTotal records in database: ${verifyData?.length || 0}`);
  }
}

importRecords().catch(console.error);
