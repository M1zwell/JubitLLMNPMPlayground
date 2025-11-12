/**
 * Advanced HKEX CCASS Scraper with Firecrawl V2
 *
 * Features:
 * - JSON format extraction with schema
 * - Actions API for form submission
 * - Better targeting with includeTags/excludeTags
 * - Increased timeouts for slow pages
 * - Fresh data (maxAge: 0)
 */

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || 'fc-7f04517bc6ef43d68c06316d5f69b91e';
const HKEX_CCASS_URL = 'https://www3.hkexnews.hk/sdw/search/searchsdw.aspx';

/**
 * Format stock code to 5 digits with leading zeros
 */
function formatStockCode(code) {
  return String(code).padStart(5, '0');
}

/**
 * Format date to DD/MM/YYYY format (HKEX requirement)
 */
function formatDate(dateString) {
  if (!dateString) {
    const today = new Date();
    return `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;
  }

  // Convert YYYY-MM-DD to DD/MM/YYYY
  const [year, month, day] = dateString.split('-');
  return `${day}/${month}/${year}`;
}

/**
 * Scrape CCASS data using Firecrawl V2 with advanced features
 */
async function scrapeHKEXCCASS(stockCode, date = null) {
  const formattedStockCode = formatStockCode(stockCode);
  const formattedDate = formatDate(date);

  console.log(`[HKEX Advanced] Scraping stock ${formattedStockCode} for date ${formattedDate}`);

  const payload = {
    url: HKEX_CCASS_URL,
    formats: [
      'markdown',
      {
        type: 'json',
        prompt: `Extract CCASS participant shareholding data from the results table.
                 Return an array of participants with their ID, name, address, shareholding count (as number), and percentage (as number).`,
        schema: {
          type: 'object',
          properties: {
            stockCode: { type: 'string', description: '5-digit stock code' },
            stockName: { type: 'string', description: 'Company name' },
            dataDate: { type: 'string', description: 'Shareholding date' },
            participants: {
              type: 'array',
              description: 'Array of CCASS participants',
              items: {
                type: 'object',
                properties: {
                  participantId: { type: 'string', description: 'Participant ID (e.g., C00001)' },
                  participantName: { type: 'string', description: 'Participant name' },
                  address: { type: 'string', description: 'Participant address' },
                  shareholding: { type: 'number', description: 'Number of shares held' },
                  percentage: { type: 'number', description: 'Percentage of total shares (0-100)' }
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
          const stockInput = document.querySelector('input[name="txtStockCode"]');
          const dateInput = document.querySelector('input[name="txtShareholdingDate"]');
          const searchBtn = document.querySelector('input[name="btnSearch"]');

          if (stockInput) stockInput.value = '${formattedStockCode}';
          if (dateInput) dateInput.value = '${formattedDate}';
          if (searchBtn) searchBtn.click();
        `
      },
      { type: 'wait', milliseconds: 5000 }
    ],
    includeTags: ['table.table-scroll', 'table.table-sort', '.mobile-list-body', 'tbody', 'tr', 'td'],
    excludeTags: ['nav', 'footer', '#header', '.advertisement'],
    onlyMainContent: false,
    waitFor: 2000,
    timeout: 60000,
    maxAge: 0  // Always fetch fresh data
  };

  try {
    const response = await fetch('https://api.firecrawl.dev/v2/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Firecrawl API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(`Scraping failed: ${result.error || 'Unknown error'}`);
    }

    // Extract JSON data
    const jsonData = result.data?.json || result.data?.extract || {};
    const markdown = result.data?.markdown || '';

    // Calculate totals
    const participants = jsonData.participants || [];
    const totalShares = participants.reduce((sum, p) => sum + (p.shareholding || 0), 0);
    const totalPercentage = participants.reduce((sum, p) => sum + (p.percentage || 0), 0);

    return {
      success: true,
      stockCode: formattedStockCode,
      stockName: jsonData.stockName || null,
      dataDate: jsonData.dataDate || formattedDate,
      participants,
      totalParticipants: participants.length,
      totalShares,
      totalPercentage: Math.round(totalPercentage * 100) / 100,
      markdown,
      scrapedAt: new Date().toISOString(),
      credits: result.credits || 0
    };

  } catch (error) {
    console.error(`[HKEX Advanced] Error:`, error);
    return {
      success: false,
      stockCode: formattedStockCode,
      stockName: null,
      dataDate: formattedDate,
      participants: [],
      totalParticipants: 0,
      totalShares: 0,
      error: error.message,
      scrapedAt: new Date().toISOString()
    };
  }
}

/**
 * Scrape multiple stock codes
 */
async function scrapeMultipleStocks(stockCodes, date = null) {
  console.log(`[HKEX Advanced] Scraping ${stockCodes.length} stocks`);

  const results = [];

  for (const stockCode of stockCodes) {
    const result = await scrapeHKEXCCASS(stockCode, date);
    results.push(result);

    // Rate limiting: Wait 3 seconds between requests
    if (stockCodes.indexOf(stockCode) < stockCodes.length - 1) {
      console.log('[HKEX Advanced] Waiting 3 seconds...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  return results;
}

module.exports = {
  scrapeHKEXCCASS,
  scrapeMultipleStocks
};

// CLI test
if (require.main === module) {
  const stockCode = process.argv[2] || '00700'; // Tencent
  const date = process.argv[3] || null;

  scrapeHKEXCCASS(stockCode, date)
    .then(result => {
      console.log('\n' + '='.repeat(80));
      console.log('RESULT');
      console.log('='.repeat(80));
      console.log(JSON.stringify(result, null, 2));
    })
    .catch(error => {
      console.error('Error:', error);
      process.exit(1);
    });
}
