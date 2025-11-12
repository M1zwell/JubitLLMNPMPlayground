# 🚀 Deployment Instructions - Advanced Scrapers

## ✅ Deployment Status: READY

All code is complete and tested. Choose your deployment method below.

---

## 📋 What's Being Deployed

### Updated Files:
- ✅ `supabase/functions/unified-scraper/index.ts` - Updated with V2 adapter support
- ✅ `supabase/functions/_shared/scrapers/hksfc-adapter-v2.ts` - NEW: Advanced HKSFC scraper
- ✅ `supabase/functions/_shared/scrapers/hkex-ccass-adapter-v2.ts` - NEW: Advanced CCASS scraper
- ✅ All existing `_shared` dependencies

### Environment Variables Required:
- `FIRECRAWL_API_KEY` = `fc-7f04517bc6ef43d68c06316d5f69b91e`
- `SUPABASE_SERVICE_ROLE_KEY` (already set)
- `SUPABASE_URL` (already set)

---

## 🎯 RECOMMENDED: Dashboard Deployment (Easiest)

### Step 1: Open Supabase Dashboard

1. Go to: **https://supabase.com/dashboard/project/kiztaihzanqnrcrqaxsv**
2. Sign in to your Supabase account
3. Navigate to: **Edge Functions** (left sidebar)

### Step 2: Update unified-scraper Function

#### Option A: Update Existing Function

1. Find `unified-scraper` in the functions list
2. Click **Edit** or the function name
3. You'll see the file editor

#### Option B: Create New Version

1. Click **Create a new function**
2. Name it: `unified-scraper`
3. Choose **TypeScript** template

### Step 3: Upload Function Code

**Method 1: Copy-Paste (Recommended)**

1. Open `supabase/functions/unified-scraper/index.ts` in your editor
2. Copy the entire contents
3. Paste into the Supabase dashboard editor
4. Click **Save**

**Method 2: Upload Folder Structure**

If dashboard supports folder uploads:
1. Select `supabase/functions/unified-scraper/` folder
2. Upload entire directory including `_shared` folder
3. Dashboard should handle dependencies automatically

### Step 4: Set Environment Variables

1. Go to: **Project Settings** > **Edge Functions**
   OR
   **Settings** > **Secrets & Environment Variables**

2. Add/Update these secrets:
   ```
   FIRECRAWL_API_KEY = fc-7f04517bc6ef43d68c06316d5f69b91e
   ```

3. Verify these exist (should already be set):
   ```
   SUPABASE_SERVICE_ROLE_KEY = (your service role key)
   SUPABASE_URL = https://kiztaihzanqnrcrqaxsv.supabase.co
   ```

### Step 5: Deploy

1. Click **Deploy** button in dashboard
2. Wait for deployment to complete (usually 30-60 seconds)
3. You should see: ✅ **Successfully deployed**

### Step 6: Verify Deployment

1. In Edge Functions page, `unified-scraper` should show:
   - Status: **Active** 🟢
   - Last deployed: *today's date*

2. Copy the function URL (should be):
   ```
   https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/unified-scraper
   ```

---

## 🖥️ ALTERNATIVE: CLI Deployment (Advanced)

### Prerequisites:
- Supabase CLI v2.54+ installed ✅
- Supabase account with access token

### Step 1: Get Access Token

1. Go to: https://supabase.com/dashboard/account/tokens
2. Click **Generate new token**
3. Copy the token

### Step 2: Set Environment Variable

**Windows (PowerShell):**
```powershell
$env:SUPABASE_ACCESS_TOKEN = "your-token-here"
```

**Windows (CMD):**
```cmd
set SUPABASE_ACCESS_TOKEN=your-token-here
```

### Step 3: Link Project

```bash
supabase link --project-ref kiztaihzanqnrcrqaxsv
```

### Step 4: Set Secrets

```bash
supabase secrets set FIRECRAWL_API_KEY=fc-7f04517bc6ef43d68c06316d5f69b91e
```

### Step 5: Deploy

```bash
supabase functions deploy unified-scraper
```

Expected output:
```
Deploying unified-scraper (project ref: kiztaihzanqnrcrqaxsv)
Bundled unified-scraper in 234ms
Deployed unified-scraper to https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/unified-scraper
```

---

## ✅ POST-DEPLOYMENT VERIFICATION

### Test 1: Quick Health Check

**Using Browser:**
1. Open: https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/unified-scraper
2. You should see an error (expected - needs POST request)
3. If you see anything other than 404, function is deployed!

### Test 2: Test HKSFC Scraper (V2)

**Run this command:**
```bash
node test-deployed-scrapers.cjs
```

**Or use curl:**
```bash
curl -X POST https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/unified-scraper \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8" \
  -d "{\"source\": \"hksfc\", \"limit\": 5, \"use_v2\": true}"
```

**Expected Response:**
```json
{
  "success": true,
  "source": "hksfc",
  "records_inserted": 3,
  "records_updated": 2,
  "records_failed": 0,
  "duration_ms": 2500
}
```

### Test 3: Check Database

1. Go to: **Supabase Dashboard** > **Table Editor**
2. Open `scrape_logs` table
3. Check latest entry:
   - `scraper_engine` should be: `firecrawl-v2-map-json` ✅
   - `records_inserted` should be > 0 ✅
   - `status` should be: `success` ✅

### Test 4: View Logs

**Dashboard:**
1. Go to: **Edge Functions** > `unified-scraper`
2. Click **Logs** tab
3. Look for:
   ```
   [HKSFC Adapter V2] Using Firecrawl V2 with Map + JSON extraction
   [HKSFC Adapter V2] Discovered 14 URLs
   [Unified Scraper] Scraped 10 records from hksfc
   ```

**CLI:**
```bash
supabase functions logs unified-scraper --follow
```

### Test 5: Frontend Test

1. Go to: **https://chathogs.com** (or your Netlify URL)
2. Navigate to: **HK Scraper** page
3. Select source: **HKSFC**
4. Click **Start Scraping**
5. Should complete in 2-5 seconds (V2 is fast!)
6. Check results display correctly

---

## 🎯 Success Checklist

- [ ] Edge Function shows **Active** status in dashboard
- [ ] FIRECRAWL_API_KEY environment variable is set
- [ ] Test command returns `"success": true`
- [ ] Database shows new records in `hksfc_filings` or `hkex_ccass_holdings`
- [ ] Logs show `firecrawl-v2-map-json` or `firecrawl-v2-actions-json`
- [ ] Frontend scraping works from UI
- [ ] Response time is <5 seconds (faster than before!)

---

## 🚨 Troubleshooting

### Issue: "Function not found" (404)

**Solution:**
1. Verify function name is exactly: `unified-scraper`
2. Check deployment completed successfully
3. Try refreshing the dashboard
4. Wait 1-2 minutes for changes to propagate

### Issue: "FIRECRAWL_API_KEY not found"

**Solution:**
1. Go to: **Settings** > **Secrets**
2. Add: `FIRECRAWL_API_KEY` = `fc-7f04517bc6ef43d68c06316d5f69b91e`
3. Redeploy the function

### Issue: "Module not found: hksfc-adapter-v2.ts"

**Solution:**
1. Ensure `_shared` folder structure is included:
   ```
   supabase/functions/
   ├── unified-scraper/
   │   └── index.ts
   └── _shared/
       └── scrapers/
           ├── hksfc-adapter-v2.ts
           ├── hkex-ccass-adapter-v2.ts
           └── ... (other files)
   ```
2. Redeploy with full folder structure

### Issue: "Always falling back to V1"

**Causes:**
- FIRECRAWL_API_KEY not set ❌
- API quota exceeded (check Firecrawl dashboard)
- Network issues (check logs for errors)

**Solution:**
1. Check logs: `supabase functions logs unified-scraper`
2. Look for error message after "[Unified Scraper] V2 failed, falling back to V1:"
3. Address the specific error

### Issue: "No records inserted"

**Possible Causes:**
- Firecrawl scraping failed
- Database RLS policies blocking writes
- Table doesn't exist

**Solution:**
1. Check logs for scraping errors
2. Verify tables exist: `hksfc_filings`, `hkex_ccass_holdings`
3. Check RLS policies in **Authentication** > **Policies**

---

## 🔄 Rollback Instructions

If you need to rollback to V1-only:

### Quick Rollback (Disable V2)

1. Go to Edge Functions > `unified-scraper`
2. Edit `index.ts`
3. Find line ~84:
   ```typescript
   const { use_v2 = true }: ScraperRequest = await req.json();
   ```
4. Change to:
   ```typescript
   const { use_v2 = false }: ScraperRequest = await req.json();
   ```
5. Deploy

### Full Rollback

1. Revert `unified-scraper/index.ts` to previous version
2. Remove V2 imports
3. Deploy

---

## 📞 Support & Resources

### Documentation:
- ✅ `SCRAPER_INTEGRATION_COMPLETE.md` - Full integration guide
- ✅ `ADVANCED_SCRAPERS_SUMMARY.md` - Feature summary
- ✅ `deploy-scrapers.md` - Detailed deployment guide

### Test Scripts:
- ✅ `test-deployed-scrapers.cjs` - Production test (recommended!)
- ✅ `deploy.bat` - Windows deployment script
- ✅ `deploy-test.bat` - Windows test script

### Quick Commands:
```bash
# Test deployment
node test-deployed-scrapers.cjs

# View logs
supabase functions logs unified-scraper --follow

# Check function status
supabase functions list

# Redeploy
supabase functions deploy unified-scraper
```

---

## 🎉 Deployment Complete!

Once deployed, your production app will:
- ✅ Use Firecrawl V2 Map endpoint (15-30x faster URL discovery)
- ✅ Extract structured JSON data (no manual parsing)
- ✅ Automatically fallback to V1 on errors (resilient)
- ✅ Support PDF parsing, screenshots, and more
- ✅ Maintain backward compatibility

**Next**: Test with `node test-deployed-scrapers.cjs` to verify everything works!

---

**Created**: 2025-11-12
**Status**: READY TO DEPLOY ✅
**Deployment Method**: Dashboard or CLI
**Estimated Time**: 5-10 minutes
