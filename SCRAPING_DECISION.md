# Scraping Infrastructure Decision

**Date:** 2025-11-11
**Question:** Do we need Fly.io Puppeteer service, or is Firecrawl enough?

---

## Current State Analysis

### ✅ What's Already Configured

1. **Firecrawl API** - Configured in Supabase secrets (`FIRECRAWL_API_KEY`)
2. **Edge Functions** - `scrape-orchestrator` and `unified-scraper` deployed
3. **Frontend** - HK Scraper UI calls `scrape-orchestrator` with `strategy: 'firecrawl'`
4. **Database** - Tables for `hksfc_filings` and `hkex_announcements`

### ❌ What's NOT Configured

1. **Puppeteer Service URL** - `PUPPETEER_SERVICE_URL` secret does not exist
2. **Fallback** - If Firecrawl fails, scraping fails (no Puppeteer fallback)

---

## Technical Analysis

### Architecture Flow

```
HK Scraper UI
    ↓
POST /functions/v1/scrape-orchestrator
    ↓
┌─────────────────────────────────────┐
│  Primary: Firecrawl API             │
│  - HKSFC: React SPA (waitFor: 3000) │
│  - HKEX: ASP.NET forms (actions API)│
└─────────────────────────────────────┘
    ↓ (on failure)
┌─────────────────────────────────────┐
│  Fallback: Puppeteer Service        │
│  - Checks PUPPETEER_SERVICE_URL     │
│  - ❌ NOT CONFIGURED → throws error │
└─────────────────────────────────────┘
```

### Critical Code Insight

From `supabase/functions/scrape-orchestrator/index.ts:484`:

```typescript
// Note: HKEX uses ASP.NET forms with ViewState - Firecrawl may not handle this perfectly
```

**Interpretation:** The developer anticipated Firecrawl might struggle with HKEX CCASS because:
- ASP.NET uses `ViewState` (large hidden form field with serialized state)
- Requires proper form submission flow
- Firecrawl's `actions` API might not handle ViewState correctly

### Scraping Requirements

| Source | Technology | Challenge | Firecrawl Capability |
|--------|-----------|-----------|---------------------|
| **HKSFC** | React SPA | JavaScript rendering | ✅ **Should work** with `waitFor` |
| **HKEX CCASS** | ASP.NET WebForms | ViewState + Form submit | ⚠️ **Uncertain** - may fail |

---

## Decision Matrix

### Option 1: Firecrawl Only (Current Setup) ✅

**Cost:** $0-50/month (already paying)
**Complexity:** Low (no changes needed)
**Pros:**
- ✅ Already configured and deployed
- ✅ Simplest architecture
- ✅ No additional infrastructure
- ✅ Works for HKSFC (confirmed via code analysis)

**Cons:**
- ⚠️ May fail for HKEX CCASS (ASP.NET ViewState)
- ❌ No fallback if Firecrawl fails

**Best for:**
- HKSFC scraping only
- Testing if Firecrawl can handle HKEX
- Low-cost solution

**Action Required:**
1. Test HKEX CCASS scraping via HK Scraper UI
2. If it works: ✅ Done!
3. If it fails: Consider Option 2 or 3

---

### Option 2: Netlify Functions (Fallback) 💡

**Cost:** $0 (free tier: 125k requests/month, 100 hours runtime)
**Complexity:** Medium
**Pros:**
- ✅ Uses existing Netlify infrastructure
- ✅ No additional cost
- ✅ Handles ASP.NET ViewState properly
- ✅ Full Puppeteer control

**Cons:**
- ⚠️ 10-second timeout (might be tight for HKEX)
- ⚠️ 1024MB memory limit
- ⚠️ Cold start adds 2-3 seconds

**Implementation:**
```bash
# Install dependencies
npm install @sparticuz/chromium puppeteer-core

# Create Netlify function
netlify/functions/scrape-hkex.js
```

**Best for:**
- Occasional HKEX CCASS scraping
- When Firecrawl fails
- Cost-conscious projects

**Action Required:**
1. Create Netlify Function with Puppeteer
2. Update `scrape-orchestrator` to call Netlify function as fallback
3. Test end-to-end

---

### Option 3: Fly.io Puppeteer Service ❌

**Cost:** $2-4/month (512MB RAM)
**Complexity:** High
**Pros:**
- ✅ No timeout limits
- ✅ Handles complex scraping
- ✅ Familiar platform (already use for LiteLLM)
- ✅ Hong Kong region available

**Cons:**
- ❌ **Additional monthly cost**
- ❌ **Additional infrastructure to manage**
- ❌ Overkill for occasional scraping
- ❌ Deployment and monitoring overhead

**Best for:**
- Heavy HKEX CCASS usage (>100 requests/day)
- Mission-critical scraping
- When budget allows

**Action Required:**
1. Deploy Puppeteer service to Fly.io
2. Set `PUPPETEER_SERVICE_URL` in Supabase
3. Redeploy Edge Functions
4. Monitor Fly.io metrics

---

## 🎯 Final Recommendation

### **Use Firecrawl Only (Option 1)**

**Rationale:**
1. **Already configured** - Firecrawl API key is set, Edge Functions deployed
2. **Zero additional cost** - Already paying for Firecrawl
3. **Simplest solution** - No additional infrastructure
4. **Test first** - We haven't confirmed Firecrawl actually fails for HKEX

**Next Steps:**
1. ✅ Keep current Firecrawl setup (no changes)
2. 🧪 Test HKEX CCASS scraping via HK Scraper UI
3. 📊 Monitor results:
   - If works: ✅ Done! No Fly.io needed
   - If fails occasionally: Accept limitation or add Netlify Functions
   - If fails consistently: Add Netlify Functions (not Fly.io)

**Why not Fly.io?**
- ❌ **Premature optimization** - We don't know if Firecrawl fails yet
- ❌ **Unnecessary cost** - $2-4/month for potentially unused service
- ❌ **Added complexity** - Another service to deploy, monitor, and maintain
- ✅ **Netlify Functions** is a better fallback (free, simpler, already in stack)

---

## Decision Summary

| Criteria | Firecrawl Only | Netlify Functions | Fly.io Service |
|----------|----------------|-------------------|----------------|
| **Cost** | $0 (current) | $0 (free tier) | $2-4/month |
| **Complexity** | ⭐ Low | ⭐⭐ Medium | ⭐⭐⭐ High |
| **HKSFC** | ✅ Works | ✅ Works | ✅ Works |
| **HKEX CCASS** | ⚠️ Maybe | ✅ Works | ✅ Works |
| **Timeout** | 30s (Firecrawl) | 10s | No limit |
| **Maintenance** | None | Low | High |
| **Recommendation** | ✅ **START HERE** | ✅ If Firecrawl fails | ❌ Not needed |

---

## Implementation Plan

### Phase 1: Test Current Setup (This Week) ✅

```bash
# No code changes needed - already configured!

# Test via UI:
1. Go to https://chathogs.com
2. Click "HK Scraper"
3. Select HKSFC → Click "Start Scraping"
4. Select HKEX → Enter "00700" → Click "Start Scraping"
5. Check results

# Check logs:
supabase functions logs scrape-orchestrator
```

**Success criteria:**
- HKSFC returns news articles
- HKEX returns CCASS data (or specific error message)

**If HKEX fails:** Proceed to Phase 2

---

### Phase 2: Add Netlify Functions (If Needed) 🔧

Only implement if Phase 1 shows Firecrawl consistently fails for HKEX CCASS.

```bash
# 1. Install dependencies
npm install @sparticuz/chromium puppeteer-core

# 2. Create Netlify Function
cat > netlify/functions/scrape-hkex.js << 'EOF'
const chromium = require('@sparticuz/chromium');
const puppeteer = require('puppeteer-core');

exports.handler = async (event) => {
  const { stockCode, date } = JSON.parse(event.body);

  const browser = await puppeteer.launch({
    args: chromium.args,
    executablePath: await chromium.executablePath(),
    headless: true
  });

  const page = await browser.newPage();
  // ... HKEX scraping logic ...
  await browser.close();

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true, data: results })
  };
};
EOF

# 3. Update scrape-orchestrator to use Netlify function as fallback
# (Modify scrapeCCASSWithPuppeteer to call Netlify instead)

# 4. Deploy
netlify deploy --prod
```

**Cost:** $0 (Netlify free tier)
**Effort:** ~2 hours
**Maintenance:** Low

---

### Phase 3: Skip Fly.io Entirely 🚫

**DO NOT implement Fly.io Puppeteer service unless:**
1. Netlify Functions timeout (10s) is too short
2. HKEX scraping is mission-critical
3. Budget allows $2-4/month additional cost

**Why skip:**
- Netlify Functions is sufficient for fallback
- Fly.io is overkill for occasional scraping
- Avoid unnecessary infrastructure complexity

---

## Conclusion

### ✅ Decision: Use Firecrawl Only (Test First)

**Immediate Action:**
1. ✅ Keep current Firecrawl-only setup
2. ✅ No Fly.io deployment
3. ✅ Test via HK Scraper UI
4. ✅ Monitor Firecrawl performance

**Future Action (If Needed):**
- If Firecrawl fails for HKEX: Add Netlify Functions
- If Netlify times out: Consider Fly.io (unlikely)

**Cost Savings:**
- Current: $0 (Firecrawl only)
- With Netlify: $0 (free tier)
- Avoided: $2-4/month (Fly.io not needed)

**Rationale:**
> "Don't add infrastructure until you need it. Test Firecrawl first, fallback to Netlify if needed, skip Fly.io entirely."

---

## Testing Checklist

- [ ] Test HKSFC scraping via HK Scraper UI
- [ ] Test HKEX CCASS scraping via HK Scraper UI
- [ ] Check Supabase function logs for errors
- [ ] Verify data inserted into database tables
- [ ] Document Firecrawl success/failure patterns
- [ ] If failures: Implement Netlify Functions
- [ ] If success: Close this investigation ✅

---

**Status:** Awaiting UI testing
**Next Review:** After production testing
**Owner:** You
**Decision Date:** 2025-11-11
**Final Verdict:** ✅ **No Fly.io needed - Test Firecrawl first, use Netlify Functions as fallback if needed**
