/**
 * Practical Example: Scrape CCASS Holdings using Puppeteer
 *
 * This example shows how to scrape Tencent (00700) CCASS participant shareholding data
 * from HKEx's SPA (Single Page Application)
 */

import puppeteer from 'puppeteer';
import fs from 'fs';

async function scrapeCCASSHoldings(stockCode = '00700', headless = false) {
  console.log(`\n🚀 Starting CCASS Holdings Scraper for ${stockCode}\n`);

  const browser = await puppeteer.launch({
    headless, // Set to true for production
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1920, height: 1080 },
  });

  try {
    const page = await browser.newPage();

    // Set user agent to avoid detection
    await page.setUserAgent(
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
    );

    console.log('📄 Step 1: Navigating to CCASS search page...');
    await page.goto('https://www.hkexnews.hk/sdw/search/searchsdw.aspx', {
      waitUntil: 'networkidle2',
      timeout: 60000,
    });

    console.log('✅ Page loaded\n');

    // Click "Shareholding" tab
    console.log('📋 Step 2: Selecting Shareholding tab...');
    const shareholdingTab = await page.$('#btnShowSH');
    if (shareholdingTab) {
      await shareholdingTab.click();
      await page.waitForTimeout(1000);
    }

    // Enter stock code
    console.log(`🔢 Step 3: Entering stock code ${stockCode}...`);
    await page.waitForSelector('#txtStockCode');
    await page.type('#txtStockCode', stockCode);

    // Set date (use today or specific date)
    console.log('📅 Step 4: Setting date...');
    const today = new Date();
    const dateStr = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, '0')}/${String(today.getDate()).padStart(2, '0')}`;

    await page.waitForSelector('#txtShareholdingDate');
    await page.type('#txtShareholdingDate', dateStr);

    console.log('🔍 Step 5: Submitting search...');
    await page.click('#btnSearch');

    console.log('⏳ Step 6: Waiting for results to load...\n');

    // Wait for results table to appear
    await page.waitForSelector('#mutualmarket-result, table.table', {
      timeout: 30000,
    });

    // Wait a bit more for JavaScript to finish rendering
    await page.waitForTimeout(3000);

    // Wait for table to have data rows
    await page.waitForFunction(() => {
      const table = document.querySelector('table.table');
      const rows = table?.querySelectorAll('tbody tr');
      return rows && rows.length > 0;
    }, { timeout: 15000 }).catch(() => {
      console.log('⚠️  Timeout waiting for data rows, continuing anyway...');
    });

    console.log('📊 Step 7: Extracting table data...');

    // Extract table data
    const tableData = await page.evaluate(() => {
      const results = [];
      const table = document.querySelector('table.table');

      if (!table) {
        return { error: 'Table not found' };
      }

      // Get all data rows
      const rows = table.querySelectorAll('tbody tr');

      rows.forEach((row) => {
        const cells = row.querySelectorAll('td');

        if (cells.length >= 4) {
          results.push({
            participantID: cells[0]?.textContent?.trim() || '',
            participantName: cells[1]?.textContent?.trim() || '',
            shareholding: cells[2]?.textContent?.trim() || '',
            percentage: cells[3]?.textContent?.trim() || '',
          });
        }
      });

      // Also get summary info if available
      const summaryInfo = {};
      const summaryRows = table.querySelectorAll('tfoot tr, .summary-row');

      summaryRows.forEach((row) => {
        const label = row.querySelector('th, .label')?.textContent?.trim();
        const value = row.querySelector('td, .value')?.textContent?.trim();
        if (label && value) {
          summaryInfo[label] = value;
        }
      });

      return {
        data: results,
        summary: summaryInfo,
        totalRecords: results.length,
      };
    });

    if (tableData.error) {
      throw new Error(tableData.error);
    }

    console.log(`✅ Successfully extracted ${tableData.totalRecords} participant records\n`);

    // Display sample data
    console.log('📋 Sample Data (first 5 records):');
    console.log('─'.repeat(120));
    console.log(
      'Participant ID'.padEnd(20) +
      'Participant Name'.padEnd(50) +
      'Shareholding'.padEnd(25) +
      'Percentage'
    );
    console.log('─'.repeat(120));

    tableData.data.slice(0, 5).forEach((row) => {
      console.log(
        row.participantID.padEnd(20) +
        row.participantName.padEnd(50) +
        row.shareholding.padEnd(25) +
        row.percentage
      );
    });
    console.log('─'.repeat(120));

    if (tableData.data.length > 5) {
      console.log(`... and ${tableData.data.length - 5} more records\n`);
    }

    // Export to CSV
    console.log('💾 Step 8: Exporting to CSV...');
    const csvHeaders = ['Participant ID', 'Participant Name', 'Shareholding', 'Percentage'];
    const csvRows = [
      csvHeaders.join(','),
      ...tableData.data.map(row =>
        [
          row.participantID,
          `"${row.participantName.replace(/"/g, '""')}"`,
          row.shareholding,
          row.percentage,
        ].join(',')
      ),
    ];

    const csvContent = csvRows.join('\n');
    const filename = `ccass_${stockCode}_${today.toISOString().split('T')[0]}.csv`;

    fs.writeFileSync(filename, csvContent, 'utf8');
    console.log(`✅ Saved to ${filename}\n`);

    // Export to JSON
    const jsonFilename = `ccass_${stockCode}_${today.toISOString().split('T')[0]}.json`;
    fs.writeFileSync(
      jsonFilename,
      JSON.stringify({
        stockCode,
        date: dateStr,
        scrapedAt: new Date().toISOString(),
        totalRecords: tableData.totalRecords,
        summary: tableData.summary,
        data: tableData.data,
      }, null, 2),
      'utf8'
    );
    console.log(`✅ Saved to ${jsonFilename}\n`);

    // Take screenshot for verification
    const screenshotPath = `ccass_${stockCode}_screenshot.png`;
    await page.screenshot({ path: screenshotPath, fullPage: true });
    console.log(`📸 Screenshot saved to ${screenshotPath}\n`);

    console.log('🎉 Scraping completed successfully!\n');

    return {
      success: true,
      stockCode,
      totalRecords: tableData.totalRecords,
      data: tableData.data,
      summary: tableData.summary,
      files: {
        csv: filename,
        json: jsonFilename,
        screenshot: screenshotPath,
      },
    };

  } catch (error) {
    console.error('\n❌ Error during scraping:', error.message);
    console.error(error.stack);

    // Take error screenshot
    const errorScreenshot = `error_${stockCode}_${Date.now()}.png`;
    try {
      const page = (await browser.pages())[0];
      if (page) {
        await page.screenshot({ path: errorScreenshot });
        console.log(`📸 Error screenshot saved to ${errorScreenshot}`);
      }
    } catch (e) {
      // Ignore screenshot errors
    }

    return {
      success: false,
      error: error.message,
    };

  } finally {
    await browser.close();
    console.log('🔒 Browser closed\n');
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  const stockCode = process.argv[2] || '00700';
  const headless = process.argv.includes('--headless');

  console.log('╔════════════════════════════════════════════════════════╗');
  console.log('║     HKEx CCASS Participant Shareholding Scraper       ║');
  console.log('╚════════════════════════════════════════════════════════╝\n');

  scrapeCCASSHoldings(stockCode, headless)
    .then((result) => {
      if (result.success) {
        console.log('╔════════════════════════════════════════════════════════╗');
        console.log('║                    SUCCESS SUMMARY                     ║');
        console.log('╚════════════════════════════════════════════════════════╝');
        console.log(`Stock Code:     ${result.stockCode}`);
        console.log(`Total Records:  ${result.totalRecords}`);
        console.log(`CSV File:       ${result.files.csv}`);
        console.log(`JSON File:      ${result.files.json}`);
        console.log(`Screenshot:     ${result.files.screenshot}`);
        console.log('');
      } else {
        console.log('❌ Scraping failed. Check error details above.');
        process.exit(1);
      }
    })
    .catch((error) => {
      console.error('Fatal error:', error);
      process.exit(1);
    });
}

export default scrapeCCASSHoldings;
