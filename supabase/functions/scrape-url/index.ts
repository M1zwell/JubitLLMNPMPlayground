/**
 * Scrape URL Edge Function
 *
 * Universal web scraping endpoint using Firecrawl and Puppeteer
 *
 * Usage:
 * POST /functions/v1/scrape-url
 * {
 *   "url": "https://example.com",
 *   "options": {
 *     "method": "firecrawl" | "puppeteer" | "auto",
 *     "format": "markdown" | "html" | "text",
 *     "onlyMainContent": true,
 *     "screenshot": false
 *   }
 * }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

interface ScrapeRequest {
  url: string;
  options?: {
    method?: 'firecrawl' | 'puppeteer' | 'auto';
    format?: 'markdown' | 'html' | 'text';
    onlyMainContent?: boolean;
    screenshot?: boolean;
    timeout?: number;
  };
}

interface ScrapeResponse {
  success: boolean;
  url: string;
  content?: string;
  markdown?: string;
  html?: string;
  metadata?: {
    title?: string;
    description?: string;
    [key: string]: any;
  };
  links?: string[];
  images?: string[];
  screenshot?: string;
  source: 'firecrawl' | 'puppeteer';
  timestamp: string;
  error?: string;
}

/**
 * Scrape using Firecrawl API
 */
async function scrapeWithFirecrawl(
  url: string,
  options: ScrapeRequest['options'] = {}
): Promise<ScrapeResponse> {
  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');

  if (!apiKey) {
    throw new Error('FIRECRAWL_API_KEY environment variable not set');
  }

  const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url,
      formats: [options.format || 'markdown'],
      onlyMainContent: options.onlyMainContent ?? true,
      timeout: options.timeout || 30000,
      screenshot: options.screenshot || false,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Firecrawl API error: ${error}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(data.error || 'Firecrawl scraping failed');
  }

  return {
    success: true,
    url,
    content: data.data?.markdown || data.data?.content,
    markdown: data.data?.markdown,
    html: data.data?.html,
    metadata: data.data?.metadata,
    links: data.data?.links,
    screenshot: data.data?.screenshot,
    source: 'firecrawl',
    timestamp: new Date().toISOString(),
  };
}

/**
 * Scrape using Puppeteer (headless Chrome)
 * Note: Requires puppeteer to be installed in Deno
 */
async function scrapeWithPuppeteer(
  url: string,
  options: ScrapeRequest['options'] = {}
): Promise<ScrapeResponse> {
  // For Deno, we would use a different approach
  // This is a placeholder - Puppeteer in Deno requires special setup
  throw new Error(
    'Puppeteer scraping in Edge Functions requires additional setup. Use Firecrawl instead.'
  );
}

/**
 * Main handler
 */
serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Parse request
    const { url, options }: ScrapeRequest = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Validate URL
    try {
      new URL(url);
    } catch {
      return new Response(
        JSON.stringify({ error: 'Invalid URL format' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Scraping URL: ${url} with method: ${options?.method || 'auto'}`);

    let result: ScrapeResponse;

    // Determine scraping method
    const method = options?.method || 'auto';

    if (method === 'firecrawl' || method === 'auto') {
      // Try Firecrawl first
      try {
        result = await scrapeWithFirecrawl(url, options);
      } catch (error) {
        if (method === 'firecrawl') {
          throw error;
        }
        // If auto mode, fallback to puppeteer
        console.log('Firecrawl failed, falling back to Puppeteer');
        result = await scrapeWithPuppeteer(url, options);
      }
    } else {
      // Use Puppeteer
      result = await scrapeWithPuppeteer(url, options);
    }

    // Return result
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Scraping error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
