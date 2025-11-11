// HKEX CCASS Scraper Adapter
// Source: Hong Kong Stock Exchange - CCASS Participant Shareholding
// Engine: Firecrawl with Actions API (for SPA form interaction)

import { fetchWithRetry } from '../utils/http-client.ts';

const CCASS_URL = 'https://www.hkexnews.hk/sdw/search/searchsdw.aspx';

export interface CCassRecord {
  stock_code: string;
  stock_name?: string;
  participant_id: string;
  participant_name: string;
  shareholding: number;
  percentage: number;
  scraped_at?: Date;
}

export async function scrapeCCASS(
  stockCode: string = '00700',
  limit: number = 100,
  testMode: boolean = false
): Promise<CCassRecord[]> {
  console.log(`[CCASS Adapter] Starting scrape for stock ${stockCode} (limit: ${limit}, test_mode: ${testMode})`);

  if (testMode) {
    return generateMockCCASSData(stockCode, limit);
  }

  try {
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');

    if (!firecrawlApiKey) {
      console.warn('[CCASS Adapter] No Firecrawl API key found, using mock data');
      return generateMockCCASSData(stockCode, limit);
    }

    // Use Firecrawl with actions to interact with the SPA
    return await scrapeWithFirecrawlActions(stockCode, limit, firecrawlApiKey);

  } catch (error) {
    console.error('[CCASS Adapter] Scraping failed:', error);
    throw error;
  }
}

// Scrape using Firecrawl Actions API for SPA interaction
async function scrapeWithFirecrawlActions(
  stockCode: string,
  limit: number,
  apiKey: string
): Promise<CCassRecord[]> {
  console.log(`[CCASS Adapter] Using Firecrawl Actions for stock ${stockCode}`);

  try {
    // Get today's date in YYYY/MM/DD format
    const today = new Date();
    const dateStr = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;

    // Firecrawl Actions API request
    const response = await fetchWithRetry('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: CCASS_URL,
        formats: ['markdown', 'html'],
        onlyMainContent: false,
        waitFor: 3000,
        actions: [
          // Step 1: Click on "Shareholding" tab
          {
            type: 'click',
            selector: '#btnShowSH'
          },
          // Step 2: Wait for form to load
          {
            type: 'wait',
            milliseconds: 1000
          },
          // Step 3: Clear and fill stock code input
          {
            type: 'input',
            selector: '#txtStockCode',
            value: stockCode
          },
          // Step 4: Fill date input
          {
            type: 'input',
            selector: '#txtShareholdingDate',
            value: dateStr
          },
          // Step 5: Click search button
          {
            type: 'click',
            selector: '#btnSearch'
          },
          // Step 6: Wait for results table to load
          {
            type: 'wait',
            milliseconds: 5000
          }
        ]
      })
    }, { maxRetries: 2, backoffFactor: 2 });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Firecrawl API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[CCASS Adapter] Firecrawl actions response received');

    if (data.success && data.data) {
      const markdown = data.data.markdown || '';
      const html = data.data.html || '';

      // Parse the CCASS table from the response
      const records = parseCCASSTable(markdown, html, stockCode);

      console.log(`[CCASS Adapter] Extracted ${records.length} CCASS records`);
      return records.slice(0, limit);
    } else {
      throw new Error('Firecrawl scraping unsuccessful');
    }

  } catch (error) {
    console.error('[CCASS Adapter] Firecrawl actions failed:', error);
    throw error;
  }
}

// Parse CCASS table from markdown/HTML
function parseCCASSTable(markdown: string, html: string, stockCode: string): CCassRecord[] {
  const records: CCassRecord[] = [];

  try {
    console.log('[CCASS Adapter] Parsing CCASS table...');

    // CCASS table format (markdown):
    // | Participant ID | Participant Name | Shareholding | Percentage (%) |
    // |----------------|------------------|--------------|----------------|
    // | C00001         | HSBC Nominees    | 123,456,789  | 1.23           |

    // Extract table rows using regex
    const tableRowPattern = /\|\s*([BC]\d{5})\s*\|\s*([^|]+)\s*\|\s*([\d,]+)\s*\|\s*([\d.]+)\s*\|/gi;
    const matches = [...markdown.matchAll(tableRowPattern)];

    for (const match of matches) {
      const participantId = match[1].trim();
      const participantName = match[2].trim();
      const shareholdingStr = match[3].replace(/,/g, '').trim();
      const percentageStr = match[4].trim();

      const shareholding = parseInt(shareholdingStr, 10);
      const percentage = parseFloat(percentageStr);

      if (isNaN(shareholding) || isNaN(percentage)) {
        continue; // Skip invalid rows
      }

      records.push({
        stock_code: stockCode,
        participant_id: participantId,
        participant_name: participantName,
        shareholding: shareholding,
        percentage: percentage,
        scraped_at: new Date()
      });
    }

    // Alternative parsing from HTML if markdown parsing fails
    if (records.length === 0) {
      console.warn('[CCASS Adapter] Markdown parsing found no records, trying HTML parsing');

      // Try to extract from HTML table
      // Look for table rows with pattern: <td>C00001</td><td>Name</td><td>12345</td><td>1.23</td>
      const htmlRowPattern = /<tr[^>]*>[\s\S]*?<td[^>]*>\s*([BC]\d{5})\s*<\/td>[\s\S]*?<td[^>]*>\s*([^<]+)\s*<\/td>[\s\S]*?<td[^>]*>\s*([\d,]+)\s*<\/td>[\s\S]*?<td[^>]*>\s*([\d.]+)\s*<\/td>/gi;
      const htmlMatches = [...html.matchAll(htmlRowPattern)];

      for (const match of htmlMatches) {
        const participantId = match[1].trim();
        const participantName = match[2].trim();
        const shareholdingStr = match[3].replace(/,/g, '').trim();
        const percentageStr = match[4].trim();

        const shareholding = parseInt(shareholdingStr, 10);
        const percentage = parseFloat(percentageStr);

        if (isNaN(shareholding) || isNaN(percentage)) {
          continue;
        }

        records.push({
          stock_code: stockCode,
          participant_id: participantId,
          participant_name: participantName,
          shareholding: shareholding,
          percentage: percentage,
          scraped_at: new Date()
        });
      }
    }

    console.log(`[CCASS Adapter] Parsed ${records.length} records from table`);
    return records;

  } catch (error) {
    console.error('[CCASS Adapter] Table parsing error:', error);
    return records;
  }
}

// Generate mock CCASS data for testing
function generateMockCCASSData(stockCode: string, count: number): CCassRecord[] {
  const mockRecords: CCassRecord[] = [];
  const participantNames = [
    'HSBC Nominees Limited',
    'Bank of China (Hong Kong) Nominees',
    'HKSCC Nominees Limited',
    'JPMorgan Chase Bank',
    'Citibank N.A.',
    'Standard Chartered Bank (HK) Limited',
    'Deutsche Bank AG',
    'BNP Paribas Securities Services',
    'State Street Bank and Trust Company',
    'The Northern Trust Company'
  ];

  for (let i = 0; i < Math.min(count, 10); i++) {
    const participantId = `C${String(i + 1).padStart(5, '0')}`;
    const participantName = participantNames[i % participantNames.length];
    const shareholding = Math.floor(Math.random() * 10000000) + 100000;
    const percentage = parseFloat((Math.random() * 5 + 0.5).toFixed(2));

    mockRecords.push({
      stock_code: stockCode,
      participant_id: participantId,
      participant_name: participantName,
      shareholding: shareholding,
      percentage: percentage,
      scraped_at: new Date()
    });
  }

  console.log(`[CCASS Adapter] Generated ${mockRecords.length} mock CCASS records for ${stockCode}`);
  return mockRecords;
}
