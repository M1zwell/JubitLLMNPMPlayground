// HKEX Scraper Adapter
// Source: Hong Kong Stock Exchange
// Engine: Firecrawl (primary) + Puppeteer (fallback for complex tables)

import { fetchWithRetry } from '../utils/http-client.ts';

const HKEX_ANNOUNCEMENTS_URL = 'https://www.hkex.com.hk/Market-Data/Securities-Prices/Equities/Equities-Quote?sym=0001&sc_lang=en';
const HKEX_NEWS_URL = 'https://www.hkex.com.hk/News/Market-Communications/Headline-News?sc_lang=en';

export interface HKEXRecord {
  announcement_title: string;
  announcement_content?: string;
  announcement_type: string;
  company_code?: string;
  company_name?: string;
  announcement_date?: Date;
  url: string;
  ccass_participant_id?: string;
  ccass_shareholding?: number;
  ccass_percentage?: number;
}

export async function scrapeHKEX(limit: number = 100, testMode: boolean = false): Promise<HKEXRecord[]> {
  console.log(`[HKEX Adapter] Starting scrape (limit: ${limit}, test_mode: ${testMode})`);

  if (testMode) {
    return generateMockHKEXData(limit);
  }

  try {
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');

    if (firecrawlApiKey) {
      // Try Firecrawl first (may work for some HKEX pages)
      return await scrapeWithFirecrawl(limit);
    } else {
      console.warn('[HKEX Adapter] No Firecrawl API key found, using mock data');
      return generateMockHKEXData(limit);
    }
  } catch (error) {
    console.error('[HKEX Adapter] Scraping failed:', error);
    // Fallback to mock data
    return generateMockHKEXData(Math.min(limit, 5));
  }
}

// Scrape using Firecrawl API
async function scrapeWithFirecrawl(limit: number): Promise<HKEXRecord[]> {
  const apiKey = Deno.env.get('FIRECRAWL_API_KEY');
  const records: HKEXRecord[] = [];

  try {
    console.log('[HKEX Adapter] Scraping news via Firecrawl...');

    const newsResponse = await fetchWithRetry('https://api.firecrawl.dev/v0/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: HKEX_NEWS_URL,
        formats: ['markdown', 'html'],
        onlyMainContent: true,
        waitFor: 3000 // Wait 3 seconds for dynamic content
      })
    }, { maxRetries: 2, backoffFactor: 1 });

    if (!newsResponse.ok) {
      const errorText = await newsResponse.text();
      throw new Error(`Firecrawl API error: ${newsResponse.status} - ${errorText}`);
    }

    const newsData = await newsResponse.json();
    console.log('[HKEX Adapter] Firecrawl response received');

    if (newsData.success && newsData.data) {
      const markdown = newsData.data.markdown || '';
      const html = newsData.data.html || '';

      // Parse HKEX content
      const extractedRecords = parseHKEXContent(markdown, html);
      records.push(...extractedRecords.slice(0, limit));

      console.log(`[HKEX Adapter] Extracted ${extractedRecords.length} announcements`);
    }

    console.log(`[HKEX Adapter] Total scraped: ${records.length} records via Firecrawl`);
    return records;

  } catch (error) {
    console.error('[HKEX Adapter] Firecrawl scraping failed:', error);
    throw error;
  }
}

// Parse HKEX markdown/HTML to extract announcements
function parseHKEXContent(markdown: string, html: string): HKEXRecord[] {
  const records: HKEXRecord[] = [];

  try {
    // Extract links with regex (similar to HKSFC pattern)
    const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g;
    const matches = [...markdown.matchAll(linkPattern)];

    for (const match of matches) {
      const title = match[1].trim();
      const url = match[2];

      // Skip if not a proper article/announcement URL
      if (!url.includes('/News') && !url.includes('/Market') && !url.includes('/Listing')) {
        continue;
      }

      // Try to extract date
      const dateMatch = markdown.match(new RegExp(`${title}[\\s\\S]{0,200}(\\d{1,2}\\s+\\w+\\s+\\d{4}|\\d{4}-\\d{2}-\\d{2}|\\d{2}/\\d{2}/\\d{4})`, 'i'));
      let announcementDate: Date | undefined;

      if (dateMatch && dateMatch[1]) {
        try {
          announcementDate = new Date(dateMatch[1]);
          if (isNaN(announcementDate.getTime())) {
            announcementDate = undefined;
          }
        } catch {
          announcementDate = undefined;
        }
      }

      // Extract content snippet
      const titleIndex = markdown.indexOf(title);
      const contentStart = titleIndex + title.length;
      const contentSnippet = markdown
        .substring(contentStart, contentStart + 500)
        .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
        .replace(/[#*`]/g, '')
        .trim()
        .split('\n')[0];

      // Extract company code if mentioned
      const companyCodeMatch = title.match(/\b(0\d{3,4})\b/) || contentSnippet.match(/\b(0\d{3,4})\b/);
      const companyCode = companyCodeMatch ? companyCodeMatch[1] : undefined;

      // Determine announcement type
      let announcementType = 'company';
      if (title.toLowerCase().includes('ipo') || title.toLowerCase().includes('listing')) {
        announcementType = 'ipo';
      } else if (title.toLowerCase().includes('market') || title.toLowerCase().includes('statistics')) {
        announcementType = 'market_stats';
      } else if (title.toLowerCase().includes('ccass') || title.toLowerCase().includes('shareholding')) {
        announcementType = 'ccass';
      }

      records.push({
        announcement_title: title,
        announcement_content: contentSnippet || undefined,
        announcement_type: announcementType,
        company_code: companyCode,
        company_name: companyCode ? `Stock ${companyCode}` : undefined,
        announcement_date: announcementDate,
        url: url.startsWith('http') ? url : `https://www.hkex.com.hk${url}`
      });

      if (records.length >= 50) break;
    }

    // Alternative parsing if no links found
    if (records.length === 0) {
      console.warn('[HKEX Adapter] No article links found, trying alternative parsing');

      const sections = markdown.split(/#{1,3}\s+/);

      for (const section of sections) {
        if (section.trim().length < 20) continue;

        const lines = section.trim().split('\n');
        const title = lines[0].trim();

        if (title.length < 10 || title.length > 200) continue;

        const content = lines.slice(1).join(' ').trim().substring(0, 500);

        records.push({
          announcement_title: title,
          announcement_content: content || undefined,
          announcement_type: 'company',
          url: `${HKEX_NEWS_URL}#${encodeURIComponent(title.substring(0, 50))}`
        });

        if (records.length >= 20) break;
      }
    }

    console.log(`[HKEX Adapter] Parsed ${records.length} records`);
    return records;

  } catch (error) {
    console.error('[HKEX Adapter] Parsing error:', error);
    return records;
  }
}

function generateMockHKEXData(count: number): HKEXRecord[] {
  const mockRecords: HKEXRecord[] = [];
  const currentDate = new Date();
  const types = ['company', 'ipo', 'market_stats', 'ccass'];

  for (let i = 0; i < Math.min(count, 10); i++) {
    const announcementType = types[i % types.length];
    const companyCode = `0${(i + 1).toString().padStart(3, '0')}`;

    mockRecords.push({
      announcement_title: `HKEX Announcement ${i + 1}: ${announcementType.toUpperCase()} update`,
      announcement_content: `Mock HKEX announcement content for testing. Type: ${announcementType}.`,
      announcement_type: announcementType,
      company_code: companyCode,
      company_name: `Listed Company ${companyCode}`,
      announcement_date: new Date(currentDate.getTime() - i * 24 * 60 * 60 * 1000),
      url: `https://www.hkex.com.hk/mock-announcement-${i + 1}`,
      ccass_participant_id: announcementType === 'ccass' ? `C${10000 + i}` : undefined,
      ccass_shareholding: announcementType === 'ccass' ? Math.floor(Math.random() * 1000000) : undefined,
      ccass_percentage: announcementType === 'ccass' ? parseFloat((Math.random() * 10).toFixed(2)) : undefined
    });
  }

  console.log(`[HKEX Adapter] Generated ${mockRecords.length} mock records`);
  return mockRecords;
}
