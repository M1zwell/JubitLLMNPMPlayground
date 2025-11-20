# Production Deployment Guide - HK Scraping System

**Date:** 2025-01-20
**Status:** Ready for deployment
**Prerequisites:** Supabase CLI, access token, Firecrawl API key

---

## 🚀 Quick Deployment (5 Steps)

### Step 1: Get Supabase Access Token

1. Go to https://supabase.com/dashboard/account/tokens
2. Click "Generate new token"
3. Name it: "HK Scraping Deployment"
4. Copy the token (starts with `sbp_...`)

### Step 2: Set Environment Variable

**Windows (PowerShell):**
```powershell
$env:SUPABASE_ACCESS_TOKEN = "sbp_your-token-here"
```

**Windows (CMD):**
```cmd
set SUPABASE_ACCESS_TOKEN=sbp_your-token-here
```

**Linux/Mac:**
```bash
export SUPABASE_ACCESS_TOKEN=sbp_your-token-here
```

### Step 3: Link to Project

```bash
supabase link --project-ref kiztaihzanqnrcrqaxsv
```

**Expected output:**
```
Linked to project kiztaihzanqnrcrqaxsv
```

### Step 4: Deploy Edge Functions

Deploy all 3 missing edge functions:

```bash
# Deploy HKSFC RSS Sync
supabase functions deploy hksfc-rss-sync

# Deploy SFC Statistics Sync
supabase functions deploy sfc-statistics-sync

# Deploy HKEX Disclosure Scraper
supabase functions deploy hkex-disclosure-scraper
```

**Expected output for each:**
```
Deploying function...
Deployed function hksfc-rss-sync (version xxx)
```

### Step 5: Configure Firecrawl API Key

```bash
supabase secrets set FIRECRAWL_API_KEY=fc-your-api-key-here
```

**Expected output:**
```
Setting secret FIRECRAWL_API_KEY...
Secret set successfully
```

---

## 📋 Detailed Step-by-Step

### Prerequisites Check

Before starting, verify you have:

- [x] Supabase CLI installed (`supabase --version`)
- [x] Supabase access token
- [x] Firecrawl API key (get one at https://firecrawl.dev)
- [x] All 3 migrations applied to database

### Step 1: Supabase Login

#### Option A: Environment Variable (Recommended for CI/CD)

```bash
export SUPABASE_ACCESS_TOKEN=sbp_your-token-here
supabase link --project-ref kiztaihzanqnrcrqaxsv
```

#### Option B: Interactive Login (Browser)

```bash
supabase login
# Browser will open, authorize the CLI
supabase link --project-ref kiztaihzanqnrcrqaxsv
```

#### Option C: Token Flag

```bash
supabase link --project-ref kiztaihzanqnrcrqaxsv --token sbp_your-token-here
```

### Step 2: Verify Link

```bash
supabase projects list
```

**Expected:** You should see your project `kiztaihzanqnrcrqaxsv` marked as linked

### Step 3: Deploy Edge Functions One by One

#### Deploy HKSFC RSS Sync

```bash
cd supabase/functions/hksfc-rss-sync
cat index.ts | head -20  # Verify function exists
cd ../../..
supabase functions deploy hksfc-rss-sync
```

**Verify deployment:**
```bash
curl -X POST https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/hksfc-rss-sync \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

#### Deploy SFC Statistics Sync

```bash
supabase functions deploy sfc-statistics-sync
```

**Verify deployment:**
```bash
curl -X POST https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/sfc-statistics-sync \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"tables": ["D3", "D4"]}'
```

#### Deploy HKEX Disclosure Scraper

```bash
supabase functions deploy hkex-disclosure-scraper
```

**Verify deployment:**
```bash
curl -X POST https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/hkex-disclosure-scraper \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -H "Content-Type: application/json" \
  -d '{"stock_code": "00700", "start_date": "2024-01-01", "end_date": "2025-01-20"}'
```

### Step 4: Configure Secrets

#### Set Firecrawl API Key

```bash
supabase secrets set FIRECRAWL_API_KEY=fc-your-api-key-here
```

#### Verify secrets

```bash
supabase secrets list
```

**Expected output:**
```
FIRECRAWL_API_KEY (set)
```

### Step 5: Test End-to-End Flow

#### Test via Dashboard

1. Navigate to http://localhost:8084/hk-admin
2. Click "CCASS Holdings" button
3. Wait 5-10 seconds
4. Job status should change from "pending" → "running" → "completed"
5. Check `hkex_ccass_shareholdings` table for data

#### Test via RPC Function

```javascript
// Run in Supabase SQL Editor or via client
SELECT trigger_ccass_scrape('00700', 10);

-- Wait a few seconds, then check job status
SELECT * FROM scraping_jobs
ORDER BY created_at DESC
LIMIT 1;

-- Check if data was scraped
SELECT COUNT(*) FROM hkex_ccass_shareholdings
WHERE stock_code = '00700';
```

---

## 🔧 Troubleshooting

### Issue: "Cannot use automatic login flow inside non-TTY environments"

**Solution:** Set environment variable:
```bash
export SUPABASE_ACCESS_TOKEN=sbp_your-token-here
```

### Issue: "Project not linked"

**Solution:**
```bash
supabase link --project-ref kiztaihzanqnrcrqaxsv
```

### Issue: "Function deployment failed"

**Causes:**
1. Not linked to project
2. Missing dependencies in function
3. TypeScript errors

**Solution:**
```bash
# Check function syntax
cd supabase/functions/hksfc-rss-sync
deno check index.ts

# Deploy with verbose output
supabase functions deploy hksfc-rss-sync --debug
```

### Issue: "Edge function returns 500 error"

**Check Supabase logs:**
1. Go to https://supabase.com/dashboard/project/kiztaihzanqnrcrqaxsv/logs
2. Select "Functions" → Select function → View logs
3. Check for errors

**Common errors:**
- Missing FIRECRAWL_API_KEY secret
- Invalid Firecrawl API key
- Network timeout (increase timeout in function)

### Issue: "Job stays in 'pending' status"

**Causes:**
1. Edge function not deployed
2. Edge function crashed
3. Firecrawl API key not set

**Solution:**
1. Verify function deployed: `supabase functions list`
2. Check Supabase function logs
3. Verify secret set: `supabase secrets list`

---

## 📊 Verification Checklist

After deployment, verify:

### Edge Functions
- [ ] `hksfc-rss-sync` deployed
- [ ] `sfc-statistics-sync` deployed
- [ ] `hkex-disclosure-scraper` deployed
- [ ] `unified-scraper` already deployed (should be)

### Secrets
- [ ] `FIRECRAWL_API_KEY` set

### End-to-End Test
- [ ] Dashboard loads at /hk-admin
- [ ] Clicking trigger creates job
- [ ] Job status updates from pending → running → completed
- [ ] Data appears in respective tables

### Database Tables
- [ ] `scraping_jobs` has completed jobs
- [ ] `hkex_ccass_shareholdings` has data (if CCASS test run)
- [ ] `hksfc_filings` has data (if SFC RSS test run)
- [ ] `sfc_statistics_*` tables have data (if stats test run)

---

## 🎯 Success Metrics

| Metric | Target | How to Verify |
|--------|--------|---------------|
| Functions deployed | 4/4 | `supabase functions list` |
| Secrets configured | 1/1 | `supabase secrets list` |
| Jobs complete | >0 | `SELECT COUNT(*) FROM scraping_jobs WHERE status='completed'` |
| Data scraped | >0 | Check respective tables |

---

## 🔄 Optional: Set Up Automated Scheduling

### Option A: GitHub Actions (Recommended)

Create `.github/workflows/hk-scraping-schedule.yml`:

```yaml
name: HK Scraping Schedule

on:
  schedule:
    # Daily SFC RSS sync at 2 AM UTC (10 AM HKT)
    - cron: '0 2 * * *'
    # Weekly SFC stats sync Saturday 7 PM UTC (Sunday 3 AM HKT)
    - cron: '0 19 * * 6'
    # Weekly HKEX DI sync Saturday 8 PM UTC (Sunday 4 AM HKT)
    - cron: '0 20 * * 6'
  workflow_dispatch:  # Allow manual triggering

jobs:
  scrape-sfc-rss:
    runs-on: ubuntu-latest
    if: github.event.schedule == '0 2 * * *' || github.event_name == 'workflow_dispatch'
    steps:
      - name: Trigger SFC RSS Sync
        run: |
          curl -X POST ${{ secrets.SUPABASE_URL }}/functions/v1/hksfc-rss-sync \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{}'

  scrape-sfc-stats:
    runs-on: ubuntu-latest
    if: github.event.schedule == '0 19 * * 6' || github.event_name == 'workflow_dispatch'
    steps:
      - name: Trigger SFC Statistics Sync
        run: |
          curl -X POST ${{ secrets.SUPABASE_URL }}/functions/v1/sfc-statistics-sync \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
            -H "Content-Type: application/json" \
            -d '{"tables": ["A1","A2","A3","C4","C5","D3","D4"]}'

  scrape-hkex-di:
    runs-on: ubuntu-latest
    if: github.event.schedule == '0 20 * * 6' || github.event_name == 'workflow_dispatch'
    steps:
      - name: Trigger HKEX DI Scrape (Top Stocks)
        run: |
          for stock in 00700 00941 01024 09988 03690; do
            curl -X POST ${{ secrets.SUPABASE_URL }}/functions/v1/hkex-disclosure-scraper \
              -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}" \
              -H "Content-Type: application/json" \
              -d "{\"stock_code\": \"$stock\", \"start_date\": \"$(date -d '1 year ago' +%Y-%m-%d)\", \"end_date\": \"$(date +%Y-%m-%d)\"}"
            sleep 5  # Rate limiting
          done
```

**Setup:**
1. Go to GitHub repo → Settings → Secrets → Actions
2. Add secrets:
   - `SUPABASE_URL`: `https://kiztaihzanqnrcrqaxsv.supabase.co`
   - `SUPABASE_ANON_KEY`: Your anon key
3. Commit workflow file
4. Enable GitHub Actions in repo settings

### Option B: Vercel Cron

If deployed to Vercel, add to `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/sfc-rss",
      "schedule": "0 2 * * *"
    },
    {
      "path": "/api/cron/sfc-stats",
      "schedule": "0 19 * * 6"
    },
    {
      "path": "/api/cron/hkex-di",
      "schedule": "0 20 * * 6"
    }
  ]
}
```

Create API routes that call Supabase functions.

### Option C: pg_cron (Database-level)

See `tests/configure-pgcron.sql` for database configuration.

**Note:** Requires pg_net extension to be enabled by Supabase support.

---

## 📝 Post-Deployment

### Monitoring

1. **Set up Supabase alerts:**
   - Dashboard → Project Settings → API → Webhooks
   - Alert on function failures

2. **Monitor job failures:**
   ```sql
   SELECT * FROM scraping_jobs
   WHERE status = 'failed'
   ORDER BY created_at DESC
   LIMIT 10;
   ```

3. **Check data freshness:**
   ```sql
   SELECT
     source,
     MAX(created_at) as last_run,
     COUNT(*) as total_jobs
   FROM scraping_jobs
   WHERE status = 'completed'
   GROUP BY source;
   ```

### Maintenance

- **Weekly:** Review failed jobs
- **Monthly:** Check data quality
- **Quarterly:** Update Firecrawl API key if needed

---

## 🎉 Completion

Once all steps complete:

✅ All 4 edge functions deployed
✅ Firecrawl API key configured
✅ Jobs complete end-to-end
✅ Data being scraped successfully
✅ (Optional) Automated scheduling set up

**System is now fully production-ready!**

---

**Last Updated:** 2025-01-20
**Support:** Check Supabase Dashboard logs or raise GitHub issue
