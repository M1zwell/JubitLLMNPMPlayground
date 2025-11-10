/**
 * Web Scraping Compliance Checker
 *
 * Verifies robots.txt compliance and rate limit adherence before scraping.
 * Ensures ethical and legal web scraping practices.
 */

export interface RobotsTxtRules {
  allowed: boolean;
  crawlDelay?: number; // seconds
  disallowedPaths: string[];
  userAgent: string;
}

export interface ComplianceCheckResult {
  compliant: boolean;
  allowed: boolean;
  reasons: string[];
  warnings: string[];
  crawlDelay?: number;
  robotsTxtUrl?: string;
}

// ============================================================================
// robots.txt Parser
// ============================================================================

class RobotsTxtParser {
  private rules: Map<string, RobotsTxtRules> = new Map();

  /**
   * Parse robots.txt content
   */
  parse(content: string, baseUrl: string): void {
    const lines = content.split('\n');
    let currentUserAgent = '*';
    const disallowedPaths: string[] = [];
    let crawlDelay: number | undefined;

    for (const line of lines) {
      const trimmed = line.trim();

      // Skip comments and empty lines
      if (trimmed.startsWith('#') || !trimmed) continue;

      const [directive, value] = trimmed.split(':').map(s => s.trim());

      switch (directive.toLowerCase()) {
        case 'user-agent':
          // Save previous user-agent rules
          if (currentUserAgent && disallowedPaths.length > 0) {
            this.rules.set(currentUserAgent, {
              allowed: true,
              disallowedPaths: [...disallowedPaths],
              crawlDelay,
              userAgent: currentUserAgent,
            });
          }

          // Start new user-agent section
          currentUserAgent = value;
          disallowedPaths.length = 0;
          crawlDelay = undefined;
          break;

        case 'disallow':
          if (value) {
            disallowedPaths.push(value);
          }
          break;

        case 'crawl-delay':
          crawlDelay = parseInt(value, 10);
          break;
      }
    }

    // Save last user-agent rules
    if (currentUserAgent) {
      this.rules.set(currentUserAgent, {
        allowed: true,
        disallowedPaths: [...disallowedPaths],
        crawlDelay,
        userAgent: currentUserAgent,
      });
    }
  }

  /**
   * Check if a path is allowed for a user-agent
   */
  isAllowed(path: string, userAgent: string = '*'): boolean {
    // Check specific user-agent rules first
    const specificRules = this.rules.get(userAgent);
    if (specificRules) {
      return !this.isPathDisallowed(path, specificRules.disallowedPaths);
    }

    // Fall back to wildcard rules
    const wildcardRules = this.rules.get('*');
    if (wildcardRules) {
      return !this.isPathDisallowed(path, wildcardRules.disallowedPaths);
    }

    // If no rules, assume allowed
    return true;
  }

  /**
   * Get crawl delay for user-agent
   */
  getCrawlDelay(userAgent: string = '*'): number | undefined {
    return this.rules.get(userAgent)?.crawlDelay || this.rules.get('*')?.crawlDelay;
  }

  /**
   * Check if path matches disallowed patterns
   */
  private isPathDisallowed(path: string, disallowedPaths: string[]): boolean {
    for (const disallowed of disallowedPaths) {
      if (disallowed === '') continue; // Empty disallow means allow all

      // Simple prefix matching (real implementation should handle wildcards)
      if (path.startsWith(disallowed)) {
        return true;
      }

      // Handle wildcard matching
      const pattern = disallowed.replace(/\*/g, '.*');
      const regex = new RegExp(`^${pattern}`);
      if (regex.test(path)) {
        return true;
      }
    }

    return false;
  }
}

// ============================================================================
// Compliance Checker
// ============================================================================

export class ComplianceChecker {
  private robotsCache: Map<string, { parser: RobotsTxtParser; fetchedAt: number }> = new Map();
  private cacheTTL = 24 * 60 * 60 * 1000; // 24 hours

  /**
   * Check compliance for a URL
   */
  async check(url: string, userAgent: string = 'Mozilla/5.0 (compatible; CustomBot/1.0)'): Promise<ComplianceCheckResult> {
    const urlObj = new URL(url);
    const baseUrl = `${urlObj.protocol}//${urlObj.host}`;
    const path = urlObj.pathname + urlObj.search;

    const result: ComplianceCheckResult = {
      compliant: true,
      allowed: true,
      reasons: [],
      warnings: [],
      robotsTxtUrl: `${baseUrl}/robots.txt`,
    };

    try {
      // Fetch and parse robots.txt
      const parser = await this.getRobotsTxtParser(baseUrl);

      // Check if path is allowed
      const allowed = parser.isAllowed(path, userAgent);
      result.allowed = allowed;
      result.compliant = allowed;

      if (!allowed) {
        result.reasons.push(`Path '${path}' is disallowed by robots.txt`);
        result.reasons.push('Scraping this URL may violate the site\'s Terms of Service');
      }

      // Get crawl delay
      const crawlDelay = parser.getCrawlDelay(userAgent);
      if (crawlDelay) {
        result.crawlDelay = crawlDelay;
        result.warnings.push(`Recommended crawl delay: ${crawlDelay} seconds between requests`);
      }

      // Additional compliance checks
      this.addAdditionalChecks(url, result);

    } catch (error) {
      // If robots.txt doesn't exist or fails to load, assume allowed but warn
      result.warnings.push('Could not fetch robots.txt - proceeding with caution');
      result.warnings.push('Ensure you comply with site\'s Terms of Service manually');
    }

    return result;
  }

  /**
   * Batch check compliance for multiple URLs
   */
  async checkBatch(urls: string[]): Promise<Map<string, ComplianceCheckResult>> {
    const results = new Map<string, ComplianceCheckResult>();

    for (const url of urls) {
      const result = await this.check(url);
      results.set(url, result);
    }

    return results;
  }

  /**
   * Get or fetch robots.txt parser for a domain
   */
  private async getRobotsTxtParser(baseUrl: string): Promise<RobotsTxtParser> {
    // Check cache
    const cached = this.robotsCache.get(baseUrl);
    if (cached && (Date.now() - cached.fetchedAt) < this.cacheTTL) {
      return cached.parser;
    }

    // Fetch robots.txt
    const robotsTxtUrl = `${baseUrl}/robots.txt`;
    const response = await fetch(robotsTxtUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch robots.txt: ${response.status}`);
    }

    const content = await response.text();

    // Parse and cache
    const parser = new RobotsTxtParser();
    parser.parse(content, baseUrl);

    this.robotsCache.set(baseUrl, {
      parser,
      fetchedAt: Date.now(),
    });

    return parser;
  }

  /**
   * Additional compliance checks specific to Hong Kong financial sites
   */
  private addAdditionalChecks(url: string, result: ComplianceCheckResult): void {
    const urlLower = url.toLowerCase();

    // HKEX specific checks
    if (urlLower.includes('hkex')) {
      result.warnings.push('HKEX data: Ensure compliance with Hong Kong Stock Exchange Terms of Use');
      result.warnings.push('Consider using official HKEX APIs if available for production use');
    }

    // HKSFC specific checks
    if (urlLower.includes('sfc.hk')) {
      result.warnings.push('HKSFC data: Securities and Futures Commission data may have usage restrictions');
      result.warnings.push('Public register data has specific permitted use cases under PDPO');
      result.warnings.push('Recommend reviewing: https://www.sfc.hk/en/Quick-links/Others/Disclaimer');
    }

    // NPM is generally open
    if (urlLower.includes('npmjs.com')) {
      result.warnings.push('NPM Registry API is preferred over scraping: https://registry.npmjs.org/');
    }

    // Rate limiting recommendation
    if (!result.crawlDelay) {
      result.warnings.push('No crawl-delay specified - recommend 2-3 seconds between requests');
    }
  }
}

// ============================================================================
// Singleton Instance
// ============================================================================

let complianceCheckerInstance: ComplianceChecker | null = null;

export function getComplianceChecker(): ComplianceChecker {
  if (!complianceCheckerInstance) {
    complianceCheckerInstance = new ComplianceChecker();
  }
  return complianceCheckerInstance;
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Quick compliance check for a URL
 */
export async function isScrapingAllowed(url: string): Promise<boolean> {
  const checker = getComplianceChecker();
  const result = await checker.check(url);
  return result.allowed;
}

/**
 * Get recommended crawl delay for a URL
 */
export async function getRecommendedCrawlDelay(url: string): Promise<number> {
  const checker = getComplianceChecker();
  const result = await checker.check(url);
  return result.crawlDelay || 2; // Default 2 seconds
}
