# Puppeteer HKEx SPA Table Crawler - Complete Guide

## 🎯 Overview

This guide shows how to use Puppeteer to crawl dynamic tables from HKEx Single Page Applications (SPAs). HKEx pages use JavaScript rendering, AJAX loading, and complex pagination - perfect for Puppeteer.

---

## 📦 Installation

```bash
# Install Puppeteer (downloads Chromium automatically)
npm install puppeteer

# Or install core only (use system Chrome)
npm install puppeteer-core
```

---

## 🚀 Quick Start

### Method 1: Using MCP Server (Recommended)

You already have Puppeteer MCP configured in `.claude/settings.local.json`:

```json
{
  "mcpServers": {
    "puppeteer": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-puppeteer"]
    }
  }
}
```

**Usage via Claude Code:**
```
Ask Claude: "Use Puppeteer to scrape CCASS holdings table from https://www.hkexnews.hk/sdw/search/searchsdw.aspx for stock code 00700"
```

### Method 2: Direct Node.js Script

```javascript
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: false });
const page = await browser.newPage();

await page.goto('https://www.hkexnews.hk/sdw/search/searchsdw.aspx');
// ... scraping logic
await browser.close();
```

### Method 3: Using the HKEx Crawler Utility

```typescript
import { crawlHKExTable } from './src/lib/scraping/puppeteer-hkex-crawler';
import puppeteer from 'puppeteer';

const browser = await puppeteer.launch();
const result = await crawlHKExTable(browser, {
  url: 'https://www.hkexnews.hk/sdw/search/searchsdw.aspx',
  tableSelector: 'table.table',
  waitForSelector: '#mutualmarket-result',
  pagination: { enabled: true, maxPages: 5 },
});

console.log(`Scraped ${result.totalRows} rows`);
```

---

## 📊 HKEx Pages You Can Scrape

### 1. CCASS Participant Shareholding
**URL:** https://www.hkexnews.hk/sdw/search/searchsdw.aspx

**What it contains:**
- Participant ID and Name
- Number of shares held
- Percentage of total issued shares

**Table Characteristics:**
- JavaScript-rendered table
- AJAX form submission
- Date picker interaction
- Stock code filter

**Config Example:**
```javascript
{
  url: 'https://www.hkexnews.hk/sdw/search/searchsdw.aspx',
  tableSelector: 'table.table',
  waitForSelector: '#mutualmarket-result',
  filters: {
    stockCode: '00700',
    dateRange: { start: '2024-11-01', end: '2024-11-10' }
  }
}
```

### 2. Listed Company Announcements
**URL:** https://www1.hkexnews.hk/search/titlesearch.xhtml?lang=en

**What it contains:**
- Announcement title and date
- Document type
- PDF download links

**Table Characteristics:**
- Infinite scroll loading
- Advanced search filters
- Document preview popups

**Config Example:**
```javascript
{
  url: 'https://www1.hkexnews.hk/search/titlesearch.xhtml?lang=en',
  tableSelector: '.result-section',
  scrollToLoad: true,
  filters: {
    stockCode: '00700',
    category: 'Financial Statements'
  }
}
```

### 3. Market Statistics
**URL:** https://www.hkex.com.hk/Market-Data/Statistics/Consolidated-Data/Securities-Statistics

**What it contains:**
- Daily turnover and volume
- Market cap data
- Trading statistics

**Table Characteristics:**
- Server-side pagination
- Export to Excel option
- Multiple tabs/sections

**Config Example:**
```javascript
{
  url: 'https://www.hkex.com.hk/Market-Data/Statistics/Consolidated-Data/Securities-Statistics',
  tableSelector: 'table.data-table',
  pagination: {
    enabled: true,
    nextButtonSelector: 'button.next',
    maxPages: 10
  }
}
```

### 4. Derivative Market Statistics
**URL:** https://www.hkex.com.hk/Market-Data/Statistics/Derivatives

**What it contains:**
- Futures and options volume
- Open interest
- Contract specifications

### 5. Stock Quote and Trading Info
**URL:** https://www.hkex.com.hk/Market-Data/Securities-Prices/Equities

**What it contains:**
- Real-time quotes
- Bid/ask spreads
- Historical prices

---

## 🛠️ Advanced Features

### Handle Dynamic Loading

```javascript
// Wait for network idle (AJAX complete)
await page.waitForNetworkIdle({ timeout: 10000 });

// Wait for specific element
await page.waitForSelector('table tbody tr', { timeout: 30000 });

// Wait for table to have data
await page.waitForFunction(() => {
  const rows = document.querySelectorAll('table tbody tr');
  return rows.length > 0;
}, { timeout: 15000 });
```

### Handle Infinite Scroll

```javascript
async function scrollToLoadAll(page) {
  let previousHeight = 0;

  while (true) {
    // Scroll to bottom
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));

    // Wait for new content
    await page.waitForTimeout(2000);

    // Check if new content loaded
    const newHeight = await page.evaluate(() => document.body.scrollHeight);
    if (newHeight === previousHeight) break;

    previousHeight = newHeight;
  }
}
```

### Handle Pagination

```javascript
async function scrapeAllPages(page, tableSelector, maxPages = 10) {
  const allData = [];

  for (let i = 0; i < maxPages; i++) {
    // Extract current page
    const pageData = await extractTableData(page, tableSelector);
    allData.push(...pageData);

    // Check for next button
    const hasNext = await page.$('button.next:not([disabled])');
    if (!hasNext) break;

    // Click next
    await page.click('button.next');
    await page.waitForTimeout(2000);
  }

  return allData;
}
```

### Extract Complex Tables

```javascript
async function extractComplexTable(page) {
  return await page.evaluate(() => {
    const rows = [];
    const table = document.querySelector('table');

    // Handle merged cells
    const dataRows = table.querySelectorAll('tbody tr');

    dataRows.forEach(row => {
      const cells = row.querySelectorAll('td');

      rows.push({
        // Extract text
        text: cells[0]?.textContent?.trim(),

        // Extract links
        link: cells[1]?.querySelector('a')?.href,

        // Extract data attributes
        dataValue: cells[2]?.getAttribute('data-value'),

        // Parse numbers (remove commas)
        number: parseFloat(cells[3]?.textContent?.replace(/,/g, '')),

        // Extract nested data
        nested: Array.from(cells[4]?.querySelectorAll('.item') || [])
          .map(item => item.textContent?.trim())
      });
    });

    return rows;
  });
}
```

### Apply Filters Before Scraping

```javascript
async function applyHKExFilters(page, filters) {
  // Stock code
  if (filters.stockCode) {
    await page.type('#txtStockCode', filters.stockCode);
  }

  // Date range
  if (filters.dateRange) {
    await page.type('#txtFromDate', filters.dateRange.start);
    await page.type('#txtToDate', filters.dateRange.end);
  }

  // Category dropdown
  if (filters.category) {
    await page.select('#categorySelect', filters.category);
  }

  // Click search button
  await page.click('#btnSearch');

  // Wait for results
  await page.waitForSelector('.results-table');
}
```

---

## 💡 Best Practices

### 1. Set User Agent
```javascript
await page.setUserAgent(
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
);
```

### 2. Handle Timeouts Gracefully
```javascript
try {
  await page.waitForSelector('table', { timeout: 30000 });
} catch (error) {
  console.log('Timeout waiting for table, using fallback...');
  // Fallback logic
}
```

### 3. Take Screenshots for Debugging
```javascript
await page.screenshot({ path: 'debug.png', fullPage: true });
```

### 4. Block Unnecessary Resources
```javascript
await page.setRequestInterception(true);
page.on('request', (req) => {
  if (['image', 'stylesheet', 'font'].includes(req.resourceType())) {
    req.abort();
  } else {
    req.continue();
  }
});
```

### 5. Reuse Browser Instance
```javascript
const browser = await puppeteer.launch();

// Scrape multiple pages
for (const url of urls) {
  const page = await browser.newPage();
  await page.goto(url);
  // ... scraping logic
  await page.close();
}

await browser.close();
```

---

## 🧪 Testing

### Run Tests
```bash
# Test CCASS holdings scraper
node test-puppeteer-hkex.js

# Or use specific test
node -e "import('./test-puppeteer-hkex.js').then(m => m.testCCASSHoldings())"
```

### Example Output
```
🔍 Test 1: CCASS Holdings for Tencent (00700)
📄 Page loaded, filling form...
⏳ Waiting for results...
✅ Extracted 156 rows
Sample data: [
  { participantID: 'C00001', participantName: 'HSBC', shareholding: '124,567,890', percentage: '1.32%' },
  { participantID: 'C00002', participantName: 'Bank of China', shareholding: '98,234,567', percentage: '1.04%' },
  ...
]
💾 Saved to ccass_00700.csv
```

---

## 📤 Export Options

### Export to CSV
```javascript
function exportToCSV(data) {
  const headers = Object.keys(data[0]);
  const csv = [
    headers.join(','),
    ...data.map(row =>
      headers.map(h => `"${row[h] || ''}"`).join(',')
    )
  ].join('\n');

  fs.writeFileSync('output.csv', csv);
}
```

### Export to JSON
```javascript
fs.writeFileSync('output.json', JSON.stringify(data, null, 2));
```

### Export to Database
```javascript
import { supabase } from './lib/supabase';

for (const row of data) {
  await supabase.from('hkex_ccass').insert({
    stock_code: row.stockCode,
    participant_id: row.participantID,
    shareholding: row.shareholding,
    scraped_at: new Date(),
  });
}
```

---

## 🔗 Integration with Existing Infrastructure

### Use with Edge Functions

Create an Edge Function that calls Puppeteer:

```typescript
// supabase/functions/puppeteer-scraper/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import puppeteer from 'https://deno.land/x/puppeteer@16.2.0/mod.ts';

serve(async (req) => {
  const { url, tableSelector } = await req.json();

  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.goto(url);
  const data = await extractTableData(page, tableSelector);

  await browser.close();

  return new Response(JSON.stringify({ success: true, data }));
});
```

### Use with React Components

```typescript
// In HKScraperProduction.tsx
const scrapePuppeteer = async () => {
  const response = await fetch('/api/puppeteer-scraper', {
    method: 'POST',
    body: JSON.stringify({
      url: 'https://www.hkexnews.hk/...',
      tableSelector: 'table.table'
    })
  });

  const result = await response.json();
  setData(result.data);
};
```

---

## 🎓 Common HKEx SPA Patterns

### Pattern 1: Form Submit → AJAX → Table Render
```javascript
// 1. Fill form
await page.type('#stockCode', '00700');

// 2. Submit
await page.click('#btnSearch');

// 3. Wait for AJAX response
await page.waitForResponse(response =>
  response.url().includes('/api/search') && response.status() === 200
);

// 4. Wait for table render
await page.waitForSelector('table tbody tr');
```

### Pattern 2: Tab Click → Content Load
```javascript
// 1. Click tab
await page.click('#tab-holdings');

// 2. Wait for active class
await page.waitForSelector('#tab-holdings.active');

// 3. Wait for content
await page.waitForSelector('#holdings-content table');
```

### Pattern 3: Dropdown Change → Filter Update
```javascript
// 1. Select option
await page.select('#category', 'announcements');

// 2. Wait for filter to apply
await page.waitForFunction(() => {
  const items = document.querySelectorAll('.result-item');
  return items.length > 0;
});
```

---

## 🚨 Troubleshooting

### Issue: "Navigation timeout"
**Solution:** Increase timeout or use 'domcontentloaded'
```javascript
await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
```

### Issue: "Element not found"
**Solution:** Wait for element with retry
```javascript
await page.waitForSelector('table', { timeout: 30000 });
```

### Issue: "Data not loading"
**Solution:** Wait for network idle
```javascript
await page.waitForNetworkIdle({ idleTime: 2000 });
```

### Issue: "Blocked by bot detection"
**Solution:** Add delays and randomize behavior
```javascript
await page.waitForTimeout(Math.random() * 2000 + 1000);
```

---

## 📚 Resources

- **Puppeteer Docs:** https://pptr.dev/
- **HKEx Market Data:** https://www.hkex.com.hk/Market-Data
- **CCASS Search:** https://www.hkexnews.hk/sdw/search/searchsdw.aspx
- **Announcements:** https://www1.hkexnews.hk/

---

## ✅ Next Steps

1. **Test the crawler:**
   ```bash
   node test-puppeteer-hkex.js
   ```

2. **Integrate with your app:**
   - Add Puppeteer scraping option to HKScraperProduction component
   - Create Edge Function for server-side Puppeteer
   - Use MCP server for ad-hoc scraping via Claude

3. **Customize for your needs:**
   - Modify table selectors for specific HKEx pages
   - Add custom filters and pagination logic
   - Implement data transformation and validation

---

**🎉 You're ready to scrape HKEx SPAs with Puppeteer!**
