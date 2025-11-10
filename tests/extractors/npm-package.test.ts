/**
 * NPM Package Extractor Tests
 *
 * Unit tests for the NPM package data extractor.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { NPMPackageExtractor } from '../../src/lib/scraping/extractors/npm-package';

// Mock fetch globally
global.fetch = vi.fn();

describe('NPMPackageExtractor', () => {
  let extractor: NPMPackageExtractor;

  beforeEach(() => {
    extractor = new NPMPackageExtractor();
    vi.clearAllMocks();
  });

  describe('Data Validation', () => {
    it('should validate valid NPM package data', () => {
      const validData = {
        name: 'react',
        version: '18.2.0',
        description: 'React is a JavaScript library for building user interfaces',
        author: { name: 'Meta', email: 'opensource@meta.com' },
        license: 'MIT',
        homepage: 'https://reactjs.org',
        repository: {
          type: 'git',
          url: 'https://github.com/facebook/react',
        },
        keywords: ['react', 'ui', 'framework'],
        downloads: {
          weekly: 20000000,
          monthly: 80000000,
        },
        dependencies: {},
        devDependencies: {},
        peerDependencies: {},
        npm: {
          publishDate: '2013-05-24T16:15:11.040Z',
          lastPublish: '2023-06-15T20:54:31.625Z',
          versions: ['18.0.0', '18.1.0', '18.2.0'],
        },
        hasTypeScript: true,
      };

      const result = extractor.validate(validData);

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing required fields', () => {
      const invalidData = {
        name: '',
        version: '',
        description: 'Test',
        author: '',
        license: '',
        keywords: [],
        downloads: { weekly: 0 },
        dependencies: {},
        devDependencies: {},
        peerDependencies: {},
        npm: {
          publishDate: '',
          lastPublish: '',
          versions: [],
        },
        hasTypeScript: false,
      };

      const result = extractor.validate(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should reject invalid package name format', () => {
      const invalidData = {
        name: 'INVALID NAME WITH SPACES',
        version: '1.0.0',
        description: 'Test',
        author: 'Test',
        license: 'MIT',
        keywords: [],
        downloads: { weekly: 100 },
        dependencies: {},
        devDependencies: {},
        peerDependencies: {},
        npm: {
          publishDate: '2020-01-01',
          lastPublish: '2020-01-01',
          versions: ['1.0.0'],
        },
        hasTypeScript: false,
      };

      const result = extractor.validate(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid package name'))).toBe(true);
    });

    it('should accept scoped package names', () => {
      const validData = {
        name: '@types/react',
        version: '18.0.0',
        description: 'TypeScript definitions for React',
        author: 'DefinitelyTyped',
        license: 'MIT',
        keywords: [],
        downloads: { weekly: 15000000 },
        dependencies: {},
        devDependencies: {},
        peerDependencies: {},
        npm: {
          publishDate: '2020-01-01',
          lastPublish: '2023-01-01',
          versions: ['18.0.0'],
        },
        hasTypeScript: true,
      };

      const result = extractor.validate(validData);

      expect(result.valid).toBe(true);
    });

    it('should reject negative download counts', () => {
      const invalidData = {
        name: 'test-package',
        version: '1.0.0',
        description: 'Test',
        author: 'Test',
        license: 'MIT',
        keywords: [],
        downloads: { weekly: -100 },
        dependencies: {},
        devDependencies: {},
        peerDependencies: {},
        npm: {
          publishDate: '2020-01-01',
          lastPublish: '2020-01-01',
          versions: ['1.0.0'],
        },
        hasTypeScript: false,
      };

      const result = extractor.validate(invalidData);

      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('Invalid download count'))).toBe(true);
    });

    it('should warn if version is not semver', () => {
      const dataWithBadVersion = {
        name: 'test-package',
        version: 'latest',
        description: 'Test',
        author: 'Test',
        license: 'MIT',
        keywords: [],
        downloads: { weekly: 100 },
        dependencies: {},
        devDependencies: {},
        peerDependencies: {},
        npm: {
          publishDate: '2020-01-01',
          lastPublish: '2020-01-01',
          versions: ['latest'],
        },
        hasTypeScript: false,
      };

      const result = extractor.validate(dataWithBadVersion);

      expect(result.warnings).toBeDefined();
      expect(result.warnings?.some(w => w.includes('semver'))).toBe(true);
    });

    it('should warn if no versions found', () => {
      const dataWithNoVersions = {
        name: 'test-package',
        version: '1.0.0',
        description: 'Test',
        author: 'Test',
        license: 'MIT',
        keywords: [],
        downloads: { weekly: 100 },
        dependencies: {},
        devDependencies: {},
        peerDependencies: {},
        npm: {
          publishDate: '2020-01-01',
          lastPublish: '2020-01-01',
          versions: [],
        },
        hasTypeScript: false,
      };

      const result = extractor.validate(dataWithNoVersions);

      expect(result.warnings).toBeDefined();
      expect(result.warnings?.some(w => w.includes('No versions'))).toBe(true);
    });
  });

  describe('Data Normalization', () => {
    it('should clean text fields', () => {
      const mockData = {
        name: '  react  ',
        version: '18.2.0',
        description: '  React  library   for  UI  ',
        author: '  Meta  ',
        license: 'MIT',
        keywords: ['  react  ', '  ui  '],
        downloads: { weekly: 20000000 },
        dependencies: {},
        devDependencies: {},
        peerDependencies: {},
        npm: {
          publishDate: '2020-01-01',
          lastPublish: '2023-01-01',
          versions: ['18.2.0'],
        },
        hasTypeScript: true,
      };

      const normalized = extractor.normalize(mockData);

      expect(normalized.name).toBe('react');
      expect(normalized.description).toBe('React library for UI');
      expect(normalized.keywords[0]).toBe('react');
      expect(normalized.keywords[1]).toBe('ui');
    });

    it('should convert string author to object', () => {
      const mockData = {
        name: 'test',
        version: '1.0.0',
        description: 'Test',
        author: 'John Doe <john@example.com>',
        license: 'MIT',
        keywords: [],
        downloads: { weekly: 100 },
        dependencies: {},
        devDependencies: {},
        peerDependencies: {},
        npm: {
          publishDate: '2020-01-01',
          lastPublish: '2020-01-01',
          versions: ['1.0.0'],
        },
        hasTypeScript: false,
      };

      const normalized = extractor.normalize(mockData);

      expect(typeof normalized.author).toBe('object');
      expect((normalized.author as any).name).toBe('John Doe <john@example.com>');
    });
  });

  describe('Metadata', () => {
    it('should have correct extractor metadata', () => {
      expect(NPMPackageExtractor.metadata.id).toBe('npm-package');
      expect(NPMPackageExtractor.metadata.category).toBe('NPM');
      expect(NPMPackageExtractor.metadata.supportedFormats).toContain('json');
    });
  });
});
