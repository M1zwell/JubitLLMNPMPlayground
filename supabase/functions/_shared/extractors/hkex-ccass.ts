/**
 * HKEx CCASS Extractor (Deno Version)
 *
 * Extracts shareholding disclosure data from HKEX CCASS system.
 * Target: https://www3.hkexnews.hk/sdw/search/searchsdw.aspx
 *
 * Deno-specific changes:
 * - Uses deno-dom for HTML parsing instead of browser DOMParser
 * - Compatible with Supabase Edge Functions
 */

import { DOMParser } from "https://deno.land/x/deno_dom@v0.1.43/deno-dom-wasm.ts";
import { BaseExtractor, ValidationResult, ExtractorMetadata } from './base.ts';

// ============================================================================
// TypeScript Interfaces (from Winston's spec)
// ============================================================================

export interface CCAASSParticipant {
  participantId: string;      // e.g., "C00001"
  participantName: string;    // e.g., "HSBC Nominees Limited"
  address: string;            // Full address
  shareholding: number;       // Numeric shares (not string!)
  percentage: number;         // 0-100 range
}

export interface CCAASSData {
  stockCode: string;          // e.g., "00700"
  stockName: string;          // e.g., "TENCENT"
  scrapeDate: string;         // ISO 8601
  dataDate: string;           // The shareholding date
  totalParticipants: number;
  totalShares: number;
  participants: CCAASSParticipant[];
}

export interface CCAASSRawInput {
  html: string;
  stockCode: string;
  requestDate?: string;
}

// ============================================================================
// DOM Selectors (Updated for HKEX mobile-list-body structure)
// ============================================================================

const SELECTORS = {
  // Target the exact table structure with mobile-list-body divs
  resultsTable: 'table.table-scroll.table-sort.table-mobile-list, table.table-scroll, #mutualmarket-result table.table, table#pnlResultNormal',
  headerRow: 'thead tr, tr:first-child',
  dataRows: 'tbody tr',

  // Participant data columns (using mobile-list-body structure)
  participantIdCell: '.col-participant-id',
  participantNameCell: '.col-participant-name',
  addressCell: '.col-address',
  shareholdingCell: '.col-shareholding',
  percentageCell: '.col-shareholding-percent',

  // Mobile list body wrapper
  mobileListBody: '.mobile-list-body',

  // Stock info
  stockName: '#txtStockName, .stock-name, input[name="txtStockName"]',

  // Error/status messages
  errorMsg: '.alert-danger, #lblErrorMsg',
  noDataMsg: '#pnlNoResult, .no-data-message',
  captchaContainer: '#captcha-container, .captcha',
};

// ============================================================================
// HKEx CCASS Extractor Implementation
// ============================================================================

export class HKEXCCASSExtractor extends BaseExtractor<CCAASSRawInput, CCAASSData> {
  static metadata: ExtractorMetadata = {
    id: 'hkex-ccass',
    name: 'HKEX CCASS Shareholding Extractor',
    description: 'Extracts daily shareholding disclosure by CCASS participants',
    category: 'HKEX',
    version: '1.0.0',
    supportedFormats: ['html'],
  };

  protected async performExtraction(rawData: CCAASSRawInput): Promise<CCAASSData> {
    const { html, stockCode, requestDate } = rawData;

    // Parse HTML to DOM
    const dom = this.parseHTML(html);

    // Check for errors
    this.checkForErrors(dom);

    // Extract stock information
    const stockName = this.extractStockName(dom);

    // Extract participant data
    const participants = this.extractParticipants(dom);

    // Calculate totals
    const totalShares = participants.reduce((sum, p) => sum + p.shareholding, 0);

    return {
      stockCode,
      stockName,
      scrapeDate: new Date().toISOString(),
      dataDate: requestDate || new Date().toISOString().split('T')[0],
      totalParticipants: participants.length,
      totalShares,
      participants,
    };
  }

  /**
   * Parse HTML string to DOM using deno-dom
   */
  private parseHTML(html: string): Document {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');

    if (!doc) {
      throw new Error('Failed to parse HTML');
    }

    return doc as unknown as Document;
  }

  /**
   * Check for error messages or CAPTCHA
   */
  private checkForErrors(dom: Document): void {
    // Check for error messages
    const errorMsg = dom.querySelector(SELECTORS.errorMsg);
    if (errorMsg?.textContent) {
      throw new Error(`HKEX error: ${this.cleanText(errorMsg.textContent)}`);
    }

    // Check for no data message
    const noDataMsg = dom.querySelector(SELECTORS.noDataMsg);
    if (noDataMsg && noDataMsg.textContent?.includes('No record')) {
      throw new Error('No CCASS data found for this stock/date');
    }

    // Check for CAPTCHA
    const captcha = dom.querySelector(SELECTORS.captchaContainer);
    if (captcha) {
      throw new Error('CAPTCHA detected - rate limit exceeded');
    }
  }

  /**
   * Extract stock name from page
   */
  private extractStockName(dom: Document): string {
    const selectors = [
      SELECTORS.stockName,
      'input#txtStockName',
      '.stock-info .name',
    ];

    for (const selector of selectors) {
      const element = dom.querySelector(selector);
      if (element) {
        const value = element.getAttribute('value') || element.textContent;
        if (value) return this.cleanText(value);
      }
    }

    return 'Unknown';
  }

  /**
   * Extract all participant rows from results table
   */
  private extractParticipants(dom: Document): CCAASSParticipant[] {
    const participants: CCAASSParticipant[] = [];

    // Find the results table
    const table = dom.querySelector(SELECTORS.resultsTable);
    if (!table) {
      throw new Error('Results table not found - page structure may have changed');
    }

    // Get all data rows (skip header)
    const rows = Array.from(table.querySelectorAll(SELECTORS.dataRows));

    for (const row of rows) {
      // Skip if this is actually a header row
      if (row.querySelector('th')) continue;

      // Check if row has at least 4 td cells
      const cells = row.querySelectorAll('td');
      if (cells.length < 4) continue;

      // Extract participant data from the row
      const participant = this.extractParticipantFromRow(row);

      // Only add if we got a valid participant ID
      if (participant.participantId && participant.participantId.trim()) {
        participants.push(participant);
      }
    }

    return participants;
  }

  /**
   * Extract participant data from a single table row
   * Supports both mobile-list-body structure and direct cell content
   */
  private extractParticipantFromRow(row: any): CCAASSParticipant {
    // Helper to get text from cell (try mobile-list-body first, then direct content)
    const getCellText = (cell: any): string => {
      if (!cell) return '';

      // Try to find mobile-list-body div first
      const mobileBody = cell.querySelector(SELECTORS.mobileListBody);
      if (mobileBody) {
        return this.cleanText(mobileBody.textContent || '');
      }

      // Fallback to direct cell content
      return this.cleanText(cell.textContent || '');
    };

    // Extract using column class selectors (preferred for mobile-list-body structure)
    const participantIdCell = row.querySelector(SELECTORS.participantIdCell);
    const participantNameCell = row.querySelector(SELECTORS.participantNameCell);
    const addressCell = row.querySelector(SELECTORS.addressCell);
    const shareholdingCell = row.querySelector(SELECTORS.shareholdingCell);
    const percentageCell = row.querySelector(SELECTORS.percentageCell);

    if (participantIdCell) {
      // New mobile-list-body structure
      return {
        participantId: getCellText(participantIdCell),
        participantName: getCellText(participantNameCell),
        address: getCellText(addressCell),
        shareholding: this.parseNumber(getCellText(shareholdingCell)),
        percentage: this.parsePercentage(getCellText(percentageCell)),
      };
    }

    // Fallback to nth-child selectors (old structure)
    const cells = row.querySelectorAll('td');
    return {
      participantId: getCellText(cells[0]),
      participantName: getCellText(cells[1]),
      address: getCellText(cells[2]),
      shareholding: this.parseNumber(getCellText(cells[3])),
      percentage: this.parsePercentage(getCellText(cells[4])),
    };
  }

  /**
   * Validate extracted CCASS data
   */
  validate(data: CCAASSData): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Required fields
    if (!data.stockCode || !/^\d{5}$/.test(data.stockCode)) {
      errors.push('Invalid stock code format (expected 5 digits)');
    }

    if (!data.scrapeDate) {
      errors.push('Missing scrape date');
    }

    if (!data.dataDate) {
      errors.push('Missing data date');
    }

    // Participant validation
    if (data.participants.length === 0) {
      warnings.push('No participants found - may indicate no data for this date');
    }

    data.participants.forEach((p, index) => {
      if (!p.participantId) {
        errors.push(`Participant ${index}: Missing participant ID`);
      }
      if (!p.participantName) {
        errors.push(`Participant ${index}: Missing participant name`);
      }
      if (p.shareholding <= 0) {
        warnings.push(`Participant ${index}: Zero or negative shareholding`);
      }
      if (p.percentage < 0 || p.percentage > 100) {
        errors.push(`Participant ${index}: Invalid percentage (${p.percentage})`);
      }
    });

    // Total validation
    const sumPercentages = data.participants.reduce((sum, p) => sum + p.percentage, 0);
    if (sumPercentages > 105) {
      // Allow 5% tolerance for rounding
      warnings.push(`Total percentages exceed 100%: ${sumPercentages.toFixed(2)}%`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Normalize and clean CCASS data
   */
  normalize(data: CCAASSData): CCAASSData {
    return {
      ...data,
      stockCode: data.stockCode.padStart(5, '0'), // Ensure 5 digits with leading zeros
      stockName: this.cleanText(data.stockName),
      participants: data.participants.map(p => ({
        ...p,
        participantId: this.cleanText(p.participantId),
        participantName: this.cleanText(p.participantName),
        address: this.cleanText(p.address),
        shareholding: Math.round(p.shareholding), // Ensure integer
        percentage: Math.round(p.percentage * 100) / 100, // Round to 2 decimals
      })),
    };
  }
}
