# Supabase Dashboard Deployment Guide

Quick reference for deploying Edge Functions via Supabase Dashboard UI (no Docker required).

---

## 🚀 Quick Start

**Dashboard URL:** https://supabase.com/dashboard/project/kiztaihzanqnrcrqaxsv/functions

**Time Required:** 5-10 minutes

---

## 📋 Function Deployment Checklist

### Function 1: scrape-url ⭐ (Priority)
Universal web scraping with Firecrawl

**File to copy:** `supabase/functions/scrape-url/index.ts`

**Steps:**
1. Go to Dashboard → Edge Functions
2. Click "New Function" or "Deploy new function"
3. Function Name: `scrape-url`
4. Copy entire contents of `supabase/functions/scrape-url/index.ts`
5. Paste into editor
6. Click "Deploy function"

**Test after deployment:**
```bash
curl -X POST https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/scrape-url \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com","options":{"format":"markdown"}}'
```

---

### Function 2: scrape-custom ⭐ (Priority)
Specialized scrapers (product, article, SEO, social)

**File to copy:** `supabase/functions/scrape-custom/index.ts`

**Steps:**
1. Click "New Function"
2. Function Name: `scrape-custom`
3. Copy entire contents of `supabase/functions/scrape-custom/index.ts`
4. Paste into editor
5. Click "Deploy function"

**Test after deployment:**
```bash
curl -X POST https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/scrape-custom \
  -H "Content-Type: application/json" \
  -d '{"type":"seo","url":"https://example.com"}'
```

---

### Function 3: llm-update
LLM model data updates from artificialanalysis.ai

**File to copy:** `supabase/functions/llm-update/index.ts`

**Steps:**
1. Click "New Function"
2. Function Name: `llm-update`
3. Copy entire contents of `supabase/functions/llm-update/index.ts`
4. Paste into editor
5. Click "Deploy function"

**Test after deployment:**
```bash
curl -X POST https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/llm-update \
  -H "Content-Type: application/json" \
  -d '{"update_type":"manual"}'
```

---

### Function 4: npm-import
NPM package import with GitHub stats

**File to copy:** `supabase/functions/npm-import/index.ts`

**Steps:**
1. Click "New Function"
2. Function Name: `npm-import`
3. Copy entire contents of `supabase/functions/npm-import/index.ts`
4. Paste into editor
5. Click "Deploy function"

**Test after deployment:**
```bash
curl -X POST https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/npm-import \
  -H "Content-Type: application/json" \
  -d '{"packageName":"react"}'
```

---

### Function 5: hk-scraper
Hong Kong financial data scraper

**File to copy:** `supabase/functions/hk-scraper/index.ts`

**Steps:**
1. Click "New Function"
2. Function Name: `hk-scraper`
3. Copy entire contents of `supabase/functions/hk-scraper/index.ts`
4. Paste into editor
5. Click "Deploy function"

**Test after deployment:**
```bash
curl -X POST https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/hk-scraper \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.hk"}'
```

---

## 🔑 Environment Variables

The FIRECRAWL_API_KEY is already set in your project secrets:
```
FIRECRAWL_API_KEY = fc-7f04517bc6ef43d68c06316d5f69b91e
```

No need to set it again for individual functions - it's automatically available to all Edge Functions.

---

## 📝 Important Notes

### Shared Dependencies
All functions use the shared CORS configuration from `supabase/functions/_shared/cors.ts`. The Dashboard bundler will automatically include this when deploying.

### Function Verification
After deploying each function:
1. Go to Dashboard → Edge Functions
2. Click on the function name
3. Check the "Deployments" tab for status
4. Check the "Logs" tab for any errors

### Common Issues

**Issue: "Import not found"**
- Solution: Make sure to copy the ENTIRE file contents, including all imports

**Issue: "Environment variable not set"**
- Solution: The FIRECRAWL_API_KEY is already set globally, but you can verify in Dashboard → Settings → Edge Functions → Secrets

**Issue: "CORS error"**
- Solution: The _shared/cors.ts is included automatically. If issues persist, check function logs.

---

## ✅ Verification Steps

After deploying all 5 functions:

1. **List all functions:**
   ```bash
   supabase functions list
   ```

2. **Test scrape-url:**
   ```bash
   curl -X POST https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/scrape-url \
     -H "Content-Type: application/json" \
     -d '{"url":"https://example.com"}'
   ```

3. **Test scrape-custom:**
   ```bash
   curl -X POST https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/scrape-custom \
     -H "Content-Type: application/json" \
     -d '{"type":"product","url":"https://example.com"}'
   ```

4. **Check function logs in Dashboard:**
   - Dashboard → Edge Functions → Select function → Logs

---

## 🎉 After Deployment

Once all functions are deployed:
1. Update frontend to use production endpoints (already configured)
2. Test from the Web Scraper Demo in the app
3. Monitor usage in Dashboard → Edge Functions → Invocations

---

## 🔄 Future Updates

To update a function after making code changes:
1. Go to Dashboard → Edge Functions
2. Click on the function name
3. Click "Deploy new version"
4. Paste updated code
5. Click "Deploy"

Or fix Docker and use CLI:
```bash
npm run supabase:setup:win
```

---

**Status:** Ready to deploy via Dashboard UI
**Time Estimate:** 5-10 minutes for all 5 functions
**Difficulty:** Easy (copy-paste operation)

🚀 **Start here:** https://supabase.com/dashboard/project/kiztaihzanqnrcrqaxsv/functions
