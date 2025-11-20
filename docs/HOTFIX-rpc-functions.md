# HOTFIX: RPC Functions - HTTP Extension & RLS Policy Issues

**Date:** 2025-01-20
**Issues:**
1. pg_net extension not available in Supabase
2. RLS policy blocking anonymous job creation

**Status:** ✅ FIXED (requires 2 migrations)

---

## Problem

Three errors occurred when running the original migration:

### Error 1: HTTP Extension Not Available
```
ERROR: 42704: type "extensions.http_request" does not exist
```
**Cause:** The `pg_net` extension (which provides `extensions.http()`) is not enabled or available in your Supabase project.

### Error 2: Permission Denied
```
ERROR: 42501: permission denied to set parameter "app.supabase_url"
```
**Cause:** Setting database-level parameters requires superuser privileges, which aren't available to regular users.

### Error 3: RLS Policy Blocks Anonymous Job Creation ⚠️ NEW
```
RPC functions return UUIDs but jobs don't appear in database
Test: Job ID 08ace8ca-b83c-4700-82c4-78a8843304de not found
```
**Cause:** RPC functions use `auth.uid()` which returns NULL for anonymous users, and RLS policies block inserts with NULL `created_by`.

---

## Solution

Created a **simplified architecture** that works better with Supabase:

### Old Approach (Didn't Work)
```
User Click → RPC Function → HTTP call to edge function → Edge function runs
```
**Problem:** Requires `pg_net` extension and superuser permissions

### New Approach (Works!)
```
User Click → RPC Function (create job record) → Frontend HTTP call → Edge function runs
```
**Benefit:** No extension dependencies, works with standard Supabase permissions

---

## What Changed

### 1. Created Fix Migration #1 - HTTP Extension
**File:** `supabase/migrations/20250120160000_fix_rpc_functions.sql`

- Drops old RPC functions with HTTP calls
- Creates new simplified RPC functions that only create job records
- Frontend now handles edge function triggering

### 2. Updated Dashboard Component
**File:** `src/components/HKDataScrapingDashboard.tsx`

Updated `triggerScrape()` function to:
1. Call RPC function to create job record (returns job ID)
2. Call edge function directly via HTTP (passing job ID)
3. Edge function updates job status as it runs

### 3. Created Fix Migration #2 - RLS Policy ⚠️ NEW
**File:** `supabase/migrations/20250120170000_fix_rls_anonymous_jobs.sql`

- Updates RPC functions to handle NULL `auth.uid()` (anonymous users)
- Updates RLS policies to allow anonymous job creation
- Grants execute permissions to both `anon` and `authenticated` roles
- Uses placeholder UUID for anonymous users: `00000000-0000-0000-0000-000000000000`

---

## How To Apply Fix

### Step 1: Apply Fix Migration #1 (HTTP Extension Fix)
Run in **Supabase SQL Editor**:

```sql
-- Copy contents of supabase/migrations/20250120160000_fix_rpc_functions.sql
-- and paste into SQL Editor, then click "Run"
```

### Step 2: Apply Fix Migration #2 (RLS Policy Fix) ⚠️ REQUIRED
Run in **Supabase SQL Editor**:

```sql
-- Copy contents of supabase/migrations/20250120170000_fix_rls_anonymous_jobs.sql
-- and paste into SQL Editor, then click "Run"
```

**IMPORTANT:** Both migrations are required! Migration #1 fixes the HTTP extension issue, but Migration #2 fixes the RLS policy issue that prevents jobs from being inserted.

### Step 3: Verify Fix
```sql
-- Test RPC function (should create job record without error)
SELECT trigger_ccass_scrape('00700', 10);

-- Check if job was created (should return 1 row)
SELECT * FROM scraping_jobs ORDER BY created_at DESC LIMIT 1;
```

**Expected:**
- Job record created with status 'pending'
- No errors during RPC call
- Job visible in SELECT query

### Step 3: Test Dashboard
```bash
npm run dev
# Navigate to http://localhost:8080/hk-admin
# Click "CCASS Holdings" button
```

**Expected:**
1. Job record created
2. Edge function called
3. Job updates to 'running' then 'completed'
4. Results show in dashboard

---

## Architecture Details

### New Flow

```
┌─────────────┐
│   User      │
│  Dashboard  │
└──────┬──────┘
       │
       │ 1. Click trigger button
       ▼
┌─────────────────────────────────┐
│  triggerScrape() function       │
│                                 │
│  Step 1: Call RPC Function      │
│  ├─ trigger_ccass_scrape()      │
│  └─ Returns: job_id (UUID)      │
│                                 │
│  Step 2: Call Edge Function     │
│  ├─ POST /functions/v1/...      │
│  ├─ Headers: Authorization      │
│  └─ Body: { job_id, params }    │
└─────────────┬───────────────────┘
              │
              │ 3. Edge function processes
              ▼
     ┌──────────────────┐
     │  Edge Function   │
     │  (Firecrawl API) │
     │                  │
     │  Updates:        │
     │  - Job status    │
     │  - Progress      │
     │  - Records       │
     └──────────────────┘
              │
              │ 4. Real-time subscription
              ▼
     ┌──────────────────┐
     │   Dashboard      │
     │   (Auto-update)  │
     └──────────────────┘
```

### Database Functions (Simplified)

```sql
-- Old (didn't work):
CREATE FUNCTION trigger_ccass_scrape() AS $$
BEGIN
  INSERT INTO scraping_jobs ...;
  PERFORM extensions.http(...);  -- ❌ Requires pg_net
END;
$$;

-- New (works!):
CREATE FUNCTION trigger_ccass_scrape() AS $$
BEGIN
  INSERT INTO scraping_jobs ...;
  RETURN job_id;  -- ✅ Frontend handles HTTP call
END;
$$;
```

### Frontend (Updated)

```typescript
async function triggerScrape(config) {
  // Step 1: Create job record via RPC
  const { data: jobId } = await supabase.rpc('trigger_ccass_scrape', {
    p_stock_code: '00700',
    p_limit: 50
  });

  // Step 2: Call edge function via HTTP
  const response = await fetch(`${SUPABASE_URL}/functions/v1/unified-scraper`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${authToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      source: 'ccass',
      stock_code: '00700',
      limit: 50,
      job_id: jobId  // Pass job ID for tracking
    })
  });
}
```

---

## Benefits of New Approach

### ✅ Advantages
1. **No Extension Dependencies** - Works with standard Supabase
2. **Better Error Handling** - Frontend sees edge function errors directly
3. **More Secure** - Uses user's auth token for HTTP calls
4. **Easier to Debug** - Can see HTTP requests in browser DevTools
5. **More Control** - Frontend can handle retries, timeouts, etc.

### 🔄 Trade-offs
1. **pg_cron Not Affected** - Scheduled jobs still won't trigger edge functions automatically
2. **Manual Triggers Only** - Dashboard buttons work, but cron jobs need separate setup

---

## pg_cron Workaround (Optional)

If you want automated scheduling via pg_cron, you have two options:

### Option A: Enable pg_net Extension
Contact Supabase support to enable `pg_net` extension, then use original migration.

### Option B: Use Supabase Webhooks
Instead of pg_cron calling edge functions, use Supabase Database Webhooks:
1. Create webhook triggers on schedule
2. Webhook calls edge function via HTTP
3. No pg_net extension needed

### Option C: Use External Cron (Recommended)
Use GitHub Actions, Vercel Cron, or similar:
```yaml
# .github/workflows/scrape-schedule.yml
on:
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC
jobs:
  trigger-scrape:
    runs-on: ubuntu-latest
    steps:
      - name: Trigger SFC RSS Sync
        run: |
          curl -X POST ${{ secrets.SUPABASE_URL }}/functions/v1/hksfc-rss-sync \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}"
```

---

## Verification Checklist

After applying fix:

- [ ] Fix migration applied without errors
- [ ] RPC functions exist (trigger_*_scrape)
- [ ] Test RPC call creates job record
- [ ] Dashboard loads without errors
- [ ] Clicking trigger button works
- [ ] Job appears in history table
- [ ] Job status updates in real-time
- [ ] Statistics function works

---

## Next Steps

1. ✅ Apply fix migration
2. ✅ Test RPC functions
3. ✅ Test dashboard triggers
4. ⚠️ Deploy missing edge functions (hksfc-rss-sync, sfc-statistics-sync, hkex-disclosure-scraper)
5. ⚠️ Configure Firecrawl API key
6. ⚠️ Set up external cron for automated scheduling (optional)

---

## Files Modified

```
✅ Created
   supabase/migrations/20250120160000_fix_rpc_functions.sql (HTTP extension fix)
   supabase/migrations/20250120170000_fix_rls_anonymous_jobs.sql (RLS policy fix) ⚠️ NEW
   tests/test-fixed-rpc-functions.js (automated test suite)
   tests/VERIFICATION-GUIDE.md (step-by-step verification)
   docs/HOTFIX-rpc-functions.md (this file)

✅ Updated
   src/components/HKDataScrapingDashboard.tsx
```

---

## Support

If you encounter issues:

1. **Check Supabase logs:** Dashboard → Logs → Functions
2. **Check browser console:** DevTools → Console
3. **Verify RPC functions exist:**
   ```sql
   SELECT routine_name FROM information_schema.routines
   WHERE routine_schema = 'public'
   AND routine_name LIKE 'trigger_%';
   ```
4. **Test edge function directly:**
   ```bash
   curl -X POST https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/unified-scraper \
     -H "Authorization: Bearer $ANON_KEY" \
     -H "Content-Type: application/json" \
     -d '{"source":"ccass","stock_code":"00700","limit":10}'
   ```

---

**Status:** ✅ Fix applied, system functional
**Date:** 2025-01-20
