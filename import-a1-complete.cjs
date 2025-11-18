const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

const filePath = 'c:\\Users\\user\\Desktop\\Oyin AM\\SFC statistics\\a01x.xlsx';

async function importCompleteData() {
  console.log('═══ A1 Complete Data Import (Annual + Quarterly) ═══\n');

  try {
    // Step 1: Clear existing data
    console.log('Step 1: Clearing existing data...');
    const { error: deleteError } = await supabase
      .from('a1_market_highlights')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');

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

    // Step 3: Parse annual data (rows 7-34)
    console.log('Step 3: Parsing annual data (1997-2024)...');
    const annualRecords = [];

    for (let i = 7; i <= 34; i++) {
      const row = rawData[i];
      if (!row || !row[0]) continue;

      const year = parseInt(row[0]);
      if (isNaN(year) || year < 1990 || year > 2030) continue;

      const hasData = row[1] || row[2] || row[3] || row[4] || row[5] || row[6] || row[7];
      if (!hasData) continue;

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

      annualRecords.push(record);
    }

    console.log(`✓ Parsed ${annualRecords.length} annual records (${annualRecords[0].year} - ${annualRecords[annualRecords.length - 1].year})\n`);

    // Step 4: Parse quarterly data
    console.log('Step 4: Parsing quarterly data...');
    const quarterlyRecords = [];

    // Helper function to extract quarter number from "Q1 第1季" format
    function extractQuarter(qLabel) {
      if (!qLabel || typeof qLabel !== 'string') return null;
      const match = qLabel.match(/Q(\d)/i);
      return match ? parseInt(match[1]) : null;
    }

    // 2023 Q1-Q4 (rows 37-40)
    const q2023Rows = [37, 38, 39, 40];
    q2023Rows.forEach(rowIdx => {
      const row = rawData[rowIdx];
      if (!row || !row[0]) return;

      const quarter = extractQuarter(row[0]);
      if (!quarter) return;

      const record = {
        period_type: 'quarter',
        year: 2023,
        quarter: quarter,
        main_listed: row[1] ? parseInt(row[1]) : null,
        main_mktcap_hkbn: row[2] ? parseFloat(row[2]) : null,
        main_turnover_hkmm: row[3] ? parseFloat(row[3]) : null,
        gem_listed: row[4] ? parseInt(row[4]) : null,
        gem_mktcap_hkbn: row[5] ? parseFloat(row[5]) : null,
        gem_turnover_hkmm: row[6] ? parseFloat(row[6]) : null,
        trading_days: row[7] ? parseInt(row[7]) : null
      };

      quarterlyRecords.push(record);
    });

    // 2024 Q1-Q4 (rows 43-46)
    const q2024Rows = [43, 44, 45, 46];
    q2024Rows.forEach(rowIdx => {
      const row = rawData[rowIdx];
      if (!row || !row[0]) return;

      const quarter = extractQuarter(row[0]);
      if (!quarter) return;

      const record = {
        period_type: 'quarter',
        year: 2024,
        quarter: quarter,
        main_listed: row[1] ? parseInt(row[1]) : null,
        main_mktcap_hkbn: row[2] ? parseFloat(row[2]) : null,
        main_turnover_hkmm: row[3] ? parseFloat(row[3]) : null,
        gem_listed: row[4] ? parseInt(row[4]) : null,
        gem_mktcap_hkbn: row[5] ? parseFloat(row[5]) : null,
        gem_turnover_hkmm: row[6] ? parseFloat(row[6]) : null,
        trading_days: row[7] ? parseInt(row[7]) : null
      };

      quarterlyRecords.push(record);
    });

    // 2025 Q1-Q3 (rows 49-51)
    const q2025Rows = [49, 50, 51];
    q2025Rows.forEach(rowIdx => {
      const row = rawData[rowIdx];
      if (!row || !row[0]) return;

      const quarter = extractQuarter(row[0]);
      if (!quarter) return;

      const record = {
        period_type: 'quarter',
        year: 2025,
        quarter: quarter,
        main_listed: row[1] ? parseInt(row[1]) : null,
        main_mktcap_hkbn: row[2] ? parseFloat(row[2]) : null,
        main_turnover_hkmm: row[3] ? parseFloat(row[3]) : null,
        gem_listed: row[4] ? parseInt(row[4]) : null,
        gem_mktcap_hkbn: row[5] ? parseFloat(row[5]) : null,
        gem_turnover_hkmm: row[6] ? parseFloat(row[6]) : null,
        trading_days: row[7] ? parseInt(row[7]) : null
      };

      quarterlyRecords.push(record);
    });

    console.log(`✓ Parsed ${quarterlyRecords.length} quarterly records\n`);
    console.log('Quarterly breakdown:');
    console.log('  2023: 4 quarters (Q1-Q4)');
    console.log('  2024: 4 quarters (Q1-Q4)');
    console.log('  2025: 3 quarters (Q1-Q3)\n');

    // Show sample quarterly records
    console.log('Sample quarterly record (2025 Q3 - latest):');
    console.log(JSON.stringify(quarterlyRecords[quarterlyRecords.length - 1], null, 2));

    // Step 5: Combine and import
    const allRecords = [...annualRecords, ...quarterlyRecords];
    console.log(`\n\nStep 5: Importing ${allRecords.length} total records to Supabase...\n`);

    const batchSize = 50;
    let imported = 0;
    let errors = 0;

    for (let i = 0; i < allRecords.length; i += batchSize) {
      const batch = allRecords.slice(i, i + batchSize);

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
    console.log(`  Annual records: ${annualRecords.length}`);
    console.log(`  Quarterly records: ${quarterlyRecords.length}`);
    if (errors > 0) {
      console.log(`✗ Errors: ${errors} records`);
    }

    // Step 6: Verify
    console.log('\n═══ Verification ═══\n');

    const { data: countAnnual, count: annualCount } = await supabase
      .from('a1_market_highlights')
      .select('*', { count: 'exact', head: true })
      .eq('period_type', 'year');

    const { data: countQuarterly, count: quarterlyCount } = await supabase
      .from('a1_market_highlights')
      .select('*', { count: 'exact', head: true })
      .eq('period_type', 'quarter');

    console.log(`Annual records in database: ${annualCount}`);
    console.log(`Quarterly records in database: ${quarterlyCount}`);
    console.log(`Total records: ${(annualCount || 0) + (quarterlyCount || 0)}\n`);

    // Latest annual record
    const { data: latestAnnual } = await supabase
      .from('a1_market_highlights')
      .select('year, main_listed, main_mktcap_hkbn, gem_listed, gem_mktcap_hkbn')
      .eq('period_type', 'year')
      .order('year', { ascending: false })
      .limit(1)
      .single();

    if (latestAnnual) {
      console.log(`Latest annual (${latestAnnual.year}):`);
      console.log(`  Main: ${latestAnnual.main_listed} cos, HK$${latestAnnual.main_mktcap_hkbn}bn`);
      console.log(`  GEM: ${latestAnnual.gem_listed} cos, HK$${latestAnnual.gem_mktcap_hkbn}bn\n`);
    }

    // Latest quarterly records
    const { data: latestQuarters } = await supabase
      .from('a1_market_highlights')
      .select('year, quarter, main_listed, main_mktcap_hkbn, gem_listed, gem_mktcap_hkbn')
      .eq('period_type', 'quarter')
      .order('year', { ascending: false })
      .order('quarter', { ascending: false })
      .limit(3);

    if (latestQuarters && latestQuarters.length > 0) {
      console.log('Latest quarterly records:');
      latestQuarters.forEach(q => {
        console.log(`  ${q.year} Q${q.quarter}: Main ${q.main_listed} cos, HK$${q.main_mktcap_hkbn}bn | GEM ${q.gem_listed} cos, HK$${q.gem_mktcap_hkbn}bn`);
      });
    }

    console.log('\n✅ Complete import successful with annual + quarterly data!');

  } catch (error) {
    console.error('\n❌ Import failed:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

// Run the import
importCompleteData();
