// Web Scraping 工具模块导出 / Web Scraping utilities export
export * from './puppeteer';
export * from './firecrawl';

// 统一接口 / Unified interface
export interface ScrapingConfig {
  usePuppeteer?: boolean;
  useFirecrawl?: boolean;
  puppeteerOptions?: import('./puppeteer').PuppeteerScrapingOptions;
  firecrawlOptions?: import('./firecrawl').FirecrawlScrapingOptions;
  firecrawlApiKey?: string;
}

export interface UnifiedScrapingResult {
  url: string;
  title?: string;
  content: string;
  html?: string;
  markdown?: string;
  metadata?: Record<string, any>;
  links?: string[];
  images?: string[];
  screenshots?: {
    fullPage?: string;
    viewport?: string;
  };
  source: 'puppeteer' | 'firecrawl';
  timestamp: Date;
}

/**
 * 统一的网页抓取函数 / Unified web scraping function
 * 自动选择最佳工具 / Automatically selects the best tool
 */
export async function scrapeWebpage(
  url: string,
  config: ScrapingConfig = {}
): Promise<UnifiedScrapingResult> {
  const { usePuppeteer, useFirecrawl, puppeteerOptions, firecrawlOptions, firecrawlApiKey } = config;

  // 优先使用 Firecrawl（如果配置了 API key）/ Prefer Firecrawl if API key is configured
  if (useFirecrawl !== false && (firecrawlApiKey || import.meta.env.VITE_FIRECRAWL_API_KEY)) {
    try {
      const { getFirecrawlScraper } = await import('./firecrawl');
      const scraper = getFirecrawlScraper(firecrawlApiKey, firecrawlOptions);
      const result = await scraper.scrape(url, firecrawlOptions);

      if (result.success && result.content) {
        return {
          url: result.url,
          title: result.metadata?.title,
          content: result.content,
          markdown: result.markdown,
          html: result.html,
          metadata: result.metadata,
          links: result.links,
          screenshots: result.screenshot
            ? {
                fullPage: result.screenshot,
              }
            : undefined,
          source: 'firecrawl',
          timestamp: result.timestamp,
        };
      }
    } catch (error) {
      console.warn('Firecrawl scraping failed, falling back to Puppeteer:', error);
    }
  }

  // 回退到 Puppeteer / Fallback to Puppeteer
  if (usePuppeteer !== false) {
    try {
      const { getPuppeteerScraper } = await import('./puppeteer');
      const scraper = getPuppeteerScraper(puppeteerOptions);
      const result = await scraper.scrape(url, puppeteerOptions);

      return {
        url: result.url,
        title: result.title,
        content: result.content,
        html: result.html,
        metadata: result.metadata,
        links: result.links,
        images: result.images,
        screenshots: result.screenshots,
        source: 'puppeteer',
        timestamp: result.timestamp,
      };
    } catch (error) {
      throw new Error(`Both scraping methods failed. Last error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  throw new Error('No scraping method available. Please configure at least one scraper.');
}

/**
 * 批量抓取 / Batch scraping
 */
export async function scrapeBatch(
  urls: string[],
  config: ScrapingConfig = {}
): Promise<UnifiedScrapingResult[]> {
  const results: UnifiedScrapingResult[] = [];

  for (const url of urls) {
    try {
      const result = await scrapeWebpage(url, config);
      results.push(result);
    } catch (error) {
      console.error(`Error scraping ${url}:`, error);
      // 继续处理下一个 URL / Continue with next URL
    }
  }

  return results;
}

