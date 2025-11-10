# Extractor Tests

This directory contains unit tests and integration tests for the web scraping extractors.

## Test Structure

```
tests/
├── setup.ts                    # Global test setup and mocks
├── extractors/                 # Extractor unit tests
│   ├── hkex-ccass.test.ts     # HKEX CCASS extractor tests
│   ├── npm-package.test.ts    # NPM package extractor tests
│   └── hksfc-news.test.ts     # HKSFC news extractor tests (TODO)
├── edge-functions/             # Edge Function integration tests (TODO)
└── fixtures/                   # HTML/JSON snapshots for testing (TODO)
```

## Running Tests

### Install Dependencies

```bash
npm install --save-dev vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom
```

### Run All Tests

```bash
npm test
```

### Run Specific Test File

```bash
npm test tests/extractors/hkex-ccass.test.ts
```

### Run Tests in Watch Mode

```bash
npm test -- --watch
```

### Run Tests with Coverage

```bash
npm test -- --coverage
```

### Open Vitest UI

```bash
npm test -- --ui
```

## Test Types

### Unit Tests

Test individual extractor functions in isolation:
- Data validation
- Data normalization
- Text cleaning
- Number parsing

### Integration Tests (TODO)

Test extractors against captured HTML snapshots:
- Full extraction workflow
- Selector robustness
- Error handling

### E2E Tests (TODO)

Smoke tests against live sites (run nightly):
- Actual web scraping
- Site structure validation
- API availability

## Writing New Tests

### Example: Testing a New Extractor

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { MyNewExtractor } from '../../src/lib/scraping/extractors/my-new-extractor';

describe('MyNewExtractor', () => {
  let extractor: MyNewExtractor;

  beforeEach(() => {
    extractor = new MyNewExtractor();
  });

  describe('Validation', () => {
    it('should validate correct data', () => {
      const data = { /* ... */ };
      const result = extractor.validate(data);
      expect(result.valid).toBe(true);
    });
  });

  describe('Normalization', () => {
    it('should clean text fields', () => {
      const data = { title: '  Test  ' };
      const normalized = extractor.normalize(data);
      expect(normalized.title).toBe('Test');
    });
  });
});
```

## Fixtures

HTML/JSON snapshots for integration tests should be stored in `tests/fixtures/`:

```
tests/fixtures/
├── hkex/
│   ├── ccass-00700-2025-01-10.html
│   └── ccass-no-data.html
├── hksfc/
│   └── news-listing-2025-01.html
└── npm/
    └── react-registry-response.json
```

### Creating Fixtures

```bash
# Manually save HTML from browser or use curl
curl "https://www3.hkexnews.hk/sdw/search/searchsdw.aspx" > tests/fixtures/hkex/page.html
```

## Mocking

### Mock fetch() Globally

```typescript
import { vi } from 'vitest';

global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: async () => ({ /* mock data */ }),
  } as Response)
);
```

### Mock Supabase Client

```typescript
vi.mock('../../src/lib/supabase', () => ({
  supabase: {
    from: vi.fn(() => ({
      select: vi.fn(() => Promise.resolve({ data: [], error: null })),
    })),
  },
}));
```

## Test Coverage Goals

- **Unit Tests**: 80%+ coverage of extractor logic
- **Integration Tests**: All critical extraction paths
- **E2E Tests**: One smoke test per data source

## Continuous Integration

Tests run automatically on:
- Pull requests
- Push to main branch
- Nightly schedule (E2E tests)

## Known Issues

1. **DOMParser in Node**: Requires jsdom for full HTML parsing tests
2. **Browser Automation**: Puppeteer tests need headless browser
3. **Rate Limiting**: Live site tests may hit rate limits

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Writing Good Tests](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
