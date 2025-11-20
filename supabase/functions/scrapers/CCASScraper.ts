/**
 * CCASS Shareholding Scraper
 * Source: https://www3.hkexnews.hk/sdw/search/searchsdw.aspx
 *
 * Scrapes shareholding data for specified stock codes and date ranges.
 * Uses Puppeteer for JavaScript-heavy page interactions.
 */

import { Browser, Page } from 'https://deno.land/x/puppeteer@16.2.0/mod.ts';

export interface CCAASScrapeConfig {
  stockCodes: string[];
  dateRange: { start: string; end: string };
  timeout?: number;
}

export interface CCASSRecord {
  stock_code: string;
  stock_name: string;
  participant_id: string;
  participant_name: string;
  shareholding: number;
  percentage: number;
  shareholding_date: string;
  source_url: string;
}

export class CCASScraper {
  private baseUrl = 'https://www3.hkexnews.hk/sdw/search/searchsdw.aspx';
  private timeout: number;

  constructor(timeout = 30000) {
    this.timeout = timeout;
  }

  async scrape(config: CCAASScrapeConfig): Promise<CCASSRecord[]> {
    const browser = await this.launchBrowser();
    const allRecords: CCASSRecord[] = [];

    try {
      for (const stockCode of config.stockCodes) {
        const dates = this.generateDateRange(config.dateRange.start, config.dateRange.end);

        for (const date of dates) {
          try {
            const records = await this.scrapeStockDate(browser, stockCode, date);
            allRecords.push(...records);

            // Rate limiting: 10 requests per minute
            await this.delay(6000);
          } catch (error) {
            console.error(`Failed to scrape ${stockCode} on ${date}:`, error);
            // Continue with next date instead of failing entire job
          }
        }
      }

      return allRecords;
    } finally {
      await browser.close();
    }
  }

  private async scrapeStockDate(
    browser: Browser,
    stockCode: string,
    date: string
  ): Promise<CCASSRecord[]> {
    const page = await browser.newPage();

    try {
      // Set viewport and user agent
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      );

      // Navigate to search page
      await page.goto(this.baseUrl, {
        waitUntil: 'networkidle2',
        timeout: this.timeout
      });

      // Fill in stock code
      await page.waitForSelector('#txtStockCode', { timeout: this.timeout });
      await page.type('#txtStockCode', stockCode);

      // Fill in date (format: YYYY/MM/DD)
      await page.type('#txtShareholdingDate', this.formatDateForInput(date));

      // Click search button
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: this.timeout }),
        page.click('#btnSearch')
      ]);

      // Check for "No data" message
      const noDataExists = await page.$('.txtNoRecord');
      if (noDataExists) {
        return [];
      }

      // Extract table data
      const records = await page.evaluate((stockCode, date) => {
        const rows = Array.from(document.querySelectorAll('.ccass-search-dataTable tbody tr'));
        const stockName = document.querySelector('.txtStockName')?.textContent?.trim() || '';

        return rows.map(row => {
          const cells = row.querySelectorAll('td');
          return {
            stock_code: stockCode,
            stock_name: stockName,
            participant_id: cells[0]?.textContent?.trim() || '',
            participant_name: cells[1]?.textContent?.trim() || '',
            shareholding: parseInt(cells[2]?.textContent?.replace(/,/g, '') || '0'),
            percentage: parseFloat(cells[3]?.textContent?.replace('%', '') || '0'),
            shareholding_date: date,
            source_url: window.location.href
          };
        });
      }, stockCode, date);

      return records;

    } finally {
      await page.close();
    }
  }

  private async launchBrowser(): Promise<Browser> {
    // Note: In Supabase Edge Functions, use headless Chrome
    const browser = await (await import('https://deno.land/x/puppeteer@16.2.0/mod.ts'))
      .default.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-gpu'
        ]
      });

    return browser;
  }

  private generateDateRange(start: string, end: string): string[] {
    const dates: string[] = [];
    const startDate = new Date(start);
    const endDate = new Date(end);

    for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
      dates.push(d.toISOString().split('T')[0]);
    }

    return dates;
  }

  private formatDateForInput(isoDate: string): string {
    // Convert YYYY-MM-DD to YYYY/MM/DD
    return isoDate.replace(/-/g, '/');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
