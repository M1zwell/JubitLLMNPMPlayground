# Web Scraping 模块 / Web Scraping Module

本模块提供了 Puppeteer 和 Firecrawl 的集成，用于网页抓取功能。

This module provides integration of Puppeteer and Firecrawl for web scraping functionality.

## 快速开始 / Quick Start

### 1. 配置环境变量 / Configure Environment Variables

在 `.env` 文件中添加 Firecrawl API Key：

Add Firecrawl API Key in `.env` file:

```env
VITE_FIRECRAWL_API_KEY=your_api_key_here
```

### 2. 基本使用 / Basic Usage

```typescript
import { scrapeWebpage } from '@/lib/scraping';

// 自动选择最佳工具 / Automatically select best tool
const result = await scrapeWebpage('https://example.com');

console.log(result.title);
console.log(result.content);
console.log(result.source); // 'firecrawl' or 'puppeteer'
```

### 3. 使用特定工具 / Use Specific Tool

**Puppeteer:**
```typescript
import { getPuppeteerScraper } from '@/lib/scraping/puppeteer';

const scraper = getPuppeteerScraper();
const result = await scraper.scrape('https://example.com');
await scraper.close();
```

**Firecrawl:**
```typescript
import { getFirecrawlScraper } from '@/lib/scraping/firecrawl';

const scraper = getFirecrawlScraper(apiKey);
const result = await scraper.scrape('https://example.com');
```

## 文件结构 / File Structure

```
src/lib/scraping/
├── index.ts          # 统一接口导出 / Unified interface export
├── puppeteer.ts      # Puppeteer 实现 / Puppeteer implementation
├── firecrawl.ts      # Firecrawl 实现 / Firecrawl implementation
├── examples.ts       # 使用示例 / Usage examples
└── README.md         # 本文件 / This file
```

## 更多信息 / More Information

详细文档请参考：[WEB_SCRAPING_GUIDE.md](../../../docs/WEB_SCRAPING_GUIDE.md)

For detailed documentation, see: [WEB_SCRAPING_GUIDE.md](../../../docs/WEB_SCRAPING_GUIDE.md)

