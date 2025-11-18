const { createClient } = require('@supabase/supabase-js');
const XLSX = require('xlsx');
const path = require('path');

// Supabase setup
const supabaseUrl = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';
const supabase = createClient(supabaseUrl, supabaseKey);

// Excel file path
const filePath = path.join('c:', 'Users', 'user', 'Desktop', 'Oyin AM', 'SFC statistics', 'd04x.xlsx');

console.log('═══ D4 Fund Flows Import ═══\n');
console.log('File:', filePath);

// Read Excel file
const workbook = XLSX.readFile(filePath);
const sheet = workbook.Sheets[workbook.SheetNames[0]]; // "Annual net fund flows"
const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

// Parse number from string or number (handles "-", commas, etc.)
function parseNumber(val) {
  if (val === null || val === undefined || val === '' || val === '-' || val === 'n.a.') {
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

// Map Excel columns to fund_type
const fundTypeMap = [
  'Bond',                // Column 1
  'Equity',              // Column 2
  'Mixed',               // Column 3
  'MoneyMarket',         // Column 4
  'Feeder',              // Column 5
  'FundOfFunds',         // Column 6
  'Index',               // Column 7
  'Guaranteed',          // Column 8
  'CommodityVirtual',    // Column 9
  'OtherSpecialised',    // Column 10
  'Total'                // Column 11
];

const allRecords = [];

console.log('\n═══ Parsing Annual Net Fund Flows (Rows 6-12) ═══\n');

// Data rows: 6-12 (2025*, 2024, 2023, 2022, 2021, 2020, 2019)
for (let rowIdx = 6; rowIdx <= 12; rowIdx++) {
  const row = rawData[rowIdx];
  if (!row || !row[0]) continue;

  // Parse year from column 0
  let year;
  if (typeof row[0] === 'number') {
    year = row[0];
  } else if (typeof row[0] === 'string') {
    // Handle "2025 (up to nine months ended 30.09.2025)" or "20211"
    const match = row[0].match(/(\d{4})/);
    if (match) {
      year = parseInt(match[1]);
    } else {
      console.warn(`Could not parse year from: ${row[0]}`);
      continue;
    }
  } else {
    continue;
  }

  console.log(`Row ${rowIdx}: Year ${year}`);

  // Create record for each fund type
  for (let catIdx = 0; catIdx < fundTypeMap.length; catIdx++) {
    const fundType = fundTypeMap[catIdx];
    const flowValue = parseNumber(row[catIdx + 1]);

    allRecords.push({
      year: year,
      domicile: 'HK',
      fund_type: fundType,
      net_flow_usd_mn: flowValue
    });
  }
}

console.log(`\nParsed ${allRecords.length} records`);

// Sample records
console.log('\n═══ Sample Records ═══');
console.log('First record (2025 Bond):', JSON.stringify(allRecords[0], null, 2));
console.log('Latest Total flow:', JSON.stringify(allRecords.find(r => r.year === 2025 && r.fund_type === 'Total'), null, 2));

// Summary by year
console.log('\n═══ Summary by Year ═══');
const yearMap = new Map();

allRecords.forEach(rec => {
  if (rec.fund_type === 'Total') {
    yearMap.set(rec.year, rec.net_flow_usd_mn || 0);
  }
});

Array.from(yearMap.entries())
  .sort((a, b) => b[0] - a[0]) // Sort by year desc
  .forEach(([year, total]) => {
    const sign = total >= 0 ? '+' : '';
    console.log(`  ${year}: ${sign}$${total.toLocaleString()} million (${total >= 0 ? 'Net Inflow' : 'Net Outflow'})`);
  });

// Import to Supabase
console.log('\n═══ Importing to Supabase ═══\n');

async function importRecords() {
  const batchSize = 50;
  let imported = 0;
  let errors = 0;

  for (let i = 0; i < allRecords.length; i += batchSize) {
    const batch = allRecords.slice(i, i + batchSize);

    const { data, error } = await supabase
      .from('d4_fund_flows_by_type')
      .upsert(batch, { onConflict: 'year,domicile,fund_type' });

    if (error) {
      console.error(`Batch ${Math.floor(i / batchSize) + 1} error:`, JSON.stringify(error, null, 2));
      errors++;
    } else {
      imported += batch.length;
      console.log(`Batch ${Math.floor(i / batchSize) + 1}: Imported ${batch.length} records (${imported}/${allRecords.length})`);
    }
  }

  console.log(`\n═══ Import Complete ═══`);
  console.log(`Successfully imported: ${imported} records`);
  console.log(`Errors: ${errors}`);

  // Verify import
  const { data: verifyData, count } = await supabase
    .from('d4_fund_flows_by_type')
    .select('*', { count: 'exact', head: false });

  if (verifyData) {
    console.log(`\nTotal records in database: ${verifyData.length}`);
  }
}

importRecords().catch(console.error);
