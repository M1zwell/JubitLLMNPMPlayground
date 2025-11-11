/**
 * Scrape Orchestrator Edge Function
 *
 * Central routing layer for all web scraping operations.
 * Delegates to appropriate scraping engines (Puppeteer/Firecrawl) and extractors.
 *
 * Route: POST /functions/v1/scrape-orchestrator
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

// Import extractors
import { HKSFCNewsExtractor } from '../_shared/extractors/hksfc-news.ts';
import { NPMPackageExtractor } from '../_shared/extractors/npm-package.ts';
import { HKEXCCASSExtractor } from '../_shared/extractors/hkex-ccass.ts';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// ============================================================================
// Types
// ============================================================================

type ScrapingStrategy = 'auto' | 'firecrawl' | 'puppeteer';
type DataSourceType = 'hkex-ccass' | 'hksfc-news' | 'npm-package' | 'custom';

interface ScrapeRequest {
  source: DataSourceType;
  strategy?: ScrapingStrategy;
  options: {
    url?: string;
    stockCodes?: string[];
    packageName?: string;
    dateRange?: {
      start: string;
      end: string;
    };
    maxRetries?: number;
    timeout?: number;
  };
}

interface ScrapeResponse {
  success: boolean;
  data?: any;
  error?: string;
  executionTime: number;
  source: DataSourceType;
  strategy: 'firecrawl' | 'puppeteer';
  timestamp: string;
}

// ============================================================================
// Main Handler
// ============================================================================

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const startTime = Date.now();

    // Parse request body
    const requestData: ScrapeRequest = await req.json();
    const { source, strategy = 'auto', options } = requestData;

    console.log(`[Scrape Orchestrator] Processing ${source} request`);

    // Validate request
    validateRequest(requestData);

    // Route to appropriate handler
    let result: any;

    switch (source) {
      case 'hkex-ccass':
        result = await handleHKEXCCASS(options, strategy);
        break;

      case 'hksfc-news':
        result = await handleHKSFCNews(options, strategy);
        break;

      case 'npm-package':
        result = await handleNPMPackage(options);
        break;

      case 'custom':
        result = await handleCustomURL(options, strategy);
        break;

      default:
        throw new Error(`Unsupported source type: ${source}`);
    }

    const executionTime = Date.now() - startTime;

    // Log to Supabase (optional)
    await logScrapeOperation(req, source, result, executionTime);

    // Return successful response
    const response: ScrapeResponse = {
      success: true,
      data: result.data,
      executionTime,
      source,
      strategy: result.strategy || 'puppeteer',
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('[Scrape Orchestrator] Error:', error);

    const errorResponse: ScrapeResponse = {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      executionTime: 0,
      source: 'custom',
      strategy: 'puppeteer',
      timestamp: new Date().toISOString(),
    };

    return new Response(JSON.stringify(errorResponse), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});

// ============================================================================
// Request Validation
// ============================================================================

function validateRequest(request: ScrapeRequest): void {
  if (!request.source) {
    throw new Error('Missing required field: source');
  }

  if (!request.options) {
    throw new Error('Missing required field: options');
  }

  // Source-specific validation
  switch (request.source) {
    case 'hkex-ccass':
      if (!request.options.stockCodes || request.options.stockCodes.length === 0) {
        throw new Error('HKEX CCASS requires stockCodes');
      }
      break;

    case 'npm-package':
      if (!request.options.packageName) {
        throw new Error('NPM package requires packageName');
      }
      break;

    case 'custom':
      if (!request.options.url) {
        throw new Error('Custom scraping requires url');
      }
      break;
  }
}

// ============================================================================
// Source-Specific Handlers
// ============================================================================

/**
 * Handle HKEX CCASS scraping
 */
async function handleHKEXCCASS(
  options: ScrapeRequest['options'],
  strategy: ScrapingStrategy
): Promise<any> {
  const { stockCodes, dateRange } = options;

  console.log(`[HKEX CCASS] Scraping ${stockCodes?.length} stock codes`);

  // Extract structured data using HKEXCCASSExtractor
  const extractor = new HKEXCCASSExtractor();
  const results = [];
  let usedStrategy: 'firecrawl' | 'puppeteer' = 'firecrawl';

  for (const stockCode of stockCodes!) {
    try {
      // Format stock code (ensure 5 digits with leading zeros)
      const formattedStockCode = stockCode.padStart(5, '0');

      // Try Firecrawl with actions first
      let rawData;
      if (strategy === 'auto' || strategy === 'firecrawl') {
        try {
          rawData = await scrapeCCASSWithFirecrawl(
            formattedStockCode,
            dateRange?.start
          );
          usedStrategy = 'firecrawl';
        } catch (error) {
          console.warn(`[HKEX CCASS] Firecrawl failed for ${stockCode}, trying Puppeteer:`, error);
          if (strategy === 'firecrawl') throw error;

          // Fallback to Puppeteer (if implemented)
          const puppeteerResult = await scrapeCCASSWithPuppeteer([stockCode], dateRange);
          rawData = puppeteerResult[stockCode];
          usedStrategy = 'puppeteer';
        }
      } else {
        // Use Puppeteer directly
        const puppeteerResult = await scrapeCCASSWithPuppeteer([stockCode], dateRange);
        rawData = puppeteerResult[stockCode];
        usedStrategy = 'puppeteer';
      }

      // Extract structured data from HTML
      const extractedData = await extractor.extract({
        html: rawData.html || rawData.content || '',
        stockCode: formattedStockCode,
        requestDate: dateRange?.start || new Date().toISOString().split('T')[0],
      });

      console.log(`[HKEX CCASS] Extracted ${extractedData.participants.length} participants for ${stockCode}`);
      results.push(extractedData);

    } catch (error) {
      console.error(`[HKEX CCASS] Failed to extract ${stockCode}:`, error);
      results.push({
        stockCode,
        error: error instanceof Error ? error.message : String(error),
        participants: [],
        totalParticipants: 0,
        totalShares: 0,
      });
    }
  }

  return {
    data: results,
    strategy: usedStrategy,
  };
}

/**
 * Handle HKSFC news scraping
 */
async function handleHKSFCNews(
  options: ScrapeRequest['options'],
  strategy: ScrapingStrategy
): Promise<any> {
  const { url, dateRange } = options;

  console.log('[HKSFC News] Fetching news articles');

  // Build HKSFC news URL (use React SPA - all URLs redirect here anyway)
  const baseUrl = url || 'https://apps.sfc.hk/edistributionWeb/gateway/EN/news-and-announcements/news/';
  const newsUrl = buildHKSFCUrl(baseUrl, dateRange);

  // Use Firecrawl (required for JavaScript rendering)
  let rawData;
  let usedStrategy: 'firecrawl' | 'puppeteer' = 'firecrawl';

  if (strategy === 'auto' || strategy === 'firecrawl') {
    try {
      rawData = await scrapeWithFirecrawl(newsUrl);
      usedStrategy = 'firecrawl';
    } catch (error) {
      console.warn('[HKSFC] Firecrawl failed:', error);

      // Only fallback to Puppeteer if configured
      const puppeteerServiceUrl = Deno.env.get('PUPPETEER_SERVICE_URL');
      if (!puppeteerServiceUrl) {
        throw new Error('HKSFC scraping requires Firecrawl (React SPA). Puppeteer service not configured as fallback.');
      }

      console.log('[HKSFC] Falling back to Puppeteer service');
      rawData = await scrapeWithPuppeteer(newsUrl);
      usedStrategy = 'puppeteer';
    }
  } else {
    // User explicitly requested Puppeteer
    rawData = await scrapeWithPuppeteer(newsUrl);
    usedStrategy = 'puppeteer';
  }

  // Extract structured data using HKSFCNewsExtractor
  const extractor = new HKSFCNewsExtractor();
  const extractedData = await extractor.extract({
    html: rawData.html || rawData.content || '',
    baseUrl: newsUrl,
  });

  console.log(`[HKSFC News] Extracted ${extractedData.articles.length} articles`);

  // If no articles found, provide helpful error
  if (extractedData.articles.length === 0) {
    throw new Error('No articles extracted from HKSFC. The page structure may have changed or JavaScript rendering failed.');
  }

  return {
    data: extractedData,
    strategy: usedStrategy,
  };
}

/**
 * Handle NPM package scraping
 */
async function handleNPMPackage(options: ScrapeRequest['options']): Promise<any> {
  const { packageName } = options;

  console.log(`[NPM] Fetching package: ${packageName}`);

  // Use NPMPackageExtractor for comprehensive data extraction
  const extractor = new NPMPackageExtractor();
  const extractedData = await extractor.extract({
    packageName: packageName!,
    includeGitHub: true,
    includeBundleSize: false, // Optional, can be slow
  });

  console.log(`[NPM] Extracted package: ${extractedData.name}@${extractedData.version}`);

  return {
    data: extractedData,
    strategy: 'api' as any, // Special case - using API not scraping
  };
}

/**
 * Handle custom URL scraping
 */
async function handleCustomURL(
  options: ScrapeRequest['options'],
  strategy: ScrapingStrategy
): Promise<any> {
  const { url } = options;

  console.log(`[Custom] Scraping URL: ${url}`);

  // Try Firecrawl first if auto
  if (strategy === 'auto' || strategy === 'firecrawl') {
    try {
      const result = await scrapeWithFirecrawl(url!);
      return {
        data: result,
        strategy: 'firecrawl',
      };
    } catch (error) {
      if (strategy === 'firecrawl') throw error;
      console.warn('[Custom] Firecrawl failed, trying Puppeteer');
    }
  }

  // Use Puppeteer
  const result = await scrapeWithPuppeteer(url!);
  return {
    data: result,
    strategy: 'puppeteer',
  };
}

// ============================================================================
// Scraping Engine Implementations
// ============================================================================

/**
 * Scrape with Firecrawl (when available)
 */
async function scrapeWithFirecrawl(url: string, actions?: any[]): Promise<any> {
  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');

  if (!apiKey) {
    throw new Error('Firecrawl API key not configured');
  }

  console.log('[Firecrawl] Scraping:', url, actions ? `with ${actions.length} actions` : '');

  const requestBody: any = {
    url,
    formats: ['markdown', 'html'],
    onlyMainContent: !actions, // Get full content when using actions

    // Wait for JavaScript/React to fully render (especially for SPAs)
    waitFor: 5000,    // Wait 5 seconds after page load for AJAX/React rendering
    timeout: 30000    // 30 second total timeout
  };

  // Add actions if provided
  if (actions && actions.length > 0) {
    requestBody.actions = actions;
  }

  const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Firecrawl API error: ${response.status} - ${errorText}`);
  }

  const data = await response.json();

  return {
    content: data.data?.markdown || data.data?.content,
    html: data.data?.html,
    metadata: data.data?.metadata,
  };
}

/**
 * Scrape with Puppeteer service (external microservice)
 */
async function scrapeWithPuppeteer(url: string): Promise<any> {
  const puppeteerServiceUrl = Deno.env.get('PUPPETEER_SERVICE_URL');

  if (!puppeteerServiceUrl) {
    throw new Error('PUPPETEER_SERVICE_URL not configured - use Firecrawl instead');
  }

  console.log('[Puppeteer Service] Calling external service:', puppeteerServiceUrl);

  const response = await fetch(`${puppeteerServiceUrl}/api/scrape/url`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      url,
      extractData: true
    })
  });

  if (!response.ok) {
    throw new Error(`Puppeteer service error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Puppeteer scraping failed');
  }

  return {
    content: data.data.content,
    html: data.data.content,
    metadata: {
      title: data.data.title,
      url: data.data.url
    }
  };
}

/**
 * HKEX CCASS scraping with Firecrawl actions
 */
async function scrapeCCASSWithFirecrawl(
  stockCode: string,
  date?: string
): Promise<any> {
  const ccassUrl = 'https://www3.hkexnews.hk/sdw/search/searchsdw.aspx';

  // Format date as YYYY/MM/DD (HKEX format)
  const searchDate = date || new Date().toISOString().split('T')[0].replace(/-/g, '/');

  console.log(`[HKEX CCASS] Scraping stock ${stockCode} for date ${searchDate}`);

  // Define actions to fill and submit the form
  const actions = [
    { type: 'wait', milliseconds: 2000 }, // Wait for page load
    { type: 'click', selector: '#txtStockCode' }, // Click stock code input
    { type: 'write', text: stockCode }, // Enter stock code
    { type: 'click', selector: '#txtShareholdingDate' }, // Click date input
    { type: 'write', text: searchDate }, // Enter date
    { type: 'wait', milliseconds: 500 }, // Brief wait
    { type: 'click', selector: '#btnSearch' }, // Click search button
    { type: 'wait', milliseconds: 5000 }, // Wait for results to load
  ];

  try {
    const result = await scrapeWithFirecrawl(ccassUrl, actions);
    return result;
  } catch (error) {
    console.error(`[HKEX CCASS] Firecrawl failed for ${stockCode}:`, error);
    throw error;
  }
}

/**
 * HKEX CCASS scraping with Puppeteer service (fallback)
 */
async function scrapeCCASSWithPuppeteer(
  stockCodes: string[],
  dateRange?: { start: string; end: string }
): Promise<any> {
  const puppeteerServiceUrl = Deno.env.get('PUPPETEER_SERVICE_URL');

  if (!puppeteerServiceUrl) {
    throw new Error('PUPPETEER_SERVICE_URL not configured - use Firecrawl instead');
  }

  console.log(`[HKEX CCASS Puppeteer] Calling service for ${stockCodes.length} stocks`);

  const response = await fetch(`${puppeteerServiceUrl}/api/scrape/hkex-ccass`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      stockCodes,
      date: dateRange?.start
    })
  });

  if (!response.ok) {
    throw new Error(`Puppeteer service error: ${response.status}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'HKEX scraping failed');
  }

  // Transform response to match expected format
  const results: Record<string, any> = {};
  for (const stockData of data.data) {
    results[stockData.stockCode] = {
      html: '', // Not available from Puppeteer service
      content: JSON.stringify(stockData),
      stockData: stockData
    };
  }

  return results;
}

/**
 * Fetch NPM package data from Registry API
 */
async function fetchNPMPackageData(packageName: string): Promise<any> {
  const registryUrl = `https://registry.npmjs.org/${encodeURIComponent(packageName)}`;

  console.log('[NPM API] Fetching:', registryUrl);

  const response = await fetch(registryUrl);

  if (!response.ok) {
    throw new Error(`NPM Registry error: ${response.status}`);
  }

  const data = await response.json();

  // Extract latest version
  const latestVersion = data['dist-tags']?.latest;
  const versionData = latestVersion ? data.versions[latestVersion] : null;

  return {
    name: data.name,
    version: latestVersion,
    description: versionData?.description,
    author: versionData?.author,
    license: versionData?.license,
    repository: versionData?.repository,
    homepage: versionData?.homepage,
    keywords: versionData?.keywords || [],
  };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Build HKSFC news URL with date range
 */
function buildHKSFCUrl(
  baseUrl: string,
  dateRange?: { start: string; end: string }
): string {
  if (!dateRange) return baseUrl;

  const params = new URLSearchParams();
  params.set('dateFrom', dateRange.start);
  params.set('dateTo', dateRange.end);

  return `${baseUrl}?${params.toString()}`;
}

/**
 * Log scrape operation to Supabase
 */
async function logScrapeOperation(
  req: Request,
  source: string,
  result: any,
  executionTime: number
): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    const supabase = createClient(supabaseUrl, supabaseKey);

    await supabase.from('scrape_logs').insert({
      source,
      success: !!result,
      execution_time_ms: executionTime,
      timestamp: new Date().toISOString(),
      user_agent: req.headers.get('user-agent'),
    });
  } catch (error) {
    console.warn('[Logging] Failed to log operation:', error);
    // Don't fail the request if logging fails
  }
}
