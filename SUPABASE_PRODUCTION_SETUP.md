# Supabase Production Setup Guide

## Step-by-Step Instructions

### Option 1: Browser Authentication (Recommended)

Run these commands in your terminal (not through Claude):

```bash
# 1. Login to Supabase (opens browser)
supabase login

# 2. Link to production project
supabase link --project-ref kiztaihzanqnrcrqaxsv

# 3. Verify link
supabase status
```

### Option 2: Access Token (Alternative)

1. Get your access token:
   - Go to: https://supabase.com/dashboard/account/tokens
   - Click "Generate new token"
   - Copy the token

2. Set the token:
   ```bash
   # Windows (PowerShell)
   $env:SUPABASE_ACCESS_TOKEN="your-token-here"

   # Windows (CMD)
   set SUPABASE_ACCESS_TOKEN=your-token-here

   # Linux/Mac
   export SUPABASE_ACCESS_TOKEN="your-token-here"
   ```

3. Link to project:
   ```bash
   supabase link --project-ref kiztaihzanqnrcrqaxsv
   ```

## After Authentication

Once authenticated, run:

```bash
# Set production secrets
supabase secrets set FIRECRAWL_API_KEY="fc-7f04517bc6ef43d68c06316d5f69b91e"

# Deploy Edge Functions
supabase functions deploy scrape-url
supabase functions deploy scrape-custom
supabase functions deploy llm-update
supabase functions deploy npm-import
supabase functions deploy hk-scraper

# Verify deployment
supabase functions list
```

## Automated Script

Or use the automated deployment script:

```bash
npm run deploy:functions
```

---

**Project Details:**
- Project Ref: `kiztaihzanqnrcrqaxsv`
- URL: `https://kiztaihzanqnrcrqaxsv.supabase.co`
- Region: Automatically detected
