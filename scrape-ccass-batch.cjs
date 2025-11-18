/**
 * HKEX CCASS Batch Scraper
 * Scrapes multiple stock codes across date ranges
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function scrapeCCASSHoldings(browser, stockCode, date) {
  const page = await browser.newPage();

  try {
    await page.goto('https://www3.hkexnews.hk/sdw/search/searchsdw.aspx', {
      waitUntil: 'networkidle0',
      timeout: 60000
    });

    // Accept cookies if present
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      const acceptButton = await page.$('button');
      if (acceptButton) {
        const text = await page.evaluate(el => el.textContent, acceptButton);
        if (text && text.includes('Accept')) {
          await acceptButton.click();
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (e) {}

    // Fill form
    await page.waitForSelector('input[name="txtStockCode"]', { visible: true });
    await page.click('input[name="txtStockCode"]', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type('input[name="txtStockCode"]', stockCode, { delay: 50 });

    await page.evaluate((dateValue) => {
      const dateInput = document.querySelector('input[name="txtShareholdingDate"]');
      if (dateInput) {
        dateInput.value = dateValue;
        dateInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, date);

    await new Promise(resolve => setTimeout(resolve, 500));

    await page.evaluate(() => {
      const searchButton = document.querySelector('#btnSearch');
      if (searchButton) searchButton.click();
    });

    try {
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 20000 });
    } catch (e) {}

    await new Promise(resolve => setTimeout(resolve, 2000));

    const pageText = await page.evaluate(() => document.body.innerText);

    if (pageText.includes('No data is available') || pageText.includes('No Record Found')) {
      return {
        stockCode,
        date,
        participants: [],
        message: 'No data available',
        success: false
      };
    }

    const ccassData = await page.evaluate(() => {
      const data = {
        stockCode: null,
        stockName: null,
        date: null,
        participants: [],
        totalShares: null,
        totalParticipants: null,
        percentageInCCASS: null
      };

      const stockCodeEl = document.querySelector('input[name="txtStockCode"]');
      if (stockCodeEl) data.stockCode = stockCodeEl.value;

      const stockNameEl = document.querySelector('input[name="txtStockName"]');
      if (stockNameEl && stockNameEl.value) {
        data.stockName = stockNameEl.value;
      }

      const dateEl = document.querySelector('input[name="txtShareholdingDate"]');
      if (dateEl) data.date = dateEl.value;

      const bodyText = document.body.innerText;
      const totalMatch = bodyText.match(/Total\s+([\d,]+)\s+(\d+)\s+([\d.]+%)/);
      if (totalMatch) {
        data.totalShares = totalMatch[1].replace(/,/g, '');
        data.totalParticipants = parseInt(totalMatch[2]);
        data.percentageInCCASS = totalMatch[3];
      }

      const tables = document.querySelectorAll('table');

      for (let table of tables) {
        const rows = Array.from(table.querySelectorAll('tr'));
        if (rows.length < 2) continue;

        const firstRowText = rows[0].textContent;

        if (firstRowText.includes('Participant ID') &&
            firstRowText.includes('Name of CCASS Participant') &&
            firstRowText.includes('Address') &&
            firstRowText.includes('Shareholding')) {

          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const cells = Array.from(row.querySelectorAll('td'));

            if (cells.length >= 4) {
              const getCellValue = (cell) => {
                const text = cell?.textContent.trim() || '';
                const parts = text.split('\n');
                return parts.length > 1 ? parts[parts.length - 1].trim() : text;
              };

              const participantId = getCellValue(cells[0]);
              const participantName = getCellValue(cells[1]);
              const address = getCellValue(cells[2]);
              const shareholding = getCellValue(cells[3]);
              const percentage = getCellValue(cells[4]);

              if (participantId && participantId.match(/^[A-Z0-9*]+$/) &&
                  participantName.length > 2 &&
                  shareholding.match(/[\d,]+/)) {

                data.participants.push({
                  participantId: participantId,
                  participantName: participantName,
                  address: address,
                  shareholding: shareholding.replace(/,/g, ''),
                  shareholdingFormatted: shareholding,
                  percentage: percentage
                });
              }
            }
          }

          if (data.participants.length > 0) {
            break;
          }
        }
      }

      return data;
    });

    return {
      ...ccassData,
      date: ccassData.date || date,
      success: ccassData.participants.length > 0,
      scrapedAt: new Date().toISOString()
    };

  } catch (error) {
    return {
      stockCode,
      date,
      error: error.message,
      success: false
    };
  } finally {
    await page.close();
  }
}

async function saveToSupabaseDB(ccassData) {
  try {
    const records = ccassData.participants.map(p => ({
      stock_code: ccassData.stockCode,
      stock_name: ccassData.stockName,
      shareholding_date: ccassData.date,
      participant_id: p.participantId,
      participant_name: p.participantName,
      address: p.address,
      shareholding: parseInt(p.shareholding),
      percentage: parseFloat(p.percentage.replace('%', '')),
      scraped_at: ccassData.scrapedAt
    }));

    const batchSize = 100;
    let inserted = 0;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);

      const { error } = await supabase
        .from('hkex_ccass_holdings')
        .upsert(batch, {
          onConflict: 'stock_code,shareholding_date,participant_id'
        });

      if (error) {
        console.error(`  ❌ Supabase error: ${error.message}`);
      } else {
        inserted += batch.length;
      }
    }

    return inserted;

  } catch (error) {
    console.error(`  ❌ Supabase save error: ${error.message}`);
    return 0;
  }
}

async function batchScrape(stockCodes, dates, saveToSupabase = true) {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1280, height: 2000 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const results = {
    successful: 0,
    failed: 0,
    totalParticipants: 0,
    totalRecords: 0,
    details: []
  };

  const totalOperations = stockCodes.length * dates.length;
  let completed = 0;

  console.log(`\n🚀 Starting batch scrape: ${stockCodes.length} stocks × ${dates.length} dates = ${totalOperations} operations\n`);

  for (const stockCode of stockCodes) {
    for (const date of dates) {
      completed++;
      const progress = `[${completed}/${totalOperations}]`;

      console.log(`${progress} 🔍 ${stockCode} @ ${date}...`);

      const data = await scrapeCCASSHoldings(browser, stockCode, date);

      if (data.success) {
        results.successful++;
        results.totalParticipants += data.participants.length;

        console.log(`${progress} ✅ ${stockCode}: ${data.participants.length} participants`);

        if (saveToSupabase) {
          const inserted = await saveToSupabaseDB(data);
          results.totalRecords += inserted;
          console.log(`${progress} 💾 Saved ${inserted} records to Supabase`);
        }
      } else {
        results.failed++;
        console.log(`${progress} ⚠️  ${stockCode}: ${data.message || data.error || 'No data'}`);
      }

      results.details.push({
        stockCode,
        date,
        success: data.success,
        participants: data.participants?.length || 0,
        stockName: data.stockName
      });

      // Rate limiting
      if (completed < totalOperations) {
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }
  }

  await browser.close();

  return results;
}

// Main execution
(async () => {
  const args = process.argv.slice(2);

  // Parse stock codes from command line or use default list
  let stockCodes = [];
  let startDate = '2025/11/10';
  let endDate = '2025/11/11';

  if (args.length > 0 && args[0].includes(',')) {
    stockCodes = args[0].split(',').map(s => s.trim().padStart(5, '0'));
    if (args[1]) startDate = args[1];
    if (args[2]) endDate = args[2];
  } else if (args.length >= 1) {
    // Read from file
    const stockCodesInput = args[0];
    startDate = args[1] || startDate;
    endDate = args[2] || endDate;

    if (fs.existsSync(stockCodesInput)) {
      const content = fs.readFileSync(stockCodesInput, 'utf-8');
      stockCodes = content.split(/[\n,\s]+/)
        .map(s => s.trim())
        .filter(s => s && s.match(/^\d+$/))
        .map(s => s.padStart(5, '0'));
    }
  }

  // Generate date range
  const dates = [];
  const start = new Date(startDate.replace(/\//g, '-'));
  const end = new Date(endDate.replace(/\//g, '-'));

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const formatted = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
    dates.push(formatted);
  }

  console.log('🚀 HKEX CCASS Batch Scraper');
  console.log('============================\n');
  console.log(`Stock Codes: ${stockCodes.length} stocks`);
  console.log(`Date Range: ${startDate} to ${endDate} (${dates.length} dates)`);
  console.log(`Total Operations: ${stockCodes.length * dates.length}\n`);

  const startTime = Date.now();
  const results = await batchScrape(stockCodes, dates, true);
  const duration = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  console.log('\n\n📋 BATCH SCRAPE RESULTS');
  console.log('========================\n');
  console.log(`✅ Successful: ${results.successful}`);
  console.log(`❌ Failed: ${results.failed}`);
  console.log(`📊 Total participants extracted: ${results.totalParticipants}`);
  console.log(`💾 Total records saved to Supabase: ${results.totalRecords}`);
  console.log(`⏱️  Duration: ${duration} minutes\n`);

  // Save summary
  const summaryFile = `ccass-batch-summary-${Date.now()}.json`;
  fs.writeFileSync(summaryFile, JSON.stringify(results, null, 2));
  console.log(`📄 Summary saved to: ${summaryFile}`);

  process.exit(0);
})();
