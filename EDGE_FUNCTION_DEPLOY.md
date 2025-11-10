# Edge Function Deployment Guide

Since Docker Desktop is not starting, here are alternative deployment methods:

## Option 1: Fix Docker Desktop (Recommended)

1. **Fully restart Docker Desktop**:
   ```powershell
   # Stop Docker
   taskkill /IM "Docker Desktop.exe" /F

   # Wait 10 seconds
   Start-Sleep -Seconds 10

   # Start Docker
   Start-Process "C:\Program Files\Docker\Docker\Docker Desktop.exe"

   # Wait 60 seconds for startup
   Start-Sleep -Seconds 60
   ```

2. **Verify Docker is running**:
   ```bash
   docker ps
   ```

3. **Deploy Edge Function**:
   ```bash
   export SUPABASE_ACCESS_TOKEN="sbp_7a8f5797f175740a6fd4592d49c2a2e6be651191"
   npx supabase functions deploy unified-scraper
   ```

## Option 2: GitHub Integration Deployment

1. **Commit and push Edge Function code**:
   ```bash
   git add supabase/functions/
   git commit -m "feat: Add unified scraper Edge Function"
   git push origin main
   ```

2. **Enable GitHub integration in Supabase Studio**:
   - Go to: https://supabase.com/dashboard/project/kiztaihzanqnrcrqaxsv/settings/integrations
   - Click "Connect to GitHub"
   - Select repository: JubitLLMNPMPlayground
   - Enable automatic deployments

3. **Supabase will auto-deploy** Edge Functions on each push

## Option 3: Manual Deno Deployment

1. **Install Deno** (if not installed):
   ```powershell
   irm https://deno.land/install.ps1 | iex
   ```

2. **Add Deno to PATH** and restart terminal

3. **Deploy using Deno CLI**:
   ```bash
   cd supabase/functions/unified-scraper
   deno compile --allow-all index.ts
   # Upload via Supabase API (requires manual API call)
   ```

## Current Status

- ✅ Database migration deployed successfully
- ✅ All scraping tables created
- ❌ Edge Function deployment blocked by Docker issue
- ⏳ Awaiting Docker fix or alternative deployment method

## Next Steps After Deployment

Once Edge Function is deployed:

1. **Set Firecrawl API Key**:
   ```bash
   export SUPABASE_ACCESS_TOKEN="sbp_7a8f5797f175740a6fd4592d49c2a2e6be651191"
   npx supabase secrets set FIRECRAWL_API_KEY=your_key_here
   ```

2. **Test scraping**:
   ```bash
   curl -X POST https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/unified-scraper \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_ANON_KEY" \
     -d '{"source": "hksfc", "limit": 10, "test_mode": true}'
   ```

