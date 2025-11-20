/**
 * SFC Statistics Tables Scraper
 * Source: https://www.sfc.hk/en/Reports-and-statistics/Statistics
 *
 * Scrapes XLSX statistics tables (A1-A3, C4-C5, D3-D4) and parses them.
 * Uses direct XLSX parsing for structured data extraction.
 */

import { readXLSX, utils } from 'https://deno.land/x/sheetjs@0.18.3/xlsx.mjs';

export interface SFCStatsConfig {
  tableIds: string[];
  forceRefresh?: boolean;
}

export interface SFCStatsRecord {
  table_name: string;
  table_title: string;
  report_period: string;
  file_hash: string;
  data: Record<string, any>;
  file_url: string;
}

export class SFCStatsScraper {
  private baseUrl = 'https://www.sfc.hk/en/Reports-and-statistics/Statistics';

  // Map table IDs to their direct download URLs
  private tableUrls: Record<string, string> = {
    'A1': 'https://www.sfc.hk/-/media/EN/assets/components/codes/files-current-version/web-accessible/statistics/tableA1.xlsx',
    'A2': 'https://www.sfc.hk/-/media/EN/assets/components/codes/files-current-version/web-accessible/statistics/tableA2.xlsx',
    'A3': 'https://www.sfc.hk/-/media/EN/assets/components/codes/files-current-version/web-accessible/statistics/tableA3.xlsx',
    'C4': 'https://www.sfc.hk/-/media/EN/assets/components/codes/files-current-version/web-accessible/statistics/tableC4.xlsx',
    'C5': 'https://www.sfc.hk/-/media/EN/assets/components/codes/files-current-version/web-accessible/statistics/tableC5.xlsx',
    'D3': 'https://www.sfc.hk/-/media/EN/assets/components/codes/files-current-version/web-accessible/statistics/tableD3.xlsx',
    'D4': 'https://www.sfc.hk/-/media/EN/assets/components/codes/files-current-version/web-accessible/statistics/tableD4.xlsx'
  };

  private tableTitles: Record<string, string> = {
    'A1': 'Licensed Corporations by Type of Business',
    'A2': 'Licensed Individuals by Type of Regulated Activity',
    'A3': 'Registered Institutions by Type of Business',
    'C4': 'Collective Investment Schemes Authorized',
    'C5': 'Unit Trusts and Mutual Funds Authorized',
    'D3': 'Net Asset Value of SFC-Authorized Funds',
    'D4': 'Fund Flows of SFC-Authorized Funds'
  };

  async scrape(config: SFCStatsConfig): Promise<SFCStatsRecord[]> {
    const records: SFCStatsRecord[] = [];

    for (const tableId of config.tableIds) {
      try {
        const record = await this.scrapeTable(tableId);
        records.push(record);

        // Rate limiting: 20 requests per minute
        await this.delay(3000);
      } catch (error) {
        console.error(`Failed to scrape table ${tableId}:`, error);
        // Continue with next table
      }
    }

    return records;
  }

  private async scrapeTable(tableId: string): Promise<SFCStatsRecord> {
    const url = this.tableUrls[tableId];
    if (!url) {
      throw new Error(`Unknown table ID: ${tableId}`);
    }

    // Download XLSX file
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to download ${tableId}: ${response.status}`);
    }

    const arrayBuffer = await response.arrayBuffer();
    const fileHash = await this.calculateHash(new Uint8Array(arrayBuffer));

    // Parse XLSX
    const workbook = readXLSX(arrayBuffer);
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convert to JSON
    const jsonData = utils.sheet_to_json(worksheet, { header: 1 });

    // Extract report period from file (usually in first few rows)
    const reportPeriod = this.extractReportPeriod(jsonData, tableId);

    // Parse data based on table type
    const parsedData = this.parseTableData(tableId, jsonData);

    return {
      table_name: tableId,
      table_title: this.tableTitles[tableId],
      report_period: reportPeriod,
      file_hash: fileHash,
      data: parsedData,
      file_url: url
    };
  }

  private async calculateHash(data: Uint8Array): Promise<string> {
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  private extractReportPeriod(data: any[][], tableId: string): string {
    // Look for "As at" or "For the period" in first 5 rows
    for (let i = 0; i < Math.min(5, data.length); i++) {
      const row = data[i].join(' ');

      // Match patterns like "As at 31 December 2024" or "December 2024"
      const asAtMatch = row.match(/As at (\d{1,2} \w+ \d{4})/i);
      if (asAtMatch) return asAtMatch[1];

      const monthYearMatch = row.match(/(\w+ \d{4})/);
      if (monthYearMatch) return monthYearMatch[1];
    }

    // Fallback to current month
    return new Date().toISOString().slice(0, 7);
  }

  private parseTableData(tableId: string, rawData: any[][]): Record<string, any> {
    // Skip header rows (usually first 3-5 rows)
    const headerRowIndex = this.findHeaderRow(rawData);
    const headers = rawData[headerRowIndex];
    const dataRows = rawData.slice(headerRowIndex + 1);

    // Filter out empty rows
    const filteredRows = dataRows.filter(row =>
      row.some(cell => cell !== null && cell !== undefined && cell !== '')
    );

    // Convert to structured format
    const structured = filteredRows.map(row => {
      const obj: Record<string, any> = {};
      headers.forEach((header, index) => {
        if (header) {
          obj[String(header).trim()] = row[index];
        }
      });
      return obj;
    });

    return {
      table_id: tableId,
      headers: headers.filter(h => h),
      row_count: structured.length,
      data: structured,
      metadata: {
        total_columns: headers.length,
        has_numeric_data: this.hasNumericColumns(structured)
      }
    };
  }

  private findHeaderRow(data: any[][]): number {
    // Find first row with multiple non-empty cells (likely the header)
    for (let i = 0; i < Math.min(10, data.length); i++) {
      const nonEmptyCells = data[i].filter(cell =>
        cell !== null && cell !== undefined && cell !== ''
      );

      if (nonEmptyCells.length >= 3) {
        return i;
      }
    }
    return 0;
  }

  private hasNumericColumns(data: any[]): boolean {
    if (data.length === 0) return false;

    const firstRow = data[0];
    return Object.values(firstRow).some(value =>
      typeof value === 'number' || !isNaN(Number(value))
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
