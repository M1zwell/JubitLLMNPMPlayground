/**
 * CCASS Shareholding Scraper (Standalone)
 * Purpose: Scrape HKEX CCASS shareholding data for stock codes
 * Deployment: Can be deployed via Supabase Dashboard (no _shared imports)
 *
 * Endpoint: POST /functions/v1/ccass-scraper
 * Body: {
 *   stock_codes: string | string[],  // Single code "00700" or array ["00700", "09988"]
 *   date_from?: string,              // YYYY-MM-DD format (max 100 days back)
 *   date_to?: string,                // YYYY-MM-DD format (default: today)
 *   latest_only?: boolean,           // Only fetch latest available day
 *   limit?: number,                  // Max participants per stock per day
 *   test_mode?: boolean,
 *   job_id?: string
 * }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHash } from 'https://deno.land/std@0.177.0/node/crypto.ts';

// CORS headers (inlined for standalone deployment)
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
};

// Max date range limit
const MAX_DAYS_RANGE = 100;

// Types
interface CCASSShareholder {
  participant_id: string;
  participant_name: string;
  address?: string;
  shareholding: number;
  percentage: number;
  scraped_date: string; // The date the data represents
  scraped_at: string;   // When we scraped it
}

interface ScraperRequest {
  stock_codes: string | string[];
  date_from?: string;
  date_to?: string;
  latest_only?: boolean;
  limit?: number;
  test_mode?: boolean;
  job_id?: string;
}

// Helper to update job status
async function updateJobStatus(
  supabase: any,
  jobId: string | null | undefined,
  status: 'running' | 'completed' | 'failed',
  recordsProcessed?: number,
  errorMessage?: string
) {
  if (!jobId) return;

  const update: any = {
    status,
    updated_at: new Date().toISOString(),
  };

  if (status === 'running') {
    update.started_at = new Date().toISOString();
  } else if (status === 'completed' || status === 'failed') {
    update.completed_at = new Date().toISOString();
    if (recordsProcessed !== undefined) update.records_processed = recordsProcessed;
    if (errorMessage) update.error_message = errorMessage;
  }

  await supabase.from('scraping_jobs').update(update).eq('id', jobId);
}

// Generate content hash for deduplication
function generateContentHash(...values: string[]): string {
  const hash = createHash('sha256');
  hash.update(values.join('||'));
  return hash.digest('hex');
}

// Parse and validate stock codes
function parseStockCodes(input: string | string[]): string[] {
  if (Array.isArray(input)) {
    return input.map(c => c.trim().padStart(5, '0'));
  }
  // Handle comma-separated string
  return input.split(',').map(c => c.trim().padStart(5, '0')).filter(c => c.length === 5);
}

// Generate date range array
function generateDateRange(dateFrom: string, dateTo: string): string[] {
  const dates: string[] = [];
  const start = new Date(dateFrom);
  const end = new Date(dateTo);

  // Enforce max range
  const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  if (daysDiff > MAX_DAYS_RANGE) {
    throw new Error(`Date range exceeds maximum of ${MAX_DAYS_RANGE} days`);
  }

  const current = new Date(start);
  while (current <= end) {
    // Skip weekends (CCASS doesn't have weekend data)
    const day = current.getDay();
    if (day !== 0 && day !== 6) {
      dates.push(current.toISOString().split('T')[0]);
    }
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

// Format date for CCASS (DD/MM/YYYY)
function formatDateForCCASS(dateStr: string): string {
  const [year, month, day] = dateStr.split('-');
  return `${day}/${month}/${year}`;
}

// Generate mock data for testing
function generateMockCCASSData(stockCode: string, date: string, count: number): CCASSShareholder[] {
  const mockData: CCASSShareholder[] = [];
  const now = new Date().toISOString();

  const participants = [
    { id: 'B01274', name: 'HSBC SECURITIES SERVICES (ASIA) LIMITED', pct: 15.5 },
    { id: 'C00039', name: 'CITIBANK N.A.', pct: 12.3 },
    { id: 'B01111', name: 'BOCI SECURITIES LIMITED', pct: 8.7 },
    { id: 'C00010', name: 'CHINA SECURITIES DEPOSITORY AND CLEARING CORPORATION LIMITED', pct: 6.2 },
    { id: 'B01424', name: 'STANDARD CHARTERED BANK (HONG KONG) LIMITED', pct: 4.8 },
    { id: 'B01161', name: 'BANK OF CHINA (HONG KONG) LIMITED', pct: 3.9 },
    { id: 'C00019', name: 'J.P. MORGAN SECURITIES LLC', pct: 3.2 },
    { id: 'B01224', name: 'MORGAN STANLEY HONG KONG SECURITIES LIMITED', pct: 2.8 },
  ];

  for (let i = 0; i < Math.min(count, participants.length); i++) {
    const p = participants[i];
    mockData.push({
      participant_id: p.id,
      participant_name: p.name,
      address: `Hong Kong Office ${i + 1}`,
      shareholding: Math.floor(Math.random() * 100000000) + 1000000,
      percentage: p.pct + (Math.random() - 0.5),
      scraped_date: date,
      scraped_at: now,
    });
  }

  return mockData;
}

// Scrape CCASS for a single stock code and date
async function scrapeCCASSSingleDay(
  stockCode: string,
  date: string,
  limit: number
): Promise<CCASSShareholder[]> {
  const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');

  if (!FIRECRAWL_API_KEY) {
    throw new Error('FIRECRAWL_API_KEY not configured');
  }

  const ccassUrl = 'https://www3.hkexnews.hk/sdw/search/searchsdw.aspx';
  const dateFormatted = formatDateForCCASS(date);

  console.log(`[CCASS Scraper] Scraping ${stockCode} for date ${date}`);

  // Use Firecrawl with executeJavascript actions to fill the form
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      url: ccassUrl,
      formats: ['markdown'],
      waitFor: 3000,
      actions: [
        { type: 'wait', milliseconds: 2000 },
        {
          type: 'executeJavascript',
          script: `
            const stockInput = document.querySelector('#txtStockCode');
            if (stockInput) {
              stockInput.value = '${stockCode}';
              stockInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
          `
        },
        {
          type: 'executeJavascript',
          script: `
            const dateInput = document.querySelector('#txtShareholdingDate');
            if (dateInput) {
              dateInput.value = '${dateFormatted}';
              dateInput.dispatchEvent(new Event('change', { bubbles: true }));
            }
          `
        },
        {
          type: 'executeJavascript',
          script: `
            const searchBtn = document.querySelector('#btnSearch');
            if (searchBtn) searchBtn.click();
          `
        },
        { type: 'wait', milliseconds: 5000 },
        { type: 'scrape' }
      ],
      onlyMainContent: false,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Firecrawl API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(`Firecrawl scrape failed: ${data.error || 'Unknown error'}`);
  }

  const markdown = data.data?.markdown || '';
  console.log(`[CCASS Scraper] Received ${markdown.length} chars for ${stockCode}/${date}`);

  return parseCCASSMarkdown(markdown, date).slice(0, limit);
}

// Parse CCASS markdown response
function parseCCASSMarkdown(markdown: string, date: string): CCASSShareholder[] {
  const shareholders: CCASSShareholder[] = [];
  const now = new Date().toISOString();

  const lines = markdown.split('\n');
  let headerFound = false;

  for (const line of lines) {
    if (!line.trim()) continue;

    if (line.includes('Participant') && (line.includes('Shareholding') || line.includes('%'))) {
      headerFound = true;
      continue;
    }

    if (line.match(/^\|[-\s|]+\|$/)) continue;

    if (headerFound && line.startsWith('|')) {
      const cells = line.split('|').map(c => c.trim()).filter(c => c);

      if (cells.length >= 3) {
        const participantId = cells[0]?.match(/[A-Z]\d{5}/)?.[0] || cells[0];
        const participantName = cells[1] || '';

        let shareholding = 0;
        let percentage = 0;

        for (const cell of cells) {
          const numMatch = cell.match(/[\d,]+/);
          if (numMatch) {
            const num = parseInt(numMatch[0].replace(/,/g, ''));
            if (num > 1000) {
              shareholding = num;
            } else if (num <= 100) {
              percentage = num;
            }
          }
          const pctMatch = cell.match(/([\d.]+)%/);
          if (pctMatch) {
            percentage = parseFloat(pctMatch[1]);
          }
        }

        if (participantId && participantName && shareholding > 0) {
          shareholders.push({
            participant_id: participantId,
            participant_name: participantName,
            shareholding,
            percentage,
            scraped_date: date,
            scraped_at: now,
          });
        }
      }
    }
  }

  // Alternative parsing
  if (shareholders.length === 0) {
    const pattern = /([A-Z]\d{5})\s+([A-Z][A-Z\s&,.()-]+?)\s+([\d,]+)\s+([\d.]+)%/gi;
    let match;

    while ((match = pattern.exec(markdown)) !== null) {
      shareholders.push({
        participant_id: match[1],
        participant_name: match[2].trim(),
        shareholding: parseInt(match[3].replace(/,/g, '')),
        percentage: parseFloat(match[4]),
        scraped_date: date,
        scraped_at: now,
      });
    }
  }

  return shareholders;
}

// Main handler
serve(async (req: Request) => {
  const startTime = Date.now();

  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  let jobId: string | undefined;

  try {
    const body = await req.json();
    const {
      stock_codes,
      date_from,
      date_to,
      latest_only = false,
      limit = 50,
      test_mode = false,
      job_id
    }: ScraperRequest = body;

    jobId = job_id;

    // Validate input
    if (!stock_codes) {
      throw new Error('stock_codes is required');
    }

    const stockCodeList = parseStockCodes(stock_codes);
    if (stockCodeList.length === 0) {
      throw new Error('At least one valid stock code is required');
    }
    if (stockCodeList.length > 20) {
      throw new Error('Maximum 20 stock codes per request');
    }

    // Determine date range
    const today = new Date().toISOString().split('T')[0];
    let dates: string[];

    if (latest_only) {
      dates = [today];
    } else {
      const endDate = date_to || today;
      const startDate = date_from || today;
      dates = generateDateRange(startDate, endDate);
    }

    console.log(`[CCASS Scraper] Starting: ${stockCodeList.length} stocks, ${dates.length} dates, test_mode=${test_mode}`);

    await updateJobStatus(supabase, jobId, 'running');

    // Collect all results
    let totalScraped = 0;
    let totalInserted = 0;
    let totalUpdated = 0;
    let totalFailed = 0;

    // Process each stock code and date combination
    for (const stockCode of stockCodeList) {
      for (const date of dates) {
        try {
          let shareholders: CCASSShareholder[];

          if (test_mode) {
            shareholders = generateMockCCASSData(stockCode, date, limit);
          } else {
            shareholders = await scrapeCCASSSingleDay(stockCode, date, limit);
            // Rate limiting between requests
            await new Promise(resolve => setTimeout(resolve, 1500));
          }

          totalScraped += shareholders.length;

          // Insert to database
          for (const sh of shareholders) {
            try {
              const contentHash = generateContentHash(stockCode, sh.participant_id, sh.scraped_date);

              const { data, error } = await supabase
                .from('hkex_ccass_holdings')
                .upsert({
                  stock_code: stockCode,
                  participant_id: sh.participant_id,
                  participant_name: sh.participant_name,
                  address: sh.address || null,
                  shareholding: sh.shareholding,
                  percentage: sh.percentage,
                  scraped_date: sh.scraped_date,
                  scraped_at: sh.scraped_at,
                  content_hash: contentHash,
                }, {
                  onConflict: 'content_hash',
                  ignoreDuplicates: false
                })
                .select();

              if (error) {
                console.error(`[CCASS] Insert error:`, error);
                totalFailed++;
              } else if (data && data.length > 0) {
                const isNew = data[0].first_seen === data[0].last_seen;
                isNew ? totalInserted++ : totalUpdated++;
              }
            } catch (err) {
              console.error(`[CCASS] Record error:`, err);
              totalFailed++;
            }
          }
        } catch (dayError) {
          console.error(`[CCASS] Error scraping ${stockCode}/${date}:`, dayError);
          totalFailed++;
        }
      }
    }

    const duration = Date.now() - startTime;

    // Log execution
    await supabase.from('scrape_logs').insert({
      source: 'ccass',
      status: totalFailed > 0 ? 'partial' : 'success',
      records_inserted: totalInserted,
      records_updated: totalUpdated,
      records_failed: totalFailed,
      duration_ms: duration,
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      scraper_engine: 'firecrawl-actions',
      scraper_version: '2.1.0-standalone'
    });

    await updateJobStatus(supabase, jobId, 'completed', totalInserted + totalUpdated);

    const response = {
      success: true,
      source: 'ccass',
      stock_codes: stockCodeList,
      dates_processed: dates.length,
      records_scraped: totalScraped,
      records_inserted: totalInserted,
      records_updated: totalUpdated,
      records_failed: totalFailed,
      duration_ms: duration,
    };

    console.log(`[CCASS Scraper] Complete:`, response);

    return new Response(JSON.stringify(response), {
      headers: { 'Content-Type': 'application/json', ...corsHeaders },
      status: 200
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[CCASS Scraper] Error:', error);

    await updateJobStatus(supabase, jobId, 'failed', 0, error.message);

    try {
      await supabase.from('scrape_logs').insert({
        source: 'ccass',
        status: 'error',
        records_inserted: 0,
        records_updated: 0,
        records_failed: 0,
        duration_ms: duration,
        started_at: new Date(startTime).toISOString(),
        completed_at: new Date().toISOString(),
        error_message: error.message,
        error_stack: error.stack
      });
    } catch (logError) {
      console.error('[CCASS] Failed to log error:', logError);
    }

    return new Response(
      JSON.stringify({ success: false, error: error.message, duration_ms: duration }),
      { headers: { 'Content-Type': 'application/json', ...corsHeaders }, status: 500 }
    );
  }
});
