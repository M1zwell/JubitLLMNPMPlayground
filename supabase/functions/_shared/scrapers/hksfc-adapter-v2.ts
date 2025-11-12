// HKSFC Scraper Adapter V2
// Source: Hong Kong Securities & Futures Commission
// Engine: Firecrawl V2 API with direct URL scraping + JSON extraction
// Features: Multi-URL targeted scraping, structured data extraction, PDF support

import { fetchWithRetry } from '../utils/http-client.ts';

const FIRECRAWL_V2_BASE_URL = 'https://api.firecrawl.dev/v2';

// Target URLs for different types of HKSFC announcements
const HKSFC_URLS = [
  {
    url: 'https://apps.sfc.hk/edistributionWeb/gateway/EN/news-and-announcements/news/',
    type: 'news',
    description: 'English news and announcements'
  },
  {
    url: 'https://sc.sfc.hk/TuniS/apps.sfc.hk/edistributionWeb/gateway/TC/news-and-announcements/news/',
    type: 'news',
    description: 'Traditional Chinese news and announcements'
  },
  {
    url: 'https://sc.sfc.hk/TuniS/www.sfc.hk/TC/News-and-announcements/Decisions-statements-and-disclosures/Current-cold-shoulder-orders',
    type: 'enforcement',
    description: 'Cold shoulder orders'
  },
  {
    url: 'https://sc.sfc.hk/TuniS/www.sfc.hk/TC/News-and-announcements/High-shareholding-concentration-announcements',
    type: 'shareholding',
    description: 'High shareholding concentration announcements'
  },
  {
    url: 'https://sc.sfc.hk/TuniS/www.sfc.hk/TC/News-and-announcements/Policy-statements-and-announcements',
    type: 'policy',
    description: 'Policy statements and announcements'
  }
];

export interface HKSFCRecord {
  title: string;
  content?: string;
  summary?: string;
  filing_type: string;
  // category removed - not in database schema, stored in tags instead
  company_code?: string;
  company_name?: string;
  filing_date?: Date;
  // publish_date removed - not in database schema, using filing_date instead
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

// Scrape using Firecrawl V2 API with direct URL scraping + JSON extraction
async function scrapeWithFirecrawlV2(limit: number, apiKey: string): Promise<HKSFCRecord[]> {
  console.log('[HKSFC Adapter V2] Using Firecrawl V2 with direct multi-URL scraping');

  try {
    const records: HKSFCRecord[] = [];

    // Calculate how many records to get from each URL
    const recordsPerUrl = Math.ceil(limit / HKSFC_URLS.length);

    console.log(`[HKSFC Adapter V2] Scraping ${HKSFC_URLS.length} URLs (${recordsPerUrl} records per URL)`);

    // Scrape each target URL
    for (const source of HKSFC_URLS) {
      try {
        console.log(`[HKSFC Adapter V2] Scraping ${source.description} (${source.type})...`);

        const pageRecords = await scrapePageWithJSON(source.url, source.type, apiKey);
        records.push(...pageRecords.slice(0, recordsPerUrl));

        console.log(`[HKSFC Adapter V2] Extracted ${pageRecords.length} records from ${source.type}`);

        // Rate limiting between URLs
        if (HKSFC_URLS.indexOf(source) < HKSFC_URLS.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }

        // Stop if we have enough records
        if (records.length >= limit) break;

      } catch (error) {
        console.warn(`[HKSFC Adapter V2] Failed to scrape ${source.description}:`, error);
        continue;
      }
    }

    console.log(`[HKSFC Adapter V2] Total scraped: ${records.length} records from ${HKSFC_URLS.length} sources`);
    return records.slice(0, limit);

  } catch (error) {
    console.error('[HKSFC Adapter V2] Firecrawl V2 scraping failed:', error);
    throw error;
  }
}

// Scrape a single page with JSON extraction
async function scrapePageWithJSON(url: string, filingType: string, apiKey: string): Promise<HKSFCRecord[]> {
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

    // Use filing type from URL configuration (passed as parameter)
    // Can be overridden by article-specific filingType field
    let recordFilingType = filingType; // Use parameter as default
    if (article.filingType) {
      recordFilingType = article.filingType.toLowerCase();
    } else if (article.category) {
      // Map category to filing type if article specifies it
      const cat = article.category.toLowerCase();
      if (cat.includes('enforcement')) recordFilingType = 'enforcement';
      else if (cat.includes('corporate')) recordFilingType = 'corporate';
      else if (cat.includes('circular')) recordFilingType = 'circular';
      else if (cat.includes('regulatory')) recordFilingType = 'regulatory';
      else if (cat.includes('consultation')) recordFilingType = 'consultation';
      else if (cat.includes('shareholding')) recordFilingType = 'shareholding';
      else if (cat.includes('policy')) recordFilingType = 'policy';
    }

    // Use extracted company code or try to find it
    const companyCode = article.companyCode ||
                        article.title?.match(/\b(\d{4})\b/)?.[1] ||
                        article.summary?.match(/\b(\d{4})\b/)?.[1];

    return {
      title: article.title || 'Untitled',
      content: markdown.substring(0, 1000), // First 1000 chars of markdown
      summary: article.summary || '',
      filing_type: recordFilingType,
      // category: removed - not in database schema
      company_code: companyCode,
      company_name: article.companyName || (companyCode ? `Company ${companyCode}` : undefined),
      filing_date: filingDate,
      // publish_date: removed - not in database schema
      url: article.articleUrl || url,
      pdf_url: article.pdfUrl || links.find((link: string) => link.endsWith('.pdf')),
      tags: article.category ? [article.category, recordFilingType] : [recordFilingType]
    };
  });

  // Fallback: if no articles extracted, create one from the page
  if (records.length === 0 && markdown) {
    const titleMatch = markdown.match(/^#\s+(.+)$/m);
    records.push({
      title: titleMatch ? titleMatch[1] : `HKSFC ${filingType} Article`,
      content: markdown.substring(0, 500),
      filing_type: filingType, // Use the passed filingType parameter
      url
    });
  }

  return records;
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
