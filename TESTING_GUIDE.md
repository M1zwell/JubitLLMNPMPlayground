# HK Scraper Testing Guide

**Last Updated:** 2025-11-11
**Purpose:** Test Firecrawl-based scraping via production HK Scraper UI

---

## Current Architecture

```
HK Scraper UI (https://chathogs.com)
    ↓
Supabase Edge Function: scrape-orchestrator
    ↓
Firecrawl API (fc-7f04...91e)
    ├─ HKSFC News: React SPA rendering (waitFor: 3000ms)
    └─ HKEX CCASS: ASP.NET form submission (actions API)
    ↓
PostgreSQL Database
    ├─ hksfc_filings table
    └─ hkex_announcements table
```

**No Puppeteer service deployed** - Using Firecrawl only

---

## 🧪 Testing Checklist

### Pre-Test Setup

- [ ] **Firecrawl API Key:** Configured in Supabase secrets ✅
- [ ] **Edge Functions:** Deployed (scrape-orchestrator v11) ✅
- [ ] **Database:** Tables created ✅
- [ ] **Frontend:** Deployed to chathogs.com ✅

### Test 1: HKSFC News Scraping

**Goal:** Verify Firecrawl can render React SPA and extract news articles

**Steps:**
1. Go to https://chathogs.com
2. Click **"HK Scraper"** button in navigation
3. Ensure **"Scrape Data"** tab is selected
4. Select source: **HKSFC**
5. Set date range: Last 30 days (default)
6. Select filing type: **All** (or specific type)
7. Click **"Start Scraping"**
8. Wait 10-30 seconds

**Expected Results:**
- ✅ Loading spinner appears
- ✅ Success message: "Successfully scraped X records"
- ✅ Records inserted/updated count shown
- ✅ Duration displayed (typically 15-30 seconds)

**Failure Indicators:**
- ❌ Error message: "Firecrawl API error"
- ❌ No data returned
- ❌ Timeout (>60 seconds)

**Verification:**
1. Switch to **"View Database"** tab
2. Select **HKSFC** source
3. Click **"Load Data"**
4. Should see scraped filings with:
   - Title
   - Filing type
   - Company name/code
   - URL
   - Scraped timestamp

---

### Test 2: HKEX CCASS Scraping (Critical)

**Goal:** Verify Firecrawl can handle ASP.NET form submission with ViewState

**Steps:**
1. In HK Scraper, select **"Scrape Data"** tab
2. Select source: **HKEX**
3. Enter stock codes: **00700,00005,00388** (Tencent, HSBC, China Petroleum)
4. Set date range: Last 7 days
5. Click **"Start Scraping"**
6. Wait 30-60 seconds (3-second delay between stocks)

**Expected Results:**
- ✅ Loading spinner appears
- ✅ Success message: "Successfully scraped 3 records"
- ✅ Duration: ~45-60 seconds (15s per stock + overhead)

**Failure Indicators:**
- ❌ Error: "PUPPETEER_SERVICE_URL not configured"
- ❌ Error: "Form submission failed"
- ❌ Error: "No participants found"
- ❌ Timeout or empty results

**Verification:**
1. Switch to **"View Database"** tab
2. Select **HKEX** source
3. Click **"Load Data"**
4. Should see announcements with:
   - Stock code (00700, 00005, 00388)
   - Company name
   - Announcement type
   - URL
   - Scraped timestamp

---

### Test 3: Check Supabase Logs

**Goal:** Monitor Edge Function execution and catch errors

**Steps:**
```bash
# View recent logs
export SUPABASE_ACCESS_TOKEN="sbp_7a8f5797f175740a6fd4592d49c2a2e6be651191"
supabase functions logs scrape-orchestrator

# Or via Supabase Dashboard
# https://supabase.com/dashboard/project/kiztaihzanqnrcrqaxsv/functions/scrape-orchestrator/logs
```

**Look for:**
- ✅ `[HKSFC] Scraping via Firecrawl...`
- ✅ `[HKEX CCASS] Scraping stock 00700 for date...`
- ✅ `[Firecrawl] Success - X records extracted`
- ❌ `[Firecrawl] Error: ...`
- ❌ `PUPPETEER_SERVICE_URL not configured` (should NOT appear)

---

### Test 4: Database Verification

**Goal:** Confirm data is properly stored with deduplication

**Steps:**
```bash
# Check HKSFC filings count
# Via Supabase Dashboard SQL Editor:
SELECT COUNT(*) as total_filings,
       COUNT(DISTINCT content_hash) as unique_filings
FROM hksfc_filings;

# Check HKEX announcements count
SELECT COUNT(*) as total_announcements,
       filing_date,
       company_code
FROM hkex_announcements
GROUP BY filing_date, company_code
ORDER BY filing_date DESC
LIMIT 10;
```

**Expected Results:**
- HKSFC: Multiple filings from recent dates
- HKEX: Announcements for tested stock codes
- No duplicate `content_hash` values
- Recent `scraped_at` timestamps

---

## 📊 Success Criteria

### Minimum Viable (MVP)
- ✅ HKSFC scraping works (React SPA rendering)
- ⚠️ HKEX scraping may work (ASP.NET forms are tricky)
- ✅ Data inserted into database
- ✅ No deployment needed

### Ideal Outcome
- ✅ Both HKSFC and HKEX work via Firecrawl
- ✅ No Puppeteer service needed
- ✅ $0 additional infrastructure cost

### Fallback Plan
- ❌ If HKEX consistently fails:
  - Option 1: Accept limitation (HKSFC-only)
  - Option 2: Deploy Netlify Functions ($0, see SCRAPING_DECISION.md)
  - Option 3: Deploy to Fly.io ($2-4/mo, NOT recommended)

---

## 🐛 Troubleshooting

### Issue: "Invalid JWT" Error

**Cause:** Authentication problem with Edge Function

**Solution:**
1. Check browser console for errors
2. Verify user is logged in (if required)
3. Check Edge Function auth settings
4. Try incognito mode to clear cookies

---

### Issue: "PUPPETEER_SERVICE_URL not configured"

**Cause:** Edge Function is trying to use Puppeteer fallback

**Why:** Firecrawl failed for this source

**Investigation:**
1. Check Supabase logs for Firecrawl error
2. Verify Firecrawl API key is valid
3. Check Firecrawl usage limits
4. See if it's HKEX-specific (ASP.NET forms)

**Solution:**
- If HKSFC fails: Check Firecrawl API key
- If HKEX fails: Expected - see Fallback Plan

---

### Issue: "No data returned" but no error

**Cause:** Scraping succeeded but found 0 results

**Investigation:**
1. Check source URL manually in browser
2. Verify date range has data
3. Check if source website structure changed
4. Review Firecrawl response in logs

**Solution:**
- Adjust date range
- Try different stock codes (HKEX)
- Verify source website is accessible

---

### Issue: Timeout (>60 seconds)

**Cause:** Scraping taking too long

**Investigation:**
1. Check number of stock codes (HKEX)
2. Verify Firecrawl service status
3. Check network connectivity

**Solution:**
- Reduce stock codes to 3-5 per request
- Try again during off-peak hours
- Check Firecrawl status page

---

## 📈 Performance Benchmarks

### Expected Timings

| Source | Stock Codes | Expected Time | Notes |
|--------|-------------|---------------|-------|
| HKSFC | N/A | 15-30s | Single page scrape |
| HKEX | 1 stock | 15-20s | Form + table extraction |
| HKEX | 3 stocks | 45-60s | 3s delay between requests |
| HKEX | 10 stocks | 150-180s | Not recommended |

### Firecrawl API Limits

- Free tier: 500 requests/month
- Paid tier: Varies by plan
- Check usage: https://firecrawl.dev/dashboard

---

## 🎯 Next Steps After Testing

### If All Tests Pass ✅

1. **Document success** in SCRAPING_DECISION.md
2. **Remove Puppeteer service** code (optional)
3. **Update CLAUDE.md** with scraping instructions
4. **Monitor production** usage over 1 week

### If HKSFC Works, HKEX Fails ⚠️

1. **Document limitation** - HKSFC-only mode
2. **Consider Netlify Functions** for HKEX (see SCRAPING_DECISION.md Phase 2)
3. **Update UI** to disable HKEX or show warning
4. **Inform users** of limitation

### If Both Fail ❌

1. **Check Firecrawl API key** - May be invalid/expired
2. **Verify Edge Function** - Check deployment status
3. **Review logs** - Find root cause
4. **Contact Firecrawl support** - May be API issue

---

## 📞 Support Resources

- **Firecrawl Docs:** https://docs.firecrawl.dev
- **Firecrawl Status:** https://status.firecrawl.dev
- **Supabase Logs:** https://supabase.com/dashboard/project/kiztaihzanqnrcrqaxsv/functions
- **Decision Doc:** SCRAPING_DECISION.md
- **Edge Function Code:** supabase/functions/scrape-orchestrator/

---

## ✅ Testing Sign-off

**Tester:** _________________
**Date:** _________________
**HKSFC Result:** ⬜ Pass ⬜ Fail
**HKEX Result:** ⬜ Pass ⬜ Fail
**Database Check:** ⬜ Pass ⬜ Fail
**Decision:** ⬜ Firecrawl Only ⬜ Add Netlify Functions ⬜ Need Fly.io

**Notes:**
_____________________________________________________________
_____________________________________________________________
_____________________________________________________________
