// Import D3 Excel data to Supabase
const XLSX = require('xlsx');
const { createClient } = require('@supabase/supabase-js');

const excelPath = 'c:\\Users\\user\\Desktop\\Oyin AM\\SFC statistics\\d03x.xlsx';

// Supabase connection
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

const supabase = createClient(supabaseUrl, supabaseKey);

// Convert Excel serial date to JavaScript Date
function excelDateToJSDate(excelDate) {
  const epoch = new Date(1899, 11, 30); // Excel epoch (Dec 30, 1899)
  const jsDate = new Date(epoch.getTime() + excelDate * 24 * 60 * 60 * 1000);
  return jsDate;
}

// Format date as YYYY-MM-DD
function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Parse value, handle 'n.a.' and numbers with commas
function parseValue(val) {
  if (val === 'n.a.' || val === null || val === undefined || val === '') {
    return null;
  }
  if (typeof val === 'string') {
    // Remove commas and parse
    const cleaned = val.replace(/,/g, '');
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? null : parsed;
  }
  return typeof val === 'number' ? val : null;
}

async function importD3Data() {
  console.log('Reading Excel file:', excelPath);

  try {
    const workbook = XLSX.readFile(excelPath);

    // Process Sheet 1: Table D3a & Table D3b
    console.log('\n=== Processing Sheet 1: Table D3a & Table D3b ===');
    const sheet1 = workbook.Sheets['Table D3a & Table D3b'];
    const data1 = XLSX.utils.sheet_to_json(sheet1, { header: 1 });

    // Find where D3b starts (look for a row that contains "Table D3b" or "Non-Hong Kong")
    let d3bStartRow = -1;
    for (let i = 0; i < data1.length; i++) {
      const row = data1[i];
      if (row && row[0] && typeof row[0] === 'string') {
        if (row[0].includes('D3b') || row[0].includes('Non-Hong Kong')) {
          d3bStartRow = i;
          console.log(`Found D3b start at row ${i}: ${row[0]}`);
          break;
        }
      }
    }

    // Parse D3a (HK domiciled) - rows 4 onwards until D3b starts
    console.log('\n--- Parsing D3a (HK domiciled) ---');
    const d3aData = [];
    const d3aHeaderRow = 2; // Row index 2 has English headers
    const d3aHeaders = data1[d3aHeaderRow];
    console.log('D3a Headers:', d3aHeaders);

    const d3aEndRow = d3bStartRow > 0 ? d3bStartRow : data1.length;
    for (let i = 4; i < d3aEndRow; i++) {
      const row = data1[i];
      if (!row || row.length < 2) continue;

      const dateValue = row[0];
      if (typeof dateValue !== 'number') continue; // Skip non-date rows

      const asAtDate = formatDate(excelDateToJSDate(dateValue));

      // Map columns to fund types
      const record = {
        as_at_date: asAtDate,
        domicile: 'HK',
        Bond: parseValue(row[1]),
        Equity: parseValue(row[2]),
        Mixed: parseValue(row[3]),
        MoneyMarket: parseValue(row[4]),
        Feeder: parseValue(row[5]),
        Index: parseValue(row[6]),
        Guaranteed: parseValue(row[7]),
        Hedge: parseValue(row[8]),
        CommodityVirtual: parseValue(row[9]),
        Total: parseValue(row[10])
      };

      d3aData.push(record);
    }

    console.log(`Parsed ${d3aData.length} rows for D3a`);
    if (d3aData.length > 0) {
      console.log('Sample D3a record:', d3aData[0]);
      console.log('Latest D3a record:', d3aData[d3aData.length - 1]);
    }

    // Parse D3b (Non-HK domiciled) if exists
    let d3bData = [];
    if (d3bStartRow > 0) {
      console.log('\n--- Parsing D3b (Non-HK domiciled) ---');
      const d3bHeaderRow = d3bStartRow + 2; // Headers should be 2 rows after title
      const d3bHeaders = data1[d3bHeaderRow];
      console.log('D3b Headers:', d3bHeaders);

      for (let i = d3bHeaderRow + 2; i < data1.length; i++) {
        const row = data1[i];
        if (!row || row.length < 2) continue;

        const dateValue = row[0];
        if (typeof dateValue !== 'number') continue;

        const asAtDate = formatDate(excelDateToJSDate(dateValue));

        const record = {
          as_at_date: asAtDate,
          domicile: 'NonHK',
          Bond: parseValue(row[1]),
          Equity: parseValue(row[2]),
          Mixed: parseValue(row[3]),
          MoneyMarket: parseValue(row[4]),
          Feeder: parseValue(row[5]),
          Index: parseValue(row[6]),
          Guaranteed: parseValue(row[7]),
          Hedge: parseValue(row[8]),
          CommodityVirtual: parseValue(row[9]),
          Total: parseValue(row[10])
        };

        d3bData.push(record);
      }

      console.log(`Parsed ${d3bData.length} rows for D3b`);
      if (d3bData.length > 0) {
        console.log('Sample D3b record:', d3bData[0]);
        console.log('Latest D3b record:', d3bData[d3bData.length - 1]);
      }
    }

    // Process Sheet 2: Table D3c
    console.log('\n=== Processing Sheet 2: Table D3c (All SFC-authorised) ===');
    const sheet2 = workbook.Sheets['Table D3c'];
    const data2 = XLSX.utils.sheet_to_json(sheet2, { header: 1 });

    const d3cData = [];
    const d3cHeaderRow = 2;
    const d3cHeaders = data2[d3cHeaderRow];
    console.log('D3c Headers:', d3cHeaders);

    for (let i = 4; i < data2.length; i++) {
      const row = data2[i];
      if (!row || row.length < 2) continue;

      const dateValue = row[0];
      if (typeof dateValue !== 'number') continue;

      const asAtDate = formatDate(excelDateToJSDate(dateValue));

      const record = {
        as_at_date: asAtDate,
        domicile: 'All',
        Bond: parseValue(row[1]),
        Equity: parseValue(row[2]),
        Mixed: parseValue(row[3]),
        MoneyMarket: parseValue(row[4]),
        Feeder: parseValue(row[5]), // Fund of Funds maps to Feeder
        // Warrant is row[6] but we don't have that in schema - skip it
        Index: parseValue(row[7]),
        Guaranteed: parseValue(row[8]),
        Hedge: parseValue(row[9]),
        OtherSpecialised: parseValue(row[10]),
        Total: parseValue(row[11])
      };

      d3cData.push(record);
    }

    console.log(`Parsed ${d3cData.length} rows for D3c`);
    if (d3cData.length > 0) {
      console.log('Sample D3c record:', d3cData[0]);
      console.log('Latest D3c record:', d3cData[d3cData.length - 1]);
    }

    // Combine all data
    const allData = [...d3aData, ...d3bData, ...d3cData];
    console.log(`\nTotal records to insert: ${allData.length}`);

    // Transform to database format
    const dbRecords = [];
    for (const record of allData) {
      const { as_at_date, domicile, ...fundTypes } = record;

      for (const [fundType, nav_usd_mn] of Object.entries(fundTypes)) {
        if (nav_usd_mn !== null) {
          dbRecords.push({
            as_at_date,
            domicile,
            fund_type: fundType,
            nav_usd_mn
          });
        }
      }
    }

    console.log(`\nTransformed to ${dbRecords.length} database records`);

    // Insert into Supabase (upsert to handle duplicates)
    console.log('\n=== Inserting into Supabase ===');
    const batchSize = 100;
    let inserted = 0;

    for (let i = 0; i < dbRecords.length; i += batchSize) {
      const batch = dbRecords.slice(i, i + batchSize);

      const { data, error } = await supabase
        .from('d3_fund_nav_by_type')
        .upsert(batch, {
          onConflict: 'as_at_date,domicile,fund_type'
        });

      if (error) {
        console.error(`Error inserting batch ${i / batchSize + 1}:`, error);
        throw error;
      }

      inserted += batch.length;
      console.log(`Inserted batch ${i / batchSize + 1}: ${inserted} / ${dbRecords.length} records`);
    }

    console.log(`\n✅ Successfully inserted ${inserted} records!`);

    // Verify latest data
    const { data: latestData, error: fetchError } = await supabase
      .from('d3_fund_nav_by_type')
      .select('*')
      .order('as_at_date', { ascending: false })
      .limit(10);

    if (!fetchError && latestData) {
      console.log('\n=== Latest 10 records in database ===');
      latestData.forEach(record => {
        console.log(`${record.as_at_date} | ${record.domicile} | ${record.fund_type}: $${record.nav_usd_mn}M`);
      });
    }

  } catch (error) {
    console.error('Error during import:', error);
    process.exit(1);
  }
}

importD3Data();
