/**
 * HKEX CCASS Holdings Scraper - V2
 * Clicks the button directly
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

async function scrapeCCASSHoldings(stockCode, date) {
  console.log(`\n🔍 Scraping CCASS holdings for ${stockCode} on ${date}...`);

  const browser = await puppeteer.launch({
    headless: false, // Set to false to see what's happening
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

    // Wait for and clear stock code field
    await page.waitForSelector('input[name="txtStockCode"]', { visible: true });
    await page.click('input[name="txtStockCode"]', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type('input[name="txtStockCode"]', stockCode, { delay: 100 });

    // Set date by clicking the date picker
    await page.click('input[name="txtShareholdingDate"]');
    await new Promise(resolve => setTimeout(resolve, 500));

    // Clear and type date
    await page.evaluate((dateValue) => {
      const dateInput = document.querySelector('input[name="txtShareholdingDate"]');
      if (dateInput) {
        dateInput.value = dateValue;
        // Trigger change event
        dateInput.dispatchEvent(new Event('change', { bubbles: true }));
        dateInput.dispatchEvent(new Event('blur', { bubbles: true }));
      }
    }, date);

    console.log('🔘 Clicking SEARCH button...');

    // Wait a bit to ensure form is ready
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Find and click the search button
    const buttonClicked = await page.evaluate(() => {
      const searchButton = document.querySelector('#btnSearch');
      if (searchButton) {
        searchButton.click();
        return true;
      }
      return false;
    });

    if (!buttonClicked) {
      throw new Error('Could not find or click search button');
    }

    // Wait for navigation
    console.log('⏳ Waiting for navigation...');
    try {
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 });
      console.log('✅ Navigation completed');
    } catch (navError) {
      console.log('⚠️  No navigation detected, checking if we have results on same page...');
    }

    // Wait for any dynamic content
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check current URL
    const pageUrl = page.url();
    console.log(`📍 Current URL: ${pageUrl}`);

    // Take a screenshot for debugging
    await page.screenshot({ path: `scrape-result-${stockCode}-${date.replace(/\//g, '')}.png` });
    console.log('📸 Screenshot saved');

    // Check if we got results or error
    const pageInfo = await page.evaluate(() => {
      const bodyText = document.body.innerText;
      const tables = document.querySelectorAll('table');

      return {
        hasSearchText: bodyText.includes('SEARCH'),
        hasParticipantText: bodyText.includes('Participant'),
        hasNoDataText: bodyText.includes('No data is available') || bodyText.includes('No Record Found'),
        hasTencentText: bodyText.includes('TENCENT') || bodyText.includes('Tencent'),
        tableCount: tables.length,
        urlPath: window.location.pathname
      };
    });

    console.log('\n📊 Page Info:');
    console.log(JSON.stringify(pageInfo, null, 2));

    if (pageInfo.hasNoDataText) {
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

      // Extract stock info
      const stockCodeEl = document.querySelector('input[name="txtStockCode"]');
      if (stockCodeEl) data.stockCode = stockCodeEl.value;

      // Search page text for stock name
      const bodyText = document.body.innerText;
      const lines = bodyText.split('\n');
      for (let line of lines) {
        if (line.includes('Stock Name') || (line.match(/^[A-Z\s]+$/) && line.length > 5 && line.length < 50)) {
          const match = line.match(/([A-Z\s]+)/);
          if (match && !line.includes('CCASS') && !line.includes('SEARCH')) {
            data.stockName = match[1].trim();
            break;
          }
        }
      }

      // Find all tables
      const tables = document.querySelectorAll('table');

      for (let table of tables) {
        const rows = table.querySelectorAll('tr');
        if (rows.length < 2) continue;

        // Get headers
        const headers = Array.from(table.querySelectorAll('th')).map(th =>
          th.textContent.trim().toLowerCase()
        );

        // Check if this is participant data table
        const hasParticipantHeader = headers.some(h =>
          h.includes('participant') || h.includes('id') || h.includes('shareholding')
        );

        if (hasParticipantHeader || rows.length > 10) {
          // This might be the data table
          rows.forEach((row, index) => {
            if (index === 0) return; // Skip header

            const cells = row.querySelectorAll('td');
            if (cells.length >= 4) {
              const cellData = Array.from(cells).map(cell => cell.textContent.trim());

              // Check if this looks like participant data
              // Format: ID (alphanumeric), Name (text), Shareholding (numbers), Percentage (numbers with %)
              if (cellData[0] && cellData[1] &&
                  cellData[0].match(/^[A-Z0-9]+$/) &&
                  cellData[1].length > 3 &&
                  cellData[2] && cellData[2].match(/[\d,]+/)) {

                data.participants.push({
                  participantId: cellData[0],
                  participantName: cellData[1],
                  shareholding: cellData[2],
                  percentage: cellData[3] || '0%'
                });
              }
            }
          });
        }
      }

      return data;
    });

    console.log('\n✅ Scraping completed!');
    console.log(`📊 Found ${ccassData.participants.length} participants`);

    if (ccassData.participants.length > 0) {
      console.log(`Top 5 participants:`);
      ccassData.participants.slice(0, 5).forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.participantId} - ${p.participantName}: ${p.shareholding} (${p.percentage})`);
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
    console.error(error.stack);
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
  const date = process.argv[3] || '2024/10/01';

  console.log('🚀 HKEX CCASS Holdings Scraper V2');
  console.log('===================================\n');
  console.log(`Stock Code: ${stockCode}`);
  console.log(`Date: ${date}\n`);

  const result = await scrapeCCASSHoldings(stockCode, date);

  console.log('\n\n📋 FINAL RESULT');
  console.log('================\n');
  console.log(JSON.stringify(result, null, 2));

  const filename = `ccass-v2-${stockCode}-${date.replace(/\//g, '')}.json`;
  fs.writeFileSync(filename, JSON.stringify(result, null, 2));
  console.log(`\n💾 Results saved to: ${filename}`);

  process.exit(0);
})();
