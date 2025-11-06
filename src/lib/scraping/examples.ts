/**
 * Web Scraping 使用示例 / Web Scraping Usage Examples
 * 
 * 本文件包含 Puppeteer 和 Firecrawl 的使用示例
 * This file contains usage examples for Puppeteer and Firecrawl
 */

import { PuppeteerScraper, getPuppeteerScraper } from './puppeteer';
import { FirecrawlScraper, getFirecrawlScraper } from './firecrawl';
import { scrapeWebpage, scrapeBatch } from './index';

// ==================== Puppeteer 示例 / Puppeteer Examples ====================

/**
 * 示例 1: 基本使用 Puppeteer 抓取网页 / Example 1: Basic Puppeteer scraping
 */
export async function example1_BasicPuppeteer() {
  const scraper = getPuppeteerScraper({
    headless: true,
    timeout: 30000,
  });

  try {
    const result = await scraper.scrape('https://example.com');
    console.log('Title:', result.title);
    console.log('Content length:', result.content.length);
    console.log('Links found:', result.links?.length || 0);
    
    // 记得关闭浏览器 / Remember to close browser
    await scraper.close();
  } catch (error) {
    console.error('Scraping failed:', error);
  }
}

/**
 * 示例 2: 批量抓取 / Example 2: Batch scraping
 */
export async function example2_BatchScraping() {
  const scraper = new PuppeteerScraper({
    headless: true,
  });

  const urls = [
    'https://example.com',
    'https://www.wikipedia.org',
    'https://github.com',
  ];

  try {
    const results = await scraper.scrapeBatch(urls);
    console.log(`Successfully scraped ${results.length} pages`);
    
    results.forEach((result, index) => {
      console.log(`Page ${index + 1}: ${result.title}`);
    });

    await scraper.close();
  } catch (error) {
    console.error('Batch scraping failed:', error);
  }
}

/**
 * 示例 3: 执行自定义脚本 / Example 3: Execute custom script
 */
export async function example3_CustomScript() {
  const scraper = getPuppeteerScraper();

  try {
    const data = await scraper.executeScript(
      'https://example.com',
      async (page) => {
        // 等待特定元素 / Wait for specific element
        await page.waitForSelector('h1');
        
        // 提取数据 / Extract data
        const title = await page.$eval('h1', (el) => el.textContent);
        const links = await page.$$eval('a', (links) =>
          links.map((link) => link.href)
        );
        
        return { title, links };
      }
    );

    console.log('Custom data:', data);
    await scraper.close();
  } catch (error) {
    console.error('Custom script failed:', error);
  }
}

/**
 * 示例 4: 截图功能 / Example 4: Screenshot functionality
 */
export async function example4_Screenshot() {
  const scraper = getPuppeteerScraper({
    headless: true,
  });

  try {
    const result = await scraper.scrape('https://example.com');
    
    if (result.screenshots?.fullPage) {
      // 保存截图 / Save screenshot
      const fs = await import('fs');
      const buffer = Buffer.from(result.screenshots.fullPage, 'base64');
      fs.writeFileSync('screenshot.png', buffer);
      console.log('Screenshot saved!');
    }

    await scraper.close();
  } catch (error) {
    console.error('Screenshot failed:', error);
  }
}

// ==================== Firecrawl 示例 / Firecrawl Examples ====================

/**
 * 示例 5: 基本使用 Firecrawl 抓取网页 / Example 5: Basic Firecrawl scraping
 */
export async function example5_BasicFirecrawl() {
  const apiKey = import.meta.env.VITE_FIRECRAWL_API_KEY;
  const scraper = getFirecrawlScraper(apiKey, {
    format: 'markdown',
    onlyMainContent: true,
  });

  try {
    const result = await scraper.scrape('https://example.com');
    
    if (result.success) {
      console.log('Content:', result.content);
      console.log('Metadata:', result.metadata);
      console.log('Links:', result.links?.length || 0);
    } else {
      console.error('Scraping failed:', result.error);
    }
  } catch (error) {
    console.error('Firecrawl scraping failed:', error);
  }
}

/**
 * 示例 6: 使用不同格式 / Example 6: Using different formats
 */
export async function example6_DifferentFormats() {
  const apiKey = import.meta.env.VITE_FIRECRAWL_API_KEY;
  const scraper = getFirecrawlScraper(apiKey);

  // Markdown 格式 / Markdown format
  const markdownResult = await scraper.scrape('https://example.com', {
    format: 'markdown',
  });

  // HTML 格式 / HTML format
  const htmlResult = await scraper.scrape('https://example.com', {
    format: 'html',
  });

  // 链接格式 / Links format
  const linksResult = await scraper.scrape('https://example.com', {
    format: 'links',
  });

  console.log('Markdown:', markdownResult.markdown);
  console.log('HTML:', htmlResult.html);
  console.log('Links:', linksResult.links);
}

/**
 * 示例 7: 爬取整个网站 / Example 7: Crawl entire website
 */
export async function example7_CrawlWebsite() {
  const apiKey = import.meta.env.VITE_FIRECRAWL_API_KEY;
  const scraper = getFirecrawlScraper(apiKey);

  try {
    const results = await scraper.crawl('https://example.com', {
      maxDepth: 2,
      maxPages: 10,
      format: 'markdown',
    });

    console.log(`Crawled ${results.length} pages`);
    results.forEach((result, index) => {
      console.log(`Page ${index + 1}: ${result.url}`);
    });
  } catch (error) {
    console.error('Crawling failed:', error);
  }
}

/**
 * 示例 8: 搜索网页内容 / Example 8: Search webpage content
 */
export async function example8_SearchContent() {
  const apiKey = import.meta.env.VITE_FIRECRAWL_API_KEY;
  const scraper = getFirecrawlScraper(apiKey);

  try {
    const result = await scraper.search(
      'https://example.com',
      'example',
      { format: 'markdown' }
    );

    if (result.success) {
      console.log('Search results:', result.content);
    }
  } catch (error) {
    console.error('Search failed:', error);
  }
}

// ==================== 统一接口示例 / Unified Interface Examples ====================

/**
 * 示例 9: 使用统一接口 / Example 9: Using unified interface
 */
export async function example9_UnifiedInterface() {
  try {
    // 自动选择最佳工具 / Automatically select best tool
    const result = await scrapeWebpage('https://example.com', {
      useFirecrawl: true,
      usePuppeteer: true,
      firecrawlApiKey: import.meta.env.VITE_FIRECRAWL_API_KEY,
    });

    console.log('Source:', result.source);
    console.log('Title:', result.title);
    console.log('Content:', result.content);
  } catch (error) {
    console.error('Unified scraping failed:', error);
  }
}

/**
 * 示例 10: 批量抓取使用统一接口 / Example 10: Batch scraping with unified interface
 */
export async function example10_BatchUnified() {
  const urls = [
    'https://example.com',
    'https://www.wikipedia.org',
    'https://github.com',
  ];

  try {
    const results = await scrapeBatch(urls, {
      useFirecrawl: true,
      firecrawlApiKey: import.meta.env.VITE_FIRECRAWL_API_KEY,
    });

    console.log(`Successfully scraped ${results.length} pages`);
    results.forEach((result) => {
      console.log(`${result.url} - Source: ${result.source}`);
    });
  } catch (error) {
    console.error('Batch scraping failed:', error);
  }
}

// ==================== React Hook 示例 / React Hook Example ====================

/**
 * 示例 11: 在 React 组件中使用 / Example 11: Use in React component
 * 
 * 注意：需要在组件文件中导入 React / Note: Need to import React in component file
 * import { useState } from 'react';
 */
export function useWebScraping() {
  // 注意：这是示例代码，实际使用时需要导入 React hooks
  // Note: This is example code, need to import React hooks in actual usage
  // const [loading, setLoading] = useState(false);
  // const [result, setResult] = useState<any>(null);
  // const [error, setError] = useState<string | null>(null);
  
  const loading = false;
  const result = null;
  const error = null;

  const scrape = async (url: string, config?: any) => {
    // setLoading(true);
    // setError(null);

    try {
      const data = await scrapeWebpage(url, config);
      // setResult(data);
      return data;
    } catch (err) {
      // setError(err instanceof Error ? err.message : 'Unknown error');
      throw err;
    } finally {
      // setLoading(false);
    }
  };

  return { scrape, loading, result, error };
}

// 实际在 React 组件中使用示例 / Actual usage in React component:
/*
import { useState } from 'react';
import { scrapeWebpage } from '@/lib/scraping';

function MyComponent() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleScrape = async (url: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await scrapeWebpage(url);
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={() => handleScrape('https://example.com')}>
        Scrape
      </button>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {result && <pre>{result.content}</pre>}
    </div>
  );
}
*/

