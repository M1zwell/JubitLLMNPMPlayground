/**
 * Finish remaining stock codes from batch scrape
 */

import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Remaining stock codes
const REMAINING_STOCKS = [6618, 6690, 6862, 9618, 9633, 9888, 9901, 9961, 9988, 9992, 9999];

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

function parseDate(dateStr) {
  const [day, month, year] = dateStr.split('/');
  return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
}

function generateHash(data) {
  const str = JSON.stringify(data);
  return crypto.createHash('sha256').update(str).digest('hex');
}

async function scrapeStock(browser, stockCode) {
  const formattedCode = stockCode.toString().padStart(5, '0');
  console.log(`\n${'='.repeat(70)}`);
  console.log(`🔍 Scraping stock: ${formattedCode}`);

  try {
    const page = await browser.newPage();

    await page.goto('https://di.hkex.com.hk/di/NSSrchCorp.aspx?src=MAIN&lang=EN&g_lang=en', {
      waitUntil: 'networkidle0',
      timeout: 60000
    });

    await page.type('input[id*="txtStockCode"]', stockCode.toString());
    await page.click('input[type="submit"][value="Search"]');
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 });

    const hasShareholdersList = await page.evaluate(() => {
      const link = Array.from(document.querySelectorAll('a')).find(
        el => el.textContent.includes('Complete list of substantial shareholders')
      );
      return !!link;
    });

    if (!hasShareholdersList) {
      console.log(`⚠️  No substantial shareholders found`);
      await page.close();
      return { success: true, stock_code: formattedCode, shareholders_found: 0, inserted: 0, skipped: true };
    }

    await page.evaluate(() => {
      const link = Array.from(document.querySelectorAll('a')).find(
        el => el.textContent.includes('Complete list of substantial shareholders')
      );
      if (link) link.click();
    });
    await page.waitForNavigation({ waitUntil: 'networkidle0', timeout: 60000 });

    const stockName = await page.evaluate(() => {
      const nameElement = Array.from(document.querySelectorAll('td')).find(
        el => el.previousElementSibling?.textContent?.includes('Name of listed corporation')
      );
      return nameElement?.textContent?.trim() || '';
    });

    console.log(`🏢 Stock Name: ${stockName}`);

    const shareholderData = await page.evaluate(() => {
      const data = [];
      const rows = document.querySelectorAll('tr');
      rows.forEach(row => {
        const cells = Array.from(row.querySelectorAll('td'));
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
        const { error } = await supabase.from('hkex_disclosure_interests').upsert({
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
        }, { onConflict: 'content_hash' });
        if (error) {
          console.error(`   ❌ Error: ${error.message}`);
          failed++;
        } else {
          inserted++;
        }
      } catch (err) {
        console.error(`   ❌ Error: ${err.message}`);
        failed++;
      }
    }

    console.log(`📊 Results: ${inserted} inserted, ${failed} failed`);
    await page.close();

    return { success: true, stock_code: formattedCode, stock_name: stockName, shareholders_found: shareholderData.length, inserted, failed };
  } catch (error) {
    console.error(`❌ Error: ${error.message}`);
    return { success: false, stock_code: formattedCode, error: error.message };
  }
}

async function main() {
  console.log('\n🚀 Completing remaining stocks...\n');
  const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });

  for (let i = 0; i < REMAINING_STOCKS.length; i++) {
    const stockCode = REMAINING_STOCKS[i];
    console.log(`[${i + 1}/${REMAINING_STOCKS.length}] Processing: ${stockCode}`);
    await scrapeStock(browser, stockCode);
    if (i < REMAINING_STOCKS.length - 1) {
      console.log('⏳ Waiting 3s...');
      await new Promise(r => setTimeout(r, 3000));
    }
  }

  await browser.close();
  console.log('\n✅ All remaining stocks completed!\n');
}

main().then(() => process.exit(0)).catch(err => { console.error(err); process.exit(1); });
