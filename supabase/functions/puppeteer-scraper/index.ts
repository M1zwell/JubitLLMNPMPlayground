/**
 * HKEx Scraper Edge Function (Firecrawl-based)
 *
 * Note: Puppeteer doesn't work in Deno Edge Functions due to browser binary requirements.
 * This function returns an error message directing users to use the Puppeteer MCP server instead.
 *
 * For CCASS and Market Stats scraping with JavaScript rendering, use:
 * - Puppeteer MCP server (configured in .claude/settings.local.json)
 * - Ask Claude Code: "Use Puppeteer to scrape CCASS for stock 00700"
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

interface PuppeteerScrapeRequest {
  type: 'ccass' | 'market-stats';
  stockCode?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  pagination?: {
    enabled: boolean;
    maxPages?: number;
  };
}

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST, OPTIONS',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const body: PuppeteerScrapeRequest = await req.json();

    // Return helpful error message
    const message = `
Puppeteer doesn't work in Supabase Edge Functions (no browser binary in Deno).

For ${body.type === 'ccass' ? 'CCASS Holdings' : 'Market Statistics'} scraping:

✅ Use Puppeteer MCP Server (Already configured!)
   1. Ask Claude Code: "Use Puppeteer to scrape ${body.type === 'ccass' ? 'CCASS holdings for stock ' + (body.stockCode || '00700') : 'HKEx market statistics'}"
   2. MCP server location: .claude/settings.local.json
   3. Command: npx -y @modelcontextprotocol/server-puppeteer

✅ Use the example script:
   node examples/puppeteer-hkex-ccass-example.js ${body.stockCode || '00700'}

⚠️ Puppeteer requires Node.js/Deno with browser binary, not available in Edge Functions.
    `;

    return new Response(
      JSON.stringify({
        success: false,
        data: [],
        totalRows: 0,
        pagesScraped: 0,
        metadata: {
          url: body.type === 'ccass'
            ? 'https://www.hkexnews.hk/sdw/search/searchsdw.aspx'
            : 'https://www.hkex.com.hk/Market-Data/Statistics',
          scrapedAt: new Date().toISOString(),
          executionTime: 0,
        },
        error: 'Puppeteer not available in Edge Functions. Use Puppeteer MCP server instead.',
        message,
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
