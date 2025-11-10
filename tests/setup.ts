/**
 * Vitest Global Setup
 *
 * Configures global test environment and mocks.
 */

import { vi } from 'vitest';

// Mock environment variables for tests
process.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
process.env.VITE_SUPABASE_ANON_KEY = 'test-anon-key';
process.env.VITE_FIRECRAWL_API_KEY = 'test-firecrawl-key';

// Mock DOMParser for Node environment
if (typeof DOMParser === 'undefined') {
  global.DOMParser = class DOMParser {
    parseFromString(htmlString: string, mimeType: string): Document {
      // Simple mock - in real tests, use jsdom
      return {
        querySelector: vi.fn(() => null),
        querySelectorAll: vi.fn(() => []),
      } as any;
    }
  };
}

// Mock console methods to reduce test noise
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  // Keep error for actual test failures
};
