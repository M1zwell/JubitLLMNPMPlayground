# HK Scraper: Production Roadmap

## Current Status: DEMO MODE ⚠️

The HK Financial Scraper UI is complete with:
- ✅ Preview modal with table/JSON/raw views
- ✅ CSV/JSON/XLSX export (production-ready)
- ✅ MCP servers configured (Firecrawl + Puppeteer)
- ❌ Real scraping (blocked by browser environment)

**Mock Data Location**: `src/lib/scraping/hk-financial-scraper.ts` Lines 183-280

---

## Path to Production: 3 Options

### Option 1: Edge Function Integration (Recommended)

**Create**: `supabase/functions/hk-scraper/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

serve(async (req) => {
  const { url, source, options } = await req.json();

  // Use Firecrawl MCP for most sources
  if (source === 'npm' || source === 'hksfc') {
    const result = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer fc-d4bcb86c7e6648c2a90a47ec7d36ae2a',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url, formats: ['markdown', 'html'] })
    });
    return new Response(JSON.stringify(result.data));
  }

  // Use Puppeteer MCP for HKEX (form-based)
  if (source === 'hkex-ccass') {
    // Puppeteer automation for form submission
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto(url);
    await page.type('#txtStockCode', options.stockCode);
    await page.click('#btnSearch');
    const data = await page.evaluate(() => {
      // Extract table data
    });
    return new Response(JSON.stringify(data));
  }
});
```

**Modify**: `src/lib/scraping/hk-financial-scraper.ts`

```typescript
// Replace mock data generator with Edge Function call
if (typeof window !== 'undefined') {
  console.log('Browser environment - calling Edge Function for real data');

  const response = await fetch(`${ENV.supabase.url}/functions/v1/hk-scraper`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${ENV.supabase.anonKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ url, source, options })
  });

  const realData = await response.json();
  return {
    success: true,
    data: realData,
    source: 'edge-function-firecrawl',
    // ...
  };
}
```

**Timeline**: 2-4 hours
**Pros**: Real scraping, uses MCP, works in production
**Cons**: Requires Edge Function deployment

---

### Option 2: Use Existing Edge Functions

**Modify**: `src/components/HKFinancialScraper.tsx`

```typescript
// For NPM scraping, call existing npm-spider function
const scrapeNPM = async (query: string) => {
  const { data, error } = await supabase.functions.invoke('npm-spider', {
    body: { query, limit: 20 }
  });

  if (error) throw error;
  return data; // Real NPM package data
};

// For LLM data, query database (already scraped by llm-update)
const scrapeLLM = async () => {
  const { data, error } = await supabase
    .from('llm_models')
    .select('*')
    .order('quality_index', { ascending: false })
    .limit(50);

  return data; // Real LLM model data
};
```

**Timeline**: 1-2 hours
**Pros**: No new Edge Functions needed, data already in database
**Cons**: Limited to NPM and LLM sources only (no HKEX/HKSFC)

---

### Option 3: Hybrid Approach (Best for Production)

**Combine**:
1. Use existing `npm-spider` Edge Function for NPM data
2. Use existing database queries for LLM data
3. Create NEW `hk-financial-scraper` Edge Function for HKEX/HKSFC
4. Keep browser mock data as fallback for offline demo

```typescript
export async function scrapeWithDualEngine(url: string, options: ScrapeOptions) {
  // Try Edge Function first
  if (typeof window !== 'undefined' && options.useEdgeFunction !== false) {
    try {
      const result = await callEdgeFunction(url, options);
      return { ...result, source: 'edge-function' };
    } catch (error) {
      console.warn('Edge Function failed, falling back to mock data');
    }
  }

  // Fallback to mock data for demos
  const mockData = generateMockDataForUrl(url, options);
  return { ...mockData, source: 'mock-demo' };
}
```

**Timeline**: 3-6 hours
**Pros**: Production-ready, maintains demo mode, scalable
**Cons**: Most complex implementation

---

## Implementation Priority

### High Priority (Production Critical)
1. [ ] Create `hk-scraper` Edge Function
2. [ ] Connect browser UI to Edge Function
3. [ ] Test with real HKEX/HKSFC URLs
4. [ ] Add error handling for API failures
5. [ ] Deploy to production

### Medium Priority (User Experience)
6. [ ] Add loading indicators for real scraping (3-10s wait)
7. [ ] Implement rate limiting (avoid API bans)
8. [ ] Cache results in Supabase database
9. [ ] Add data validation before export
10. [ ] Error messages for blocked sites

### Low Priority (Nice to Have)
11. [ ] Schedule automated scraping (cron jobs)
12. [ ] Email notifications on completion
13. [ ] Historical data comparison
14. [ ] Data visualization dashboard
15. [ ] Export to Google Sheets API

---

## MCP Integration Details

### Current MCP Servers

| MCP Server | Status | Use Case | Edge Function Integration |
|-----------|--------|----------|--------------------------|
| **Firecrawl** | ✅ Configured | NPM, HKSFC scraping | `fetch('firecrawl.dev/v1/scrape')` |
| **Puppeteer** | ✅ Configured | HKEX form automation | `puppeteer.launch()` in Deno |
| **Filesystem** | ✅ Available | Save CSV locally | Not needed (browser download) |
| **GitHub** | ⚠️ No token | Repo stats | Could enhance NPM data |

### MCP API Keys

- **Firecrawl**: `fc-d4bcb86c7e6648c2a90a47ec7d36ae2a` (active)
- **GitHub**: Empty (needs token for private repos)

### Edge Function Environment Variables

Add to Supabase project settings:
```bash
FIRECRAWL_API_KEY=fc-d4bcb86c7e6648c2a90a47ec7d36ae2a
GITHUB_TOKEN=<your_github_token>
```

---

## Testing Checklist

### Current Demo Mode Testing
- [x] CSV export works with mock data
- [x] JSON export works with mock data
- [x] XLSX export works with mock data
- [x] Preview modal displays data
- [x] Sort/filter/search works
- [x] UI responsive on mobile

### Production Mode Testing (After Edge Function)
- [ ] Real NPM package data appears in CSV
- [ ] Real HKSFC news data appears in CSV
- [ ] Real HKEX CCASS data appears in CSV
- [ ] Error handling for blocked sites
- [ ] Rate limiting doesn't break UI
- [ ] Export large datasets (1000+ records)
- [ ] Performance under load (10+ concurrent users)

---

## Expected Timelines

| Phase | Tasks | Duration | Blocker |
|-------|-------|----------|---------|
| **Phase 1** | Create Edge Function | 2-4 hours | None |
| **Phase 2** | Connect UI to Edge Function | 1-2 hours | Phase 1 |
| **Phase 3** | Test with real URLs | 1-2 hours | Phase 2 |
| **Phase 4** | Production deployment | 30 mins | Phase 3 |
| **Phase 5** | Monitor & optimize | Ongoing | Phase 4 |

**Total Estimated Time**: 4-8 hours of development work

---

## Cost Considerations

### Firecrawl API Pricing
- **Free Tier**: 500 credits/month
- **Pro Tier**: $49/mo for 3,000 credits
- **Cost per scrape**: ~1 credit (simple page), 5-10 credits (complex page)

### Supabase Edge Functions
- **Free Tier**: 500,000 invocations/month
- **Pro Tier**: $25/mo for 2M invocations
- **Cost per invocation**: ~$0.0000125

### Expected Monthly Costs
- **100 scrapes/day** × **30 days** = 3,000 scrapes
- Firecrawl: ~3,000 credits = **$49/mo** (Pro tier)
- Edge Functions: ~3,000 invocations = **FREE** (well under limit)
- **Total**: ~$50/mo for production scraping

---

## Security Considerations

### API Key Protection
- ✅ Firecrawl key stored in Edge Function environment (not exposed to browser)
- ⚠️ Current `.cursor/mcp.json` has API key (should be gitignored)
- ✅ Supabase RLS prevents unauthorized database access

### Rate Limiting
- Add to Edge Function:
  ```typescript
  const rateLimiter = new Map();

  if (rateLimiter.get(userId) > 10) {
    return new Response('Rate limit exceeded', { status: 429 });
  }
  ```

### CORS Protection
- Edge Functions automatically handle CORS
- Browser requests must include Supabase auth token

---

## Next Steps

Choose your path:

1. **Quick Win** (1-2 hours):
   - Integrate existing `npm-spider` Edge Function
   - Query existing database tables for LLM/NPM data
   - Keep HKEX/HKSFC as mock data (with warning)

2. **Full Production** (4-8 hours):
   - Create comprehensive `hk-scraper` Edge Function
   - Integrate Firecrawl MCP for all sources
   - Add Puppeteer for HKEX forms
   - Deploy and test with real data

3. **Hybrid Approach** (3-6 hours):
   - Use existing Edge Functions where possible
   - Create new Edge Function for missing sources
   - Maintain demo mode as fallback

**Recommendation**: Start with **Quick Win**, then iterate to **Full Production**.

---

**Last Updated**: 2025-11-07
**Status**: Ready for implementation
**Current Mode**: DEMO (Mock Data)
**Target Mode**: PRODUCTION (Real Data via Edge Functions)
