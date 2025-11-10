/**
 * Edge Function Client for Browser
 *
 * Client-side wrapper for calling the scrape-orchestrator Edge Function.
 * This allows browser-based scraping by delegating to serverless functions.
 */

import { supabase } from '../supabase';

// ============================================================================
// Types
// ============================================================================

export type ScrapingStrategy = 'auto' | 'firecrawl' | 'puppeteer';
export type DataSourceType = 'hkex-ccass' | 'hksfc-news' | 'npm-package' | 'custom';

export interface EdgeFunctionScrapeOptions {
  source: DataSourceType;
  strategy?: ScrapingStrategy;
  url?: string;
  stockCodes?: string[];
  packageName?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  maxRetries?: number;
  timeout?: number;
}

export interface EdgeFunctionResponse {
  success: boolean;
  data?: any;
  error?: string;
  executionTime: number;
  source: DataSourceType;
  strategy: 'firecrawl' | 'puppeteer';
  timestamp: string;
}

// ============================================================================
// Edge Function Client
// ============================================================================

export class EdgeFunctionScraper {
  private functionUrl: string;

  constructor() {
    // Supabase Edge Function URL
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
    this.functionUrl = `${supabaseUrl}/functions/v1/scrape-orchestrator`;
  }

  /**
   * Call the scrape orchestrator Edge Function
   */
  async scrape(options: EdgeFunctionScrapeOptions): Promise<EdgeFunctionResponse> {
    if (!supabase) {
      throw new Error('Supabase client not initialized');
    }

    try {
      console.log('[Edge Function Client] Sending request:', options);

      // Get auth token
      const { data: { session } } = await supabase.auth.getSession();

      const response = await fetch(this.functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          source: options.source,
          strategy: options.strategy || 'auto',
          options: {
            url: options.url,
            stockCodes: options.stockCodes,
            packageName: options.packageName,
            dateRange: options.dateRange,
            maxRetries: options.maxRetries || 3,
            timeout: options.timeout || 30000,
          },
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(
          errorData.error || `Edge Function error: ${response.status} ${response.statusText}`
        );
      }

      const result: EdgeFunctionResponse = await response.json();

      console.log('[Edge Function Client] Response:', {
        success: result.success,
        executionTime: result.executionTime,
        strategy: result.strategy,
      });

      return result;

    } catch (error) {
      console.error('[Edge Function Client] Error:', error);
      throw new Error(
        `Edge Function scraping failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Scrape HKEX CCASS data
   */
  async scrapeHKEXCCASS(
    stockCodes: string[],
    dateRange?: { start: string; end: string }
  ): Promise<EdgeFunctionResponse> {
    return this.scrape({
      source: 'hkex-ccass',
      stockCodes,
      dateRange,
    });
  }

  /**
   * Scrape HKSFC news
   */
  async scrapeHKSFCNews(
    dateRange?: { start: string; end: string },
    url?: string
  ): Promise<EdgeFunctionResponse> {
    return this.scrape({
      source: 'hksfc-news',
      url,
      dateRange,
    });
  }

  /**
   * Scrape NPM package data
   */
  async scrapeNPMPackage(packageName: string): Promise<EdgeFunctionResponse> {
    return this.scrape({
      source: 'npm-package',
      packageName,
    });
  }

  /**
   * Scrape custom URL
   */
  async scrapeCustomURL(
    url: string,
    strategy?: ScrapingStrategy
  ): Promise<EdgeFunctionResponse> {
    return this.scrape({
      source: 'custom',
      url,
      strategy,
    });
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let edgeFunctionScraperInstance: EdgeFunctionScraper | null = null;

export function getEdgeFunctionScraper(): EdgeFunctionScraper {
  if (!edgeFunctionScraperInstance) {
    edgeFunctionScraperInstance = new EdgeFunctionScraper();
  }
  return edgeFunctionScraperInstance;
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Scrape HKEX CCASS (browser-safe)
 */
export async function scrapeHKEXCCASSFromBrowser(
  stockCodes: string[],
  dateRange?: { start: string; end: string }
): Promise<any> {
  const scraper = getEdgeFunctionScraper();
  const result = await scraper.scrapeHKEXCCASS(stockCodes, dateRange);

  if (!result.success) {
    throw new Error(result.error || 'Scraping failed');
  }

  return result.data;
}

/**
 * Scrape HKSFC News (browser-safe)
 */
export async function scrapeHKSFCNewsFromBrowser(
  dateRange?: { start: string; end: string }
): Promise<any> {
  const scraper = getEdgeFunctionScraper();
  const result = await scraper.scrapeHKSFCNews(dateRange);

  if (!result.success) {
    throw new Error(result.error || 'Scraping failed');
  }

  return result.data;
}

/**
 * Scrape NPM Package (browser-safe)
 */
export async function scrapeNPMPackageFromBrowser(packageName: string): Promise<any> {
  const scraper = getEdgeFunctionScraper();
  const result = await scraper.scrapeNPMPackage(packageName);

  if (!result.success) {
    throw new Error(result.error || 'Scraping failed');
  }

  return result.data;
}
