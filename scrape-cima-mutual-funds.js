import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TARGET_TOTAL = 1800;

// All Mutual Fund categories from CIMA
const mutualFundCategories = [
  'Mutual Fund - Administered',
  'Mutual Fund - Licenced',
  'Mutual Fund - Limited Investor',
  'Mutual Fund - Master Fund',
  'Mutual Fund - Registered',
  'Mutual Fund Administrator - Full',
  'Mutual Fund Administrator - Restricted'
];

async function getCurrentCount() {
  const { count } = await supabase
    .from('cima_entities')
    .select('*', { count: 'exact', head: true });

  return count || 0;
}

async function scrapeCategory(page, category) {
  console.log(`\n📋 Scraping: ${category}...`);

  try {
    await page.goto('https://www.cima.ky/search-entities-cima', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    console.log('  ✓ Loaded search page');

    // Wait for dropdown
    await page.waitForSelector('select[name="AuthorizationType"]', { timeout: 10000 });

    // Select category
    await page.select('select[name="AuthorizationType"]', category);
    console.log(`  ✓ Selected: ${category}`);

    await new Promise(resolve => setTimeout(resolve, 1000));

    // Submit form
    await page.evaluate(() => {
      const button = document.querySelector('button[type="submit"]') ||
                     document.querySelector('input[type="submit"]') ||
                     document.querySelector('.btn-primary');
      if (button) button.click();
    });

    console.log('  ✓ Submitted form');

    // Wait for results
    await new Promise(resolve => setTimeout(resolve, 7000));

    // Extract all table data
    const entities = await page.evaluate(() => {
      const results = [];
      const tables = document.querySelectorAll('table');

      tables.forEach(table => {
        const rows = Array.from(table.querySelectorAll('tbody tr'));

        rows.forEach(row => {
          const cells = Array.from(row.querySelectorAll('td'));
          if (cells.length >= 2) {
            const entity = {
              entity_name: cells[0]?.textContent?.trim() || '',
              license_number: cells[1]?.textContent?.trim() || '',
              license_status: cells[2]?.textContent?.trim() || 'Active',
              address: cells[3]?.textContent?.trim() || '',
              contact_info: cells[4]?.textContent?.trim() || ''
            };

            if (entity.entity_name && entity.entity_name.length > 2) {
              results.push(entity);
            }
          }
        });
      });

      return results;
    });

    console.log(`  ✓ Extracted ${entities.length} entities`);

    return entities.map(e => ({
      ...e,
      entity_type: category,
      entity_category: 'Mutual Funds',
      jurisdiction: 'Cayman Islands'
    }));

  } catch (error) {
    console.error(`  ❌ Error scraping ${category}:`, error.message);
    return [];
  }
}

async function insertEntities(entities) {
  if (entities.length === 0) {
    return { inserted: 0, failed: 0 };
  }

  console.log(`\n💾 Inserting ${entities.length} entities...`);

  let inserted = 0;
  let failed = 0;

  for (const entity of entities) {
    try {
      const { error } = await supabase
        .from('cima_entities')
        .insert({
          entity_name: entity.entity_name,
          entity_type: entity.entity_type,
          entity_category: entity.entity_category,
          license_number: entity.license_number,
          license_status: entity.license_status,
          address: entity.address,
          jurisdiction: entity.jurisdiction,
          additional_info: {
            contact_info: entity.contact_info || null,
            scraped_source: 'cima.ky',
            scraped_method: 'puppeteer',
            scraped_date: new Date().toISOString()
          },
          scraped_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        if (error.message.includes('duplicate') || error.message.includes('unique')) {
          // Update existing
          const { error: updateError } = await supabase
            .from('cima_entities')
            .update({
              license_status: entity.license_status,
              address: entity.address,
              updated_at: new Date().toISOString()
            })
            .eq('entity_name', entity.entity_name)
            .eq('entity_type', entity.entity_type);

          if (!updateError) inserted++;
          else failed++;
        } else {
          failed++;
        }
      } else {
        inserted++;
        if (inserted % 50 === 0) {
          console.log(`  ... ${inserted} processed`);
        }
      }
    } catch (err) {
      failed++;
    }

    await new Promise(resolve => setTimeout(resolve, 50));
  }

  console.log(`\n  ✅ Inserted/Updated: ${inserted}`);
  console.log(`  ❌ Failed: ${failed}`);

  return { inserted, failed };
}

async function main() {
  console.log('🚀 CIMA Mutual Funds Scraper\n');
  console.log('='.repeat(60));
  console.log(`Target: CIMA Mutual Fund Categories`);
  console.log(`Categories: ${mutualFundCategories.length}`);
  console.log(`Stop at: ${TARGET_TOTAL} total entities`);
  console.log('='.repeat(60));

  let browser;
  let allEntities = [];

  try {
    // Check current count
    const currentCount = await getCurrentCount();
    console.log(`\n📊 Current CIMA entities in database: ${currentCount}`);

    if (currentCount >= TARGET_TOTAL) {
      console.log(`✅ Already at target of ${TARGET_TOTAL} entities. Skipping scrape.`);
      return;
    }

    const remaining = TARGET_TOTAL - currentCount;
    console.log(`📈 Need to add: ${remaining} more entities\n`);

    console.log('🌐 Launching browser...');

    browser = await puppeteer.launch({
      headless: false,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage'
      ]
    });

    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');

    console.log('✓ Browser launched\n');

    // Scrape each category
    for (let i = 0; i < mutualFundCategories.length; i++) {
      // Check if we've reached the target
      const currentTotal = await getCurrentCount();
      if (currentTotal >= TARGET_TOTAL) {
        console.log(`\n🎯 Reached target of ${TARGET_TOTAL} entities. Stopping.`);
        break;
      }

      const category = mutualFundCategories[i];
      console.log(`[${i + 1}/${mutualFundCategories.length}] Processing: ${category}`);
      console.log(`  Current total: ${currentTotal}/${TARGET_TOTAL}`);

      const entities = await scrapeCategory(page, category);

      if (entities.length > 0) {
        // Check if adding these would exceed target
        const newTotal = currentTotal + entities.length;
        let entitiesToAdd = entities;

        if (newTotal > TARGET_TOTAL) {
          const excess = newTotal - TARGET_TOTAL;
          entitiesToAdd = entities.slice(0, entities.length - excess);
          console.log(`  ⚠️ Limiting to ${entitiesToAdd.length} entities to stay at ${TARGET_TOTAL}`);
        }

        allEntities = allEntities.concat(entitiesToAdd);
        await insertEntities(entitiesToAdd);

        // Check again after insert
        const afterInsert = await getCurrentCount();
        if (afterInsert >= TARGET_TOTAL) {
          console.log(`\n🎯 Reached target of ${TARGET_TOTAL} entities. Stopping.`);
          break;
        }
      }

      // Delay
      if (i < mutualFundCategories.length - 1) {
        console.log('  ⏳ Waiting 3 seconds...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    const finalCount = await getCurrentCount();

    console.log('\n' + '='.repeat(60));
    console.log('📊 CIMA MUTUAL FUNDS SCRAPING COMPLETE!');
    console.log('='.repeat(60));
    console.log(`Entities scraped this session: ${allEntities.length}`);
    console.log(`Total CIMA entities in database: ${finalCount}`);
    console.log(`Target: ${TARGET_TOTAL}`);
    console.log(`Status: ${finalCount >= TARGET_TOTAL ? '✅ COMPLETE' : '⚠️ INCOMPLETE'}`);
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
  } finally {
    if (browser) {
      await browser.close();
      console.log('\n✓ Browser closed');
    }
  }

  console.log('\n✅ CIMA scraping complete!');
}

main();
