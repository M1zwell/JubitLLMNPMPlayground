/**
 * HKEX CCASS Puppeteer Scraper
 *
 * Scrapes Hong Kong Stock Exchange CCASS (Central Clearing and Settlement System)
 * shareholding data using Puppeteer for form submission and data extraction.
 */

const puppeteer = require('puppeteer');

const HKEX_CCASS_URL = 'https://www3.hkexnews.hk/sdw/search/searchsdw.aspx';

/**
 * Format stock code to 5 digits with leading zeros
 */
function formatStockCode(code) {
  return String(code).padStart(5, '0');
}

/**
 * Format date to YYYY/MM/DD format (HKEX requirement)
 */
function formatDate(dateString) {
  if (!dateString) {
    const today = new Date();
    return `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;
  }

  // Convert YYYY-MM-DD to YYYY/MM/DD
  return dateString.replace(/-/g, '/');
}

/**
 * Extract participant data from results table
 *
 * Table structure:
 * <table class="table table-scroll table-sort table-mobile-list">
 *   <tbody>
 *     <tr>
 *       <td class="col-participant-id"><div class="mobile-list-body">C00019</div></td>
 *       <td class="col-participant-name"><div class="mobile-list-body">HSBC</div></td>
 *       <td class="col-address"><div class="mobile-list-body">Address...</div></td>
 *       <td class="col-shareholding"><div class="mobile-list-body">3,219,621,093</div></td>
 *       <td class="col-shareholding-percent"><div class="mobile-list-body">35.20%</div></td>
 *     </tr>
 *   </tbody>
 * </table>
 */
async function extractTableData(page) {
  try {
    // Wait for results table with specific class structure
    await page.waitForSelector('table.table-scroll, table.table-sort, tbody tr .col-participant-id', {
      timeout: 15000
    });

    const data = await page.evaluate(() => {
      // Find the CCASS results table by its distinctive classes
      const targetTable = document.querySelector('table.table-scroll.table-sort.table-mobile-list') ||
                          document.querySelector('table.table-scroll') ||
                          document.querySelector('table[class*="table-scroll"]');

      if (!targetTable) {
        return { participants: [], error: 'CCASS results table not found' };
      }

      const rows = Array.from(targetTable.querySelectorAll('tbody tr'));
      const participants = [];

      for (const row of rows) {
        try {
          // Extract data from mobile-list-body divs within each column
          const participantIdEl = row.querySelector('.col-participant-id .mobile-list-body');
          const participantNameEl = row.querySelector('.col-participant-name .mobile-list-body');
          const addressEl = row.querySelector('.col-address .mobile-list-body');
          const shareholdingEl = row.querySelector('.col-shareholding .mobile-list-body');
          const percentageEl = row.querySelector('.col-shareholding-percent .mobile-list-body');

          const participantId = participantIdEl?.textContent?.trim() || '';
          const participantName = participantNameEl?.textContent?.trim() || '';
          const address = addressEl?.textContent?.trim() || '';
          const shareholdingText = shareholdingEl?.textContent?.trim() || '';
          const percentageText = percentageEl?.textContent?.trim() || '';

          if (participantId && shareholdingText) {
            // Parse shareholding: "3,219,621,093" -> 3219621093
            const shareholding = parseInt(shareholdingText.replace(/,/g, '')) || 0;

            // Parse percentage: "35.20%" -> 35.20
            const percentage = parseFloat(percentageText.replace('%', '')) || 0;

            participants.push({
              participantId,
              participantName,
              address,
              shareholding,
              percentage
            });
          }
        } catch (rowError) {
          console.error('Error parsing row:', rowError);
        }
      }

      return { participants };
    });

    return data;

  } catch (error) {
    console.error('[HKEX] Error extracting table data:', error);
    return {
      participants: [],
      error: `Failed to extract table data: ${error.message}`
    };
  }
}

/**
 * Scrape CCASS data for a single stock code
 */
async function scrapeSingleStock(browser, stockCode, date) {
  const page = await browser.newPage();

  try {
    console.log(`[HKEX] Scraping stock ${stockCode} for date ${date}`);

    // Navigate to CCASS page
    await page.goto(HKEX_CCASS_URL, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for form elements
    await page.waitForSelector('input[name="txtStockCode"]', { timeout: 10000 });

    // Clear and input stock code
    await page.click('input[name="txtStockCode"]', { clickCount: 3 });
    await page.type('input[name="txtStockCode"]', formatStockCode(stockCode));

    // Clear and input date
    await page.click('input[name="txtShareholdingDate"]', { clickCount: 3 });
    await page.type('input[name="txtShareholdingDate"]', formatDate(date));

    // Click search button
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 30000 }),
      page.click('input[name="btnSearch"]')
    ]);

    // Extract table data
    const tableData = await extractTableData(page);

    // Get stock name if available
    const stockName = await page.evaluate(() => {
      const elements = document.querySelectorAll('span, td, div');
      for (const el of elements) {
        const text = el.textContent || '';
        if (text.includes('Stock Name') || text.includes('股份名稱')) {
          const next = el.nextElementSibling;
          if (next) return next.textContent.trim();
        }
      }
      return null;
    });

    await page.close();

    return {
      stockCode: formatStockCode(stockCode),
      stockName: stockName || null,
      dataDate: formatDate(date),
      participants: tableData.participants || [],
      totalParticipants: tableData.participants?.length || 0,
      totalShares: tableData.participants?.reduce((sum, p) => sum + p.shareholding, 0) || 0,
      error: tableData.error || null,
      scrapedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error(`[HKEX] Error scraping ${stockCode}:`, error);
    await page.close();

    return {
      stockCode: formatStockCode(stockCode),
      stockName: null,
      dataDate: formatDate(date),
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
  console.log(`[HKEX] Starting scrape for ${stockCodes.length} stocks`);

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu'
    ]
  });

  const results = [];

  try {
    // Process stocks sequentially to avoid rate limiting
    for (const stockCode of stockCodes) {
      const result = await scrapeSingleStock(browser, stockCode, date);
      results.push(result);

      // Add delay between requests (3 seconds as per HKEX guidelines)
      if (stockCodes.indexOf(stockCode) < stockCodes.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

  } finally {
    await browser.close();
  }

  console.log(`[HKEX] Completed scraping ${results.length} stocks`);
  return results;
}

module.exports = {
  scrapeMultipleStocks,
  scrapeSingleStock
};
