const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const filePath = 'c:\\Users\\user\\Desktop\\Oyin AM\\SFC statistics\\a01x.xlsx';

async function importData() {
  console.log('═══ A1 Data Import ═══\n');
  console.log('Reading Excel file:', filePath, '\n');

  try {
    // Read Excel file
  const workbook = XLSX.readFile(filePath);
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

  console.log(`Total rows in Excel: ${rawData.length}`);

  // Parse data starting from row 7 (0-indexed row 7 = row 8 in Excel)
  // Columns: Year, Main Listed, Main Mkt Cap, Main Turnover, GEM Listed, GEM Mkt Cap, GEM Turnover, Trading Days
  const records = [];

  for (let i = 7; i < rawData.length; i++) {
    const row = rawData[i];

    // Skip empty rows
    if (!row || !row[0]) continue;

    const year = parseInt(row[0]);
    if (isNaN(year) || year < 1990 || year > 2030) continue;

    // Skip rows where all data columns are null/empty (except year)
    const hasData = row[1] || row[2] || row[3] || row[4] || row[5] || row[6] || row[7];
    if (!hasData) {
      console.log(`Skipping year ${year} - no data`);
      continue;
    }

    const record = {
      period_type: 'year',
      year: year,
      quarter: null,
      main_listed: row[1] ? parseInt(row[1]) : null,
      main_mktcap_hkbn: row[2] ? parseFloat(row[2]) : null,
      main_turnover_hkmm: row[3] ? parseFloat(row[3]) : null,
      gem_listed: (row[4] && row[4] !== 'n.a.' && row[4] !== 'n.a') ? parseInt(row[4]) : null,
      gem_mktcap_hkbn: (row[5] && row[5] !== 'n.a.' && row[5] !== 'n.a') ? parseFloat(row[5]) : null,
      gem_turnover_hkmm: (row[6] && row[6] !== 'n.a.' && row[6] !== 'n.a') ? parseFloat(row[6]) : null,
      trading_days: row[7] ? parseInt(row[7]) : null
    };

    records.push(record);
  }

  console.log(`Parsed ${records.length} annual records (${records[0].year} - ${records[records.length - 1].year})\n`);

  // Show sample
  console.log('Sample record (1997):');
  console.log(JSON.stringify(records[0], null, 2));
  console.log('\nSample record (latest):');
  console.log(JSON.stringify(records[records.length - 1], null, 2));

  console.log('\n═══ Importing to Supabase ═══\n');

  // Import in batches of 100
  const batchSize = 100;
  let imported = 0;
  let errors = 0;

  for (let i = 0; i < records.length; i += batchSize) {
    const batch = records.slice(i, i + batchSize);

    const { data, error } = await supabase
      .from('a1_market_highlights')
      .upsert(batch, {
        onConflict: 'period_type,year,quarter',
        ignoreDuplicates: false
      });

    if (error) {
      console.error(`✗ Batch ${i / batchSize + 1} failed:`, error.message);
      errors += batch.length;
    } else {
      imported += batch.length;
      console.log(`✓ Batch ${i / batchSize + 1}: Imported ${batch.length} records`);
    }
  }

  console.log('\n═══ Import Complete ═══');
  console.log(`✓ Successfully imported: ${imported} records`);
  if (errors > 0) {
    console.log(`✗ Errors: ${errors} records`);
  }

  // Verify
  console.log('\n═══ Verification ═══\n');

  const { data: count, error: countError } = await supabase
    .from('a1_market_highlights')
    .select('*', { count: 'exact', head: true })
    .eq('period_type', 'year');

  if (!countError) {
    console.log(`Total annual records in database: ${count}`);
  }

  const { data: latestData, error: latestError } = await supabase
    .from('a1_market_highlights')
    .select('year, main_listed, main_mktcap_hkbn, gem_listed, gem_mktcap_hkbn')
    .eq('period_type', 'year')
    .order('year', { ascending: false })
    .limit(3);

  if (!latestError && latestData) {
    console.log('\nLatest 3 years:');
    latestData.forEach(row => {
      console.log(`  ${row.year}: Main ${row.main_listed} cos, HK$${row.main_mktcap_hkbn}bn | GEM ${row.gem_listed || 'N/A'} cos, HK$${row.gem_mktcap_hkbn || 'N/A'}bn`);
    });
  }

  console.log('\n✅ Import successful!');

  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the import
importData();
