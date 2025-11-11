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

// Import change tracker
import { CCAASSChangeTracker } from '../_shared/change-tracker.ts';

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
    // Batch processing options
    batchMode?: 'sequential' | 'concurrent';  // Sequential (default) or concurrent processing
    batchDelay?: number;  // Delay between requests in ms (default: 5000ms)
    batchSize?: number;   // Number of concurrent requests (for concurrent mode, default: 3)
    // Firecrawl v2 advanced features
    captureScreenshot?: boolean;  // Capture screenshot of results (default: false)
    useJsonExtraction?: boolean;  // Use JSON extraction instead of HTML parsing (default: false)
    enableChangeTracking?: boolean;  // Track changes and save snapshots (default: false)
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
  const {
    stockCodes,
    dateRange,
    batchMode = 'sequential',
    batchDelay = 5000,  // Default 5 second delay between requests
    batchSize = 3,      // Default 3 concurrent requests
    captureScreenshot = false,  // Screenshot capture disabled by default
    useJsonExtraction = false,  // JSON extraction disabled by default
    enableChangeTracking = false  // Change tracking disabled by default
  } = options;

  // Initialize change tracker if enabled
  const changeTracker = enableChangeTracking
    ? new CCAASSChangeTracker(
        Deno.env.get('SUPABASE_URL')!,
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
      )
    : null;

  const totalStocks = stockCodes?.length || 0;
  console.log(`[HKEX CCASS] Batch scraping ${totalStocks} stock codes (mode: ${batchMode})`);

  // Extract structured data using HKEXCCASSExtractor
  const extractor = new HKEXCCASSExtractor();
  const results = [];
  let usedStrategy: 'firecrawl' | 'puppeteer' = 'firecrawl';

  // Process function for a single stock
  const processSingleStock = async (stockCode: string, index: number): Promise<any> => {
    try {
      // Format stock code (ensure 5 digits with leading zeros)
      const formattedStockCode = stockCode.padStart(5, '0');

      console.log(`[HKEX CCASS] Processing stock ${index + 1}/${totalStocks}: ${formattedStockCode}`);

      // Try Firecrawl with actions first
      let rawData;
      if (strategy === 'auto' || strategy === 'firecrawl') {
        try {
          rawData = await scrapeCCASSWithFirecrawl(
            formattedStockCode,
            dateRange?.start,
            captureScreenshot,
            useJsonExtraction
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

      // Extract structured data from HTML or JSON
      let extractedData;

      if (useJsonExtraction && rawData.extracted) {
        // Use AI-extracted JSON data directly
        console.log(`[HKEX CCASS] Using JSON extraction for ${stockCode}`);
        extractedData = {
          stockCode: rawData.extracted.stockCode || formattedStockCode,
          stockName: rawData.extracted.stockName || 'Unknown',
          dataDate: rawData.extracted.dataDate || (dateRange?.start || new Date().toISOString().split('T')[0]),
          participants: rawData.extracted.participants || [],
          totalParticipants: rawData.extracted.participants?.length || 0,
          totalShares: rawData.extracted.participants?.reduce((sum: number, p: any) => sum + (p.shareholding || 0), 0) || 0,
          screenshotUrl: rawData.screenshotUrl,  // Include screenshot URL if captured
        };
      } else {
        // Use HTML parsing extractor
        extractedData = await extractor.extract({
          html: rawData.html || rawData.content || '',
          stockCode: formattedStockCode,
          requestDate: dateRange?.start || new Date().toISOString().split('T')[0],
        });

        // Add screenshot URL if captured
        if (rawData.screenshotUrl) {
          extractedData.screenshotUrl = rawData.screenshotUrl;
        }
      }

      console.log(`[HKEX CCASS] ✅ Extracted ${extractedData.participants.length} participants for ${stockCode}${extractedData.screenshotUrl ? ' (with screenshot)' : ''}`);

      // Process change tracking if enabled
      if (changeTracker) {
        try {
          const { snapshotId, changes } = await changeTracker.processSnapshot({
            stockCode: extractedData.stockCode,
            dataDate: extractedData.dataDate,
            stockName: extractedData.stockName || 'Unknown',
            totalParticipants: extractedData.totalParticipants,
            totalShares: extractedData.totalShares,
            participants: extractedData.participants,
            screenshotUrl: extractedData.screenshotUrl,
            extractionMethod: useJsonExtraction ? 'json' : 'html',
          });

          extractedData.snapshotId = snapshotId;
          extractedData.changes = changes;
          extractedData.changeCount = changes.length;

          console.log(`[HKEX CCASS] 📊 Snapshot saved (ID: ${snapshotId}), detected ${changes.length} changes`);
        } catch (error) {
          console.error(`[HKEX CCASS] ⚠️  Change tracking failed for ${stockCode}:`, error);
          extractedData.changeTrackingError = error instanceof Error ? error.message : String(error);
        }
      }

      return extractedData;

    } catch (error) {
      console.error(`[HKEX CCASS] ❌ Failed to extract ${stockCode}:`, error);
      return {
        stockCode,
        error: error instanceof Error ? error.message : String(error),
        participants: [],
        totalParticipants: 0,
        totalShares: 0,
      };
    }
  };

  // Batch processing: Sequential mode (with delays to avoid rate limiting)
  if (batchMode === 'sequential') {
    for (let i = 0; i < stockCodes!.length; i++) {
      const stockCode = stockCodes![i];
      const result = await processSingleStock(stockCode, i);
      results.push(result);

      // Add delay between requests (except after last one)
      if (i < stockCodes!.length - 1) {
        console.log(`[HKEX CCASS] ⏳ Waiting ${batchDelay}ms before next request...`);
        await new Promise(resolve => setTimeout(resolve, batchDelay));
      }
    }
  }
  // Batch processing: Concurrent mode (process multiple stocks in parallel)
  else if (batchMode === 'concurrent') {
    console.log(`[HKEX CCASS] Processing ${batchSize} stocks concurrently`);

    // Split stock codes into batches
    for (let i = 0; i < stockCodes!.length; i += batchSize) {
      const batch = stockCodes!.slice(i, i + batchSize);
      console.log(`[HKEX CCASS] Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(stockCodes!.length / batchSize)}`);

      // Process batch concurrently
      const batchPromises = batch.map((stockCode, batchIndex) =>
        processSingleStock(stockCode, i + batchIndex)
      );

      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);

      // Add delay between batches (except after last batch)
      if (i + batchSize < stockCodes!.length) {
        console.log(`[HKEX CCASS] ⏳ Waiting ${batchDelay}ms before next batch...`);
        await new Promise(resolve => setTimeout(resolve, batchDelay));
      }
    }
  }

  // Calculate summary statistics
  const successCount = results.filter(r => !r.error).length;
  const failureCount = results.filter(r => r.error).length;
  const totalParticipants = results.reduce((sum, r) => sum + (r.totalParticipants || 0), 0);

  console.log(`[HKEX CCASS] Batch complete: ${successCount} succeeded, ${failureCount} failed, ${totalParticipants} total participants`);

  return {
    data: results,
    strategy: usedStrategy,
    batchSummary: {
      totalStocks,
      successCount,
      failureCount,
      totalParticipants,
      mode: batchMode,
      delayMs: batchDelay,
    },
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
      // Use v2 features: caching for news (1 hour), exclude navigation
      rawData = await scrapeWithFirecrawl(newsUrl, undefined, {
        maxAge: 3600000, // Cache news for 1 hour (updates frequently)
        onlyMainContent: true,
        excludeTags: ['nav', 'footer', 'aside', 'header', 'script', 'style', '.sidebar', '.advertisement']
      });
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

  // Save articles to database
  let savedCount = 0;
  let skippedCount = 0;
  let errorCount = 0;

  if (extractedData.articles.length > 0) {
    try {
      const supabaseUrl = Deno.env.get('SUPABASE_URL');
      const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Prepare records for insertion
        const records = extractedData.articles.map(article => ({
          title: article.title,
          filing_date: article.publishDate?.split('T')[0] || new Date().toISOString().split('T')[0],
          filing_type: article.category,
          url: article.url,
          content_hash: `${article.id}-${article.publishDate}`, // Simple hash
          summary: article.summary || null,
          pdf_url: article.pdfUrl || null,
          tags: article.tags || [],
          search_vector: null, // Will be generated by trigger
        }));

        // Insert with upsert (on conflict do update)
        const { data, error } = await supabase
          .from('hksfc_filings')
          .upsert(records, {
            onConflict: 'url',
            ignoreDuplicates: false
          })
          .select('id');

        if (error) {
          console.error('[HKSFC News] Database save error:', error);
          errorCount = records.length;
        } else {
          savedCount = data?.length || 0;
          skippedCount = records.length - savedCount;
          console.log(`[HKSFC News] 💾 Saved ${savedCount} articles to database (${skippedCount} already existed)`);
        }
      } else {
        console.warn('[HKSFC News] Supabase credentials not configured - skipping database save');
      }
    } catch (error) {
      console.error('[HKSFC News] Failed to save to database:', error);
      errorCount = extractedData.articles.length;
    }
  }

  return {
    data: extractedData,
    strategy: usedStrategy,
    dbSummary: {
      saved: savedCount,
      skipped: skippedCount,
      errors: errorCount,
      total: extractedData.articles.length
    }
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
      // Use v2 features with default caching
      const result = await scrapeWithFirecrawl(url!, undefined, {
        maxAge: 86400000, // Cache custom URLs for 1 day
        onlyMainContent: true,
      });
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
 * Scrape with Firecrawl v2 API (with advanced features)
 */
async function scrapeWithFirecrawl(url: string, actions?: any[], options?: {
  maxAge?: number;
  onlyMainContent?: boolean;
  excludeTags?: string[];
  jsonSchema?: any;  // JSON extraction schema
}): Promise<any> {
  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');

  if (!apiKey) {
    throw new Error('Firecrawl API key not configured');
  }

  console.log('[Firecrawl v2] Scraping:', url, actions ? `with ${actions.length} actions` : '', options?.jsonSchema ? '(JSON extraction)' : '');

  const requestBody: any = {
    url,
    formats: options?.jsonSchema ? ['extract'] : ['markdown', 'html'],

    // V2 features
    onlyMainContent: options?.onlyMainContent ?? !actions, // Get full content when using actions
    maxAge: options?.maxAge ?? 86400000, // Cache for 1 day by default

    // Wait for JavaScript/React to fully render (especially for SPAs)
    waitFor: actions ? 3000 : 5000,  // 3s with actions, 5s without
    timeout: 60000  // 60 second timeout for complex pages
  };

  // Add JSON extraction schema if provided
  if (options?.jsonSchema) {
    requestBody.extract = {
      schema: options.jsonSchema
    };
  }

  // Exclude noise elements for cleaner extraction
  if (options?.excludeTags) {
    requestBody.excludeTags = options.excludeTags;
  } else if (!actions) {
    // Default exclusions for static pages
    requestBody.excludeTags = ['nav', 'footer', 'aside', 'header', 'script', 'style'];
  }

  // Add actions if provided
  if (actions && actions.length > 0) {
    requestBody.actions = actions;
  }

  // Use v1 endpoint (stable v2 API)
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
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

  // Parse screenshot URL from actions if present
  let screenshotUrl = null;
  if (data.data?.actions) {
    const screenshotAction = data.data.actions.find((a: any) => a.type === 'screenshot');
    if (screenshotAction?.result) {
      screenshotUrl = screenshotAction.result;
      console.log('[Firecrawl v2] Screenshot captured:', screenshotUrl);
    }
  }

  // V2 response format
  return {
    content: data.data?.markdown || data.data?.content,
    html: data.data?.html,
    extracted: data.data?.extract,  // JSON extracted data
    metadata: {
      ...data.data?.metadata,
      cacheState: data.data?.metadata?.cache_state, // v2 cache indicator
      creditsUsed: data.data?.metadata?.credits_used,
    },
    actions: data.data?.actions, // V2 actions response (screenshots, scrapes, etc.)
    screenshotUrl,  // Parsed screenshot URL for convenience
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
  date?: string,
  captureScreenshot = false,
  useJsonExtraction = false
): Promise<any> {
  const ccassUrl = 'https://www3.hkexnews.hk/sdw/search/searchsdw.aspx';

  // Validate and format stock code (must be 5 digits)
  if (!/^\d{1,5}$/.test(stockCode)) {
    throw new Error(`Invalid stock code format: ${stockCode}. Must be 1-5 digits.`);
  }
  const formattedStockCode = stockCode.padStart(5, '0');

  // Format date as YYYY/MM/DD (HKEX format)
  const searchDate = date || new Date().toISOString().split('T')[0].replace(/-/g, '/');

  // Validate date is within past 12 months (HKEX limitation)
  const today = new Date();
  const requestDate = new Date(searchDate.replace(/\//g, '-'));
  const twelveMonthsAgo = new Date(today);
  twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

  if (requestDate < twelveMonthsAgo || requestDate > today) {
    throw new Error(
      `Date ${searchDate} out of range. HKEX only provides data for past 12 months ` +
      `(${twelveMonthsAgo.toISOString().split('T')[0]} to ${today.toISOString().split('T')[0]})`
    );
  }

  console.log(`[HKEX CCASS] Scraping stock ${formattedStockCode} for date ${searchDate}${captureScreenshot ? ' (with screenshot)' : ''}${useJsonExtraction ? ' (JSON extraction)' : ''}`);

  // Define comprehensive actions following Firecrawl v2 best practices
  // Note: HKEX uses ASP.NET forms with ViewState - must trigger proper events
  // Using executeJavascript for reliable field clearing with event triggering
  const actions: any[] = [
    // Wait for initial page load and JavaScript/ASP.NET initialization
    { type: 'wait', milliseconds: 3000 },

    // Clear and fill stock code field using JavaScript
    // Trigger change/blur events to ensure ASP.NET validation fires
    {
      type: 'executeJavascript',
      script: `
        const field = document.querySelector("#txtStockCode");
        if (field) {
          field.value = "";
          field.focus();
          field.value = "${formattedStockCode}";
          field.dispatchEvent(new Event('input', { bubbles: true }));
          field.dispatchEvent(new Event('change', { bubbles: true }));
          field.blur();
        }
      `
    },
    { type: 'wait', milliseconds: 500 },

    // Clear and fill date field using JavaScript
    // Trigger change/blur events to ensure ASP.NET validation fires
    {
      type: 'executeJavascript',
      script: `
        const field = document.querySelector("#txtShareholdingDate");
        if (field) {
          field.value = "";
          field.focus();
          field.value = "${searchDate}";
          field.dispatchEvent(new Event('input', { bubbles: true }));
          field.dispatchEvent(new Event('change', { bubbles: true }));
          field.blur();
        }
      `
    },
    { type: 'wait', milliseconds: 1000 },

    // Submit form - Use ID selector (button element with onclick handler)
    { type: 'click', selector: '#btnSearch' },

    // Wait for ASP.NET postback processing and table rendering
    // ASP.NET ViewState processing + table render requires significant time
    { type: 'wait', milliseconds: 2000 },   // Initial postback processing
    { type: 'wait', milliseconds: 8000 },   // Table data load and render (total: 10s)
  ];

  // Add screenshot capture if requested
  if (captureScreenshot) {
    actions.push({
      type: 'screenshot',
      fullPage: false  // Only capture visible portion (table area)
    });
    console.log('[HKEX CCASS] Screenshot capture enabled');
  }

  // Define JSON extraction schema for CCASS table (if JSON extraction enabled)
  const jsonSchema = useJsonExtraction ? {
    type: 'object',
    properties: {
      stockCode: {
        type: 'string',
        description: 'The stock code (5 digits with leading zeros)'
      },
      stockName: {
        type: 'string',
        description: 'The full company name'
      },
      dataDate: {
        type: 'string',
        description: 'The date of shareholding data (YYYY-MM-DD format)'
      },
      participants: {
        type: 'array',
        description: 'List of all participants (shareholders) from the CCASS table',
        items: {
          type: 'object',
          properties: {
            participantId: {
              type: 'string',
              description: 'Participant ID (e.g., C00019, B01451, A00003)'
            },
            participantName: {
              type: 'string',
              description: 'Full name of the participant/institution'
            },
            address: {
              type: 'string',
              description: 'Registered address of the participant'
            },
            shareholding: {
              type: 'number',
              description: 'Number of shares held (must be integer, not string)'
            },
            percentage: {
              type: 'number',
              description: 'Percentage of total shares (decimal, e.g., 34.16 for 34.16%)'
            }
          },
          required: ['participantId', 'participantName', 'shareholding', 'percentage']
        }
      }
    },
    required: ['stockCode', 'participants']
  } : undefined;

  try {
    const result = await scrapeWithFirecrawl(ccassUrl, actions, {
      jsonSchema,
      onlyMainContent: false,  // Need full page for form interaction
    });
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
