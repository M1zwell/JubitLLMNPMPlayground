# SFC Financial Statistics Feature

## Overview

This feature adds a new "Financial Statistics" tab to the HK Data page, scraping XLSX files from the Securities and Futures Commission (SFC) Hong Kong website and presenting the data with interactive charts and visualizations.

## Implementation Status

### ✅ Completed

1. **Database Schema** (`supabase/migrations/20251113_create_sfc_financial_statistics.sql`)
   - Created 7 tables for SFC financial data
   - Tables: `sfc_market_highlights`, `sfc_market_cap_by_type`, `sfc_turnover_by_type`, `sfc_licensed_representatives`, `sfc_responsible_officers`, `sfc_mutual_fund_nav`, `sfc_statistics_raw`
   - Implemented proper indexing and constraints
   - **Status**: Tables created in database

2. **XLSX Scraper** (`scrape-sfc-statistics.js`)
   - Downloads XLSX files from SFC website
   - Parses 6 tables: A1, A2, A3, C4, C5, D3
   - Extracts period information (Q3 2025)
   - Stores raw data in `sfc_statistics_raw` table
   - **Status**: Scraper functional, tested successfully (290 total rows parsed)

3. **React Component** (`src/components/SFCFinancialStatistics.tsx`)
   - Interactive data visualization with Recharts
   - 6 table views with charts (Line, Bar, Pie)
   - XLSX download functionality
   - Dark mode support
   - **Status**: Component created with mock data

4. **Integration** (`src/components/HKScraperModern.tsx`)
   - Added "Financial Statistics" tab with orange gradient theme
   - "New" badge to highlight the feature
   - **Status**: Integrated as 4th tab in HK Data page

### ⚠️ Pending Manual Steps

#### 1. Apply RLS Write Policies

**Issue**: The SFC tables have Row Level Security (RLS) enabled but only have SELECT policies. INSERT/UPDATE policies are missing, preventing the scraper from writing data.

**Solution**: Execute the following SQL in Supabase SQL Editor:

```sql
-- File: supabase/migrations/20251113_add_sfc_write_policies.sql

-- Raw statistics table
CREATE POLICY IF NOT EXISTS "Allow public insert to raw statistics"
  ON sfc_statistics_raw FOR INSERT
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow public update to raw statistics"
  ON sfc_statistics_raw FOR UPDATE
  USING (true);

-- Market highlights table
CREATE POLICY IF NOT EXISTS "Allow public insert to market highlights"
  ON sfc_market_highlights FOR INSERT
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow public update to market highlights"
  ON sfc_market_highlights FOR UPDATE
  USING (true);

-- Market cap by type table
CREATE POLICY IF NOT EXISTS "Allow public insert to market cap by type"
  ON sfc_market_cap_by_type FOR INSERT
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow public update to market cap by type"
  ON sfc_market_cap_by_type FOR UPDATE
  USING (true);

-- Turnover by type table
CREATE POLICY IF NOT EXISTS "Allow public insert to turnover by type"
  ON sfc_turnover_by_type FOR INSERT
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow public update to turnover by type"
  ON sfc_turnover_by_type FOR UPDATE
  USING (true);

-- Licensed representatives table
CREATE POLICY IF NOT EXISTS "Allow public insert to licensed reps"
  ON sfc_licensed_representatives FOR INSERT
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow public update to licensed reps"
  ON sfc_licensed_representatives FOR UPDATE
  USING (true);

-- Responsible officers table
CREATE POLICY IF NOT EXISTS "Allow public insert to responsible officers"
  ON sfc_responsible_officers FOR INSERT
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow public update to responsible officers"
  ON sfc_responsible_officers FOR UPDATE
  USING (true);

-- Mutual fund NAV table
CREATE POLICY IF NOT EXISTS "Allow public insert to mutual fund NAV"
  ON sfc_mutual_fund_nav FOR INSERT
  WITH CHECK (true);

CREATE POLICY IF NOT EXISTS "Allow public update to mutual fund NAV"
  ON sfc_mutual_fund_nav FOR UPDATE
  USING (true);
```

**Steps**:
1. Go to https://supabase.com/dashboard/project/kiztaihzanqnrcrqaxsv/sql/new
2. Sign in to Supabase
3. Paste the SQL above
4. Click "Run"

#### 2. Run the Scraper

Once the policies are applied, run the scraper to collect data:

```bash
node scrape-sfc-statistics.js
```

Expected output:
- Successfully scrapes 6 tables (A1, A2, A3, C4, C5, D3)
- Stores 290+ rows total in `sfc_statistics_raw` table
- No error messages

#### 3. Update Component to Use Real Data

After scraper runs successfully, update `src/components/SFCFinancialStatistics.tsx` to fetch real data from Supabase instead of using mock data.

## Data Sources

All data is sourced from the SFC Hong Kong Statistics page:
https://www.sfc.hk/en/Published-resources/Statistics

### Tables Scraped

| Table ID | Title | URL | Records |
|----------|-------|-----|---------|
| A1 | Highlights of the Hong Kong Stock Market | [Link](https://www.sfc.hk/-/media/EN/files/SOM/MarketStatistics/a01x.xlsx) | 48 rows |
| A2 | Market Capitalisation by Stock Type | [Link](https://www.sfc.hk/-/media/EN/files/SOM/MarketStatistics/a02x.xlsx) | 49 rows |
| A3 | Average Daily Turnover by Stock Type | [Link](https://www.sfc.hk/-/media/EN/files/SOM/MarketStatistics/a03x.xlsx) | 49 rows |
| C4 | Licensed Representatives | [Link](https://www.sfc.hk/-/media/EN/files/SOM/MarketStatistics/c04x.xlsx) | 43 rows |
| C5 | Responsible Officers | [Link](https://www.sfc.hk/-/media/EN/files/SOM/MarketStatistics/c05x.xlsx) | 43 rows |
| D3 | Mutual Fund NAV | [Link](https://www.sfc.hk/-/media/EN/files/SOM/MarketStatistics/d03x.xlsx) | 58 rows |

**Total**: 290 rows across 6 tables

## File Structure

```
JubitLLMNPMPlayground/
├── scrape-sfc-statistics.js          # XLSX scraper script
├── supabase/
│   └── migrations/
│       ├── 20251113_create_sfc_financial_statistics.sql   # Database schema
│       └── 20251113_add_sfc_write_policies.sql            # RLS write policies
├── src/
│   └── components/
│       ├── SFCFinancialStatistics.tsx  # React visualization component
│       └── HKScraperModern.tsx         # Updated with new tab
└── SFC_STATISTICS_README.md          # This file
```

## Testing Scripts

Several utility scripts are available for testing and verification:

- `check-sfc-data.js` - Check if data exists in database
- `list-all-tables.js` - List all tables and row counts
- `test-sfc-insert.js` - Test insert/upsert operations
- `apply-sfc-policies.js` - Attempt to apply RLS policies programmatically

## Usage

Once the manual steps are completed:

1. **Navigate to HK Data page**
2. **Click "Financial Statistics" tab** (4th tab, orange gradient)
3. **Select a table** from the dropdown (A1-A3, C4-C5, D3)
4. **View charts and data** - Interactive charts show trends, comparisons, and distributions
5. **Download XLSX** - Click download button to get original Excel files

## Future Enhancements

- [ ] Automated quarterly data updates (scheduled scraping)
- [ ] Year-over-year comparison charts
- [ ] Trend analysis and forecasting
- [ ] Export charts as PNG/PDF
- [ ] Data alerts for significant changes

## Troubleshooting

### Issue: Data not appearing in charts

**Solution**:
1. Check if RLS policies are applied (see Pending Manual Steps #1)
2. Run scraper (see Pending Manual Steps #2)
3. Verify data in database using `node check-sfc-data.js`

### Issue: "Error storing raw data: {}"

**Cause**: RLS policies for INSERT/UPDATE are missing

**Solution**: Apply the SQL from `20251113_add_sfc_write_policies.sql` in Supabase SQL Editor

### Issue: Tables don't exist

**Solution**: The migration should have created them, but if not:
1. Go to Supabase SQL Editor
2. Execute `supabase/migrations/20251113_create_sfc_financial_statistics.sql`

## Support

For issues or questions, refer to:
- SFC Statistics Website: https://www.sfc.hk/en/Published-resources/Statistics
- Supabase Dashboard: https://supabase.com/dashboard/project/kiztaihzanqnrcrqaxsv
- Project CLAUDE.md for overall project guidance

---

**Last Updated**: 2025-11-17
**Status**: Ready for RLS policy application and scraper execution
**Data Version**: Q3 2025
