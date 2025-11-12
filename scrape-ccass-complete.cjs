/**
 * HKEX CCASS Holdings Scraper - COMPLETE VERSION
 * Extracts full participant details with CSV export and Supabase integration
 */

const puppeteer = require('puppeteer');
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Supabase configuration
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function scrapeCCASSHoldings(stockCode, date, saveToSupabase = false) {
  console.log(`\n🔍 Scraping CCASS holdings for ${stockCode} on ${date}...`);

  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: { width: 1280, height: 2000 }, // Taller viewport to see more of table
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

    // Check for no data message
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

    // Extract CCASS data with detailed participant information
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

      // Extract stock info
      const stockCodeEl = document.querySelector('input[name="txtStockCode"]');
      if (stockCodeEl) data.stockCode = stockCodeEl.value;

      const stockNameEl = document.querySelector('input[name="txtStockName"]');
      if (stockNameEl && stockNameEl.value) {
        data.stockName = stockNameEl.value;
      }

      const dateEl = document.querySelector('input[name="txtShareholdingDate"]');
      if (dateEl) data.date = dateEl.value;

      // Extract summary data
      const bodyText = document.body.innerText;
      const totalMatch = bodyText.match(/Total\s+([\d,]+)\s+(\d+)\s+([\d.]+%)/);
      if (totalMatch) {
        data.totalShares = totalMatch[1].replace(/,/g, '');
        data.totalParticipants = parseInt(totalMatch[2]);
        data.percentageInCCASS = totalMatch[3];
      }

      // Find the detailed participant table
      const tables = document.querySelectorAll('table');

      for (let table of tables) {
        const rows = Array.from(table.querySelectorAll('tr'));
        if (rows.length < 2) continue;

        // Check for the participant detail table header
        const firstRowText = rows[0].textContent;

        if (firstRowText.includes('Participant ID') &&
            firstRowText.includes('Name of CCASS Participant') &&
            firstRowText.includes('Address') &&
            firstRowText.includes('Shareholding')) {

          console.log('Found detailed participant table with', rows.length - 1, 'data rows');

          // Parse each data row (skip header row 0)
          for (let i = 1; i < rows.length; i++) {
            const row = rows[i];
            const cells = Array.from(row.querySelectorAll('td'));

            if (cells.length >= 4) {
              // Each cell contains "Label:\nValue", so split and take the value part
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

              // Validate this is real data
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

          // If we found participants, stop searching other tables
          if (data.participants.length > 0) {
            break;
          }
        }
      }

      return data;
    });

    console.log('\n✅ Scraping completed!');
    console.log(`📊 Stock: ${ccassData.stockName || ccassData.stockCode}`);
    console.log(`📊 Total Participants: ${ccassData.totalParticipants || 'Unknown'}`);
    console.log(`📊 Extracted ${ccassData.participants.length} participant records`);

    if (ccassData.participants.length > 0) {
      console.log(`\nTop 5 participants:`);
      ccassData.participants.slice(0, 5).forEach((p, i) => {
        console.log(`  ${i + 1}. ${p.participantId} - ${p.participantName}`);
        console.log(`     ${p.address}`);
        console.log(`     Shareholding: ${p.shareholdingFormatted} (${p.percentage})`);
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
    // Prepare records for database
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

    // Insert in batches of 100
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
        console.error(`❌ Supabase error on batch ${i / batchSize + 1}:`, error.message);
      } else {
        inserted += batch.length;
        console.log(`✅ Inserted batch ${i / batchSize + 1}: ${batch.length} records`);
      }
    }

    console.log(`✅ Total inserted to Supabase: ${inserted} records`);
    return true;

  } catch (error) {
    console.error('❌ Supabase save error:', error.message);
    return false;
  }
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

  // Create CSV header
  const headers = ['Date', 'Stock Code', 'Stock Name', 'Participant ID', 'Participant Name', 'Address', 'Shareholding', 'Percentage', 'Scraped At'];
  const csvRows = [headers.join(',')];

  // Add data rows
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

// Main execution
(async () => {
  const stockCode = process.argv[2] || '00700';
  const startDate = process.argv[3] || '2024/10/01';
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

  console.log('🚀 HKEX CCASS Holdings Scraper - COMPLETE');
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

  // Count total participants extracted
  const totalParticipants = successful.reduce((sum, r) => sum + (r.participants?.length || 0), 0);
  console.log(`📊 Total participant records: ${totalParticipants}\n`);

  // Save JSON
  const jsonFilename = `ccass-${stockCode}-${start.getFullYear()}${String(start.getMonth() + 1).padStart(2, '0')}${String(start.getDate()).padStart(2, '0')}.json`;
  fs.writeFileSync(jsonFilename, JSON.stringify(results, null, 2));
  console.log(`💾 JSON saved: ${jsonFilename}`);

  // Export CSV
  const csvFilename = `ccass-${stockCode}-${start.getFullYear()}${String(start.getMonth() + 1).padStart(2, '0')}${String(start.getDate()).padStart(2, '0')}.csv`;
  exportToCSV(results, csvFilename);

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
