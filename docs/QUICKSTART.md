# HK Financial Data Scraping - Quick Start

**Last Updated:** 2025-01-20
**Status:** ✅ Frontend Integration Complete | ⚠️ Backend Deployment Required

---

## 🚀 What's Been Built

### ✅ Completed Frontend Integration
1. **Admin Dashboard Component** - Full-featured React UI for job monitoring
2. **App Navigation** - New "⚙️ HK Admin" button added to main nav
3. **Route Mapping** - Dashboard accessible at `/hk-admin`
4. **Real-time Updates** - Live job monitoring via Supabase subscriptions

### ✅ Completed Backend Preparation
1. **Database Migration** - Job tracking table + RPC functions (SQL fixed)
2. **Integration Tests** - Test suite for all 4 edge functions
3. **pg_cron Schedules** - Daily/weekly automation configured
4. **Documentation** - Complete deployment guides

---

## 📍 Current Status

### Frontend (100% Complete)
✅ Dashboard component built
✅ Navigation integrated
✅ Routes configured
✅ Real-time subscriptions set up

### Backend (40% Complete)
✅ CCASS Unified Scraper - Working
⚠️ HKEX DI Scraper - Needs Firecrawl API key
⚠️ SFC RSS Sync - Needs deployment
⚠️ SFC Statistics Sync - Needs deployment
⚠️ Job tracking migration - Needs to be applied
⚠️ pg_cron schedules - Need to be configured

---

## 🎯 Next Steps (Manual Deployment)

### Step 1: Deploy Edge Functions (5 min)
```bash
supabase login
supabase link --project-ref kiztaihzanqnrcrqaxsv
supabase functions deploy hksfc-rss-sync
supabase functions deploy sfc-statistics-sync
supabase functions deploy hkex-disclosure-scraper
```

### Step 2: Configure Firecrawl API Key (2 min)
```bash
supabase secrets set FIRECRAWL_API_KEY=fc-your-key-here
```

### Step 3: Apply Database Migration (3 min)
```bash
supabase db push
```
Or via SQL Editor: Copy contents of `supabase/migrations/20250120150000_hk_scraping_job_tracking.sql` and run

### Step 4: Configure pg_cron (2 min)
Run in Supabase SQL Editor:
```sql
ALTER DATABASE postgres SET app.supabase_url = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
ALTER DATABASE postgres SET app.supabase_anon_key = 'eyJhbGci...'; -- Your anon key
```

### Step 5: Verify Deployment (2 min)
```bash
node tests/test-hk-scrapers.js
# Expected: 4/4 tests passed
```

**Total Time:** ~15 minutes

---

## 🖥️ Using the Dashboard

### Accessing the Dashboard
1. Start dev server: `npm run dev`
2. Navigate to: http://localhost:8080
3. Click **"⚙️ HK Admin"** in navigation bar
4. Or go directly to: http://localhost:8080/hk-admin

### Dashboard Features

#### 1. Quick Actions
Four trigger buttons for manual scraping:
- **HKEX Disclosure** - Scrape substantial shareholder disclosures
- **SFC RSS Feeds** - Sync press releases, circulars, consultations
- **SFC Statistics** - Import 7 XLSX statistics tables
- **CCASS Holdings** - Scrape stock participant shareholdings

#### 2. Statistics Dashboard
Real-time metrics for last 1/7/30/90 days:
- Total jobs executed
- Success/failure rates
- Average execution duration
- Total records inserted/updated

#### 3. Job History
Live-updating table with:
- Job status (pending → running → completed/failed)
- Progress bars (0-100%)
- Record counts (inserted, updated, failed)
- Duration tracking
- Error viewing for failed jobs
- Source/status filtering

### Manual Triggering

Click any "Quick Action" button to start a scraping job. The job will:
1. Appear in "Job History" immediately with status "pending"
2. Update to "running" when edge function starts
3. Show progress as it executes
4. Complete with final record counts

All updates happen in real-time via Supabase subscriptions - no page refresh needed!

---

## 🔍 Testing

### Test Individual Edge Functions
```bash
# Test CCASS (currently working)
curl -X POST https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/unified-scraper \
  -H "Authorization: Bearer $ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"source":"ccass","stock_code":"00700","limit":50,"use_v2":true}'

# After deployment, test all functions
node tests/test-hk-scrapers.js
```

### Test RPC Triggers
```sql
-- In Supabase SQL Editor (after migration applied)
SELECT trigger_ccass_scrape('00700', 50);
SELECT trigger_sfc_rss_sync();
SELECT trigger_sfc_stats_sync(ARRAY['D3', 'D4']);
SELECT trigger_hkex_di_scrape('00700', '2024-01-01', '2025-01-20');

-- Check job status
SELECT * FROM scraping_jobs ORDER BY created_at DESC LIMIT 10;

-- Get statistics
SELECT * FROM get_scraping_stats(NULL, 7);
```

---

## 📊 System Architecture

```
User Action (Dashboard Button Click)
    ↓
RPC Function (trigger_*_scrape)
    ↓
Insert Job Record (scraping_jobs table)
    ↓
HTTP Request to Edge Function
    ↓
Edge Function Scrapes Data (Firecrawl API)
    ↓
Update Job Status (running → completed/failed)
    ↓
Real-time Update (Supabase subscription)
    ↓
Dashboard Auto-Refreshes (live monitoring)
```

---

## 📁 File Structure

```
✅ Frontend
   src/App.tsx                              # Dashboard integrated
   src/components/HKDataScrapingDashboard.tsx  # Dashboard component

✅ Backend (Ready to Deploy)
   supabase/migrations/20250120150000_hk_scraping_job_tracking.sql  # Migration
   supabase/functions/hkex-disclosure-scraper/  # Edge function
   supabase/functions/hksfc-rss-sync/           # Edge function
   supabase/functions/sfc-statistics-sync/      # Edge function
   supabase/functions/unified-scraper/          # Edge function (CCASS)

✅ Testing
   tests/test-hk-scrapers.js                # Integration tests

✅ Documentation
   docs/hk-scraping-deployment-guide.md     # Full deployment guide
   docs/hk-scraping-implementation-summary.md  # Implementation overview
   docs/QUICKSTART.md                       # This file
```

---

## 🐛 Troubleshooting

### Dashboard shows "Supabase Not Configured"
**Cause:** Environment variables missing
**Fix:** Check `.env` file has `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`

### No jobs appearing in dashboard
**Cause:** Database migration not applied
**Fix:** Run `supabase db push` or apply migration via SQL Editor

### "Unauthorized: Invalid token" from Firecrawl
**Cause:** Firecrawl API key not set
**Fix:** Run `supabase secrets set FIRECRAWL_API_KEY=fc-your-key`

### Edge function returns 404
**Cause:** Function not deployed
**Fix:** Run `supabase functions deploy function-name`

### Real-time updates not working
**Cause:** Supabase Realtime not enabled for `scraping_jobs` table
**Fix:** Go to Supabase Dashboard → Database → Realtime → Enable for `scraping_jobs`

---

## 📚 Additional Resources

- **Full Deployment Guide:** `docs/hk-scraping-deployment-guide.md`
- **Implementation Summary:** `docs/hk-scraping-implementation-summary.md`
- **Technical Reference:** `docs/hk-financial-scraping-consolidated-implementation.md`

---

## 🎉 Success Indicators

You'll know the system is fully operational when:

1. ✅ Dashboard accessible at http://localhost:8080/hk-admin
2. ✅ All 4 "Quick Action" buttons clickable
3. ✅ Integration tests show 4/4 passing
4. ✅ Clicking a trigger button creates a job that appears in history
5. ✅ Job status updates from pending → running → completed
6. ✅ Real-time updates work without page refresh
7. ✅ Statistics show aggregate data for all jobs
8. ✅ pg_cron jobs execute automatically on schedule

**Current Status:**
✅ Frontend: 100% Complete
⚠️ Backend: 40% Complete (CCASS working, 3 functions need deployment)

**Time to Full Deployment:** ~15 minutes following `docs/hk-scraping-deployment-guide.md`
