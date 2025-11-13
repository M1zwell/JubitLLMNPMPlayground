/**
 * HKEX Disclosure of Interests Scraper
 * Scrapes substantial shareholder disclosure data from HKEX
 *
 * Endpoint: /functions/v1/hkex-disclosure-scraper
 * Method: POST
 * Body: { stock_code: string, start_date?: string, end_date?: string }
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

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const { stock_code, start_date, end_date } = await req.json();

    if (!stock_code) {
      throw new Error('stock_code is required');
    }

    console.log(`🔍 Scraping disclosure data for stock: ${stock_code}`);

    // Format dates
    const today = new Date();
    const oneYearAgo = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());

    const startDate = start_date || oneYearAgo.toISOString().split('T')[0];
    const endDate = end_date || today.toISOString().split('T')[0];

    // Convert to DD/MM/YYYY format for HKEX
    const formatDateForHKEX = (dateStr: string) => {
      const [year, month, day] = dateStr.split('-');
      return `${day}/${month}/${year}`;
    };

    const startDateHKEX = formatDateForHKEX(startDate);
    const endDateHKEX = formatDateForHKEX(endDate);

    // Build the substantial shareholders list URL directly
    // We'll construct it based on the pattern observed
    const baseUrl = 'https://di.hkex.com.hk/di/NSAllSSList.aspx';
    const searchUrl = `${baseUrl}?sa2=as&sid=&corpn=&sd=${startDateHKEX}&ed=${endDateHKEX}&cid=0&sa1=cl&scsd=${startDateHKEX}&sced=${endDateHKEX}&sc=${stock_code}&src=MAIN&lang=EN&g_lang=en`;

    console.log(`📡 Fetching from: ${searchUrl}`);

    // Fetch the page using Firecrawl
    const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
    if (!FIRECRAWL_API_KEY) {
      throw new Error('FIRECRAWL_API_KEY not set');
    }

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
      throw new Error(`Firecrawl API error: ${error}`);
    }

    const scrapeData = await scrapeResponse.json();
    const html = scrapeData.data?.html || '';
    const markdown = scrapeData.data?.markdown || '';

    console.log(`📄 Received ${html.length} chars of HTML`);

    // Parse the HTML to extract shareholder data
    const shareholderData: ShareholdingData[] = [];

    // Extract stock name from the page
    const stockNameMatch = html.match(/Name of listed corporation:<\/\w+>\s*<\w+[^>]*>(.*?)<\/\w+>/);
    const stockName = stockNameMatch ? stockNameMatch[1].trim() : '';

    // Use regex to extract table rows
    // Pattern: Form Serial Number -> Shareholder Name -> Shares -> Percentage -> Date
    const rowPattern = /<a[^>]*href="[^"]*fn=([^&"]+)[^"]*"[^>]*>(?:<\w+[^>]*>)*([^<]+)(?:<\/\w+>)*<\/a>\s*(?:<\w+[^>]*>)*([^<]+?)(?:<\/\w+>)*\s*(?:<\w+[^>]*>)*([^<]+?)(?:<\/\w+>)*\s*(?:<\w+[^>]*>)*([^<]+?)(?:<\/\w+>)*\s*<a[^>]*href="([^"]*)"[^>]*>(?:<\w+[^>]*>)*(\d{2}\/\d{2}\/\d{4})/g;

    let match;
    while ((match = rowPattern.exec(html)) !== null) {
      const [_, formSerial, shareholderName, sharesText, percentageText, __, noticeUrl, filingDateStr] = match;

      const shares = parseShareholding(sharesText);
      const percentages = parsePercentage(percentageText);

      shareholderData.push({
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
      });
    }

    console.log(`✅ Extracted ${shareholderData.length} shareholders`);

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Insert data into database
    let inserted = 0;
    let updated = 0;
    let failed = 0;

    for (const shareholder of shareholderData) {
      try {
        const contentHash = await generateHash({
          stock_code,
          form: shareholder.formSerialNumber,
          name: shareholder.shareholderName,
        });

        const { error } = await supabase
          .from('hkex_disclosure_interests')
          .upsert({
            stock_code: stock_code.padStart(5, '0'),
            stock_name: stockName,
            form_serial_number: shareholder.formSerialNumber,
            shareholder_name: shareholder.shareholderName,
            shareholder_type: 'substantial_shareholder',
            shares_long: shareholder.sharesLong,
            shares_short: shareholder.sharesShort,
            shares_lending_pool: shareholder.sharesLendingPool,
            percentage_long: shareholder.percentageLong,
            percentage_short: shareholder.percentageShort,
            percentage_lending_pool: shareholder.percentageLendingPool,
            filing_date: parseDate(shareholder.filingDate),
            notice_url: shareholder.noticeUrl,
            search_date: endDate,
            content_hash: contentHash,
          }, {
            onConflict: 'content_hash',
          });

        if (error) {
          console.error(`❌ Error inserting ${shareholder.shareholderName}:`, error);
          failed++;
        } else {
          inserted++;
        }
      } catch (err) {
        console.error(`❌ Error processing ${shareholder.shareholderName}:`, err);
        failed++;
      }
    }

    console.log(`✅ Complete: ${inserted} inserted, ${updated} updated, ${failed} failed`);

    return new Response(
      JSON.stringify({
        success: true,
        stock_code,
        stock_name: stockName,
        shareholders_found: shareholderData.length,
        inserted,
        updated,
        failed,
        data: shareholderData,
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );

  } catch (error) {
    console.error('❌ Error:', error);
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
