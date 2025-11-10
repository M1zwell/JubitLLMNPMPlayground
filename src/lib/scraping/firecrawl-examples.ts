/**
 * Firecrawl Advanced Examples for JubitLLMNPMPlayground
 *
 * This file contains advanced Firecrawl examples specifically for:
 * - Extracting structured LLM model data
 * - Scraping NPM package metadata
 * - Batch processing for database imports
 * - Advanced structured data extraction
 */

import { FirecrawlScraper, getFirecrawlScraper } from './firecrawl';

// ==================== LLM Model Scraping Examples ====================

/**
 * Example 1: Scrape LLM Model Data from Artificial Analysis
 * Extracts structured model information for database import
 */
export async function extractLLMModelData() {
  const apiKey = import.meta.env.VITE_FIRECRAWL_API_KEY;
  const scraper = getFirecrawlScraper(apiKey, {
    format: 'markdown',
    onlyMainContent: true,
  });

  try {
    const result = await scraper.scrape('https://artificialanalysis.ai/models', {
      format: 'markdown',
      onlyMainContent: true,
    });

    if (result.success && result.content) {
      // Parse markdown content to extract model data
      const models = parseModelData(result.content);
      console.log(`Extracted ${models.length} LLM models`);
      return models;
    } else {
      console.error('Failed to scrape LLM models:', result.error);
      return [];
    }
  } catch (error) {
    console.error('LLM scraping error:', error);
    return [];
  }
}

/**
 * Helper function to parse LLM model data from markdown
 */
function parseModelData(markdown: string): Array<{
  name: string;
  provider: string;
  model_id: string;
  context_window?: number;
  quality_index?: number;
}> {
  const models: Array<{
    name: string;
    provider: string;
    model_id: string;
    context_window?: number;
    quality_index?: number;
  }> = [];

  // Simple parsing logic - customize based on actual page structure
  const lines = markdown.split('\n');
  for (const line of lines) {
    // Example pattern matching - adjust based on actual HTML structure
    const match = line.match(/\*\*(.*?)\*\*.*?(\w+)\s+(\d+k?)/);
    if (match) {
      models.push({
        name: match[1].trim(),
        provider: match[2].trim(),
        model_id: match[1].toLowerCase().replace(/\s+/g, '-'),
        context_window: parseInt(match[3].replace('k', '000')),
      });
    }
  }

  return models;
}

// ==================== NPM Package Scraping Examples ====================

/**
 * Example 2: Extract NPM Package Metadata
 * Scrapes NPM registry pages for package information
 */
export async function extractNPMPackageMetadata(packageName: string) {
  const apiKey = import.meta.env.VITE_FIRECRAWL_API_KEY;
  const scraper = getFirecrawlScraper(apiKey);

  const npmUrl = `https://www.npmjs.com/package/${packageName}`;

  try {
    const result = await scraper.scrape(npmUrl, {
      format: 'markdown',
      onlyMainContent: true,
      includeTags: ['main', 'article', 'section'],
    });

    if (result.success) {
      return {
        name: packageName,
        description: result.metadata?.description || '',
        title: result.metadata?.title || '',
        content: result.content,
        url: npmUrl,
        scrapedAt: result.timestamp,
      };
    } else {
      throw new Error(result.error || 'Failed to scrape NPM package');
    }
  } catch (error) {
    console.error(`Error scraping NPM package ${packageName}:`, error);
    throw error;
  }
}

/**
 * Example 3: Batch Extract Multiple NPM Packages
 * Efficiently scrapes multiple packages with rate limiting
 */
export async function batchExtractNPMPackages(packageNames: string[]) {
  const apiKey = import.meta.env.VITE_FIRECRAWL_API_KEY;
  const scraper = getFirecrawlScraper(apiKey);

  const urls = packageNames.map(pkg => `https://www.npmjs.com/package/${pkg}`);

  try {
    const results = await scraper.scrapeBatch(urls, {
      format: 'markdown',
      onlyMainContent: true,
    });

    return results.map((result, index) => ({
      packageName: packageNames[index],
      success: result.success,
      metadata: result.metadata,
      content: result.content,
      error: result.error,
    }));
  } catch (error) {
    console.error('Batch NPM scraping failed:', error);
    return [];
  }
}

// ==================== Structured Data Extraction ====================

/**
 * Example 4: Extract Structured Data with Custom Actions
 * Uses Firecrawl actions to interact with dynamic content
 */
export async function extractStructuredDataWithActions(url: string) {
  const apiKey = import.meta.env.VITE_FIRECRAWL_API_KEY;
  const scraper = getFirecrawlScraper(apiKey);

  try {
    const result = await scraper.scrape(url, {
      format: 'markdown',
      actions: [
        // Wait for dynamic content to load
        { type: 'wait', wait: 2000 },
        // Scroll to load lazy content
        { type: 'scroll', selector: 'body' },
        // Click to expand sections if needed
        // { type: 'click', selector: '.expand-button' },
      ],
      waitFor: 3000,
    });

    if (result.success) {
      return {
        url,
        title: result.metadata?.title,
        description: result.metadata?.description,
        content: result.content,
        links: result.links,
        timestamp: result.timestamp,
      };
    }
  } catch (error) {
    console.error('Structured data extraction failed:', error);
    throw error;
  }
}

/**
 * Example 5: Extract Table Data from Webpage
 * Specifically designed for extracting tabular data
 */
export async function extractTableData(url: string) {
  const apiKey = import.meta.env.VITE_FIRECRAWL_API_KEY;
  const scraper = getFirecrawlScraper(apiKey);

  try {
    const result = await scraper.scrape(url, {
      format: 'markdown',
      includeTags: ['table', 'thead', 'tbody', 'tr', 'td', 'th'],
      onlyMainContent: true,
    });

    if (result.success && result.content) {
      // Parse markdown tables
      const tables = parseMarkdownTables(result.content);
      return tables;
    }

    return [];
  } catch (error) {
    console.error('Table extraction failed:', error);
    return [];
  }
}

/**
 * Helper function to parse markdown tables
 */
function parseMarkdownTables(markdown: string): Array<{
  headers: string[];
  rows: string[][];
}> {
  const tables: Array<{ headers: string[]; rows: string[][] }> = [];
  const lines = markdown.split('\n');

  let currentTable: { headers: string[]; rows: string[][] } | null = null;

  for (const line of lines) {
    // Detect table header
    if (line.includes('|') && !line.includes('---')) {
      const cells = line.split('|').map(cell => cell.trim()).filter(cell => cell);

      if (!currentTable) {
        // Start new table
        currentTable = { headers: cells, rows: [] };
      } else {
        // Add row to current table
        currentTable.rows.push(cells);
      }
    } else if (currentTable && !line.includes('|')) {
      // End of table
      tables.push(currentTable);
      currentTable = null;
    }
  }

  // Add last table if exists
  if (currentTable) {
    tables.push(currentTable);
  }

  return tables;
}

// ==================== Web Crawling for Database Import ====================

/**
 * Example 6: Crawl LLM Provider Website
 * Systematically crawls a website to gather model information
 */
export async function crawlLLMProviderSite(providerUrl: string) {
  const apiKey = import.meta.env.VITE_FIRECRAWL_API_KEY;
  const scraper = getFirecrawlScraper(apiKey);

  try {
    const results = await scraper.crawl(providerUrl, {
      maxDepth: 2,
      maxPages: 20,
      format: 'markdown',
      allowBackwardLinks: false,
      includeSubdomains: false,
    });

    console.log(`Crawled ${results.length} pages from ${providerUrl}`);

    return results.map(result => ({
      url: result.url,
      title: result.metadata?.title,
      content: result.content,
      links: result.metadata?.links,
    }));
  } catch (error) {
    console.error('Crawling failed:', error);
    return [];
  }
}

/**
 * Example 7: Search and Extract Specific Content
 * Searches for specific terms within scraped content
 */
export async function searchAndExtract(url: string, searchTerms: string[]) {
  const apiKey = import.meta.env.VITE_FIRECRAWL_API_KEY;
  const scraper = getFirecrawlScraper(apiKey);

  const results = [];

  for (const term of searchTerms) {
    try {
      const result = await scraper.search(url, term, {
        format: 'markdown',
      });

      if (result.success) {
        results.push({
          term,
          matches: result.content,
          url: result.url,
        });
      }
    } catch (error) {
      console.error(`Search for '${term}' failed:`, error);
    }
  }

  return results;
}

// ==================== Advanced Use Cases ====================

/**
 * Example 8: Extract with Screenshot for Verification
 * Captures screenshot alongside data for manual verification
 */
export async function extractWithScreenshot(url: string) {
  const apiKey = import.meta.env.VITE_FIRECRAWL_API_KEY;
  const scraper = getFirecrawlScraper(apiKey);

  try {
    const result = await scraper.scrape(url, {
      format: 'markdown',
      screenshot: true,
      onlyMainContent: true,
    });

    if (result.success) {
      return {
        url,
        content: result.content,
        metadata: result.metadata,
        screenshot: result.screenshot, // Base64 encoded image
        timestamp: result.timestamp,
      };
    }
  } catch (error) {
    console.error('Screenshot extraction failed:', error);
    throw error;
  }
}

/**
 * Example 9: Custom Data Pipeline for Database Import
 * Complete pipeline from scraping to structured database format
 */
export async function llmDataImportPipeline(sourceUrl: string) {
  const apiKey = import.meta.env.VITE_FIRECRAWL_API_KEY;
  const scraper = getFirecrawlScraper(apiKey);

  try {
    // Step 1: Scrape the page
    const result = await scraper.scrape(sourceUrl, {
      format: 'markdown',
      onlyMainContent: true,
      waitFor: 2000,
    });

    if (!result.success) {
      throw new Error(result.error || 'Scraping failed');
    }

    // Step 2: Parse structured data
    const models = parseModelData(result.content || '');

    // Step 3: Enrich with metadata
    const enrichedModels = models.map(model => ({
      ...model,
      source_url: sourceUrl,
      scraped_at: result.timestamp,
      content_hash: hashContent(result.content || ''),
    }));

    // Step 4: Return database-ready format
    return {
      success: true,
      models: enrichedModels,
      metadata: {
        sourceUrl,
        scrapedAt: result.timestamp,
        totalModels: enrichedModels.length,
      },
    };
  } catch (error) {
    console.error('Import pipeline failed:', error);
    return {
      success: false,
      models: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Simple hash function for content verification
 */
function hashContent(content: string): string {
  let hash = 0;
  for (let i = 0; i < content.length; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return hash.toString(16);
}

// ==================== Export for Supabase Edge Functions ====================

/**
 * Example 10: Edge Function Compatible Export
 * Can be used in Supabase Edge Functions for server-side scraping
 */
export const firecrawlEdgeFunctionExample = {
  /**
   * Scrape and format for database insert
   */
  scrapeForDatabase: async (url: string, apiKey: string) => {
    const scraper = new FirecrawlScraper(apiKey, {
      format: 'markdown',
      onlyMainContent: true,
    });

    const result = await scraper.scrape(url);

    if (result.success) {
      return {
        url: result.url,
        title: result.metadata?.title || null,
        description: result.metadata?.description || null,
        content: result.content || null,
        markdown: result.markdown || null,
        metadata: result.metadata || {},
        scraped_at: result.timestamp.toISOString(),
      };
    }

    throw new Error(result.error || 'Scraping failed');
  },
};
