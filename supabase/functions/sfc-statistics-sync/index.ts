/**
 * SFC Statistics Sync Edge Function
 * Downloads and parses XLSX files from SFC website
 * Populates sfc_statistics_* tables with quarterly data
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import * as XLSX from 'https://esm.sh/xlsx@0.18.5';

// CORS headers - inlined for standalone deployment
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// SFC Statistics XLSX URLs
const STATISTICS_TABLES = {
  'A1': {
    url: 'https://www.sfc.hk/-/media/EN/files/SOM/MarketStatistics/a01x.xlsx',
    table: 'sfc_market_highlights',
    parser: parseTableA1
  },
  'A2': {
    url: 'https://www.sfc.hk/-/media/EN/files/SOM/MarketStatistics/a02x.xlsx',
    table: 'sfc_market_cap_by_type',
    parser: parseTableA2
  },
  'A3': {
    url: 'https://www.sfc.hk/-/media/EN/files/SOM/MarketStatistics/a03x.xlsx',
    table: 'sfc_turnover_by_type',
    parser: parseTableA3
  },
  'C4': {
    url: 'https://www.sfc.hk/-/media/EN/files/SOM/MarketStatistics/c04x.xlsx',
    table: 'sfc_licensed_representatives',
    parser: parseTableC4
  },
  'C5': {
    url: 'https://www.sfc.hk/-/media/EN/files/SOM/MarketStatistics/c05x.xlsx',
    table: 'sfc_responsible_officers',
    parser: parseTableC5
  },
  'D3': {
    url: 'https://www.sfc.hk/-/media/EN/files/SOM/MarketStatistics/d03x.xlsx',
    table: 'sfc_mutual_fund_nav',
    parser: parseTableD3
  },
  'D4': {
    url: 'https://www.sfc.hk/-/media/EN/files/SOM/MarketStatistics/d04x.xlsx',
    table: 'sfc_fund_flows',
    parser: parseTableD4
  }
};

interface Stats {
  tablesProcessed: number;
  totalRecords: number;
  errors: string[];
  byTable: Record<string, { records: number; status: string }>;
}

/**
 * Download XLSX file and parse to workbook
 */
async function downloadXLSX(url: string): Promise<XLSX.WorkBook | null> {
  try {
    console.log(`Downloading: ${url}`);
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    const workbook = XLSX.read(data, { type: 'array' });

    console.log(`Downloaded successfully. Sheets: ${workbook.SheetNames.join(', ')}`);
    return workbook;
  } catch (error) {
    console.error(`Error downloading ${url}:`, error);
    return null;
  }
}

/**
 * Parse Table A1: Highlights of Hong Kong Stock Market
 */
function parseTableA1(workbook: XLSX.WorkBook): any[] {
  const records: any[] = [];
  const sheetName = workbook.SheetNames[0]; // First sheet
  const sheet = workbook.Sheets[sheetName];
  const data: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  // Find data rows (skip headers)
  // Expected format: Period | Market Cap | Turnover | Listings | New Listings | Funds Raised
  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 3) continue;

    // Parse period (e.g., "2024-Q1", "2024-09")
    const period = String(row[0] || '').trim();
    if (!period || period.toLowerCase().includes('total') || period.toLowerCase().includes('year')) continue;

    // Determine period type
    let periodType = 'monthly';
    if (period.includes('Q')) periodType = 'quarterly';
    if (period.match(/^\d{4}$/)) periodType = 'annual';

    records.push({
      period,
      period_type: periodType,
      market_cap: parseFloat(row[1]) || null,
      turnover: parseFloat(row[2]) || null,
      total_listings: parseInt(row[3]) || null,
      new_listings: parseInt(row[4]) || null,
      funds_raised: parseFloat(row[5]) || null,
      main_board_cap: parseFloat(row[6]) || null,
      gem_cap: parseFloat(row[7]) || null
    });
  }

  return records;
}

/**
 * Parse Table A2: Market Capitalisation by Stock Type
 */
function parseTableA2(workbook: XLSX.WorkBook): any[] {
  const records: any[] = [];
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  let currentPeriod = '';
  let currentPeriodType = 'quarterly';

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 2) continue;

    // Check if this row defines a period
    const firstCol = String(row[0] || '').trim();
    if (firstCol.match(/^\d{4}-Q\d$/) || firstCol.match(/^\d{4}-\d{2}$/)) {
      currentPeriod = firstCol;
      currentPeriodType = firstCol.includes('Q') ? 'quarterly' : 'monthly';
      continue;
    }

    // Parse stock type rows
    if (currentPeriod && firstCol && !firstCol.toLowerCase().includes('total')) {
      records.push({
        period: currentPeriod,
        period_type: currentPeriodType,
        stock_type: firstCol,
        market_cap: parseFloat(row[1]) || null,
        percentage: parseFloat(row[2]) || null,
        number_of_companies: parseInt(row[3]) || null
      });
    }
  }

  return records;
}

/**
 * Parse Table A3: Average Daily Turnover by Stock Type
 */
function parseTableA3(workbook: XLSX.WorkBook): any[] {
  const records: any[] = [];
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  let currentPeriod = '';
  let currentPeriodType = 'quarterly';

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 2) continue;

    const firstCol = String(row[0] || '').trim();
    if (firstCol.match(/^\d{4}-Q\d$/) || firstCol.match(/^\d{4}-\d{2}$/)) {
      currentPeriod = firstCol;
      currentPeriodType = firstCol.includes('Q') ? 'quarterly' : 'monthly';
      continue;
    }

    if (currentPeriod && firstCol && !firstCol.toLowerCase().includes('total')) {
      records.push({
        period: currentPeriod,
        period_type: currentPeriodType,
        stock_type: firstCol,
        avg_daily_turnover: parseFloat(row[1]) || null,
        percentage: parseFloat(row[2]) || null
      });
    }
  }

  return records;
}

/**
 * Parse Table C4: Licensed Representatives
 */
function parseTableC4(workbook: XLSX.WorkBook): any[] {
  const records: any[] = [];
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  let currentPeriod = '';
  let currentPeriodType = 'monthly';

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 2) continue;

    const firstCol = String(row[0] || '').trim();
    if (firstCol.match(/^\d{4}-\d{2}$/)) {
      currentPeriod = firstCol;
      currentPeriodType = 'monthly';
      continue;
    }

    // Activity types: RA1-RA10
    if (currentPeriod && firstCol.match(/^RA\d{1,2}$/i)) {
      records.push({
        period: currentPeriod,
        period_type: currentPeriodType,
        activity_type: firstCol.toUpperCase(),
        count: parseInt(row[1]) || 0,
        yoy_change: parseFloat(row[2]) || null,
        yoy_percentage: parseFloat(row[3]) || null
      });
    }
  }

  return records;
}

/**
 * Parse Table C5: Responsible Officers
 */
function parseTableC5(workbook: XLSX.WorkBook): any[] {
  const records: any[] = [];
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  let currentPeriod = '';
  let currentPeriodType = 'monthly';

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 2) continue;

    const firstCol = String(row[0] || '').trim();
    if (firstCol.match(/^\d{4}-\d{2}$/)) {
      currentPeriod = firstCol;
      currentPeriodType = 'monthly';
      continue;
    }

    if (currentPeriod && firstCol.match(/^RA\d{1,2}$/i)) {
      records.push({
        period: currentPeriod,
        period_type: currentPeriodType,
        activity_type: firstCol.toUpperCase(),
        count: parseInt(row[1]) || 0,
        yoy_change: parseFloat(row[2]) || null,
        yoy_percentage: parseFloat(row[3]) || null
      });
    }
  }

  return records;
}

/**
 * Parse Table D3: Mutual Fund NAV
 */
function parseTableD3(workbook: XLSX.WorkBook): any[] {
  const records: any[] = [];
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  let currentPeriod = '';
  let currentPeriodType = 'quarterly';

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 2) continue;

    const firstCol = String(row[0] || '').trim();
    if (firstCol.match(/^\d{4}-Q\d$/)) {
      currentPeriod = firstCol;
      currentPeriodType = 'quarterly';
      continue;
    }

    // Fund categories: Equity, Bond, Mixed, Money Market, etc.
    if (currentPeriod && firstCol && !firstCol.toLowerCase().includes('total')) {
      records.push({
        period: currentPeriod,
        period_type: currentPeriodType,
        fund_category: firstCol,
        nav: parseFloat(row[1]) || null,
        number_of_funds: parseInt(row[2]) || null,
        percentage: parseFloat(row[3]) || null
      });
    }
  }

  return records;
}

/**
 * Parse Table D4: Fund Flows
 */
function parseTableD4(workbook: XLSX.WorkBook): any[] {
  const records: any[] = [];
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const data: any[] = XLSX.utils.sheet_to_json(sheet, { header: 1 });

  let currentPeriod = '';
  let currentPeriodType = 'quarterly';

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    if (!row || row.length < 3) continue;

    const firstCol = String(row[0] || '').trim();
    if (firstCol.match(/^\d{4}-Q\d$/)) {
      currentPeriod = firstCol;
      currentPeriodType = 'quarterly';
      continue;
    }

    if (currentPeriod && firstCol && !firstCol.toLowerCase().includes('total')) {
      records.push({
        period: currentPeriod,
        period_type: currentPeriodType,
        fund_category: firstCol,
        subscriptions: parseFloat(row[1]) || null,
        redemptions: parseFloat(row[2]) || null,
        net_flow: parseFloat(row[3]) || null
      });
    }
  }

  return records;
}

/**
 * Insert records into database table
 */
async function insertRecords(tableName: string, records: any[]): Promise<{ success: number; errors: number }> {
  if (records.length === 0) {
    console.log(`No records to insert for ${tableName}`);
    return { success: 0, errors: 0 };
  }

  console.log(`Inserting ${records.length} records into ${tableName}...`);

  let success = 0;
  let errors = 0;

  // Insert in batches of 50
  const BATCH_SIZE = 50;
  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);

    try {
      const { error } = await supabaseAdmin
        .from(tableName)
        .upsert(batch, {
          onConflict: tableName.includes('market_highlights')
            ? 'period,period_type'
            : tableName.includes('by_type')
            ? 'period,period_type,stock_type'
            : tableName.includes('licensed_representatives') || tableName.includes('responsible_officers')
            ? 'period,period_type,activity_type'
            : tableName.includes('fund')
            ? 'period,period_type,fund_category'
            : 'period,period_type'
        });

      if (error) {
        console.error(`Batch ${i / BATCH_SIZE + 1} error:`, error.message);
        errors += batch.length;
      } else {
        success += batch.length;
        console.log(`✓ Batch ${i / BATCH_SIZE + 1}: ${batch.length} records`);
      }
    } catch (err) {
      console.error(`Batch ${i / BATCH_SIZE + 1} exception:`, err);
      errors += batch.length;
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`Inserted ${success} records, ${errors} errors for ${tableName}`);
  return { success, errors };
}

/**
 * Main handler
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { tables } = await req.json().catch(() => ({ tables: null }));
    const tablesToSync = tables || Object.keys(STATISTICS_TABLES);

    console.log('Starting SFC Statistics Sync...');
    console.log(`Tables to sync: ${tablesToSync.join(', ')}`);

    const stats: Stats = {
      tablesProcessed: 0,
      totalRecords: 0,
      errors: [],
      byTable: {}
    };

    // Process each table
    for (const tableId of tablesToSync) {
      if (!STATISTICS_TABLES[tableId]) {
        stats.errors.push(`Unknown table: ${tableId}`);
        continue;
      }

      const config = STATISTICS_TABLES[tableId];
      console.log(`\n=== Processing Table ${tableId} ===`);

      // Download XLSX
      const workbook = await downloadXLSX(config.url);
      if (!workbook) {
        stats.errors.push(`Failed to download ${tableId}`);
        stats.byTable[tableId] = { records: 0, status: 'download_failed' };
        continue;
      }

      // Parse data
      let records: any[] = [];
      try {
        records = config.parser(workbook);
        console.log(`Parsed ${records.length} records from ${tableId}`);
      } catch (error) {
        console.error(`Parsing error for ${tableId}:`, error);
        stats.errors.push(`Parse error ${tableId}: ${error.message}`);
        stats.byTable[tableId] = { records: 0, status: 'parse_failed' };
        continue;
      }

      // Insert into database
      const result = await insertRecords(config.table, records);
      stats.tablesProcessed++;
      stats.totalRecords += result.success;
      stats.byTable[tableId] = {
        records: result.success,
        status: result.errors > 0 ? 'partial_success' : 'success'
      };

      if (result.errors > 0) {
        stats.errors.push(`${tableId}: ${result.errors} insert errors`);
      }

      // Rate limiting between tables
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Update metadata table
    try {
      const { error: metaError } = await supabaseAdmin
        .from('sfc_statistics_metadata')
        .upsert({
          table_id: 'ALL',
          last_sync: new Date().toISOString(),
          sync_status: stats.errors.length > 0 ? 'partial' : 'success',
          records_synced: stats.totalRecords,
          notes: stats.errors.length > 0 ? stats.errors.join('; ') : 'Sync completed successfully'
        }, { onConflict: 'table_id' });

      if (metaError) {
        console.error('Metadata update error:', metaError);
      }
    } catch (err) {
      console.error('Metadata exception:', err);
    }

    console.log('\n=== Sync Complete ===');
    console.log(`Tables processed: ${stats.tablesProcessed}`);
    console.log(`Total records: ${stats.totalRecords}`);
    console.log(`Errors: ${stats.errors.length}`);

    return new Response(
      JSON.stringify({
        success: true,
        stats
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    );
  }
});
