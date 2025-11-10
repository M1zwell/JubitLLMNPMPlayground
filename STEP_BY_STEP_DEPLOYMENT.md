# 🚀 Step-by-Step Dashboard Deployment Guide

**Time Required:** 5-10 minutes
**Difficulty:** Easy (just copy-paste)

---

## 🎯 Overview

You'll deploy 5 Edge Functions by copy-pasting code from local files into the Supabase Dashboard.

**Dashboard URL:** https://supabase.com/dashboard/project/kiztaihzanqnrcrqaxsv/functions

---

## 📋 Function 1: scrape-url

### Step 1.1: Open the Dashboard

1. Click this link: https://supabase.com/dashboard/project/kiztaihzanqnrcrqaxsv/functions
2. You should see the "Edge Functions" page
3. Click the green **"New Function"** button (top-right)

### Step 1.2: Create Function

1. In the "Function name" field, enter: `scrape-url`
2. Leave other settings as default
3. Click **"Create function"** or **"Continue"**

### Step 1.3: Copy Local Code

1. On your computer, open this file:
   ```
   C:\Users\user\JubitLLMNPMPlayground\supabase\functions\scrape-url\index.ts
   ```

2. Select **ALL** the code in the file (Ctrl+A)
3. Copy it (Ctrl+C)

### Step 1.4: Paste into Dashboard

1. In the Dashboard editor, delete any placeholder code
2. Paste your copied code (Ctrl+V)
3. Verify the code looks correct (should start with `/**` comment)

### Step 1.5: Deploy

1. Click the **"Deploy function"** button (usually bottom-right)
2. Wait 10-30 seconds for deployment to complete
3. You should see a success message ✅

### Step 1.6: Verify

1. In the function list, you should now see `scrape-url` with a green "Deployed" status
2. Click on the function name to see details

---

## 📋 Function 2: scrape-custom

### Repeat the Process

1. **Go back** to the Edge Functions page
2. Click **"New Function"** button
3. Function name: `scrape-custom`
4. Click **"Create function"**

5. **Open local file:**
   ```
   C:\Users\user\JubitLLMNPMPlayground\supabase\functions\scrape-custom\index.ts
   ```

6. **Select all** (Ctrl+A), **Copy** (Ctrl+C)
7. **Paste** into Dashboard editor (Ctrl+V)
8. Click **"Deploy function"**
9. Wait for success message ✅

---

## 📋 Function 3: llm-update

### Repeat the Process

1. **Go back** to Edge Functions page
2. Click **"New Function"**
3. Function name: `llm-update`
4. Click **"Create function"**

5. **Open local file:**
   ```
   C:\Users\user\JubitLLMNPMPlayground\supabase\functions\llm-update\index.ts
   ```

6. **Select all** (Ctrl+A), **Copy** (Ctrl+C)
7. **Paste** into Dashboard (Ctrl+V)
8. Click **"Deploy function"**
9. Wait for success ✅

---

## 📋 Function 4: npm-import

### Repeat the Process

1. **Go back** to Edge Functions page
2. Click **"New Function"**
3. Function name: `npm-import`
4. Click **"Create function"**

5. **Open local file:**
   ```
   C:\Users\user\JubitLLMNPMPlayground\supabase\functions\npm-import\index.ts
   ```

6. **Select all** (Ctrl+A), **Copy** (Ctrl+C)
7. **Paste** into Dashboard (Ctrl+V)
8. Click **"Deploy function"**
9. Wait for success ✅

---

## 📋 Function 5: hk-scraper

### Repeat the Process

1. **Go back** to Edge Functions page
2. Click **"New Function"**
3. Function name: `hk-scraper`
4. Click **"Create function"**

5. **Open local file:**
   ```
   C:\Users\user\JubitLLMNPMPlayground\supabase\functions\hk-scraper\index.ts
   ```

6. **Select all** (Ctrl+A), **Copy** (Ctrl+C)
7. **Paste** into Dashboard (Ctrl+V)
8. Click **"Deploy function"**
9. Wait for success ✅

---

## ✅ Verification Checklist

After deploying all 5 functions, verify:

### In Supabase Dashboard

Go to: https://supabase.com/dashboard/project/kiztaihzanqnrcrqaxsv/functions

You should see **5 functions** listed:
- ✅ scrape-url (Deployed)
- ✅ scrape-custom (Deployed)
- ✅ llm-update (Deployed)
- ✅ npm-import (Deployed)
- ✅ hk-scraper (Deployed)

### Test Each Function

Open PowerShell or Command Prompt and run these tests:

#### Test 1: scrape-url
```powershell
curl -X POST https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/scrape-url `
  -H "Content-Type: application/json" `
  -d '{\"url\":\"https://example.com\"}'
```

**Expected:** Should return JSON with content

---

#### Test 2: scrape-custom
```powershell
curl -X POST https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/scrape-custom `
  -H "Content-Type: application/json" `
  -d '{\"type\":\"seo\",\"url\":\"https://example.com\"}'
```

**Expected:** Should return JSON with SEO data

---

#### Test 3: llm-update
```powershell
curl -X POST https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/llm-update `
  -H "Content-Type: application/json" `
  -d '{\"update_type\":\"manual\"}'
```

**Expected:** Should return count of updated models

---

#### Test 4: npm-import
```powershell
curl -X POST https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/npm-import `
  -H "Content-Type: application/json" `
  -d '{\"searchQuery\":\"react\",\"limit\":5}'
```

**Expected:** Should return imported package count

---

#### Test 5: hk-scraper
```powershell
curl -X POST https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/hk-scraper `
  -H "Content-Type: application/json" `
  -d '{\"source\":\"hksfc\",\"category\":\"news\"}'
```

**Expected:** Should return scraped financial data

---

## 🐛 Troubleshooting

### Issue: Can't find "New Function" button

**Solution:** Make sure you're on the Edge Functions page:
https://supabase.com/dashboard/project/kiztaihzanqnrcrqaxsv/functions

The button should be in the top-right corner.

---

### Issue: Deployment fails with error

**Common errors and solutions:**

1. **"Import not found"**
   - Make sure you copied the ENTIRE file
   - Check that the import path for `cors.ts` is correct

2. **"Syntax error"**
   - Verify you pasted the complete code
   - Check there are no extra characters at start/end

3. **"Function already exists"**
   - If the function name exists, you can:
     - Delete the old one first, OR
     - Click on it and select "Deploy new version"

---

### Issue: Test returns error

**Solutions:**

1. **Check function logs:**
   - Go to Dashboard → Edge Functions
   - Click on the function name
   - Click "Logs" tab
   - Look for error messages

2. **Verify FIRECRAWL_API_KEY:**
   - Go to Dashboard → Settings → Edge Functions
   - Verify secret exists: `FIRECRAWL_API_KEY`

3. **Try simpler test:**
   ```powershell
   curl https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/scrape-url
   ```
   Should return "Method not allowed" or similar (means function is deployed)

---

## 📊 After Deployment

### View Function Invocations

1. Go to: https://supabase.com/dashboard/project/kiztaihzanqnrcrqaxsv/functions
2. Click on any function
3. Click "Invocations" tab
4. See real-time metrics

### View Logs

1. Click on any function
2. Click "Logs" tab
3. See execution logs and errors

### Test in Your App

Your local app (http://localhost:8080) is already configured to use production endpoints. The Web Scraper Demo should now work!

---

## 🎉 Success Criteria

✅ You're done when:
1. All 5 functions show "Deployed" status in Dashboard
2. At least 1 test curl command returns data (not error)
3. Function logs show successful executions

---

## 📝 Quick Reference

| Function | Local File Path | Dashboard Name |
|----------|----------------|----------------|
| Universal Scraper | `supabase/functions/scrape-url/index.ts` | `scrape-url` |
| Custom Scraper | `supabase/functions/scrape-custom/index.ts` | `scrape-custom` |
| LLM Update | `supabase/functions/llm-update/index.ts` | `llm-update` |
| NPM Import | `supabase/functions/npm-import/index.ts` | `npm-import` |
| HK Scraper | `supabase/functions/hk-scraper/index.ts` | `hk-scraper` |

---

## 🔗 Important Links

- **Dashboard:** https://supabase.com/dashboard/project/kiztaihzanqnrcrqaxsv/functions
- **API Base URL:** https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1
- **Local App:** http://localhost:8080

---

## ⏱️ Estimated Time

- Function 1 (first time): ~2 minutes
- Functions 2-5 (once you get the hang): ~1 minute each
- Testing: ~2 minutes
- **Total: ~8 minutes**

---

## 🎯 Ready?

1. Open Dashboard: https://supabase.com/dashboard/project/kiztaihzanqnrcrqaxsv/functions
2. Click "New Function"
3. Follow steps above for each function
4. Test when done
5. Celebrate! 🎉

**Let me know when you've deployed them and I'll help with testing!**
