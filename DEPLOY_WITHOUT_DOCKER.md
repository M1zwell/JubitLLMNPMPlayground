# Deploy Supabase Edge Functions Without Docker

If Docker Desktop won't start, you can deploy Edge Functions directly via Supabase Dashboard.

---

## 🌐 Method 1: Supabase Dashboard UI (No Docker Required)

### Step 1: Open Supabase Dashboard

1. Go to: https://supabase.com/dashboard/project/kiztaihzanqnrcrqaxsv
2. Navigate to **Edge Functions** in the left sidebar
3. Click **"New Function"**

### Step 2: Deploy scrape-url Function

1. **Function Name:** `scrape-url`
2. **Click:** "Create function"
3. **Copy code from:** `supabase/functions/scrape-url/index.ts`
4. **Paste** into the editor
5. **Click:** "Deploy function"

### Step 3: Deploy scrape-custom Function

1. **Function Name:** `scrape-custom`
2. **Click:** "Create function"
3. **Copy code from:** `supabase/functions/scrape-custom/index.ts`
4. **Paste** into the editor
5. **Click:** "Deploy function"

### Step 4: Repeat for Other Functions

Deploy these functions the same way:
- **llm-update** (from `supabase/functions/llm-update/index.ts`)
- **npm-import** (from `supabase/functions/npm-import/index.ts`)
- **hk-scraper** (from `supabase/functions/hk-scraper/index.ts`)

---

## 📋 Function Code Locations

All function code is ready in your project:

```
supabase/functions/
├── scrape-url/index.ts       ← Copy this
├── scrape-custom/index.ts    ← Copy this
├── llm-update/index.ts       ← Copy this
├── npm-import/index.ts       ← Copy this
├── hk-scraper/index.ts       ← Copy this
└── _shared/cors.ts           ← Import used by functions
```

---

## 🔑 Important: Set Environment Variables

In Supabase Dashboard for each function:

1. Go to function settings
2. Add environment variable:
   - **Name:** `FIRECRAWL_API_KEY`
   - **Value:** `fc-7f04517bc6ef43d68c06316d5f69b91e`
3. Save

Or they're already set via CLI (we did this):
```bash
supabase secrets set FIRECRAWL_API_KEY="fc-7f04517bc6ef43d68c06316d5f69b91e"
```

---

## 🧪 Test Your Functions

After deployment via Dashboard:

```bash
# Test scrape-url
curl -X POST https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/scrape-url \
  -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'

# Test scrape-custom
curl -X POST https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/scrape-custom \
  -H "Content-Type: application/json" \
  -d '{"type":"seo","url":"https://example.com"}'
```

---

## 💡 Why This Works

- Supabase Dashboard has its own bundler (no Docker needed)
- Functions are built and deployed server-side
- Same result as CLI deployment
- Often faster for individual functions

---

## ⚡ Quick Deploy via Dashboard

**Time Required:** 5-10 minutes

**Steps:**
1. Open Dashboard → Edge Functions
2. Create 5 functions (scrape-url, scrape-custom, llm-update, npm-import, hk-scraper)
3. Copy/paste code from local files
4. Deploy each function
5. Test with curl

**No Docker Required!** ✨

---

## 🔄 Method 2: Fix Docker (If You Prefer CLI)

### Check WSL

```bash
wsl --version
```

If not installed or outdated:
```bash
wsl --install
wsl --update
```

### Reinstall Docker Desktop

1. Uninstall current Docker Desktop
2. Download latest: https://www.docker.com/products/docker-desktop
3. Install with **"Use WSL 2"** option selected
4. Restart computer
5. Start Docker Desktop from Start Menu

### Then Deploy

Once Docker is running:
```bash
bash deploy-supabase-functions.sh
```

---

## 🎯 Recommended Approach

**For Quick Deployment:** Use Supabase Dashboard (Method 1)
- No Docker hassle
- Works immediately
- Same result

**For Local Development:** Fix Docker (Method 2)
- Better for iterative development
- Test functions locally
- Automated deployments

---

## 📊 Deployment Comparison

| Method | Time | Complexity | Docker Required |
|--------|------|------------|-----------------|
| Dashboard UI | 5-10 min | Easy | ❌ No |
| CLI with Docker | 2-5 min | Medium | ✅ Yes |

---

**Recommendation:** Use Dashboard UI to deploy now, fix Docker later for development workflow.
