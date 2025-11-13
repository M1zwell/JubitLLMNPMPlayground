/**
 * HKEX CCASS Holdings Scraper - Adapted for existing Supabase table
 * Compatible with current hkex_ccass_holdings table structure
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const crypto = require('crypto');
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function scrapeCCASSHoldings(stockCode, date, saveToSupabase = false) {
  console.log(`\n🔍 Scraping CCASS holdings for ${stockCode} on ${date}...`);

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1280, height: 2000 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    console.log('📡 Navigating to HKEX CCASS page...');
    await page.goto('https://www3.hkexnews.hk/sdw/search/searchsdw.aspx', {
      waitUntil: 'networkidle0',
      timeout: 60000
    });

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Fill form
    console.log(`📝 Filling form with stock code: ${stockCode}, date: ${date}`);

    await page.waitForSelector('input[name="txtStockCode"]', { visible: true });
    await page.click('input[name="txtStockCode"]', { clickCount: 3 });
    await page.keyboard.press('Backspace');
    await page.type('input[name="txtStockCode"]', stockCode, { delay: 100 });

    await page.evaluate((dateValue) => {
      const dateInput = document.querySelector('input[name="txtShareholdingDate"]');
      if (dateInput) {
        dateInput.value = dateValue;
        dateInput.dispatchEvent(new Event('change', { bubbles: true }));
      }
    }, date);

    console.log('🔘 Clicking SEARCH button...');
    await new Promise(resolve => setTimeout(resolve, 1000));

    await page.evaluate(() => {
      const searchButton = document.querySelector('#btnSearch');
      if (searchButton) searchButton.click();
    });

    console.log('⏳ Waiting for results...');
    try {
      await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 30000 });
    } catch (e) {
      console.log('ℹ️  Checking for results...');
    }

    await new Promise(resolve => setTimeout(resolve, 3000));

    // Check for no data
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

    // Extract CCASS data
    const ccassData = await page.evaluate(() => {
      const data = {
        stockCode: null,
        stockName: null,
        date: null,
        participants: [],
        totalShares: null,
        totalParticipants: null
      };

      // Extract stock info
      const stockCodeEl = document.querySelector('input[name="txtStockCode"]');
      if (stockCodeEl) data.stockCode = stockCodeEl.value;

      const stockNameEl = document.querySelector('input[name="txtStockName"]');
      if (stockNameEl && stockNameEl.value) {
        data.stockName = stockNameEl.value;
      }

      const dateEl = document.querySelector('input[name="txtShareholdingDate"]');
      if (dateEl) data.date = dateEl.value;

      // Find the participant table
      const tables = document.querySelectorAll('table');

      for (let table of tables) {
        const rows = Array.from(table.querySelectorAll('tr'));
        if (rows.length < 2) continue;

        const firstRowText = rows[0].textContent;

        if (firstRowText.includes('Participant ID') &&
            firstRowText.includes('Name of CCASS Participant') &&
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
                  percentage: percentage.replace('%', '')
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

    console.log('\n✅ Scraping completed!');
    console.log(`📊 Stock: ${ccassData.stockName || ccassData.stockCode}`);
    console.log(`📊 Extracted ${ccassData.participants.length} participant records`);

    if (ccassData.participants.length > 0) {
      console.log(`\nTop 5 participants:`);
      ccassData.participants.slice(0, 5).forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.participantId} - ${p.participantName}`);
        console.log(`     Shareholding: ${p.shareholdingFormatted} (${p.percentage}%)`);
      });
    }

    const result = {
      ...ccassData,
      date: ccassData.date || date,
      success: ccassData.participants.length > 0,
      scrapedAt: new Date().toISOString()
    };

    // Save to Supabase if requested
    if (saveToSupabase && result.success) {
      console.log('\n💾 Saving to Supabase...');
      await saveToSupabaseDB(result);
    }

    return result;

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

async function saveToSupabaseDB(ccassData) {
  try {
    // Prepare records adapted to existing table structure (WITHOUT address field)
    const records = ccassData.participants.map(p => {
      // Generate content hash for deduplication
      const contentString = `${ccassData.stockCode}|${p.participantId}|${p.shareholding}|${p.percentage}`;
      const contentHash = crypto.createHash('sha256').update(contentString).digest('hex');

      const record = {
        stock_code: ccassData.stockCode,
        participant_id: p.participantId,
        participant_name: p.participantName,
        shareholding: p.shareholding,
        percentage: p.percentage,
        content_hash: contentHash,
        scraped_at: ccassData.scrapedAt
      };

      return record;
    });

    // Insert in batches
    const batchSize = 100;
    let inserted = 0;
    let updated = 0;

    for (let i = 0; i < records.length; i += batchSize) {
      const batch = records.slice(i, i + batchSize);

      const { data, error } = await supabase
        .from('hkex_ccass_holdings')
        .upsert(batch, {
          onConflict: 'content_hash',
          ignoreDuplicates: false
        })
        .select();

      if (error) {
        console.error(`❌ Supabase error on batch ${i / batchSize + 1}:`, error.message);
      } else {
        const batchInserted = data ? data.length : batch.length;
        inserted += batchInserted;
        console.log(`✅ Processed batch ${Math.floor(i / batchSize) + 1}: ${batchInserted} records`);
      }
    }

    console.log(`✅ Total saved to Supabase: ${inserted} records`);
    return true;

  } catch (error) {
    console.error('❌ Supabase save error:', error.message);
    return false;
  }
}

async function scrapeMultipleDates(stockCode, dates, saveToSupabase = false) {
  const results = [];

  for (const date of dates) {
    const data = await scrapeCCASSHoldings(stockCode, date, saveToSupabase);
    results.push(data);

    if (dates.indexOf(date) < dates.length - 1) {
      console.log('\n⏸️  Waiting 3 seconds before next request...\n');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  return results;
}

function exportToCSV(results, filename) {
  console.log('\n📄 Exporting to CSV...');

  const allParticipants = [];

  results.forEach(result => {
    if (result.success && result.participants) {
      result.participants.forEach(p => {
        allParticipants.push({
          date: result.date,
          stock_code: result.stockCode,
          stock_name: result.stockName,
          participant_id: p.participantId,
          participant_name: p.participantName,
          address: p.address,
          shareholding: p.shareholding,
          percentage: p.percentage,
          scraped_at: result.scrapedAt
        });
      });
    }
  });

  if (allParticipants.length === 0) {
    console.log('⚠️  No data to export');
    return;
  }

  const headers = ['Date', 'Stock Code', 'Stock Name', 'Participant ID', 'Participant Name', 'Address', 'Shareholding', 'Percentage', 'Scraped At'];
  const csvRows = [headers.join(',')];

  allParticipants.forEach(p => {
    const row = [
      p.date,
      p.stock_code,
      `"${p.stock_name || ''}"`,
      p.participant_id,
      `"${p.participant_name.replace(/"/g, '""')}"`,
      `"${p.address.replace(/"/g, '""')}"`,
      p.shareholding,
      p.percentage,
      p.scraped_at
    ];
    csvRows.push(row.join(','));
  });

  fs.writeFileSync(filename, csvRows.join('\n'));
  console.log(`✅ CSV exported: ${filename} (${allParticipants.length} records)`);
}

// Main execution
(async () => {
  const stockCode = process.argv[2] || '00700';
  const startDate = process.argv[3] || '2025/11/08';
  const endDate = process.argv[4] || startDate;
  const saveToSupabase = process.argv[5] === '--supabase';

  // Generate date range
  const dates = [];
  const start = new Date(startDate.replace(/\//g, '-'));
  const end = new Date(endDate.replace(/\//g, '-'));

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const formatted = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}/${String(d.getDate()).padStart(2, '0')}`;
    dates.push(formatted);
  }

  console.log('🚀 HKEX CCASS Holdings Scraper - ADAPTED');
  console.log('==========================================\n');
  console.log(`Stock Code: ${stockCode}`);
  console.log(`Date Range: ${startDate} to ${endDate}`);
  console.log(`Dates: ${dates.join(', ')}`);
  console.log(`Supabase: ${saveToSupabase ? 'YES' : 'NO'}\n`);

  const results = await scrapeMultipleDates(stockCode, dates, saveToSupabase);

  console.log('\n\n📋 FINAL RESULTS');
  console.log('=================\n');

  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);

  console.log(`✅ Successful: ${successful.length}`);
  console.log(`❌ Failed: ${failed.length}\n`);

  const totalParticipants = successful.reduce((sum, r) => sum + (r.participants?.length || 0), 0);
  console.log(`📊 Total participant records: ${totalParticipants}\n`);

  // Save JSON
  const jsonFilename = `ccass-adapted-${stockCode}-${start.getFullYear()}${String(start.getMonth() + 1).padStart(2, '0')}${String(start.getDate()).padStart(2, '0')}.json`;
  fs.writeFileSync(jsonFilename, JSON.stringify(results, null, 2));
  console.log(`💾 JSON saved: ${jsonFilename}`);

  // Export CSV
  const csvFilename = `ccass-adapted-${stockCode}-${start.getFullYear()}${String(start.getMonth() + 1).padStart(2, '0')}${String(start.getDate()).padStart(2, '0')}.csv`;
  exportToCSV(results, csvFilename);

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
