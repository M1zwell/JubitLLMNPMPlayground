/**
 * HKEX CCASS Holdings Scraper - Fixed Version
 * Handles ASP.NET navigation properly
 */

const puppeteer = require('puppeteer');

async function scrapeCCASSHoldings(stockCode, date) {
  console.log(`\n🔍 Scraping CCASS holdings for ${stockCode} on ${date}...`);

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Navigate to CCASS search page
    console.log('📡 Navigating to HKEX CCASS page...');
    await page.goto('https://www3.hkexnews.hk/sdw/search/searchsdw.aspx', {
      waitUntil: 'networkidle0',
      timeout: 60000
    });

    // Accept cookies if present
    try {
      const acceptButton = await page.$('button');
      if (acceptButton) {
        const text = await page.evaluate(el => el.textContent, acceptButton);
        if (text.includes('Accept')) {
          await acceptButton.click();
          console.log('✅ Accepted cookies');
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (e) {
      console.log('ℹ️  No cookie banner');
    }

    // Fill in the form
    console.log(`📝 Filling form with stock code: ${stockCode}, date: ${date}`);

    // Clear and fill stock code
    await page.waitForSelector('input[name="txtStockCode"]', { visible: true });
    await page.click('input[name="txtStockCode"]', { clickCount: 3 });
    await page.type('input[name="txtStockCode"]', stockCode);

    // Set date
    await page.evaluate((dateValue) => {
      const dateInput = document.querySelector('input[name="txtShareholdingDate"]');
      if (dateInput) {
        dateInput.value = dateValue;
      }
    }, date);

    console.log('🔘 Submitting form and waiting for navigation...');

    // Submit form and wait for navigation to complete
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 }),
      page.evaluate(() => {
        const form = document.querySelector('form');
        if (form) {
          form.submit();
        }
      })
    ]);

    console.log('✅ Navigation completed');

    // Wait a bit more for any dynamic content
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Check if we got results or error
    const pageText = await page.evaluate(() => document.body.innerText);

    if (pageText.includes('No data is available')) {
      console.log('⚠️  No data available for this date');
      return {
        stockCode,
        date,
        participants: [],
        message: 'No data available',
        success: false
      };
    }

    // Extract CCASS data
    const ccassData = await page.evaluate(() => {
      const data = {
        stockCode: null,
        stockName: null,
        date: null,
        participants: [],
        totalShares: null,
        percentageInCCASS: null
      };

      // Extract stock info from page
      const stockCodeEl = document.querySelector('input[name="txtStockCode"]');
      if (stockCodeEl) data.stockCode = stockCodeEl.value;

      const stockNameEl = document.querySelector('.txt-stock-name, #stockName, [class*="stockName"]');
      if (stockNameEl) data.stockName = stockNameEl.textContent.trim();

      // Find the main data table
      const tables = document.querySelectorAll('table');

      for (let table of tables) {
        const rows = table.querySelectorAll('tr');

        // Check if this is the participant table by looking for headers
        const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent.trim().toLowerCase());

        if (headers.some(h => h.includes('participant') || h.includes('shareholding'))) {
          // This is likely the participant table
          rows.forEach((row, index) => {
            if (index === 0) return; // Skip header row

            const cells = row.querySelectorAll('td');
            if (cells.length >= 3) {
              const cellData = Array.from(cells).map(cell => cell.textContent.trim());

              // Participant data typically has: ID, Name, Shareholding, Percentage
              if (cellData[0] && cellData[1]) {
                data.participants.push({
                  participantId: cellData[0],
                  participantName: cellData[1],
                  shareholding: cellData[2] || '0',
                  percentage: cellData[3] || '0%'
                });
              }
            }
          });
        }
      }

      // Try to find summary information
      const summaryElements = document.querySelectorAll('.summary, .total, [class*="summary"]');
      summaryElements.forEach(el => {
        const text = el.textContent;
        if (text.includes('Total')) {
          data.totalShares = text;
        }
      });

      return data;
    });

    console.log('\n✅ Scraping completed!');
    console.log(`📊 Found ${ccassData.participants.length} participants`);

    if (ccassData.participants.length > 0) {
      console.log(`Top 3 participants:`);
      ccassData.participants.slice(0, 3).forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.participantName}: ${p.shareholding} (${p.percentage})`);
      });
    }

    return {
      ...ccassData,
      date,
      success: true,
      scrapedAt: new Date().toISOString()
    };

  } catch (error) {
    console.error('❌ Error:', error.message);
    return {
      stockCode,
      date,
      error: error.message,
      success: false
    };
  } finally {
    await browser.close();
  }
}

async function scrapeMultipleDates(stockCode, dates) {
  const results = [];

  for (const date of dates) {
    const data = await scrapeCCASSHoldings(stockCode, date);
    results.push(data);

    // Wait between requests
    if (dates.indexOf(date) < dates.length - 1) {
      console.log('\n⏸️  Waiting 3 seconds before next request...\n');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  return results;
}

// Main execution
(async () => {
  const stockCode = process.argv[2] || '00700';
  const startDate = process.argv[3] || '2025/11/08';
  const endDate = process.argv[4] || '2025/11/11';

  // Generate date range
  const dates = [];
  const start = new Date(startDate.replace(/\//g, '-'));
  const end = new Date(endDate.replace(/\//g, '-'));

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const formatted = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
    dates.push(formatted);
  }

  console.log('🚀 HKEX CCASS Holdings Scraper');
  console.log('================================\n');
  console.log(`Stock Code: ${stockCode}`);
  console.log(`Date Range: ${startDate} to ${endDate}`);
  console.log(`Dates to scrape: ${dates.join(', ')}\n`);

  const results = await scrapeMultipleDates(stockCode, dates);

  console.log('\n\n📋 FINAL RESULTS');
  console.log('=================\n');

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}\n`);

  // Save to file
  const fs = require('fs');
  const filename = `ccass-${stockCode}-${start.getFullYear()}${String(start.getMonth() + 1).padStart(2, '0')}${String(start.getDate()).padStart(2, '0')}.json`;

  fs.writeFileSync(filename, JSON.stringify(results, null, 2));
  console.log(`\n💾 Results saved to: ${filename}`);

  // Print summary
  console.log('\n📊 Summary by Date:');
  results.forEach(r => {
    if (r.success && r.participants && r.participants.length > 0) {
      console.log(`  ${r.date}: ${r.participants.length} participants`);
    } else {
      console.log(`  ${r.date}: ${r.message || r.error || 'No data'}`);
    }
  });

  process.exit(0);
})();
