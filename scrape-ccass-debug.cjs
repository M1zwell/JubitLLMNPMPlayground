/**
 * HKEX CCASS Holdings Scraper - Debug Version with Screenshots
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

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

    await page.screenshot({ path: `debug-step1-search-page-${stockCode}.png` });
    console.log('📸 Saved screenshot: step1-search-page');

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

    await page.screenshot({ path: `debug-step2-form-filled-${stockCode}.png` });
    console.log('📸 Saved screenshot: step2-form-filled');

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

    await page.screenshot({ path: `debug-step3-after-submit-${stockCode}.png` });
    console.log('📸 Saved screenshot: step3-after-submit');

    // Save the HTML
    const html = await page.content();
    fs.writeFileSync(`debug-results-page-${stockCode}.html`, html);
    console.log('💾 Saved HTML: debug-results-page.html');

    // Check if we got results or error
    const pageText = await page.evaluate(() => document.body.innerText);
    const pageUrl = page.url();

    console.log(`\n📍 Current URL: ${pageUrl}`);
    console.log(`📄 Page contains "SEARCH": ${pageText.includes('SEARCH')}`);
    console.log(`📄 Page contains "Participant": ${pageText.includes('Participant')}`);
    console.log(`📄 Page contains "No data": ${pageText.includes('No data is available')}`);
    console.log(`📄 Page contains "TENCENT": ${pageText.includes('TENCENT')}`);

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

    // Extract detailed table information
    const tableDebugInfo = await page.evaluate(() => {
      const tables = document.querySelectorAll('table');
      return Array.from(tables).map((table, idx) => {
        const rows = table.querySelectorAll('tr');
        const headers = Array.from(table.querySelectorAll('th')).map(th => th.textContent.trim());
        const firstFewRows = Array.from(rows).slice(0, 3).map(row => {
          return Array.from(row.querySelectorAll('td, th')).map(cell => cell.textContent.trim());
        });

        return {
          tableIndex: idx,
          rowCount: rows.length,
          headers: headers,
          firstFewRows: firstFewRows,
          hasParticipantText: table.textContent.includes('Participant')
        };
      });
    });

    console.log('\n📊 Table Debug Info:');
    console.log(JSON.stringify(tableDebugInfo, null, 2));

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
      success: ccassData.participants.length > 0,
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

// Main execution
(async () => {
  const stockCode = process.argv[2] || '00700';
  const date = process.argv[3] || '2024/10/01'; // Use a date from the past

  console.log('🚀 HKEX CCASS Holdings Scraper - Debug Version');
  console.log('===============================================\n');
  console.log(`Stock Code: ${stockCode}`);
  console.log(`Date: ${date}\n`);

  const result = await scrapeCCASSHoldings(stockCode, date);

  console.log('\n\n📋 FINAL RESULT');
  console.log('================\n');
  console.log(JSON.stringify(result, null, 2));

  // Save to file
  const filename = `ccass-debug-${stockCode}-${date.replace(/\//g, '')}.json`;
  fs.writeFileSync(filename, JSON.stringify(result, null, 2));
  console.log(`\n💾 Results saved to: ${filename}`);

  process.exit(0);
})();
