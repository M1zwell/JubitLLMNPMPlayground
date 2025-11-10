# Production Deployment Guide

Complete guide for deploying JubitLLMNPMPlayground to production.

---

## Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Run deployment script
npm run deploy

# That's it! The script handles everything.
```

---

## Prerequisites

### Required Accounts
- ✅ Netlify account
- ✅ Supabase account
- ⚠️ Firecrawl account (for scraping)
- ⚠️ OAuth providers (optional)

### Required CLI Authentication
```bash
# Login to Netlify
netlify login

# Login to Supabase
supabase login
supabase link --project-ref kiztaihzanqnrcrqaxsv

# Login to GitHub (optional)
gh auth login
```

---

## Environment Setup

### 1. Configure Production Variables

Copy `.env.production` and update:

```bash
# Required
VITE_SUPABASE_URL=https://kiztaihzanqnrcrqaxsv.supabase.co
VITE_SUPABASE_ANON_KEY=<your-anon-key>
VITE_FIRECRAWL_API_KEY=<your-firecrawl-key>
```

### 2. Set Netlify Environment Variables

```bash
netlify env:set VITE_SUPABASE_URL "https://kiztaihzanqnrcrqaxsv.supabase.co"
netlify env:set VITE_SUPABASE_ANON_KEY "your-key"
netlify env:set VITE_FIRECRAWL_API_KEY "fc-your-key"
```

### 3. Set Supabase Secrets

```bash
supabase secrets set FIRECRAWL_API_KEY="fc-your-key"
```

---

## Deployment Options

### Option 1: Automated Script (Recommended)

```bash
npm run deploy
```

The script will:
1. Check CLI authentication
2. Run linter
3. Build project
4. Deploy Edge Functions
5. Deploy to Netlify
6. Run post-deployment checks

### Option 2: Manual Deployment

```bash
# Build
npm run build:prod

# Deploy frontend
npm run deploy:prod

# Deploy Edge Functions
npm run deploy:functions
```

### Option 3: Preview Deployment

```bash
npm run deploy:preview
```

---

## What Gets Deployed

### Frontend (Netlify)
- React SPA built with Vite
- Hosted at: https://chathogs.com
- Features:
  - LLM Market & Playground
  - NPM Marketplace & Playground
  - Web Scraper Demo
  - Multi-Model Chat
  - HK Financial Scraper

### Edge Functions (Supabase)
- `scrape-url` - Universal web scraping
- `scrape-custom` - Custom scrapers (product, article, SEO)
- `llm-update` - LLM model updates
- `npm-import` - NPM package imports
- `hk-scraper` - HK financial scraper

### API Endpoints
Base URL: `https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1`

```bash
# Scrape any URL
POST /scrape-url
{
  "url": "https://example.com",
  "options": { "format": "markdown" }
}

# Custom scrapers
POST /scrape-custom
{
  "type": "product|article|seo",
  "url": "https://example.com"
}
```

---

## Post-Deployment

### Verify Deployment

```bash
# Check frontend
curl -I https://chathogs.com

# Test scraping
curl -X POST https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/scrape-url \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

### Monitor

```bash
# Netlify logs
netlify logs

# Edge Function logs
supabase functions logs scrape-url
```

---

## Troubleshooting

### Build Fails
```bash
rm -rf node_modules package-lock.json
npm install
npm run build:prod
```

### Environment Variables Missing
```bash
netlify env:list
supabase secrets list
```

### CORS Errors
Check `supabase/functions/_shared/cors.ts`

---

## Rollback

```bash
# Frontend
netlify deploy:restore <deploy-id>

# Edge Functions
git checkout <previous-commit>
npm run deploy:functions
```

---

## Resources

- [Netlify Docs](https://docs.netlify.com)
- [Supabase Docs](https://supabase.com/docs)
- [Project Documentation](./SCRAPING_SETUP.md)

---

**Status:** Production Ready ✅
**Last Updated:** 2025-11-10
