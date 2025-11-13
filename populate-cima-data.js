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

async function scrapeCIMA(entityType = 'Banking Class A') {
  console.log(`\\n🔍 Scraping CIMA for: ${entityType}...`);

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
          { type: 'wait', milliseconds: 2000 },
          {
            type: 'click',
            selector: 'select[name="AuthorizationType"]'
          },
          { type: 'wait', milliseconds: 500 },
          {
            type: 'click',
            selector: `select[name="AuthorizationType"] option[value="${entityType}"]`
          },
          { type: 'wait', milliseconds: 500 },
          {
            type: 'click',
            selector: 'button[type="submit"], input[type="submit"], .btn-primary'
          },
          { type: 'wait', milliseconds: 5000 }
        ],
        waitFor: 3000,
        timeout: 60000
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Firecrawl error ${response.status}: ${error}`);
    }

    const result = await response.json();

    if (!result.success) {
      throw new Error(`Firecrawl failed: ${result.error || 'Unknown error'}`);
    }

    console.log(`✅ Scraped ${result.data?.markdown?.length || 0} chars`);

    // Parse the markdown for entity data
    const markdown = result.data?.markdown || '';
    const lines = markdown.split('\\n');

    const entities = [];
    for (const line of lines) {
      if (line.includes('|') && !line.includes('---') && line.trim().length > 10) {
        const cols = line.split('|').map(c => c.trim()).filter(c => c);

        if (cols.length >= 2 && cols[0].length > 2 && !cols[0].toLowerCase().includes('name')) {
          entities.push({
            entity_name: cols[0],
            entity_type: 'Banking, Financing and Money Services',
            license_number: cols[1] || null,
            license_status: cols[2] || 'Active',
            address: cols[3] || null,
            jurisdiction: 'Cayman Islands'
          });
        }
      }
    }

    console.log(`📊 Parsed ${entities.length} entities`);
    return entities;

  } catch (error) {
    console.error(`❌ Error scraping:`, error.message);
    return [];
  }
}

async function insertEntities(entities) {
  console.log(`\\n💾 Inserting ${entities.length} entities into database...`);

  let inserted = 0;
  let failed = 0;

  for (const entity of entities) {
    const contentHash = generateContentHash(
      entity.entity_name,
      entity.license_number || '',
      entity.entity_type
    );

    try {
      const { error } = await supabase
        .from('cima_entities')
        .upsert({
          ...entity,
          content_hash: contentHash,
          scraped_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'content_hash',
          ignoreDuplicates: false
        });

      if (error) {
        console.error(`❌ Error inserting ${entity.entity_name}:`, error.message);
        failed++;
      } else {
        inserted++;
      }
    } catch (err) {
      console.error(`❌ Error:`, err.message);
      failed++;
    }
  }

  console.log(`\\n✅ Inserted: ${inserted}, Failed: ${failed}`);
  return { inserted, failed };
}

async function main() {
  console.log('🚀 Starting CIMA data population...');

  const entities = await scrapeCIMA();

  if (entities.length > 0) {
    await insertEntities(entities);
  } else {
    console.log('⚠️ No entities found to insert');
  }

  // Verify the data
  const { data, error } = await supabase
    .from('cima_entities')
    .select('*')
    .limit(5);

  if (error) {
    console.error('Error verifying:', error.message);
  } else {
    console.log(`\\n🎉 Total records in database: ${data?.length || 0}`);
    if (data && data.length > 0) {
      console.log('Sample record:', data[0].entity_name);
    }
  }
}

main();
