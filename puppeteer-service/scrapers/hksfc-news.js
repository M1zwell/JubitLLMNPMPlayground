/**
 * HKSFC News Puppeteer Scraper
 *
 * Scrapes Hong Kong Securities and Futures Commission news and announcements
 * using Puppeteer for JavaScript-rendered content.
 */

const puppeteer = require('puppeteer');

const HKSFC_NEWS_URL = 'https://www.sfc.hk/en/News-and-announcements/News/All-news';

/**
 * Extract news articles from the page
 */
async function extractArticles(page) {
  return await page.evaluate(() => {
    const articles = [];

    // Try multiple selector patterns
    const selectors = [
      '.news-item',
      'article.news',
      '.list-item',
      'li.news-list-item',
      '[class*="news"]',
      'tbody tr'
    ];

    let elements = [];
    for (const selector of selectors) {
      elements = document.querySelectorAll(selector);
      if (elements.length > 0) break;
    }

    elements.forEach((item, index) => {
      try {
        // Extract title
        const titleElement = item.querySelector('h3, h2, .title, a[href*="/news/"]');
        const title = titleElement?.textContent?.trim() || '';

        // Extract link
        const linkElement = item.querySelector('a[href*="/news/"], a');
        let url = linkElement?.getAttribute('href') || '';
        if (url && !url.startsWith('http')) {
          url = `https://www.sfc.hk${url}`;
        }

        // Extract date
        const dateElement = item.querySelector('time, .date, .publish-date');
        const publishDate = dateElement?.textContent?.trim() || dateElement?.getAttribute('datetime') || '';

        // Extract category/type
        const categoryElement = item.querySelector('.category, .badge, .tag');
        const category = categoryElement?.textContent?.trim() || 'News';

        // Extract summary/excerpt
        const summaryElement = item.querySelector('.excerpt, .summary, p');
        const summary = summaryElement?.textContent?.trim() || '';

        if (title && url) {
          articles.push({
            id: `hksfc-${Date.now()}-${index}`,
            title,
            url,
            publishDate,
            category,
            summary,
            tags: []
          });
        }
      } catch (error) {
        console.error('Error extracting article:', error);
      }
    });

    return articles;
  });
}

/**
 * Scrape HKSFC news articles
 */
async function scrapeNews(url = null, dateRange = null) {
  const targetUrl = url || HKSFC_NEWS_URL;

  console.log('[HKSFC] Starting news scrape:', targetUrl);

  const browser = await puppeteer.launch({
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--disable-gpu'
    ]
  });

  try {
    const page = await browser.newPage();

    // Navigate to news page
    await page.goto(targetUrl, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Wait for content to load (JavaScript-rendered)
    await page.waitForTimeout(3000);

    // Try to wait for common selectors
    try {
      await page.waitForSelector('.news-item, article, .list-item, tbody tr', {
        timeout: 10000
      });
    } catch (error) {
      console.log('[HKSFC] Selector wait timeout, proceeding anyway');
    }

    // Extract articles
    const articles = await extractArticles(page);

    // Filter by date range if provided
    let filteredArticles = articles;
    if (dateRange && dateRange.start && dateRange.end) {
      filteredArticles = articles.filter(article => {
        if (!article.publishDate) return false;
        const articleDate = new Date(article.publishDate);
        const startDate = new Date(dateRange.start);
        const endDate = new Date(dateRange.end);
        return articleDate >= startDate && articleDate <= endDate;
      });
    }

    await browser.close();

    console.log(`[HKSFC] Scraped ${filteredArticles.length} articles`);

    return {
      articles: filteredArticles,
      totalPages: 1,
      currentPage: 1,
      scrapeDate: new Date().toISOString()
    };

  } catch (error) {
    console.error('[HKSFC] Error:', error);
    await browser.close();

    return {
      articles: [],
      totalPages: 0,
      currentPage: 0,
      scrapeDate: new Date().toISOString(),
      error: error.message
    };
  }
}

module.exports = {
  scrapeNews
};
