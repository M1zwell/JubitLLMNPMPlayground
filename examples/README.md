# Puppeteer HKEx Examples

This directory contains practical examples for scraping HKEx SPA tables using Puppeteer.

## 📋 Available Examples

### 1. CCASS Participant Shareholding Scraper
**File:** `puppeteer-hkex-ccass-example.js`

Scrapes CCASS participant shareholding data for any stock code.

**Usage:**
```bash
# Scrape Tencent (00700) - default
node examples/puppeteer-hkex-ccass-example.js

# Scrape HSBC (00005)
node examples/puppeteer-hkex-ccass-example.js 00005

# Run in headless mode
node examples/puppeteer-hkex-ccass-example.js 00700 --headless

# Scrape Bank of China (03988)
node examples/puppeteer-hkex-ccass-example.js 03988
```

**Output:**
- `ccass_00700_2025-11-11.csv` - CSV export
- `ccass_00700_2025-11-11.json` - JSON export
- `ccass_00700_screenshot.png` - Screenshot for verification

**Sample Output:**
```
🚀 Starting CCASS Holdings Scraper for 00700

📄 Step 1: Navigating to CCASS search page...
✅ Page loaded

📋 Step 2: Selecting Shareholding tab...
🔢 Step 3: Entering stock code 00700...
📅 Step 4: Setting date...
🔍 Step 5: Submitting search...
⏳ Step 6: Waiting for results to load...

📊 Step 7: Extracting table data...
✅ Successfully extracted 156 participant records

📋 Sample Data (first 5 records):
────────────────────────────────────────────────────────────────────────────────
Participant ID      Participant Name                          Shareholding             Percentage
────────────────────────────────────────────────────────────────────────────────
C00001             HSBC Nominees Limited                      124,567,890              1.32%
C00002             Bank of China (Hong Kong) Nominees        98,234,567               1.04%
...
────────────────────────────────────────────────────────────────────────────────

💾 Step 8: Exporting to CSV...
✅ Saved to ccass_00700_2025-11-11.csv
✅ Saved to ccass_00700_2025-11-11.json
📸 Screenshot saved to ccass_00700_screenshot.png

🎉 Scraping completed successfully!
```

## 🚀 Quick Start

### Prerequisites
```bash
# Install Puppeteer (if not already installed)
npm install puppeteer
```

### Run Your First Scrape
```bash
# Navigate to project root
cd C:\Users\user\JubitLLMNPMPlayground

# Run CCASS scraper for Tencent
node examples/puppeteer-hkex-ccass-example.js
```

### View Results
```bash
# Open CSV in Excel or any spreadsheet application
start ccass_00700_2025-11-11.csv

# View JSON in VS Code
code ccass_00700_2025-11-11.json

# View screenshot
start ccass_00700_screenshot.png
```

## 📊 Data Structure

### CSV Format
```csv
Participant ID,Participant Name,Shareholding,Percentage
C00001,"HSBC Nominees Limited",124567890,1.32%
C00002,"Bank of China (Hong Kong) Nominees Limited",98234567,1.04%
```

### JSON Format
```json
{
  "stockCode": "00700",
  "date": "2025/11/11",
  "scrapedAt": "2025-11-11T09:30:00.000Z",
  "totalRecords": 156,
  "summary": {
    "Total": "9,456,234,567 shares"
  },
  "data": [
    {
      "participantID": "C00001",
      "participantName": "HSBC Nominees Limited",
      "shareholding": "124,567,890",
      "percentage": "1.32%"
    }
  ]
}
```

## 🎯 Common Stock Codes

| Stock Code | Company Name          | Category    |
|------------|-----------------------|-------------|
| 00005      | HSBC Holdings         | Banking     |
| 00700      | Tencent Holdings      | Technology  |
| 00388      | Hong Kong Exchanges   | Financials  |
| 00941      | China Mobile          | Telecom     |
| 03988      | Bank of China         | Banking     |
| 01299      | AIA Group             | Insurance   |

## 🔧 Advanced Usage

### Custom Date Range
Modify the example file to use specific dates:

```javascript
const specificDate = new Date('2024-11-01');
const dateStr = `${specificDate.getFullYear()}/${String(specificDate.getMonth() + 1).padStart(2, '0')}/${String(specificDate.getDate()).padStart(2, '0')}`;
```

### Error Handling
The scraper automatically:
- Takes error screenshots
- Retries on timeout
- Handles missing tables gracefully
- Logs detailed error messages

### Batch Processing
Scrape multiple stocks:

```javascript
const stocks = ['00700', '00005', '00388'];

for (const stock of stocks) {
  const result = await scrapeCCASSHoldings(stock, true);
  console.log(`${stock}: ${result.totalRecords} records`);
}
```

## 🧪 Testing

### Test with Different Stock Codes
```bash
# Large cap
node examples/puppeteer-hkex-ccass-example.js 00700

# Small cap
node examples/puppeteer-hkex-ccass-example.js 02318

# H shares
node examples/puppeteer-hkex-ccass-example.js 03988
```

### Verify Results
1. Check CSV has correct number of rows
2. Verify screenshot shows the table
3. Compare JSON totals with HKEx website

## 📝 Notes

- **Headless Mode:** Use `--headless` for faster execution without UI
- **Rate Limiting:** Add delays between requests to avoid being blocked
- **Data Freshness:** CCASS data is updated daily after market close
- **Browser:** Uses Chromium (installed with Puppeteer)

## 🆘 Troubleshooting

### "Navigation timeout" error
- Increase timeout in `page.goto()` options
- Check internet connection
- Try headless: false to see what's happening

### "Table not found" error
- HKEx may have changed their HTML structure
- Check screenshot to see what loaded
- Update selectors in the code

### "No data in table" error
- Stock code may be invalid
- Date may be a weekend/holiday
- CCASS data not available for that date

## 🔗 Integration

### Use with Edge Functions
Deploy the scraper as an Edge Function:

```typescript
// supabase/functions/ccass-scraper/index.ts
import { serve } from 'std/http/server.ts';
import scrapeCCASSHoldings from './scraper.ts';

serve(async (req) => {
  const { stockCode } = await req.json();
  const result = await scrapeCCASSHoldings(stockCode, true);
  return new Response(JSON.stringify(result));
});
```

### Use in React Components
```typescript
const scrapeCCASSData = async (stockCode: string) => {
  const response = await fetch('/api/ccass-scraper', {
    method: 'POST',
    body: JSON.stringify({ stockCode })
  });
  const result = await response.json();
  setHoldings(result.data);
};
```

## 📚 Learn More

- [Puppeteer Documentation](https://pptr.dev/)
- [HKEx CCASS Search](https://www.hkexnews.hk/sdw/search/searchsdw.aspx)
- [Full Puppeteer Guide](../PUPPETEER_HKEX_GUIDE.md)

---

**Ready to scrape? Start with:**
```bash
node examples/puppeteer-hkex-ccass-example.js
```
