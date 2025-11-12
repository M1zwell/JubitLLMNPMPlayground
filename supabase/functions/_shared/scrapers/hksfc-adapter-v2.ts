// HKSFC Scraper Adapter V2
// Source: Hong Kong Securities & Futures Commission
// Engine: Firecrawl V2 API with Map endpoint + JSON extraction
// Features: URL discovery, structured data extraction, PDF support

import { fetchWithRetry } from '../utils/http-client.ts';

const HKSFC_NEWS_BASE_URL = 'https://www.sfc.hk/en/News-and-announcements';
const FIRECRAWL_V2_BASE_URL = 'https://api.firecrawl.dev/v2';

export interface HKSFCRecord {
  title: string;
  content?: string;
  summary?: string;
  filing_type: string;
  category?: string;
  company_code?: string;
  company_name?: string;
  filing_date?: Date;
  publish_date?: string;
  url: string;
  pdf_url?: string;
  tags?: string[];
}

export async function scrapeHKSFC(limit: number = 100, testMode: boolean = false): Promise<HKSFCRecord[]> {
  console.log(`[HKSFC Adapter V2] Starting scrape (limit: ${limit}, test_mode: ${testMode})`);

  if (testMode) {
    return generateMockHKSFCData(limit);
  }

  try {
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');

    if (!firecrawlApiKey) {
      console.warn('[HKSFC Adapter V2] No Firecrawl API key found, using mock data');
      return generateMockHKSFCData(limit);
    }

    // Use advanced Firecrawl V2 features
    return await scrapeWithFirecrawlV2(limit, firecrawlApiKey);

  } catch (error) {
    console.error('[HKSFC Adapter V2] Scraping failed:', error);
    throw error;
  }
}

// Scrape using Firecrawl V2 API with Map + JSON extraction
async function scrapeWithFirecrawlV2(limit: number, apiKey: string): Promise<HKSFCRecord[]> {
  console.log('[HKSFC Adapter V2] Using Firecrawl V2 with Map + JSON extraction');

  try {
    // Step 1: Discover news URLs using Map endpoint
    console.log('[HKSFC Adapter V2] Step 1: Discovering URLs with Map endpoint...');

    const mapResponse = await fetchWithRetry(`${FIRECRAWL_V2_BASE_URL}/map`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: HKSFC_NEWS_BASE_URL,
        search: 'news',
        limit: Math.min(limit * 2, 50), // Discover more URLs than needed
        includeSubdomains: false
      })
    }, { maxRetries: 2, backoffFactor: 1 });

    if (!mapResponse.ok) {
      const errorText = await mapResponse.text();
      throw new Error(`Firecrawl Map API error: ${mapResponse.status} - ${errorText}`);
    }

    const mapData = await mapResponse.json();

    if (!mapData.success) {
      throw new Error(`Map discovery failed: ${mapData.error || 'Unknown error'}`);
    }

    // Extract URLs from map results
    const linksData = mapData.data?.links || mapData.links || [];
    const urls = linksData.map((link: any) =>
      typeof link === 'string' ? link : link.url
    ).filter((url: string) =>
      url.includes('/News/') || url.includes('/news/')
    );

    console.log(`[HKSFC Adapter V2] Discovered ${urls.length} news URLs`);

    if (urls.length === 0) {
      console.warn('[HKSFC Adapter V2] No URLs discovered, falling back to direct scraping');
      return await scrapeDirectWithJSON(HKSFC_NEWS_BASE_URL, apiKey, limit);
    }

    // Step 2: Scrape discovered URLs with JSON extraction
    console.log('[HKSFC Adapter V2] Step 2: Scraping URLs with JSON extraction...');

    const records: HKSFCRecord[] = [];
    const urlsToScrape = urls.slice(0, Math.min(limit, 10)); // Limit API calls

    for (const url of urlsToScrape) {
      try {
        const pageRecords = await scrapePageWithJSON(url, apiKey);
        records.push(...pageRecords);

        // Rate limiting
        if (urlsToScrape.indexOf(url) < urlsToScrape.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Stop if we have enough records
        if (records.length >= limit) break;

      } catch (error) {
        console.warn(`[HKSFC Adapter V2] Failed to scrape ${url}:`, error);
        continue;
      }
    }

    console.log(`[HKSFC Adapter V2] Total scraped: ${records.length} records`);
    return records.slice(0, limit);

  } catch (error) {
    console.error('[HKSFC Adapter V2] Firecrawl V2 scraping failed:', error);
    throw error;
  }
}

// Scrape a single page with JSON extraction
async function scrapePageWithJSON(url: string, apiKey: string): Promise<HKSFCRecord[]> {
  const response = await fetchWithRetry(`${FIRECRAWL_V2_BASE_URL}/scrape`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url,
      formats: [
        'markdown',
        {
          type: 'json',
          prompt: `Extract all news articles, announcements, and press releases from this Hong Kong SFC page.

                   For each article, carefully extract:
                   - title: The main headline or article title (exact text, no truncation)
                   - publishDate: Publication or filing date in YYYY-MM-DD format (e.g., "2025-01-15"). If you see formats like "15 Jan 2025" or "15/01/2025", convert them to ISO format
                   - category: Article type - must be one of: "enforcement", "corporate", "regulatory", "circular", "consultation", "speech", "media release", or "news". Look for keywords in the title or content
                   - summary: A concise 1-2 sentence summary capturing the key point (20-50 words). If no summary is visible, extract the first paragraph
                   - companyCode: Hong Kong stock code if mentioned (4-digit format like "0700" or "2388"). Look in title and content
                   - companyName: Company name if mentioned (exact name as written)
                   - filingType: Specific filing type like "Disciplinary Action", "Circular", "Press Release", etc.
                   - pdfUrl: Full URL to any PDF document (must start with http:// or https://)
                   - articleUrl: Full URL to the article page if it differs from the current URL

                   Important guidelines:
                   - Extract ALL articles visible on the page, not just the first one
                   - Dates must be in YYYY-MM-DD format (convert if necessary)
                   - Stock codes are 4 digits (e.g., "0700" not "700")
                   - Include articles even if some fields are missing
                   - If an article has multiple dates, use the publication/announcement date`,
          schema: {
            type: 'object',
            properties: {
              articles: {
                type: 'array',
                description: 'Array of all news articles found on the page',
                items: {
                  type: 'object',
                  properties: {
                    title: {
                      type: 'string',
                      description: 'Article headline or title (required)'
                    },
                    publishDate: {
                      type: 'string',
                      description: 'Publication date in YYYY-MM-DD format (ISO 8601)',
                      pattern: '^\\d{4}-\\d{2}-\\d{2}$'
                    },
                    category: {
                      type: 'string',
                      description: 'Article category (enforcement, corporate, regulatory, etc.)',
                      enum: ['enforcement', 'corporate', 'regulatory', 'circular', 'consultation', 'speech', 'media release', 'news']
                    },
                    summary: {
                      type: 'string',
                      description: 'Brief 1-2 sentence summary (20-50 words)'
                    },
                    companyCode: {
                      type: 'string',
                      description: 'Hong Kong stock code if mentioned (4-digit format like "0700")',
                      pattern: '^\\d{4}$'
                    },
                    companyName: {
                      type: 'string',
                      description: 'Company name if mentioned in the article'
                    },
                    filingType: {
                      type: 'string',
                      description: 'Specific filing or document type (e.g., "Disciplinary Action", "Circular")'
                    },
                    pdfUrl: {
                      type: 'string',
                      description: 'Full URL to PDF document if available',
                      format: 'uri'
                    },
                    articleUrl: {
                      type: 'string',
                      description: 'Full URL to the article page',
                      format: 'uri'
                    }
                  },
                  required: ['title']
                }
              }
            },
            required: ['articles']
          }
        }
      ],
      includeTags: ['article', 'main', '.news-content', '.article-body', 'h1', 'h2', 'p', 'time', '.date', 'a[href$=".pdf"]'],
      excludeTags: ['nav', 'footer', '#header', '.advertisement', '.sidebar'],
      onlyMainContent: true,
      waitFor: 1000,
      timeout: 45000,
      maxAge: 0, // Always fetch fresh
      parsers: ['pdf']
    })
  }, { maxRetries: 2, backoffFactor: 2 });

  if (!response.ok) {
    throw new Error(`Scrape failed: ${response.status}`);
  }

  const data = await response.json();

  if (!data.success) {
    throw new Error(`Scrape unsuccessful: ${data.error || 'Unknown error'}`);
  }

  // Extract structured data
  const jsonData = data.data?.json || data.data?.extract || {};
  const articles = jsonData.articles || [];
  const markdown = data.data?.markdown || '';
  const links = data.data?.links || [];

  // Convert to HKSFCRecord format
  const records: HKSFCRecord[] = articles.map((article: any) => {
    // Parse date
    let filingDate: Date | undefined;
    if (article.publishDate) {
      try {
        filingDate = new Date(article.publishDate);
        if (isNaN(filingDate.getTime())) filingDate = undefined;
      } catch {
        filingDate = undefined;
      }
    }

    // Determine filing type from category or filingType field
    let filingType = 'news';
    if (article.filingType) {
      filingType = article.filingType.toLowerCase();
    } else if (article.category) {
      const cat = article.category.toLowerCase();
      if (cat.includes('enforcement')) filingType = 'enforcement';
      else if (cat.includes('corporate')) filingType = 'corporate';
      else if (cat.includes('circular')) filingType = 'circular';
      else if (cat.includes('regulatory')) filingType = 'regulatory';
      else if (cat.includes('consultation')) filingType = 'consultation';
    }

    // Use extracted company code or try to find it
    const companyCode = article.companyCode ||
                        article.title?.match(/\b(\d{4})\b/)?.[1] ||
                        article.summary?.match(/\b(\d{4})\b/)?.[1];

    return {
      title: article.title || 'Untitled',
      content: markdown.substring(0, 1000), // First 1000 chars of markdown
      summary: article.summary || '',
      filing_type: filingType,
      category: article.category || filingType,
      company_code: companyCode,
      company_name: article.companyName || (companyCode ? `Company ${companyCode}` : undefined),
      filing_date: filingDate,
      publish_date: article.publishDate || undefined,
      url: article.articleUrl || url,
      pdf_url: article.pdfUrl || links.find((link: string) => link.endsWith('.pdf')),
      tags: article.category ? [article.category, filingType] : [filingType]
    };
  });

  // Fallback: if no articles extracted, create one from the page
  if (records.length === 0 && markdown) {
    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    records.push({
      title: titleMatch ? titleMatch[1] : 'HKSFC News Article',
      content: markdown.substring(0, 500),
      filing_type: 'news',
      url
    });
  }

  return records;
}

// Direct scraping with JSON extraction (fallback)
async function scrapeDirectWithJSON(url: string, apiKey: string, limit: number): Promise<HKSFCRecord[]> {
  console.log('[HKSFC Adapter V2] Using direct scraping with JSON extraction');

  const response = await fetchWithRetry(`${FIRECRAWL_V2_BASE_URL}/scrape`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url,
      formats: [
        'markdown',
        'links',
        {
          type: 'json',
          prompt: `Extract all news articles visible on this page. Return an array of articles with title, date, category, and summary.`,
          schema: {
            type: 'object',
            properties: {
              articles: {
                type: 'array',
                items: {
                  type: 'object',
                  properties: {
                    title: { type: 'string' },
                    date: { type: 'string' },
                    category: { type: 'string' },
                    summary: { type: 'string' },
                    url: { type: 'string' }
                  }
                }
              }
            }
          }
        }
      ],
      includeTags: ['article', '.news-item', '.list-item', 'h2', 'h3', 'time'],
      excludeTags: ['nav', 'footer'],
      onlyMainContent: true,
      waitFor: 2000,
      timeout: 45000,
      maxAge: 0
    })
  }, { maxRetries: 2, backoffFactor: 2 });

  if (!response.ok) {
    throw new Error(`Direct scrape failed: ${response.status}`);
  }

  const data = await response.json();
  const jsonData = data.data?.json || {};
  const articles = jsonData.articles || [];

  return articles.slice(0, limit).map((article: any) => ({
    title: article.title || 'Untitled',
    summary: article.summary || '',
    filing_type: article.category?.toLowerCase().includes('enforcement') ? 'enforcement' : 'news',
    category: article.category || 'news',
    filing_date: article.date ? new Date(article.date) : undefined,
    url: article.url || url
  }));
}

// Generate mock data for testing
function generateMockHKSFCData(count: number): HKSFCRecord[] {
  const mockRecords: HKSFCRecord[] = [];
  const currentDate = new Date();

  for (let i = 0; i < Math.min(count, 10); i++) {
    const filingType = i % 3 === 0 ? 'enforcement' : 'news';
    const companyCode = i % 2 === 0 ? `000${i + 1}` : undefined;

    mockRecords.push({
      title: `HKSFC ${filingType} ${i + 1}: Mock article about financial regulation`,
      content: `This is mock content for testing purposes. Article ${i + 1} discusses regulatory matters related to Hong Kong securities market.`,
      summary: `Mock summary for article ${i + 1}`,
      filing_type: filingType,
      category: filingType,
      company_code: companyCode,
      company_name: companyCode ? `Company ${companyCode}` : undefined,
      filing_date: new Date(currentDate.getTime() - i * 24 * 60 * 60 * 1000),
      url: `https://www.sfc.hk/en/News-and-announcements/mock-article-${i + 1}`,
      tags: [filingType, 'mock']
    });
  }

  console.log(`[HKSFC Adapter V2] Generated ${mockRecords.length} mock records`);
  return mockRecords;
}
