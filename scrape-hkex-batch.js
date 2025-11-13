/**
 * HKEX Disclosure of Interests Batch Scraper
 * Processes multiple stock codes with rate limiting and error handling
 */

import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import fs from 'fs';

const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Delay between stock code scrapes (in milliseconds)
const DELAY_BETWEEN_SCRAPES = 3000; // 3 seconds

// Stock codes to scrape
const STOCK_CODES = [
  1, 2, 3, 5, 6, 11, 12, 16, 27, 66, 101, 175, 241, 267, 285, 288, 291, 300,
  316, 322, 386, 388, 669, 688, 700, 728, 762, 823, 836, 857, 868, 881, 883,
  939, 941, 960, 968, 981, 992, 1024, 1038, 1044, 1088, 1093, 1099, 1109, 1113,
  1177, 1209, 1211, 1299, 1378, 1398, 1810, 1876, 1928, 1929, 1997, 2015, 2020,
  2057, 2269, 2313, 2318, 2319, 2331, 2359, 2382, 2388, 2618, 2628, 2688, 2899,
  3690, 3692, 3968, 3988, 6618, 6690, 6862, 9618, 9633, 9888, 9901, 9961, 9988,
  9992, 9999
];

// Parse shareholding string like "2,961,223,600(L)" or "804,859,700(L)\n0(S)\n"
function parseShareholding(text) {
  const result = {};
  const longMatch = text.match(/([\d,]+)\(L\)/);
  const shortMatch = text.match(/([\d,]+)\(S\)/);
  const lendingMatch = text.match(/([\d,]+)\(P\)/);

  if (longMatch) result.long = parseInt(longMatch[1].replace(/,/g, ''));
  if (shortMatch) result.short = parseInt(shortMatch[1].replace(/,/g, ''));
  if (lendingMatch) result.lending = parseInt(lendingMatch[1].replace(/,/g, ''));

  return result;
}

// Parse percentage string like "31.10(L)" or "8.42(L)\n0.00(S)\n"
function parsePercentage(text) {
  const result = {};
  const longMatch = text.match(/([\d.]+)\(L\)/);
  const shortMatch = text.match(/([\d.]+)\(S\)/);
  const lendingMatch = text.match(/([\d.]+)\(P\)/);

  if (longMatch) result.long = parseFloat(longMatch[1]);
  if (shortMatch) result.short = parseFloat(shortMatch[1]);
  if (lendingMatch) result.lending = parseFloat(lendingMatch[1]);

  return result;
}

// Parse date from DD/MM/YYYY format
function parseDate(dateStr) {
  const [day, month, year] = dateStr.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

// Generate content hash for deduplication
function generateHash(data) {
  const str = JSON.stringify(data);
  return crypto.createHash('sha256').update(str).digest('hex');
}

// Sleep function
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeStock(browser, stockCode) {
  const formattedCode = stockCode.toString().padStart(5, '0');
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🔍 Scraping stock: ${formattedCode}`);
  console.log('='.repeat(70));

  try {
    const page = await browser.newPage();

    // Navigate to search page
    await page.goto('https://di.hkex.com.hk/di/NSSrchCorp.aspx?src=MAIN&lang=EN&g_lang=en', {
      waitUntil: 'networkidle0',
      timeout: 60000
    });

    // Fill in stock code
    await page.type('input[id*="txtStockCode"]', stockCode.toString());

    // Click search button
    await page.click('input[type="submit"][value="Search"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 });

    // Check if "Complete list of substantial shareholders" link exists
    const hasShareholdersList = await page.evaluate(() => {
      const link = Array.from(document.querySelectorAll('a')).find(
        el => el.textContent.includes('Complete list of substantial shareholders')
      );
      return !!link;
    });

    if (!hasShareholdersList) {
      console.log(`⚠️  No substantial shareholders found for ${formattedCode}`);
      await page.close();
      return {
        success: true,
        stock_code: formattedCode,
        shareholders_found: 0,
        inserted: 0,
        skipped: true,
        reason: 'No substantial shareholders'
      };
    }

    // Click on "Complete list of substantial shareholders" link
    await page.evaluate(() => {
      const link = Array.from(document.querySelectorAll('a')).find(
        el => el.textContent.includes('Complete list of substantial shareholders')
      );
      if (link) link.click();
    });
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 });

    // Extract stock name
    const stockName = await page.evaluate(() => {
      const nameElement = Array.from(document.querySelectorAll('td')).find(
        el => el.previousElementSibling?.textContent?.includes('Name of listed corporation')
      );
      return nameElement?.textContent?.trim() || '';
    });

    console.log(`🏢 Stock Name: ${stockName}`);

    // Extract shareholder data from table
    const shareholderData = await page.evaluate(() => {
      const data = [];
      const rows = document.querySelectorAll('tr');

      rows.forEach(row => {
        const cells = Array.from(row.querySelectorAll('td'));

        // Check if this is a data row (has 5 cells for the shareholder table)
        if (cells.length >= 5) {
          const formSerialLink = cells[0]?.querySelector('a');
          const shareholderName = cells[1]?.textContent?.trim();
          const sharesText = cells[2]?.textContent?.trim();
          const percentageText = cells[3]?.textContent?.trim();
          const filingDateLink = cells[4]?.querySelector('a');

          if (formSerialLink && shareholderName && sharesText && percentageText && filingDateLink) {
            data.push({
              formSerialNumber: formSerialLink.textContent.trim(),
              shareholderName: shareholderName,
              sharesText: sharesText,
              percentageText: percentageText,
              filingDate: filingDateLink.textContent.trim(),
              noticeUrl: formSerialLink.href
            });
          }
        }
      });

      return data;
    });

    console.log(`✅ Found ${shareholderData.length} shareholders`);

    // Process and insert data
    let inserted = 0;
    let failed = 0;
    const today = new Date().toISOString().split('T')[0];

    for (const shareholder of shareholderData) {
      const shares = parseShareholding(shareholder.sharesText);
      const percentages = parsePercentage(shareholder.percentageText);

      try {
        const contentHash = generateHash({
          stock_code: formattedCode,
          form: shareholder.formSerialNumber,
          name: shareholder.shareholderName,
        });

        const { error } = await supabase
          .from('hkex_disclosure_interests')
          .upsert({
            stock_code: formattedCode,
            stock_name: stockName,
            form_serial_number: shareholder.formSerialNumber,
            shareholder_name: shareholder.shareholderName,
            shareholder_type: 'substantial_shareholder',
            shares_long: shares.long,
            shares_short: shares.short,
            shares_lending_pool: shares.lending,
            percentage_long: percentages.long,
            percentage_short: percentages.short,
            percentage_lending_pool: percentages.lending,
            filing_date: parseDate(shareholder.filingDate),
            notice_url: shareholder.noticeUrl,
            search_date: today,
            content_hash: contentHash,
          }, {
            onConflict: 'content_hash',
          });

        if (error) {
          console.error(`   ❌ Error inserting ${shareholder.shareholderName}:`, error.message);
          failed++;
        } else {
          inserted++;
        }
      } catch (err) {
        console.error(`   ❌ Error processing ${shareholder.shareholderName}:`, err.message);
        failed++;
      }
    }

    console.log(`📊 Results: ${inserted} inserted, ${failed} failed`);

    await page.close();

    return {
      success: true,
      stock_code: formattedCode,
      stock_name: stockName,
      shareholders_found: shareholderData.length,
      inserted,
      failed
    };

  } catch (error) {
    console.error(`❌ Error scraping ${formattedCode}:`, error.message);
    return {
      success: false,
      stock_code: formattedCode,
      error: error.message
    };
  }
}

async function batchScrape() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 HKEX Disclosure of Interests - Batch Scraper');
  console.log('='.repeat(70));
  console.log(`📋 Total stocks to scrape: ${STOCK_CODES.length}`);
  console.log(`⏱️  Delay between scrapes: ${DELAY_BETWEEN_SCRAPES}ms`);
  console.log('='.repeat(70));

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const results = [];
  const startTime = Date.now();

  for (let i = 0; i < STOCK_CODES.length; i++) {
    const stockCode = STOCK_CODES[i];
    const progress = `[${i + 1}/${STOCK_CODES.length}]`;

    console.log(`\n${progress} Processing stock code: ${stockCode}`);

    const result = await scrapeStock(browser, stockCode);
    results.push(result);

    // Save progress after each stock
    const progressData = {
      timestamp: new Date().toISOString(),
      processed: i + 1,
      total: STOCK_CODES.length,
      results: results
    };
    fs.writeFileSync('batch-scrape-progress.json', JSON.stringify(progressData, null, 2));

    // Delay before next scrape (except for the last one)
    if (i < STOCK_CODES.length - 1) {
      console.log(`⏳ Waiting ${DELAY_BETWEEN_SCRAPES}ms before next scrape...`);
      await sleep(DELAY_BETWEEN_SCRAPES);
    }
  }

  await browser.close();

  const endTime = Date.now();
  const duration = ((endTime - startTime) / 1000).toFixed(2);

  // Generate summary
  const successful = results.filter(r => r.success).length;
  const failed = results.filter(r => !r.success).length;
  const skipped = results.filter(r => r.skipped).length;
  const totalShareholders = results.reduce((sum, r) => sum + (r.shareholders_found || 0), 0);
  const totalInserted = results.reduce((sum, r) => sum + (r.inserted || 0), 0);

  console.log('\n' + '='.repeat(70));
  console.log('📊 BATCH SCRAPING COMPLETE');
  console.log('='.repeat(70));
  console.log(`✅ Successful: ${successful}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`⚠️  Skipped (no data): ${skipped}`);
  console.log(`👥 Total shareholders found: ${totalShareholders}`);
  console.log(`💾 Total records inserted: ${totalInserted}`);
  console.log(`⏱️  Total time: ${duration}s`);
  console.log(`⚡ Average time per stock: ${(duration / STOCK_CODES.length).toFixed(2)}s`);
  console.log('='.repeat(70));

  // Save final results
  const finalResults = {
    summary: {
      total_stocks: STOCK_CODES.length,
      successful,
      failed,
      skipped,
      total_shareholders: totalShareholders,
      total_inserted: totalInserted,
      duration_seconds: parseFloat(duration),
      completed_at: new Date().toISOString()
    },
    results
  };

  fs.writeFileSync('batch-scrape-results.json', JSON.stringify(finalResults, null, 2));
  console.log('\n📁 Results saved to: batch-scrape-results.json');
  console.log('📁 Progress log saved to: batch-scrape-progress.json');
}

// Run batch scraper
batchScrape().then(() => {
  console.log('\n✨ Batch scraping completed successfully!\n');
  process.exit(0);
}).catch(error => {
  console.error('\n❌ Batch scraping failed:', error);
  process.exit(1);
});
