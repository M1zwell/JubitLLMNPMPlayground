/**
 * HKEX CCASS Holdings Scraper - FINAL WORKING VERSION
 * Successfully extracts participant data from results page
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeCCASSHoldings(stockCode, date) {
  console.log(`\n🔍 Scraping CCASS holdings for ${stockCode} on ${date}...`);

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1280, height: 1400 },
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
      await new Promise(resolve => setTimeout(resolve, 2000));
      const acceptButton = await page.$('button');
      if (acceptButton) {
        const text = await page.evaluate(el => el.textContent, acceptButton);
        if (text && text.includes('Accept')) {
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

    // Fill stock code
    await page.waitForSelector('input[name="txtStockCode"]', { visible: true });
    await page.click('input[name="txtStockCode"]', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type('input[name="txtStockCode"]', stockCode, { delay: 100 });

    // Set date
    await page.evaluate((dateValue) => {
      const dateInput = document.querySelector('input[name="txtShareholdingDate"]');
      if (dateInput) {
        dateInput.value = dateValue;
        dateInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, date);

    console.log('🔘 Clicking SEARCH button...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Click search button
    await page.evaluate(() => {
      const searchButton = document.querySelector('#btnSearch');
      if (searchButton) {
        searchButton.click();
      }
    });

    // Wait for navigation
    console.log('⏳ Waiting for results...');
    try {
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 });
    } catch (e) {
      console.log('ℹ️  Checking for results on same page...');
    }

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check if we got results
    const pageText = await page.evaluate(() => document.body.innerText);

    if (pageText.includes('No data is available') || pageText.includes('No Record Found')) {
      console.log('⚠️  No data available for this date');
      return {
        stockCode,
        date,
        participants: [],
        message: 'No data available',
        success: false
      };
    }

    // Extract CCASS data with proper table parsing
    const ccassData = await page.evaluate(() => {
      const data = {
        stockCode: null,
        stockName: null,
        date: null,
        participants: [],
        totalShares: null,
        percentageInCCASS: null,
        totalParticipants: null
      };

      // Extract stock code
      const stockCodeEl = document.querySelector('input[name="txtStockCode"]');
      if (stockCodeEl) data.stockCode = stockCodeEl.value;

      // Extract stock name
      const stockNameEl = document.querySelector('input[name="txtStockName"]');
      if (stockNameEl && stockNameEl.value) {
        data.stockName = stockNameEl.value;
      }

      // Extract date
      const dateEl = document.querySelector('input[name="txtShareholdingDate"]');
      if (dateEl) data.date = dateEl.value;

      // Find summary data
      const bodyText = document.body.innerText;
      const totalMatch = bodyText.match(/Total\s+([\d,]+)\s+(\d+)\s+([\d.]+%)/);
      if (totalMatch) {
        data.totalShares = totalMatch[1];
        data.totalParticipants = parseInt(totalMatch[2]);
        data.percentageInCCASS = totalMatch[3];
      }

      // Find all tables
      const tables = document.querySelectorAll('table');

      for (let table of tables) {
        const rows = table.querySelectorAll('tr');
        if (rows.length < 2) continue;

        // Check for participant data table
        // Look for "Participant ID" header
        const firstRow = rows[0];
        const headerText = firstRow.textContent;

        if (headerText.includes('Participant ID') || headerText.includes('Name of CCASS Participant')) {
          console.log('Found participant table with', rows.length, 'rows');

          // Parse data rows (skip header)
          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const cells = row.querySelectorAll('td');

            if (cells.length >= 3) {
              const participantId = cells[0]?.textContent.trim() || '';
              const participantName = cells[1]?.textContent.trim() || '';
              const shareholding = cells[2]?.textContent.trim() || '';
              const percentage = cells[3]?.textContent.trim() || '';

              // Validate data
              if (participantId && participantId.match(/^[A-Z0-9]+$/) && participantName.length > 2) {
                data.participants.push({
                  participantId,
                  participantName,
                  address: cells.length > 4 ? cells[2].textContent.trim() : '',
                  shareholding: shareholding,
                  percentage: percentage
                });
              }
            }
          }
        }
      }

      return data;
    });

    console.log('\n✅ Scraping completed!');
    console.log(`📊 Stock: ${ccassData.stockName || ccassData.stockCode}`);
    console.log(`📊 Total Participants: ${ccassData.totalParticipants || 'Unknown'}`);
    console.log(`📊 Found ${ccassData.participants.length} participant records`);

    if (ccassData.participants.length > 0) {
      console.log(`\nTop 5 participants:`);
      ccassData.participants.slice(0, 5).forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.participantId} - ${p.participantName}`);
        console.log(`     Shareholding: ${p.shareholding} (${p.percentage})`);
      });
    }

    return {
      ...ccassData,
      date: ccassData.date || date,
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
  const startDate = process.argv[3] || '2024/10/01';
  const endDate = process.argv[4] || startDate;

  // Generate date range
  const dates = [];
  const start = new Date(startDate.replace(/\//g, '-'));
  const end = new Date(endDate.replace(/\//g, '-'));

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const formatted = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
    dates.push(formatted);
  }

  console.log('🚀 HKEX CCASS Holdings Scraper - FINAL');
  console.log('========================================\n');
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
  const filename = `ccass-${stockCode}-${start.getFullYear()}${String(start.getMonth() + 1).padStart(2, '0')}${String(start.getDate()).padStart(2, '0')}.json`;

  fs.writeFileSync(filename, JSON.stringify(results, null, 2));
  console.log(`💾 Results saved to: ${filename}`);

  // Print summary
  console.log('\n📊 Summary by Date:');
  results.forEach(r => {
    if (r.success && r.participants && r.participants.length > 0) {
      console.log(`  ${r.date}: ${r.participants.length} participants (${r.stockName || r.stockCode})`);
    } else {
      console.log(`  ${r.date}: ${r.message || r.error || 'No data'}`);
    }
  });

  process.exit(0);
})();
