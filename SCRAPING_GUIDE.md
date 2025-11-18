# Web Scraping & Crawling Setup Guide

**Complete technical documentation for replicating the scraping infrastructure in another project**

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Technology Stack](#technology-stack)
3. [Database Schema Patterns](#database-schema-patterns)
4. [Scraper Implementations](#scraper-implementations)
5. [Setup Instructions](#setup-instructions)
6. [Code Patterns & Best Practices](#code-patterns--best-practices)
7. [MCP Integration](#mcp-integration)
8. [Common Pitfalls & Solutions](#common-pitfalls--solutions)
9. [Production Deployment](#production-deployment)

---

## Architecture Overview

This project uses a **multi-engine scraping architecture** with automatic fallbacks:

```
┌─────────────────────────────────────────────────────────────┐
│                    Scraping Infrastructure                   │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Primary Engine:   Firecrawl API (cloud-based, robust)      │
│  Secondary Engine: Puppeteer (local, full control)          │
│  Dev/Debug:        Chrome MCP (DevTools integration)        │
│                                                               │
│  Data Storage:     Supabase PostgreSQL                       │
│  File Export:      CSV, JSON                                │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

### Why This Architecture?

1. **Firecrawl** - Production-grade scraping with JavaScript rendering, anti-bot bypass
2. **Puppeteer** - Local fallback for custom workflows, debugging, and cost control
3. **Chrome MCP** - Real-time debugging via DevTools Protocol
4. **Supabase** - PostgreSQL with built-in RLS, real-time updates, easy scaling

---

## Technology Stack

### Core Dependencies

```json
{
  "dependencies": {
    "@mendable/firecrawl-js": "^4.5.0",      // Firecrawl SDK
    "@supabase/supabase-js": "^2.50.3",      // Supabase client
    "puppeteer": "^23.10.4",                 // Browser automation
    "axios": "^1.6.0",                       // HTTP client
    "cheerio": "^1.0.0-rc.12",              // HTML parsing (optional)
    "papaparse": "^5.4.1"                    // CSV parsing/export
  }
}
```

### MCP Servers (Model Context Protocol)

```bash
# Essential scraping MCP servers
claude mcp add firecrawl npx -y firecrawl-mcp
claude mcp add chrome npx -y chrome-devtools-mcp
claude mcp add puppeteer npx -y @modelcontextprotocol/server-puppeteer
```

### Environment Variables

```bash
# Firecrawl API (Primary scraping engine)
VITE_FIRECRAWL_API_KEY=fc-your_api_key_here
FIRECRAWL_API_KEY=fc-your_api_key_here  # For Node.js scripts

# Supabase (Database)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key  # For Edge Functions

# Optional: GitHub for repository stats
GITHUB_PERSONAL_ACCESS_TOKEN=ghp_your_token_here
```

---

## Database Schema Patterns

### Pattern 1: Financial Holdings Data (HKEX CCASS)

**Use Case**: Time-series data with unique constraints per date

```sql
CREATE TABLE hkex_ccass_holdings (
  id BIGSERIAL PRIMARY KEY,
  stock_code TEXT NOT NULL,
  stock_name TEXT,
  shareholding_date DATE NOT NULL,
  participant_id TEXT NOT NULL,
  participant_name TEXT NOT NULL,
  address TEXT,
  shareholding BIGINT NOT NULL,
  percentage DECIMAL(10, 4),
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint to prevent duplicates
  CONSTRAINT unique_ccass_holding UNIQUE (stock_code, shareholding_date, participant_id)
);

-- Indexes for performance
CREATE INDEX idx_ccass_stock_code ON hkex_ccass_holdings(stock_code);
CREATE INDEX idx_ccass_date ON hkex_ccass_holdings(shareholding_date);
CREATE INDEX idx_ccass_stock_date ON hkex_ccass_holdings(stock_code, shareholding_date);
CREATE INDEX idx_ccass_participant ON hkex_ccass_holdings(participant_id);

-- Row Level Security
ALTER TABLE hkex_ccass_holdings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON hkex_ccass_holdings
  FOR SELECT TO public USING (true);

CREATE POLICY "Allow public insert access" ON hkex_ccass_holdings
  FOR INSERT TO public WITH CHECK (true);
```

### Pattern 2: Entity Registry Data (CIMA, BVI)

**Use Case**: Entity directories with licensing information

```sql
CREATE TABLE cima_entities (
  id BIGSERIAL PRIMARY KEY,
  entity_name TEXT NOT NULL,
  entity_type TEXT NOT NULL,
  license_number TEXT,
  license_status TEXT DEFAULT 'Active',
  address TEXT,
  jurisdiction TEXT DEFAULT 'Cayman Islands',
  additional_info JSONB,
  content_hash TEXT,  -- For detecting changes
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Composite unique constraint
  CONSTRAINT unique_cima_entity UNIQUE (entity_name, entity_type, license_number)
);

-- Indexes
CREATE INDEX idx_cima_entity_type ON cima_entities(entity_type);
CREATE INDEX idx_cima_license_status ON cima_entities(license_status);
CREATE INDEX idx_cima_updated ON cima_entities(updated_at);

-- GIN index for JSONB queries
CREATE INDEX idx_cima_additional_info ON cima_entities USING GIN (additional_info);
```

### Pattern 3: News/Filings Data (HKSFC)

**Use Case**: News articles, regulatory filings, announcements

```sql
CREATE TABLE hksfc_filings (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  filing_type TEXT NOT NULL,
  filing_date DATE,
  summary TEXT,
  content TEXT,
  pdf_url TEXT,
  company_code TEXT,
  company_name TEXT,
  tags TEXT[],
  metadata JSONB,
  scraped_at TIMESTAMPTZ DEFAULT NOW(),

  -- Unique constraint on content hash to avoid duplicates
  CONSTRAINT unique_filing UNIQUE (title, filing_date)
);

-- Full-text search index
CREATE INDEX idx_hksfc_title_fts ON hksfc_filings USING GIN (to_tsvector('english', title));
CREATE INDEX idx_hksfc_content_fts ON hksfc_filings USING GIN (to_tsvector('english', content));

-- Regular indexes
CREATE INDEX idx_hksfc_filing_date ON hksfc_filings(filing_date DESC);
CREATE INDEX idx_hksfc_filing_type ON hksfc_filings(filing_type);
CREATE INDEX idx_hksfc_tags ON hksfc_filings USING GIN (tags);
```

---

## Scraper Implementations

### 1. Firecrawl API Scraper (Recommended)

**Best for**: Production scraping, JavaScript-heavy sites, anti-bot bypass

#### Basic Scraping

```typescript
import { createClient } from '@supabase/supabase-js';

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;

async function scrapeWithFirecrawl(url: string) {
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: url,
      formats: ['markdown', 'html'],
      onlyMainContent: true,
      waitFor: 2000,
      timeout: 60000
    })
  });

  const result = await response.json();

  if (!result.success) {
    throw new Error(`Firecrawl failed: ${result.error}`);
  }

  return {
    markdown: result.data?.markdown,
    html: result.data?.html,
    metadata: result.data?.metadata
  };
}
```

#### Advanced: Form Submission with Actions

**Use Case**: Scraping search results, filtering data, interacting with dropdowns

```typescript
async function scrapeWithActions(url: string, entityType: string) {
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: url,
      formats: ['markdown', 'html'],
      actions: [
        // Wait for page load
        { type: 'wait', milliseconds: 3000 },

        // Select dropdown option
        {
          type: 'executeJavascript',
          script: `
            const select = document.querySelector('select[name="AuthorizationType"]');
            if (select) {
              select.value = "${entityType}";
              select.dispatchEvent(new Event('change', { bubbles: true }));
            }
          `
        },

        // Wait for dropdown change to process
        { type: 'wait', milliseconds: 1000 },

        // Click submit button
        {
          type: 'executeJavascript',
          script: `
            const button = document.querySelector('button[type="submit"]') ||
                          document.querySelector('input[type="submit"]') ||
                          document.querySelector('.btn-primary');
            if (button) button.click();
          `
        },

        // Wait for results to load
        { type: 'wait', milliseconds: 7000 }
      ],
      waitFor: 5000,
      timeout: 90000
    })
  });

  return await response.json();
}
```

#### Date Range Actions (Complex Example)

**IMPORTANT**: When scraping forms with date fields, use separate `executeJavascript` actions to avoid variable conflicts

```typescript
// ❌ WRONG - Will cause "Identifier 'field' has already been declared" error
actions: [
  {
    type: 'executeJavascript',
    script: `
      const field = document.querySelector('input[name="txtStockCode"]');
      if (field) field.value = "00700";
    `
  },
  {
    type: 'executeJavascript',
    script: `
      const field = document.querySelector('input[name="txtShareholdingDate"]');
      if (field) field.value = "2024/01/01";
    `
  }
]

// ✅ CORRECT - Use unique variable names
actions: [
  {
    type: 'executeJavascript',
    script: `
      const stockField = document.querySelector('input[name="txtStockCode"]');
      if (stockField) {
        stockField.value = "00700";
        stockField.dispatchEvent(new Event('input', { bubbles: true }));
      }
    `
  },
  {
    type: 'executeJavascript',
    script: `
      const dateField = document.querySelector('input[name="txtShareholdingDate"]');
      if (dateField) {
        dateField.value = "2024/01/01";
        dateField.dispatchEvent(new Event('change', { bubbles: true }));
      }
    `
  },
  {
    type: 'executeJavascript',
    script: `
      const submitBtn = document.querySelector('#btnSearch');
      if (submitBtn) submitBtn.click();
    `
  },
  { type: 'wait', milliseconds: 5000 }
]
```

### 2. Puppeteer Scraper (Local Control)

**Best for**: Complex workflows, debugging, custom authentication

#### Basic Setup

```javascript
const puppeteer = require('puppeteer');
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function scrapePage(url, options = {}) {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1280, height: 2000 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Navigate to page
    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 60000
    });

    // Handle cookie consent
    try {
      await page.waitForSelector('button', { timeout: 3000 });
      const acceptButton = await page.$('button:has-text("Accept")');
      if (acceptButton) {
        await acceptButton.click();
        await page.waitForTimeout(1000);
      }
    } catch (e) {
      // No cookie banner
    }

    // Extract data
    const data = await page.evaluate(() => {
      // Your extraction logic here
      return {
        title: document.title,
        content: document.body.innerText
      };
    });

    return data;

  } finally {
    await browser.close();
  }
}
```

#### Form Interaction Pattern (HKEX CCASS Example)

```javascript
async function scrapeCCASSHoldings(stockCode, date) {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1280, height: 2000 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Navigate
    await page.goto('https://www3.hkexnews.hk/sdw/search/searchsdw.aspx', {
      waitUntil: 'networkidle0',
      timeout: 60000
    });

    // Fill form
    await page.waitForSelector('input[name="txtStockCode"]', { visible: true });

    // Clear and type stock code
    await page.click('input[name="txtStockCode"]', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type('input[name="txtStockCode"]', stockCode, { delay: 100 });

    // Set date (avoid React/Vue form issues)
    await page.evaluate((dateValue) => {
      const dateInput = document.querySelector('input[name="txtShareholdingDate"]');
      if (dateInput) {
        dateInput.value = dateValue;
        dateInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, date);

    // Click search
    await page.evaluate(() => {
      const searchButton = document.querySelector('#btnSearch');
      if (searchButton) searchButton.click();
    });

    // Wait for results
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 });
    await page.waitForTimeout(3000);

    // Extract detailed table data
    const ccassData = await page.evaluate(() => {
      const data = {
        stockCode: null,
        stockName: null,
        date: null,
        participants: []
      };

      // Extract stock info
      const stockCodeEl = document.querySelector('input[name="txtStockCode"]');
      if (stockCodeEl) data.stockCode = stockCodeEl.value;

      const stockNameEl = document.querySelector('input[name="txtStockName"]');
      if (stockNameEl) data.stockName = stockNameEl.value;

      // Find participant table
      const tables = document.querySelectorAll('table');

      for (let table of tables) {
        const rows = Array.from(table.querySelectorAll('tr'));
        if (rows.length < 2) continue;

        const firstRowText = rows[0].textContent;

        if (firstRowText.includes('Participant ID') &&
            firstRowText.includes('Name of CCASS Participant')) {

          // Parse data rows (skip header)
          for (let i = 1; i < rows.length; i++) {
            const cells = Array.from(rows[i].querySelectorAll('td'));

            if (cells.length >= 4) {
              const getCellValue = (cell) => {
                const text = cell?.textContent.trim() || '';
                const parts = text.split('\n');
                return parts.length > 1 ? parts[parts.length - 1].trim() : text;
              };

              data.participants.push({
                participantId: getCellValue(cells[0]),
                participantName: getCellValue(cells[1]),
                address: getCellValue(cells[2]),
                shareholding: getCellValue(cells[3]).replace(/,/g, ''),
                percentage: getCellValue(cells[4])
              });
            }
          }

          break;
        }
      }

      return data;
    });

    return ccassData;

  } finally {
    await browser.close();
  }
}
```

### 3. Data Parsing Patterns

#### Markdown Table Parsing

```typescript
function parseEntitiesFromMarkdown(markdown: string, entityType: string) {
  const entities = [];
  const lines = markdown.split('\n');

  for (const line of lines) {
    // Look for table rows with | separators
    if (line.includes('|') && !line.includes('---') && line.trim().length > 10) {
      const cols = line.split('|').map(c => c.trim()).filter(c => c);

      // Skip header rows
      if (cols.length >= 2 &&
          cols[0].length > 2 &&
          !cols[0].toLowerCase().includes('name') &&
          !cols[0].toLowerCase().includes('entity')) {

        entities.push({
          entity_name: cols[0],
          entity_type: entityType,
          license_number: cols[1] || null,
          license_status: cols[2] || 'Active',
          address: cols[3] || null,
          jurisdiction: 'Cayman Islands'
        });
      }
    }
  }

  return entities;
}
```

#### HTML List Parsing (BVI Example)

```typescript
function parseEntitiesFromMarkdown(markdown: string, entityType: string) {
  const entities = [];
  const lines = markdown.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines, headers, navigation
    if (!line ||
        line.startsWith('#') ||
        line.includes('Filter') ||
        line.includes('Search') ||
        line.length < 3) {
      continue;
    }

    // Extract entity name from list markers
    let entityName = line
      .replace(/^[-*•]\s*/, '')    // Remove list markers
      .replace(/^\d+\.\s*/, '')     // Remove numbered lists
      .replace(/\[|\]/g, '')        // Remove brackets
      .replace(/\(.*?\)/g, '')      // Remove parentheses
      .trim();

    // Validate entity name
    if (/[a-zA-Z]/.test(entityName) &&
        entityName.length >= 5 &&
        entityName.length < 200) {

      // Look for license number in next line
      let licenseNumber = null;
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        const licenseMatch = nextLine.match(
          /(?:license|licence|registration|number)[:\s]*([A-Z0-9\-\/]+)/i
        );
        if (licenseMatch) {
          licenseNumber = licenseMatch[1];
        }
      }

      entities.push({
        entity_name: entityName,
        entity_type: entityType,
        license_number: licenseNumber,
        license_status: 'Active',
        jurisdiction: 'British Virgin Islands'
      });
    }
  }

  return entities;
}
```

---

## Setup Instructions

### Step 1: Install Dependencies

```bash
npm install @mendable/firecrawl-js @supabase/supabase-js puppeteer axios papaparse
```

### Step 2: Configure MCP Servers

```bash
# Add Firecrawl MCP
claude mcp add firecrawl npx -y firecrawl-mcp

# Add Chrome DevTools MCP
claude mcp add chrome npx -y chrome-devtools-mcp

# Add Puppeteer MCP
claude mcp add puppeteer npx -y @modelcontextprotocol/server-puppeteer
```

### Step 3: Set Environment Variables

Create `.env` file:

```bash
# Firecrawl API (get from https://firecrawl.dev)
VITE_FIRECRAWL_API_KEY=fc-your_api_key_here
FIRECRAWL_API_KEY=fc-your_api_key_here

# Supabase
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### Step 4: Create Database Tables

```bash
# Using Supabase CLI
supabase db push

# Or run SQL directly
psql -h db.your-project.supabase.co -U postgres -d postgres -f migrations/create_tables.sql
```

### Step 5: Create Scraper Utility Library

Create `src/lib/scraping/firecrawl.ts`:

```typescript
// See implementation in "Scraper Implementations" section above
export class FirecrawlScraper {
  // ... implementation
}

export function getFirecrawlScraper(apiKey?: string) {
  return new FirecrawlScraper(apiKey);
}
```

### Step 6: Create Your First Scraper

```javascript
// scrape-example.js
import { createClient } from '@supabase/supabase-js';

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY;
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

async function scrapeAndStore(url) {
  // 1. Scrape with Firecrawl
  const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      url: url,
      formats: ['markdown']
    })
  });

  const result = await response.json();

  // 2. Parse data
  const entities = parseData(result.data.markdown);

  // 3. Store in database
  for (const entity of entities) {
    const { error } = await supabase
      .from('your_table')
      .upsert(entity, {
        onConflict: 'entity_name,entity_type'
      });

    if (error && !error.message.includes('duplicate')) {
      console.error('Insert error:', error);
    }
  }

  console.log(`Imported ${entities.length} entities`);
}

scrapeAndStore('https://example.com');
```

### Step 7: Run Scraper

```bash
# One-time scrape
node scrape-example.js

# Or via npm script
npm run scrape:example
```

---

## Code Patterns & Best Practices

### 1. Error Handling Pattern

```typescript
async function scrapeWithRetry(url: string, maxRetries = 3) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await scrapeWithFirecrawl(url);
      return result;
    } catch (error) {
      console.error(`Attempt ${attempt}/${maxRetries} failed:`, error);

      if (attempt === maxRetries) {
        throw new Error(`Failed after ${maxRetries} attempts: ${error.message}`);
      }

      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

### 2. Batch Insert Pattern

```typescript
async function insertBatch(records: any[], tableName: string) {
  const BATCH_SIZE = 100;
  let inserted = 0;
  let failed = 0;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);

    const { error } = await supabase
      .from(tableName)
      .upsert(batch, {
        onConflict: 'entity_name,entity_type,license_number'
      });

    if (error) {
      console.error(`Batch ${i / BATCH_SIZE + 1} error:`, error.message);
      failed += batch.length;
    } else {
      inserted += batch.length;
      console.log(`✅ Inserted batch ${i / BATCH_SIZE + 1}: ${batch.length} records`);
    }

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return { inserted, failed };
}
```

### 3. Duplicate Handling Pattern

```typescript
async function upsertEntity(entity: any) {
  // Try insert first
  const { error } = await supabase
    .from('entities')
    .insert(entity);

  if (error) {
    // Check if duplicate
    if (error.message.includes('duplicate') || error.code === '23505') {
      // Update instead
      const { error: updateError } = await supabase
        .from('entities')
        .update({
          license_status: entity.license_status,
          address: entity.address,
          updated_at: new Date().toISOString()
        })
        .eq('entity_name', entity.entity_name)
        .eq('entity_type', entity.entity_type);

      if (updateError) {
        throw updateError;
      }

      return 'updated';
    } else {
      throw error;
    }
  }

  return 'inserted';
}
```

### 4. Content Hash Pattern (Detect Changes)

```typescript
import crypto from 'crypto';

function generateContentHash(entityName: string, licenseNumber: string, entityType: string) {
  const hash = crypto.createHash('sha256');
  hash.update(`${entityName}||${licenseNumber || 'NONE'}||${entityType}`);
  return hash.digest('hex');
}

// Usage
const entity = {
  entity_name: 'ABC Company',
  license_number: 'LIC123',
  entity_type: 'Banking',
  content_hash: generateContentHash('ABC Company', 'LIC123', 'Banking')
};

// Later, check if content changed
const existingHash = await fetchExistingHash(entity.entity_name);
if (existingHash !== entity.content_hash) {
  console.log('Entity has been updated!');
  await updateEntity(entity);
}
```

### 5. Rate Limiting Pattern

```typescript
async function scrapeMultiplePages(urls: string[], delayMs = 3000) {
  const results = [];

  for (let i = 0; i < urls.length; i++) {
    console.log(`[${i + 1}/${urls.length}] Scraping: ${urls[i]}`);

    const result = await scrapeWithFirecrawl(urls[i]);
    results.push(result);

    // Rate limiting: wait between requests
    if (i < urls.length - 1) {
      console.log(`⏳ Waiting ${delayMs}ms before next request...`);
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return results;
}
```

### 6. CSV Export Pattern

```javascript
const fs = require('fs');

function exportToCSV(records, filename) {
  if (records.length === 0) {
    console.log('⚠️  No data to export');
    return;
  }

  // Get headers from first record
  const headers = Object.keys(records[0]);
  const csvRows = [headers.join(',')];

  // Add data rows
  records.forEach(record => {
    const values = headers.map(header => {
      const value = record[header] || '';
      // Escape quotes and wrap in quotes if contains comma/quote
      const escaped = String(value).replace(/"/g, '""');
      return /[",\n]/.test(escaped) ? `"${escaped}"` : escaped;
    });
    csvRows.push(values.join(','));
  });

  fs.writeFileSync(filename, csvRows.join('\n'));
  console.log(`✅ CSV exported: ${filename} (${records.length} records)`);
}
```

---

## MCP Integration

### Using Firecrawl MCP in Claude Code

```typescript
// Claude Code will automatically use firecrawl MCP when available
// Just describe what you want to scrape:

// Example prompt:
// "Use Firecrawl to scrape https://example.com and extract all company names"

// Claude will use the mcp__firecrawl__firecrawl_scrape tool:
{
  "name": "mcp__firecrawl__firecrawl_scrape",
  "arguments": {
    "url": "https://example.com",
    "formats": ["markdown"],
    "onlyMainContent": true
  }
}
```

### Chrome MCP for Debugging

```typescript
// Take a snapshot of the page
{
  "name": "mcp__chrome__take_snapshot",
  "arguments": {
    "verbose": true
  }
}

// Click an element
{
  "name": "mcp__chrome__click",
  "arguments": {
    "uid": "element-123"  // From snapshot
  }
}

// Fill a form
{
  "name": "mcp__chrome__fill",
  "arguments": {
    "uid": "input-456",
    "value": "search query"
  }
}

// Navigate
{
  "name": "mcp__chrome__navigate_page",
  "arguments": {
    "type": "url",
    "url": "https://example.com"
  }
}
```

---

## Common Pitfalls & Solutions

### Problem 1: Duplicate Variable Names in Firecrawl Actions

**Error**: `Identifier 'field' has already been declared`

**Cause**: Multiple `executeJavascript` actions using same variable name

**Solution**: Use unique variable names in each action

```javascript
// ❌ BAD
actions: [
  { type: 'executeJavascript', script: 'const field = ...; field.value = "A";' },
  { type: 'executeJavascript', script: 'const field = ...; field.value = "B";' }
]

// ✅ GOOD
actions: [
  { type: 'executeJavascript', script: 'const stockField = ...; stockField.value = "A";' },
  { type: 'executeJavascript', script: 'const dateField = ...; dateField.value = "B";' }
]
```

### Problem 2: Form Submission Not Working

**Symptoms**: Form doesn't submit, no results shown

**Solutions**:
1. Add `dispatchEvent(new Event('change', { bubbles: true }))` after setting values
2. Wait longer after clicking submit (increase `wait` milliseconds)
3. Use `page.evaluate()` in Puppeteer instead of `page.click()`

```javascript
// Puppeteer - trigger events properly
await page.evaluate(() => {
  const input = document.querySelector('#search');
  input.value = 'query';
  input.dispatchEvent(new Event('input', { bubbles: true }));
  input.dispatchEvent(new Event('change', { bubbles: true }));
});
```

### Problem 3: Supabase Insert Fails with "content_hash NOT NULL"

**Error**: `null value in column "content_hash" violates not-null constraint`

**Solution**: Either make the column nullable or always provide a hash

```sql
-- Option 1: Make nullable
ALTER TABLE your_table ALTER COLUMN content_hash DROP NOT NULL;

-- Option 2: Set default
ALTER TABLE your_table ALTER COLUMN content_hash SET DEFAULT '';

-- Option 3: Always generate hash in code
const entity = {
  ...data,
  content_hash: generateContentHash(data.entity_name, data.license_number, data.entity_type)
};
```

### Problem 4: Rate Limiting / 429 Errors

**Symptoms**: API returns 429 Too Many Requests

**Solutions**:
1. Add delays between requests (3-5 seconds)
2. Reduce batch sizes
3. Implement exponential backoff
4. Use retry logic

```typescript
async function scrapeWithBackoff(url: string, attempt = 1) {
  try {
    return await scrapeWithFirecrawl(url);
  } catch (error) {
    if (error.status === 429 && attempt <= 5) {
      const delay = Math.pow(2, attempt) * 1000;
      console.log(`Rate limited, waiting ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return scrapeWithBackoff(url, attempt + 1);
    }
    throw error;
  }
}
```

### Problem 5: JavaScript Not Fully Loaded

**Symptoms**: Content missing, tables empty, dynamic content not appearing

**Solutions**:
1. Increase `waitFor` time in Firecrawl
2. Add explicit waits in Puppeteer
3. Wait for specific selectors

```javascript
// Firecrawl
{
  waitFor: 5000,  // Wait 5 seconds
  actions: [
    { type: 'wait', milliseconds: 3000 }
  ]
}

// Puppeteer
await page.waitForSelector('table.results', { timeout: 10000 });
await page.waitForFunction(() => {
  return document.querySelectorAll('table.results tr').length > 1;
}, { timeout: 10000 });
```

### Problem 6: Cookie Consent Blocking Content

**Solution**: Handle cookie banners explicitly

```javascript
// Puppeteer
try {
  await page.waitForSelector('button:has-text("Accept")', { timeout: 3000 });
  await page.click('button:has-text("Accept")');
  await page.waitForTimeout(1000);
} catch (e) {
  // No cookie banner, continue
}

// Firecrawl Actions
actions: [
  { type: 'wait', milliseconds: 2000 },
  {
    type: 'executeJavascript',
    script: `
      const acceptBtn = document.querySelector('[data-cookie-consent="accept"]') ||
                        document.querySelector('button:contains("Accept")');
      if (acceptBtn) acceptBtn.click();
    `
  },
  { type: 'wait', milliseconds: 1000 }
]
```

---

## Production Deployment

### Supabase Edge Function Pattern

```typescript
// supabase/functions/scraper/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const firecrawlKey = Deno.env.get('FIRECRAWL_API_KEY');

  try {
    // 1. Scrape with Firecrawl
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${firecrawlKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: 'https://example.com',
        formats: ['markdown']
      })
    });

    const result = await response.json();

    // 2. Parse data
    const entities = parseData(result.data.markdown);

    // 3. Store in database
    const { error } = await supabase
      .from('entities')
      .upsert(entities);

    if (error) throw error;

    return new Response(
      JSON.stringify({
        success: true,
        count: entities.length
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

### Deploy Edge Function

```bash
# Set secrets
supabase secrets set FIRECRAWL_API_KEY=fc-your_key_here

# Deploy function
supabase functions deploy scraper

# Test
curl -X POST https://your-project.supabase.co/functions/v1/scraper \
  -H "Authorization: Bearer YOUR_ANON_KEY"
```

### Scheduled Scraping (Cron Jobs)

Use Supabase Edge Functions with pg_cron or external cron:

```sql
-- Enable pg_cron extension
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Schedule daily scrape at 2 AM UTC
SELECT cron.schedule(
  'daily-scrape',
  '0 2 * * *',
  $$
  SELECT net.http_post(
    url := 'https://your-project.supabase.co/functions/v1/scraper',
    headers := '{"Authorization": "Bearer YOUR_SERVICE_ROLE_KEY"}'::jsonb
  );
  $$
);
```

Or use GitHub Actions:

```yaml
# .github/workflows/scrape.yml
name: Daily Scrape

on:
  schedule:
    - cron: '0 2 * * *'  # 2 AM UTC daily
  workflow_dispatch:  # Manual trigger

jobs:
  scrape:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: npm install

      - name: Run scraper
        env:
          FIRECRAWL_API_KEY: ${{ secrets.FIRECRAWL_API_KEY }}
          VITE_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          VITE_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}
        run: node scrape-daily.js
```

---

## Performance Optimization

### 1. Parallel Scraping (with Rate Limiting)

```typescript
async function scrapeParallel(urls: string[], concurrency = 3) {
  const results = [];

  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);

    console.log(`Processing batch ${i / concurrency + 1}...`);

    const batchResults = await Promise.all(
      batch.map(url => scrapeWithRetry(url))
    );

    results.push(...batchResults);

    // Rate limiting between batches
    if (i + concurrency < urls.length) {
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  }

  return results;
}
```

### 2. Caching with Firecrawl maxAge

```typescript
// Use cached results if less than 48 hours old
const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    url: url,
    formats: ['markdown'],
    maxAge: 172800000  // 48 hours in milliseconds
  })
});

// This can make scraping 500% faster by using cached data!
```

### 3. Database Indexing Strategy

```sql
-- Composite indexes for common queries
CREATE INDEX idx_entity_lookup ON entities(entity_type, license_status, jurisdiction);

-- Partial indexes for active entities only
CREATE INDEX idx_active_entities ON entities(entity_name)
  WHERE license_status = 'Active';

-- GIN index for full-text search
CREATE INDEX idx_entity_search ON entities
  USING GIN (to_tsvector('english', entity_name || ' ' || COALESCE(address, '')));
```

---

## Testing & Debugging

### Test Script Template

```javascript
// test-scraper.js
console.log('🧪 Testing Scraper...\n');

async function test() {
  try {
    // 1. Test Firecrawl connection
    console.log('1️⃣  Testing Firecrawl API...');
    const result = await scrapeWithFirecrawl('https://example.com');
    console.log(`   ✅ Scraped ${result.markdown.length} chars\n`);

    // 2. Test parsing
    console.log('2️⃣  Testing data parsing...');
    const entities = parseData(result.markdown);
    console.log(`   ✅ Parsed ${entities.length} entities\n`);

    // 3. Test database insert
    console.log('3️⃣  Testing database insert...');
    const { error } = await supabase.from('entities').insert(entities[0]);
    if (error) throw error;
    console.log(`   ✅ Database insert successful\n`);

    // 4. Test duplicate handling
    console.log('4️⃣  Testing duplicate handling...');
    const { error: dupError } = await supabase.from('entities').insert(entities[0]);
    console.log(`   ${dupError ? '✅ Duplicate prevented' : '⚠️  Duplicate inserted'}\n`);

    console.log('✅ All tests passed!');

  } catch (error) {
    console.error('❌ Test failed:', error);
    process.exit(1);
  }
}

test();
```

### Debug Logging Pattern

```typescript
const DEBUG = process.env.DEBUG === 'true';

function debugLog(message: string, data?: any) {
  if (DEBUG) {
    console.log(`[DEBUG] ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
  }
}

// Usage
debugLog('Scraping URL', { url, options });
debugLog('Parsed entities', entities);
```

---

## Summary Checklist

✅ **Setup**
- [ ] Install dependencies (@mendable/firecrawl-js, @supabase/supabase-js, puppeteer)
- [ ] Configure MCP servers (firecrawl, chrome, puppeteer)
- [ ] Set environment variables (FIRECRAWL_API_KEY, SUPABASE_URL, SUPABASE_ANON_KEY)
- [ ] Create database tables with proper indexes and RLS
- [ ] Test Firecrawl API connection

✅ **Implementation**
- [ ] Choose scraping engine (Firecrawl for production, Puppeteer for complex workflows)
- [ ] Implement error handling and retries
- [ ] Add rate limiting between requests
- [ ] Use batch inserts for performance
- [ ] Handle duplicates with upsert or content_hash
- [ ] Export to CSV/JSON for backup

✅ **Production**
- [ ] Deploy as Supabase Edge Function
- [ ] Set up scheduled scraping (cron/GitHub Actions)
- [ ] Monitor for errors and rate limits
- [ ] Implement caching with maxAge
- [ ] Add logging and alerting

✅ **Optimization**
- [ ] Use parallel scraping with concurrency limits
- [ ] Add database indexes for common queries
- [ ] Cache results with Firecrawl maxAge
- [ ] Implement incremental scraping (only new data)

---

## Additional Resources

- **Firecrawl Documentation**: https://docs.firecrawl.dev
- **Puppeteer Documentation**: https://pptr.dev
- **Supabase Documentation**: https://supabase.com/docs
- **MCP Servers**: https://github.com/modelcontextprotocol/servers
- **This Project**: JubitLLMNPMPlayground - see real implementations in:
  - `scrape-ccass-complete.cjs` (Puppeteer example)
  - `scrape-cima-firecrawl.js` (Firecrawl with actions)
  - `scrape-all-bvi-firecrawl.js` (Firecrawl markdown parsing)
  - `supabase/functions/_shared/scrapers/` (Edge Function patterns)

---

**Last Updated**: 2025-11-13
**Project**: JubitLLMNPMPlayground
**Platform**: Windows (win32)
**Maintained By**: Development Team
