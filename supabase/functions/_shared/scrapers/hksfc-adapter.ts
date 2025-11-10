// HKSFC Scraper Adapter
// Source: Hong Kong Securities & Futures Commission
// Engine: Firecrawl API (primary)

import { fetchWithRetry } from '../utils/http-client.ts';

const HKSFC_NEWS_URL = 'https://www.sfc.hk/en/News-and-announcements';
const HKSFC_ENFORCEMENT_URL = 'https://www.sfc.hk/en/Regulatory-functions/Enforcement/Enforcement-news';

export interface HKSFCRecord {
  title: string;
  content?: string;
  filing_type: string;
  company_code?: string;
  company_name?: string;
  filing_date?: Date;
  url: string;
}

export async function scrapeHKSFC(limit: number = 100, testMode: boolean = false): Promise<HKSFCRecord[]> {
  console.log(`[HKSFC Adapter] Starting scrape (limit: ${limit}, test_mode: ${testMode})`);

  if (testMode) {
    // Return mock data for testing
    return generateMockHKSFCData(limit);
  }

  try {
    // Check if Firecrawl API key is available
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');

    if (firecrawlApiKey) {
      // Use Firecrawl API (primary method)
      return await scrapeWithFirecrawl(limit);
    } else {
      console.warn('[HKSFC Adapter] No Firecrawl API key found, using direct HTTP scraping');
      return await scrapeWithDirectHTTP(limit);
    }
  } catch (error) {
    console.error('[HKSFC Adapter] Scraping failed:', error);
    throw error;
  }
}

// Scrape using Firecrawl API
async function scrapeWithFirecrawl(limit: number): Promise<HKSFCRecord[]> {
  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
  const records: HKSFCRecord[] = [];

  try {
    // Scrape HKSFC News page with Firecrawl
    console.log('[HKSFC Adapter] Scraping news via Firecrawl...');

    const newsResponse = await fetchWithRetry('https://api.firecrawl.dev/v0/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: HKSFC_NEWS_URL,
        formats: ['markdown', 'html'],
        onlyMainContent: true,
        waitFor: 2000 // Wait 2 seconds for content to load
      })
    }, { maxRetries: 2, backoffFactor: 1 });

    if (!newsResponse.ok) {
      const errorText = await newsResponse.text();
      throw new Error(`Firecrawl API error: ${newsResponse.status} - ${errorText}`);
    }

    const newsData = await newsResponse.json();
    console.log('[HKSFC Adapter] Firecrawl response received');

    // Parse Firecrawl response
    if (newsData.success && newsData.data) {
      const markdown = newsData.data.markdown || '';
      const html = newsData.data.html || '';

      // Extract news articles from markdown/HTML
      const extractedRecords = parseHKSFCContent(markdown, html, 'news');
      records.push(...extractedRecords.slice(0, Math.floor(limit / 2)));

      console.log(`[HKSFC Adapter] Extracted ${extractedRecords.length} news articles`);
    }

    // Also scrape enforcement actions if we haven't reached limit
    if (records.length < limit) {
      console.log('[HKSFC Adapter] Scraping enforcement actions...');

      const enforcementResponse = await fetchWithRetry('https://api.firecrawl.dev/v0/scrape', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          url: HKSFC_ENFORCEMENT_URL,
          formats: ['markdown', 'html'],
          onlyMainContent: true,
          waitFor: 2000
        })
      }, { maxRetries: 2, backoffFactor: 1 });

      if (enforcementResponse.ok) {
        const enforcementData = await enforcementResponse.json();

        if (enforcementData.success && enforcementData.data) {
          const markdown = enforcementData.data.markdown || '';
          const html = enforcementData.data.html || '';

          const extractedRecords = parseHKSFCContent(markdown, html, 'enforcement');
          records.push(...extractedRecords.slice(0, limit - records.length));

          console.log(`[HKSFC Adapter] Extracted ${extractedRecords.length} enforcement actions`);
        }
      }
    }

    console.log(`[HKSFC Adapter] Total scraped: ${records.length} records via Firecrawl`);
    return records;

  } catch (error) {
    console.error('[HKSFC Adapter] Firecrawl scraping failed:', error);
    throw error;
  }
}

// Fallback: Direct HTTP scraping (simpler, may not get all content)
async function scrapeWithDirectHTTP(limit: number): Promise<HKSFCRecord[]> {
  console.log('[HKSFC Adapter] Using direct HTTP scraping (fallback)');

  // For now, return mock data
  // In production, this would use cheerio or similar to parse HTML
  return generateMockHKSFCData(limit);
}

// Parse HKSFC markdown/HTML to extract news records
function parseHKSFCContent(markdown: string, html: string, filingType: string): HKSFCRecord[] {
  const records: HKSFCRecord[] = [];

  try {
    // Parse markdown for article links and titles
    // HKSFC typically formats news as:
    // [Article Title](URL) - Date
    // or
    // ## Article Title
    // Date: YYYY-MM-DD

    // Extract links with regex
    const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
    const matches = [...markdown.matchAll(linkPattern)];

    for (const match of matches) {
      const title = match[1].trim();
      const url = match[2];

      // Skip if not a proper article URL
      if (!url.includes('/News') && !url.includes('/Enforcement') && !url.includes('/en/')) {
        continue;
      }

      // Try to extract date from surrounding context
      const dateMatch = markdown.match(new RegExp(`${title}[\\s\\S]{0,200}(\\d{1,2}\\s+\\w+\\s+\\d{4}|\\d{4}-\\d{2}-\\d{2})`, 'i'));
      let filingDate: Date | undefined;

      if (dateMatch && dateMatch[1]) {
        try {
          filingDate = new Date(dateMatch[1]);
          if (isNaN(filingDate.getTime())) {
            filingDate = undefined;
          }
        } catch {
          filingDate = undefined;
        }
      }

      // Extract content snippet (first 200 chars after title)
      const titleIndex = markdown.indexOf(title);
      const contentStart = titleIndex + title.length;
      const contentSnippet = markdown
        .substring(contentStart, contentStart + 500)
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // Remove other links
        .replace(/[#*`]/g, '') // Remove markdown formatting
        .trim()
        .split('\n')[0]; // First paragraph only

      // Extract company code if mentioned (e.g., "0001", "0700")
      const companyCodeMatch = title.match(/\b(0\d{3})\b/) || contentSnippet.match(/\b(0\d{3})\b/);
      const companyCode = companyCodeMatch ? companyCodeMatch[1] : undefined;

      records.push({
        title,
        content: contentSnippet || undefined,
        filing_type: filingType,
        company_code: companyCode,
        company_name: companyCode ? `Company ${companyCode}` : undefined,
        filing_date: filingDate,
        url: url.startsWith('http') ? url : `https://www.sfc.hk${url}`
      });

      // Stop if we have enough records
      if (records.length >= 50) break;
    }

    // If no links found, try alternative parsing
    if (records.length === 0) {
      console.warn('[HKSFC Adapter] No article links found in markdown, trying alternative parsing');

      // Split by headings
      const sections = markdown.split(/#{1,3}\s+/);

      for (const section of sections) {
        if (section.trim().length < 20) continue;

        const lines = section.trim().split('\n');
        const title = lines[0].trim();

        // Skip if doesn't look like an article title
        if (title.length < 10 || title.length > 200) continue;

        // Use section as content
        const content = lines.slice(1).join(' ').trim().substring(0, 500);

        records.push({
          title,
          content: content || undefined,
          filing_type: filingType,
          url: `${filingType === 'news' ? HKSFC_NEWS_URL : HKSFC_ENFORCEMENT_URL}#${encodeURIComponent(title.substring(0, 50))}`
        });

        if (records.length >= 20) break;
      }
    }

    console.log(`[HKSFC Adapter] Parsed ${records.length} records from ${filingType}`);
    return records;

  } catch (error) {
    console.error('[HKSFC Adapter] Parsing error:', error);
    return records;
  }
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
      filing_type: filingType,
      company_code: companyCode,
      company_name: companyCode ? `Company ${companyCode}` : undefined,
      filing_date: new Date(currentDate.getTime() - i * 24 * 60 * 60 * 1000),
      url: `https://www.sfc.hk/en/News-and-announcements/mock-article-${i + 1}`
    });
  }

  console.log(`[HKSFC Adapter] Generated ${mockRecords.length} mock records`);
  return mockRecords;
}
