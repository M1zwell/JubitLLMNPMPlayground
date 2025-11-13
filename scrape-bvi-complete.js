import puppeteer from 'puppeteer';
import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// All BVI entity type URLs
const entityTypes = [
  { name: 'Virtual Assets Service Providers', url: 'https://www.bvifsc.vg/regulated-entities-vasp' },
  { name: 'Banks', url: 'https://www.bvifsc.vg/regulated-entities-banks' },
  { name: 'Trust Companies', url: 'https://www.bvifsc.vg/regulated-entities-trust-companies' },
  { name: 'Insurance Companies', url: 'https://www.bvifsc.vg/regulated-entities-insurance-companies' },
  { name: 'Mutual Funds', url: 'https://www.bvifsc.vg/regulated-entities-mutual-funds' },
  { name: 'Fund Administrators', url: 'https://www.bvifsc.vg/regulated-entities-fund-administrators' },
  { name: 'Investment Business', url: 'https://www.bvifsc.vg/regulated-entities-investment-business' },
  { name: 'Approved Auditors', url: 'https://www.bvifsc.vg/regulated-entities-approved-auditors' },
  { name: 'Insolvency Practitioners', url: 'https://www.bvifsc.vg/regulated-entities-insolvency-practitioners' }
];

async function scrapeEntityType(page, entityType) {
  console.log(`\n📋 Scraping: ${entityType.name}...`);

  try {
    await page.goto(entityType.url, {
      waitUntil: 'networkidle2',
      timeout: 60000
    });

    console.log('  ✓ Loaded page');

    // Wait for the table to appear
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Extract entity data from list structure (BVI uses Drupal Views, not tables)
    const entities = await page.evaluate(() => {
      const results = [];

      // Look for entity items (could be divs, articles, or list items)
      const possibleSelectors = [
        '.views-row',
        '.view-content > div',
        '.entity-item',
        'article',
        '.field-item'
      ];

      let entityElements = [];

      for (const selector of possibleSelectors) {
        entityElements = Array.from(document.querySelectorAll(selector));
        if (entityElements.length > 0) break;
      }

      entityElements.forEach(el => {
        // Extract entity name (usually in a heading or title)
        const nameEl = el.querySelector('h2, h3, h4, .field-name, .entity-name, .title, a[href*="entity"]');
        const entity_name = nameEl?.textContent?.trim() || '';

        if (entity_name && entity_name.length > 2) {
          // Extract other fields
          const allText = el.textContent;

          results.push({
            entity_name: entity_name,
            license_number: '', // BVI doesn't always show license numbers
            license_status: allText.includes('Former') ? 'Former' : 'Active',
            address: '', // Extract if available
            registered_agent: '',
            contact_info: ''
          });
        }
      });

      return results;
    });

    console.log(`  ✓ Extracted ${entities.length} entities`);

    return entities.map(e => ({
      ...e,
      entity_type: entityType.name,
      jurisdiction: 'British Virgin Islands'
    }));

  } catch (error) {
    console.error(`  ❌ Error scraping ${entityType.name}:`, error.message);
    return [];
  }
}

async function insertBVIEntities(entities) {
  if (entities.length === 0) {
    console.log('  ⚠️ No entities to insert');
    return { inserted: 0, failed: 0 };
  }

  console.log(`\n💾 Inserting ${entities.length} BVI entities...`);

  let inserted = 0;
  let failed = 0;

  for (const entity of entities) {
    try {
      const { error } = await supabase
        .from('bvi_entities')
        .insert({
          entity_name: entity.entity_name,
          entity_type: entity.entity_type,
          license_number: entity.license_number,
          license_status: entity.license_status,
          address: entity.address,
          registered_agent: entity.registered_agent,
          jurisdiction: entity.jurisdiction,
          additional_info: {
            contact_info: entity.contact_info || null,
            scraped_source: 'bvifsc.vg',
            scraped_method: 'puppeteer',
            scraped_date: new Date().toISOString()
          },
          scraped_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (error) {
        if (error.message.includes('duplicate') || error.message.includes('unique')) {
          // Try updating
          const { error: updateError } = await supabase
            .from('bvi_entities')
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
          console.error(`  ❌ ${entity.entity_name}: ${error.message}`);
          failed++;
        }
      } else {
        inserted++;
        if (inserted % 50 === 0) {
          console.log(`  ... ${inserted} processed`);
        }
      }
    } catch (err) {
      console.error(`  ❌ ${entity.entity_name}: ${err.message}`);
      failed++;
    }

    // Small delay
    await new Promise(resolve => setTimeout(resolve, 50));
  }

  console.log(`\n  ✅ Inserted/Updated: ${inserted}`);
  console.log(`  ❌ Failed: ${failed}`);

  return { inserted, failed };
}

function exportToCSV(entities, filename) {
  console.log(`\n📄 Exporting to CSV: ${filename}`);

  const headers = [
    'Entity Name',
    'Entity Type',
    'License Number',
    'License Status',
    'Address',
    'Registered Agent',
    'Jurisdiction',
    'Scraped Date'
  ];

  const rows = entities.map(e => [
    `"${(e.entity_name || '').replace(/"/g, '""')}"`,
    `"${(e.entity_type || '').replace(/"/g, '""')}"`,
    `"${(e.license_number || '').replace(/"/g, '""')}"`,
    `"${(e.license_status || '').replace(/"/g, '""')}"`,
    `"${(e.address || '').replace(/"/g, '""')}"`,
    `"${(e.registered_agent || '').replace(/"/g, '""')}"`,
    `"${(e.jurisdiction || '').replace(/"/g, '""')}"`,
    new Date().toISOString()
  ].join(','));

  const csv = [headers.join(','), ...rows].join('\n');

  writeFileSync(filename, csv, 'utf-8');
  console.log(`  ✅ Exported ${entities.length} entities to ${filename}`);
}

async function main() {
  console.log('🚀 BVI Complete Scraper\n');
  console.log('='.repeat(60));
  console.log(`Target: BVI FSC Regulated Entities`);
  console.log(`Entity Types: ${entityTypes.length}`);
  console.log('='.repeat(60));

  let browser;
  let allEntities = [];

  try {
    console.log('\n🌐 Launching browser...');

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

    // Scrape each entity type
    for (let i = 0; i < entityTypes.length; i++) {
      const entityType = entityTypes[i];
      console.log(`[${i + 1}/${entityTypes.length}] Processing: ${entityType.name}`);

      const entities = await scrapeEntityType(page, entityType);

      if (entities.length > 0) {
        allEntities = allEntities.concat(entities);

        // Insert into database
        await insertBVIEntities(entities);
      }

      // Delay between types
      if (i < entityTypes.length - 1) {
        console.log('  ⏳ Waiting 3 seconds...');
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    console.log('\n' + '='.repeat(60));
    console.log('📊 BVI SCRAPING COMPLETE!');
    console.log('='.repeat(60));
    console.log(`Total entities scraped: ${allEntities.length}`);
    console.log('='.repeat(60));

    // Export to CSV
    if (allEntities.length > 0) {
      exportToCSV(allEntities, 'bvi-entities-complete.csv');
    }

    // Verify database count
    const { count } = await supabase
      .from('bvi_entities')
      .select('*', { count: 'exact', head: true });

    console.log(`\n🎉 Total BVI records in database: ${count || 0}`);

  } catch (error) {
    console.error('\n❌ Fatal error:', error);
  } finally {
    if (browser) {
      await browser.close();
      console.log('\n✓ Browser closed');
    }
  }

  console.log('\n✅ BVI scraping complete!');
}

main();
