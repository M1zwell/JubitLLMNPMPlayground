import puppeteer, { Browser, Page } from 'puppeteer';

export interface PuppeteerScrapingOptions {
  headless?: boolean;
  timeout?: number;
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';
  viewport?: {
    width?: number;
    height?: number;
  };
  userAgent?: string;
}

export interface ScrapingResult {
  url: string;
  title: string;
  content: string;
  html: string;
  screenshots?: {
    fullPage?: string;
    viewport?: string;
  };
  metadata?: {
    description?: string;
    keywords?: string;
    ogImage?: string;
    ogTitle?: string;
    ogDescription?: string;
  };
  links?: string[];
  images?: string[];
  timestamp: Date;
}

export class PuppeteerScraper {
  private browser: Browser | null = null;
  private defaultOptions: PuppeteerScrapingOptions;

  constructor(options: PuppeteerScrapingOptions = {}) {
    this.defaultOptions = {
      headless: true,
      timeout: 30000,
      waitUntil: 'networkidle2',
      viewport: {
        width: 1920,
        height: 1080,
      },
      userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      ...options,
    };
  }

  /**
   * 初始化浏览器实例 / Initialize browser instance
   */
  async init(): Promise<void> {
    if (this.browser) {
      return;
    }

    this.browser = await puppeteer.launch({
      headless: this.defaultOptions.headless,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
      ],
    });
  }

  /**
   * 关闭浏览器实例 / Close browser instance
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * 创建新页面 / Create new page
   */
  async createPage(): Promise<Page> {
    if (!this.browser) {
      await this.init();
    }

    const page = await this.browser!.newPage();
    
    if (this.defaultOptions.viewport) {
      await page.setViewport({
        width: this.defaultOptions.viewport.width || 1920,
        height: this.defaultOptions.viewport.height || 1080,
      });
    }

    if (this.defaultOptions.userAgent) {
      await page.setUserAgent(this.defaultOptions.userAgent);
    }

    return page;
  }

  /**
   * 抓取单个网页 / Scrape a single webpage
   */
  async scrape(url: string, options: Partial<PuppeteerScrapingOptions> = {}): Promise<ScrapingResult> {
    const opts = { ...this.defaultOptions, ...options };
    const page = await this.createPage();

    try {
      // 导航到目标页面 / Navigate to target page
      await page.goto(url, {
        waitUntil: opts.waitUntil,
        timeout: opts.timeout,
      });

      // 等待页面加载完成 / Wait for page to load
      await page.waitForTimeout(2000);

      // 提取数据 / Extract data
      const result = await page.evaluate(() => {
        // 提取标题 / Extract title
        const title = document.title || '';

        // 提取正文内容 / Extract main content
        const bodyText = document.body?.innerText || '';
        
        // 提取 HTML / Extract HTML
        const html = document.documentElement.outerHTML;

        // 提取元数据 / Extract metadata
        const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
        const metaKeywords = document.querySelector('meta[name="keywords"]')?.getAttribute('content') || '';
        const ogImage = document.querySelector('meta[property="og:image"]')?.getAttribute('content') || '';
        const ogTitle = document.querySelector('meta[property="og:title"]')?.getAttribute('content') || '';
        const ogDescription = document.querySelector('meta[property="og:description"]')?.getAttribute('content') || '';

        // 提取所有链接 / Extract all links
        const links = Array.from(document.querySelectorAll('a[href]'))
          .map((a) => (a as HTMLAnchorElement).href)
          .filter((href) => href.startsWith('http'));

        // 提取所有图片 / Extract all images
        const images = Array.from(document.querySelectorAll('img[src]'))
          .map((img) => (img as HTMLImageElement).src)
          .filter((src) => src.startsWith('http'));

        return {
          title,
          content: bodyText,
          html,
          metadata: {
            description: metaDescription,
            keywords: metaKeywords,
            ogImage,
            ogTitle,
            ogDescription,
          },
          links,
          images,
        };
      });

      // 截图（可选）/ Screenshots (optional)
      const screenshots: ScrapingResult['screenshots'] = {};
      
      if (opts.viewport) {
        screenshots.viewport = await page.screenshot({
          encoding: 'base64',
          type: 'png',
        }) as string;
      }

      screenshots.fullPage = await page.screenshot({
        encoding: 'base64',
        type: 'png',
        fullPage: true,
      }) as string;

      await page.close();

      return {
        url,
        ...result,
        screenshots,
        timestamp: new Date(),
      };
    } catch (error) {
      await page.close();
      throw new Error(`Failed to scrape ${url}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 批量抓取多个网页 / Scrape multiple webpages
   */
  async scrapeBatch(urls: string[], options: Partial<PuppeteerScrapingOptions> = {}): Promise<ScrapingResult[]> {
    const results: ScrapingResult[] = [];

    for (const url of urls) {
      try {
        const result = await this.scrape(url, options);
        results.push(result);
      } catch (error) {
        console.error(`Error scraping ${url}:`, error);
        // 继续处理下一个 URL / Continue with next URL
      }
    }

    return results;
  }

  /**
   * 执行自定义脚本 / Execute custom script
   */
  async executeScript<T>(
    url: string,
    script: (page: Page) => Promise<T>,
    options: Partial<PuppeteerScrapingOptions> = {}
  ): Promise<T> {
    const page = await this.createPage();

    try {
      await page.goto(url, {
        waitUntil: options.waitUntil || this.defaultOptions.waitUntil,
        timeout: options.timeout || this.defaultOptions.timeout,
      });

      const result = await script(page);
      await page.close();

      return result;
    } catch (error) {
      await page.close();
      throw new Error(`Failed to execute script on ${url}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  /**
   * 等待元素出现 / Wait for element to appear
   */
  async waitForSelector(url: string, selector: string, timeout = 30000): Promise<void> {
    const page = await this.createPage();

    try {
      await page.goto(url, { waitUntil: 'domcontentloaded' });
      await page.waitForSelector(selector, { timeout });
      await page.close();
    } catch (error) {
      await page.close();
      throw new Error(`Element ${selector} not found on ${url}`);
    }
  }
}

// 导出单例实例 / Export singleton instance
let scraperInstance: PuppeteerScraper | null = null;

export function getPuppeteerScraper(options?: PuppeteerScrapingOptions): PuppeteerScraper {
  if (!scraperInstance) {
    scraperInstance = new PuppeteerScraper(options);
  }
  return scraperInstance;
}

