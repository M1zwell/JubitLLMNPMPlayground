/**
 * Database Integration Layer
 *
 * Connects extractors to Supabase database tables with automatic deduplication.
 * Maps extractor output to database schema with content hash generation.
 */

import { supabase } from '../supabase';
import type { CCAASSData } from './extractors/hkex-ccass';
import type { HKSFCExtractResult, HKSFCNews } from './extractors/hksfc-news';
import type { NPMPackageData } from './extractors/npm-package';

// ============================================================================
// Content Hash Generation (for deduplication)
// ============================================================================

/**
 * Generate SHA-256 hash for content deduplication
 */
async function generateContentHash(content: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(content);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

// ============================================================================
// HKSFC News Database Integration
// ============================================================================

export interface HKSFCFilingInsert {
  title: string;
  content?: string;
  filing_type?: 'news' | 'enforcement' | 'circular' | 'consultation';
  company_code?: string;
  company_name?: string;
  filing_date?: string;
  url: string;
  content_hash: string;
}

/**
 * Save HKSFC news articles to database
 */
export async function saveHKSFCNews(extractResult: HKSFCExtractResult): Promise<{
  inserted: number;
  updated: number;
  failed: number;
  errors: string[];
}> {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  let inserted = 0;
  let updated = 0;
  let failed = 0;
  const errors: string[] = [];

  for (const article of extractResult.articles) {
    try {
      // Generate content hash for deduplication
      const contentForHash = `${article.title}|${article.url}|${article.publishDate}`;
      const contentHash = await generateContentHash(contentForHash);

      // Map to database schema
      const filing: HKSFCFilingInsert = {
        title: article.title,
        content: article.summary,
        filing_type: article.category.toLowerCase() as any,
        url: article.url,
        filing_date: article.publishDate.split('T')[0],
        content_hash: contentHash,
      };

      // Upsert (insert or update if content_hash exists)
      const { error } = await supabase
        .from('hksfc_filings')
        .upsert(filing, {
          onConflict: 'content_hash',
          ignoreDuplicates: false, // Update last_seen timestamp
        });

      if (error) {
        if (error.code === '23505') {
          // Duplicate - updated
          updated++;
        } else {
          throw error;
        }
      } else {
        inserted++;
      }
    } catch (error) {
      failed++;
      errors.push(`${article.title}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return { inserted, updated, failed, errors };
}

// ============================================================================
// HKEX CCASS Database Integration
// ============================================================================

export interface HKEXAnnouncementInsert {
  announcement_title: string;
  announcement_content?: string;
  announcement_type: 'ccass' | 'company' | 'ipo' | 'market_stats';
  company_code?: string;
  company_name?: string;
  announcement_date?: string;
  url: string;
  ccass_participant_id?: string;
  ccass_shareholding?: number;
  ccass_percentage?: number;
  content_hash: string;
}

/**
 * Save HKEX CCASS data to database
 */
export async function saveHKEXCCASS(ccassData: CCAASSData): Promise<{
  inserted: number;
  updated: number;
  failed: number;
  errors: string[];
}> {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  let inserted = 0;
  let updated = 0;
  let failed = 0;
  const errors: string[] = [];

  // Create one announcement record per participant
  for (const participant of ccassData.participants) {
    try {
      // Generate content hash
      const contentForHash = `${ccassData.stockCode}|${participant.participantId}|${ccassData.dataDate}`;
      const contentHash = await generateContentHash(contentForHash);

      const announcement: HKEXAnnouncementInsert = {
        announcement_title: `CCASS Holdings - ${ccassData.stockName} (${ccassData.stockCode})`,
        announcement_content: `Participant: ${participant.participantName}, Shareholding: ${participant.shareholding} (${participant.percentage}%)`,
        announcement_type: 'ccass',
        company_code: ccassData.stockCode,
        company_name: ccassData.stockName,
        announcement_date: ccassData.dataDate,
        url: `https://www3.hkexnews.hk/sdw/search/searchsdw.aspx?stockcode=${ccassData.stockCode}`,
        ccass_participant_id: participant.participantId,
        ccass_shareholding: participant.shareholding,
        ccass_percentage: participant.percentage,
        content_hash: contentHash,
      };

      const { error } = await supabase
        .from('hkex_announcements')
        .upsert(announcement, {
          onConflict: 'content_hash',
          ignoreDuplicates: false,
        });

      if (error) {
        if (error.code === '23505') {
          updated++;
        } else {
          throw error;
        }
      } else {
        inserted++;
      }
    } catch (error) {
      failed++;
      errors.push(`${participant.participantId}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return { inserted, updated, failed, errors };
}

// ============================================================================
// NPM Package Database Integration
// ============================================================================

export interface NPMPackageInsert {
  package_name: string;
  package_version: string;
  description?: string;
  homepage_url?: string;
  repository_url?: string;
  npm_url: string;
  downloads_weekly?: number;
  downloads_monthly?: number;
  github_stars?: number;
  github_forks?: number;
  github_issues?: number;
  author?: string;
  license?: string;
  keywords?: string[];
  has_typescript: boolean;
  content_hash: string;
}

/**
 * Save NPM package data to database
 */
export async function saveNPMPackage(packageData: NPMPackageData): Promise<{
  inserted: number;
  updated: number;
  failed: number;
  errors: string[];
}> {
  if (!supabase) {
    throw new Error('Supabase client not initialized');
  }

  try {
    // Generate content hash
    const contentForHash = `${packageData.name}|${packageData.version}`;
    const contentHash = await generateContentHash(contentForHash);

    const npmPackage: NPMPackageInsert = {
      package_name: packageData.name,
      package_version: packageData.version,
      description: packageData.description,
      homepage_url: packageData.homepage,
      repository_url: packageData.repository?.url,
      npm_url: `https://www.npmjs.com/package/${packageData.name}`,
      downloads_weekly: packageData.downloads.weekly,
      downloads_monthly: packageData.downloads.monthly,
      github_stars: packageData.github?.stars,
      github_forks: packageData.github?.forks,
      github_issues: packageData.github?.issues,
      author: typeof packageData.author === 'string'
        ? packageData.author
        : packageData.author.name,
      license: packageData.license,
      keywords: packageData.keywords,
      has_typescript: packageData.hasTypeScript,
      content_hash: contentHash,
    };

    const { error } = await supabase
      .from('npm_packages_scraped')
      .upsert(npmPackage, {
        onConflict: 'content_hash',
        ignoreDuplicates: false,
      });

    if (error) {
      if (error.code === '23505') {
        return { inserted: 0, updated: 1, failed: 0, errors: [] };
      }
      throw error;
    }

    return { inserted: 1, updated: 0, failed: 0, errors: [] };
  } catch (error) {
    return {
      inserted: 0,
      updated: 0,
      failed: 1,
      errors: [error instanceof Error ? error.message : String(error)],
    };
  }
}

// ============================================================================
// Scrape Logging
// ============================================================================

export interface ScrapeLogInsert {
  source: 'hksfc' | 'hkex' | 'npm' | 'legal' | 'llm';
  source_type?: string;
  status: 'success' | 'error' | 'partial';
  records_inserted?: number;
  records_updated?: number;
  records_failed?: number;
  duration_ms?: number;
  error_message?: string;
  error_stack?: string;
  scraper_engine?: 'firecrawl' | 'puppeteer';
  scraper_version?: string;
}

/**
 * Log scraping operation to database
 */
export async function logScrapeOperation(log: ScrapeLogInsert): Promise<void> {
  if (!supabase) {
    console.warn('Supabase client not initialized, skipping log');
    return;
  }

  try {
    const { error } = await supabase.from('scrape_logs').insert({
      ...log,
      completed_at: new Date().toISOString(),
    });

    if (error) {
      console.error('Failed to log scrape operation:', error);
    }
  } catch (error) {
    console.error('Error logging scrape operation:', error);
  }
}

// ============================================================================
// Unified Scrape & Save Function
// ============================================================================

/**
 * Complete scraping workflow: Extract → Validate → Save → Log
 */
export async function scrapeAndSave(params: {
  source: 'hksfc' | 'hkex' | 'npm';
  data: CCAASSData | HKSFCExtractResult | NPMPackageData;
  scraperEngine: 'firecrawl' | 'puppeteer';
  durationMs: number;
}): Promise<{
  success: boolean;
  inserted: number;
  updated: number;
  failed: number;
  errors: string[];
}> {
  const { source, data, scraperEngine, durationMs } = params;

  let result: {
    inserted: number;
    updated: number;
    failed: number;
    errors: string[];
  };

  try {
    // Save to appropriate table based on source
    switch (source) {
      case 'hksfc':
        result = await saveHKSFCNews(data as HKSFCExtractResult);
        break;

      case 'hkex':
        result = await saveHKEXCCASS(data as CCAASSData);
        break;

      case 'npm':
        result = await saveNPMPackage(data as NPMPackageData);
        break;

      default:
        throw new Error(`Unknown source: ${source}`);
    }

    // Log the operation
    await logScrapeOperation({
      source,
      status: result.failed > 0 ? 'partial' : 'success',
      records_inserted: result.inserted,
      records_updated: result.updated,
      records_failed: result.failed,
      duration_ms: durationMs,
      scraper_engine: scraperEngine,
      scraper_version: '1.0.0',
    });

    return {
      success: true,
      ...result,
    };
  } catch (error) {
    // Log the error
    await logScrapeOperation({
      source,
      status: 'error',
      records_inserted: 0,
      records_updated: 0,
      records_failed: 0,
      duration_ms: durationMs,
      error_message: error instanceof Error ? error.message : String(error),
      error_stack: error instanceof Error ? error.stack : undefined,
      scraper_engine: scraperEngine,
      scraper_version: '1.0.0',
    });

    throw error;
  }
}
