/**
 * HKEX CCASS Holdings Scraper for Stock 00700 (Tencent)
 * Date Range: 2025/11/08 to 2025/11/11
 */

const puppeteer = require('puppeteer');

async function scrapeCCASSHoldings(stockCode, date) {
  console.log(`\n🔍 Scraping CCASS holdings for ${stockCode} on ${date}...`);

  const browser = await puppeteer.launch({
    headless: false, // Set to true for production
    defaultViewport: { width: 1280, height: 800 }
  });

  try {
    const page = await browser.newPage();

    // Navigate to CCASS search page
    console.log('📡 Navigating to HKEX CCASS page...');
    await page.goto('https://www3.hkexnews.hk/sdw/search/searchsdw.aspx', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });

    // Accept cookies if present
    try {
      await page.waitForSelector('button', { timeout: 3000 });
      const acceptButton = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const acceptBtn = buttons.find(btn => btn.textContent.includes('Accept'));
        if (acceptBtn) {
          acceptBtn.click();
          return true;
        }
        return false;
      });
      if (acceptButton) {
        console.log('✅ Accepted cookies');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    } catch (e) {
      console.log('ℹ️  No cookie banner found');
    }

    // Fill in the form
    console.log(`📝 Filling form with stock code: ${stockCode}, date: ${date}`);

    // Fill stock code
    await page.waitForSelector('input[name="txtStockCode"]');
    await page.type('input[name="txtStockCode"]', stockCode);

    // The date field might be readonly with a datepicker, try to set it directly
    await page.evaluate((dateValue) => {
      const dateInput = document.querySelector('input[name="txtShareholdingDate"]');
      if (dateInput) {
        dateInput.value = dateValue;
      }
    }, date);

    console.log('🔘 Clicking search button...');

    // Try multiple methods to submit the form
    const submitted = await page.evaluate(() => {
      // Method 1: Find submit button
      const submitBtn = document.querySelector('input[type="submit"]');
      if (submitBtn) {
        submitBtn.click();
        return { method: 'submit button', success: true };
      }

      // Method 2: Submit form directly
      const form = document.querySelector('form');
      if (form) {
        form.submit();
        return { method: 'form.submit()', success: true };
      }

      return { method: 'none', success: false };
    });

    console.log(`Submit method: ${submitted.method}`);

    // Wait for results page
    console.log('⏳ Waiting for results...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Check if we're on the results page
    const pageContent = await page.content();

    // Extract CCASS data
    const ccassData = await page.evaluate(() => {
      const data = {
        stockCode: null,
        stockName: null,
        date: null,
        participants: [],
        summary: {}
      };

      // Try to find stock info
      const stockCodeEl = document.querySelector('input[name="txtStockCode"]');
      if (stockCodeEl) data.stockCode = stockCodeEl.value;

      // Try to extract data table
      const tables = document.querySelectorAll('table');

      tables.forEach(table => {
        const rows = table.querySelectorAll('tr');

        rows.forEach((row, index) => {
          const cells = row.querySelectorAll('td, th');
          if (cells.length >= 3) {
            const rowData = Array.from(cells).map(cell => cell.textContent.trim());

            // Check if this looks like participant data
            if (rowData[0] && !isNaN(rowData[0].replace(/,/g, ''))) {
              data.participants.push({
                participantId: rowData[0],
                participantName: rowData[1] || '',
                shareholding: rowData[2] || '',
                percentage: rowData[3] || ''
              });
            }
          }
        });
      });

      return data;
    });

    // Also get page text for verification
    const bodyText = await page.evaluate(() => document.body.innerText);

    console.log('\n✅ Scraping completed!\n');
    console.log('📊 Results:', JSON.stringify(ccassData, null, 2));

    // Check if we got actual data
    if (ccassData.participants.length === 0) {
      console.log('\n⚠️  No participant data found. Page might still be on search form.');
      console.log('Page contains "SEARCH":', bodyText.includes('SEARCH'));
      console.log('Page contains "Participant":', bodyText.includes('Participant'));
    }

    return ccassData;

  } catch (error) {
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    await browser.close();
  }
}

async function scrapeMultipleDates(stockCode, dates) {
  const results = [];

  for (const date of dates) {
    try {
      const data = await scrapeCCASSHoldings(stockCode, date);
      results.push({ date, data, success: true });
    } catch (error) {
      results.push({ date, error: error.message, success: false });
    }

    // Wait between requests to avoid rate limiting
    if (dates.indexOf(date) < dates.length - 1) {
      console.log('\n⏸️  Waiting 3 seconds before next request...\n');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  return results;
}

// Main execution
(async () => {
  const stockCode = '00700';
  const dates = [
    '2025/11/08',
    '2025/11/09',
    '2025/11/10',
    '2025/11/11'
  ];

  console.log('🚀 HKEX CCASS Holdings Scraper');
  console.log('================================\n');
  console.log(`Stock Code: ${stockCode}`);
  console.log(`Dates: ${dates.join(', ')}\n`);

  const results = await scrapeMultipleDates(stockCode, dates);

  console.log('\n\n📋 FINAL RESULTS');
  console.log('=================\n');
  console.log(JSON.stringify(results, null, 2));

  // Save to file
  const fs = require('fs');
  fs.writeFileSync(
    'ccass-00700-results.json',
    JSON.stringify(results, null, 2)
  );
  console.log('\n💾 Results saved to: ccass-00700-results.json');
})();
