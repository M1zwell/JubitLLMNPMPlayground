const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const filePath = 'c:\\Users\\user\\Desktop\\Oyin AM\\SFC statistics\\a01x.xlsx';

async function reimportData() {
  console.log('═══ A1 Data Re-Import (Clean & Reload) ═══\n');

  try {
    // Step 1: Delete all existing records
    console.log('Step 1: Clearing existing data...');
    const { error: deleteError } = await supabase
      .from('a1_market_highlights')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all

    if (deleteError) {
      console.error('Warning: Could not clear existing data:', deleteError.message);
    } else {
      console.log('✓ Existing data cleared\n');
    }

    // Step 2: Read Excel file
    console.log('Step 2: Reading Excel file:', filePath);
    const workbook = XLSX.readFile(filePath);
    const worksheet = workbook.Sheets[workbook.SheetNames[0]];
    const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

    console.log(`Total rows in Excel: ${rawData.length}\n`);

    // Step 3: Parse data starting from row 7
    console.log('Step 3: Parsing data...');
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
        console.log(`  Skipping year ${year} - no data`);
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

    console.log(`✓ Parsed ${records.length} annual records (${records[0].year} - ${records[records.length - 1].year})\n`);

    // Show first and last records
    console.log('First record (1997):');
    console.log(JSON.stringify(records[0], null, 2));
    console.log('\nLast record (' + records[records.length - 1].year + '):');
    console.log(JSON.stringify(records[records.length - 1], null, 2));

    // Step 4: Import to Supabase
    console.log('\n\nStep 4: Importing to Supabase...\n');

    const batchSize = 50;
    let imported = 0;
    let errors = 0;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);

      const { data, error } = await supabase
        .from('a1_market_highlights')
        .insert(batch);

      if (error) {
        console.error(`✗ Batch ${Math.floor(i / batchSize) + 1} failed:`, error.message);
        errors += batch.length;
      } else {
        imported += batch.length;
        console.log(`✓ Batch ${Math.floor(i / batchSize) + 1}: Imported ${batch.length} records`);
      }
    }

    console.log('\n═══ Import Complete ═══');
    console.log(`✓ Successfully imported: ${imported} records`);
    if (errors > 0) {
      console.log(`✗ Errors: ${errors} records`);
    }

    // Step 5: Verify
    console.log('\n═══ Verification ═══\n');

    const { data: countData, count } = await supabase
      .from('a1_market_highlights')
      .select('*', { count: 'exact', head: true })
      .eq('period_type', 'year');

    console.log(`Total annual records in database: ${count}`);

    const { data: latestData, error: latestError } = await supabase
      .from('a1_market_highlights')
      .select('year, main_listed, main_mktcap_hkbn, gem_listed, gem_mktcap_hkbn')
      .eq('period_type', 'year')
      .order('year', { ascending: false })
      .limit(5);

    if (!latestError && latestData) {
      console.log('\nLatest 5 years:');
      latestData.forEach(row => {
        console.log(`  ${row.year}: Main ${row.main_listed || 'N/A'} cos, HK$${row.main_mktcap_hkbn || 'N/A'}bn | GEM ${row.gem_listed || 'N/A'} cos, HK$${row.gem_mktcap_hkbn || 'N/A'}bn`);
      });
    }

    const { data: oldestData, error: oldestError } = await supabase
      .from('a1_market_highlights')
      .select('year, main_listed, main_mktcap_hkbn, gem_listed, gem_mktcap_hkbn')
      .eq('period_type', 'year')
      .order('year', { ascending: true })
      .limit(3);

    if (!oldestError && oldestData) {
      console.log('\nOldest 3 years:');
      oldestData.forEach(row => {
        console.log(`  ${row.year}: Main ${row.main_listed || 'N/A'} cos, HK$${row.main_mktcap_hkbn || 'N/A'}bn | GEM ${row.gem_listed || 'N/A'} cos, HK$${row.gem_mktcap_hkbn || 'N/A'}bn`);
      });
    }

    console.log('\n✅ Re-import successful!');

  } catch (error) {
    console.error('\n❌ Re-import failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the re-import
reimportData();
