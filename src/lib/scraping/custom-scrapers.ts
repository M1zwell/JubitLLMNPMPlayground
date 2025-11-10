/**
 * Custom Scraper Utilities
 *
 * Specialized scrapers for common use cases:
 * - Product data extraction
 * - News article scraping
 * - GitHub repository info
 * - Social media metadata
 * - SEO data extraction
 */

import { scrapeWebpage, UnifiedScrapingResult } from './index';
import { getFirecrawlScraper } from './firecrawl';
import { getPuppeteerScraper } from './puppeteer';

// ==================== Product Data Scraper ====================

export interface ProductData {
  title: string;
  price?: string;
  description?: string;
  images: string[];
  availability?: string;
  rating?: string;
  reviews?: number;
  brand?: string;
  sku?: string;
  url: string;
  scrapedAt: Date;
}

/**
 * Scrape e-commerce product data
 * Works with most standard product pages
 */
export async function scrapeProductData(url: string): Promise<ProductData> {
  const scraper = getPuppeteerScraper();

  const data = await scraper.executeScript(url, async (page) => {
    // Wait for product info to load
    await page.waitForSelector('body', { timeout: 10000 });

    return await page.evaluate(() => {
      // Common selectors for product data
      const selectors = {
        title: ['h1', '.product-title', '[itemprop="name"]', '.product-name'],
        price: [
          '.price',
          '[itemprop="price"]',
          '.product-price',
          '.sale-price',
          '.current-price',
        ],
        description: [
          '[itemprop="description"]',
          '.product-description',
          '.description',
        ],
        images: ['[itemprop="image"]', '.product-image img', '.gallery img'],
        availability: [
          '[itemprop="availability"]',
          '.availability',
          '.stock-status',
        ],
        rating: ['.rating', '[itemprop="ratingValue"]', '.stars'],
        brand: ['[itemprop="brand"]', '.brand', '.manufacturer'],
        sku: ['[itemprop="sku"]', '.sku', '.product-code'],
      };

      const getTextContent = (selectors: string[]): string => {
        for (const selector of selectors) {
          const element = document.querySelector(selector);
          if (element) {
            return (
              element.getAttribute('content') || element.textContent?.trim() || ''
            );
          }
        }
        return '';
      };

      const getImages = (): string[] => {
        const images: string[] = [];
        selectors.images.forEach((selector) => {
          const elements = document.querySelectorAll(selector);
          elements.forEach((img) => {
            const src = (img as HTMLImageElement).src;
            if (src && src.startsWith('http')) {
              images.push(src);
            }
          });
        });
        return [...new Set(images)]; // Remove duplicates
      };

      return {
        title: getTextContent(selectors.title),
        price: getTextContent(selectors.price),
        description: getTextContent(selectors.description),
        availability: getTextContent(selectors.availability),
        rating: getTextContent(selectors.rating),
        brand: getTextContent(selectors.brand),
        sku: getTextContent(selectors.sku),
        images: getImages(),
      };
    });
  });

  await scraper.close();

  return {
    ...data,
    url,
    scrapedAt: new Date(),
  } as ProductData;
}

// ==================== News Article Scraper ====================

export interface ArticleData {
  title: string;
  author?: string;
  publishedDate?: string;
  content: string;
  summary?: string;
  images: string[];
  category?: string;
  tags?: string[];
  url: string;
  scrapedAt: Date;
}

/**
 * Scrape news article data
 * Extracts article metadata and content
 */
export async function scrapeArticle(url: string): Promise<ArticleData> {
  const apiKey = process.env.VITE_FIRECRAWL_API_KEY;
  const scraper = getFirecrawlScraper(apiKey, {
    format: 'markdown',
    onlyMainContent: true,
  });

  const result = await scraper.scrape(url, {
    format: 'markdown',
    onlyMainContent: true,
  });

  if (!result.success) {
    throw new Error(result.error || 'Failed to scrape article');
  }

  return {
    title: result.metadata?.title || result.metadata?.ogTitle || '',
    author: result.metadata?.author || '',
    publishedDate: result.metadata?.publishedTime || '',
    content: result.markdown || result.content || '',
    summary: result.metadata?.description || result.metadata?.ogDescription || '',
    images: result.links?.filter((link) =>
      /\.(jpg|jpeg|png|gif|webp)$/i.test(link)
    ) || [],
    category: '',
    tags: [],
    url,
    scrapedAt: new Date(),
  };
}

// ==================== GitHub Repository Scraper ====================

export interface GitHubRepoData {
  name: string;
  owner: string;
  description?: string;
  stars: number;
  forks: number;
  watchers: number;
  language?: string;
  topics: string[];
  lastUpdated?: string;
  license?: string;
  url: string;
  scrapedAt: Date;
}

/**
 * Scrape GitHub repository data
 * Better to use GitHub API, but this works without authentication
 */
export async function scrapeGitHubRepo(url: string): Promise<GitHubRepoData> {
  const scraper = getPuppeteerScraper();

  const data = await scraper.executeScript(url, async (page) => {
    await page.waitForSelector('[data-testid="repository-summary"]', {
      timeout: 10000,
    });

    return await page.evaluate(() => {
      const getTextBySelector = (selector: string): string => {
        const element = document.querySelector(selector);
        return element?.textContent?.trim() || '';
      };

      const getNumber = (text: string): number => {
        const match = text.match(/[\d,]+/);
        return match ? parseInt(match[0].replace(/,/g, ''), 10) : 0;
      };

      // Extract repo info
      const title = document.querySelector('h1')?.textContent?.trim() || '';
      const [owner, name] = title.split('/').map((s) => s.trim());

      const description = getTextBySelector('[data-pjax="#repo-content-pjax-container"] p');

      const starsText = getTextBySelector('#repo-stars-counter-star');
      const forksText = getTextBySelector('#repo-network-counter');
      const watchersText = getTextBySelector('#repo-notifications-counter');

      const language = getTextBySelector('[itemprop="programmingLanguage"]');

      const topics = Array.from(
        document.querySelectorAll('[data-octo-dimensions="topic:"] a')
      ).map((el) => el.textContent?.trim() || '');

      return {
        name: name || '',
        owner: owner || '',
        description,
        stars: getNumber(starsText),
        forks: getNumber(forksText),
        watchers: getNumber(watchersText),
        language,
        topics,
      };
    });
  });

  await scraper.close();

  return {
    ...data,
    url,
    scrapedAt: new Date(),
  } as GitHubRepoData;
}

// ==================== SEO Data Scraper ====================

export interface SEOData {
  title: string;
  description: string;
  keywords: string[];
  canonical?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  ogType?: string;
  twitterCard?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  twitterImage?: string;
  h1Tags: string[];
  h2Tags: string[];
  imageCount: number;
  linkCount: number;
  wordCount: number;
  url: string;
  scrapedAt: Date;
}

/**
 * Extract SEO-related data from webpage
 * Useful for SEO audits and analysis
 */
export async function scrapeSEOData(url: string): Promise<SEOData> {
  const result = await scrapeWebpage(url, {
    useFirecrawl: false,
    usePuppeteer: true,
  });

  const keywords = result.metadata?.keywords
    ?.split(',')
    .map((k) => k.trim())
    .filter(Boolean) || [];

  const h1Tags: string[] = [];
  const h2Tags: string[] = [];

  // Extract headings from content
  const headingMatches = result.html?.match(/<h[12][^>]*>(.*?)<\/h[12]>/gi) || [];
  headingMatches.forEach((match) => {
    const text = match.replace(/<[^>]+>/g, '').trim();
    if (match.startsWith('<h1')) {
      h1Tags.push(text);
    } else {
      h2Tags.push(text);
    }
  });

  const wordCount = result.content.split(/\s+/).length;

  return {
    title: result.title || '',
    description: result.metadata?.description || '',
    keywords,
    canonical: result.metadata?.canonical,
    ogTitle: result.metadata?.ogTitle,
    ogDescription: result.metadata?.ogDescription,
    ogImage: result.metadata?.ogImage,
    ogType: result.metadata?.ogType,
    twitterCard: result.metadata?.twitterCard,
    twitterTitle: result.metadata?.twitterTitle,
    twitterDescription: result.metadata?.twitterDescription,
    twitterImage: result.metadata?.twitterImage,
    h1Tags,
    h2Tags,
    imageCount: result.images?.length || 0,
    linkCount: result.links?.length || 0,
    wordCount,
    url,
    scrapedAt: new Date(),
  };
}

// ==================== Social Media Scraper ====================

export interface SocialMediaData {
  platform: 'twitter' | 'linkedin' | 'facebook' | 'instagram' | 'unknown';
  title: string;
  description?: string;
  image?: string;
  author?: string;
  publishedDate?: string;
  engagementMetrics?: {
    likes?: number;
    shares?: number;
    comments?: number;
  };
  url: string;
  scrapedAt: Date;
}

/**
 * Scrape social media post metadata
 * Works with most social media platforms
 */
export async function scrapeSocialMedia(url: string): Promise<SocialMediaData> {
  const result = await scrapeWebpage(url, {
    useFirecrawl: true,
    usePuppeteer: true,
  });

  // Detect platform
  let platform: SocialMediaData['platform'] = 'unknown';
  if (url.includes('twitter.com') || url.includes('x.com')) {
    platform = 'twitter';
  } else if (url.includes('linkedin.com')) {
    platform = 'linkedin';
  } else if (url.includes('facebook.com')) {
    platform = 'facebook';
  } else if (url.includes('instagram.com')) {
    platform = 'instagram';
  }

  return {
    platform,
    title: result.title || result.metadata?.ogTitle || '',
    description: result.metadata?.description || result.metadata?.ogDescription,
    image: result.metadata?.ogImage,
    author: result.metadata?.author,
    publishedDate: result.metadata?.publishedTime,
    url,
    scrapedAt: new Date(),
  };
}

// ==================== Batch Operations ====================

/**
 * Scrape multiple products in parallel
 */
export async function scrapeProductsBatch(
  urls: string[]
): Promise<ProductData[]> {
  const results = await Promise.allSettled(
    urls.map((url) => scrapeProductData(url))
  );

  return results
    .filter((r) => r.status === 'fulfilled')
    .map((r) => (r as PromiseFulfilledResult<ProductData>).value);
}

/**
 * Scrape multiple articles in parallel
 */
export async function scrapeArticlesBatch(
  urls: string[]
): Promise<ArticleData[]> {
  const results = await Promise.allSettled(urls.map((url) => scrapeArticle(url)));

  return results
    .filter((r) => r.status === 'fulfilled')
    .map((r) => (r as PromiseFulfilledResult<ArticleData>).value);
}

/**
 * Get SEO data for multiple URLs
 */
export async function scrapeSEOBatch(urls: string[]): Promise<SEOData[]> {
  const results = await Promise.allSettled(urls.map((url) => scrapeSEOData(url)));

  return results
    .filter((r) => r.status === 'fulfilled')
    .map((r) => (r as PromiseFulfilledResult<SEOData>).value);
}

// ==================== Export All ====================

export const customScrapers = {
  scrapeProductData,
  scrapeArticle,
  scrapeGitHubRepo,
  scrapeSEOData,
  scrapeSocialMedia,
  scrapeProductsBatch,
  scrapeArticlesBatch,
  scrapeSEOBatch,
};

export default customScrapers;
