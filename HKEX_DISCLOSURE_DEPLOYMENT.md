# HKEX Disclosure of Interests - Deployment Guide

## ✅ What's Been Completed

### 1. Database Table ✅
- **Table Created**: `hkex_disclosure_interests`
- **Status**: Already exists in Supabase database
- **Migration File**: `supabase/migrations/20251113_create_hkex_disclosure_interests.sql`

### 2. Edge Function ✅
- **Function Created**: `hkex-disclosure-scraper`
- **Location**: `supabase/functions/hkex-disclosure-scraper/index.ts`
- **Firecrawl API Key**: Set as Supabase secret (`FIRECRAWL_API_KEY`)

### 3. Frontend Component ✅
- **New Component**: `HKEXDisclosureViewer.tsx`
- **Integrated**: Updated `HKScraperModern.tsx` to use new component
- **Tab Label Changed**: "HKEX Announcements" → "Disclosure of Interests"

## 📋 Remaining Tasks

### Deploy Edge Function (Manual via Dashboard)

Since Docker deployment is experiencing issues, deploy via Supabase Dashboard:

1. **Go to Supabase Dashboard**
   - Navigate to: https://supabase.com/dashboard/project/kiztaihzanqnrcrqaxsv
   - Go to Edge Functions section

2. **Deploy Function**
   - Click "Deploy New Function"
   - Name: `hkex-disclosure-scraper`
   - Copy content from: `supabase/functions/hkex-disclosure-scraper/index.ts`
   - Deploy

**OR** use Supabase CLI after fixing Docker:
```bash
export SUPABASE_ACCESS_TOKEN=sbp_1cf43d8f8eb2dc8df3136a5d8c948e433d100a52
supabase functions deploy hkex-disclosure-scraper
```

## 🧪 Testing

### Test the Scraper

Once deployed, you can test using:

```bash
node test-hkex-disclosure-scraper.js 00700
```

Or via the UI:
1. Go to HK Data page
2. Click "Disclosure of Interests" tab
3. Click "View Data" mode
4. Enter stock code `00700` in the scraping section
5. Click "Scrape"

### Expected Result

For stock 00700 (Tencent Holdings), you should see shareholders like:
- MIH TC Holdings Limited (~31%)
- Naspers Limited (~23%)
- Prosus N.V. (~23%)
- Ma Huateng (~8%)
- Advance Data Services Limited (~8%)

## 🔍 Database Schema

### Table: hkex_disclosure_interests

**Key Fields:**
- `stock_code` - HKEx stock code (5 digits)
- `stock_name` - Company name
- `form_serial_number` - Unique disclosure form ID
- `shareholder_name` - Name of shareholder
- `shares_long` - Long position shares
- `shares_short` - Short position shares
- `percentage_long` - Long position percentage
- `percentage_short` - Short position percentage
- `filing_date` - Date of disclosure filing
- `notice_url` - Link to official notice

**Indexes:**
- `idx_hkex_di_stock_code` - Fast stock code lookups
- `idx_hkex_di_shareholder_name` - Shareholder search
- `idx_hkex_di_filing_date` - Date-based queries
- `idx_hkex_di_percentage_long` - Major shareholder queries

## 🔑 Environment Variables

### Supabase Secrets (Already Set ✅)
- `FIRECRAWL_API_KEY` - For web scraping via Firecrawl

### Required for Edge Function
- `SUPABASE_URL` - Automatically provided
- `SUPABASE_SERVICE_ROLE_KEY` - Automatically provided

## 🚀 Production Deployment

After Edge Function is deployed:

```bash
# Build frontend
npm run build

# Commit changes
git add .
git commit -m "feat: Add HKEX Disclosure of Interests scraper and viewer"

# Push to trigger deployment
git push origin main
```

## 📊 API Endpoints

### Scrape Disclosure Data
```bash
POST https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/hkex-disclosure-scraper

Headers:
- Authorization: Bearer <SUPABASE_ANON_KEY>
- apikey: <SUPABASE_ANON_KEY>
- Content-Type: application/json

Body:
{
  "stock_code": "00700",
  "start_date": "2024-01-01",  // optional, defaults to 1 year ago
  "end_date": "2025-11-13"      // optional, defaults to today
}
```

### Query Disclosure Data
```bash
GET https://kiztaihzanqnrcrqaxsv.supabase.co/rest/v1/hkex_disclosure_interests
  ?stock_code=eq.00700
  &order=filing_date.desc
  &limit=10

Headers:
- apikey: <SUPABASE_ANON_KEY>
- Authorization: Bearer <SUPABASE_ANON_KEY>
```

## 🐛 Troubleshooting

### Docker Deployment Error
**Issue**: `failed to inspect docker image: request returned 500`

**Solutions**:
1. Deploy via Supabase Dashboard (recommended)
2. Update Supabase CLI: `npm install -g supabase`
3. Restart Docker Desktop and WSL
4. Use CI/CD pipeline (GitHub Actions)

### Firecrawl API Error
**Issue**: `Unauthorized: Invalid token`

**Solution**: API key has been set. If error persists:
```bash
supabase secrets set FIRECRAWL_API_KEY=<your_key>
```

### No Data Returned
**Check**:
1. Stock code is valid (5 digits, e.g., "00700")
2. Date range has disclosure filings
3. HKEX website is accessible
4. Firecrawl has scraped successfully (check Edge Function logs)

## 📁 Files Modified/Created

### New Files
- `src/components/HKEXDisclosureViewer.tsx` - Disclosure viewer component
- `supabase/functions/hkex-disclosure-scraper/index.ts` - Edge Function
- `supabase/migrations/20251113_create_hkex_disclosure_interests.sql` - Migration
- `test-hkex-disclosure-scraper.js` - Local test script
- `test-disclosure-setup.js` - Setup verification script

### Modified Files
- `src/components/HKScraperModern.tsx` - Updated to use new viewer

## ✨ Features

### HKEXDisclosureViewer Component

**Features:**
- 📊 View all disclosure of interests data
- 🔍 Advanced filtering (shareholder, stock code, date range, min percentage)
- 📈 Sorting (by percentage, shares, date, shareholder name)
- 📥 Export to JSON/CSV
- 🔄 Built-in scraping interface
- 📱 Responsive design
- 🎨 Modern UI with statistics dashboard

**Statistics Dashboard:**
- Total records count
- Filtered results count
- Unique stocks tracked
- Unique shareholders count

## 🎯 Next Steps

1. ✅ Deploy Edge Function via Supabase Dashboard
2. ✅ Test scraping with stock code 00700
3. ✅ Verify data appears in UI
4. ✅ Build and deploy to production (Netlify)
5. ✅ Monitor for any errors or issues

---

**Last Updated**: 2025-11-13
**Status**: Ready for Edge Function deployment
