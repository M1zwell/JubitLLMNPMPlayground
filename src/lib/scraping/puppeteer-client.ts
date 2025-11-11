/**
 * Puppeteer Client for Frontend
 *
 * This client calls a Puppeteer Edge Function to scrape HKEx data.
 * Puppeteer runs on the server-side to avoid browser limitations.
 */

export interface PuppeteerScrapeRequest {
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

export interface CCASSParticipant {
  participantID: string;
  participantName: string;
  shareholding: string;
  percentage: string;
}

export interface MarketStatRow {
  date: string;
  turnover: string;
  volume: string;
  [key: string]: string;
}

export interface PuppeteerScrapeResult {
  success: boolean;
  data: CCASSParticipant[] | MarketStatRow[];
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
 * Scrape CCASS participant shareholding data using Puppeteer
 */
export async function scrapeCCASSWithPuppeteer(
  stockCode: string,
  supabaseUrl: string,
  supabaseKey: string
): Promise<PuppeteerScrapeResult> {
  const response = await fetch(`${supabaseUrl}/functions/v1/puppeteer-scraper`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({
      type: 'ccass',
      stockCode,
    } as PuppeteerScrapeRequest),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  return await response.json();
}

/**
 * Scrape market statistics using Puppeteer
 */
export async function scrapeMarketStatsWithPuppeteer(
  dateRange: { start: string; end: string },
  maxPages: number,
  supabaseUrl: string,
  supabaseKey: string
): Promise<PuppeteerScrapeResult> {
  const response = await fetch(`${supabaseUrl}/functions/v1/puppeteer-scraper`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${supabaseKey}`,
    },
    body: JSON.stringify({
      type: 'market-stats',
      dateRange,
      pagination: {
        enabled: true,
        maxPages,
      },
    } as PuppeteerScrapeRequest),
  });

  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${await response.text()}`);
  }

  return await response.json();
}
