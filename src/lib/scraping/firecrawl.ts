import FirecrawlApp from '@mendable/firecrawl-js';

export interface FirecrawlScrapingOptions {
  apiKey?: string;
  timeout?: number;
  format?: 'markdown' | 'html' | 'rawHtml' | 'links' | 'screenshot';
  includeTags?: string[];
  excludeTags?: string[];
  waitFor?: number;
  screenshot?: boolean;
  actions?: Array<{
    type: 'click' | 'wait' | 'scroll';
    selector?: string;
    text?: string;
    wait?: number;
  }>;
  onlyMainContent?: boolean;
  pdf?: boolean;
  summary?: boolean;
}

export interface FirecrawlScrapingResult {
  success: boolean;
  url: string;
  content?: string;
  markdown?: string;
  html?: string;
  links?: string[];
  screenshot?: string;
  metadata?: {
    title?: string;
    description?: string;
    language?: string;
    author?: string;
    publisher?: string;
    publishedTime?: string;
    modifiedTime?: string;
    image?: string;
  };
  error?: string;
  timestamp: Date;
}

export class FirecrawlScraper {
  private app: FirecrawlApp;
  private defaultOptions: FirecrawlScrapingOptions;

  constructor(apiKey?: string, options: FirecrawlScrapingOptions = {}) {
    const key = apiKey || import.meta.env.VITE_FIRECRAWL_API_KEY || '';
    
    if (!key) {
      throw new Error('Firecrawl API key is required. Set VITE_FIRECRAWL_API_KEY in .env file.');
    }

    this.app = new FirecrawlApp({ apiKey: key });
    this.defaultOptions = {
      format: 'markdown',
      timeout: 30000,
      onlyMainContent: true,
      ...options,
    };
  }

  /**
   * 抓取单个网页 / Scrape a single webpage
   */
  async scrape(url: string, options: Partial<FirecrawlScrapingOptions> = {}): Promise<FirecrawlScrapingResult> {
    const opts = { ...this.defaultOptions, ...options };

    try {
      const response = await this.app.scrapeUrl(url, {
        formats: opts.format ? [opts.format] : ['markdown'],
        timeout: opts.timeout,
        waitFor: opts.waitFor,
        screenshot: opts.screenshot,
        actions: opts.actions,
        onlyMainContent: opts.onlyMainContent,
        pdf: opts.pdf,
        summary: opts.summary,
        includeTags: opts.includeTags,
        excludeTags: opts.excludeTags,
      });

      if (response.success) {
        return {
          success: true,
          url,
          content: response.data?.markdown || response.data?.content,
          markdown: response.data?.markdown,
          html: response.data?.html,
          links: response.data?.links,
          screenshot: response.data?.screenshot,
          metadata: response.data?.metadata,
          timestamp: new Date(),
        };
      } else {
        return {
          success: false,
          url,
          error: response.error || 'Unknown error',
          timestamp: new Date(),
        };
      }
    } catch (error) {
      return {
        success: false,
        url,
        error: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
      };
    }
  }

  /**
   * 批量抓取多个网页 / Scrape multiple webpages
   */
  async scrapeBatch(
    urls: string[],
    options: Partial<FirecrawlScrapingOptions> = {}
  ): Promise<FirecrawlScrapingResult[]> {
    const results: FirecrawlScrapingResult[] = [];

    for (const url of urls) {
      try {
        const result = await this.scrape(url, options);
        results.push(result);
      } catch (error) {
        results.push({
          success: false,
          url,
          error: error instanceof Error ? error.message : String(error),
          timestamp: new Date(),
        });
      }
    }

    return results;
  }

  /**
   * 抓取网站地图 / Scrape sitemap
   */
  async scrapeSitemap(sitemapUrl: string): Promise<string[]> {
    try {
      const response = await this.app.scrapeUrl(sitemapUrl, {
        formats: ['links'],
      });

      if (response.success && response.data?.links) {
        return response.data.links;
      }

      return [];
    } catch (error) {
      console.error('Error scraping sitemap:', error);
      return [];
    }
  }

  /**
   * 使用爬虫模式抓取整个网站 / Scrape entire website using crawl mode
   */
  async crawl(
    startUrl: string,
    options: {
      maxDepth?: number;
      maxPages?: number;
      allowBackwardLinks?: boolean;
      includeSubdomains?: boolean;
      format?: 'markdown' | 'html';
    } = {}
  ): Promise<FirecrawlScrapingResult[]> {
    try {
      const response = await this.app.crawlUrl(startUrl, {
        maxDepth: options.maxDepth || 1,
        maxPages: options.maxPages || 10,
        allowBackwardLinks: options.allowBackwardLinks || false,
        includeSubdomains: options.includeSubdomains || false,
        formats: options.format ? [options.format] : ['markdown'],
      });

      if (response.success && response.data) {
        return response.data.map((item: any) => ({
          success: true,
          url: item.url || startUrl,
          content: item.markdown || item.content,
          markdown: item.markdown,
          html: item.html,
          metadata: item.metadata,
          timestamp: new Date(),
        }));
      }

      return [];
    } catch (error) {
      console.error('Error crawling website:', error);
      return [];
    }
  }

  /**
   * 搜索网页内容 / Search webpage content
   */
  async search(
    url: string,
    query: string,
    options: Partial<FirecrawlScrapingOptions> = {}
  ): Promise<FirecrawlScrapingResult> {
    const result = await this.scrape(url, options);

    if (result.success && result.content) {
      // 简单的文本搜索 / Simple text search
      const lines = result.content.split('\n');
      const matchingLines = lines.filter((line) =>
        line.toLowerCase().includes(query.toLowerCase())
      );

      return {
        ...result,
        content: matchingLines.join('\n'),
      };
    }

    return result;
  }
}

// 导出单例实例 / Export singleton instance
let firecrawlInstance: FirecrawlScraper | null = null;

export function getFirecrawlScraper(apiKey?: string, options?: FirecrawlScrapingOptions): FirecrawlScraper {
  if (!firecrawlInstance) {
    firecrawlInstance = new FirecrawlScraper(apiKey, options);
  }
  return firecrawlInstance;
}

