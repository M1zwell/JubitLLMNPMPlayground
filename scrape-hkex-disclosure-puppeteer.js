/**
 * HKEX Disclosure of Interests Scraper using Puppeteer
 * This scraper works without requiring Firecrawl API
 */

import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

async function scrapeDisclosure(stockCode) {
  console.log(`\n🚀 Scraping HKEX Disclosure of Interests for stock ${stockCode}\n`);

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();

    // Navigate to search page
    console.log('📡 Navigating to HKEX disclosure search page...');
    await page.goto('https://di.hkex.com.hk/di/NSSrchCorp.aspx?src=MAIN&lang=EN&g_lang=en', {
      waitUntil: 'networkidle0'
    });

    // Fill in stock code
    console.log(`🔍 Searching for stock code: ${stockCode}`);
    await page.type('input[id*="txtStockCode"]', stockCode);

    // Click search button
    await page.click('input[type="submit"][value="Search"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Click on "Complete list of substantial shareholders" link
    console.log('📋 Getting complete list of substantial shareholders...');
    await page.evaluate(() => {
      const link = Array.from(document.querySelectorAll('a')).find(
        el => el.textContent.includes('Complete list of substantial shareholders')
      );
      if (link) link.click();
    });
    await page.waitForNavigation({ waitUntil: 'networkidle0' });

    // Extract stock name
    const stockName = await page.evaluate(() => {
      const nameElement = Array.from(document.querySelectorAll('td')).find(
        el => el.previousElementSibling?.textContent?.includes('Name of listed corporation')
      );
      return nameElement?.textContent?.trim() || '';
    });

    console.log(`🏢 Stock Name: ${stockName}\n`);

    // Extract shareholder data from table
    const shareholderData = await page.evaluate(() => {
      const data = [];
      const rows = document.querySelectorAll('tr');

      let currentRow = null;
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

    console.log(`✅ Found ${shareholderData.length} shareholders:\n`);

    // Process and insert data
    let inserted = 0;
    let updated = 0;
    let failed = 0;

    const today = new Date().toISOString().split('T')[0];

    for (let i = 0; i < shareholderData.length; i++) {
      const shareholder = shareholderData[i];

      const shares = parseShareholding(shareholder.sharesText);
      const percentages = parsePercentage(shareholder.percentageText);

      console.log(`${i + 1}. ${shareholder.shareholderName}`);
      console.log(`   Shares (L): ${shares.long?.toLocaleString() || 'N/A'}`);
      console.log(`   Percentage (L): ${percentages.long?.toFixed(2) || 'N/A'}%`);
      console.log(`   Filing Date: ${shareholder.filingDate}`);
      console.log('');

      try {
        const contentHash = generateHash({
          stock_code: stockCode,
          form: shareholder.formSerialNumber,
          name: shareholder.shareholderName,
        });

        const { error } = await supabase
          .from('hkex_disclosure_interests')
          .upsert({
            stock_code: stockCode.padStart(5, '0'),
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
          console.error(`❌ Error inserting ${shareholder.shareholderName}:`, error);
          failed++;
        } else {
          inserted++;
        }
      } catch (err) {
        console.error(`❌ Error processing ${shareholder.shareholderName}:`, err);
        failed++;
      }
    }

    console.log('\n' + '='.repeat(70));
    console.log(`✅ Scraping Complete!`);
    console.log(`   Stock: ${stockCode} - ${stockName}`);
    console.log(`   Shareholders Found: ${shareholderData.length}`);
    console.log(`   Records Inserted: ${inserted}`);
    console.log(`   Records Updated: ${updated}`);
    console.log(`   Failures: ${failed}`);
    console.log('='.repeat(70));

    return {
      success: true,
      stock_code: stockCode,
      stock_name: stockName,
      shareholders_found: shareholderData.length,
      inserted,
      updated,
      failed,
      data: shareholderData
    };

  } catch (error) {
    console.error('❌ Error during scraping:', error);
    return {
      success: false,
      error: error.message
    };
  } finally {
    await browser.close();
  }
}

// Test with stock code from command line or default to 00700
const stockCode = process.argv[2] || '00700';
scrapeDisclosure(stockCode).then(result => {
  console.log('\n📊 Final Result:', JSON.stringify(result, null, 2));
  process.exit(result.success ? 0 : 1);
});
