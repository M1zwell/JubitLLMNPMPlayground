import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';
const FIRECRAWL_API_KEY = process.env.VITE_FIRECRAWL_API_KEY || process.env.FIRECRAWL_API_KEY || 'fc-7f04517bc6ef43d68c06316d5f69b91e';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function generateContentHash(entityName, licenseNumber, entityType) {
  const hash = crypto.createHash('sha256');
  hash.update(`${entityName}||${licenseNumber || 'NONE'}||${entityType}`);
  return hash.digest('hex');
}

// All BVI entity types with their URLs
const BVI_SOURCES = [
  {
    name: 'Banking & Fiduciary',
    url: 'https://www.bvifsc.vg/regulated-entities-banking-fiduciary',
    entityType: 'Banking & Fiduciary'
  },
  {
    name: 'Trust Companies',
    url: 'https://www.bvifsc.vg/regulated-entities-trust',
    entityType: 'Trust Companies'
  },
  {
    name: 'Insurance Companies',
    url: 'https://www.bvifsc.vg/regulated-entities-insurance',
    entityType: 'Insurance Companies'
  },
  {
    name: 'Mutual Funds',
    url: 'https://www.bvifsc.vg/regulated-entities-funds',
    entityType: 'Mutual Funds'
  },
  {
    name: 'Fund Administrators',
    url: 'https://www.bvifsc.vg/regulated-entities-fund-administrators',
    entityType: 'Fund Administrators'
  },
  {
    name: 'Investment Business',
    url: 'https://www.bvifsc.vg/regulated-entities-investment-business',
    entityType: 'Investment Business'
  },
  {
    name: 'Approved Auditors',
    url: 'https://www.bvifsc.vg/regulated-entities-approved-auditors',
    entityType: 'Approved Auditors'
  },
  {
    name: 'Insolvency Practitioners',
    url: 'https://www.bvifsc.vg/regulated-entities-insolvency',
    entityType: 'Insolvency Practitioners'
  },
  {
    name: 'Virtual Assets Service Providers',
    url: 'https://www.bvifsc.vg/regulated-entities-vasp',
    entityType: 'Virtual Assets Service Providers'
  }
];

async function scrapeWithFirecrawl(url) {
  console.log(`\n🔥 Scraping with Firecrawl: ${url}`);

  try {
    const response = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        url: url,
        formats: ['markdown', 'html'],
        onlyMainContent: true,
        waitFor: 2000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Firecrawl API error (${response.status}): ${errorText}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error('Firecrawl scraping failed');
    }

    return result.data;
  } catch (error) {
    console.error(`❌ Firecrawl error: ${error.message}`);
    return null;
  }
}

function parseEntitiesFromMarkdown(markdown, entityType) {
  const entities = [];

  // BVI pages use a list format with entity names
  // Try multiple patterns to extract entity information

  // Pattern 1: Look for entity names in markdown lists or headings
  const lines = markdown.split('\n');

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    // Skip empty lines, headers, navigation, filters
    if (!line ||
        line.startsWith('#') ||
        line.includes('Filter') ||
        line.includes('Search') ||
        line.includes('Export') ||
        line.includes('Page') ||
        line.toLowerCase().includes('showing') ||
        line.length < 3) {
      continue;
    }

    // Look for potential entity names
    // They might be in list format (-, *, 1., etc.) or just plain text
    let entityName = line
      .replace(/^[-*•]\s*/, '')  // Remove list markers
      .replace(/^\d+\.\s*/, '')   // Remove numbered list markers
      .replace(/\[|\]/g, '')      // Remove brackets
      .replace(/\(.*?\)/g, '')    // Remove parentheses content
      .trim();

    // Skip if it looks like navigation, footer, or UI elements
    if (entityName.toLowerCase().includes('contact') ||
        entityName.toLowerCase().includes('copyright') ||
        entityName.toLowerCase().includes('privacy') ||
        entityName.toLowerCase().includes('terms') ||
        entityName.toLowerCase().includes('home') ||
        entityName.toLowerCase().includes('about') ||
        entityName.length < 5) {
      continue;
    }

    // If this looks like a valid entity name (has letters, reasonable length)
    if (/[a-zA-Z]/.test(entityName) && entityName.length >= 5 && entityName.length < 200) {
      // Check if next line might have license number
      let licenseNumber = null;
      if (i + 1 < lines.length) {
        const nextLine = lines[i + 1].trim();
        // Look for patterns like "License: XXX" or "Registration: XXX"
        const licenseMatch = nextLine.match(/(?:license|licence|registration|number|reg)[:\s]*([A-Z0-9\-\/]+)/i);
        if (licenseMatch) {
          licenseNumber = licenseMatch[1];
        }
      }

      entities.push({
        entity_name: entityName,
        entity_type: entityType,
        license_number: licenseNumber,
        license_status: 'Active',
        jurisdiction: 'British Virgin Islands',
        address: 'British Virgin Islands',
        additional_info: {
          source: 'Firecrawl scrape',
          scraped_at: new Date().toISOString()
        },
        scraped_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    }
  }

  return entities;
}

async function importEntities(entities, entityTypeName) {
  if (entities.length === 0) {
    console.log('⚠️ No entities to import');
    return { inserted: 0, duplicates: 0, errors: 0 };
  }

  console.log(`\n💾 Importing ${entities.length} ${entityTypeName} entities...`);

  let inserted = 0;
  let duplicates = 0;
  let errors = 0;

  for (const entity of entities) {
    try {
      const { error } = await supabase
        .from('bvi_entities')
        .insert(entity);

      if (error) {
        if (error.message.includes('duplicate') || error.code === '23505') {
          duplicates++;
        } else {
          console.error(`❌ Error: ${error.message}`);
          errors++;
        }
      } else {
        inserted++;
        if (inserted % 25 === 0) {
          console.log(`  ✅ ${inserted} / ${entities.length} imported`);
        }
      }
    } catch (err) {
      errors++;
    }

    // Rate limiting
    if (inserted % 10 === 0 && inserted > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log(`\n📊 Import Results:`);
  console.log(`   ✅ Inserted: ${inserted}`);
  console.log(`   ⏭️  Duplicates: ${duplicates}`);
  console.log(`   ❌ Errors: ${errors}`);

  return { inserted, duplicates, errors };
}

async function main() {
  console.log('🚀 BVI FSC Complete Scraper (Firecrawl)\n');
  console.log('='.repeat(60));

  // Check initial count
  const { count: initialCount } = await supabase
    .from('bvi_entities')
    .select('*', { count: 'exact', head: true });

  console.log(`\n📊 Current BVI entities: ${initialCount || 0}`);

  let totalInserted = 0;
  let totalDuplicates = 0;
  let totalErrors = 0;

  for (const source of BVI_SOURCES) {
    console.log('\n' + '='.repeat(60));
    console.log(`📋 Processing: ${source.name}`);
    console.log('='.repeat(60));

    const data = await scrapeWithFirecrawl(source.url);

    if (data && data.markdown) {
      console.log(`✅ Retrieved ${data.markdown.length} characters of content`);

      const entities = parseEntitiesFromMarkdown(data.markdown, source.entityType);
      console.log(`📝 Extracted ${entities.length} entities`);

      if (entities.length > 0) {
        const result = await importEntities(entities, source.name);
        totalInserted += result.inserted;
        totalDuplicates += result.duplicates;
        totalErrors += result.errors;
      }
    }

    // Delay between sources to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  // Final count
  const { count: finalCount } = await supabase
    .from('bvi_entities')
    .select('*', { count: 'exact', head: true });

  console.log('\n' + '='.repeat(60));
  console.log('🎉 SCRAPING COMPLETE!');
  console.log('='.repeat(60));
  console.log(`\n📊 Overall Statistics:`);
  console.log(`   Initial entities: ${initialCount || 0}`);
  console.log(`   Final entities:   ${finalCount || 0}`);
  console.log(`   New imports:      ${totalInserted}`);
  console.log(`   Duplicates:       ${totalDuplicates}`);
  console.log(`   Errors:           ${totalErrors}`);
  console.log(`\n✅ Data visible at: https://chathogs.com → Offshore Data → BVI tab\n`);
}

main().catch(console.error);
