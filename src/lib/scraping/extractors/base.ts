/**
 * Base Extractor Architecture
 *
 * Provides common interfaces and base classes for all data extractors.
 * Each extractor must implement extract(), validate(), and normalize().
 */

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings?: string[];
}

export interface ExtractorConfig {
  timeout?: number;
  retries?: number;
  validateOnExtract?: boolean;
  normalizeOnExtract?: boolean;
}

/**
 * Base interface all extractors must implement
 */
export interface DataExtractor<TInput, TOutput> {
  /**
   * Extract structured data from raw input
   */
  extract(rawData: TInput, options?: ExtractorConfig): Promise<TOutput>;

  /**
   * Validate extracted data against schema
   */
  validate(data: TOutput): ValidationResult;

  /**
   * Normalize and clean extracted data
   */
  normalize(data: TOutput): TOutput;
}

/**
 * Abstract base class with common extractor functionality
 */
export abstract class BaseExtractor<TInput, TOutput> implements DataExtractor<TInput, TOutput> {
  protected config: ExtractorConfig;

  constructor(config: ExtractorConfig = {}) {
    this.config = {
      timeout: 30000,
      retries: 3,
      validateOnExtract: true,
      normalizeOnExtract: true,
      ...config,
    };
  }

  /**
   * Main extraction workflow with built-in validation and normalization
   */
  async extract(rawData: TInput, options?: ExtractorConfig): Promise<TOutput> {
    const mergedConfig = { ...this.config, ...options };

    try {
      // Perform the actual extraction (implemented by subclass)
      let data = await this.performExtraction(rawData);

      // Optional normalization
      if (mergedConfig.normalizeOnExtract) {
        data = this.normalize(data);
      }

      // Optional validation
      if (mergedConfig.validateOnExtract) {
        const validation = this.validate(data);
        if (!validation.valid) {
          throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
        }
      }

      return data;
    } catch (error) {
      throw new Error(
        `Extraction failed: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Actual extraction logic - must be implemented by subclass
   */
  protected abstract performExtraction(rawData: TInput): Promise<TOutput>;

  /**
   * Validate data - must be implemented by subclass
   */
  abstract validate(data: TOutput): ValidationResult;

  /**
   * Normalize data - must be implemented by subclass
   */
  abstract normalize(data: TOutput): TOutput;

  /**
   * Helper: Clean and trim text
   */
  protected cleanText(text: string | null | undefined): string {
    if (!text) return '';
    return text.trim().replace(/\s+/g, ' ');
  }

  /**
   * Helper: Parse number from string with commas
   */
  protected parseNumber(text: string | null | undefined): number {
    if (!text) return 0;
    const cleaned = text.replace(/,/g, '').replace(/[^\d.-]/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? 0 : num;
  }

  /**
   * Helper: Parse percentage to decimal
   */
  protected parsePercentage(text: string | null | undefined): number {
    if (!text) return 0;
    const num = this.parseNumber(text.replace('%', ''));
    return num;
  }

  /**
   * Helper: Extract text from element using multiple selectors
   */
  protected extractWithFallback(
    element: any,
    selectors: string[],
    defaultValue: string = ''
  ): string {
    for (const selector of selectors) {
      try {
        const el = element.querySelector ? element.querySelector(selector) : null;
        if (el?.textContent) {
          return this.cleanText(el.textContent);
        }
      } catch (e) {
        continue;
      }
    }
    return defaultValue;
  }
}

/**
 * Common data source categories
 */
export type DataSourceCategory = 'HKEX' | 'HKSFC' | 'NPM' | 'WEBB' | 'CUSTOM';

/**
 * Extractor metadata for registration and discovery
 */
export interface ExtractorMetadata {
  id: string;
  name: string;
  description: string;
  category: DataSourceCategory;
  version: string;
  supportedFormats: string[];
}
