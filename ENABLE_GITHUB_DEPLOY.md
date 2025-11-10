# Enable GitHub Auto-Deployment for Edge Functions

## Current Status
✅ Database migration deployed successfully
✅ Edge Function code pushed to GitHub (commit 2d335d7)
❌ Docker Desktop not starting (blocking CLI deployment)

## Solution: GitHub Integration

### Step 1: Enable GitHub Integration (5 minutes)

1. **Open Supabase Integrations**:
   - Go to: https://supabase.com/dashboard/project/kiztaihzanqnrcrqaxsv/settings/integrations

2. **Connect to GitHub**:
   - Click "GitHub" under "CI/CD"
   - Click "Install" or "Connect"
   - Authorize Supabase to access your GitHub account
   - Select the repository: **M1zwell/JubitLLMNPMPlayground**

3. **Configure Deployment**:
   - Branch: **main**
   - Enable: **Auto-deploy Edge Functions**
   - Enable: **Auto-apply Database Migrations**

4. **Save Configuration**

### Step 2: Trigger Deployment

The Edge Functions should deploy automatically since the code is already on GitHub. If not:

1. **Manual trigger via GitHub commit**:
   ```bash
   # Make a small change to trigger deployment
   echo "# Trigger deployment" >> supabase/functions/unified-scraper/README.md
   git add supabase/functions/unified-scraper/README.md
   git commit -m "chore: Trigger Edge Function deployment"
   git push origin main
   ```

2. **Check deployment status**:
   - Go to: https://supabase.com/dashboard/project/kiztaihzanqnrcrqaxsv/functions
   - You should see "unified-scraper" function listed
   - Status should show "Deployed" (green)

### Step 3: Verify Deployment

Check function logs:
```bash
export SUPABASE_ACCESS_TOKEN="sbp_7a8f5797f175740a6fd4592d49c2a2e6be651191"
npx supabase functions list
```

Expected output:
```
Function Name      | Deployed | Version | Created At
-------------------|----------|---------|--------------------
unified-scraper    | yes      | 1       | 2025-11-10 ...
```

### Step 4: Set Environment Variables

Once deployed, set the Firecrawl API key:

```bash
export SUPABASE_ACCESS_TOKEN="sbp_7a8f5797f175740a6fd4592d49c2a2e6be651191"

# Set Firecrawl API key for real web scraping
npx supabase secrets set FIRECRAWL_API_KEY=your_api_key_here

# Verify secrets
npx supabase secrets list
```

### Step 5: Test the Scraper

Get your anon key:
- Go to: https://supabase.com/dashboard/project/kiztaihzanqnrcrqaxsv/settings/api
- Copy **anon public** key

Test with mock data:
```bash
curl -X POST https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/unified-scraper \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"source": "hksfc", "limit": 10, "test_mode": true}'
```

Expected response:
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

Test with real data (requires Firecrawl API key):
```bash
curl -X POST https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/unified-scraper \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ANON_KEY" \
  -d '{"source": "hksfc", "limit": 10, "test_mode": false}'
```

## Alternative: Fix Docker Desktop

If you prefer CLI deployment instead of GitHub integration:

### Windows

1. **Completely stop Docker**:
   ```powershell
   taskkill /IM "Docker Desktop.exe" /F
   Get-Process "*docker*" | Stop-Process -Force
   ```

2. **Clear Docker data** (optional, will reset Docker):
   ```powershell
   Remove-Item -Recurse -Force "$env:APPDATA\Docker"
   ```

3. **Restart Docker**:
   ```powershell
   Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"
   Start-Sleep -Seconds 90  # Wait for startup
   ```

4. **Verify**:
   ```powershell
   docker ps
   ```

5. **Deploy Edge Function**:
   ```bash
   export SUPABASE_ACCESS_TOKEN="sbp_7a8f5797f175740a6fd4592d49c2a2e6be651191"
   npx supabase functions deploy unified-scraper
   ```

## What's Deployed

Once GitHub integration is enabled, these files will automatically deploy:

### Edge Function: unified-scraper
- **Entry point**: `supabase/functions/unified-scraper/index.ts`
- **Adapters**:
  - `_shared/scrapers/hksfc-adapter.ts` - Hong Kong SFC scraper
  - `_shared/scrapers/hkex-adapter.ts` - Hong Kong Stock Exchange scraper
  - `_shared/scrapers/legal-adapter.ts` - Legal cases scraper
  - `_shared/scrapers/npm-adapter.ts` - NPM packages scraper
  - `_shared/scrapers/llm-adapter.ts` - LLM configs scraper
- **Utils**: `_shared/utils/http-client.ts` - Retry logic and rate limiting

### Database Tables
Already deployed via migration `20251110000001`:
- `hksfc_filings` - HKSFC news and enforcement actions
- `hkex_announcements` - HKEX announcements and CCASS data
- `legal_cases` - Court judgments and legal cases
- `npm_packages_scraped` - NPM package metadata
- `llm_configs` - LLM model specifications
- `scrape_logs` - Monitoring and error tracking
- `all_scraped_data` (view) - Unified cross-source queries

## Troubleshooting

### GitHub integration not working
- Check GitHub app permissions
- Verify repository access in GitHub Settings → Applications
- Re-authorize Supabase if needed

### Edge Function shows errors
- Check function logs in Supabase Dashboard
- Verify environment variables are set
- Test locally first if Docker works

### No data after scraping
- Check `scrape_logs` table for errors
- Verify Firecrawl API key is set correctly
- Test with `test_mode: true` first

## Next Steps

After GitHub deployment is complete:

1. ✅ Set Firecrawl API key
2. ✅ Test scraping with all 5 sources
3. ✅ Verify data insertion in database tables
4. ✅ Set up pg_cron for scheduled scraping (optional)
5. ✅ Monitor scrape_logs for errors

