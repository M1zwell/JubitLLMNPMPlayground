# Manual Edge Function Deployment via Supabase Dashboard

**Issue:** Docker Desktop connectivity prevents CLI deployment
**Solution:** Deploy via Supabase Dashboard UI (easier anyway!)
**Time:** 5 minutes per function

---

## ✅ Already Done

- ✅ Project linked to Supabase
- ✅ **Firecrawl API key configured** (FIRECRAWL_API_KEY)
- ✅ All database migrations applied
- ✅ RPC functions working
- ✅ Dashboard functional

## ⚠️ Needs Manual Deployment

4 edge functions need to be deployed via Dashboard (all standalone, no shared imports):
1. `hksfc-rss-sync` - SFC RSS feed sync
2. `sfc-statistics-sync` - SFC statistics XLSX import
3. `hkex-disclosure-scraper` - HKEX disclosure of interests (supports multiple stock codes)
4. `ccass-scraper` - CCASS shareholding data (NEW - standalone replacement for unified-scraper)

**Note:** `unified-scraper` requires CLI deployment (has _shared imports). Use `ccass-scraper` instead.

---

## 🚀 Step-by-Step Deployment

### Function 1: hksfc-rss-sync

1. **Open Supabase Dashboard:**
   - Go to: https://supabase.com/dashboard/project/kiztaihzanqnrcrqaxsv/functions
   - Click "Create a new function"

2. **Configure function:**
   - **Name:** `hksfc-rss-sync`
   - **Click "Create function"**

3. **Upload code:**
   - Click on the newly created function
   - Click "Deploy new version"
   - **Option A - Upload folder:**
     - Zip the folder: `supabase/functions/hksfc-rss-sync`
     - Upload the zip file
   - **Option B - Copy-paste code:**
     - Copy entire contents of `supabase/functions/hksfc-rss-sync/index.ts`
     - Paste into editor
     - If there are imports from `../_shared`, you'll need to include those files

4. **Deploy:**
   - Click "Deploy"
   - Wait for deployment to complete

5. **Verify:**
   ```bash
   curl -X POST https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/hksfc-rss-sync \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{}'
   ```

---

### Function 2: sfc-statistics-sync

Repeat same steps:

1. **Go to:** https://supabase.com/dashboard/project/kiztaihzanqnrcrqaxsv/functions
2. **Create function:** `sfc-statistics-sync`
3. **Upload/paste code** from `supabase/functions/sfc-statistics-sync/index.ts`
4. **Deploy**
5. **Verify:**
   ```bash
   curl -X POST https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/sfc-statistics-sync \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"tables": ["D3", "D4"]}'
   ```

---

### Function 3: hkex-disclosure-scraper

Repeat same steps:

1. **Go to:** https://supabase.com/dashboard/project/kiztaihzanqnrcrqaxsv/functions
2. **Create function:** `hkex-disclosure-scraper`
3. **Upload/paste code** from `supabase/functions/hkex-disclosure-scraper/index.ts`
4. **Deploy**
5. **Verify:**
   ```bash
   curl -X POST https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/hkex-disclosure-scraper \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"stock_codes": "00700,09988", "start_date": "2024-11-01", "end_date": "2025-01-20"}'
   ```

---

### Function 4: ccass-scraper (NEW - Standalone CCASS)

1. **Go to:** https://supabase.com/dashboard/project/kiztaihzanqnrcrqaxsv/functions
2. **Create function:** `ccass-scraper`
3. **Upload/paste code** from `supabase/functions/ccass-scraper/index.ts`
4. **Deploy**
5. **Verify:**
   ```bash
   # Latest day only (fast)
   curl -X POST https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/ccass-scraper \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"stock_codes": "00700", "latest_only": true, "limit": 50}'

   # Date range (slower)
   curl -X POST https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/ccass-scraper \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"stock_codes": "00700,09988", "date_from": "2025-01-01", "date_to": "2025-01-20", "limit": 50}'
   ```

---

## 📋 Alternative: Deploy via Supabase CLI (When Docker Works)

If you want to fix Docker and use CLI:

### Fix Docker Desktop Connection

**Windows:**
```powershell
# Ensure Docker Desktop is running
# Settings → General → "Expose daemon on tcp://localhost:2375 without TLS" (enable)
# Restart Docker Desktop
```

Then retry CLI deployment:
```bash
export SUPABASE_ACCESS_TOKEN=sbp_c1ed7116bc03c99246ffcd3ec819f0da89b514b8
supabase functions deploy hksfc-rss-sync
supabase functions deploy sfc-statistics-sync
supabase functions deploy hkex-disclosure-scraper
```

---

## ✅ Verification Checklist

After deploying all 3 functions:

### 1. Check functions are listed

```bash
export SUPABASE_ACCESS_TOKEN=sbp_c1ed7116bc03c99246ffcd3ec819f0da89b514b8
supabase functions list
```

**Expected output:**
```
unified-scraper (already deployed)
hksfc-rss-sync (newly deployed)
sfc-statistics-sync (newly deployed)
hkex-disclosure-scraper (newly deployed)
```

### 2. Test via Dashboard

1. Go to: http://localhost:8084/hk-admin
2. Click "CCASS Holdings" button
3. Wait 5-10 seconds
4. Job status should change: pending → running → completed

### 3. Verify data scraped

```sql
-- Check job completed
SELECT * FROM scraping_jobs
WHERE status = 'completed'
ORDER BY created_at DESC
LIMIT 1;

-- Check data exists
SELECT COUNT(*) FROM hkex_ccass_shareholdings
WHERE stock_code = '00700';
```

---

## 🎯 Success Criteria

✅ All 4 functions visible in Supabase Dashboard
✅ Function logs show no errors
✅ Test curl requests return 200 OK
✅ Dashboard triggers complete jobs
✅ Data appears in database tables

---

## 📞 If You Get Stuck

**Issue:** Function deployment fails

**Check:**
- Is function code valid TypeScript?
- Are all imports from `../_shared` included?
- Check function logs in Supabase Dashboard → Functions → [function name] → Logs

**Issue:** Function returns 500 error

**Check:**
- Firecrawl API key is set: `supabase secrets list`
- Function logs for detailed error message
- Test Firecrawl API key independently

**Issue:** Jobs stay in pending status

**Check:**
- Function is deployed: `supabase functions list`
- Function logs show execution
- Database job record exists: `SELECT * FROM scraping_jobs ORDER BY created_at DESC LIMIT 1`

---

## 📊 Current Status

| Item | Status | Notes |
|------|--------|-------|
| Database migrations | ✅ Applied | |
| RPC functions | ✅ Working | |
| Dashboard | ✅ Running | Now with stock codes & date range config |
| Secrets (Firecrawl) | ✅ Configured | |
| unified-scraper | ⚠️ CLI Only | Has _shared imports, needs Docker |
| hksfc-rss-sync | ⚠️ Deploy manually | Standalone |
| sfc-statistics-sync | ⚠️ Deploy manually | Standalone |
| hkex-disclosure-scraper | ⚠️ Deploy manually | Standalone, multi-stock support |
| ccass-scraper | ⚠️ Deploy manually | **NEW** - Standalone, replaces unified-scraper for CCASS |

---

**Next:** Deploy the 4 standalone functions via Dashboard, then test!
