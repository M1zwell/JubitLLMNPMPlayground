# Deployment Guide for Advanced Scrapers

## Prerequisites Checklist

Before deploying, ensure you have:

- [x] Supabase CLI installed (v2.54.11 ✓)
- [ ] Supabase CLI logged in
- [ ] Project linked to Supabase
- [x] Edge Functions code ready
- [x] FIRECRAWL_API_KEY environment variable

## Deployment Options

### Option 1: Supabase CLI (Recommended)

#### Step 1: Login to Supabase CLI
```bash
supabase login
```

#### Step 2: Link Project
```bash
# Link to production project
supabase link --project-ref kiztaihzanqnrcrqaxsv
```

#### Step 3: Set Environment Variables
```bash
# Set Firecrawl API key as secret
supabase secrets set FIRECRAWL_API_KEY=fc-7f04517bc6ef43d68c06316d5f69b91e
```

#### Step 4: Deploy Edge Functions
```bash
# Deploy all functions
supabase functions deploy

# Or deploy specific function
supabase functions deploy unified-scraper
```

---

### Option 2: Supabase Dashboard (Manual)

#### Step 1: Open Supabase Dashboard
1. Go to: https://supabase.com/dashboard/project/kiztaihzanqnrcrqaxsv
2. Navigate to: **Edge Functions** section

#### Step 2: Create/Update Function
1. Click "Create a new function" or select `unified-scraper`
2. Upload files:
   - `supabase/functions/unified-scraper/index.ts`
   - `supabase/functions/_shared/scrapers/hksfc-adapter-v2.ts`
   - `supabase/functions/_shared/scrapers/hkex-ccass-adapter-v2.ts`
   - All other `_shared` dependencies

#### Step 3: Set Environment Variables
1. Go to: **Project Settings** > **Edge Functions**
2. Add secret: `FIRECRAWL_API_KEY` = `fc-7f04517bc6ef43d68c06316d5f69b91e`
3. Ensure `SUPABASE_SERVICE_ROLE_KEY` is set

#### Step 4: Deploy
1. Click "Deploy" button
2. Wait for deployment to complete
3. Note the function URL

---

### Option 3: GitHub Actions (CI/CD)

If you have GitHub integration, deployment happens automatically on push to main.

**Check**: `.github/workflows/deploy-supabase.yml`

---

## Verification Steps

### 1. Check Function Status
```bash
supabase functions list
```

Expected output:
```
┌─────────────────┬─────────┬─────────────────────┐
│ NAME            │ STATUS  │ UPDATED             │
├─────────────────┼─────────┼─────────────────────┤
│ unified-scraper │ ACTIVE  │ 2025-11-12 ...      │
└─────────────────┴─────────┴─────────────────────┘
```

### 2. Test HKSFC Scraper (V2)
```bash
curl -X POST https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/unified-scraper \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8" \
  -d '{
    "source": "hksfc",
    "limit": 10,
    "test_mode": false,
    "use_v2": true
  }'
```

Expected response:
```json
{
  "success": true,
  "source": "hksfc",
  "records_inserted": 8,
  "records_updated": 2,
  "records_failed": 0,
  "duration_ms": 3500
}
```

### 3. Test CCASS Scraper (V2)
```bash
curl -X POST https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/unified-scraper \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8" \
  -d '{
    "source": "ccass",
    "stock_code": "00700",
    "limit": 50,
    "test_mode": false,
    "use_v2": true
  }'
```

### 4. Check Logs
```bash
supabase functions logs unified-scraper --follow
```

Look for:
- `[HKSFC Adapter V2] Using Firecrawl V2`
- `[CCASS Adapter V2] Using Firecrawl V2`
- `[Unified Scraper] Scraped N records`

### 5. Verify Database
```sql
-- Check scrape_logs table
SELECT
  source,
  scraper_engine,
  records_inserted,
  records_updated,
  duration_ms,
  started_at
FROM scrape_logs
ORDER BY started_at DESC
LIMIT 5;

-- Should see:
-- scraper_engine: 'firecrawl-v2-map-json' or 'firecrawl-v2-actions-json'
```

---

## Troubleshooting

### Issue: "Access token not provided"
**Solution**: Run `supabase login` first

### Issue: "Project not linked"
**Solution**: Run `supabase link --project-ref kiztaihzanqnrcrqaxsv`

### Issue: "Environment variable not found: FIRECRAWL_API_KEY"
**Solution**:
```bash
supabase secrets set FIRECRAWL_API_KEY=fc-7f04517bc6ef43d68c06316d5f69b91e
```

### Issue: "Deployment failed: missing dependencies"
**Solution**: Ensure all `_shared` files are included:
```bash
supabase functions deploy unified-scraper --no-verify-jwt
```

### Issue: "V2 always falls back to V1"
**Solution**: Check Edge Function logs to see error message. Common causes:
- FIRECRAWL_API_KEY not set
- API quota exceeded
- Network timeout

---

## Rollback Plan

If V2 deployment has issues:

### Quick Rollback (Disable V2)
Edit `supabase/functions/unified-scraper/index.ts` line 84:
```typescript
const { use_v2 = false }: ScraperRequest = await req.json();
//                 ^^^^^ Change true to false
```

Then redeploy:
```bash
supabase functions deploy unified-scraper
```

### Full Rollback (Use V1 Only)
Remove V2 imports from `unified-scraper/index.ts`:
```typescript
// Remove these lines:
import { scrapeHKSFC as scrapeHKSFCV2 } from '../_shared/scrapers/hksfc-adapter-v2.ts';
import { scrapeCCASS as scrapeCCASSV2 } from '../_shared/scrapers/hkex-ccass-adapter-v2.ts';
```

---

## Post-Deployment Checklist

- [ ] Edge Functions deployed successfully
- [ ] Environment variables set
- [ ] HKSFC scraper tested (V2)
- [ ] CCASS scraper tested (V2)
- [ ] Database writes verified
- [ ] Logs show V2 engine usage
- [ ] Frontend tested on production
- [ ] No errors in Supabase dashboard
- [ ] Performance metrics recorded

---

## Next Steps

After successful deployment:

1. **Monitor Performance**
   - Check scrape_logs table daily
   - Compare V2 vs V1 duration
   - Track fallback rate

2. **Update Frontend**
   - Deploy to Netlify if needed
   - Test scraping from UI
   - Verify results display correctly

3. **Optimize**
   - Adjust `limit` parameters
   - Fine-tune `includeTags`/`excludeTags`
   - Add more sources if needed

---

## Deployment Commands (Quick Reference)

```bash
# Login
supabase login

# Link project
supabase link --project-ref kiztaihzanqnrcrqaxsv

# Set secrets
supabase secrets set FIRECRAWL_API_KEY=fc-7f04517bc6ef43d68c06316d5f69b91e

# Deploy
supabase functions deploy unified-scraper

# Test
curl -X POST https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/unified-scraper \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer ANON_KEY" \
  -d '{"source": "hksfc", "limit": 10, "use_v2": true}'

# View logs
supabase functions logs unified-scraper

# Check status
supabase functions list
```

---

**Created**: 2025-11-12
**Status**: READY TO DEPLOY
