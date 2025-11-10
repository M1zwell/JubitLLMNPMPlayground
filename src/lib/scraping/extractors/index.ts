/**
 * Extractor Factory and Registry
 *
 * Central registry for all data extractors with factory pattern for instantiation.
 */

import { DataExtractor, DataSourceCategory, ExtractorMetadata } from './base';
import { HKEXCCASSExtractor, CCAASSRawInput, CCAASSData } from './hkex-ccass';
import { HKSFCNewsExtractor, HKSFCRawInput, HKSFCExtractResult } from './hksfc-news';
import { NPMPackageExtractor, NPMRawInput, NPMPackageData } from './npm-package';

// ============================================================================
// Extractor Registry
// ============================================================================

/**
 * Registry of all available extractors
 */
export class ExtractorRegistry {
  private static extractors = new Map<string, any>([
    ['hkex-ccass', HKEXCCASSExtractor],
    ['hksfc-news', HKSFCNewsExtractor],
    ['npm-package', NPMPackageExtractor],
  ]);

  /**
   * Register a new extractor
   */
  static register(id: string, extractorClass: any): void {
    this.extractors.set(id, extractorClass);
  }

  /**
   * Get extractor class by ID
   */
  static get(id: string): any {
    return this.extractors.get(id);
  }

  /**
   * List all registered extractors
   */
  static list(): ExtractorMetadata[] {
    const metadata: ExtractorMetadata[] = [];

    this.extractors.forEach(extractorClass => {
      if (extractorClass.metadata) {
        metadata.push(extractorClass.metadata);
      }
    });

    return metadata;
  }

  /**
   * Get extractors by category
   */
  static getByCategory(category: DataSourceCategory): ExtractorMetadata[] {
    return this.list().filter(meta => meta.category === category);
  }
}

// ============================================================================
// Extractor Factory
// ============================================================================

/**
 * Factory for creating extractor instances
 */
export class ExtractorFactory {
  /**
   * Create extractor by data source category
   */
  static createByCategory(category: DataSourceCategory): DataExtractor<any, any> {
    switch (category) {
      case 'HKEX':
        return new HKEXCCASSExtractor();
      case 'HKSFC':
        return new HKSFCNewsExtractor();
      case 'NPM':
        return new NPMPackageExtractor();
      default:
        throw new Error(`No extractor available for category: ${category}`);
    }
  }

  /**
   * Create extractor by ID
   */
  static create(extractorId: string): DataExtractor<any, any> {
    const ExtractorClass = ExtractorRegistry.get(extractorId);

    if (!ExtractorClass) {
      throw new Error(`Extractor not found: ${extractorId}`);
    }

    return new ExtractorClass();
  }

  /**
   * Create multiple extractors
   */
  static createMultiple(extractorIds: string[]): DataExtractor<any, any>[] {
    return extractorIds.map(id => this.create(id));
  }
}

// ============================================================================
// Convenience Functions
// ============================================================================

/**
 * Extract HKEX CCASS data
 */
export async function extractHKEXCCASS(input: CCAASSRawInput): Promise<CCAASSData> {
  const extractor = new HKEXCCASSExtractor();
  return extractor.extract(input);
}

/**
 * Extract HKSFC news
 */
export async function extractHKSFCNews(input: HKSFCRawInput): Promise<HKSFCExtractResult> {
  const extractor = new HKSFCNewsExtractor();
  return extractor.extract(input);
}

/**
 * Extract NPM package data
 */
export async function extractNPMPackage(input: NPMRawInput): Promise<NPMPackageData> {
  const extractor = new NPMPackageExtractor();
  return extractor.extract(input);
}

// ============================================================================
// Exports
// ============================================================================

export * from './base';
export * from './hkex-ccass';
export * from './hksfc-news';
export * from './npm-package';

export { ExtractorFactory, ExtractorRegistry };
