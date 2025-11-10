# 🚀 Deploy Scraping Infrastructure - Manual Steps

**Time Required**: 10-15 minutes
**Prerequisites**: Access to Supabase Studio (https://supabase.com/dashboard)

---

## Step 1: Deploy Database Migration (5 minutes)

### Open Supabase Studio

1. Go to: https://supabase.com/dashboard/project/kiztaihzanqnrcrqaxsv
2. Click **SQL Editor** in the left sidebar
3. Click **New Query**

### Run Migration SQL

Copy the ENTIRE contents of this file:
```
supabase/migrations/20251110000001_create_scraped_data_tables.sql
```

Paste into the SQL Editor and click **RUN**.

**Expected Output**:
```
Success. No rows returned
```

### Verify Tables Created

Run this query in SQL Editor:
```sql
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN (
    'hksfc_filings',
    'hkex_announcements',
    'legal_cases',
    'npm_packages_scraped',
    'llm_configs',
    'scrape_logs'
  )
ORDER BY table_name;
```

**Expected**: 6 rows returned (all table names)

---

## Step 2: Deploy Edge Function (3 minutes)

### Option A: Deploy via Supabase CLI (if you have access token)

```bash
# Set access token (get from: https://supabase.com/dashboard/account/tokens)
export SUPABASE_ACCESS_TOKEN=your_token_here

# Link project
npx supabase link --project-ref kiztaihzanqnrcrqaxsv

# Deploy function
npx supabase functions deploy unified-scraper
```

### Option B: Deploy via Supabase Studio (Manual)

**Note**: Edge Functions must be deployed via CLI or Git integration. Studio doesn't support direct upload.

**Recommended**: Get an access token and use Option A.

**To get access token**:
1. Go to: https://supabase.com/dashboard/account/tokens
2. Click "Generate new token"
3. Copy token
4. Run commands above with token

---

## Step 3: Test Database Setup (2 minutes)

### Test 1: Insert Mock Data

Run in SQL Editor:
```sql
-- Insert test HKSFC filing
INSERT INTO hksfc_filings (
  title,
  content,
  filing_type,
  filing_date,
  url,
  content_hash
) VALUES (
  'Test HKSFC Filing',
  'This is test content',
  'news',
  CURRENT_DATE,
  'https://www.sfc.hk/test-1',
  encode(sha256('Test HKSFC Filing||This is test content||https://www.sfc.hk/test-1'), 'hex')
);

-- Verify insert
SELECT * FROM hksfc_filings ORDER BY scraped_at DESC LIMIT 1;
```

**Expected**: 1 row with your test data

### Test 2: Test Deduplication

Run same INSERT again:
```sql
INSERT INTO hksfc_filings (
  title,
  content,
  filing_type,
  filing_date,
  url,
  content_hash
) VALUES (
  'Test HKSFC Filing',
  'This is test content',
  'news',
  CURRENT_DATE,
  'https://www.sfc.hk/test-1',
  encode(sha256('Test HKSFC Filing||This is test content||https://www.sfc.hk/test-1'), 'hex')
);
```

**Expected Error**:
```
duplicate key value violates unique constraint "hksfc_filings_content_hash_key"
```

✅ This confirms deduplication is working!

### Test 3: Test Full-Text Search

```sql
-- Search test
SELECT * FROM hksfc_filings
WHERE search_vector @@ plainto_tsquery('Test HKSFC');
```

**Expected**: 1 row returned (your test record)

### Test 4: Test Cross-Source View

```sql
-- Insert test records in multiple tables
INSERT INTO npm_packages_scraped (package_name, npm_url, content_hash, description)
VALUES ('test-package', 'https://npmjs.com/test', encode(sha256('test'), 'hex'), 'Test package');

-- Query unified view
SELECT source, title, url, scraped_at
FROM all_scraped_data
ORDER BY scraped_at DESC
LIMIT 10;
```

**Expected**: 2 rows (HKSFC filing + NPM package)

---

## Step 4: Test Edge Function (5 minutes)

### Get Your Anon Key

1. Go to: https://supabase.com/dashboard/project/kiztaihzanqnrcrqaxsv/settings/api
2. Copy **Project URL**: `https://kiztaihzanqnrcrqaxsv.supabase.co`
3. Copy **anon public key**

### Test Function (After Deployment)

```bash
# Test HKSFC scraper (mock data)
curl -X POST https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/unified-scraper \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY_HERE" \
  -d '{"source": "hksfc", "limit": 10, "test_mode": true}'
```

**Expected Response**:
```json
{
  "success": true,
  "source": "hksfc",
  "records_inserted": 10,
  "records_updated": 0,
  "records_failed": 0,
  "duration_ms": 234
}
```

### Verify Data Inserted

```sql
SELECT COUNT(*) FROM hksfc_filings;
-- Expected: 11 (1 test + 10 from scraper)

SELECT * FROM scrape_logs ORDER BY started_at DESC LIMIT 1;
-- Expected: 1 log entry with status = 'success'
```

---

## Step 5: Test NPM Real Data (2 minutes)

```bash
# Test NPM scraper (REAL NPM Registry API)
curl -X POST https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/unified-scraper \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY_HERE" \
  -d '{"source": "npm", "limit": 5, "test_mode": false}'
```

**Expected**: Real package data from NPM (react, vue, express, typescript, vite)

```sql
SELECT package_name, package_version, downloads_weekly
FROM npm_packages_scraped
ORDER BY scraped_at DESC
LIMIT 5;
```

---

## ✅ Deployment Checklist

- [ ] Step 1: Database migration applied
- [ ] Step 2: Edge Function deployed
- [ ] Step 3: Database tests passed (deduplication, FTS, view)
- [ ] Step 4: Edge Function responds correctly
- [ ] Step 5: NPM real data fetched

**If all checked**: ✅ **Deployment successful!**

---

## 🐛 Troubleshooting

### Migration fails with "permission denied"

**Solution**: Make sure you're running in SQL Editor as authenticated user (not anon)

### Edge Function 404

**Solution**: Function may not be deployed. Use CLI with access token (Option A above)

### Edge Function timeout

**Solution**: Test mode uses mock data (fast). Real scraping takes longer but should complete under 30s.

---

## 📊 Next: Monitor Your Scrapers

Once deployed, monitor scraping activity:

```sql
-- View all scrape logs
SELECT
  source,
  status,
  records_inserted,
  records_updated,
  duration_ms,
  started_at
FROM scrape_logs
ORDER BY started_at DESC
LIMIT 20;

-- Success rate by source
SELECT
  source,
  COUNT(*) as total_runs,
  COUNT(*) FILTER (WHERE status = 'success') as successes,
  ROUND(100.0 * COUNT(*) FILTER (WHERE status = 'success') / COUNT(*), 2) as success_rate
FROM scrape_logs
GROUP BY source;
```

---

**Ready for Part 2**: Once deployment is complete, we'll implement real scraping for HKSFC and HKEX!
