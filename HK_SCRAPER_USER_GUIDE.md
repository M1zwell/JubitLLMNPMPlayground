# HK Scraper Production - User Guide

## 🎯 Overview

The HK Scraper is now fully integrated with production Edge Functions and database. You can scrape real data from HKSFC and HKEX websites, and export it as CSV or JSON.

---

## 🚀 Quick Start

### 1. Access the Scraper

1. Navigate to the application
2. Click **"HK Scraper"** button in the navigation bar
3. You'll see two tabs:
   - **Scrape Data** - Trigger new scraping operations
   - **View Database** - See all previously scraped data

---

## 📊 Scrape Data Tab

### Data Sources

**HKSFC (Hong Kong SFC)**
- News and announcements
- Enforcement actions
- Regulatory circulars
- Consultation papers

**HKEX (Hong Kong Stock Exchange)**
- Company announcements
- Market statistics
- CCASS shareholding data
- IPO information

### Input Options

#### 1. Data Source Selection
- Toggle between **HKSFC** and **HKEX**
- Each source provides different types of financial data

#### 2. Record Limit
- Use slider to set limit (5-50 records)
- Controls how many records to scrape in one operation

#### 3. Test Mode
- ☑️ **Test Mode ON**: Uses mock data (fast, no API costs)
- ☐ **Test Mode OFF**: Real scraping via Firecrawl (slower, uses API)

#### 4. Stock Codes (HKEX only)
- Enter comma-separated stock codes
- Example: `00700,00005,00388` (Tencent, HSBC, HKEX)
- Used for filtering specific companies

#### 5. Date Range
- Set start and end dates
- Filters results within date range
- Default: Last 30 days

### How to Scrape

1. Select **HKSFC** or **HKEX**
2. Adjust **Record Limit** (e.g., 10)
3. Choose **Test Mode** or **Production Mode**
4. For HKEX: Enter **Stock Codes** (optional)
5. Set **Date Range** (optional)
6. Click **"Start Scraping"**

### Results Display

After scraping completes, you'll see:

- ✅ **Success** indicator (green) or ❌ **Error** (red)
- **Records Inserted**: New records added to database
- **Records Updated**: Existing records updated (deduplication)
- **Failed**: Records that failed to process
- **Duration**: Time taken in milliseconds

**Action Buttons:**
- **View in Database**: Switch to database view
- **Clear**: Remove results display

---

## 🗄️ View Database Tab

### Features

1. **Data Source Toggle**
   - Switch between HKSFC and HKEX data
   - Each shows data from respective table

2. **Filtering (HKSFC)**
   - **Filing Type Filter:**
     - All Types
     - News
     - Enforcement
     - Circular
     - Consultation

3. **Data Table Columns**
   - **Title**: Clickable link to source (opens in new tab)
   - **Type**: Filing/announcement type
   - **Company**: Stock code (if available)
   - **Date**: Filing/announcement date
   - **Scraped**: When data was scraped

### Export Options

**CSV Export**
```
Click "Export CSV" button
Downloads: hksfc_data_2025-11-10.csv or hkex_data_2025-11-10.csv
Format: Comma-separated values (opens in Excel, Google Sheets)
```

**JSON Export**
```
Click "Export JSON" button
Downloads: hksfc_data_2025-11-10.json or hkex_data_2025-11-10.json
Format: JSON array of objects (for developers)
```

### Refresh Data

- Click **"Refresh"** button to reload latest data from database
- Auto-refreshes after successful scraping

---

## 💡 Usage Examples

### Example 1: Scrape Latest HKSFC News (Test Mode)

```
1. Tab: "Scrape Data"
2. Source: HKSFC
3. Limit: 10
4. Test Mode: ✅ ON
5. Click "Start Scraping"

Result: 10 mock HKSFC records inserted in ~3 seconds
```

### Example 2: Scrape Real HKEX Announcements

```
1. Tab: "Scrape Data"
2. Source: HKEX
3. Limit: 10
4. Test Mode: ☐ OFF
5. Stock Codes: 00700,00005,00388
6. Date Range: Last 7 days
7. Click "Start Scraping"

Result: Real HKEX data scraped via Firecrawl in ~10 seconds
```

### Example 3: View and Export HKSFC Data

```
1. Tab: "View Database"
2. Source: HKSFC
3. Filing Type: "Enforcement"
4. Click "Refresh"
5. Click "Export CSV"

Result: CSV file downloaded with all enforcement actions
```

### Example 4: View HKEX Announcements by Company

```
1. Tab: "View Database"
2. Source: HKEX
3. Look for specific company codes in table
4. Click URL in Title column to view full announcement
5. Click "Export JSON" for programmatic access

Result: Can filter and export HKEX data for analysis
```

---

## 📁 CSV Export Format

### HKSFC CSV Structure
```csv
id,title,content,filing_type,company_code,company_name,filing_date,url,scraped_at
uuid-123,SFC warns against unlicensed...,Full content text,enforcement,N/A,N/A,2025-11-10,https://...,2025-11-10T08:00:00Z
```

### HKEX CSV Structure
```csv
id,announcement_title,announcement_content,announcement_type,company_code,company_name,announcement_date,url,scraped_at
uuid-456,Tencent Holdings Limited - Announcement,Full text,company,00700,Tencent,2025-11-10,https://...,2025-11-10T09:00:00Z
```

---

## 🔧 Technical Details

### Backend Integration

- **Edge Function**: `unified-scraper`
- **Endpoint**: `https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/unified-scraper`
- **Database Tables**:
  - `hksfc_filings`
  - `hkex_announcements`

### Scraping Process

1. **Request** sent to Edge Function with parameters
2. **Firecrawl** scrapes target website (production mode)
3. **Content parsing** extracts structured data
4. **Deduplication** via SHA-256 content hash
5. **Database insert/update** using UPSERT
6. **Response** with statistics

### Data Refresh Rate

- Real-time: Scrape on demand
- Database: View any previously scraped data
- Deduplication: Prevents duplicate entries

---

## 🎨 UI Features

### Scrape Data Tab
- Source selection buttons (HKSFC/HKEX)
- Slider for record limit
- Test mode toggle
- Stock code input field
- Date range picker
- Start scraping button with loading state
- Results card with statistics

### View Database Tab
- Source toggle buttons
- Filing type dropdown filter (HKSFC)
- Refresh button
- Export CSV button
- Export JSON button
- Data table with clickable links
- Row count display

---

## 🚨 Error Handling

### Common Errors

**"Error loading data"**
- Check internet connection
- Verify Supabase credentials
- Refresh the page

**"Scraping failed"**
- Check if Firecrawl API key is set
- Try test mode first
- Reduce record limit

**"No data found"**
- Scrape first before viewing database
- Check if test mode is enabled
- Verify date range filter

---

## 📊 Data Insights

### HKSFC Data Categories
- **News**: General announcements and updates
- **Enforcement**: Regulatory actions and penalties
- **Circular**: Industry circulars and guidance
- **Consultation**: Public consultation papers

### HKEX Data Types
- **Company**: Standard company announcements
- **IPO**: Initial public offering documents
- **Market Stats**: Trading statistics and reports
- **CCASS**: Central Clearing and Settlement System data

---

## 🔐 Data Privacy

- All data scraped from **public sources**
- HKSFC: https://www.sfc.hk
- HKEX: https://www.hkex.com.hk
- No private or confidential information
- Complies with website terms of service

---

## 🆘 Support

### Need Help?

1. **Check data**: Use "View Database" to see if scraping worked
2. **Try test mode**: Verify system works with mock data
3. **Refresh page**: Clear any stuck states
4. **Check logs**: Look at browser console for errors

### Report Issues

If you encounter bugs:
1. Note the data source (HKSFC/HKEX)
2. Record error message
3. Check if test mode works
4. Document steps to reproduce

---

## ✅ Quick Checklist

Before scraping:
- [ ] Selected correct data source (HKSFC/HKEX)
- [ ] Set appropriate record limit
- [ ] Decided on test mode vs production mode
- [ ] Entered stock codes (HKEX only, optional)
- [ ] Set date range (optional)

After scraping:
- [ ] Check results display for success
- [ ] Verify records inserted count
- [ ] Switch to "View Database" tab
- [ ] Export data as CSV or JSON
- [ ] Click URLs to verify data accuracy

---

**🎉 You're ready to scrape HK financial data!**

Navigate to the **HK Scraper** button and start scraping!

