/**
 * Debug script to analyze table structure
 */

const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1280, height: 2000 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  await page.goto('https://www3.hkexnews.hk/sdw/search/searchsdw.aspx', {
    waitUntil: 'networkidle0',
    timeout: 60000
  });

  await new Promise(resolve => setTimeout(resolve, 2000));

  await page.waitForSelector('input[name="txtStockCode"]', { visible: true });
  await page.click('input[name="txtStockCode"]', { clickCount: 3 });
  await page.keyboard.press('Backspace');
  await page.type('input[name="txtStockCode"]', '00700', { delay: 100 });

  await page.evaluate(() => {
    const dateInput = document.querySelector('input[name="txtShareholdingDate"]');
    if (dateInput) {
      dateInput.value = '2025/11/08';
      dateInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  });

  await new Promise(resolve => setTimeout(resolve, 1000));

  await page.evaluate(() => {
    const searchButton = document.querySelector('#btnSearch');
    if (searchButton) searchButton.click();
  });

  try {
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 });
  } catch (e) {}

  await new Promise(resolve => setTimeout(resolve, 3000));

  // Save HTML
  const html = await page.content();
  fs.writeFileSync('debug-ccass-results.html', html);
  console.log('✅ HTML saved to: debug-ccass-results.html');

  // Take screenshot
  await page.screenshot({ path: 'debug-ccass-results.png', fullPage: true });
  console.log('✅ Screenshot saved to: debug-ccass-results.png');

  // Analyze tables
  const tableInfo = await page.evaluate(() => {
    const tables = document.querySelectorAll('table');
    return Array.from(tables).map((table, idx) => {
      const rows = table.querySelectorAll('tr');
      const firstRow = rows[0];
      const headers = Array.from(firstRow?.querySelectorAll('th, td') || []).map(cell => cell.textContent.trim());

      const sampleRows = Array.from(rows).slice(0, 5).map(row => {
        const cells = Array.from(row.querySelectorAll('td, th'));
        return cells.map(cell => cell.textContent.trim().substring(0, 50));
      });

      return {
        tableIndex: idx,
        totalRows: rows.length,
        headers: headers,
        sampleRows: sampleRows
      };
    });
  });

  console.log('\n📊 Table Analysis:');
  console.log(JSON.stringify(tableInfo, null, 2));

  fs.writeFileSync('debug-table-info.json', JSON.stringify(tableInfo, null, 2));
  console.log('\n✅ Table info saved to: debug-table-info.json');

  await browser.close();
  process.exit(0);
})();
