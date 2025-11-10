/**
 * HKEx CCASS Extractor Tests
 *
 * Unit tests for the HKEX CCASS shareholding data extractor.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { HKEXCCASSExtractor, CCAASSRawInput } from '../../src/lib/scraping/extractors/hkex-ccass';

describe('HKEXCCASSExtractor', () => {
  let extractor: HKEXCCASSExtractor;

  beforeEach(() => {
    extractor = new HKEXCCASSExtractor();
  });

  describe('Data Normalization', () => {
    it('should normalize stock code to 5 digits with leading zeros', () => {
      const mockData = {
        stockCode: '700',
        stockName: 'TENCENT',
        scrapeDate: new Date().toISOString(),
        dataDate: '2025-01-10',
        totalParticipants: 10,
        totalShares: 1000000,
        participants: [],
      };

      const normalized = extractor.normalize(mockData);

      expect(normalized.stockCode).toBe('00700');
    });

    it('should clean text fields and remove extra whitespace', () => {
      const mockData = {
        stockCode: '00700',
        stockName: '  TENCENT   HOLDINGS  ',
        scrapeDate: new Date().toISOString(),
        dataDate: '2025-01-10',
        totalParticipants: 1,
        totalShares: 1000,
        participants: [
          {
            participantId: '  C00001  ',
            participantName: '  HSBC   Nominees  Limited  ',
            address: '  1  Queens  Road   ',
            shareholding: 1000,
            percentage: 5.5555,
          },
        ],
      };

      const normalized = extractor.normalize(mockData);

      expect(normalized.stockName).toBe('TENCENT HOLDINGS');
      expect(normalized.participants[0].participantId).toBe('C00001');
      expect(normalized.participants[0].participantName).toBe('HSBC Nominees Limited');
      expect(normalized.participants[0].address).toBe('1 Queens Road');
    });

    it('should round shareholding to integer and percentage to 2 decimals', () => {
      const mockData = {
        stockCode: '00700',
        stockName: 'TENCENT',
        scrapeDate: new Date().toISOString(),
        dataDate: '2025-01-10',
        totalParticipants: 1,
        totalShares: 1000,
        participants: [
          {
            participantId: 'C00001',
            participantName: 'Test',
            address: 'Test',
            shareholding: 1000.7,
            percentage: 5.5555,
          },
        ],
      };

      const normalized = extractor.normalize(mockData);

      expect(normalized.participants[0].shareholding).toBe(1001);
      expect(normalized.participants[0].percentage).toBe(5.56);
    });
  });

  describe('Validation', () => {
    it('should validate valid CCASS data', () => {
      const validData = {
        stockCode: '00700',
        stockName: 'TENCENT',
        scrapeDate: new Date().toISOString(),
        dataDate: '2025-01-10',
        totalParticipants: 2,
        totalShares: 2000,
        participants: [
          {
            participantId: 'C00001',
            participantName: 'HSBC Nominees',
            address: 'Hong Kong',
            shareholding: 1000,
            percentage: 50,
          },
          {
            participantId: 'C00002',
            participantName: 'HKSCC Nominees',
            address: 'Hong Kong',
            shareholding: 1000,
            percentage: 50,
          },
        ],
      };

      const result = extractor.validate(validData);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject invalid stock code format', () => {
      const invalidData = {
        stockCode: 'INVALID',
        stockName: 'Test',
        scrapeDate: new Date().toISOString(),
        dataDate: '2025-01-10',
        totalParticipants: 0,
        totalShares: 0,
        participants: [],
      };

      const result = extractor.validate(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Invalid stock code format (expected 5 digits)');
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        stockCode: '00700',
        stockName: 'Test',
        scrapeDate: '',
        dataDate: '',
        totalParticipants: 0,
        totalShares: 0,
        participants: [],
      };

      const result = extractor.validate(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should warn if no participants found', () => {
      const dataWithNoParticipants = {
        stockCode: '00700',
        stockName: 'Test',
        scrapeDate: new Date().toISOString(),
        dataDate: '2025-01-10',
        totalParticipants: 0,
        totalShares: 0,
        participants: [],
      };

      const result = extractor.validate(dataWithNoParticipants);

      expect(result.warnings).toBeDefined();
      expect(result.warnings?.length).toBeGreaterThan(0);
    });

    it('should reject invalid percentage ranges', () => {
      const invalidData = {
        stockCode: '00700',
        stockName: 'Test',
        scrapeDate: new Date().toISOString(),
        dataDate: '2025-01-10',
        totalParticipants: 1,
        totalShares: 1000,
        participants: [
          {
            participantId: 'C00001',
            participantName: 'Test',
            address: 'Test',
            shareholding: 1000,
            percentage: 150, // Invalid - over 100%
          },
        ],
      };

      const result = extractor.validate(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid percentage'))).toBe(true);
    });

    it('should warn if total percentages exceed 100%', () => {
      const dataWithHighPercentages = {
        stockCode: '00700',
        stockName: 'Test',
        scrapeDate: new Date().toISOString(),
        dataDate: '2025-01-10',
        totalParticipants: 2,
        totalShares: 2000,
        participants: [
          {
            participantId: 'C00001',
            participantName: 'Test 1',
            address: 'Test',
            shareholding: 1000,
            percentage: 60,
          },
          {
            participantId: 'C00002',
            participantName: 'Test 2',
            address: 'Test',
            shareholding: 1000,
            percentage: 50,
          },
        ],
      };

      const result = extractor.validate(dataWithHighPercentages);

      expect(result.warnings).toBeDefined();
      expect(result.warnings?.some(w => w.includes('exceed 100%'))).toBe(true);
    });
  });

  describe('Metadata', () => {
    it('should have correct extractor metadata', () => {
      expect(HKEXCCASSExtractor.metadata.id).toBe('hkex-ccass');
      expect(HKEXCCASSExtractor.metadata.category).toBe('HKEX');
      expect(HKEXCCASSExtractor.metadata.supportedFormats).toContain('html');
    });
  });
});
