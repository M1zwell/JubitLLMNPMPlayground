/**
 * Puppeteer HKEx SPA Table Crawler
 *
 * Specialized utility for crawling dynamic tables from HKEx Single Page Applications.
 * Handles JavaScript-rendered content, infinite scroll, pagination, and AJAX-loaded data.
 */

import type { Browser, Page } from 'puppeteer';

export interface HKExTableConfig {
  url: string;
  tableSelector: string;
  waitForSelector?: string;
  waitForTimeout?: number;
  scrollToLoad?: boolean;
  pagination?: {
    enabled: boolean;
    nextButtonSelector?: string;
    maxPages?: number;
  };
  filters?: {
    dateRange?: { start: string; end: string };
    stockCode?: string;
    category?: string;
  };
}

export interface HKExTableRow {
  [key: string]: string | number | null;
}

export interface HKExCrawlResult {
  success: boolean;
  data: HKExTableRow[];
  totalRows: number;
  pagesScraped: number;
  metadata: {
    url: string;
    scrapedAt: string;
    executionTime: number;
  };
  error?: string;
}

/**
 * Extract table data from a page
 */
async function extractTableData(page: Page, tableSelector: string): Promise<HKExTableRow[]> {
  return await page.evaluate((selector) => {
    const table = document.querySelector(selector);
    if (!table) return [];

    const rows: any[] = [];
    const headerRow = table.querySelector('thead tr') || table.querySelector('tr');

    // Extract headers
    const headers: string[] = [];
    if (headerRow) {
      const headerCells = headerRow.querySelectorAll('th, td');
      headerCells.forEach((cell) => {
        headers.push(cell.textContent?.trim() || '');
      });
    }

    // Extract data rows
    const dataRows = table.querySelectorAll('tbody tr') || table.querySelectorAll('tr');
    dataRows.forEach((row, index) => {
      // Skip header row if no thead
      if (index === 0 && !table.querySelector('thead')) return;

      const cells = row.querySelectorAll('td');
      if (cells.length === 0) return;

      const rowData: any = {};
      cells.forEach((cell, cellIndex) => {
        const header = headers[cellIndex] || `column_${cellIndex}`;
        const value = cell.textContent?.trim() || '';

        // Try to parse as number
        const numValue = parseFloat(value.replace(/,/g, ''));
        rowData[header] = isNaN(numValue) ? value : numValue;
      });

      rows.push(rowData);
    });

    return rows;
  }, tableSelector);
}

/**
 * Wait for table to load with dynamic content
 */
async function waitForTableLoad(page: Page, config: HKExTableConfig): Promise<void> {
  const { waitForSelector, tableSelector, waitForTimeout = 30000 } = config;

  // Wait for main selector
  if (waitForSelector) {
    await page.waitForSelector(waitForSelector, { timeout: waitForTimeout });
  } else {
    await page.waitForSelector(tableSelector, { timeout: waitForTimeout });
  }

  // Wait for network idle (AJAX requests complete)
  await page.waitForNetworkIdle({ timeout: 10000 }).catch(() => {
    console.log('Network did not become idle, continuing...');
  });

  // Additional wait for JavaScript rendering
  await page.waitForFunction(
    (selector) => {
      const table = document.querySelector(selector);
      const rows = table?.querySelectorAll('tr');
      return rows && rows.length > 1; // At least header + 1 data row
    },
    { timeout: 10000 },
    tableSelector
  ).catch(() => {
    console.log('Table rows did not load, continuing with available data...');
  });
}

/**
 * Handle infinite scroll if needed
 */
async function handleInfiniteScroll(page: Page): Promise<void> {
  let previousHeight = 0;
  let scrollAttempts = 0;
  const maxScrollAttempts = 10;

  while (scrollAttempts < maxScrollAttempts) {
    // Scroll to bottom
    await page.evaluate(() => {
      window.scrollTo(0, document.body.scrollHeight);
    });

    // Wait for new content to load
    await page.waitForTimeout(2000);

    // Check if new content loaded
    const newHeight = await page.evaluate(() => document.body.scrollHeight);
    if (newHeight === previousHeight) {
      break; // No new content loaded
    }

    previousHeight = newHeight;
    scrollAttempts++;
  }
}

/**
 * Handle pagination
 */
async function handlePagination(
  page: Page,
  config: HKExTableConfig,
  allData: HKExTableRow[]
): Promise<number> {
  if (!config.pagination?.enabled) return 1;

  const { nextButtonSelector, maxPages = 10 } = config.pagination;
  let currentPage = 1;

  while (currentPage < maxPages) {
    // Check if next button exists and is enabled
    const hasNext = await page.evaluate((selector) => {
      const button = document.querySelector(selector || 'button.next, a.next');
      if (!button) return false;

      const isDisabled =
        button.hasAttribute('disabled') ||
        button.classList.contains('disabled') ||
        button.getAttribute('aria-disabled') === 'true';

      return !isDisabled;
    }, nextButtonSelector);

    if (!hasNext) break;

    // Click next button
    await page.click(nextButtonSelector || 'button.next, a.next');

    // Wait for new page to load
    await page.waitForTimeout(2000);
    await waitForTableLoad(page, config);

    // Extract data from new page
    const pageData = await extractTableData(page, config.tableSelector);
    allData.push(...pageData);

    currentPage++;
  }

  return currentPage;
}

/**
 * Apply filters to HKEx page
 */
async function applyFilters(page: Page, filters?: HKExTableConfig['filters']): Promise<void> {
  if (!filters) return;

  // Apply date range filter
  if (filters.dateRange) {
    const { start, end } = filters.dateRange;

    // Try common date input selectors
    const startDateInput = await page.$('input[name*="startDate"], input[name*="dateFrom"], input[id*="startDate"]');
    const endDateInput = await page.$('input[name*="endDate"], input[name*="dateTo"], input[id*="endDate"]');

    if (startDateInput && endDateInput) {
      await startDateInput.type(start);
      await endDateInput.type(end);
    }
  }

  // Apply stock code filter
  if (filters.stockCode) {
    const stockInput = await page.$('input[name*="stock"], input[name*="code"], input[id*="stock"]');
    if (stockInput) {
      await stockInput.type(filters.stockCode);
    }
  }

  // Apply category filter
  if (filters.category) {
    const categorySelect = await page.$('select[name*="category"], select[id*="category"]');
    if (categorySelect) {
      await page.select(categorySelect as any, filters.category);
    }
  }

  // Click search/submit button
  const submitButton = await page.$('button[type="submit"], button.search, input[type="submit"]');
  if (submitButton) {
    await submitButton.click();
    await page.waitForTimeout(2000);
  }
}

/**
 * Main crawler function
 */
export async function crawlHKExTable(
  browser: Browser,
  config: HKExTableConfig
): Promise<HKExCrawlResult> {
  const startTime = Date.now();
  let page: Page | null = null;

  try {
    // Create new page
    page = await browser.newPage();

    // Set viewport for consistent rendering
    await page.setViewport({ width: 1920, height: 1080 });

    // Set user agent to avoid detection
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    // Navigate to URL
    await page.goto(config.url, {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    // Apply filters if provided
    await applyFilters(page, config.filters);

    // Wait for table to load
    await waitForTableLoad(page, config);

    // Handle infinite scroll if enabled
    if (config.scrollToLoad) {
      await handleInfiniteScroll(page);
    }

    // Extract initial table data
    const allData: HKExTableRow[] = [];
    const initialData = await extractTableData(page, config.tableSelector);
    allData.push(...initialData);

    // Handle pagination if enabled
    const pagesScraped = await handlePagination(page, config, allData);

    const executionTime = Date.now() - startTime;

    return {
      success: true,
      data: allData,
      totalRows: allData.length,
      pagesScraped,
      metadata: {
        url: config.url,
        scrapedAt: new Date().toISOString(),
        executionTime,
      },
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;

    return {
      success: false,
      data: [],
      totalRows: 0,
      pagesScraped: 0,
      metadata: {
        url: config.url,
        scrapedAt: new Date().toISOString(),
        executionTime,
      },
      error: error instanceof Error ? error.message : String(error),
    };
  } finally {
    if (page) {
      await page.close();
    }
  }
}

/**
 * Crawl multiple HKEx tables in parallel
 */
export async function crawlMultipleHKExTables(
  browser: Browser,
  configs: HKExTableConfig[]
): Promise<HKExCrawlResult[]> {
  const results = await Promise.allSettled(
    configs.map((config) => crawlHKExTable(browser, config))
  );

  return results.map((result, index) => {
    if (result.status === 'fulfilled') {
      return result.value;
    } else {
      return {
        success: false,
        data: [],
        totalRows: 0,
        pagesScraped: 0,
        metadata: {
          url: configs[index].url,
          scrapedAt: new Date().toISOString(),
          executionTime: 0,
        },
        error: result.reason?.message || String(result.reason),
      };
    }
  });
}

/**
 * Export table data to CSV
 */
export function exportTableToCSV(data: HKExTableRow[]): string {
  if (data.length === 0) return '';

  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map((header) => {
      const value = row[header];
      const stringValue = String(value || '').replace(/"/g, '""');
      return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
    });
    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
}
