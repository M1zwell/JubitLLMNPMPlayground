import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { parse } from 'csv-parse/sync';

const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

function generateContentHash(entityName, licenseNumber, entityType) {
  const hash = crypto.createHash('sha256');
  hash.update(`${entityName}||${licenseNumber || 'NONE'}||${entityType}`);
  return hash.digest('hex');
}

// BVI CSV URLs mapped from the website
const CSV_SOURCES = [
  {
    name: 'Banking & Fiduciary',
    url: 'https://www.bvifsc.vg/banking-fiduciary-data.csv',
    entityType: 'Banking & Fiduciary'
  },
  {
    name: 'Insurance',
    url: 'https://www.bvifsc.vg/insurance-data.csv',
    entityType: 'Insurance Companies'
  },
  {
    name: 'Investment Business',
    url: 'https://www.bvifsc.vg/investment-business-data.csv',
    entityType: 'Investment Business'
  }
];

async function downloadAndParseCsv(url) {
  console.log(`\n📥 Downloading: ${url}`);

  try {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const csvText = await response.text();

    if (!csvText || csvText.trim().length === 0) {
      throw new Error('Empty CSV file');
    }

    // Parse CSV
    const records = parse(csvText, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      bom: true // Handle UTF-8 BOM
    });

    console.log(`✅ Parsed ${records.length} records`);
    return records;

  } catch (error) {
    console.error(`❌ Error downloading/parsing CSV: ${error.message}`);
    return [];
  }
}

function normalizeEntityData(record, entityType) {
  // BVI CSV columns might vary, so we'll handle different possible column names
  const possibleNameColumns = [
    'Name',
    'Entity Name',
    'Company Name',
    'name',
    'entity_name'
  ];

  const possibleLicenseColumns = [
    'License Number',
    'Licence Number',
    'Registration Number',
    'Number',
    'license_number',
    'licence_number'
  ];

  const possibleStatusColumns = [
    'Status',
    'License Status',
    'Licence Status',
    'status'
  ];

  // Find the entity name
  let entityName = null;
  for (const col of possibleNameColumns) {
    if (record[col]) {
      entityName = record[col];
      break;
    }
  }

  // Find license number
  let licenseNumber = null;
  for (const col of possibleLicenseColumns) {
    if (record[col]) {
      licenseNumber = record[col];
      break;
    }
  }

  // Find status
  let status = 'Active';
  for (const col of possibleStatusColumns) {
    if (record[col]) {
      status = record[col];
      break;
    }
  }

  if (!entityName) {
    console.warn('⚠️ No entity name found in record:', Object.keys(record).join(', '));
    return null;
  }

  return {
    entity_name: entityName,
    entity_type: entityType,
    license_number: licenseNumber || null,
    license_status: status,
    jurisdiction: 'British Virgin Islands',
    address: record['Address'] || record['address'] || 'British Virgin Islands',
    content_hash: generateContentHash(entityName, licenseNumber, entityType),
    additional_info: {
      source: 'BVI FSC CSV',
      imported_at: new Date().toISOString(),
      raw_data: record
    },
    scraped_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
}

async function importCsvData(records, entityType) {
  console.log(`\n💾 Importing ${records.length} ${entityType} entities...`);

  let inserted = 0;
  let duplicates = 0;
  let errors = 0;

  for (const record of records) {
    const entity = normalizeEntityData(record, entityType);

    if (!entity) {
      errors++;
      continue;
    }

    try {
      const { error } = await supabase
        .from('bvi_entities')
        .insert(entity);

      if (error) {
        if (error.message.includes('duplicate') || error.code === '23505') {
          duplicates++;
        } else {
          console.error(`❌ Error inserting ${entity.entity_name}: ${error.message}`);
          errors++;
        }
      } else {
        inserted++;
        if (inserted % 50 === 0) {
          console.log(`  ✅ ${inserted} / ${records.length} imported`);
        }
      }
    } catch (err) {
      console.error(`❌ Exception inserting entity: ${err.message}`);
      errors++;
    }

    // Small delay to avoid rate limits
    if (inserted % 20 === 0 && inserted > 0) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  console.log(`\n📊 Import Results for ${entityType}:`);
  console.log(`   ✅ Inserted: ${inserted}`);
  console.log(`   ⏭️  Duplicates: ${duplicates}`);
  console.log(`   ❌ Errors: ${errors}`);

  return { inserted, duplicates, errors };
}

async function main() {
  console.log('🚀 BVI FSC CSV Importer\n');
  console.log('='.repeat(60));

  // Check initial count
  const { count: initialCount } = await supabase
    .from('bvi_entities')
    .select('*', { count: 'exact', head: true });

  console.log(`\n📊 Current BVI entities: ${initialCount || 0}`);

  let totalInserted = 0;
  let totalDuplicates = 0;
  let totalErrors = 0;

  // Process each CSV source
  for (const source of CSV_SOURCES) {
    console.log('\n' + '='.repeat(60));
    console.log(`📋 Processing: ${source.name}`);
    console.log('='.repeat(60));

    const records = await downloadAndParseCsv(source.url);

    if (records.length > 0) {
      // Show sample of first record to understand structure
      console.log('\n📝 Sample CSV columns:', Object.keys(records[0]).join(', '));

      const result = await importCsvData(records, source.entityType);
      totalInserted += result.inserted;
      totalDuplicates += result.duplicates;
      totalErrors += result.errors;
    }
  }

  // Final count
  const { count: finalCount } = await supabase
    .from('bvi_entities')
    .select('*', { count: 'exact', head: true });

  console.log('\n' + '='.repeat(60));
  console.log('🎉 IMPORT COMPLETE!');
  console.log('='.repeat(60));
  console.log(`\n📊 Overall Statistics:`);
  console.log(`   Initial entities: ${initialCount || 0}`);
  console.log(`   Final entities:   ${finalCount || 0}`);
  console.log(`   New imports:      ${totalInserted}`);
  console.log(`   Duplicates:       ${totalDuplicates}`);
  console.log(`   Errors:           ${totalErrors}`);
  console.log(`\n✅ Data is now visible at: https://chathogs.com → Offshore Data → BVI tab\n`);
}

main().catch(console.error);
