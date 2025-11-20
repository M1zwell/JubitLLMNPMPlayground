/**
 * HKEX Disclosure of Interests Scraper
 * Source: https://di.hkex.com.hk/di/NSSrchCorp.aspx
 *
 * Scrapes substantial shareholder disclosures from HKEX.
 * Uses Puppeteer for complex form interactions and AJAX requests.
 */

import { Browser, Page } from 'https://deno.land/x/puppeteer@16.2.0/mod.ts';

export interface HKEXDIConfig {
  companyCodes: string[];
  dateRange: { start: string; end: string };
  timeout?: number;
}

export interface HKEXDIRecord {
  company_code: string;
  company_name: string;
  di_number: string;
  disclosure_date: string;
  disclosure_type: string;
  substantial_shareholder: string;
  number_of_shares: number;
  percentage: number;
  nature_of_interest: string;
  source_url: string;
}

export class HKEXDIScraper {
  private baseUrl = 'https://di.hkex.com.hk/di/NSSrchCorp.aspx';
  private timeout: number;

  constructor(timeout = 45000) {
    this.timeout = timeout;
  }

  async scrape(config: HKEXDIConfig): Promise<HKEXDIRecord[]> {
    const browser = await this.launchBrowser();
    const allRecords: HKEXDIRecord[] = [];

    try {
      for (const companyCode of config.companyCodes) {
        try {
          const records = await this.scrapeCompany(
            browser,
            companyCode,
            config.dateRange
          );
          allRecords.push(...records);

          // Rate limiting: 10 requests per minute
          await this.delay(6000);
        } catch (error) {
          console.error(`Failed to scrape company ${companyCode}:`, error);
        }
      }

      return allRecords;
    } finally {
      await browser.close();
    }
  }

  private async scrapeCompany(
    browser: Browser,
    companyCode: string,
    dateRange: { start: string; end: string }
  ): Promise<HKEXDIRecord[]> {
    const page = await browser.newPage();

    try {
      await page.setViewport({ width: 1920, height: 1080 });
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      );

      // Navigate to search page
      await page.goto(this.baseUrl, {
        waitUntil: 'networkidle2',
        timeout: this.timeout
      });

      // Switch to English if needed
      const langButton = await page.$('a[href*="lang=EN"]');
      if (langButton) {
        await langButton.click();
        await page.waitForNavigation({ waitUntil: 'networkidle2' });
      }

      // Fill in company code
      await page.waitForSelector('#txtStockCode', { timeout: this.timeout });
      await page.type('#txtStockCode', companyCode);

      // Fill in date range
      await page.type('#txtDiDateFrom', this.formatDateForInput(dateRange.start));
      await page.type('#txtDiDateTo', this.formatDateForInput(dateRange.end));

      // Submit search
      await Promise.all([
        page.waitForNavigation({ waitUntil: 'networkidle2', timeout: this.timeout }),
        page.click('#btnSearch')
      ]);

      // Check for results
      const noDataExists = await page.$('.no-record, .txtNoRecord');
      if (noDataExists) {
        return [];
      }

      // Extract company name
      const companyName = await page.evaluate(() => {
        const nameElem = document.querySelector('.companyName, .stock-name');
        return nameElem?.textContent?.trim() || '';
      });

      // Extract all pages of results
      const allRecords: HKEXDIRecord[] = [];
      let hasNextPage = true;
      let pageNumber = 1;

      while (hasNextPage && pageNumber <= 50) { // Safety limit
        const pageRecords = await this.extractRecordsFromPage(
          page,
          companyCode,
          companyName
        );
        allRecords.push(...pageRecords);

        // Check for next page
        const nextButton = await page.$('.pagination .next:not(.disabled)');
        if (nextButton) {
          await Promise.all([
            page.waitForNavigation({ waitUntil: 'networkidle2', timeout: this.timeout }),
            nextButton.click()
          ]);
          pageNumber++;
        } else {
          hasNextPage = false;
        }
      }

      return allRecords;

    } finally {
      await page.close();
    }
  }

  private async extractRecordsFromPage(
    page: Page,
    companyCode: string,
    companyName: string
  ): Promise<HKEXDIRecord[]> {
    return await page.evaluate((code, name) => {
      const rows = Array.from(document.querySelectorAll('.search-results table tbody tr'));

      return rows.map(row => {
        const cells = row.querySelectorAll('td');

        // Extract DI number and link
        const diLink = cells[0]?.querySelector('a');
        const diNumber = diLink?.textContent?.trim() || '';
        const diUrl = diLink?.getAttribute('href') || '';

        // Extract date (format: DD/MM/YYYY)
        const dateText = cells[1]?.textContent?.trim() || '';

        // Extract disclosure type
        const disclosureType = cells[2]?.textContent?.trim() || '';

        // Extract substantial shareholder
        const shareholder = cells[3]?.textContent?.trim() || '';

        // Extract number of shares (remove commas)
        const sharesText = cells[4]?.textContent?.replace(/,/g, '') || '0';
        const shares = parseInt(sharesText);

        // Extract percentage
        const percentageText = cells[5]?.textContent?.replace('%', '') || '0';
        const percentage = parseFloat(percentageText);

        // Extract nature of interest
        const natureOfInterest = cells[6]?.textContent?.trim() || '';

        return {
          company_code: code,
          company_name: name,
          di_number: diNumber,
          disclosure_date: this.convertDateFormat(dateText),
          disclosure_type: disclosureType,
          substantial_shareholder: shareholder,
          number_of_shares: shares,
          percentage: percentage,
          nature_of_interest: natureOfInterest,
          source_url: diUrl ? `https://di.hkex.com.hk${diUrl}` : window.location.href
        };
      });
    }, companyCode, companyName);
  }

  private formatDateForInput(isoDate: string): string {
    // Convert YYYY-MM-DD to DD/MM/YYYY
    const [year, month, day] = isoDate.split('-');
    return `${day}/${month}/${year}`;
  }

  private convertDateFormat(ddmmyyyy: string): string {
    // Convert DD/MM/YYYY to YYYY-MM-DD
    const parts = ddmmyyyy.split('/');
    if (parts.length !== 3) return new Date().toISOString().split('T')[0];

    const [day, month, year] = parts;
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  private async launchBrowser(): Promise<Browser> {
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

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
