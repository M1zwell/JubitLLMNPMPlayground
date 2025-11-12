// Unified Scraper Edge Function
// Purpose: Multi-source web scraping with Firecrawl (primary) + Puppeteer (fallback)
// Supports: HKSFC, HKEX, Legal sites, NPM, LLM configs

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHash } from 'https://deno.land/std@0.177.0/node/crypto.ts';

// Import scraper adapters
import { scrapeHKSFC as scrapeHKSFCV1 } from '../_shared/scrapers/hksfc-adapter.ts';
import { scrapeHKEX } from '../_shared/scrapers/hkex-adapter.ts';
import { scrapeCCASS as scrapeCCASSV1 } from '../_shared/scrapers/hkex-ccass-adapter.ts';
import { scrapeLegal } from '../_shared/scrapers/legal-adapter.ts';
import { scrapeNPM } from '../_shared/scrapers/npm-adapter.ts';
import { scrapeLLM } from '../_shared/scrapers/llm-adapter.ts';

// Import V2 adapters (advanced Firecrawl features)
import { scrapeHKSFC as scrapeHKSFCV2 } from '../_shared/scrapers/hksfc-adapter-v2.ts';
import { scrapeCCASS as scrapeCCASSV2 } from '../_shared/scrapers/hkex-ccass-adapter-v2.ts';

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, apikey',
};

// Types
interface ScraperRequest {
  source: 'hksfc' | 'hkex' | 'ccass' | 'legal' | 'npm' | 'llm';
  limit?: number;
  test_mode?: boolean;
  stock_code?: string; // For CCASS scraping
  use_v2?: boolean; // Use V2 scrapers with advanced features (default: true)
}

interface ScrapedRecord {
  [key: string]: any;
}

interface ScraperResponse {
  success: boolean;
  source: string;
  records_inserted: number;
  records_updated: number;
  records_failed: number;
  duration_ms: number;
  error?: string;
}

// Utility: Generate SHA-256 hash for deduplication
function generateContentHash(...values: string[]): string {
  const hash = createHash('sha256');
  hash.update(values.join('||'));
  return hash.digest('hex');
}

// Main handler
serve(async (req: Request) => {
  const startTime = Date.now();

  // Handle CORS preflight request
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 200,
      headers: corsHeaders
    });
  }

  // Initialize Supabase client with service role key
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL') ?? '',
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  );

  try {
    // Parse request
    const { source, limit = 100, test_mode = false, stock_code = '00700', use_v2 = true }: ScraperRequest = await req.json();

    console.log(`[Unified Scraper] Starting scrape: ${source} (limit: ${limit}, test_mode: ${test_mode}, stock_code: ${stock_code}, use_v2: ${use_v2})`);

    // Route to appropriate scraper
    let scrapeResults: ScrapedRecord[] = [];
    let scraperEngine = 'firecrawl';

    switch (source) {
      case 'hksfc':
        // Use V2 adapter (Map + JSON extraction) by default
        if (use_v2) {
          try {
            scrapeResults = await scrapeHKSFCV2(limit, test_mode);
            scraperEngine = 'firecrawl-v2-map-json';
          } catch (error) {
            console.warn('[Unified Scraper] V2 failed, falling back to V1:', error);
            scrapeResults = await scrapeHKSFCV1(limit, test_mode);
            scraperEngine = 'firecrawl-v1-fallback';
          }
        } else {
          scrapeResults = await scrapeHKSFCV1(limit, test_mode);
          scraperEngine = 'firecrawl-v1';
        }
        break;

      case 'hkex':
        scrapeResults = await scrapeHKEX(limit, test_mode);
        scraperEngine = 'firecrawl'; // HKEX uses Firecrawl
        break;

      case 'ccass':
        // Use V2 adapter (executeJavascript + JSON extraction) by default
        if (use_v2) {
          try {
            scrapeResults = await scrapeCCASSV2(stock_code, limit, test_mode);
            scraperEngine = 'firecrawl-v2-actions-json';
          } catch (error) {
            console.warn('[Unified Scraper] V2 failed, falling back to V1:', error);
            scrapeResults = await scrapeCCASSV1(stock_code, limit, test_mode);
            scraperEngine = 'firecrawl-v1-fallback';
          }
        } else {
          scrapeResults = await scrapeCCASSV1(stock_code, limit, test_mode);
          scraperEngine = 'firecrawl-v1-actions';
        }
        break;

      case 'legal':
        scrapeResults = await scrapeLegal(limit, test_mode);
        break;

      case 'npm':
        scrapeResults = await scrapeNPM(limit, test_mode);
        break;

      case 'llm':
        scrapeResults = await scrapeLLM(limit, test_mode);
        break;

      default:
        throw new Error(`Unknown source: ${source}`);
    }

    console.log(`[Unified Scraper] Scraped ${scrapeResults.length} records from ${source}`);

    // Insert to database with deduplication
    const tableName = getTableName(source);
    let recordsInserted = 0;
    let recordsUpdated = 0;
    let recordsFailed = 0;

    for (const record of scrapeResults) {
      try {
        // Generate content hash for deduplication
        const contentHash = generateContentHashForRecord(source, record);
        const recordWithHash = { ...record, content_hash: contentHash };

        // UPSERT: Insert if new, update last_seen if exists
        const { data, error } = await supabase
          .from(tableName)
          .upsert(recordWithHash, {
            onConflict: 'content_hash',
            ignoreDuplicates: false // Update last_seen on conflict
          })
          .select();

        if (error) {
          console.error(`[Unified Scraper] Insert error:`, error);
          recordsFailed++;
        } else {
          // Check if this was an insert or update
          if (data && data.length > 0) {
            const isNew = data[0].first_seen === data[0].last_seen;
            if (isNew) {
              recordsInserted++;
            } else {
              recordsUpdated++;
            }
          }
        }
      } catch (err) {
        console.error(`[Unified Scraper] Record processing error:`, err);
        recordsFailed++;
      }
    }

    const duration = Date.now() - startTime;

    // Log scraping execution
    await supabase.from('scrape_logs').insert({
      source,
      status: recordsFailed > 0 ? 'partial' : 'success',
      records_inserted: recordsInserted,
      records_updated: recordsUpdated,
      records_failed: recordsFailed,
      duration_ms: duration,
      started_at: new Date(startTime).toISOString(),
      completed_at: new Date().toISOString(),
      scraper_engine: scraperEngine,
      scraper_version: '1.0.0'
    });

    // Broadcast to Realtime (notify playground of new data)
    if (recordsInserted > 0 && !test_mode) {
      const channel = supabase.channel('scrape-updates');
      await channel.send({
        type: 'broadcast',
        event: 'new_data',
        payload: {
          source,
          records_inserted: recordsInserted,
          records_updated: recordsUpdated,
          timestamp: new Date().toISOString()
        }
      });
      await channel.unsubscribe();
    }

    // Response
    const response: ScraperResponse = {
      success: true,
      source,
      records_inserted: recordsInserted,
      records_updated: recordsUpdated,
      records_failed: recordsFailed,
      duration_ms: duration
    };

    console.log(`[Unified Scraper] Complete:`, response);

    return new Response(JSON.stringify(response), {
      headers: {
        'Content-Type': 'application/json',
        ...corsHeaders
      },
      status: 200
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[Unified Scraper] Error:', error);

    // Log error
    try {
      await supabase.from('scrape_logs').insert({
        source: 'unknown',
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
      console.error('[Unified Scraper] Failed to log error:', logError);
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        duration_ms: duration
      }),
      {
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders
        },
        status: 500
      }
    );
  }
});

// Helper: Get table name for source
function getTableName(source: string): string {
  const tableMap: Record<string, string> = {
    hksfc: 'hksfc_filings',
    hkex: 'hkex_announcements',
    ccass: 'hkex_ccass_holdings',
    legal: 'legal_cases',
    npm: 'npm_packages_scraped',
    llm: 'llm_configs'
  };
  return tableMap[source] || 'unknown';
}

// Helper: Generate content hash based on source type
function generateContentHashForRecord(source: string, record: ScrapedRecord): string {
  switch (source) {
    case 'hksfc':
      return generateContentHash(
        record.title || '',
        record.content || '',
        record.url || ''
      );

    case 'hkex':
      return generateContentHash(
        record.announcement_title || '',
        record.announcement_content || '',
        record.url || ''
      );

    case 'ccass':
      return generateContentHash(
        record.stock_code || '',
        record.participant_id || '',
        (record.scraped_at || new Date()).toISOString().split('T')[0] // Date only, not timestamp
      );

    case 'legal':
      return generateContentHash(
        record.case_title || '',
        record.case_facts || '',
        record.url || ''
      );

    case 'npm':
      return generateContentHash(
        record.package_name || '',
        record.package_version || '',
        record.npm_url || ''
      );

    case 'llm':
      return generateContentHash(
        record.model_name || '',
        record.provider || '',
        record.url || ''
      );

    default:
      return generateContentHash(JSON.stringify(record));
  }
}
