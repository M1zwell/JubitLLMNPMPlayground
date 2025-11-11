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
 */
async function extractTableData(page) {
  try {
    // Wait for results table
    await page.waitForSelector('table.summary-table, table#pnlResultSummary table', {
      timeout: 15000
    });

    const data = await page.evaluate(() => {
      const tables = document.querySelectorAll('table');
      let targetTable = null;

      // Find the results table (usually contains "Participant ID")
      for (const table of tables) {
        const text = table.innerText || '';
        if (text.includes('Participant ID') || text.includes('參與者編號')) {
          targetTable = table;
          break;
        }
      }

      if (!targetTable) {
        return { participants: [], error: 'Results table not found' };
      }

      const rows = Array.from(targetTable.querySelectorAll('tr'));
      const participants = [];

      // Skip header row(s)
      for (let i = 1; i < rows.length; i++) {
        const cells = rows[i].querySelectorAll('td');
        if (cells.length >= 4) {
          const participantId = cells[0]?.textContent?.trim() || '';
          const participantName = cells[1]?.textContent?.trim() || '';
          const shareholding = cells[2]?.textContent?.trim() || '';
          const percentage = cells[3]?.textContent?.trim() || '';

          if (participantId && shareholding) {
            participants.push({
              participantId,
              participantName,
              shareholding: parseInt(shareholding.replace(/,/g, '')) || 0,
              percentage: parseFloat(percentage.replace('%', '')) || 0
            });
          }
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
