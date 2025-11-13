import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function generateContentHash(entityName, licenseNumber, entityType) {
  const hash = crypto.createHash('sha256');
  hash.update(`${entityName}||${licenseNumber || 'NONE'}||${entityType}`);
  return hash.digest('hex');
}

// All CIMA entity types to scrape
const entityTypes = [
  'Banking Class A',
  'Banking Class B',
  'Banking Class C',
  'Trust',
  'Insurance Class A',
  'Insurance Class B',
  'Insurance Class C',
  'Investment Business',
  'Money Services',
  'Virtual Asset',
  'Fund Administrator',
  'Registered Agent',
  'Insolvency Practitioner'
];

async function scrapeEntityType(page, entityType) {
  console.log(`\n📋 Scraping: ${entityType}...`);

  try {
    // Navigate to search page
    await page.goto('https://www.cima.ky/search-entities-cima', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    console.log('  ✓ Loaded search page');

    // Wait for the form to be ready
    await page.waitForSelector('select[name="AuthorizationType"]', { timeout: 10000 });

    // Select entity type from dropdown
    await page.select('select[name="AuthorizationType"]', entityType);
    console.log(`  ✓ Selected: ${entityType}`);

    // Wait a bit for any dynamic content
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Find and click submit button
    const submitButton = await page.$('button[type="submit"], input[type="submit"], button.btn-primary, input.btn-primary');

    if (!submitButton) {
      console.log('  ⚠️ Submit button not found, trying form submit');
      await page.evaluate(() => {
        const form = document.querySelector('form');
        if (form) form.submit();
      });
    } else {
      await submitButton.click();
      console.log('  ✓ Submitted form');
    }

    // Wait for results table to load
    await new Promise(resolve => setTimeout(resolve, 5000));

    // Try multiple selectors for the results table
    let tableSelector = null;
    const possibleSelectors = [
      'table.table',
      'table.results-table',
      'table#results',
      '.results-container table',
      'table',
      '.table-responsive table'
    ];

    for (const selector of possibleSelectors) {
      const exists = await page.$(selector);
      if (exists) {
        tableSelector = selector;
        break;
      }
    }

    if (!tableSelector) {
      console.log('  ⚠️ No results table found - possibly no entities of this type');
      return [];
    }

    console.log(`  ✓ Found results table: ${tableSelector}`);

    // Extract table data
    const entities = await page.evaluate((selector) => {
      const table = document.querySelector(selector);
      if (!table) return [];

      const rows = Array.from(table.querySelectorAll('tbody tr'));
      const results = [];

      rows.forEach(row => {
        const cells = Array.from(row.querySelectorAll('td'));
        if (cells.length >= 2) {
          const entityData = {
            entity_name: cells[0]?.textContent?.trim() || '',
            license_number: cells[1]?.textContent?.trim() || '',
            license_status: cells[2]?.textContent?.trim() || 'Active',
            address: cells[3]?.textContent?.trim() || '',
            contact_info: cells[4]?.textContent?.trim() || ''
          };

          // Only add if has a name
          if (entityData.entity_name) {
            results.push(entityData);
          }
        }
      });

      return results;
    }, tableSelector);

    console.log(`  ✓ Extracted ${entities.length} entities`);
    return entities.map(e => ({
      ...e,
      entity_type: entityType,
      jurisdiction: 'Cayman Islands'
    }));

  } catch (error) {
    console.error(`  ❌ Error scraping ${entityType}:`, error.message);
    return [];
  }
}

async function insertEntities(entities) {
  console.log(`\n💾 Inserting ${entities.length} entities into database...`);

  let inserted = 0;
  let updated = 0;
  let failed = 0;

  for (const entity of entities) {
    try {
      // Try to insert without content_hash first (if column doesn't exist)
      const { error } = await supabase
        .from('cima_entities')
        .upsert({
          entity_name: entity.entity_name,
          entity_type: entity.entity_type,
          license_number: entity.license_number || null,
          license_status: entity.license_status || 'Active',
          address: entity.address || null,
          jurisdiction: entity.jurisdiction || 'Cayman Islands',
          additional_info: {
            contact_info: entity.contact_info || null,
            scraped_source: 'live_scrape',
            scraped_method: 'puppeteer'
          },
          scraped_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'entity_name,license_number,entity_type',
          ignoreDuplicates: false
        });

      if (error) {
        console.error(`  ❌ ${entity.entity_name}: ${error.message}`);
        failed++;
      } else {
        inserted++;
        if (inserted % 10 === 0) {
          console.log(`  ... ${inserted} entities inserted`);
        }
      }
    } catch (err) {
      console.error(`  ❌ ${entity.entity_name}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Database Summary:`);
  console.log(`  ✅ Inserted/Updated: ${inserted}`);
  console.log(`  ❌ Failed: ${failed}`);

  return { inserted, updated, failed };
}

async function main() {
  console.log('🚀 CIMA Complete Entity Scraper\n');
  console.log('=' .repeat(60));
  console.log(`Target: https://www.cima.ky/search-entities-cima`);
  console.log(`Entity Types: ${entityTypes.length}`);
  console.log('=' .repeat(60));

  let browser;
  let allEntities = [];

  try {
    console.log('\n🌐 Launching browser...');

    browser = await puppeteer.launch({
      headless: false, // Set to false to see what's happening
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-web-security'
      ]
    });

    const page = await browser.newPage();

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Set user agent
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');

    console.log('✓ Browser launched\n');

    // Scrape each entity type
    for (let i = 0; i < entityTypes.length; i++) {
      const entityType = entityTypes[i];
      console.log(`[${i + 1}/${entityTypes.length}] Processing: ${entityType}`);

      const entities = await scrapeEntityType(page, entityType);

      if (entities.length > 0) {
        allEntities = allEntities.concat(entities);
        console.log(`  ✓ Added ${entities.length} entities to batch`);
      } else {
        console.log(`  ⚠️ No entities found for ${entityType}`);
      }

      // Add delay between requests to be respectful
      if (i < entityTypes.length - 1) {
        console.log('  ⏳ Waiting 3 seconds before next type...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log(`📊 Scraping Complete!`);
    console.log(`Total entities scraped: ${allEntities.length}`);
    console.log('='.repeat(60));

    // Insert all entities into database
    if (allEntities.length > 0) {
      await insertEntities(allEntities);
    } else {
      console.log('\n⚠️ No entities were scraped. Please check the website structure.');
    }

    // Verify total count in database
    const { data, error } = await supabase
      .from('cima_entities')
      .select('*', { count: 'exact', head: true });

    if (!error) {
      console.log(`\n🎉 Total records in database: ${data?.length || 0}`);
    }

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
  } finally {
    if (browser) {
      await browser.close();
      console.log('\n✓ Browser closed');
    }
  }

  console.log('\n✅ Scraping process complete!');
  console.log('   Visit: https://chathogs.com → Offshore Data → CIMA tab');
}

main();
