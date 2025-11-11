# Firecrawl waitFor Fix - 2025-11-11

## ✅ Fix Implemented and Deployed

**Status**: DEPLOYED
**Version**: Edge Function v7
**Deployed**: 2025-11-11 02:12:05 UTC
**Deployment Time**: 21 seconds

---

## Problem Summary

**Issue**: HKSFC scraping failed with "No articles extracted" error.

**Root Cause**:
1. HKSFC uses a React SPA that loads articles via AJAX after initial page load
2. Firecrawl was capturing the page too early (only navigation menu)
3. By the time Firecrawl returned, articles hadn't loaded yet
4. HKSFCNewsExtractor found 0 articles in the HTML

**User Impact**: Could not scrape any HKSFC news data.

---

## Solution Implemented

Added `waitFor` parameter to Firecrawl API requests:

```typescript
// In scrapeWithFirecrawl() function
const requestBody: any = {
  url,
  formats: ['markdown', 'html'],
  onlyMainContent: !actions,

  // NEW: Wait for JavaScript/React to fully render
  waitFor: 5000,    // Wait 5 seconds after page load for AJAX/React rendering
  timeout: 30000    // 30 second total timeout
};
```

**How it works**:
1. Firecrawl loads the initial page (skeleton/navigation)
2. **Waits 5 seconds** for:
   - React to initialize
   - AJAX calls to execute
   - News articles to load into DOM
3. Captures final rendered state
4. Returns HTML with articles to extractor

---

## Expected Behavior

**Before Fix**:
- ❌ Firecrawl returns after ~1-2 seconds
- ❌ Only navigation menu in HTML
- ❌ 0 articles extracted
- ❌ Error: "No articles extracted from HKSFC"

**After Fix**:
- ✅ Firecrawl waits 5 seconds for React
- ✅ Articles loaded via AJAX
- ✅ Full article list in HTML
- ✅ 10-50 articles extracted successfully

---

## Testing Instructions

### Test HKSFC Scraping

1. **Navigate** to: `http://localhost:8080`
2. **Click**: "HK Scraper" button in navigation
3. **Select**: "HKSFC" as data source
4. **Set Date Range**: Last 30 days (e.g., 2025-10-12 to 2025-11-11)
5. **Click**: "Start Scraping"
6. **Wait**: ~10-15 seconds for scraping to complete

**Expected Result**:
```
✅ Scraping Successful!
Source: HKSFC

Records Inserted: 10-50
Records Updated: 0
Records Failed: 0
Duration: 8000-12000ms
```

**Check Article Quality**:
- Switch to "View Database" tab
- Verify articles have:
  - ✅ Real titles (not "Mock article...")
  - ✅ Proper categories (Enforcement, Policy, Corporate, etc.)
  - ✅ Recent dates (October-November 2025)
  - ✅ Valid URLs starting with `https://apps.sfc.hk/...`

### Test HKEX Scraping

**Status**: Already working (not affected by this fix)

1. **Select**: "HKEX" as data source
2. **Enter Stock Codes**: `00700` (Tencent)
3. **Set Date**: Recent date within past 12 months
4. **Click**: "Start Scraping"

**Expected Result**:
```
✅ Scraping Successful!
Records Inserted: ~754 (participants for Tencent)
```

---

## Technical Details

### Firecrawl API Parameters

**`waitFor` (number)**:
- Time in milliseconds to wait after page load
- Allows JavaScript/AJAX to complete
- **Trade-off**: Longer wait = more reliable but slower

**`timeout` (number)**:
- Total timeout for the entire request
- Prevents infinite hangs
- **Set to**: 30 seconds (sufficient for most pages)

### Performance Impact

**Before**:
- Scraping time: ~5-7 seconds
- Success rate: 0% (no articles)

**After**:
- Scraping time: ~10-15 seconds (+5 seconds for waitFor)
- Success rate: Expected 95%+ (depends on website uptime)

**Trade-off**: +5 seconds per request, but actually gets data.

---

## Affected Components

**Edge Function**:
- `supabase/functions/scrape-orchestrator/index.ts` (lines 396-397)

**Applies to ALL Firecrawl requests**:
- ✅ HKSFC news scraping
- ✅ HKEX CCASS scraping (already had actions, now has waitFor too)
- ✅ Custom URL scraping (WebScraperDemo component)

**UI Components** (no changes):
- `src/components/HKScraperProduction.tsx`
- `src/components/WebScraperDemo.tsx`

---

## Deployment History

**Version 7** (Current):
- Commit: `171a0da`
- Change: Added waitFor parameter
- Deployed: 2025-11-11 02:12:05 UTC
- Status: ✅ Active

**Version 6**:
- Commit: `7893351`
- Change: Reverted to apps.sfc.hk URL, improved fallback logic
- Deployed: 2025-11-11 02:02:54 UTC

**Version 5**:
- Commit: `3ccc447`
- Change: Added missing extractors directory
- Deployed: 2025-11-10 10:05:07 UTC

**Version 4**:
- Commit: `880340a`
- Change: Initial URL fix attempt (incorrect)
- Deployed: 2025-11-10 10:05:07 UTC

---

## Known Limitations

**Firecrawl Credits**:
- Each scrape uses 1 Firecrawl credit
- Check remaining credits if scraping fails with quota errors

**Page Structure Changes**:
- If HKSFC redesigns their website, extractor may need updates
- Monitor for "0 articles extracted" errors

**Timeout Issues**:
- Slow network: May hit 30 second timeout
- If happens frequently: Increase timeout to 45000 (45 seconds)

---

## Troubleshooting

### Issue: "No articles extracted" (still)

**Possible Causes**:
1. HKSFC website is down
2. React SPA structure changed
3. 5 seconds isn't enough wait time

**Solutions**:
1. Check if `https://apps.sfc.hk/edistributionWeb/gateway/EN/news-and-announcements/news/` loads in browser
2. Inspect page HTML to see article structure
3. Increase `waitFor` to 10000 (10 seconds) if needed

### Issue: "Timeout" error

**Cause**: Total request exceeded 30 seconds

**Solutions**:
1. Check network connection
2. Increase `timeout` to 45000
3. Reduce `waitFor` to 3000 (trade-off: may miss some articles)

### Issue: "Firecrawl API error: 429"

**Cause**: Rate limit or quota exceeded

**Solutions**:
1. Check Firecrawl dashboard for remaining credits
2. Wait a few minutes and retry
3. Upgrade Firecrawl plan if needed

---

## Next Steps

1. **Test the fix** using instructions above
2. **Clean database** - Remove 24 old records via Supabase Dashboard:
   ```sql
   DELETE FROM hksfc_filings WHERE scraped_at < '2025-11-10 10:05:00+00';
   DELETE FROM hkex_announcements WHERE scraped_at < '2025-11-10 10:05:00+00';
   ```
3. **Verify fresh data** - Scrape again after cleanup
4. **Monitor** - Watch for "0 articles" errors over next few days

---

## Success Criteria

✅ **Fix is successful if**:
- HKSFC scraping completes without errors
- 10-50 articles extracted per request
- Articles have real titles and recent dates
- Database insertions succeed
- No "PUPPETEER_SERVICE_URL" errors

❌ **Fix failed if**:
- Still getting "0 articles extracted"
- Timeout errors on every request
- Articles are still mock/test data

---

**Created**: 2025-11-11 02:15 UTC
**Author**: AI Assistant
**Status**: Deployed and ready for testing
**Version**: Edge Function v7
