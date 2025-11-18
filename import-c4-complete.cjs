const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Supabase client
const supabase = createClient(
  'https://kiztaihzanqnrcrqaxsv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8'
);

// Excel file path
const filePath = path.join('c:', 'Users', 'user', 'Desktop', 'Oyin AM', 'SFC statistics', 'c04x.xlsx');

// Helper function to parse quarter from "03/2023" format
function parseQuarterLabel(label) {
  if (!label || typeof label !== 'string') return null;

  const match = label.match(/^(\d{2})\/(\d{4})$/);
  if (!match) return null;

  const month = parseInt(match[1]);
  const year = parseInt(match[2]);

  // Convert month to quarter
  const quarter = Math.ceil(month / 3);

  return { year, quarter };
}

// Helper function to check if value is valid number
function parseNumber(val) {
  if (val === null || val === undefined || val === '' || val === 'n.a.') return null;
  const num = typeof val === 'number' ? val : parseFloat(val);
  return isNaN(num) ? null : num;
}

async function importC4Data() {
  console.log('═══ C4 Data Import ═══\n');
  console.log('Reading Excel file:', filePath);

  // Read Excel file
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

  console.log('Total rows in Excel:', rawData.length);

  // Parse annual data (rows 5-26: years 2003-2024)
  const annualRecords = [];

  for (let rowIdx = 5; rowIdx <= 26; rowIdx++) {
    const row = rawData[rowIdx];
    const year = row[0];

    if (!year || typeof year !== 'number') continue;

    const record = {
      period_type: 'year',
      year: year,
      quarter: null,
      ra1: parseNumber(row[1]),
      ra2: parseNumber(row[2]),
      ra3: parseNumber(row[3]),
      ra4: parseNumber(row[4]),
      ra5: parseNumber(row[5]),
      ra6: parseNumber(row[6]),
      ra7: parseNumber(row[7]),
      ra8: parseNumber(row[8]),
      ra9: parseNumber(row[9]),
      ra10: parseNumber(row[10]),
      ra13: parseNumber(row[11]),
      lr_total: parseNumber(row[12])
    };

    annualRecords.push(record);
  }

  console.log(`\nParsed ${annualRecords.length} annual records`);

  // Parse quarterly data
  const quarterlyRecords = [];

  // 2023 Q1-Q4 (rows 29-32)
  const q2023Rows = [29, 30, 31, 32];
  q2023Rows.forEach(rowIdx => {
    const row = rawData[rowIdx];
    const parsed = parseQuarterLabel(row[0]);
    if (!parsed) return;

    const record = {
      period_type: 'quarter',
      year: parsed.year,
      quarter: parsed.quarter,
      ra1: parseNumber(row[1]),
      ra2: parseNumber(row[2]),
      ra3: parseNumber(row[3]),
      ra4: parseNumber(row[4]),
      ra5: parseNumber(row[5]),
      ra6: parseNumber(row[6]),
      ra7: parseNumber(row[7]),
      ra8: parseNumber(row[8]),
      ra9: parseNumber(row[9]),
      ra10: parseNumber(row[10]),
      ra13: parseNumber(row[11]),
      lr_total: parseNumber(row[12])
    };

    quarterlyRecords.push(record);
  });

  // 2024 Q1-Q4 (rows 35-38)
  const q2024Rows = [35, 36, 37, 38];
  q2024Rows.forEach(rowIdx => {
    const row = rawData[rowIdx];
    const parsed = parseQuarterLabel(row[0]);
    if (!parsed) return;

    const record = {
      period_type: 'quarter',
      year: parsed.year,
      quarter: parsed.quarter,
      ra1: parseNumber(row[1]),
      ra2: parseNumber(row[2]),
      ra3: parseNumber(row[3]),
      ra4: parseNumber(row[4]),
      ra5: parseNumber(row[5]),
      ra6: parseNumber(row[6]),
      ra7: parseNumber(row[7]),
      ra8: parseNumber(row[8]),
      ra9: parseNumber(row[9]),
      ra10: parseNumber(row[10]),
      ra13: parseNumber(row[11]),
      lr_total: parseNumber(row[12])
    };

    quarterlyRecords.push(record);
  });

  // 2025 Q1-Q3 (rows 41-43)
  const q2025Rows = [41, 42, 43];
  q2025Rows.forEach(rowIdx => {
    const row = rawData[rowIdx];
    const parsed = parseQuarterLabel(row[0]);
    if (!parsed) return;

    const record = {
      period_type: 'quarter',
      year: parsed.year,
      quarter: parsed.quarter,
      ra1: parseNumber(row[1]),
      ra2: parseNumber(row[2]),
      ra3: parseNumber(row[3]),
      ra4: parseNumber(row[4]),
      ra5: parseNumber(row[5]),
      ra6: parseNumber(row[6]),
      ra7: parseNumber(row[7]),
      ra8: parseNumber(row[8]),
      ra9: parseNumber(row[9]),
      ra10: parseNumber(row[10]),
      ra13: parseNumber(row[11]),
      lr_total: parseNumber(row[12])
    };

    quarterlyRecords.push(record);
  });

  console.log(`Parsed ${quarterlyRecords.length} quarterly records`);
  console.log(`Total records to import: ${annualRecords.length + quarterlyRecords.length}`);

  // Sample records
  console.log('\nSample annual record (2003):');
  console.log(JSON.stringify(annualRecords.find(r => r.year === 2003), null, 2));

  console.log('\nSample quarterly record (2025 Q3):');
  console.log(JSON.stringify(quarterlyRecords.find(r => r.year === 2025 && r.quarter === 3), null, 2));

  // Clear existing data
  console.log('\n═══ Clearing Existing Data ═══');
  const { error: deleteError } = await supabase
    .from('c4_lr_regulated_activities')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all records

  if (deleteError) {
    console.error('Error clearing data:', deleteError);
    return;
  }
  console.log('✓ Cleared existing records');

  // Import all records
  console.log('\n═══ Importing to Supabase ═══\n');

  const allRecords = [...annualRecords, ...quarterlyRecords];

  // Import in batches of 100
  const batchSize = 100;
  for (let i = 0; i < allRecords.length; i += batchSize) {
    const batch = allRecords.slice(i, i + batchSize);

    const { data, error } = await supabase
      .from('c4_lr_regulated_activities')
      .upsert(batch, {
        onConflict: 'period_type,year,quarter'
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
    .from('c4_lr_regulated_activities')
    .select('*')
    .order('year', { ascending: false })
    .order('quarter', { ascending: false })
    .limit(10);

  if (verifyError) {
    console.error('Verification error:', verifyError);
    return;
  }

  console.log(`✓ Successfully imported ${allRecords.length} records`);
  console.log('\nLatest 5 records (2025 Q3):');
  verifyData.slice(0, 5).forEach(r => {
    const period = r.quarter ? `${r.year} Q${r.quarter}` : r.year;
    console.log(`  ${period} | RA1: ${r.ra1} | RA4: ${r.ra4} | RA9: ${r.ra9} | Total: ${r.lr_total}`);
  });

  // Summary stats
  console.log('\n═══ Summary Statistics ═══');
  const latest = verifyData[0];
  console.log(`Latest period: ${latest.quarter ? `${latest.year} Q${latest.quarter}` : latest.year}`);
  console.log(`Total Licensed Representatives: ${latest.lr_total?.toLocaleString()}`);
  console.log(`Top 3 Regulated Activities:`);

  const ras = [
    { name: 'RA1 (Dealing in securities)', count: latest.ra1 },
    { name: 'RA2 (Dealing in futures)', count: latest.ra2 },
    { name: 'RA3 (Leveraged FX)', count: latest.ra3 },
    { name: 'RA4 (Advising on securities)', count: latest.ra4 },
    { name: 'RA5 (Advising on futures)', count: latest.ra5 },
    { name: 'RA6 (Corporate finance)', count: latest.ra6 },
    { name: 'RA7 (Automated trading)', count: latest.ra7 },
    { name: 'RA8 (Securities margin)', count: latest.ra8 },
    { name: 'RA9 (Asset management)', count: latest.ra9 },
    { name: 'RA10 (Credit rating)', count: latest.ra10 },
    { name: 'RA13 (OTC derivatives)', count: latest.ra13 }
  ].filter(ra => ra.count > 0).sort((a, b) => b.count - a.count);

  ras.slice(0, 3).forEach((ra, idx) => {
    console.log(`  ${idx + 1}. ${ra.name}: ${ra.count?.toLocaleString()}`);
  });
}

// Run the import
importC4Data();
