/**
 * NPM Package Extractor (Deno Version)
 *
 * Extracts package metadata using dual strategy:
 * 1. Primary: NPM Registry API (fast, reliable)
 * 2. Secondary: Web scraping (for UI-only data like weekly downloads)
 *
 * Deno-specific changes:
 * - Uses Deno.env.get() instead of process.env
 * - Compatible with Supabase Edge Functions
 */

import { BaseExtractor, ValidationResult, ExtractorMetadata } from './base.ts';

// ============================================================================
// TypeScript Interfaces (from Winston's spec)
// ============================================================================

export interface NPMPackageData {
  name: string;
  version: string;
  description: string;
  author: string | { name: string; email?: string };
  license: string;
  homepage?: string;
  repository?: {
    type: string;
    url: string;
  };
  keywords: string[];
  downloads: {
    weekly: number;
    monthly?: number;
    yearly?: number;
  };
  dependencies: Record<string, string>;
  devDependencies: Record<string, string>;
  peerDependencies: Record<string, string>;
  github?: {
    stars: number;
    forks: number;
    issues: number;
    lastCommit: string;
  };
  npm: {
    publishDate: string;
    lastPublish: string;
    versions: string[];
  };
  hasTypeScript: boolean;
  bundleSize?: {
    minified: string;
    gzipped: string;
  };
}

export interface NPMRawInput {
  packageName: string;
  includeGitHub?: boolean;
  includeBundleSize?: boolean;
}

// ============================================================================
// NPM Package Extractor Implementation
// ============================================================================

export class NPMPackageExtractor extends BaseExtractor<NPMRawInput, NPMPackageData> {
  static metadata: ExtractorMetadata = {
    id: 'npm-package',
    name: 'NPM Package Extractor',
    description: 'Extracts package metadata from NPM Registry and website',
    category: 'NPM',
    version: '1.0.0',
    supportedFormats: ['json', 'html'],
  };

  protected async performExtraction(rawData: NPMRawInput): Promise<NPMPackageData> {
    const { packageName, includeGitHub = false, includeBundleSize = false } = rawData;

    // Step 1: Fetch from NPM Registry API (primary source)
    const registryData = await this.fetchFromNPMAPI(packageName);

    // Step 2: Optionally enrich with GitHub data
    let githubData: NPMPackageData['github'] | undefined;
    if (includeGitHub && registryData.repository?.url) {
      try {
        githubData = await this.enrichWithGitHubData(registryData.repository.url);
      } catch (error) {
        console.warn('Failed to fetch GitHub data:', error);
      }
    }

    // Step 3: Optionally fetch bundle size
    let bundleSize: NPMPackageData['bundleSize'] | undefined;
    if (includeBundleSize) {
      try {
        bundleSize = await this.fetchBundleSize(packageName);
      } catch (error) {
        console.warn('Failed to fetch bundle size:', error);
      }
    }

    return {
      ...registryData,
      github: githubData,
      bundleSize,
    };
  }

  /**
   * Fetch package data from NPM Registry API
   */
  private async fetchFromNPMAPI(packageName: string): Promise<NPMPackageData> {
    const registryUrl = `https://registry.npmjs.org/${encodeURIComponent(packageName)}`;

    try {
      const response = await fetch(registryUrl);

      if (!response.ok) {
        throw new Error(`NPM API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      // Extract latest version info
      const latestVersion = data['dist-tags']?.latest || Object.keys(data.versions || {}).pop();

      if (!latestVersion) {
        throw new Error('No versions found for package');
      }

      const versionData = data.versions[latestVersion];
      const timeData = data.time || {};

      // Extract download stats (requires separate API call)
      const downloads = await this.fetchDownloadStats(packageName);

      return {
        name: data.name,
        version: latestVersion,
        description: versionData.description || '',
        author: versionData.author || '',
        license: versionData.license || 'UNLICENSED',
        homepage: versionData.homepage,
        repository: versionData.repository,
        keywords: versionData.keywords || [],
        downloads,
        dependencies: versionData.dependencies || {},
        devDependencies: versionData.devDependencies || {},
        peerDependencies: versionData.peerDependencies || {},
        npm: {
          publishDate: timeData.created || '',
          lastPublish: timeData[latestVersion] || timeData.modified || '',
          versions: Object.keys(data.versions || {}),
        },
        hasTypeScript: this.detectTypeScript(versionData),
      };
    } catch (error) {
      throw new Error(
        `Failed to fetch from NPM Registry: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Fetch download statistics from NPM API
   */
  private async fetchDownloadStats(packageName: string): Promise<NPMPackageData['downloads']> {
    try {
      const weeklyUrl = `https://api.npmjs.org/downloads/point/last-week/${encodeURIComponent(packageName)}`;
      const monthlyUrl = `https://api.npmjs.org/downloads/point/last-month/${encodeURIComponent(packageName)}`;

      const [weeklyResponse, monthlyResponse] = await Promise.all([
        fetch(weeklyUrl),
        fetch(monthlyUrl),
      ]);

      const weeklyData = weeklyResponse.ok ? await weeklyResponse.json() : null;
      const monthlyData = monthlyResponse.ok ? await monthlyResponse.json() : null;

      return {
        weekly: weeklyData?.downloads || 0,
        monthly: monthlyData?.downloads || 0,
      };
    } catch (error) {
      console.warn('Failed to fetch download stats:', error);
      return { weekly: 0 };
    }
  }

  /**
   * Detect if package has TypeScript support
   */
  private detectTypeScript(versionData: any): boolean {
    // Check if package has TypeScript in dependencies
    const deps = {
      ...versionData.dependencies,
      ...versionData.devDependencies,
    };

    if (deps.typescript || deps['@types/node']) {
      return true;
    }

    // Check if package has .d.ts files in types field
    if (versionData.types || versionData.typings) {
      return true;
    }

    return false;
  }

  /**
   * Enrich with GitHub repository data
   */
  private async enrichWithGitHubData(
    repoUrl: string
  ): Promise<NPMPackageData['github'] | undefined> {
    // Extract owner/repo from URL
    const match = repoUrl.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
    if (!match) return undefined;

    const [, owner, repo] = match;
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;

    try {
      const headers: Record<string, string> = {
        Accept: 'application/vnd.github.v3+json',
      };

      // Add GitHub token from environment if available
      const githubToken = Deno.env.get('GITHUB_TOKEN');
      if (githubToken) {
        headers['Authorization'] = `token ${githubToken}`;
      }

      const response = await fetch(apiUrl, { headers });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.status}`);
      }

      const data = await response.json();

      return {
        stars: data.stargazers_count || 0,
        forks: data.forks_count || 0,
        issues: data.open_issues_count || 0,
        lastCommit: data.pushed_at || '',
      };
    } catch (error) {
      console.warn('Failed to fetch GitHub data:', error);
      return undefined;
    }
  }

  /**
   * Fetch bundle size from bundlephobia.com
   */
  private async fetchBundleSize(
    packageName: string
  ): Promise<NPMPackageData['bundleSize'] | undefined> {
    try {
      const apiUrl = `https://bundlephobia.com/api/size?package=${encodeURIComponent(packageName)}`;
      const response = await fetch(apiUrl);

      if (!response.ok) {
        return undefined;
      }

      const data = await response.json();

      return {
        minified: this.formatBytes(data.size || 0),
        gzipped: this.formatBytes(data.gzip || 0),
      };
    } catch (error) {
      console.warn('Failed to fetch bundle size:', error);
      return undefined;
    }
  }

  /**
   * Format bytes to human-readable string
   */
  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
  }

  /**
   * Validate extracted package data
   */
  validate(data: NPMPackageData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!data.name) {
      errors.push('Missing package name');
    }
    if (!data.version) {
      errors.push('Missing version');
    }

    // Validate name format
    if (data.name && !/^(@[a-z0-9-~][a-z0-9-._~]*\/)?[a-z0-9-~][a-z0-9-._~]*$/.test(data.name)) {
      errors.push('Invalid package name format');
    }

    // Validate version format (semver)
    if (data.version && !/^\d+\.\d+\.\d+/.test(data.version)) {
      warnings.push('Version does not follow semver format');
    }

    // Check for suspicious data
    if (data.downloads.weekly < 0) {
      errors.push('Invalid download count (negative)');
    }

    if (data.npm.versions.length === 0) {
      warnings.push('No versions found');
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Normalize package data
   */
  normalize(data: NPMPackageData): NPMPackageData {
    return {
      ...data,
      name: this.cleanText(data.name),
      description: this.cleanText(data.description),
      keywords: data.keywords.map(k => this.cleanText(k)),
      // Ensure author is in object format
      author:
        typeof data.author === 'string'
          ? { name: this.cleanText(data.author) }
          : data.author,
    };
  }
}
