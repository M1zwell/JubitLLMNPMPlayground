# Puppeteer Scraping Service (ARCHIVED)

**Status:** 🗄️ **Not Deployed - Reference Only**
**Decision Date:** 2025-11-11
**Reason:** Using Firecrawl API for all scraping needs. No additional infrastructure needed.

---

## ⚠️ Important Notice

This service is **NOT deployed** to any infrastructure. It exists as reference code only.

**Current Production Setup:**
- ✅ **Firecrawl API** - Handles all scraping (HKSFC + HKEX)
- ✅ **Edge Functions** - scrape-orchestrator uses Firecrawl
- ✅ **$0 additional cost** - No Fly.io, Render, or Railway needed

See `../SCRAPING_DECISION.md` for full analysis.

---

## Original Description

Standalone Node.js microservice providing Puppeteer-based web scraping for HKEX CCASS and HKSFC data.

## Features

- 🚀 **HKEX CCASS Scraping** - Extract shareholding data from Hong Kong Stock Exchange
- 📰 **HKSFC News Scraping** - Get latest news and announcements from HK Securities Commission
- 🔧 **Generic URL Scraping** - Scrape any URL with custom selectors
- 🐳 **Docker Ready** - Easy deployment with Docker
- ☁️ **Cloud Deployment** - Ready for Render, Railway, or any cloud platform

## API Endpoints

### Health Check
```
GET /health
```

Returns service status and uptime.

### HKEX CCASS Scraping
```
POST /api/scrape/hkex-ccass
Content-Type: application/json

{
  "stockCodes": ["00700", "00005", "00388"],
  "date": "2025-11-10"  // Optional, defaults to today
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "stockCode": "00700",
      "stockName": "TENCENT",
      "dataDate": "2025/11/10",
      "participants": [
        {
          "participantId": "C00001",
          "participantName": "HSBC",
          "shareholding": 1234567890,
          "percentage": 5.67
        }
      ],
      "totalParticipants": 100,
      "totalShares": 12345678900
    }
  ],
  "executionTime": 15234,
  "timestamp": "2025-11-10T10:00:00.000Z"
}
```

### HKSFC News Scraping
```
POST /api/scrape/hksfc-news
Content-Type: application/json

{
  "url": "https://www.sfc.hk/en/News-and-announcements/News/All-news",  // Optional
  "dateRange": {  // Optional
    "start": "2025-11-01",
    "end": "2025-11-10"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "articles": [
      {
        "id": "hksfc-1731236400000-0",
        "title": "SFC announces new regulation",
        "url": "https://www.sfc.hk/en/News/...",
        "publishDate": "2025-11-10",
        "category": "News",
        "summary": "The Securities and Futures Commission...",
        "tags": []
      }
    ],
    "totalPages": 1,
    "currentPage": 1,
    "scrapeDate": "2025-11-10T10:00:00.000Z"
  }
}
```

### Generic URL Scraping
```
POST /api/scrape/url
Content-Type: application/json

{
  "url": "https://example.com",
  "waitForSelector": ".content",  // Optional
  "extractData": true  // Optional, returns text content
}
```

## Local Development

### Prerequisites
- Node.js 18+
- Chrome or Chromium installed

### Installation
```bash
cd puppeteer-service
npm install
```

### Run Locally
```bash
npm start
```

Or with nodemon for development:
```bash
npm run dev
```

Service will be available at `http://localhost:3001`

## Deployment

### Option 1: Deploy to Render.com (Recommended - Free Tier)

1. **Push to GitHub:**
   ```bash
   git add puppeteer-service/
   git commit -m "Add Puppeteer scraping service"
   git push
   ```

2. **Deploy on Render:**
   - Go to https://render.com
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Select `puppeteer-service` directory
   - Render will auto-detect `render.yaml` and deploy

3. **Get Service URL:**
   - After deployment, Render provides a URL like: `https://puppeteer-scraping-service.onrender.com`
   - Note this URL for Edge Function configuration

### Option 2: Docker Deployment

```bash
# Build image
docker build -t puppeteer-service .

# Run container
docker run -p 3001:3001 puppeteer-service
```

### Option 3: Railway.app

1. Install Railway CLI:
   ```bash
   npm i -g @railway/cli
   ```

2. Deploy:
   ```bash
   cd puppeteer-service
   railway login
   railway init
   railway up
   ```

## Integration with Supabase Edge Functions

Once deployed, update your Edge Functions to call the Puppeteer service:

### Update `supabase/functions/scrape-orchestrator/index.ts`

```typescript
// Add environment variable for Puppeteer service URL
const PUPPETEER_SERVICE_URL = Deno.env.get('PUPPETEER_SERVICE_URL') || 'http://localhost:3001';

async function scrapeCCASSWithPuppeteer(
  stockCodes: string[],
  dateRange?: { start: string; end: string }
): Promise<any> {
  const response = await fetch(`${PUPPETEER_SERVICE_URL}/api/scrape/hkex-ccass`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      stockCodes,
      date: dateRange?.start
    })
  });

  if (!response.ok) {
    throw new Error(`Puppeteer service error: ${response.status}`);
  }

  const data = await response.json();
  return data.data;
}
```

### Set Environment Variable in Supabase

```bash
# After deploying Puppeteer service, set the URL
supabase secrets set PUPPETEER_SERVICE_URL=https://puppeteer-scraping-service.onrender.com
```

## Performance & Rate Limiting

### HKEX CCASS
- **Rate Limit**: 3 seconds between requests (HKEX requirement)
- **Timeout**: 30 seconds per stock code
- **Max Stock Codes**: Recommended 10 per request

### HKSFC News
- **Timeout**: 30 seconds
- **Articles**: Typically returns 20-50 articles per page

## Error Handling

All endpoints return structured error responses:

```json
{
  "success": false,
  "error": "Error message here",
  "executionTime": 1234
}
```

## Testing

### Test Health Endpoint
```bash
curl http://localhost:3001/health
```

### Test HKEX Scraping
```bash
curl -X POST http://localhost:3001/api/scrape/hkex-ccass \
  -H "Content-Type: application/json" \
  -d '{"stockCodes":["00700"],"date":"2025-11-10"}'
```

### Test HKSFC Scraping
```bash
curl -X POST http://localhost:3001/api/scrape/hksfc-news \
  -H "Content-Type: application/json" \
  -d '{}'
```

## Troubleshooting

### Chromium Not Found
If you see "Chromium not found" errors:

**For Docker:**
```dockerfile
ENV PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium
```

**For Local Development (Windows):**
Update `server.js` or scrapers to use:
```javascript
executablePath: 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
```

### Memory Issues
If the service crashes due to memory:

**Render.com:**
- Upgrade to paid plan for more memory
- Or reduce concurrent scraping operations

**Docker:**
```bash
docker run -m 1g -p 3001:3001 puppeteer-service
```

## Architecture

```
puppeteer-service/
├── server.js              # Express server with API routes
├── scrapers/
│   ├── hkex-ccass.js     # HKEX CCASS scraper
│   └── hksfc-news.js     # HKSFC news scraper
├── package.json           # Dependencies
├── Dockerfile             # Docker configuration
├── render.yaml            # Render.com deployment config
└── README.md              # This file
```

## License

MIT

## Support

For issues or questions:
- Check logs: `docker logs <container_id>`
- Test endpoints individually
- Verify Chromium installation
- Check rate limiting and timeouts
