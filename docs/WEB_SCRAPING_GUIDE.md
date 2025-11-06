# Web Scraping 使用指南 / Web Scraping Guide

本指南介绍如何在项目中使用 Puppeteer 和 Firecrawl 进行网页抓取。

This guide explains how to use Puppeteer and Firecrawl for web scraping in this project.

## 目录 / Table of Contents

- [安装配置 / Installation & Configuration](#安装配置--installation--configuration)
- [Puppeteer 使用 / Puppeteer Usage](#puppeteer-使用--puppeteer-usage)
- [Firecrawl 使用 / Firecrawl Usage](#firecrawl-使用--firecrawl-usage)
- [统一接口 / Unified Interface](#统一接口--unified-interface)
- [最佳实践 / Best Practices](#最佳实践--best-practices)

## 安装配置 / Installation & Configuration

### 依赖包 / Dependencies

项目已安装以下依赖：

The following dependencies are already installed:

- `puppeteer` - Chrome/Chromium 自动化工具
- `@mendable/firecrawl-js` - Firecrawl API 客户端

### 环境变量配置 / Environment Variables

在 `.env` 文件中配置以下变量：

Configure the following variables in `.env` file:

```env
# Firecrawl API Key (必需 / Required)
VITE_FIRECRAWL_API_KEY=your_firecrawl_api_key_here

# Puppeteer 配置 (可选 / Optional)
VITE_PUPPETEER_HEADLESS=true
VITE_PUPPETEER_TIMEOUT=30000
```

**获取 Firecrawl API Key / Get Firecrawl API Key:**

1. 访问 [https://firecrawl.dev](https://firecrawl.dev)
2. 注册账户并获取 API Key
3. 将 API Key 添加到 `.env` 文件

## Puppeteer 使用 / Puppeteer Usage

### 基本用法 / Basic Usage

```typescript
import { getPuppeteerScraper } from '@/lib/scraping/puppeteer';

// 创建 scraper 实例 / Create scraper instance
const scraper = getPuppeteerScraper({
  headless: true,
  timeout: 30000,
});

// 抓取网页 / Scrape webpage
const result = await scraper.scrape('https://example.com');

console.log('Title:', result.title);
console.log('Content:', result.content);
console.log('Links:', result.links);

// 关闭浏览器 / Close browser
await scraper.close();
```

### 配置选项 / Configuration Options

```typescript
interface PuppeteerScrapingOptions {
  headless?: boolean;              // 无头模式 / Headless mode
  timeout?: number;                 // 超时时间（毫秒）/ Timeout (ms)
  waitUntil?: 'load' | 'domcontentloaded' | 'networkidle0' | 'networkidle2';
  viewport?: {                     // 视口大小 / Viewport size
    width?: number;
    height?: number;
  };
  userAgent?: string;              // 用户代理 / User agent
}
```

### 批量抓取 / Batch Scraping

```typescript
const urls = ['https://example.com', 'https://github.com'];
const results = await scraper.scrapeBatch(urls);

results.forEach((result) => {
  console.log(result.title);
});
```

### 执行自定义脚本 / Execute Custom Script

```typescript
const data = await scraper.executeScript(
  'https://example.com',
  async (page) => {
    await page.waitForSelector('h1');
    const title = await page.$eval('h1', (el) => el.textContent);
    return { title };
  }
);
```

### 截图功能 / Screenshot

```typescript
const result = await scraper.scrape('https://example.com');

// 截图以 base64 格式存储 / Screenshot stored as base64
if (result.screenshots?.fullPage) {
  const buffer = Buffer.from(result.screenshots.fullPage, 'base64');
  // 保存截图 / Save screenshot
}
```

## Firecrawl 使用 / Firecrawl Usage

### 基本用法 / Basic Usage

```typescript
import { getFirecrawlScraper } from '@/lib/scraping/firecrawl';

// 创建 scraper 实例 / Create scraper instance
const scraper = getFirecrawlScraper(apiKey, {
  format: 'markdown',
  onlyMainContent: true,
});

// 抓取网页 / Scrape webpage
const result = await scraper.scrape('https://example.com');

if (result.success) {
  console.log('Content:', result.content);
  console.log('Markdown:', result.markdown);
  console.log('Metadata:', result.metadata);
}
```

### 配置选项 / Configuration Options

```typescript
interface FirecrawlScrapingOptions {
  apiKey?: string;                 // API 密钥 / API key
  timeout?: number;                 // 超时时间 / Timeout
  format?: 'markdown' | 'html' | 'rawHtml' | 'links' | 'screenshot';
  onlyMainContent?: boolean;        // 仅主要内容 / Only main content
  screenshot?: boolean;             // 截图 / Screenshot
  waitFor?: number;                 // 等待时间 / Wait time
  actions?: Array<{                 // 操作序列 / Action sequence
    type: 'click' | 'wait' | 'scroll';
    selector?: string;
  }>;
}
```

### 不同格式 / Different Formats

```typescript
// Markdown 格式 / Markdown format
const markdown = await scraper.scrape(url, { format: 'markdown' });

// HTML 格式 / HTML format
const html = await scraper.scrape(url, { format: 'html' });

// 仅链接 / Links only
const links = await scraper.scrape(url, { format: 'links' });
```

### 爬取整个网站 / Crawl Entire Website

```typescript
const results = await scraper.crawl('https://example.com', {
  maxDepth: 2,        // 最大深度 / Max depth
  maxPages: 10,       // 最大页面数 / Max pages
  format: 'markdown',
});

results.forEach((result) => {
  console.log(result.url, result.content);
});
```

### 搜索内容 / Search Content

```typescript
const result = await scraper.search(
  'https://example.com',
  'search keyword',
  { format: 'markdown' }
);
```

## 统一接口 / Unified Interface

统一接口会自动选择最佳工具（优先使用 Firecrawl，如果失败则回退到 Puppeteer）。

The unified interface automatically selects the best tool (prefers Firecrawl, falls back to Puppeteer if failed).

### 基本用法 / Basic Usage

```typescript
import { scrapeWebpage, scrapeBatch } from '@/lib/scraping';

// 自动选择工具 / Automatically select tool
const result = await scrapeWebpage('https://example.com', {
  useFirecrawl: true,
  usePuppeteer: true,
  firecrawlApiKey: import.meta.env.VITE_FIRECRAWL_API_KEY,
});

console.log('Source:', result.source); // 'firecrawl' or 'puppeteer'
console.log('Title:', result.title);
console.log('Content:', result.content);
```

### 批量抓取 / Batch Scraping

```typescript
const urls = ['https://example.com', 'https://github.com'];
const results = await scrapeBatch(urls, {
  useFirecrawl: true,
  firecrawlApiKey: import.meta.env.VITE_FIRECRAWL_API_KEY,
});
```

## 最佳实践 / Best Practices

### 1. 错误处理 / Error Handling

```typescript
try {
  const result = await scrapeWebpage(url);
  // 处理结果 / Process result
} catch (error) {
  console.error('Scraping failed:', error);
  // 错误处理 / Error handling
}
```

### 2. 速率限制 / Rate Limiting

```typescript
// 添加延迟避免被封禁 / Add delay to avoid being blocked
for (const url of urls) {
  await scrapeWebpage(url);
  await new Promise(resolve => setTimeout(resolve, 1000)); // 1秒延迟 / 1s delay
}
```

### 3. 资源清理 / Resource Cleanup

```typescript
const scraper = getPuppeteerScraper();
try {
  const result = await scraper.scrape(url);
} finally {
  await scraper.close(); // 确保关闭浏览器 / Ensure browser is closed
}
```

### 4. 性能优化 / Performance Optimization

- 使用 `headless: true` 提高性能 / Use `headless: true` for better performance
- 设置合理的超时时间 / Set reasonable timeout
- 批量抓取时限制并发数 / Limit concurrency for batch scraping

### 5. 遵守 robots.txt / Respect robots.txt

```typescript
// 检查 robots.txt 是否允许抓取 / Check if robots.txt allows scraping
// 可以使用 crawler-robots 库 / Can use crawler-robots library
```

## 常见问题 / FAQ

### Q: Puppeteer 和 Firecrawl 有什么区别？/ What's the difference?

**A:** 
- **Puppeteer**: 直接控制浏览器，功能强大但资源消耗大 / Direct browser control, powerful but resource-intensive
- **Firecrawl**: API 服务，简单易用但需要 API Key / API service, simple but requires API key

### Q: 如何选择使用哪个工具？/ How to choose?

**A:** 
- 如果已有 Firecrawl API Key，优先使用 Firecrawl / Prefer Firecrawl if you have API key
- 需要复杂交互时使用 Puppeteer / Use Puppeteer for complex interactions
- 使用统一接口自动选择 / Use unified interface for automatic selection

### Q: Puppeteer 安装失败怎么办？/ What if Puppeteer installation fails?

**A:** 
Puppeteer 会自动下载 Chromium。如果失败，可以手动设置：

Puppeteer automatically downloads Chromium. If it fails, you can set manually:

```typescript
import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({
  executablePath: '/path/to/chromium',
});
```

## 更多资源 / More Resources

- [Puppeteer 文档](https://pptr.dev/)
- [Firecrawl 文档](https://docs.firecrawl.dev/)
- [示例代码](../src/lib/scraping/examples.ts)

