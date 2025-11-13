import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';
const FIRECRAWL_API_KEY = 'fc-d4bcb86c7e6648c2a90a47ec7d36ae2a';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function generateContentHash(entityName, licenseNumber, entityType) {
  const hash = crypto.createHash('sha256');
  hash.update(`${entityName}||${licenseNumber || 'NONE'}||${entityType}`);
  return hash.digest('hex');
}

// Entity types with their exact values from the CIMA dropdown
const entityTypesMap = [
  { name: 'Banking, Financing and Money Services', value: 'Banking, Financing and Money Services' },
  { name: 'Trust & Corporate Services Providers', value: 'Trust & Corporate Services Providers' },
  { name: 'Insurance', value: 'Insurance' },
  { name: 'Investment Business', value: 'Investment Business' },
  { name: 'Money Services', value: 'Money Services' },
  { name: 'Virtual Assets Service Providers', value: 'Virtual Assets Service Providers' },
  { name: 'Insolvency Practitioners', value: 'Insolvency Practitioners' },
  { name: 'Registered Agents', value: 'Registered Agents' }
];

async function scrapeWithFirecrawl(entityType) {
  console.log(`\n📋 Scraping: ${entityType}...`);

  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: 'https://www.cima.ky/search-entities-cima',
        formats: ['markdown', 'html'],
        actions: [
          { type: 'wait', milliseconds: 3000 },
          {
            type: 'executeJavascript',
            script: `
              const select = document.querySelector('select[name="AuthorizationType"]');
              if (select) {
                select.value = "${entityType}";
                select.dispatchEvent(new Event('change', { bubbles: true }));
              }
            `
          },
          { type: 'wait', milliseconds: 1000 },
          {
            type: 'executeJavascript',
            script: `
              const button = document.querySelector('button[type="submit"]') ||
                            document.querySelector('input[type="submit"]') ||
                            document.querySelector('.btn-primary');
              if (button) button.click();
            `
          },
          { type: 'wait', milliseconds: 7000 }
        ],
        waitFor: 5000,
        timeout: 90000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`  ❌ Firecrawl API error (${response.status}): ${errorText}`);
      return [];
    }

    const result = await response.json();

    if (!result.success) {
      console.error(`  ❌ Firecrawl failed: ${result.error || 'Unknown error'}`);
      return [];
    }

    console.log(`  ✓ Scraped ${result.data?.markdown?.length || 0} chars of content`);

    // Parse markdown and HTML for entity data
    const markdown = result.data?.markdown || '';
    const html = result.data?.html || '';

    // Method 1: Parse from markdown tables
    const entities = [];
    const lines = markdown.split('\n');

    for (const line of lines) {
      // Look for table rows with | separators
      if (line.includes('|') && !line.includes('---') && line.trim().length > 10) {
        const cols = line.split('|').map(c => c.trim()).filter(c => c);

        // Skip header rows
        if (cols.length >= 2 &&
            cols[0].length > 2 &&
            !cols[0].toLowerCase().includes('name') &&
            !cols[0].toLowerCase().includes('entity')) {

          entities.push({
            entity_name: cols[0],
            entity_type: entityType,
            license_number: cols[1] || null,
            license_status: cols[2] || 'Active',
            address: cols[3] || null,
            jurisdiction: 'Cayman Islands'
          });
        }
      }
    }

    console.log(`  ✓ Parsed ${entities.length} entities from markdown`);

    // If no entities from markdown, try parsing HTML
    if (entities.length === 0 && html) {
      console.log('  ⚠️ No entities in markdown, trying HTML parsing...');
      // You could add HTML parsing here if needed
    }

    return entities;

  } catch (error) {
    console.error(`  ❌ Error scraping ${entityType}:`, error.message);
    return [];
  }
}

async function insertEntities(entities) {
  if (entities.length === 0) {
    console.log('  ⚠️ No entities to insert');
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
          license_number: entity.license_number,
          license_status: entity.license_status,
          address: entity.address,
          jurisdiction: entity.jurisdiction,
          additional_info: {
            scraped_source: 'firecrawl_api',
            scraped_method: 'actions',
            scraped_date: new Date().toISOString()
          },
          scraped_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select();

      if (error) {
        // Check if it's a duplicate error
        if (error.message.includes('duplicate') || error.message.includes('unique')) {
          // Try updating instead
          const { error: updateError } = await supabase
            .from('cima_entities')
            .update({
              license_status: entity.license_status,
              address: entity.address,
              updated_at: new Date().toISOString(),
              scraped_at: new Date().toISOString()
            })
            .eq('entity_name', entity.entity_name)
            .eq('entity_type', entity.entity_type)
            .eq('license_number', entity.license_number || '');

          if (!updateError) {
            inserted++;
            if (inserted % 10 === 0) {
              console.log(`  ... ${inserted} processed`);
            }
          } else {
            console.error(`  ❌ ${entity.entity_name}: ${updateError.message}`);
            failed++;
          }
        } else {
          console.error(`  ❌ ${entity.entity_name}: ${error.message}`);
          failed++;
        }
      } else {
        inserted++;
        if (inserted % 10 === 0) {
          console.log(`  ... ${inserted} processed`);
        }
      }
    } catch (err) {
      console.error(`  ❌ ${entity.entity_name}: ${err.message}`);
      failed++;
    }

    // Small delay between inserts to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  console.log(`\n  ✅ Inserted/Updated: ${inserted}`);
  console.log(`  ❌ Failed: ${failed}`);

  return { inserted, failed };
}

async function main() {
  console.log('🚀 CIMA Firecrawl Scraper\n');
  console.log('=' .repeat(60));
  console.log(`Target: https://www.cima.ky/search-entities-cima`);
  console.log(`Entity Types: ${entityTypesMap.length}`);
  console.log(`Method: Firecrawl V1 Actions API`);
  console.log('=' .repeat(60));

  let totalInserted = 0;
  let totalFailed = 0;
  let allEntities = [];

  for (let i = 0; i < entityTypesMap.length; i++) {
    const { name, value } = entityTypesMap[i];
    console.log(`\n[${i + 1}/${entityTypesMap.length}] Processing: ${name}`);

    const entities = await scrapeWithFirecrawl(value);

    if (entities.length > 0) {
      allEntities = allEntities.concat(entities);

      // Insert in batches
      const result = await insertEntities(entities);
      totalInserted += result.inserted;
      totalFailed += result.failed;
    }

    // Rate limiting: wait between entity types
    if (i < entityTypesMap.length - 1) {
      console.log('  ⏳ Waiting 5 seconds before next type...');
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('📊 FINAL RESULTS');
  console.log('='.repeat(60));
  console.log(`Total entities scraped: ${allEntities.length}`);
  console.log(`Total inserted/updated: ${totalInserted}`);
  console.log(`Total failed: ${totalFailed}`);
  console.log('='.repeat(60));

  // Verify database count
  const { data, error, count } = await supabase
    .from('cima_entities')
    .select('*', { count: 'exact', head: true });

  if (!error && count !== null) {
    console.log(`\n🎉 Total records in database: ${count}`);
  }

  console.log('\n✅ Scraping complete!');
  console.log('   Visit: https://chathogs.com → Offshore Data → CIMA tab\n');
}

main();
