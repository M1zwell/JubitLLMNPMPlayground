/**
 * HKSFC News Extractor
 *
 * Extracts news articles from HKSFC (Hong Kong Securities and Futures Commission).
 * Target: https://apps.sfc.hk/edistributionWeb/gateway/EN/news-and-announcements/
 */

import { BaseExtractor, ValidationResult, ExtractorMetadata } from './base';

// ============================================================================
// TypeScript Interfaces (from Winston's spec)
// ============================================================================

export type HKSFCCategory =
  | 'Corporate'                  // Corporate news
  | 'Enforcement'                // Enforcement news
  | 'Policy'                     // Policy statements and announcements
  | 'Shareholding'               // High shareholding concentration announcements
  | 'Decisions'                  // Decisions, statements and disclosures
  | 'Events'                     // Events
  | 'Circular'                   // Circulars
  | 'Consultation'               // Consultation papers
  | 'News'                       // General news
  | 'Other';                     // Uncategorized

export interface HKSFCNews {
  id: string;                    // Unique identifier
  title: string;                 // News headline
  category: HKSFCCategory;
  publishDate: string;           // ISO 8601
  url: string;                   // Full article URL
  summary?: string;              // Optional excerpt
  pdfUrl?: string;               // PDF attachment if available
  tags: string[];                // Keywords/topics
}

export interface HKSFCExtractResult {
  articles: HKSFCNews[];
  totalPages: number;
  currentPage: number;
  scrapeDate: string;
}

export interface HKSFCRawInput {
  html: string;
  baseUrl?: string;
  pageNumber?: number;
}

// ============================================================================
// DOM Selectors (Winston's spec)
// ============================================================================

const SELECTORS = {
  newsContainer: '.news-list-container, .content-list, main',
  newsItems: '.news-item, article.news, .list-item, li.news',
  title: 'h3.news-title, .title, h3, h2',
  date: 'time.publish-date, .date, .publish-date, time',
  category: '.category-tag, .news-category, .badge, .tag',
  link: 'a.news-link, a[href*="/news/"], a',
  summary: '.news-summary, .excerpt, .description, p',
  pdfLink: 'a[href$=".pdf"], a[href*=".pdf"]',
  pagination: '.pagination, nav[aria-label="pagination"]',
  nextPage: '.pagination .next, a[rel="next"]',
};

// ============================================================================
// HKSFC News Extractor Implementation
// ============================================================================

export class HKSFCNewsExtractor extends BaseExtractor<HKSFCRawInput, HKSFCExtractResult> {
  static metadata: ExtractorMetadata = {
    id: 'hksfc-news',
    name: 'HKSFC News Extractor',
    description: 'Extracts news and announcements from HKSFC website',
    category: 'HKSFC',
    version: '1.0.0',
    supportedFormats: ['html'],
  };

  protected async performExtraction(rawData: HKSFCRawInput): Promise<HKSFCExtractResult> {
    const { html, baseUrl = 'https://apps.sfc.hk', pageNumber = 1 } = rawData;

    // Parse HTML to DOM
    const dom = this.parseHTML(html);

    // Extract all news articles
    const articles = this.extractArticles(dom, baseUrl);

    // Extract pagination info
    const totalPages = this.extractTotalPages(dom);

    return {
      articles,
      totalPages,
      currentPage: pageNumber,
      scrapeDate: new Date().toISOString(),
    };
  }

  /**
   * Parse HTML string to DOM
   */
  private parseHTML(html: string): Document {
    if (typeof DOMParser !== 'undefined') {
      const parser = new DOMParser();
      return parser.parseFromString(html, 'text/html');
    } else {
      throw new Error('HTML parsing in Node environment requires Edge Function');
    }
  }

  /**
   * Extract all news articles from the page
   */
  private extractArticles(dom: Document, baseUrl: string): HKSFCNews[] {
    const articles: HKSFCNews[] = [];

    // Try to find the news container
    const container = dom.querySelector(SELECTORS.newsContainer);
    const searchRoot = container || dom;

    // Find all news items
    const items = searchRoot.querySelectorAll(SELECTORS.newsItems);

    items.forEach((item, index) => {
      try {
        const article = this.extractSingleArticle(item, baseUrl, index);
        if (article.title) {
          articles.push(article);
        }
      } catch (error) {
        console.warn(`Failed to extract article ${index}:`, error);
      }
    });

    return articles;
  }

  /**
   * Extract data from a single news item element
   */
  private extractSingleArticle(element: Element, baseUrl: string, index: number): HKSFCNews {
    // Extract title
    const title = this.extractWithFallback(element, [
      SELECTORS.title,
      'h3',
      'h2',
      '.headline',
      'strong',
    ]);

    // Extract date
    const dateText = this.extractWithFallback(element, [
      SELECTORS.date,
      'time',
      '.date',
      '.published',
    ]);
    const publishDate = this.parseDate(dateText);

    // Extract link (needed for categorization)
    const linkElement = element.querySelector(SELECTORS.link) as HTMLAnchorElement;
    const url = this.resolveUrl(linkElement?.href || '', baseUrl);

    // Extract category (uses title, category tag, and URL)
    const categoryText = this.extractWithFallback(element, [
      SELECTORS.category,
      '.badge',
      '.tag',
    ]);
    const category = this.categorizeArticle(title, categoryText, url);

    // Extract summary
    const summary = this.extractWithFallback(element, [
      SELECTORS.summary,
      'p',
      '.description',
    ]);

    // Extract PDF link
    const pdfElement = element.querySelector(SELECTORS.pdfLink) as HTMLAnchorElement;
    const pdfUrl = pdfElement?.href ? this.resolveUrl(pdfElement.href, baseUrl) : undefined;

    // Extract tags from title and content
    const tags = this.extractTags(title, summary);

    // Generate ID
    const id = this.generateArticleId(url, publishDate, index);

    return {
      id,
      title,
      category,
      publishDate,
      url,
      summary: summary || undefined,
      pdfUrl,
      tags,
    };
  }

  /**
   * Parse date string to ISO 8601
   */
  private parseDate(dateText: string): string {
    if (!dateText) {
      return new Date().toISOString();
    }

    // Try to parse the date
    const cleaned = this.cleanText(dateText);

    // Common HKSFC date formats:
    // "01 Jan 2025"
    // "1 January 2025"
    // "2025-01-01"

    try {
      const date = new Date(cleaned);
      if (!isNaN(date.getTime())) {
        return date.toISOString();
      }
    } catch (error) {
      console.warn('Failed to parse date:', cleaned);
    }

    return new Date().toISOString();
  }

  /**
   * Categorize article based on title and category tag
   */
  private categorizeArticle(title: string, categoryTag?: string, url?: string): HKSFCCategory {
    const lower = title.toLowerCase();
    const urlLower = url?.toLowerCase() || '';

    // 1. Check URL path first (most reliable)
    if (urlLower.includes('/corporate')) return 'Corporate';
    if (urlLower.includes('/enforcement')) return 'Enforcement';
    if (urlLower.includes('/policy')) return 'Policy';
    if (urlLower.includes('/shareholding')) return 'Shareholding';
    if (urlLower.includes('/decisions')) return 'Decisions';
    if (urlLower.includes('/events')) return 'Events';

    // 2. Check category tag
    if (categoryTag) {
      const tag = categoryTag.toLowerCase();
      if (tag.includes('corporate')) return 'Corporate';
      if (tag.includes('enforcement')) return 'Enforcement';
      if (tag.includes('policy')) return 'Policy';
      if (tag.includes('shareholding')) return 'Shareholding';
      if (tag.includes('decisions')) return 'Decisions';
      if (tag.includes('events')) return 'Events';
      if (tag.includes('circular')) return 'Circular';
      if (tag.includes('consultation')) return 'Consultation';
      if (tag.includes('news') || tag.includes('announcement')) return 'News';
    }

    // 3. Title keyword matching (enhanced with new categories)
    // Note: More specific keywords are checked first to avoid false matches

    // Consultation keywords (check before Policy due to "rule" overlap)
    if (lower.includes('consultation') ||
        lower.includes('consults on') ||
        lower.includes('comment') ||
        lower.includes('feedback')) {
      return 'Consultation';
    }

    // Circular keywords (check before Corporate due to "listing" overlap)
    if (lower.includes('circular')) {
      return 'Circular';
    }

    // Enforcement keywords (high priority - specific terms)
    if (lower.includes('reprimand') ||
        lower.includes('fine') ||
        lower.includes('sanction') ||
        lower.includes('prosecution') ||
        lower.includes('custodial sentence') ||
        lower.includes('disciplinary action') ||
        lower.includes('suspend') ||
        lower.includes('revoke') ||
        lower.includes('banned')) {
      return 'Enforcement';
    }

    // Shareholding keywords (specific multi-word phrases)
    if (lower.includes('shareholding concentration') ||
        lower.includes('substantial shareholder') ||
        lower.includes('disclosure of interests')) {
      return 'Shareholding';
    }

    // Cold shoulder orders / Decisions keywords
    if (lower.includes('cold shoulder') ||
        lower.includes('market misconduct') ||
        lower.includes('tribunal') ||
        lower.includes('decision')) {
      return 'Decisions';
    }

    // Events keywords (check before Policy/Corporate)
    if (lower.includes('event') ||
        lower.includes('conference') ||
        lower.includes('seminar') ||
        lower.includes('workshop')) {
      return 'Events';
    }

    // Corporate keywords
    if (lower.includes('corporate') ||
        lower.includes('listing') ||
        lower.includes('takeover') ||
        lower.includes('merger') ||
        lower.includes('acquisition')) {
      return 'Corporate';
    }

    // Policy keywords (checked later due to generic terms like "rule")
    if (lower.includes('policy') ||
        lower.includes('statement') ||
        lower.includes('rule') ||
        lower.includes('regulatory') ||
        lower.includes('guidelines') ||
        lower.includes('framework')) {
      return 'Policy';
    }

    // Default to News if no specific category matched
    return 'News';
  }

  /**
   * Resolve relative URL to absolute URL
   */
  private resolveUrl(url: string, baseUrl: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    if (url.startsWith('//')) return 'https:' + url;
    if (url.startsWith('/')) return baseUrl + url;
    return baseUrl + '/' + url;
  }

  /**
   * Extract tags/keywords from title and summary
   */
  private extractTags(title: string, summary: string): string[] {
    const text = `${title} ${summary}`.toLowerCase();
    const tags: string[] = [];

    // Common HKSFC topics
    const topicKeywords = [
      'virtual asset',
      'crypto',
      'fund management',
      'securities',
      'derivatives',
      'market misconduct',
      'licensing',
      'compliance',
      'insider dealing',
      'takeover',
      'disclosure',
    ];

    topicKeywords.forEach(keyword => {
      if (text.includes(keyword)) {
        tags.push(keyword);
      }
    });

    return [...new Set(tags)]; // Remove duplicates
  }

  /**
   * Generate unique article ID
   */
  private generateArticleId(url: string, publishDate: string, index: number): string {
    // Try to extract ID from URL
    const urlMatch = url.match(/\/(\d+)\/?$/);
    if (urlMatch) {
      return `hksfc-${urlMatch[1]}`;
    }

    // Generate from date and index
    const dateStr = publishDate.split('T')[0].replace(/-/g, '');
    return `hksfc-${dateStr}-${index}`;
  }

  /**
   * Extract total pages from pagination
   */
  private extractTotalPages(dom: Document): number {
    const pagination = dom.querySelector(SELECTORS.pagination);
    if (!pagination) return 1;

    // Look for page numbers
    const pageLinks = pagination.querySelectorAll('a, button');
    let maxPage = 1;

    pageLinks.forEach(link => {
      const text = link.textContent?.trim() || '';
      const pageNum = parseInt(text, 10);
      if (!isNaN(pageNum) && pageNum > maxPage) {
        maxPage = pageNum;
      }
    });

    return maxPage;
  }

  /**
   * Validate extracted news data
   */
  validate(data: HKSFCExtractResult): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!data.scrapeDate) {
      errors.push('Missing scrape date');
    }

    if (data.articles.length === 0) {
      warnings.push('No articles found - page structure may have changed');
    }

    data.articles.forEach((article, index) => {
      if (!article.id) {
        errors.push(`Article ${index}: Missing ID`);
      }
      if (!article.title) {
        errors.push(`Article ${index}: Missing title`);
      }
      if (!article.url) {
        errors.push(`Article ${index}: Missing URL`);
      }
      if (!article.publishDate) {
        errors.push(`Article ${index}: Missing publish date`);
      }
    });

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Normalize news data
   */
  normalize(data: HKSFCExtractResult): HKSFCExtractResult {
    return {
      ...data,
      articles: data.articles.map(article => ({
        ...article,
        title: this.cleanText(article.title),
        summary: article.summary ? this.cleanText(article.summary) : undefined,
        tags: article.tags.map(tag => this.cleanText(tag)),
      })),
    };
  }
}
