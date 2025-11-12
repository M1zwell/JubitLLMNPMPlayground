# HKEX CCASS Holdings Scraper

Complete solution for scraping HKEX CCASS (Central Clearing and Settlement System) shareholding data from https://www3.hkexnews.hk/sdw/search/searchsdw.aspx

## ✅ Successfully Working

The scraper is fully functional and extracts:
- **Participant ID** (e.g., C00019, A00003, C00010)
- **Participant Name** (e.g., THE HONGKONG AND SHANGHAI BANKING, CITIBANK N.A.)
- **Address** (Full addresses of participants)
- **Shareholding** (Number of shares held)
- **Percentage** (% of total issued shares)

## Features

✅ **Multi-date scraping** - Scrape date ranges automatically
✅ **CSV Export** - Exports all data to CSV format
✅ **JSON Export** - Exports all data to JSON format
✅ **Supabase Integration** - Optional direct database storage
✅ **Detailed Logging** - Progress tracking and debugging info
✅ **Rate Limiting** - 3-second delays between requests
✅ **Error Handling** - Gracefully handles "No data available" cases

## Files

- **`scrape-ccass-complete.cjs`** - Main production-ready scraper
- **`setup-ccass-table.cjs`** - Supabase table setup helper
- **`supabase/migrations/20251112_create_hkex_ccass_holdings.sql`** - Database schema

## Usage

### Basic Usage (CSV/JSON Export)

```bash
# Scrape single date
node scrape-ccass-complete.cjs 00700 2025/11/08

# Scrape date range
node scrape-ccass-complete.cjs 00700 2025/11/08 2025/11/11

# Custom stock code
node scrape-ccass-complete.cjs 00005 2025/11/08 2025/11/10
```

### With Supabase Integration

```bash
# Scrape and save to Supabase
node scrape-ccass-complete.cjs 00700 2025/11/08 2025/11/11 --supabase
```

## Output Files

For stock code `00700` starting from `2025/11/08`:

- **`ccass-00700-20251108.json`** - JSON with full detailed data
- **`ccass-00700-20251108.csv`** - CSV format ready for Excel/analysis

## CSV Format

```csv
Date,Stock Code,Stock Name,Participant ID,Participant Name,Address,Shareholding,Percentage,Scraped At
2025/11/08,00700,"TENCENT HOLDINGS LIMITED -HKD TRADED SHARES",C00019,"THE HONGKONG AND SHANGHAI BANKING","HSBC WEALTH BUSINESS SERVICES 8/F TOWER 2 & 3 HSBC CENTRE 1 SHAM MONG ROAD KOWLOON",3221123909,35.22%,2025-11-12T10:01:01.773Z
2025/11/08,00700,"TENCENT HOLDINGS LIMITED -HKD TRADED SHARES",C00010,"CITIBANK N.A.","9/F CITI TOWER ONE BAY EAST 83 HOI BUN ROAD KWUN TONG KOWLOON",531868125,5.81%,2025-11-12T10:01:01.773Z
```

## Example Output

```
🚀 HKEX CCASS Holdings Scraper - COMPLETE
==========================================

Stock Code: 00700
Date Range: 2025/11/08 to 2025/11/09
Dates: 2025/11/08, 2025/11/09
Supabase: NO

📊 Stock: TENCENT HOLDINGS LIMITED -HKD TRADED SHARES
📊 Total Participants: 752
📊 Extracted 402 participant records

Top 5 participants:
  1. C00019 - THE HONGKONG AND SHANGHAI BANKING
     HSBC WEALTH BUSINESS SERVICES 8/F TOWER 2 & 3 HSBC CENTRE 1 SHAM MONG ROAD KOWLOON
     Shareholding: 3,221,123,909 (35.22%)

  2. A00003 - CHINA SECURITIES DEPOSITORY AND CLEARING
     17 TAIPING QIAO STREET XICHENG DISTRICT BEIJING CHINA
     Shareholding: 544,488,952 (5.95%)

  3. C00010 - CITIBANK N.A.
     9/F CITI TOWER ONE BAY EAST 83 HOI BUN ROAD KWUN TONG KOWLOON
     Shareholding: 531,868,125 (5.81%)

📋 FINAL RESULTS
=================
✅ Successful: 2
❌ Failed: 0
📊 Total participant records: 804

💾 JSON saved: ccass-00700-20251108.json
✅ CSV exported: ccass-00700-20251108.csv (804 records)
```

## Supabase Setup

1. Open [Supabase SQL Editor](https://supabase.com/dashboard/project/kiztaihzanqnrcrqaxsv/sql/new)

2. Run the SQL from `supabase/migrations/20251112_create_hkex_ccass_holdings.sql` or use:
   ```bash
   node setup-ccass-table.cjs
   ```

3. Test with Supabase integration:
   ```bash
   node scrape-ccass-complete.cjs 00700 2025/11/08 --supabase
   ```

## Database Schema

```sql
CREATE TABLE hkex_ccass_holdings (
  id BIGSERIAL PRIMARY KEY,
  stock_code TEXT NOT NULL,
  stock_name TEXT,
  shareholding_date DATE NOT NULL,
  participant_id TEXT NOT NULL,
  participant_name TEXT NOT NULL,
  address TEXT,
  shareholding BIGINT NOT NULL,
  percentage DECIMAL(10, 4),
  scraped_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT unique_ccass_holding UNIQUE (stock_code, shareholding_date, participant_id)
);
```

## Technical Details

### How It Works

1. **Form Submission**: Uses Puppeteer to fill the HKEX search form
2. **ASP.NET Navigation**: Clicks the `#btnSearch` button to trigger ASP.NET postback
3. **Table Parsing**: Extracts data from the detailed participant table
4. **Cell Value Extraction**: Handles HKEX's unique cell format (`"Label:\nValue"`)
5. **Data Validation**: Validates participant IDs, shareholdings match expected patterns
6. **Export**: Generates JSON and CSV files
7. **Optional Storage**: Saves to Supabase in batches of 100 records

### Key Technical Challenges Solved

✅ **ASP.NET Form Submission**: Standard `form.submit()` doesn't work - must click `#btnSearch`
✅ **Cell Format Parsing**: Cells contain both label and value separated by newlines
✅ **Table Identification**: Multiple tables on page - must find the one with "Participant ID" header
✅ **Rate Limiting**: 3-second delays prevent being blocked by HKEX

## Requirements

```json
{
  "puppeteer": "^latest",
  "@supabase/supabase-js": "^latest"
}
```

## Date Format

Always use `YYYY/MM/DD` format:
- ✅ `2025/11/08`
- ❌ `2025-11-08`
- ❌ `11/08/2025`

## Limitations

- HKEX only provides data for the **past 12 months**
- Each page shows up to ~400-750 participants (pagination needed for more)
- Weekends and Hong Kong public holidays show previous trading day data
- Rate limiting: Keep 3+ second delays between requests

## Troubleshooting

**No data extracted**:
- Check the date is within the past 12 months
- Verify the stock code is correct (e.g., `00700` for Tencent)
- Check if date is a weekend/holiday (will show previous trading day)

**Timeout errors**:
- Increase timeout in script (default: 30 seconds for navigation)
- Check internet connection
- HKEX site might be down or slow

**Supabase errors**:
- Verify the table exists (`setup-ccass-table.cjs`)
- Check Supabase credentials in `.env`
- Ensure RLS policies are set up correctly

## Integration with Frontend

The scraped data can be displayed in your React frontend:

1. Query from Supabase:
   ```javascript
   const { data } = await supabase
     .from('hkex_ccass_holdings')
     .select('*')
     .eq('stock_code', '00700')
     .eq('shareholding_date', '2025-11-08')
     .order('shareholding', { ascending: false });
   ```

2. Or load from CSV/JSON files directly in frontend

## Support

For issues, check:
1. `debug-ccass-results.html` - Saved page HTML for debugging
2. `debug-ccass-results.png` - Screenshot of results page
3. Console logs - Detailed progress information

## Example Stock Codes

- `00700` - Tencent Holdings
- `09988` - Alibaba Group (HKD counter)
- `00005` - HSBC Holdings
- `00388` - Hong Kong Exchanges and Clearing
- `00941` - China Mobile

## License

This scraper is for personal and educational use only. Always comply with HKEX's terms of service and rate limiting policies.
