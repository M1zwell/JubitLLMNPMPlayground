/**
 * SFC Financial Statistics Scraper
 * Downloads and parses XLSX files from SFC statistics page
 */

import XLSX from 'xlsx';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// SFC Statistics URLs (from the website)
const STATISTICS_URLS = {
  'A1': {
    title: 'Highlights of the Hong Kong Stock Market',
    url: 'https://www.sfc.hk/-/media/EN/files/SOM/MarketStatistics/a01x.xlsx',
    table: 'sfc_market_highlights'
  },
  'A2': {
    title: 'Market Capitalisation by Stock Type',
    url: 'https://www.sfc.hk/-/media/EN/files/SOM/MarketStatistics/a02x.xlsx',
    table: 'sfc_market_cap_by_type'
  },
  'A3': {
    title: 'Average Daily Turnover by Stock Type',
    url: 'https://www.sfc.hk/-/media/EN/files/SOM/MarketStatistics/a03x.xlsx',
    table: 'sfc_turnover_by_type'
  },
  'C4': {
    title: 'Number of Regulated Activities of Licensed Representatives',
    url: 'https://www.sfc.hk/-/media/EN/files/SOM/MarketStatistics/c04x.xlsx',
    table: 'sfc_licensed_representatives'
  },
  'C5': {
    title: 'Number of Regulated Activities of Responsible/Approved Officers',
    url: 'https://www.sfc.hk/-/media/EN/files/SOM/MarketStatistics/c05x.xlsx',
    table: 'sfc_responsible_officers'
  },
  'D3': {
    title: 'Net Asset Value of Authorised Unit Trusts and Mutual Funds',
    url: 'https://www.sfc.hk/-/media/EN/files/SOM/MarketStatistics/d03x.xlsx',
    table: 'sfc_mutual_fund_nav'
  }
};

/**
 * Download XLSX file from URL
 */
async function downloadXLSX(url) {
  console.log(`📥 Downloading: ${url}`);
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Failed to download: ${response.statusText}`);
  }
  const buffer = await response.arrayBuffer();
  return Buffer.from(buffer);
}

/**
 * Parse XLSX file and convert to JSON
 */
function parseXLSX(buffer) {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const result = {};

  workbook.SheetNames.forEach(sheetName => {
    const worksheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(worksheet, {
      header: 1,
      defval: null,
      blankrows: false
    });
    result[sheetName] = jsonData;
  });

  return result;
}

/**
 * Extract period information from data
 */
function extractPeriod(data) {
  // Look for period indicators in the first few rows
  const firstRows = data.slice(0, 10);

  for (const row of firstRows) {
    const rowStr = row.join(' ').toLowerCase();

    // Check for quarterly data like "Q3 2025"
    const quarterMatch = rowStr.match(/q(\d)\s*(\d{4})/i);
    if (quarterMatch) {
      return {
        quarter: parseInt(quarterMatch[1]),
        year: parseInt(quarterMatch[2]),
        period: `Q${quarterMatch[1]} ${quarterMatch[2]}`,
        period_type: 'quarterly'
      };
    }

    // Check for year like "2025"
    const yearMatch = rowStr.match(/(\d{4})/);
    if (yearMatch) {
      return {
        year: parseInt(yearMatch[1]),
        period: yearMatch[1],
        period_type: 'yearly'
      };
    }
  }

  // Default to current year Q3 2025 (from website)
  return {
    quarter: 3,
    year: 2025,
    period: 'Q3 2025',
    period_type: 'quarterly'
  };
}

/**
 * Parse Table A1 - Market Highlights
 */
async function parseTableA1(data, fileUrl) {
  console.log('📊 Parsing Table A1 - Market Highlights');

  const sheetData = data[Object.keys(data)[0]]; // Get first sheet
  const periodInfo = extractPeriod(sheetData);

  // Store raw data
  const { error: rawError } = await supabase
    .from('sfc_statistics_raw')
    .upsert({
      table_name: 'A1',
      table_title: STATISTICS_URLS['A1'].title,
      file_url: fileUrl,
      data: sheetData,
      ...periodInfo
    }, {
      onConflict: 'table_name,period,year,quarter'
    });

  if (rawError) {
    console.error('Error storing raw data:', rawError);
  } else {
    console.log('✅ Table A1 raw data stored');
  }

  return { success: true, rows: sheetData.length };
}

/**
 * Parse Table A2 - Market Cap by Type
 */
async function parseTableA2(data, fileUrl) {
  console.log('📊 Parsing Table A2 - Market Capitalisation');

  const sheetData = data[Object.keys(data)[0]];
  const periodInfo = extractPeriod(sheetData);

  const { error: rawError } = await supabase
    .from('sfc_statistics_raw')
    .upsert({
      table_name: 'A2',
      table_title: STATISTICS_URLS['A2'].title,
      file_url: fileUrl,
      data: sheetData,
      ...periodInfo
    }, {
      onConflict: 'table_name,period,year,quarter'
    });

  if (rawError) {
    console.error('Error storing raw data:', rawError);
  } else {
    console.log('✅ Table A2 raw data stored');
  }

  return { success: true, rows: sheetData.length };
}

/**
 * Parse Table A3 - Turnover by Type
 */
async function parseTableA3(data, fileUrl) {
  console.log('📊 Parsing Table A3 - Average Daily Turnover');

  const sheetData = data[Object.keys(data)[0]];
  const periodInfo = extractPeriod(sheetData);

  const { error: rawError } = await supabase
    .from('sfc_statistics_raw')
    .upsert({
      table_name: 'A3',
      table_title: STATISTICS_URLS['A3'].title,
      file_url: fileUrl,
      data: sheetData,
      ...periodInfo
    }, {
      onConflict: 'table_name,period,year,quarter'
    });

  if (rawError) {
    console.error('Error storing raw data:', rawError);
  } else {
    console.log('✅ Table A3 raw data stored');
  }

  return { success: true, rows: sheetData.length };
}

/**
 * Parse Table C4 - Licensed Representatives
 */
async function parseTableC4(data, fileUrl) {
  console.log('📊 Parsing Table C4 - Licensed Representatives');

  const sheetData = data[Object.keys(data)[0]];
  const periodInfo = extractPeriod(sheetData);

  const { error: rawError } = await supabase
    .from('sfc_statistics_raw')
    .upsert({
      table_name: 'C4',
      table_title: STATISTICS_URLS['C4'].title,
      file_url: fileUrl,
      data: sheetData,
      ...periodInfo
    }, {
      onConflict: 'table_name,period,year,quarter'
    });

  if (rawError) {
    console.error('Error storing raw data:', rawError);
  } else {
    console.log('✅ Table C4 raw data stored');
  }

  return { success: true, rows: sheetData.length };
}

/**
 * Parse Table C5 - Responsible Officers
 */
async function parseTableC5(data, fileUrl) {
  console.log('📊 Parsing Table C5 - Responsible Officers');

  const sheetData = data[Object.keys(data)[0]];
  const periodInfo = extractPeriod(sheetData);

  const { error: rawError } = await supabase
    .from('sfc_statistics_raw')
    .upsert({
      table_name: 'C5',
      table_title: STATISTICS_URLS['C5'].title,
      file_url: fileUrl,
      data: sheetData,
      ...periodInfo
    }, {
      onConflict: 'table_name,period,year,quarter'
    });

  if (rawError) {
    console.error('Error storing raw data:', rawError);
  } else {
    console.log('✅ Table C5 raw data stored');
  }

  return { success: true, rows: sheetData.length };
}

/**
 * Parse Table D3 - Mutual Fund NAV
 */
async function parseTableD3(data, fileUrl) {
  console.log('📊 Parsing Table D3 - Mutual Fund NAV');

  const sheetData = data[Object.keys(data)[0]];
  const periodInfo = extractPeriod(sheetData);

  const { error: rawError } = await supabase
    .from('sfc_statistics_raw')
    .upsert({
      table_name: 'D3',
      table_title: STATISTICS_URLS['D3'].title,
      file_url: fileUrl,
      data: sheetData,
      ...periodInfo
    }, {
      onConflict: 'table_name,period,year,quarter'
    });

  if (rawError) {
    console.error('Error storing raw data:', rawError);
  } else {
    console.log('✅ Table D3 raw data stored');
  }

  return { success: true, rows: sheetData.length };
}

/**
 * Scrape a single table
 */
async function scrapeTable(tableId) {
  const tableInfo = STATISTICS_URLS[tableId];

  if (!tableInfo) {
    console.error(`❌ Unknown table: ${tableId}`);
    return { success: false, error: 'Unknown table' };
  }

  console.log(`\n${'='.repeat(70)}`);
  console.log(`📋 Scraping ${tableId}: ${tableInfo.title}`);
  console.log('='.repeat(70));

  try {
    // Download XLSX file
    const buffer = await downloadXLSX(tableInfo.url);

    // Parse XLSX
    const parsedData = parseXLSX(buffer);
    console.log(`✅ Parsed ${Object.keys(parsedData).length} sheet(s)`);

    // Parse and store based on table type
    let result;
    switch (tableId) {
      case 'A1':
        result = await parseTableA1(parsedData, tableInfo.url);
        break;
      case 'A2':
        result = await parseTableA2(parsedData, tableInfo.url);
        break;
      case 'A3':
        result = await parseTableA3(parsedData, tableInfo.url);
        break;
      case 'C4':
        result = await parseTableC4(parsedData, tableInfo.url);
        break;
      case 'C5':
        result = await parseTableC5(parsedData, tableInfo.url);
        break;
      case 'D3':
        result = await parseTableD3(parsedData, tableInfo.url);
        break;
      default:
        throw new Error('Unknown table parser');
    }

    console.log(`✅ ${tableId} completed: ${result.rows} rows processed`);
    return { success: true, tableId, ...result };

  } catch (error) {
    console.error(`❌ Error scraping ${tableId}:`, error.message);
    return { success: false, tableId, error: error.message };
  }
}

/**
 * Scrape all tables
 */
async function scrapeAll() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 SFC Financial Statistics Scraper');
  console.log('='.repeat(70));
  console.log(`📋 Tables to scrape: ${Object.keys(STATISTICS_URLS).length}`);
  console.log('='.repeat(70));

  const results = [];

  for (const tableId of Object.keys(STATISTICS_URLS)) {
    const result = await scrapeTable(tableId);
    results.push(result);

    // Small delay between tables
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Summary
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log('\n' + '='.repeat(70));
  console.log('📊 SCRAPING COMPLETE');
  console.log('='.repeat(70));
  console.log(`✅ Successful: ${successful}/${results.length}`);
  console.log(`❌ Failed: ${failed}/${results.length}`);
  console.log('='.repeat(70));

  return results;
}

// Run scraper
const tablesToScrape = process.argv.slice(2);

if (tablesToScrape.length === 0) {
  // Scrape all tables
  scrapeAll().then(results => {
    const hasErrors = results.some(r => !r.success);
    process.exit(hasErrors ? 1 : 0);
  }).catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
} else {
  // Scrape specific tables
  Promise.all(tablesToScrape.map(id => scrapeTable(id)))
    .then(results => {
      const hasErrors = results.some(r => !r.success);
      process.exit(hasErrors ? 1 : 0);
    })
    .catch(error => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}
