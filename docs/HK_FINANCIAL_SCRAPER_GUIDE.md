# HK Financial Scraper - Complete User Guide
# HK金融爬虫 - 完整用户指南

**Version / 版本**: 1.0.0
**Last Updated / 最后更新**: 2025-01-06

---

## 📋 Table of Contents / 目录

1. [Overview / 概述](#overview)
2. [Features / 功能特性](#features)
3. [Architecture / 架构](#architecture)
4. [Getting Started / 快速开始](#getting-started)
5. [Data Sources / 数据源](#data-sources)
6. [Scraping Options / 爬取选项](#scraping-options)
7. [Advanced Features / 高级功能](#advanced-features)
8. [Export & Download / 导出与下载](#export--download)
9. [Troubleshooting / 故障排除](#troubleshooting)
10. [API Reference / API参考](#api-reference)

---

## 📖 Overview / 概述

The **HK Financial Scraper** is an advanced web scraping tool that provides dual-engine scraping capabilities for Hong Kong financial data, NPM packages, and custom websites.

**HK金融爬虫** 是一个高级网页抓取工具，为香港金融数据、NPM包和自定义网站提供双引擎抓取能力。

### Key Highlights / 核心亮点

- **Dual-Engine Architecture**: Firecrawl (primary) + Puppeteer (fallback)
- **Multiple Data Sources**: HKEX, HKSFC, NPM
- **Smart Caching**: Reduces API calls and improves performance
- **Retry Logic**: Exponential backoff for reliability
- **Export Options**: JSON, CSV formats
- **Real-time Progress**: Live updates during scraping

---

## ✨ Features / 功能特性

### 1. Dual Scraping Engine / 双引擎抓取

```
Strategy: Auto (Default)
├─ Try Firecrawl First (Cloud-based, fast)
│  ├─ Success → Return result
│  └─ Failure → Fallback to Puppeteer
└─ Puppeteer (Browser automation, reliable)
   └─ Return result
```

**Advantages / 优势**:
- **Firecrawl**: Fast, cloud-based, converts to markdown
- **Puppeteer**: Handles JavaScript, form submission, screenshots
- **Auto-fallback**: Best of both worlds

### 2. Data Sources / 数据源

#### HKEX (Hong Kong Exchange) - 3 Sources
1. **CCASS Shareholding** - Daily participant shareholding data
2. **Company Announcements** - Listed company announcements
3. **Market Statistics** - Daily market turnover and statistics

#### HKSFC (Securities & Futures Commission) - 3 Sources
4. **HKSFC News** - Latest regulatory news
5. **Enforcement News** - Regulatory actions
6. **Circulars & Guidance** - Regulatory circulars

#### NPM (Node Package Manager) - 2 Sources
7. **NPM Search** - Search packages by keyword
8. **NPM Package Details** - Detailed package information

### 3. Caching System / 缓存系统

```typescript
Cache Features:
✓ In-memory storage (localStorage)
✓ Configurable TTL (Time-to-live)
✓ Cache hit tracking
✓ Manual cache clearing
✓ Cache statistics viewer
```

### 4. Retry Mechanism / 重试机制

```
Attempt 1: Immediate
Attempt 2: Wait 1 second
Attempt 3: Wait 2 seconds
Attempt 4: Wait 4 seconds (if max_retries = 4)
```

Exponential backoff prevents API rate limiting.

---

## 🏗️ Architecture / 架构

### Component Structure / 组件结构

```
src/
├── components/
│   └── HKFinancialScraper.tsx      # Main UI component (634 lines)
├── lib/
│   └── scraping/
│       ├── hk-financial-scraper.ts  # Scraping logic (700+ lines)
│       ├── firecrawl.ts            # Firecrawl implementation
│       ├── puppeteer.ts            # Puppeteer implementation
│       └── index.ts                # Unified interface
└── supabase/
    └── migrations/
        └── 20250706150000_hk_scraper_results.sql  # Database schema
```

### Database Schema / 数据库架构

**Tables / 表**:
1. `scraping_results` - Stores all scraping results
2. `scraping_cache` - Cached results for performance
3. `scraping_analytics` - Daily analytics and metrics

**Key Fields**:
```sql
scraping_results:
  - id, user_id, source_name, source_category
  - scraping_method, data (JSONB)
  - success, execution_time, created_at

scraping_cache:
  - cache_key, data (JSONB)
  - ttl, expires_at, hit_count

scraping_analytics:
  - user_id, date, source_category
  - total_requests, successful_requests
  - avg_execution_time, total_records_scraped
```

---

## 🚀 Getting Started / 快速开始

### Step 1: Access the Tool / 访问工具

1. Navigate to the application
2. Click the **"HK Scraper"** button in the navigation bar
3. The scraper interface will load

### Step 2: Select Data Sources / 选择数据源

**Method 1: Individual Selection / 单独选择**
- Click on any data source card to select it
- Selected cards will have a blue/purple border and checkmark

**Method 2: Batch Selection / 批量选择**
- Click **"Select All HKEX"** to select all HKEX sources
- Click **"Select All HKSFC"** to select all HKSFC sources
- Click **"Select All NPM"** to select all NPM sources

### Step 3: Configure Options / 配置选项

**Basic Options / 基础选项**:
- **Date Range**: Select start and end dates (for HKEX sources)
- **Stock Codes**: Enter comma-separated stock codes (e.g., `00700,00005`)
- **NPM Query**: Enter search keywords (e.g., `react, vue`)

**Advanced Options / 高级选项**:
Click **"Advanced Options"** to expand:
- **Scraping Strategy**: Auto, Firecrawl Only, Puppeteer Only
- **Max Retries**: 1-5 attempts (default: 3)
- **Rate Limit**: 0-5000ms delay between requests
- **Use Cache**: Enable/disable caching
- **Cache TTL**: 60-7200 seconds (default: 3600)

### Step 4: Start Scraping / 开始抓取

1. Click **"Start Scraping (N)"** button
2. Watch real-time progress bar
3. Results appear in the right panel as they complete

### Step 5: Export Results / 导出结果

**Individual Export / 单独导出**:
- Click **"JSON"** button to download single result as JSON
- Click **"CSV"** button to download single result as CSV

**Batch Export / 批量导出**:
- Click **"Export All"** button (top-right) to download all results as JSON

---

## 📊 Data Sources / 数据源

### HKEX CCASS Shareholding / CCASS持股数据

**URL**: `https://www3.hkexnews.hk/sdw/search/searchsdw.aspx`

**Input Required / 需要输入**:
- Stock codes (e.g., `00700` for Tencent)
- Date (uses date range start)

**Data Fields / 数据字段**:
```json
{
  "stockCode": "00700",
  "date": "2025-01-06",
  "participants": [
    {
      "participantId": "C00001",
      "participantName": "HSBC Nominees Limited",
      "shareholding": "1,000,000",
      "percentage": "5.2%"
    }
  ]
}
```

**Use Case / 使用场景**:
- Track institutional shareholding changes
- Monitor major shareholders
- Analyze market sentiment

---

### HKSFC News / 证监会新闻

**URL**: `https://apps.sfc.hk/edistributionWeb/gateway/EN/news-and-announcements/news/`

**Data Fields / 数据字段**:
```json
{
  "date": "2025-01-06",
  "title": "SFC reprimands and fines...",
  "category": "Enforcement",
  "source": "HKSFC",
  "url": "https://apps.sfc.hk/..."
}
```

**Use Case / 使用场景**:
- Monitor regulatory changes
- Track enforcement actions
- Stay updated on market rules

---

### NPM Package Search / NPM包搜索

**URL**: `https://www.npmjs.com/search?q={query}`

**Input Required / 需要输入**:
- Search query (e.g., `react`, `vue`, `typescript`)

**Data Fields / 数据字段**:
```json
{
  "name": "react",
  "url": "https://www.npmjs.com/package/react",
  "description": "React is a JavaScript library...",
  "downloads": "20M",
  "stars": "220k"
}
```

**Use Case / 使用场景**:
- Find popular packages
- Compare package statistics
- Research package dependencies

---

## ⚙️ Scraping Options / 爬取选项

### Scraping Strategy / 抓取策略

| Strategy | Description | Best For |
|----------|-------------|----------|
| **Auto** | Tries Firecrawl → Falls back to Puppeteer | Most use cases |
| **Firecrawl Only** | Cloud-based scraping only | Fast, simple pages |
| **Puppeteer Only** | Browser automation only | Complex forms, JavaScript |

### Max Retries / 最大重试次数

- **Range**: 1-5 attempts
- **Default**: 3 attempts
- **Recommended**: 3 for normal use, 5 for unreliable sources

### Rate Limiting / 速率限制

- **Range**: 0-5000ms
- **Default**: 1000ms (1 second)
- **Purpose**: Prevents being blocked by target websites
- **Recommendation**:
  - 500ms for testing
  - 1000ms for normal use
  - 2000ms+ for large batch operations

### Caching / 缓存

**Use Cache**:
- ✅ **Enable**: Faster responses, reduces API calls
- ❌ **Disable**: Always fetch fresh data

**Cache TTL** (Time-to-Live):
- **Range**: 60-7200 seconds (1 min - 2 hours)
- **Default**: 3600 seconds (1 hour)
- **Recommendation**:
  - 300s (5 min) for frequently changing data
  - 3600s (1 hour) for stable data
  - 7200s (2 hours) for historical data

---

## 🔧 Advanced Features / 高级功能

### 1. Cache Management / 缓存管理

**View Cache Statistics / 查看缓存统计**:
```
Click "Cache Stats" button
Shows:
- Number of cached entries
- Cache age
- TTL settings
```

**Clear Cache / 清除缓存**:
```
Click "Clear Cache" button
Removes all cached data
Next scrape will fetch fresh data
```

### 2. Batch Scraping / 批量抓取

**Process**:
```
1. Select multiple sources
2. Configure global options
3. Click "Start Scraping"
4. Each source processed sequentially
5. 1-second delay between sources (configurable)
```

**Benefits**:
- Scrape multiple sources with one click
- Consistent configuration across all sources
- Real-time progress tracking

### 3. Error Handling / 错误处理

**Graceful Degradation / 优雅降级**:
```
Firecrawl fails → Try Puppeteer
Puppeteer fails → Show error message
Individual source fails → Continue with next source
```

**Error Display**:
- Red border on failed results
- Error message shown
- Execution time still recorded

### 4. Export Formats / 导出格式

**JSON Export**:
```json
{
  "target": "HKEX CCASS",
  "timestamp": "2025-01-06T10:30:00Z",
  "success": true,
  "data": { ... },
  "recordCount": 15,
  "executionTime": 2500,
  "source": "puppeteer"
}
```

**CSV Export**:
```csv
participantId,participantName,shareholding,percentage
C00001,HSBC Nominees,1000000,5.2%
C00002,HKSCC Nominees,2500000,13.1%
```

---

## 📥 Export & Download / 导出与下载

### Individual Export / 单独导出

**JSON Download**:
1. Click **"JSON"** button on result card
2. File downloads: `{source-name}_2025-01-06.json`
3. Contains full result data

**CSV Download**:
1. Click **"CSV"** button on result card
2. File downloads: `{source-name}_2025-01-06.csv`
3. Tabular format (works with Excel, Google Sheets)

### Batch Export / 批量导出

**Export All Results**:
1. Click **"Export All"** button (top-right)
2. Downloads: `all-results_2025-01-06.json`
3. Array of all results with metadata

---

## 🔍 Troubleshooting / 故障排除

### Problem: "Scraping Failed" / 问题："抓取失败"

**Possible Causes / 可能原因**:
1. Target website is down
2. Network connectivity issues
3. Rate limiting (too many requests)
4. Invalid input (wrong stock code, etc.)

**Solutions / 解决方案**:
1. Check internet connection
2. Increase rate limit delay
3. Enable retry logic (max retries = 5)
4. Verify input data is correct
5. Try different scraping strategy

### Problem: "No Results Returned" / 问题："无结果返回"

**Possible Causes / 可能原因**:
1. Date range has no data
2. Stock code doesn't exist
3. Search query too specific

**Solutions / 解决方案**:
1. Expand date range
2. Verify stock code (use HKEX website)
3. Use broader search terms

### Problem: "Slow Performance" / 问题："性能缓慢"

**Possible Causes / 可能原因**:
1. Large number of sources selected
2. High rate limit delay
3. Puppeteer overhead

**Solutions / 解决方案**:
1. Scrape in smaller batches
2. Reduce rate limit (if safe)
3. Use Firecrawl strategy for simple pages
4. Enable caching

### Problem: "Cache Not Working" / 问题："缓存不工作"

**Possible Causes / 可能原因**:
1. Cache disabled in options
2. Cache expired (TTL exceeded)
3. Different input parameters

**Solutions / 解决方案**:
1. Enable "Use Cache" option
2. Increase cache TTL
3. Use identical input for cache hits

---

## 📚 API Reference / API参考

### Main Scraping Function / 主要抓取函数

```typescript
import { scrapeFinancialData } from '@/lib/scraping/hk-financial-scraper';

// Scrape HKSFC news
const result = await scrapeFinancialData('hksfc', {
  url: 'https://apps.sfc.hk/edistributionWeb/gateway/EN/news-and-announcements/news/',
  strategy: 'auto',
  dateRange: {
    start: '2025-01-01',
    end: '2025-01-31'
  },
  maxRetries: 3,
  rateLimit: 1000,
  useCache: true,
  cacheTTL: 3600
});

console.log(result);
// {
//   success: true,
//   data: [...],
//   recordCount: 10,
//   timestamp: Date,
//   source: 'firecrawl',
//   executionTime: 1500
// }
```

### Batch Scraping / 批量抓取

```typescript
import { batchScrape } from '@/lib/scraping/hk-financial-scraper';

const targets = [
  {
    name: 'HKSFC News',
    url: 'https://apps.sfc.hk/...',
    category: 'HKSFC'
  },
  {
    name: 'HKEX CCASS',
    url: 'https://www3.hkexnews.hk/...',
    category: 'HKEX',
    options: {
      stockCodes: ['00700', '00005']
    }
  }
];

const results = await batchScrape(targets, {
  strategy: 'auto',
  maxRetries: 3,
  rateLimit: 1000
});
```

### Export Functions / 导出函数

```typescript
import {
  exportToJSON,
  exportToCSV,
  downloadFile,
  generateFilename
} from '@/lib/scraping/hk-financial-scraper';

// Export to JSON
const json = exportToJSON(data, { prettify: true });
downloadFile(json, 'results.json', 'application/json');

// Export to CSV
const csv = exportToCSV(data);
downloadFile(csv, 'results.csv', 'text/csv');

// Generate filename
const filename = generateFilename('hkex-ccass', 'json');
// Returns: "hkex-ccass_2025-01-06.json"
```

### Cache Functions / 缓存函数

```typescript
import {
  getCacheStats,
  clearCache
} from '@/lib/scraping/hk-financial-scraper';

// View cache statistics
const stats = getCacheStats();
console.log(stats);
// {
//   size: 5,
//   entries: [
//     { key: "...", age: 120, ttl: 3600 },
//     ...
//   ]
// }

// Clear all cache
clearCache();
```

---

## 🎯 Best Practices / 最佳实践

### 1. Scraping Strategy / 抓取策略

✅ **DO**:
- Use "Auto" strategy for most cases
- Use "Firecrawl Only" for static pages
- Use "Puppeteer Only" for complex forms

❌ **DON'T**:
- Force Puppeteer for simple pages (slower)
- Disable retries (unreliable)

### 2. Rate Limiting / 速率限制

✅ **DO**:
- Set 1000ms minimum for production
- Increase to 2000ms+ for large batches
- Monitor for rate limit errors

❌ **DON'T**:
- Set to 0ms (risk of being blocked)
- Scrape too frequently

### 3. Caching / 缓存

✅ **DO**:
- Enable caching for repeated queries
- Set appropriate TTL based on data freshness
- Clear cache periodically

❌ **DON'T**:
- Cache real-time data for too long
- Forget to clear cache after errors

### 4. Error Handling / 错误处理

✅ **DO**:
- Check result.success before using data
- Log errors for debugging
- Implement fallback data sources

❌ **DON'T**:
- Ignore error messages
- Retry indefinitely without backoff

---

## 📞 Support / 支持

### Documentation / 文档
- This guide (comprehensive)
- API Reference (code comments)
- Database schema (migration file)

### Reporting Issues / 报告问题
1. Check troubleshooting section
2. Review browser console for errors
3. Test with different scraping strategies
4. Report bugs with:
   - Source URL
   - Input parameters
   - Error message
   - Browser console logs

---

## 🔄 Updates & Roadmap / 更新与路线图

### Version 1.0.0 (Current) / 版本 1.0.0 (当前)
- ✅ Dual-engine scraping (Firecrawl + Puppeteer)
- ✅ 8 data sources (HKEX, HKSFC, NPM)
- ✅ Smart caching system
- ✅ Retry logic with backoff
- ✅ Export to JSON/CSV
- ✅ Database integration

### Planned Features / 计划功能
- 📅 Scheduled scraping (cron jobs)
- 📊 Data visualization dashboard
- 📧 Email notifications
- 🔄 Webhook integrations
- 📱 Mobile-responsive UI improvements
- 🌐 More data sources (Webb-site.com, etc.)

---

## 📄 License / 许可证

This component is part of the JubitLLMNPMPlayground project.
All rights reserved.

---

**Last Updated / 最后更新**: 2025-01-06
**Version / 版本**: 1.0.0
**Maintained By / 维护者**: Development Team
