/**
 * SFC Filings & RSS Scraper
 * Sources:
 * - https://www.sfc.hk/en/News-and-announcements/RSS-subscription
 * - https://apps.sfc.hk/publicregWeb/searchByRa
 * - https://www.sfc.hk/en/Regulatory-functions/Intermediaries/Circulars-to-intermediaries
 *
 * Scrapes SFC regulatory filings, announcements, and circulars.
 * Uses RSS feeds where available, falls back to web scraping.
 */

import { DOMParser } from 'https://deno.land/x/deno_dom@v0.1.38/deno-dom-wasm.ts';

export interface SFCFilingsConfig {
  sources: ('press-releases' | 'circulars' | 'enforcement' | 'virtual-assets')[];
  dateRange?: { start: string; end: string };
}

export interface SFCFilingRecord {
  title: string;
  document_url: string;
  filing_type: string;
  category: string;
  published_date: string;
  summary: string;
  pdf_url?: string;
  tags: string[];
}

export class SFCFilingsScraper {
  private rssFeeds: Record<string, string> = {
    'press-releases': 'https://www.sfc.hk/en/RSS-subscription/Press-releases',
    'enforcement': 'https://www.sfc.hk/en/RSS-subscription/Enforcement-news',
    'circulars': 'https://www.sfc.hk/en/Regulatory-functions/Intermediaries/Circulars-to-intermediaries',
    'virtual-assets': 'https://www.sfc.hk/en/Regulatory-functions/Virtual-assets'
  };

  async scrape(config: SFCFilingsConfig): Promise<SFCFilingRecord[]> {
    const allRecords: SFCFilingRecord[] = [];

    for (const source of config.sources) {
      try {
        let records: SFCFilingRecord[];

        if (source === 'press-releases' || source === 'enforcement') {
          records = await this.scrapeRSSFeed(source);
        } else {
          records = await this.scrapeWebPage(source);
        }

        // Filter by date range if provided
        if (config.dateRange) {
          records = this.filterByDateRange(records, config.dateRange);
        }

        allRecords.push(...records);

        // Rate limiting
        await this.delay(3000);
      } catch (error) {
        console.error(`Failed to scrape ${source}:`, error);
      }
    }

    return allRecords;
  }

  private async scrapeRSSFeed(source: string): Promise<SFCFilingRecord[]> {
    const url = this.rssFeeds[source];
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`RSS fetch failed: ${response.status}`);
    }

    const xmlText = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'text/xml');

    if (!doc) {
      throw new Error('Failed to parse RSS XML');
    }

    const items = Array.from(doc.querySelectorAll('item'));

    return items.map(item => {
      const title = item.querySelector('title')?.textContent || '';
      const link = item.querySelector('link')?.textContent || '';
      const description = item.querySelector('description')?.textContent || '';
      const pubDate = item.querySelector('pubDate')?.textContent || '';
      const categories = Array.from(item.querySelectorAll('category')).map(
        cat => cat.textContent || ''
      );

      return {
        title: this.cleanText(title),
        document_url: link,
        filing_type: source,
        category: categories[0] || source,
        published_date: this.parseRSSDate(pubDate),
        summary: this.cleanText(description),
        tags: categories,
        pdf_url: this.extractPDFUrl(description, link)
      };
    });
  }

  private async scrapeWebPage(source: string): Promise<SFCFilingRecord[]> {
    const url = this.rssFeeds[source];
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Web page fetch failed: ${response.status}`);
    }

    const html = await response.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    if (!doc) {
      throw new Error('Failed to parse HTML');
    }

    const records: SFCFilingRecord[] = [];

    if (source === 'circulars') {
      records.push(...this.parseCircularsPage(doc, url));
    } else if (source === 'virtual-assets') {
      records.push(...this.parseVirtualAssetsPage(doc, url));
    }

    return records;
  }

  private parseCircularsPage(doc: any, baseUrl: string): SFCFilingRecord[] {
    const records: SFCFilingRecord[] = [];

    // SFC circulars are typically in table format
    const rows = Array.from(doc.querySelectorAll('.table-responsive table tbody tr'));

    for (const row of rows) {
      const cells = row.querySelectorAll('td');
      if (cells.length < 3) continue;

      const dateCell = cells[0]?.textContent?.trim() || '';
      const titleCell = cells[1];
      const title = titleCell?.textContent?.trim() || '';
      const link = titleCell?.querySelector('a')?.getAttribute('href') || '';

      records.push({
        title: this.cleanText(title),
        document_url: this.resolveUrl(link, baseUrl),
        filing_type: 'circulars',
        category: 'Intermediaries',
        published_date: this.parseDateString(dateCell),
        summary: '',
        tags: ['circular', 'intermediaries'],
        pdf_url: link.endsWith('.pdf') ? this.resolveUrl(link, baseUrl) : undefined
      });
    }

    return records;
  }

  private parseVirtualAssetsPage(doc: any, baseUrl: string): SFCFilingRecord[] {
    const records: SFCFilingRecord[] = [];

    // Look for announcement sections
    const announcements = Array.from(doc.querySelectorAll('.news-item, .announcement-item'));

    for (const announcement of announcements) {
      const titleElem = announcement.querySelector('h3, h4, .title');
      const linkElem = announcement.querySelector('a');
      const dateElem = announcement.querySelector('.date, time');
      const summaryElem = announcement.querySelector('p, .summary');

      if (!titleElem || !linkElem) continue;

      const title = titleElem.textContent?.trim() || '';
      const link = linkElem.getAttribute('href') || '';
      const date = dateElem?.textContent?.trim() || '';
      const summary = summaryElem?.textContent?.trim() || '';

      records.push({
        title: this.cleanText(title),
        document_url: this.resolveUrl(link, baseUrl),
        filing_type: 'virtual-assets',
        category: 'Virtual Assets',
        published_date: this.parseDateString(date),
        summary: this.cleanText(summary),
        tags: ['virtual-assets', 'crypto'],
        pdf_url: link.endsWith('.pdf') ? this.resolveUrl(link, baseUrl) : undefined
      });
    }

    return records;
  }

  private parseRSSDate(dateString: string): string {
    try {
      // RSS dates are in RFC 822 format: "Wed, 15 Jan 2025 10:30:00 GMT"
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  }

  private parseDateString(dateString: string): string {
    try {
      // Try various date formats
      const formats = [
        /(\d{1,2})\/(\d{1,2})\/(\d{4})/,  // DD/MM/YYYY
        /(\d{4})-(\d{2})-(\d{2})/,        // YYYY-MM-DD
        /(\d{1,2}) (\w+) (\d{4})/         // 15 January 2025
      ];

      for (const format of formats) {
        const match = dateString.match(format);
        if (match) {
          const date = new Date(dateString);
          if (!isNaN(date.getTime())) {
            return date.toISOString().split('T')[0];
          }
        }
      }

      return new Date().toISOString().split('T')[0];
    } catch {
      return new Date().toISOString().split('T')[0];
    }
  }

  private cleanText(text: string): string {
    return text
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/\s+/g, ' ')
      .trim();
  }

  private extractPDFUrl(text: string, link: string): string | undefined {
    // Look for PDF links in description
    const pdfMatch = text.match(/href=["']([^"']*\.pdf)["']/i);
    if (pdfMatch) {
      return this.resolveUrl(pdfMatch[1], link);
    }

    if (link.endsWith('.pdf')) {
      return link;
    }

    return undefined;
  }

  private resolveUrl(path: string, base: string): string {
    if (path.startsWith('http')) {
      return path;
    }

    const baseUrl = new URL(base);

    if (path.startsWith('/')) {
      return `${baseUrl.origin}${path}`;
    }

    return `${baseUrl.origin}/${path}`;
  }

  private filterByDateRange(
    records: SFCFilingRecord[],
    dateRange: { start: string; end: string }
  ): SFCFilingRecord[] {
    const start = new Date(dateRange.start);
    const end = new Date(dateRange.end);

    return records.filter(record => {
      const recordDate = new Date(record.published_date);
      return recordDate >= start && recordDate <= end;
    });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
