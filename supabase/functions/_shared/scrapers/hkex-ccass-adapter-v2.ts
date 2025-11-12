// HKEX CCASS Scraper Adapter V2
// Source: Hong Kong Stock Exchange - CCASS Participant Shareholding
// Engine: Firecrawl V2 with executeJavascript + JSON extraction
// Note: Uses JavaScript execution for reliable form submission

import { fetchWithRetry } from '../utils/http-client.ts';

const CCASS_URL = 'https://www3.hkexnews.hk/sdw/search/searchsdw.aspx';
const FIRECRAWL_V2_BASE_URL = 'https://api.firecrawl.dev/v2';

export interface CCassRecord {
  stock_code: string;
  stock_name?: string;
  participant_id: string;
  participant_name: string;
  address?: string;
  shareholding: number;
  percentage: number;
  data_date?: string;
  scraped_at?: Date;
}

export async function scrapeCCASS(
  stockCode: string = '00700',
  limit: number = 100,
  testMode: boolean = false
): Promise<CCassRecord[]> {
  console.log(`[CCASS Adapter V2] Starting scrape for stock ${stockCode} (limit: ${limit}, test_mode: ${testMode})`);

  if (testMode) {
    return generateMockCCASSData(stockCode, limit);
  }

  try {
    const firecrawlApiKey = Deno.env.get('FIRECRAWL_API_KEY');

    if (!firecrawlApiKey) {
      console.warn('[CCASS Adapter V2] No Firecrawl API key found, using mock data');
      return generateMockCCASSData(stockCode, limit);
    }

    // Use Firecrawl V2 with executeJavascript + JSON extraction
    return await scrapeWithFirecrawlV2(stockCode, limit, firecrawlApiKey);

  } catch (error) {
    console.error('[CCASS Adapter V2] Scraping failed:', error);
    // Return mock data on error to prevent total failure
    console.warn('[CCASS Adapter V2] Returning mock data due to error');
    return generateMockCCASSData(stockCode, Math.min(limit, 5));
  }
}

// Scrape using Firecrawl V2 with executeJavascript for form submission
async function scrapeWithFirecrawlV2(
  stockCode: string,
  limit: number,
  apiKey: string
): Promise<CCassRecord[]> {
  console.log(`[CCASS Adapter V2] Using Firecrawl V2 for stock ${stockCode}`);

  try {
    // Format inputs
    const formattedStockCode = stockCode.padStart(5, '0');
    const today = new Date();
    const dateStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

    console.log(`[CCASS Adapter V2] Stock: ${formattedStockCode}, Date: ${dateStr}`);

    // Firecrawl V2 API request with executeJavascript action
    const response = await fetchWithRetry(`${FIRECRAWL_V2_BASE_URL}/scrape`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: CCASS_URL,
        formats: [
          'markdown',
          {
            type: 'json',
            prompt: `Extract CCASS (Central Clearing and Settlement System) participant shareholding data from the results table.

                     Look for a data table showing participant shareholdings. The table typically has columns like:
                     "Participant ID", "Name of CCASS Participant", "Address", "Shareholding", "% of total"

                     For each row in the table, extract:
                     - participantId: Participant ID code (format: C00001, B00123, etc.) - exactly as shown, preserve leading zeros
                     - participantName: Full legal name of the participant/institution (e.g., "HSBC Nominees Limited", "Bank of China (Hong Kong) Nominees")
                     - address: Full address of the participant (may span multiple lines, include all details)
                     - shareholding: Total number of shares held by this participant
                       * IMPORTANT: Extract as a pure number (e.g., 123456789)
                       * Remove all commas, spaces, and formatting (e.g., "123,456,789" becomes 123456789)
                       * This should be an integer, not a string
                     - percentage: Percentage of total shares held by this participant
                       * IMPORTANT: Extract as a decimal number between 0 and 100 (e.g., 12.34 or 0.56)
                       * Remove the % symbol if present (e.g., "12.34%" becomes 12.34)
                       * Must be a number, not a string

                     Additionally, extract header information if visible:
                     - stockCode: The 5-digit stock code being queried (e.g., "00700" for Tencent)
                     - stockName: The company name (e.g., "TENCENT HOLDINGS LTD")
                     - dataDate: The shareholding data date in YYYY-MM-DD format

                     Important data conversion rules:
                     - Remove commas from numbers: "1,234,567" → 1234567
                     - Remove % symbols: "5.67%" → 5.67
                     - Preserve all digits and decimals accurately
                     - If a cell is empty or shows "-", omit that field
                     - Extract ALL rows from the table, not just the top participants`,
            schema: {
              type: 'object',
              properties: {
                stockCode: {
                  type: 'string',
                  description: '5-digit Hong Kong stock code (e.g., "00700")',
                  pattern: '^\\d{5}$'
                },
                stockName: {
                  type: 'string',
                  description: 'Full company name as listed on HKEX'
                },
                dataDate: {
                  type: 'string',
                  description: 'Shareholding data date in YYYY-MM-DD format',
                  pattern: '^\\d{4}-\\d{2}-\\d{2}$'
                },
                totalShares: {
                  type: 'number',
                  description: 'Total number of shares outstanding for the stock'
                },
                participants: {
                  type: 'array',
                  description: 'Array of CCASS participants with their shareholdings',
                  items: {
                    type: 'object',
                    properties: {
                      participantId: {
                        type: 'string',
                        description: 'CCASS Participant ID (e.g., C00001, B00123) - preserve leading zeros and exact format'
                      },
                      participantName: {
                        type: 'string',
                        description: 'Full legal name of the CCASS participant (bank, nominee, institution)'
                      },
                      address: {
                        type: 'string',
                        description: 'Complete address of the participant (may be multi-line)'
                      },
                      shareholding: {
                        type: 'number',
                        description: 'Number of shares held (integer, no commas or formatting)',
                        minimum: 0
                      },
                      percentage: {
                        type: 'number',
                        description: 'Percentage of total shares (decimal number 0-100, no % symbol)',
                        minimum: 0,
                        maximum: 100
                      }
                    },
                    required: ['participantId', 'participantName', 'shareholding', 'percentage']
                  }
                }
              },
              required: ['participants']
            }
          }
        ],
        actions: [
          { type: 'wait', milliseconds: 3000 },
          {
            type: 'executeJavascript',
            script: `
              // Fill stock code
              const stockInput = document.querySelector('input[name="txtStockCode"]');
              if (stockInput) {
                stockInput.value = '${formattedStockCode}';
                stockInput.dispatchEvent(new Event('input', { bubbles: true }));
              }

              // Fill date
              const dateInput = document.querySelector('input[name="txtShareholdingDate"]');
              if (dateInput) {
                dateInput.value = '${dateStr}';
                dateInput.dispatchEvent(new Event('input', { bubbles: true }));
              }

              // Wait a bit for form validation
              await new Promise(resolve => setTimeout(resolve, 500));

              // Click search button
              const searchBtn = document.querySelector('input[name="btnSearch"]');
              if (searchBtn) {
                searchBtn.click();
              }
            `
          },
          { type: 'wait', milliseconds: 5000 }
        ],
        includeTags: ['table.table-scroll', 'table.table-sort', '.mobile-list-body', 'tbody', 'tr', 'td', '.col-participant-id', '.col-participant-name', '.col-shareholding'],
        excludeTags: ['nav', 'footer', '#header', '.advertisement'],
        onlyMainContent: false,
        waitFor: 2000,
        timeout: 60000,
        maxAge: 0 // Always fetch fresh data
      })
    }, { maxRetries: 2, backoffFactor: 2 });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Firecrawl V2 API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    console.log('[CCASS Adapter V2] Firecrawl V2 response received');

    if (!data.success) {
      throw new Error(`Scraping failed: ${data.error || 'Unknown error'}`);
    }

    // Extract JSON data
    const jsonData = data.data?.json || data.data?.extract || {};
    const participants = jsonData.participants || [];
    const markdown = data.data?.markdown || '';

    console.log(`[CCASS Adapter V2] JSON extracted ${participants.length} participants`);

    // If JSON extraction failed, try fallback parsing
    if (participants.length === 0) {
      console.warn('[CCASS Adapter V2] JSON extraction returned 0 participants, trying fallback parsing');
      const fallbackRecords = parseCCASSMarkdown(markdown, stockCode);
      return fallbackRecords.slice(0, limit);
    }

    // Convert to CCassRecord format
    const records: CCassRecord[] = participants.map((p: any) => {
      // Parse shareholding - handle both numbers and strings with commas
      let shareholding = 0;
      if (typeof p.shareholding === 'number') {
        shareholding = p.shareholding;
      } else if (p.shareholding) {
        const cleanedShares = String(p.shareholding).replace(/[,\s]/g, '');
        shareholding = parseInt(cleanedShares, 10) || 0;
      }

      // Parse percentage - handle both numbers and strings with %
      let percentage = 0;
      if (typeof p.percentage === 'number') {
        percentage = p.percentage;
      } else if (p.percentage) {
        const cleanedPct = String(p.percentage).replace(/[%\s]/g, '');
        percentage = parseFloat(cleanedPct) || 0;
      }

      return {
        stock_code: jsonData.stockCode || formattedStockCode,
        stock_name: jsonData.stockName || undefined,
        participant_id: p.participantId || '',
        participant_name: p.participantName || '',
        address: p.address || undefined,
        shareholding,
        percentage,
        data_date: jsonData.dataDate || dateStr,
        scraped_at: new Date()
      };
    });

    // Validate records
    const validRecords = records.filter(r =>
      r.participant_id && r.participant_name && r.shareholding > 0
    );

    console.log(`[CCASS Adapter V2] Extracted ${validRecords.length} valid CCASS records`);
    return validRecords.slice(0, limit);

  } catch (error) {
    console.error('[CCASS Adapter V2] Firecrawl V2 scraping failed:', error);
    throw error;
  }
}

// Fallback: Parse CCASS markdown manually
function parseCCASSMarkdown(markdown: string, stockCode: string): CCassRecord[] {
  const records: CCassRecord[] = [];

  try {
    console.log('[CCASS Adapter V2] Fallback: Parsing markdown manually');

    // Look for table rows with participant data
    // Pattern: | C00001 | HSBC Nominees | Address | 123,456,789 | 1.23% |
    const rowPattern = /\|\s*([BC]\d{5})\s*\|\s*([^|]+?)\s*\|\s*([^|]*?)\s*\|\s*([\d,]+)\s*\|\s*([\d.]+)%?\s*\|/gi;
    const matches = [...markdown.matchAll(rowPattern)];

    for (const match of matches) {
      const participantId = match[1].trim();
      const participantName = match[2].trim();
      const address = match[3].trim();
      const shareholdingStr = match[4].replace(/,/g, '');
      const percentageStr = match[5];

      const shareholding = parseInt(shareholdingStr, 10);
      const percentage = parseFloat(percentageStr);

      if (!isNaN(shareholding) && !isNaN(percentage)) {
        records.push({
          stock_code: stockCode,
          participant_id: participantId,
          participant_name: participantName,
          address: address || undefined,
          shareholding,
          percentage,
          scraped_at: new Date()
        });
      }
    }

    console.log(`[CCASS Adapter V2] Fallback parsing found ${records.length} records`);

  } catch (error) {
    console.error('[CCASS Adapter V2] Fallback parsing error:', error);
  }

  return records;
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
      address: `Mock Address ${i + 1}, Hong Kong`,
      shareholding: shareholding,
      percentage: percentage,
      scraped_at: new Date()
    });
  }

  console.log(`[CCASS Adapter V2] Generated ${mockRecords.length} mock CCASS records for ${stockCode}`);
  return mockRecords;
}
