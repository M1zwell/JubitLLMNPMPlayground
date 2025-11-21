/**
 * HKEX Disclosure of Interests Scraper
 * Scrapes substantial shareholder disclosure data from HKEX
 *
 * Endpoint: /functions/v1/hkex-disclosure-scraper
 * Method: POST
 * Body: {
 *   stock_codes: string | string[],  // Single code "00700" or array/comma-separated
 *   start_date?: string,             // YYYY-MM-DD (default: 1 year ago, max 365 days back)
 *   end_date?: string,               // YYYY-MM-DD (default: today)
 *   job_id?: string
 * }
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { crypto } from 'https://deno.land/std@0.224.0/crypto/mod.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ShareholdingData {
  formSerialNumber: string;
  shareholderName: string;
  sharesLong?: number;
  sharesShort?: number;
  sharesLendingPool?: number;
  percentageLong?: number;
  percentageShort?: number;
  percentageLendingPool?: number;
  filingDate: string;
  noticeUrl: string;
}

// Parse shareholding string like "2,961,223,600(L)" or "804,859,700(L)\n0(S)\n"
function parseShareholding(text: string): { long?: number; short?: number; lending?: number } {
  const result: { long?: number; short?: number; lending?: number } = {};

  // Match patterns like "2,961,223,600(L)" or "0(S)"
  const longMatch = text.match(/([\d,]+)\(L\)/);
  const shortMatch = text.match(/([\d,]+)\(S\)/);
  const lendingMatch = text.match(/([\d,]+)\(P\)/);

  if (longMatch) {
    result.long = parseInt(longMatch[1].replace(/,/g, ''));
  }
  if (shortMatch) {
    result.short = parseInt(shortMatch[1].replace(/,/g, ''));
  }
  if (lendingMatch) {
    result.lending = parseInt(lendingMatch[1].replace(/,/g, ''));
  }

  return result;
}

// Parse percentage string like "31.10(L)" or "8.42(L)\n0.00(S)\n"
function parsePercentage(text: string): { long?: number; short?: number; lending?: number } {
  const result: { long?: number; short?: number; lending?: number } = {};

  const longMatch = text.match(/([\d.]+)\(L\)/);
  const shortMatch = text.match(/([\d.]+)\(S\)/);
  const lendingMatch = text.match(/([\d.]+)\(P\)/);

  if (longMatch) {
    result.long = parseFloat(longMatch[1]);
  }
  if (shortMatch) {
    result.short = parseFloat(shortMatch[1]);
  }
  if (lendingMatch) {
    result.lending = parseFloat(lendingMatch[1]);
  }

  return result;
}

// Parse date from DD/MM/YYYY format
function parseDate(dateStr: string): string {
  const [day, month, year] = dateStr.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

// Generate content hash for deduplication
async function generateHash(data: any): Promise<string> {
  const str = JSON.stringify(data);
  const msgBuffer = new TextEncoder().encode(str);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// Helper to update job status
async function updateJobStatus(
  supabase: any,
  jobId: string | null,
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

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  // Initialize Supabase client early for job updates
  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  let jobId: string | null = null;

  try {
    const body = await req.json();
    const { stock_codes, stock_code, start_date, end_date, job_id } = body;
    jobId = job_id;

    // Support both stock_codes (array/string) and legacy stock_code (single)
    let stockCodeList: string[] = [];
    if (stock_codes) {
      if (Array.isArray(stock_codes)) {
        stockCodeList = stock_codes.map((c: string) => c.trim().padStart(5, '0'));
      } else {
        stockCodeList = stock_codes.split(',').map((c: string) => c.trim().padStart(5, '0'));
      }
    } else if (stock_code) {
      stockCodeList = [stock_code.padStart(5, '0')];
    }

    if (stockCodeList.length === 0) {
      throw new Error('stock_codes or stock_code is required');
    }
    if (stockCodeList.length > 20) {
      throw new Error('Maximum 20 stock codes per request');
    }

    // Update job to running
    await updateJobStatus(supabase, jobId, 'running');

    console.log(`🔍 Scraping disclosure data for ${stockCodeList.length} stocks: ${stockCodeList.join(', ')}`);

    // Format dates - enforce max 365 days
    const today = new Date();
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());

    const startDate = start_date || oneYearAgo.toISOString().split('T')[0];
    const endDate = end_date || today.toISOString().split('T')[0];

    // Validate date range (max 365 days)
    const daysDiff = Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24));
    if (daysDiff > 365) {
      throw new Error('Date range exceeds maximum of 365 days');
    }

    // Convert to DD/MM/YYYY format for HKEX
    const formatDateForHKEX = (dateStr: string) => {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    };

    const startDateHKEX = formatDateForHKEX(startDate);
    const endDateHKEX = formatDateForHKEX(endDate);

    // Fetch the page using Firecrawl
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    if (!FIRECRAWL_API_KEY) {
      throw new Error('FIRECRAWL_API_KEY not set');
    }

    // Process all stock codes
    let totalInserted = 0;
    let totalFailed = 0;
    const allShareholderData: ShareholdingData[] = [];
    const stockNames: Record<string, string> = {};

    for (const currentStockCode of stockCodeList) {
      try {
        const baseUrl = 'https://di.hkex.com.hk/di/NSAllSSList.aspx';
        const searchUrl = `${baseUrl}?sa2=as&sid=&corpn=&sd=${startDateHKEX}&ed=${endDateHKEX}&cid=0&sa1=cl&scsd=${startDateHKEX}&sced=${endDateHKEX}&sc=${currentStockCode}&src=MAIN&lang=EN&g_lang=en`;

        console.log(`📡 Fetching ${currentStockCode}: ${searchUrl}`);

        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: searchUrl,
            formats: ['markdown', 'html'],
            onlyMainContent: false,
          }),
        });

        if (!scrapeResponse.ok) {
          const error = await scrapeResponse.text();
          console.error(`❌ Firecrawl error for ${currentStockCode}: ${error}`);
          totalFailed++;
          continue;
        }

        const scrapeData = await scrapeResponse.json();
        const html = scrapeData.data?.html || '';

        console.log(`📄 Received ${html.length} chars for ${currentStockCode}`);

        // Extract stock name
        const stockNameMatch = html.match(/Name of listed corporation:<\/\w+>\s*<\w+[^>]*>(.*?)<\/\w+>/);
        const stockName = stockNameMatch ? stockNameMatch[1].trim() : '';
        stockNames[currentStockCode] = stockName;

        // Parse shareholder data
        const rowPattern = /<a[^>]*href="[^"]*fn=([^&"]+)[^"]*"[^>]*>(?:<\w+[^>]*>)*([^<]+)(?:<\/\w+>)*<\/a>\s*(?:<\w+[^>]*>)*([^<]+?)(?:<\/\w+>)*\s*(?:<\w+[^>]*>)*([^<]+?)(?:<\/\w+>)*\s*(?:<\w+[^>]*>)*([^<]+?)(?:<\/\w+>)*\s*<a[^>]*href="([^"]*)"[^>]*>(?:<\w+[^>]*>)*(\d{2}\/\d{2}\/\d{4})/g;

        let match;
        while ((match = rowPattern.exec(html)) !== null) {
          const [_, formSerial, shareholderName, sharesText, percentageText, __, noticeUrl, filingDateStr] = match;

          const shares = parseShareholding(sharesText);
          const percentages = parsePercentage(percentageText);

          const shareholderRecord = {
            formSerialNumber: formSerial.trim(),
            shareholderName: shareholderName.trim(),
            sharesLong: shares.long,
            sharesShort: shares.short,
            sharesLendingPool: shares.lending,
            percentageLong: percentages.long,
            percentageShort: percentages.short,
            percentageLendingPool: percentages.lending,
            filingDate: filingDateStr.trim(),
            noticeUrl: `https://di.hkex.com.hk${noticeUrl}`,
          };

          allShareholderData.push(shareholderRecord);

          // Insert to database
          try {
            const contentHash = await generateHash({
              stock_code: currentStockCode,
              form: shareholderRecord.formSerialNumber,
              name: shareholderRecord.shareholderName,
            });

            const { error } = await supabase
              .from('hkex_disclosure_interests')
              .upsert({
                stock_code: currentStockCode,
                stock_name: stockName,
                form_serial_number: shareholderRecord.formSerialNumber,
                shareholder_name: shareholderRecord.shareholderName,
                shareholder_type: 'substantial_shareholder',
                shares_long: shareholderRecord.sharesLong,
                shares_short: shareholderRecord.sharesShort,
                shares_lending_pool: shareholderRecord.sharesLendingPool,
                percentage_long: shareholderRecord.percentageLong,
                percentage_short: shareholderRecord.percentageShort,
                percentage_lending_pool: shareholderRecord.percentageLendingPool,
                filing_date: parseDate(shareholderRecord.filingDate),
                notice_url: shareholderRecord.noticeUrl,
                search_date: endDate,
                content_hash: contentHash,
              }, {
                onConflict: 'content_hash',
              });

            if (error) {
              console.error(`❌ Insert error: ${error.message}`);
              totalFailed++;
            } else {
              totalInserted++;
            }
          } catch (err) {
            console.error(`❌ Processing error:`, err);
            totalFailed++;
          }
        }

        // Rate limiting between stocks
        if (stockCodeList.length > 1) {
          await new Promise(resolve => setTimeout(resolve, 1500));
        }
      } catch (stockError) {
        console.error(`❌ Error processing ${currentStockCode}:`, stockError);
        totalFailed++;
      }
    }

    console.log(`✅ Complete: ${totalInserted} inserted, ${totalFailed} failed`);

    // Update job to completed
    await updateJobStatus(supabase, jobId, 'completed', totalInserted);

    return new Response(
      JSON.stringify({
        success: true,
        stock_codes: stockCodeList,
        stock_names: stockNames,
        shareholders_found: allShareholderData.length,
        inserted: totalInserted,
        failed: totalFailed,
        date_range: { start: startDate, end: endDate },
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Error:', error);

    // Update job to failed
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);
    await updateJobStatus(supabase, jobId, 'failed', 0, error.message);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
