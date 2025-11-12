/**
 * Advanced HKSFC News Scraper with Firecrawl V2
 *
 * Features:
 * - Map endpoint for URL discovery
 * - JSON format extraction with schema
 * - Batch scraping for multiple URLs
 * - Better targeting with includeTags/excludeTags
 * - PDF parsing support
 * - Fresh data (maxAge: 0)
 */

const FIRECRAWL_API_KEY = process.env.FIRECRAWL_API_KEY || 'fc-7f04517bc6ef43d68c06316d5f69b91e';
const HKSFC_NEWS_BASE_URL = 'https://www.sfc.hk/en/News-and-announcements';
const HKSFC_NEWS_URL = 'https://www.sfc.hk/en/News-and-announcements/News';

/**
 * Step 1: Discover all news URLs using Map endpoint
 */
async function discoverNewsURLs(searchTerm = 'news', limit = 50) {
  console.log(`[HKSFC Advanced] Discovering URLs with search: "${searchTerm}"`);

  const payload = {
    url: HKSFC_NEWS_BASE_URL,
    search: searchTerm,
    limit: limit,
    includeSubdomains: false
  };

  try {
    const response = await fetch('https://api.firecrawl.dev/v2/map', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Firecrawl Map API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(`URL discovery failed: ${result.error || 'Unknown error'}`);
    }

    const linksData = result.data?.links || result.links || [];
    // Extract URL strings from link objects
    const links = linksData.map(link => typeof link === 'string' ? link : link.url);
    console.log(`[HKSFC Advanced] Discovered ${links.length} URLs`);

    return {
      success: true,
      links,
      linksData,  // Keep full data for reference
      total: links.length
    };

  } catch (error) {
    console.error('[HKSFC Advanced] Discovery error:', error);
    return {
      success: false,
      links: [],
      total: 0,
      error: error.message
    };
  }
}

/**
 * Step 2: Scrape a single news page with JSON extraction
 */
async function scrapeNewsPage(url) {
  console.log(`[HKSFC Advanced] Scraping: ${url}`);

  const payload = {
    url,
    formats: [
      'markdown',
      {
        type: 'json',
        prompt: `Extract the news article details including title, publication date, category/type, summary, and any PDF links.`,
        schema: {
          type: 'object',
          properties: {
            title: { type: 'string', description: 'News article title' },
            publishDate: { type: 'string', description: 'Publication date (ISO format if possible)' },
            category: { type: 'string', description: 'News category or type' },
            summary: { type: 'string', description: 'Brief summary or excerpt' },
            content: { type: 'string', description: 'Full article content' },
            pdfUrl: { type: 'string', description: 'PDF link if available' },
            tags: {
              type: 'array',
              items: { type: 'string' },
              description: 'Related tags or keywords'
            }
          },
          required: ['title']
        }
      }
    ],
    includeTags: ['article', 'main', '.news-content', '.article-body', 'h1', 'h2', 'p', 'time', '.date'],
    excludeTags: ['nav', 'footer', '#header', '.advertisement', '.sidebar'],
    onlyMainContent: true,
    waitFor: 1000,
    timeout: 45000,
    maxAge: 0,
    parsers: ['pdf']  // Enable PDF parsing
  };

  try {
    const response = await fetch('https://api.firecrawl.dev/v2/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Firecrawl API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(`Scraping failed: ${result.error || 'Unknown error'}`);
    }

    // Extract structured data
    const jsonData = result.data?.json || result.data?.extract || {};
    const markdown = result.data?.markdown || '';
    const links = result.data?.links || [];

    // Find PDF links if not in JSON
    const pdfLinks = links.filter(link => link.toLowerCase().endsWith('.pdf'));

    return {
      success: true,
      url,
      title: jsonData.title || 'Untitled',
      publishDate: jsonData.publishDate || null,
      category: jsonData.category || 'News',
      summary: jsonData.summary || '',
      content: jsonData.content || markdown,
      pdfUrl: jsonData.pdfUrl || pdfLinks[0] || null,
      tags: jsonData.tags || [],
      scrapedAt: new Date().toISOString(),
      credits: result.credits || 0
    };

  } catch (error) {
    console.error(`[HKSFC Advanced] Error scraping ${url}:`, error);
    return {
      success: false,
      url,
      error: error.message,
      scrapedAt: new Date().toISOString()
    };
  }
}

/**
 * Step 3: Batch scrape multiple news URLs
 */
async function scrapeMultipleNews(urls, delay = 2000) {
  console.log(`[HKSFC Advanced] Batch scraping ${urls.length} URLs`);

  const results = [];

  for (const url of urls) {
    const result = await scrapeNewsPage(url);
    results.push(result);

    // Rate limiting
    if (urls.indexOf(url) < urls.length - 1) {
      console.log(`[HKSFC Advanced] Waiting ${delay}ms...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;

  console.log(`[HKSFC Advanced] Completed: ${successful} successful, ${failed} failed`);

  return {
    success: true,
    total: results.length,
    successful,
    failed,
    results
  };
}

/**
 * Full workflow: Discover + Scrape
 */
async function scrapeHKSFCNews(options = {}) {
  const {
    searchTerm = 'news',
    discoverLimit = 20,
    scrapeLimit = 10,
    delay = 2000
  } = options;

  console.log('[HKSFC Advanced] Starting full workflow...');

  // Step 1: Discover URLs
  const discovery = await discoverNewsURLs(searchTerm, discoverLimit);

  if (!discovery.success || discovery.links.length === 0) {
    return {
      success: false,
      error: discovery.error || 'No URLs discovered',
      results: []
    };
  }

  // Filter to only news URLs and limit
  const newsUrls = discovery.links
    .filter(url => typeof url === 'string' && (url.includes('/News/') || url.includes('/news/')))
    .slice(0, scrapeLimit);

  console.log(`[HKSFC Advanced] Filtered to ${newsUrls.length} news URLs`);

  // Step 2: Scrape discovered URLs
  const scrapeResults = await scrapeMultipleNews(newsUrls, delay);

  return {
    success: true,
    discovered: discovery.total,
    scraped: scrapeResults.total,
    successful: scrapeResults.successful,
    failed: scrapeResults.failed,
    results: scrapeResults.results
  };
}

/**
 * Search for specific news (uses Firecrawl Search endpoint)
 */
async function searchHKSFCNews(query, limit = 5) {
  console.log(`[HKSFC Advanced] Searching for: "${query}"`);

  const payload = {
    query: `site:sfc.hk ${query}`,
    limit,
    lang: 'en',
    scrapeOptions: {
      formats: [
        'markdown',
        {
          type: 'json',
          prompt: 'Extract title, date, and summary',
          schema: {
            type: 'object',
            properties: {
              title: { type: 'string' },
              date: { type: 'string' },
              summary: { type: 'string' }
            }
          }
        }
      ],
      onlyMainContent: true
    }
  };

  try {
    const response = await fetch('https://api.firecrawl.dev/v2/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Firecrawl Search API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(`Search failed: ${result.error || 'Unknown error'}`);
    }

    const results = result.data || [];

    return {
      success: true,
      query,
      total: results.length,
      results: results.map(item => ({
        title: item.json?.title || item.title || 'Untitled',
        url: item.url,
        date: item.json?.date || item.date || null,
        summary: item.json?.summary || item.summary || item.markdown?.substring(0, 200) || '',
        markdown: item.markdown
      }))
    };

  } catch (error) {
    console.error('[HKSFC Advanced] Search error:', error);
    return {
      success: false,
      query,
      error: error.message,
      results: []
    };
  }
}

module.exports = {
  discoverNewsURLs,
  scrapeNewsPage,
  scrapeMultipleNews,
  scrapeHKSFCNews,
  searchHKSFCNews
};

// CLI test
if (require.main === module) {
  const command = process.argv[2] || 'full';

  if (command === 'discover') {
    discoverNewsURLs('news', 20)
      .then(result => {
        console.log('\n' + '='.repeat(80));
        console.log('DISCOVERED URLS');
        console.log('='.repeat(80));
        console.log(JSON.stringify(result, null, 2));
      });
  } else if (command === 'search') {
    const query = process.argv[3] || 'regulatory announcement';
    searchHKSFCNews(query, 5)
      .then(result => {
        console.log('\n' + '='.repeat(80));
        console.log('SEARCH RESULTS');
        console.log('='.repeat(80));
        console.log(JSON.stringify(result, null, 2));
      });
  } else {
    scrapeHKSFCNews({
      searchTerm: 'news',
      discoverLimit: 20,
      scrapeLimit: 5,
      delay: 2000
    })
      .then(result => {
        console.log('\n' + '='.repeat(80));
        console.log('FULL WORKFLOW RESULT');
        console.log('='.repeat(80));
        console.log(JSON.stringify(result, null, 2));
      });
  }
}
