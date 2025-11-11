# HKSFC URL Investigation - 2025-11-11

## Issue Summary

When testing the HK Scraper, HKSFC scraping fails with error:
```
"PUPPETEER_SERVICE_URL not configured - use Firecrawl instead"
```

This error was misleading - the actual issue is different.

---

## Root Cause Analysis

### Discovery 1: URL Redirects

**ALL** `www.sfc.hk` URLs redirect to `apps.sfc.hk`:

```
https://www.sfc.hk/en/News-and-announcements/News/All-news
  ↓ [302 Redirect]
https://apps.sfc.hk/edistributionWeb/gateway/EN/news-and-announcements/news/

https://www.sfc.hk/en/Regulatory-functions/Enforcement/Enforcement-news
  ↓ [302 Redirect]
https://apps.sfc.hk/edistributionWeb/gateway/EN/news-and-announcements/news/enforcement-news/
```

**Conclusion**: The `apps.sfc.hk` URL is **NOT expired** - it's the OFFICIAL React SPA that all URLs redirect to.

### Discovery 2: Firecrawl Works, Extractor Doesn't

**Test Results**:
✅ Firecrawl **CAN** fetch the React SPA
✅ Returns full page content with navigation
❌ **BUT** HKSFCNewsExtractor finds **0 articles**

**Example Response** (from Firecrawl):
```markdown
![Securities and Futures Commission](logo.svg)

[Securities and Futures Commission]...

[About the SFC] [Regulatory functions] [Rules and standards] ...
```

**Problem**: Returns main navigation structure, but NO news articles list.

### Discovery 3: React SPA Rendering Issue

The HKSFC news page is a **React Single Page Application** that:
1. ✅ Loads initially with skeleton/navigation
2. ❌ Requires JavaScript execution to load actual news articles
3. ❌ Articles are loaded via AJAX/fetch after page render

**Firecrawl Status**: Unknown if it's waiting long enough for React to render articles.

---

## Current Status

### What We Fixed

1. **Reverted URL** back to `apps.sfc.hk` (original React SPA)
2. **Fixed Puppeteer fallback** to only trigger if PUPPETEER_SERVICE_URL is configured
3. **Added helpful error** when extraction finds 0 articles
4. **Prevented cryptic error** about Puppeteer not being configured

### What's Still Broken

**HKSFC scraping still fails**, but now with clearer error:
```
"No articles extracted from HKSFC. The page structure may have changed or JavaScript rendering failed."
```

---

## Technical Deep Dive

### Firecrawl Rendering Behavior

Firecrawl is supposed to:
- ✅ Execute JavaScript
- ✅ Wait for page to fully render
- ✅ Return final DOM state

**But currently**:
- Returns initial page load (navigation menu)
- May not be waiting for React AJAX calls to complete
- May not be waiting long enough for articles to load

### HKSFCNewsExtractor Expectations

The extractor looks for HTML patterns like:
```typescript
// Expected structure (from extractor code):
<div class="article-list">
  <article>
    <h2>Article Title</h2>
    <span class="date">2025-11-01</span>
    <a href="/news/article-1">Read more</a>
  </article>
  ...
</div>
```

**Current Response**: Only returns nav menu structure, no article list div.

---

## Possible Solutions

### Option 1: Update Firecrawl Parameters (RECOMMENDED)

Firecrawl has parameters to control JavaScript rendering:

```typescript
const requestBody: any = {
  url,
  formats: ['markdown', 'html'],
  onlyMainContent: false, // Get full page including loaded content
  waitFor: 5000,          // Wait 5 seconds after page load
  screenshot: false
};
```

**Add to scrapeWithFirecrawl**:
- `waitFor`: Time to wait after page load (in ms)
- `timeout`: Total timeout for the request
- `actions`: Specific actions to trigger (scroll, click, etc.)

### Option 2: Use Firecrawl Actions API

Define actions to trigger article loading:

```typescript
const actions = [
  { type: 'wait', milliseconds: 3000 },  // Wait for React to initialize
  { type: 'scroll', direction: 'down' }, // Trigger lazy loading
  { type: 'wait', milliseconds: 2000 },  // Wait for articles to load
];
```

### Option 3: Find Alternative API

Check if HKSFC has a data API:
- ❌ No public REST API found
- ❌ No RSS feed available
- ❌ No JSON endpoints discovered

### Option 4: Deploy Puppeteer Service

Set up external Puppeteer service:
- More control over JavaScript execution
- Can wait for specific DOM elements
- Can interact with page before scraping

---

## Immediate Next Steps

### Step 1: Test Firecrawl with `waitFor` Parameter

Update `scrapeWithFirecrawl()` to wait longer:

```typescript
// In scrape-orchestrator/index.ts
async function scrapeWithFirecrawl(url: string, actions?: any[]): Promise<any> {
  const requestBody: any = {
    url,
    formats: ['markdown', 'html'],
    onlyMainContent: !actions,

    // ADD THESE:
    waitFor: 5000,    // Wait 5 seconds after page load
    timeout: 30000    // 30 second total timeout
  };

  // ... rest of function
}
```

### Step 2: Test Article Extraction

After deploying Step 1:
1. Navigate to http://localhost:8080 → HK Scraper
2. Select HKSFC → Set date range
3. Click "Start Scraping"
4. Check if articles are now extracted

**Expected**: Should extract 10-50 articles if waitFor works

### Step 3: Update Extractor if Needed

If articles still aren't found, inspect the actual HTML:
1. Check Firecrawl response in Edge Function logs
2. Update HKSFCNewsExtractor selectors to match current structure
3. Test extraction locally before deploying

---

## Database Status

**Reminder**: Production database still contains **24 old/invalid records**:
- 13 HKSFC filings (mock data, malformed titles)
- 11 HKEX announcements (test data, HTML fragments)

**Action Required**: Manual cleanup via Supabase Dashboard after fixing scraping.

---

## Testing Checklist

After implementing fixes:

**HKSFC Scraping**:
- [ ] Firecrawl successfully renders React SPA
- [ ] Articles are loaded from AJAX calls
- [ ] HKSFCNewsExtractor finds 10+ articles
- [ ] Articles have valid titles (not "Mock article...")
- [ ] Articles have proper categories (Enforcement, Policy, etc.)
- [ ] Articles have recent dates (October-November 2025)
- [ ] Database insertion succeeds
- [ ] No duplicate records

**HKEX Scraping** (already working):
- [x] Date format correct (YYYY/MM/DD)
- [x] Form submission successful
- [x] CCASS data extracted
- [ ] Database insertion succeeds

---

## Key Findings

1. **✅ URL is correct**: `apps.sfc.hk` is the official React SPA (not expired)
2. **✅ Firecrawl works**: Can fetch the page successfully
3. **❌ Rendering incomplete**: React SPA not fully loaded/rendered
4. **❌ Extractor finds nothing**: 0 articles extracted from page
5. **✅ Error handling improved**: Better error messages now

---

## Files Updated

**This Session**:
- `supabase/functions/scrape-orchestrator/index.ts` (line 267: reverted URL, 282-284: fallback logic, 307-309: better error)
- `src/components/HKScraperProduction.tsx` (line 160: reverted URL)
- `.github/workflows/deploy-edge-functions.yml` (already updated)

**Deployed**: Version 5, 2025-11-11 02:02:54 UTC

---

## Recommendation

**NEXT ACTION**: Add `waitFor` parameter to Firecrawl requests for HKSFC scraping.

This will give React more time to load articles before extraction.

**Estimated Fix Time**: 5 minutes (code update) + 2 minutes (deployment) = 7 minutes

---

**Created**: 2025-11-11 02:05 UTC
**Author**: AI Assistant
**Status**: Investigation complete, solution identified
**Next**: Implement `waitFor` parameter in Firecrawl
