const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');
const path = require('path');

// Supabase client
const supabase = createClient(
  'https://kiztaihzanqnrcrqaxsv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8'
);

// Excel file path
const filePath = path.join('c:', 'Users', 'user', 'Desktop', 'Oyin AM', 'SFC statistics', 'a02x.xlsx');

// Helper function to extract quarter number from "Q1 第1季" format
function extractQuarter(qLabel) {
  if (!qLabel || typeof qLabel !== 'string') return null;
  const match = qLabel.match(/Q(\d)/i);
  return match ? parseInt(match[1]) : null;
}

// Helper function to check if value is valid number
function parseNumber(val) {
  if (val === null || val === undefined || val === '' || val === 'n.a.') return null;
  const num = typeof val === 'number' ? val : parseFloat(val);
  return isNaN(num) ? null : num;
}

async function importA2Data() {
  console.log('═══ A2 Data Import ═══\n');
  console.log('Reading Excel file:', filePath);

  // Read Excel file
  const workbook = XLSX.readFile(filePath);
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

  console.log('Total rows in Excel:', rawData.length);

  // Parse annual data (rows 6-33: years 1997-2024)
  const annualRecords = [];

  for (let rowIdx = 6; rowIdx <= 33; rowIdx++) {
    const row = rawData[rowIdx];
    const year = row[0];

    if (!year || typeof year !== 'number') continue;

    // Main Board records
    const mainTotal = parseNumber(row[1]);
    const mainHSI = parseNumber(row[2]);
    const mainNonH = parseNumber(row[3]);
    const mainHShares = parseNumber(row[4]);

    // GEM records
    const gemTotal = parseNumber(row[5]);
    const gemNonH = parseNumber(row[6]);
    const gemHShares = parseNumber(row[7]);

    // Create records for this year
    const yearRecords = [];

    // Main Board - Total
    if (mainTotal !== null) {
      yearRecords.push({
        period_type: 'year',
        year: year,
        quarter: null,
        board: 'Main',
        stock_type: 'Total',
        mktcap_hkbn: mainTotal
      });
    }

    // Main Board - HSI Constituents
    if (mainHSI !== null) {
      yearRecords.push({
        period_type: 'year',
        year: year,
        quarter: null,
        board: 'Main',
        stock_type: 'HSI_constituents',
        mktcap_hkbn: mainHSI
      });
    }

    // Main Board - Non-H Mainland
    if (mainNonH !== null) {
      yearRecords.push({
        period_type: 'year',
        year: year,
        quarter: null,
        board: 'Main',
        stock_type: 'nonH_mainland',
        mktcap_hkbn: mainNonH
      });
    }

    // Main Board - H-shares
    if (mainHShares !== null) {
      yearRecords.push({
        period_type: 'year',
        year: year,
        quarter: null,
        board: 'Main',
        stock_type: 'H_shares',
        mktcap_hkbn: mainHShares
      });
    }

    // GEM - Total
    if (gemTotal !== null) {
      yearRecords.push({
        period_type: 'year',
        year: year,
        quarter: null,
        board: 'GEM',
        stock_type: 'Total',
        mktcap_hkbn: gemTotal
      });
    }

    // GEM - Non-H Mainland
    if (gemNonH !== null) {
      yearRecords.push({
        period_type: 'year',
        year: year,
        quarter: null,
        board: 'GEM',
        stock_type: 'nonH_mainland',
        mktcap_hkbn: gemNonH
      });
    }

    // GEM - H-shares
    if (gemHShares !== null) {
      yearRecords.push({
        period_type: 'year',
        year: year,
        quarter: null,
        board: 'GEM',
        stock_type: 'H_shares',
        mktcap_hkbn: gemHShares
      });
    }

    annualRecords.push(...yearRecords);
  }

  console.log(`\nParsed ${annualRecords.length} annual records`);

  // Parse quarterly data
  const quarterlyRecords = [];

  // 2023 Q1-Q4 (rows 36-39)
  const q2023Rows = [36, 37, 38, 39];
  q2023Rows.forEach(rowIdx => {
    const row = rawData[rowIdx];
    const quarter = extractQuarter(row[0]);
    if (!quarter) return;

    const records = [];

    // Main Board records
    const mainTotal = parseNumber(row[1]);
    const mainHSI = parseNumber(row[2]);
    const mainNonH = parseNumber(row[3]);
    const mainHShares = parseNumber(row[4]);

    if (mainTotal !== null) records.push({ period_type: 'quarter', year: 2023, quarter, board: 'Main', stock_type: 'Total', mktcap_hkbn: mainTotal });
    if (mainHSI !== null) records.push({ period_type: 'quarter', year: 2023, quarter, board: 'Main', stock_type: 'HSI_constituents', mktcap_hkbn: mainHSI });
    if (mainNonH !== null) records.push({ period_type: 'quarter', year: 2023, quarter, board: 'Main', stock_type: 'nonH_mainland', mktcap_hkbn: mainNonH });
    if (mainHShares !== null) records.push({ period_type: 'quarter', year: 2023, quarter, board: 'Main', stock_type: 'H_shares', mktcap_hkbn: mainHShares });

    // GEM records
    const gemTotal = parseNumber(row[5]);
    const gemNonH = parseNumber(row[6]);
    const gemHShares = parseNumber(row[7]);

    if (gemTotal !== null) records.push({ period_type: 'quarter', year: 2023, quarter, board: 'GEM', stock_type: 'Total', mktcap_hkbn: gemTotal });
    if (gemNonH !== null) records.push({ period_type: 'quarter', year: 2023, quarter, board: 'GEM', stock_type: 'nonH_mainland', mktcap_hkbn: gemNonH });
    if (gemHShares !== null) records.push({ period_type: 'quarter', year: 2023, quarter, board: 'GEM', stock_type: 'H_shares', mktcap_hkbn: gemHShares });

    quarterlyRecords.push(...records);
  });

  // 2024 Q1-Q4 (rows 42-45)
  const q2024Rows = [42, 43, 44, 45];
  q2024Rows.forEach(rowIdx => {
    const row = rawData[rowIdx];
    const quarter = extractQuarter(row[0]);
    if (!quarter) return;

    const records = [];

    // Main Board records
    const mainTotal = parseNumber(row[1]);
    const mainHSI = parseNumber(row[2]);
    const mainNonH = parseNumber(row[3]);
    const mainHShares = parseNumber(row[4]);

    if (mainTotal !== null) records.push({ period_type: 'quarter', year: 2024, quarter, board: 'Main', stock_type: 'Total', mktcap_hkbn: mainTotal });
    if (mainHSI !== null) records.push({ period_type: 'quarter', year: 2024, quarter, board: 'Main', stock_type: 'HSI_constituents', mktcap_hkbn: mainHSI });
    if (mainNonH !== null) records.push({ period_type: 'quarter', year: 2024, quarter, board: 'Main', stock_type: 'nonH_mainland', mktcap_hkbn: mainNonH });
    if (mainHShares !== null) records.push({ period_type: 'quarter', year: 2024, quarter, board: 'Main', stock_type: 'H_shares', mktcap_hkbn: mainHShares });

    // GEM records
    const gemTotal = parseNumber(row[5]);
    const gemNonH = parseNumber(row[6]);
    const gemHShares = parseNumber(row[7]);

    if (gemTotal !== null) records.push({ period_type: 'quarter', year: 2024, quarter, board: 'GEM', stock_type: 'Total', mktcap_hkbn: gemTotal });
    if (gemNonH !== null) records.push({ period_type: 'quarter', year: 2024, quarter, board: 'GEM', stock_type: 'nonH_mainland', mktcap_hkbn: gemNonH });
    if (gemHShares !== null) records.push({ period_type: 'quarter', year: 2024, quarter, board: 'GEM', stock_type: 'H_shares', mktcap_hkbn: gemHShares });

    quarterlyRecords.push(...records);
  });

  // 2025 Q1-Q3 (rows 48-50)
  const q2025Rows = [48, 49, 50];
  q2025Rows.forEach(rowIdx => {
    const row = rawData[rowIdx];
    const quarter = extractQuarter(row[0]);
    if (!quarter) return;

    const records = [];

    // Main Board records
    const mainTotal = parseNumber(row[1]);
    const mainHSI = parseNumber(row[2]);
    const mainNonH = parseNumber(row[3]);
    const mainHShares = parseNumber(row[4]);

    if (mainTotal !== null) records.push({ period_type: 'quarter', year: 2025, quarter, board: 'Main', stock_type: 'Total', mktcap_hkbn: mainTotal });
    if (mainHSI !== null) records.push({ period_type: 'quarter', year: 2025, quarter, board: 'Main', stock_type: 'HSI_constituents', mktcap_hkbn: mainHSI });
    if (mainNonH !== null) records.push({ period_type: 'quarter', year: 2025, quarter, board: 'Main', stock_type: 'nonH_mainland', mktcap_hkbn: mainNonH });
    if (mainHShares !== null) records.push({ period_type: 'quarter', year: 2025, quarter, board: 'Main', stock_type: 'H_shares', mktcap_hkbn: mainHShares });

    // GEM records
    const gemTotal = parseNumber(row[5]);
    const gemNonH = parseNumber(row[6]);
    const gemHShares = parseNumber(row[7]);

    if (gemTotal !== null) records.push({ period_type: 'quarter', year: 2025, quarter, board: 'GEM', stock_type: 'Total', mktcap_hkbn: gemTotal });
    if (gemNonH !== null) records.push({ period_type: 'quarter', year: 2025, quarter, board: 'GEM', stock_type: 'nonH_mainland', mktcap_hkbn: gemNonH });
    if (gemHShares !== null) records.push({ period_type: 'quarter', year: 2025, quarter, board: 'GEM', stock_type: 'H_shares', mktcap_hkbn: gemHShares });

    quarterlyRecords.push(...records);
  });

  console.log(`Parsed ${quarterlyRecords.length} quarterly records`);
  console.log(`Total records to import: ${annualRecords.length + quarterlyRecords.length}`);

  // Sample records
  console.log('\nSample annual record (1997):');
  console.log(JSON.stringify(annualRecords.find(r => r.year === 1997 && r.board === 'Main' && r.stock_type === 'Total'), null, 2));

  console.log('\nSample quarterly record (2025 Q3):');
  console.log(JSON.stringify(quarterlyRecords.find(r => r.year === 2025 && r.quarter === 3 && r.board === 'Main' && r.stock_type === 'Total'), null, 2));

  // Clear existing data
  console.log('\n═══ Clearing Existing Data ═══');
  const { error: deleteError } = await supabase
    .from('a2_mktcap_by_stock_type')
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
      .from('a2_mktcap_by_stock_type')
      .upsert(batch, {
        onConflict: 'period_type,year,quarter,board,stock_type'
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
    .from('a2_mktcap_by_stock_type')
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
    console.log(`  ${period} | ${r.board.padEnd(4)} | ${r.stock_type.padEnd(18)} | HK$${r.mktcap_hkbn} bn`);
  });

  // Summary by period type
  const { data: annualCount } = await supabase
    .from('a2_mktcap_by_stock_type')
    .select('id', { count: 'exact', head: true })
    .eq('period_type', 'year');

  const { data: quarterlyCount } = await supabase
    .from('a2_mktcap_by_stock_type')
    .select('id', { count: 'exact', head: true })
    .eq('period_type', 'quarter');

  console.log('\nData Summary:');
  console.log(`  Annual records: ${annualCount}`);
  console.log(`  Quarterly records: ${quarterlyCount}`);
}

// Run the import
importA2Data();
