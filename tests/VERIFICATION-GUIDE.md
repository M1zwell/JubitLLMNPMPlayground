# RPC Functions Fix - Verification Guide

**Date:** 2025-01-20
**Fix Migration:** `supabase/migrations/20250120160000_fix_rpc_functions.sql`
**Issue:** HTTP extension not available, permission denied errors
**Status:** ✅ Fix created, ready for testing

---

## Quick Start

### Step 1: Apply Fix Migration (If Not Done)

If you haven't applied the fix migration yet, run in **Supabase SQL Editor**:

```sql
-- Copy and paste contents of:
-- supabase/migrations/20250120160000_fix_rpc_functions.sql
```

Or use the Supabase CLI:

```bash
supabase db push
```

### Step 2: Run Automated Tests

```bash
# Run comprehensive test suite
node tests/test-fixed-rpc-functions.js
```

**Expected output:**
```
🧪 RPC Functions Verification Test Suite
✅ PASS: Function exists: trigger_ccass_scrape
✅ PASS: Function exists: trigger_sfc_rss_sync
✅ PASS: Function exists: trigger_sfc_stats_sync
✅ PASS: Function exists: trigger_hkex_di_scrape
✅ PASS: Function exists: get_scraping_stats
✅ PASS: trigger_ccass_scrape creates job record
✅ PASS: Job record exists in database
✅ PASS: Job record has correct source (ccass)
✅ PASS: Job record has status 'pending'
...
📊 TEST SUMMARY
✅ Passed: 20
❌ Failed: 0
📈 Success Rate: 100%
```

### Step 3: Test Dashboard Integration

```bash
# Start dev server
npm run dev

# Navigate to dashboard
# http://localhost:8080/hk-admin
```

**Test each trigger button:**
1. Click "CCASS Holdings" → Should create job and show in history
2. Click "SFC RSS Feed" → Should create job
3. Click "SFC Statistics" → Should create job
4. Click "HKEX Disclosures" → Should create job

**Expected behavior:**
- Job appears in history table immediately
- Status shows "pending"
- No errors in console
- Real-time updates work (job status changes)

---

## Manual Verification (SQL)

If you prefer manual testing, run these queries in **Supabase SQL Editor**:

### Test 1: Verify Functions Exist

```sql
SELECT routine_name, routine_type
FROM information_schema.routines
WHERE routine_schema = 'public'
AND routine_name IN (
  'trigger_hkex_di_scrape',
  'trigger_sfc_rss_sync',
  'trigger_sfc_stats_sync',
  'trigger_ccass_scrape',
  'get_scraping_stats'
)
ORDER BY routine_name;
```

**Expected:** 5 rows (all functions exist)

### Test 2: Test CCASS Scraper

```sql
SELECT trigger_ccass_scrape('00700', 10);
```

**Expected:** UUID returned (e.g., `550e8400-e29b-41d4-a716-446655440000`)

### Test 3: Verify Job Created

```sql
SELECT
  id,
  source,
  status,
  config,
  created_at
FROM scraping_jobs
ORDER BY created_at DESC
LIMIT 1;
```

**Expected:**
- `source`: `ccass`
- `status`: `pending`
- `config`: Contains `stock_code` and `limit`

### Test 4: Test SFC RSS Sync

```sql
SELECT trigger_sfc_rss_sync();
```

**Expected:** UUID returned

### Test 5: Test SFC Stats Sync

```sql
SELECT trigger_sfc_stats_sync(ARRAY['D3', 'D4']);
```

**Expected:** UUID returned

### Test 6: Test HKEX DI Scrape

```sql
SELECT trigger_hkex_di_scrape('00700', '2024-01-01', '2025-01-20');
```

**Expected:** UUID returned

### Test 7: Test Statistics Function

```sql
SELECT * FROM get_scraping_stats(NULL, 7);
```

**Expected:** Table with stats for all sources (last 7 days)

### Test 8: Clean Up Test Jobs

```sql
DELETE FROM scraping_jobs
WHERE created_at > NOW() - INTERVAL '5 minutes'
AND status = 'pending';
```

---

## Troubleshooting

### Issue: Function not found (404)

**Symptom:**
```
❌ FAIL: Function exists: trigger_ccass_scrape
   Function not found (404)
```

**Fix:**
1. Check if fix migration was applied:
   ```sql
   SELECT * FROM information_schema.routines
   WHERE routine_name = 'trigger_ccass_scrape';
   ```
2. If empty, apply fix migration in SQL Editor

### Issue: Permission denied

**Symptom:**
```
ERROR: 42501: permission denied for function trigger_ccass_scrape
```

**Fix:**
1. Check RLS policies:
   ```sql
   SELECT * FROM pg_policies
   WHERE schemaname = 'public'
   AND tablename = 'scraping_jobs';
   ```
2. Verify GRANT statements in migration:
   ```sql
   GRANT EXECUTE ON FUNCTION trigger_ccass_scrape TO authenticated;
   ```

### Issue: Job created but status not updating

**Symptom:**
- Job appears in database with status `pending`
- Status never changes to `running` or `completed`

**Cause:**
- Edge function not deployed OR
- Firecrawl API key not configured

**Fix:**
1. Deploy edge functions:
   ```bash
   supabase functions deploy unified-scraper
   supabase functions deploy hksfc-rss-sync
   supabase functions deploy sfc-statistics-sync
   supabase functions deploy hkex-disclosure-scraper
   ```

2. Configure Firecrawl API key:
   ```bash
   supabase secrets set FIRECRAWL_API_KEY=fc-your-key-here
   ```

### Issue: Dashboard shows "Failed to trigger scrape"

**Symptom:**
```
Error: Failed to trigger scrape
Details: HTTP error! status: 500
```

**Fix:**
1. Check browser console for detailed error
2. Verify Supabase URL and anon key in `.env`:
   ```bash
   VITE_SUPABASE_URL=https://kiztaihzanqnrcrqaxsv.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGci...
   ```
3. Check Supabase function logs:
   - Dashboard → Logs → Edge Functions
   - Look for errors in `unified-scraper`

---

## Architecture Verification

### Old Architecture (Broken)
```
User → RPC Function → HTTP call (pg_net) → Edge Function ❌
                         ↑
                    NOT AVAILABLE
```

### New Architecture (Fixed)
```
User → Dashboard → RPC Function → Job Record Created ✅
            ↓
         HTTP call (fetch) → Edge Function → Updates Job ✅
```

**Key Changes:**
1. RPC functions only create job records (no HTTP calls)
2. Dashboard makes direct HTTP calls to edge functions
3. Edge functions update job status as they run
4. Real-time subscriptions show live updates

---

## Success Criteria

✅ All RPC functions return UUIDs (not errors)
✅ Job records created in `scraping_jobs` table
✅ Jobs have status `pending` initially
✅ Dashboard shows jobs in history table
✅ No console errors when clicking triggers
✅ Statistics function returns data
✅ Real-time updates work (if edge function deployed)

---

## Next Steps After Verification

Once all tests pass:

### 1. Deploy Missing Edge Functions (Optional)

```bash
# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref kiztaihzanqnrcrqaxsv

# Deploy functions
supabase functions deploy hksfc-rss-sync
supabase functions deploy sfc-statistics-sync
supabase functions deploy hkex-disclosure-scraper
```

### 2. Configure Firecrawl API Key (Optional)

```bash
supabase secrets set FIRECRAWL_API_KEY=fc-your-api-key-here
```

### 3. Test End-to-End Flow

```bash
# Start dev server
npm run dev

# Navigate to dashboard
# http://localhost:8080/hk-admin

# Click "CCASS Holdings"
# Wait for job to complete
# Verify data appears in respective tables
```

### 4. Set Up Automated Scheduling (Optional)

See `docs/HOTFIX-rpc-functions.md` for options:
- Option A: Enable pg_net extension (contact Supabase support)
- Option B: Use Supabase Database Webhooks
- Option C: Use external cron (GitHub Actions, Vercel Cron)

---

## Files Reference

**Fix Migration:**
- `supabase/migrations/20250120160000_fix_rpc_functions.sql`

**Documentation:**
- `docs/HOTFIX-rpc-functions.md` (detailed explanation)
- `tests/VERIFICATION-GUIDE.md` (this file)

**Test Scripts:**
- `tests/test-fixed-rpc-functions.js` (automated test suite)
- `tests/verify-migration.sql` (manual SQL verification)
- `tests/configure-pgcron.sql` (pg_cron setup, optional)

**Dashboard:**
- `src/components/HKDataScrapingDashboard.tsx`

---

## Support

If verification fails or you encounter issues:

1. **Check test output** for specific error messages
2. **Review Supabase logs:** Dashboard → Logs → Functions
3. **Check browser console:** DevTools → Console (F12)
4. **Verify RPC permissions:**
   ```sql
   SELECT
     p.proname AS function_name,
     array_agg(r.rolname) AS granted_to
   FROM pg_proc p
   JOIN pg_namespace n ON p.pronamespace = n.oid
   LEFT JOIN pg_proc_acl pa ON p.oid = pa.grantee
   LEFT JOIN pg_roles r ON pa.grantee = r.oid
   WHERE n.nspname = 'public'
   AND p.proname LIKE 'trigger_%'
   GROUP BY p.proname;
   ```

---

**Status:** ✅ Ready for verification
**Last Updated:** 2025-01-20
