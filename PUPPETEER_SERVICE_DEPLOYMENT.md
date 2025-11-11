# Puppeteer Service Deployment Guide

Complete guide for deploying the Puppeteer scraping service and integrating it with your Edge Functions.

---

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Deploy to Render.com (Recommended)](#deploy-to-rendercom)
3. [Deploy to Railway.app](#deploy-to-railwayapp)
4. [Local Testing](#local-testing)
5. [Configure Supabase Edge Functions](#configure-supabase-edge-functions)
6. [Test Integration](#test-integration)
7. [Troubleshooting](#troubleshooting)

---

## 🚀 Quick Start

The Puppeteer service is located in `puppeteer-service/` directory with the following structure:

```
puppeteer-service/
├── server.js              # Express API server
├── scrapers/
│   ├── hkex-ccass.js     # HKEX CCASS scraper
│   └── hksfc-news.js     # HKSFC news scraper
├── package.json           # Dependencies
├── Dockerfile             # Docker configuration
├── render.yaml            # Render deployment config
└── README.md              # Service documentation
```

---

## ☁️ Deploy to Render.com (Recommended - Free Tier)

Render.com offers a free tier perfect for this service.

### Step 1: Commit Puppeteer Service to Git

```bash
cd C:\Users\user\JubitLLMNPMPlayground
git add puppeteer-service/
git commit -m "Add Puppeteer scraping service"
git push origin main
```

### Step 2: Create Render Account

1. Go to https://render.com
2. Sign up with GitHub account
3. Authorize Render to access your repositories

### Step 3: Deploy Service

1. **Click "New" → "Web Service"**

2. **Connect GitHub Repository:**
   - Select `JubitLLMNPMPlayground` repository
   - Click "Connect"

3. **Configure Service:**
   - **Name:** `puppeteer-scraping-service`
   - **Region:** Singapore (closest to HK)
   - **Branch:** `main`
   - **Root Directory:** `puppeteer-service`
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** Free

4. **Add Environment Variables:**
   - `NODE_ENV` = `production`
   - `PORT` = `3001`

5. **Click "Create Web Service"**

### Step 4: Wait for Deployment

- First deployment takes ~5-10 minutes
- Watch build logs for any errors
- Service URL will be available once deployed
- Example: `https://puppeteer-scraping-service.onrender.com`

### Step 5: Test Deployment

```bash
# Test health endpoint
curl https://puppeteer-scraping-service.onrender.com/health

# Expected response:
# {"status":"ok","service":"puppeteer-scraping-service",...}
```

---

## 🚂 Deploy to Railway.app (Alternative)

Railway.app also offers free tier and excellent Node.js support.

### Step 1: Install Railway CLI

```bash
npm install -g @railway/cli
```

### Step 2: Login

```bash
railway login
```

### Step 3: Deploy

```bash
cd puppeteer-service
railway init
railway up
```

### Step 4: Get Service URL

```bash
railway domain
```

Note the generated URL (e.g., `https://puppeteer-scraping-service.up.railway.app`)

---

## 💻 Local Testing

Before deploying, test the service locally:

### Step 1: Install Dependencies

```bash
cd puppeteer-service
npm install
```

### Step 2: Start Service

```bash
npm start
```

Service will be available at `http://localhost:3001`

### Step 3: Test Endpoints

**Health Check:**
```bash
curl http://localhost:3001/health
```

**HKEX CCASS Test:**
```bash
curl -X POST http://localhost:3001/api/scrape/hkex-ccass \
  -H "Content-Type: application/json" \
  -d "{\"stockCodes\":[\"00700\"],\"date\":\"2025-11-10\"}"
```

**HKSFC News Test:**
```bash
curl -X POST http://localhost:3001/api/scrape/hksfc-news \
  -H "Content-Type: application/json" \
  -d "{}"
```

---

## 🔧 Configure Supabase Edge Functions

After deploying the Puppeteer service, configure your Edge Functions to use it.

### Step 1: Set Environment Variable in Supabase

```bash
# Replace with your actual Puppeteer service URL
export SUPABASE_ACCESS_TOKEN="sbp_7a8f5797f175740a6fd4592d49c2a2e6be651191"

supabase secrets set PUPPETEER_SERVICE_URL=https://puppeteer-scraping-service.onrender.com
```

Or use Supabase Dashboard:
1. Go to https://supabase.com/dashboard/project/kiztaihzanqnrcrqaxsv/settings/functions
2. Add secret: `PUPPETEER_SERVICE_URL` = `https://your-service-url.onrender.com`

### Step 2: Redeploy Edge Functions

```bash
export SUPABASE_ACCESS_TOKEN="sbp_7a8f5797f175740a6fd4592d49c2a2e6be651191"

supabase functions deploy scrape-orchestrator --use-api --no-verify-jwt
```

---

## ✅ Test Integration

### Test via Edge Function

```bash
# Test HKEX scraping via Edge Function (will use Puppeteer as fallback)
curl -X POST https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/scrape-orchestrator \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8" \
  -d "{\"source\":\"hkex-ccass\",\"strategy\":\"puppeteer\",\"options\":{\"stockCodes\":[\"00700\"]}}"
```

### Test via HK Scraper UI

1. Visit https://chathogs.com
2. Navigate to "HK Scraper"
3. Select HKEX source
4. Enter stock code: `00700`
5. Click "Start Scraping"
6. Should now work with Puppeteer service! 🎉

### Test via Scraper Page

1. Visit https://chathogs.com
2. Navigate to "Web Scraper"
3. Enter URL
4. Select "Edge Function" method
5. Should use Puppeteer when Firecrawl fails

---

## 🛠️ Troubleshooting

### Issue: Service Won't Start on Render

**Symptoms:**
- Build succeeds but service crashes
- "Chromium not found" errors

**Solution:**
```bash
# Render uses Node.js buildpack by default
# Add Chrome dependencies in render.yaml:
```

Update `render.yaml`:
```yaml
services:
  - type: web
    env: node
    buildCommand: |
      npm install
      apt-get update && apt-get install -y chromium
```

### Issue: Slow Response Times

**Symptoms:**
- Requests timeout
- Takes >30 seconds per request

**Solution:**
1. **Render Free Tier sleeps after 15 minutes**
   - First request after sleep takes ~30s to wake up
   - Upgrade to paid plan ($7/mo) for always-on service

2. **Reduce concurrent scraping**
   - HKEX scraper already has 3-second delays
   - Don't scrape more than 5 stocks at once

### Issue: Memory Errors

**Symptoms:**
- Service crashes with "Out of memory"
- Docker container stops

**Solution:**
```bash
# For Docker deployment
docker run -m 1g -p 3001:3001 puppeteer-service

# For Render - upgrade plan for more memory
```

### Issue: PUPPETEER_SERVICE_URL Not Set

**Symptoms:**
- Edge Function returns "PUPPETEER_SERVICE_URL not configured"

**Solution:**
```bash
# Check current secrets
supabase secrets list

# Set the secret
supabase secrets set PUPPETEER_SERVICE_URL=https://your-service.onrender.com

# Redeploy functions
supabase functions deploy scrape-orchestrator --use-api --no-verify-jwt
```

### Issue: CORS Errors

**Symptoms:**
- Browser console shows CORS errors
- Requests blocked

**Solution:**
The Puppeteer service already has CORS enabled. If still having issues:

1. Check Render logs: `https://dashboard.render.com`
2. Verify service is running: `curl https://your-service.onrender.com/health`
3. Check Supabase function logs

---

## 📊 Service Monitoring

### Render Dashboard

- **Logs:** https://dashboard.render.com → Your Service → Logs
- **Metrics:** CPU, Memory, Request count
- **Health Checks:** Automatic via `/health` endpoint

### Check Service Status

```bash
# Health check
curl https://your-service.onrender.com/health

# Expected response:
{
  "status": "ok",
  "service": "puppeteer-scraping-service",
  "timestamp": "2025-11-10T10:00:00.000Z",
  "uptime": 12345.67
}
```

### Check Edge Function Logs

```bash
# View function logs
supabase functions logs scrape-orchestrator --tail
```

Look for:
- `[Puppeteer Service] Calling external service`
- `[HKEX CCASS Puppeteer] Calling service for X stocks`

---

## 🎯 Performance Benchmarks

### HKEX CCASS Scraping

| Stock Codes | Time (Firecrawl) | Time (Puppeteer) | Notes |
|-------------|------------------|------------------|-------|
| 1 stock | ~6s | ~15s | Includes form submission |
| 3 stocks | ~15s | ~45s | Sequential (3s delay each) |
| 10 stocks | ~45s | ~150s | Not recommended |

### HKSFC News Scraping

| Operation | Time | Notes |
|-----------|------|-------|
| Single page | ~15s | JavaScript-rendered content |
| With filters | ~18s | Date range filtering |

---

## 💡 Best Practices

1. **Use Firecrawl First**
   - Firecrawl is faster and more reliable
   - Use Puppeteer only as fallback

2. **Rate Limiting**
   - HKEX: 3 seconds between requests (enforced)
   - Don't scrape more than 10 stocks at once

3. **Error Handling**
   - Always check `success` field in response
   - Implement retry logic for failed requests

4. **Caching**
   - Cache CCASS data for 24 hours
   - Cache news articles for 1 hour

5. **Monitoring**
   - Check Render dashboard regularly
   - Monitor Edge Function logs
   - Set up uptime monitoring (e.g., UptimeRobot)

---

## 📚 Additional Resources

- **Puppeteer Service README:** `puppeteer-service/README.md`
- **Render Documentation:** https://render.com/docs
- **Railway Documentation:** https://docs.railway.app
- **Supabase Edge Functions:** https://supabase.com/docs/guides/functions

---

## ✅ Deployment Checklist

- [ ] Puppeteer service code committed to Git
- [ ] Service deployed to Render/Railway
- [ ] Service URL obtained and tested
- [ ] `PUPPETEER_SERVICE_URL` set in Supabase secrets
- [ ] Edge Functions redeployed
- [ ] Health endpoint tested
- [ ] HKEX scraping tested via Edge Function
- [ ] HKSFC scraping tested via Edge Function
- [ ] HK Scraper UI tested
- [ ] Web Scraper UI tested
- [ ] Logs checked for errors
- [ ] Performance benchmarked

---

## 🎉 You're Done!

Your Puppeteer scraping service is now deployed and integrated with your Edge Functions!

Both the HK Scraper and Web Scraper pages can now use Puppeteer for scraping when Firecrawl is not suitable.

**Next Steps:**
1. Monitor service performance
2. Adjust rate limits if needed
3. Consider upgrading Render plan for better performance
4. Implement caching for frequently accessed data
