# Web Scraping & MCP Configuration Guide

## Overview

Your project is now fully configured with:
- **Firecrawl** - Advanced web scraping with AI-powered extraction
- **Puppeteer** - Browser automation and headless Chrome control
- **Chrome DevTools MCP** - Interactive browser debugging via Claude

## Configuration Status

### ✅ Installed Packages

```bash
@mendable/firecrawl-js@4.5.0    # Firecrawl SDK
puppeteer@24.28.0               # Puppeteer browser automation
puppeteer-core@24.28.0          # Core Puppeteer library
```

### ✅ MCP Servers Enabled

All MCP servers are configured in `.claude/settings.local.json`:

1. **Puppeteer MCP** - Browser automation tools
2. **Firecrawl MCP** - AI-powered web scraping
3. **Chrome DevTools MCP** - Interactive browser with DevTools open
4. **Filesystem MCP** - File system operations
5. **GitHub MCP** - GitHub API integration
6. **Git MCP** - Git repository operations

### ✅ Environment Variables

Configured in `.env`:

```bash
# Firecrawl Configuration
VITE_FIRECRAWL_API_KEY=fc-7f04517bc6ef43d68c06316d5f69b91e

# Puppeteer Configuration
VITE_PUPPETEER_HEADLESS=true
VITE_PUPPETEER_TIMEOUT=30000
```

## Usage Guide

### 1. Using MCP Servers with Claude

The MCP servers provide Claude with direct access to scraping tools. Claude can now:

**Firecrawl MCP:**
- Scrape web pages with AI extraction
- Extract structured data from websites
- Convert web content to markdown
- Batch scrape multiple URLs

**Puppeteer MCP:**
- Navigate to URLs in headless Chrome
- Take screenshots of web pages
- Execute JavaScript on pages
- Extract data via DOM manipulation

**Chrome DevTools MCP:**
- Open Chrome with DevTools
- Debug web applications
- Inspect network requests
- Test responsive designs

### 2. Using Scraping Utilities in Code

Located in `src/lib/scraping/`:

#### Unified Scraping Interface

```typescript
import { scrapeWebpage } from '@/lib/scraping';

// Automatic tool selection (Firecrawl preferred)
const result = await scrapeWebpage('https://example.com', {
  useFirecrawl: true,
  usePuppeteer: true, // Fallback
  firecrawlOptions: {
    format: 'markdown',
    onlyMainContent: true,
  }
});

console.log(result.content);  // Extracted content
console.log(result.markdown); // Markdown format
console.log(result.links);    // All links found
```

#### Firecrawl Direct Usage

```typescript
import { getFirecrawlScraper } from '@/lib/scraping/firecrawl';

const scraper = getFirecrawlScraper();

// Scrape single page
const result = await scraper.scrape('https://example.com', {
  format: 'markdown',
  screenshot: true,
  onlyMainContent: true
});

// Batch scraping
const results = await scraper.scrapeBatch([
  'https://example.com/page1',
  'https://example.com/page2'
]);

// Crawl entire website
const crawlResults = await scraper.crawl('https://example.com', {
  maxDepth: 2,
  maxPages: 50
});
```

#### Puppeteer Direct Usage

```typescript
import { getPuppeteerScraper } from '@/lib/scraping/puppeteer';

const scraper = getPuppeteerScraper({
  headless: true,
  timeout: 30000
});

// Scrape with browser automation
const result = await scraper.scrape('https://example.com');
console.log(result.title);
console.log(result.screenshots.fullPage); // Base64 screenshot

// Custom script execution
const customData = await scraper.executeScript(
  'https://example.com',
  async (page) => {
    // Custom Puppeteer page operations
    const element = await page.$('.some-selector');
    return element?.textContent();
  }
);
```

### 3. NPM Scripts

```bash
# Test Firecrawl MCP
npm run mcp:firecrawl

# Run MCP tests
npm run mcp:test
```

### 4. Using in Edge Functions

The scraping utilities work in Supabase Edge Functions. Example:

```typescript
// supabase/functions/scrape-url/index.ts
import { scrapeWebpage } from '../_shared/scraping.ts';

Deno.serve(async (req) => {
  const { url } = await req.json();

  const result = await scrapeWebpage(url, {
    useFirecrawl: true,
    firecrawlOptions: {
      format: 'markdown',
      onlyMainContent: true
    }
  });

  return new Response(JSON.stringify(result), {
    headers: { 'Content-Type': 'application/json' }
  });
});
```

## Important Notes

### Browser vs Server Environment

**Browser (Frontend):**
- Puppeteer and Firecrawl are **disabled** in browser builds (see `vite.config.ts`)
- This is intentional - these tools require Node.js/Deno
- Use Edge Functions or MCP servers for scraping from the browser

**Server (Edge Functions / MCP):**
- Full Puppeteer and Firecrawl support
- Run in Deno/Node.js environment
- Can execute browser automation

### Vite Configuration

In `vite.config.ts`, these packages are excluded from browser builds:

```typescript
optimizeDeps: {
  exclude: ['puppeteer', '@mendable/firecrawl-js'],
},
resolve: {
  alias: {
    puppeteer: false,
    '@mendable/firecrawl-js': false,
  },
},
```

**DO NOT remove these exclusions** - they prevent build errors since these packages require Node.js APIs.

### API Key Management

- Firecrawl API key is configured in both `.env` and `.claude/settings.local.json`
- Get your key from: https://firecrawl.dev
- Free tier: 500 requests/month
- Paid plans available for higher usage

## Testing the Setup

### Test Firecrawl MCP

Ask Claude: "Use Firecrawl to scrape https://example.com and show me the content"

### Test Puppeteer MCP

Ask Claude: "Use Puppeteer to take a screenshot of https://example.com"

### Test Chrome DevTools MCP

Ask Claude: "Open https://example.com in Chrome DevTools"

### Test Scraping Utilities

Create a test file:

```typescript
// test-scraping.ts
import { scrapeWebpage } from './src/lib/scraping';

const result = await scrapeWebpage('https://example.com');
console.log('Title:', result.title);
console.log('Content length:', result.content.length);
console.log('Links found:', result.links?.length);
```

## Troubleshooting

### Firecrawl API Errors

If you get API errors:
1. Check your API key in `.env` and `.claude/settings.local.json`
2. Verify you haven't exceeded your rate limit
3. Check Firecrawl status: https://status.firecrawl.dev

### Puppeteer Errors

If Puppeteer fails:
1. Ensure Chromium is installed (happens automatically on first run)
2. Check system has enough memory
3. Try setting `headless: 'new'` in options

### MCP Server Not Working

If Claude can't access MCP servers:
1. Restart Claude Code
2. Check `.claude/settings.local.json` is valid JSON
3. Try running MCP server manually: `npx -y @modelcontextprotocol/server-puppeteer`

## Advanced Usage

### Custom Scraping Patterns

Create custom scrapers in `src/lib/scraping/`:

```typescript
// custom-scraper.ts
import { getPuppeteerScraper } from './puppeteer';

export async function scrapeProductData(url: string) {
  const scraper = getPuppeteerScraper();

  return await scraper.executeScript(url, async (page) => {
    // Wait for product data to load
    await page.waitForSelector('.product-info');

    // Extract structured data
    return await page.evaluate(() => ({
      title: document.querySelector('.product-title')?.textContent,
      price: document.querySelector('.product-price')?.textContent,
      description: document.querySelector('.product-description')?.textContent,
      images: Array.from(document.querySelectorAll('.product-image'))
        .map(img => (img as HTMLImageElement).src)
    }));
  });
}
```

### Integrating with LLM Analysis

Combine scraping with LLM analysis:

```typescript
import { scrapeWebpage } from '@/lib/scraping';
import { supabase } from '@/lib/supabase';

async function analyzeWebpage(url: string) {
  // 1. Scrape content
  const result = await scrapeWebpage(url, {
    useFirecrawl: true,
    firecrawlOptions: { format: 'markdown' }
  });

  // 2. Send to LLM for analysis
  const { data } = await supabase.functions.invoke('analyze-content', {
    body: {
      content: result.markdown,
      url: result.url
    }
  });

  return data;
}
```

## Resources

- [Firecrawl Documentation](https://docs.firecrawl.dev)
- [Puppeteer Documentation](https://pptr.dev)
- [MCP Documentation](https://modelcontextprotocol.io)
- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)

## Next Steps

1. Test MCP servers with Claude Code
2. Create custom scrapers for your use cases
3. Build Edge Functions that use scraping utilities
4. Set up monitoring for scraping operations
5. Implement error handling and retries
6. Consider adding proxy support for scaling
