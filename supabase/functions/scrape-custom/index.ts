/**
 * Custom Scrapers Edge Function
 *
 * Specialized scraping endpoints for:
 * - Product data
 * - News articles
 * - SEO data
 * - Social media posts
 *
 * Usage:
 * POST /functions/v1/scrape-custom
 * {
 *   "type": "product" | "article" | "seo" | "social",
 *   "url": "https://example.com"
 * }
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders } from '../_shared/cors.ts';

interface CustomScrapeRequest {
  type: 'product' | 'article' | 'seo' | 'social';
  url: string;
}

interface ProductData {
  title: string;
  price?: string;
  description?: string;
  images: string[];
  availability?: string;
  brand?: string;
  url: string;
  scrapedAt: string;
}

interface ArticleData {
  title: string;
  author?: string;
  publishedDate?: string;
  content: string;
  summary?: string;
  images: string[];
  url: string;
  scrapedAt: string;
}

interface SEOData {
  title: string;
  description: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  h1Tags: string[];
  wordCount: number;
  url: string;
  scrapedAt: string;
}

/**
 * Scrape product data using Firecrawl
 */
async function scrapeProduct(url: string): Promise<ProductData> {
  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');

  if (!apiKey) {
    throw new Error('FIRECRAWL_API_KEY not configured');
  }

  const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url,
      formats: ['markdown', 'html'],
      onlyMainContent: true,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to scrape product page');
  }

  const data = await response.json();

  // Extract product data from scraped content
  const html = data.data?.html || '';
  const metadata = data.data?.metadata || {};

  // Simple extraction (can be improved with AI)
  const title = metadata.title || '';
  const description = metadata.description || '';
  const images: string[] = [];

  // Extract images from links
  const imageRegex = /<img[^>]+src="([^">]+)"/g;
  let match;
  while ((match = imageRegex.exec(html)) !== null) {
    if (match[1].startsWith('http')) {
      images.push(match[1]);
    }
  }

  return {
    title,
    description,
    images: [...new Set(images)].slice(0, 10), // Limit to 10 unique images
    url,
    scrapedAt: new Date().toISOString(),
  };
}

/**
 * Scrape article data
 */
async function scrapeArticle(url: string): Promise<ArticleData> {
  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');

  if (!apiKey) {
    throw new Error('FIRECRAWL_API_KEY not configured');
  }

  const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url,
      formats: ['markdown'],
      onlyMainContent: true,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to scrape article');
  }

  const data = await response.json();
  const metadata = data.data?.metadata || {};
  const markdown = data.data?.markdown || '';

  return {
    title: metadata.title || metadata.ogTitle || '',
    author: metadata.author || '',
    publishedDate: metadata.publishedTime || '',
    content: markdown,
    summary: metadata.description || metadata.ogDescription || '',
    images: [],
    url,
    scrapedAt: new Date().toISOString(),
  };
}

/**
 * Extract SEO data
 */
async function scrapeSEO(url: string): Promise<SEOData> {
  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');

  if (!apiKey) {
    throw new Error('FIRECRAWL_API_KEY not configured');
  }

  const response = await fetch('https://api.firecrawl.dev/v0/scrape', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      url,
      formats: ['markdown', 'html'],
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to scrape SEO data');
  }

  const data = await response.json();
  const metadata = data.data?.metadata || {};
  const html = data.data?.html || '';
  const markdown = data.data?.markdown || '';

  // Extract H1 tags
  const h1Regex = /<h1[^>]*>(.*?)<\/h1>/gi;
  const h1Tags: string[] = [];
  let match;
  while ((match = h1Regex.exec(html)) !== null) {
    h1Tags.push(match[1].replace(/<[^>]+>/g, '').trim());
  }

  // Count words in markdown
  const wordCount = markdown.split(/\s+/).filter(Boolean).length;

  return {
    title: metadata.title || '',
    description: metadata.description || '',
    ogTitle: metadata.ogTitle,
    ogDescription: metadata.ogDescription,
    ogImage: metadata.ogImage,
    h1Tags,
    wordCount,
    url,
    scrapedAt: new Date().toISOString(),
  };
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
    const { type, url }: CustomScrapeRequest = await req.json();

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'URL is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!type) {
      return new Response(
        JSON.stringify({ error: 'Type is required (product, article, seo, social)' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    console.log(`Scraping ${type} from: ${url}`);

    let result: any;

    switch (type) {
      case 'product':
        result = await scrapeProduct(url);
        break;
      case 'article':
        result = await scrapeArticle(url);
        break;
      case 'seo':
        result = await scrapeSEO(url);
        break;
      case 'social':
        result = { error: 'Social media scraping not yet implemented' };
        break;
      default:
        throw new Error(`Unknown scrape type: ${type}`);
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Scraping error:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
