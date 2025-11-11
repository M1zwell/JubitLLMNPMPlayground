/**
 * Puppeteer Scraper Edge Function
 *
 * Scrapes HKEx data using Puppeteer for JavaScript-rendered tables.
 * Supports CCASS Holdings and Market Statistics.
 */

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import puppeteer from 'https://deno.land/x/puppeteer@16.2.0/mod.ts';

interface PuppeteerScrapeRequest {
  type: 'ccass' | 'market-stats';
  stockCode?: string;
  dateRange?: {
    start: string;
    end: string;
  };
  pagination?: {
    enabled: boolean;
    maxPages?: number;
  };
}

/**
 * Scrape CCASS Participant Shareholding
 */
async function scrapeCCASS(stockCode: string) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // Set user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    );

    // Navigate to CCASS search page
    await page.goto('https://www.hkexnews.hk/sdw/search/searchsdw.aspx', {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    // Click Shareholding tab
    const shareholdingTab = await page.$('#btnShowSH');
    if (shareholdingTab) {
      await shareholdingTab.click();
      await page.waitForTimeout(1000);
    }

    // Enter stock code
    await page.waitForSelector('#txtStockCode');
    await page.type('#txtStockCode', stockCode);

    // Set date to today
    const today = new Date();
    const dateStr = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;
    await page.waitForSelector('#txtShareholdingDate');
    await page.type('#txtShareholdingDate', dateStr);

    // Submit search
    await page.click('#btnSearch');

    // Wait for results
    await page.waitForSelector('#mutualmarket-result, table.table', {
      timeout: 30000,
    });

    await page.waitForTimeout(3000);

    // Extract table data
    const tableData = await page.evaluate(() => {
      const results: any[] = [];
      const table = document.querySelector('table.table');

      if (!table) return [];

      const rows = table.querySelectorAll('tbody tr');

      rows.forEach((row) => {
        const cells = row.querySelectorAll('td');

        if (cells.length >= 4) {
          results.push({
            participantID: cells[0]?.textContent?.trim() || '',
            participantName: cells[1]?.textContent?.trim() || '',
            shareholding: cells[2]?.textContent?.trim() || '',
            percentage: cells[3]?.textContent?.trim() || '',
          });
        }
      });

      return results;
    });

    return {
      success: true,
      data: tableData,
      totalRows: tableData.length,
      pagesScraped: 1,
      metadata: {
        url: 'https://www.hkexnews.hk/sdw/search/searchsdw.aspx',
        scrapedAt: new Date().toISOString(),
        executionTime: 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      totalRows: 0,
      pagesScraped: 0,
      metadata: {
        url: 'https://www.hkexnews.hk/sdw/search/searchsdw.aspx',
        scrapedAt: new Date().toISOString(),
        executionTime: 0,
      },
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    await browser.close();
  }
}

/**
 * Scrape Market Statistics
 */
async function scrapeMarketStats(
  dateRange: { start: string; end: string },
  maxPages: number = 3
) {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  try {
    const page = await browser.newPage();

    // Set user agent
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    );

    // Navigate to market stats page
    await page.goto(
      'https://www.hkex.com.hk/Market-Data/Statistics/Consolidated-Data/Securities-Statistics',
      {
        waitUntil: 'networkidle2',
        timeout: 60000,
      }
    );

    // Wait for table
    await page.waitForSelector('table.table, .data-table', {
      timeout: 30000,
    });

    await page.waitForTimeout(3000);

    const allData: any[] = [];
    let currentPage = 1;

    while (currentPage <= maxPages) {
      // Extract current page data
      const pageData = await page.evaluate(() => {
        const rows: any[] = [];
        const table = document.querySelector('table.table, .data-table');
        if (!table) return rows;

        const dataRows = table.querySelectorAll('tbody tr');
        dataRows.forEach((row) => {
          const cells = row.querySelectorAll('td');
          if (cells.length > 0) {
            const rowData: any = {};
            cells.forEach((cell, index) => {
              rowData[`column_${index}`] = cell.textContent?.trim() || '';
            });
            rows.push(rowData);
          }
        });

        return rows;
      });

      allData.push(...pageData);

      // Check for next page button
      const hasNext = await page.evaluate(() => {
        const nextBtn = document.querySelector('button.next, a.next, li.next a');
        return nextBtn && !nextBtn.classList.contains('disabled');
      });

      if (!hasNext || currentPage === maxPages) break;

      // Click next page
      await page.click('button.next, a.next, li.next a');
      await page.waitForTimeout(2000);

      currentPage++;
    }

    return {
      success: true,
      data: allData,
      totalRows: allData.length,
      pagesScraped: currentPage,
      metadata: {
        url: 'https://www.hkex.com.hk/Market-Data/Statistics/Consolidated-Data/Securities-Statistics',
        scrapedAt: new Date().toISOString(),
        executionTime: 0,
      },
    };
  } catch (error) {
    return {
      success: false,
      data: [],
      totalRows: 0,
      pagesScraped: 0,
      metadata: {
        url: 'https://www.hkex.com.hk/Market-Data/Statistics/Consolidated-Data/Securities-Statistics',
        scrapedAt: new Date().toISOString(),
        executionTime: 0,
      },
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    await browser.close();
  }
}

serve(async (req) => {
  // CORS headers
  if (req.method === 'OPTIONS') {
    return new Response('ok', {
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
      },
    });
  }

  try {
    const body: PuppeteerScrapeRequest = await req.json();

    let result;

    if (body.type === 'ccass') {
      if (!body.stockCode) {
        throw new Error('Stock code is required for CCASS scraping');
      }
      result = await scrapeCCASS(body.stockCode);
    } else if (body.type === 'market-stats') {
      const dateRange = body.dateRange || {
        start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        end: new Date().toISOString().split('T')[0],
      };
      const maxPages = body.pagination?.maxPages || 3;
      result = await scrapeMarketStats(dateRange, maxPages);
    } else {
      throw new Error('Invalid scrape type. Must be "ccass" or "market-stats"');
    }

    return new Response(JSON.stringify(result), {
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : String(error),
      }),
      {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*',
        },
      }
    );
  }
});
