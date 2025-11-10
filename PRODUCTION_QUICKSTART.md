# Production Quick Start Guide

Complete guide to deploy your JubitLLMNPMPlayground to production in 5 minutes.

---

## 🚀 Quick Deploy (3 Steps)

### Step 1: Authenticate Supabase CLI

**Run in your terminal** (requires browser):

```bash
# Login to Supabase
supabase login

# Link to production project
npm run supabase:link
```

### Step 2: Deploy Edge Functions

**Windows:**
```powershell
npm run supabase:setup:win
```

**Mac/Linux:**
```bash
npm run supabase:setup
```

This script will:
- ✅ Link to production project
- ✅ Set secrets (Firecrawl API key)
- ✅ Deploy all 5 Edge Functions
- ✅ Test deployment

### Step 3: Deploy Frontend (Optional)

```bash
# Set Netlify environment variables first
netlify env:set VITE_SUPABASE_URL "https://kiztaihzanqnrcrqaxsv.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8"
netlify env:set VITE_FIRECRAWL_API_KEY "fc-7f04517bc6ef43d68c06316d5f69b91e"

# Deploy to Netlify
npm run deploy:prod
```

---

## 📋 Manual Setup (Alternative)

If automated script doesn't work, follow these steps:

### 1. Authenticate & Link

```bash
# Login to Supabase (opens browser)
supabase login

# Link to production
supabase link --project-ref kiztaihzanqnrcrqaxsv

# Verify
supabase status
```

### 2. Set Secrets

```bash
# Set Firecrawl API key
supabase secrets set FIRECRAWL_API_KEY="fc-7f04517bc6ef43d68c06316d5f69b91e"

# Verify
supabase secrets list
```

### 3. Deploy Functions

```bash
# Deploy all functions
supabase functions deploy scrape-url
supabase functions deploy scrape-custom
supabase functions deploy llm-update
supabase functions deploy npm-import
supabase functions deploy hk-scraper

# List deployed
supabase functions list
```

### 4. Test Deployment

```bash
# Test scraping endpoint
curl -X POST https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/scrape-url \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","options":{"format":"text"}}'
```

---

## ✅ Verification Checklist

After deployment, verify:

- [ ] Supabase CLI authenticated
- [ ] Project linked (run `supabase status`)
- [ ] Secrets set (run `npm run supabase:secrets`)
- [ ] Functions deployed (run `supabase functions list`)
- [ ] Function test passes (curl command above)
- [ ] Frontend accessible (if deployed to Netlify)

---

## 🔧 Available Commands

### Supabase Commands

```bash
npm run supabase:login          # Login to Supabase
npm run supabase:link           # Link to production project
npm run supabase:setup          # Run automated setup (Mac/Linux)
npm run supabase:setup:win      # Run automated setup (Windows)
npm run supabase:secrets        # List secrets
npm run supabase:status         # Check project status
npm run supabase:functions:deploy  # Deploy all functions
```

### Deployment Commands

```bash
npm run deploy                  # Full deployment (automated)
npm run deploy:prod             # Deploy frontend to Netlify
npm run deploy:functions        # Deploy Edge Functions only
npm run deploy:preview          # Deploy preview to Netlify
```

### Testing Commands

```bash
npm run test:scraping          # Test scraping configuration
npm run dev                    # Start local dev server
```

---

## 🌐 Production URLs

After deployment, your services will be available at:

### API Endpoints

**Base URL:** `https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1`

- **scrape-url** - `/scrape-url` - Universal web scraping
- **scrape-custom** - `/scrape-custom` - Specialized scrapers
- **llm-update** - `/llm-update` - LLM model updates
- **npm-import** - `/npm-import` - NPM package imports
- **hk-scraper** - `/hk-scraper` - HK financial scraper

### Frontend

- **Production:** `https://chathogs.com`
- **Local:** `http://localhost:8080`

---

## 🧪 Testing Your Deployment

### Test Scraping Function

```bash
# Basic test
curl -X POST https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/scrape-url \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'

# With options
curl -X POST https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/scrape-url \
  -H "Content-Type: application/json" \
  -d '{
    "url":"https://example.com",
    "options":{
      "format":"markdown",
      "onlyMainContent":true
    }
  }'
```

### Test Custom Scraper

```bash
# Test product scraper
curl -X POST https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/scrape-custom \
  -H "Content-Type: application/json" \
  -d '{"type":"product","url":"https://example-store.com/product"}'

# Test SEO scraper
curl -X POST https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/scrape-custom \
  -H "Content-Type: application/json" \
  -d '{"type":"seo","url":"https://example.com"}'
```

---

## 📊 Monitor Your Deployment

### View Function Logs

```bash
# Real-time logs
supabase functions logs scrape-url --follow

# Recent logs
supabase functions logs scrape-url --limit 50
```

### Check Function Status

```bash
# List all functions
supabase functions list

# Get function details
supabase functions describe scrape-url
```

### View Secrets

```bash
npm run supabase:secrets
```

---

## 🔧 Troubleshooting

### Authentication Issues

```bash
# If "Access token not provided" error:
supabase login

# Or use access token:
# Get from: https://supabase.com/dashboard/account/tokens
export SUPABASE_ACCESS_TOKEN="your-token"
```

### Link Issues

```bash
# If "Project not found":
supabase link --project-ref kiztaihzanqnrcrqaxsv

# Verify project exists:
supabase projects list
```

### Deployment Issues

```bash
# If function deployment fails:
# 1. Check you're in project root
# 2. Verify function exists in supabase/functions/
# 3. Try deploying with --no-verify-jwt flag:
supabase functions deploy scrape-url --no-verify-jwt
```

### Secret Issues

```bash
# If secrets not working:
# 1. List current secrets
supabase secrets list

# 2. Unset old secret
supabase secrets unset FIRECRAWL_API_KEY

# 3. Set new secret
supabase secrets set FIRECRAWL_API_KEY="your-key"
```

---

## 🎯 What Gets Deployed

### Edge Functions (5)

1. **scrape-url** - Universal scraping with Firecrawl
   - Supports markdown, HTML, text formats
   - Auto-fallback to Puppeteer
   - CORS enabled

2. **scrape-custom** - Specialized scrapers
   - Product data extraction
   - News article scraping
   - SEO analysis
   - Social media metadata

3. **llm-update** - LLM model updates
   - Scrapes artificialanalysis.ai
   - Updates model database
   - Categorizes and ranks models

4. **npm-import** - NPM package imports
   - Searches NPM registry
   - Fetches package details
   - Retrieves GitHub stats

5. **hk-scraper** - HK financial scraper
   - Specialized financial data
   - Dual-engine scraping
   - Structured data output

### Secrets Set

- `FIRECRAWL_API_KEY` - For Firecrawl API access
- `SUPABASE_JWT_SECRET` - Auto-available (don't set manually)

---

## 💡 Pro Tips

1. **Use automated setup:** Run `npm run supabase:setup:win` (Windows) or `npm run supabase:setup` (Mac/Linux)

2. **Test locally first:** Use `npm run dev` and test at http://localhost:8080

3. **Check logs:** Always check function logs after deployment with `supabase functions logs <name>`

4. **Monitor usage:** Keep an eye on Firecrawl usage (500 free/month)

5. **Update secrets:** If you change API keys, run the setup script again

---

## 📚 Additional Resources

- [Supabase Configuration](./SUPABASE_CONFIGURATION.md)
- [Deployment Guide](./DEPLOYMENT_GUIDE.md)
- [Scraping Setup](./SCRAPING_SETUP.md)
- [Implementation Complete](./IMPLEMENTATION_COMPLETE.md)

---

**Status:** Ready to deploy
**Estimated Time:** 5 minutes
**Difficulty:** Easy (automated scripts provided)

🚀 **Ready? Run:** `npm run supabase:setup:win` (or `supabase:setup` on Mac/Linux)
