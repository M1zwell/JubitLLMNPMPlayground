import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { parse } from 'csv-parse/sync';

const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TARGET_TOTAL = 1800;

async function importFromCSV(csvFile) {
  console.log(`\n📄 Reading CSV file: ${csvFile}`);

  try {
    const fileContent = readFileSync(csvFile, 'utf-8');
    const records = parse(fileContent, {
      columns: true,
      skip_empty_lines: true
    });

    console.log(`✅ Parsed ${records.length} records from CSV\n`);

    // Check current count
    const { count: currentCount } = await supabase
      .from('cima_entities')
      .select('*', { count: 'exact', head: true });

    console.log(`📊 Current CIMA entities: ${currentCount || 0}`);

    if (currentCount >= TARGET_TOTAL) {
      console.log(`✅ Already at target of ${TARGET_TOTAL}. Stopping.`);
      return;
    }

    const remaining = TARGET_TOTAL - currentCount;
    console.log(`📈 Can add up to ${remaining} more entities\n`);

    const recordsToAdd = Math.min(records.length, remaining);
    const entitiesToAdd = records.slice(0, recordsToAdd);

    console.log(`💾 Inserting ${entitiesToAdd.length} entities...\n`);

    let inserted = 0;
    let updated = 0;
    let failed = 0;

    for (const record of entitiesToAdd) {
      try {
        // Clean entity name (remove status suffixes)
        let entityName = record.entity_name || record['Entity Name'] || '';
        entityName = entityName
          .replace(/Cancelled$/i, '')
          .replace(/Former$/i, '')
          .replace(/Active$/i, '')
          .trim();

        if (!entityName || entityName.length < 2) {
          failed++;
          continue;
        }

        const entityData = {
          entity_name: entityName,
          entity_type: record.entity_type || record['Entity Type'] || 'Mutual Fund',
          entity_category: record.entity_category || 'Mutual Funds',
          license_number: record.license_number || record['License Number'] || null,
          license_status: (record.license_status || record['License Status'] || 'Active').replace(/Cancelled/i, 'Cancelled').replace(/Former/i, 'Former'),
          address: record.address || record['Address'] || null,
          jurisdiction: 'Cayman Islands',
          additional_info: {
            csv_import: true,
            import_date: new Date().toISOString()
          },
          scraped_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Try insert
        const { error } = await supabase
          .from('cima_entities')
          .insert(entityData);

        if (error) {
          if (error.message.includes('duplicate') || error.message.includes('unique_cima_entity')) {
            // Try update
            const { error: updateError } = await supabase
              .from('cima_entities')
              .update({
                license_status: entityData.license_status,
                updated_at: new Date().toISOString()
              })
              .eq('entity_name', entityData.entity_name)
              .eq('entity_type', entityData.entity_type)
              .is('license_number', entityData.license_number);

            if (!updateError) {
              updated++;
            } else {
              failed++;
            }
          } else {
            console.error(`❌ ${entityName}: ${error.message}`);
            failed++;
          }
        } else {
          inserted++;
          if ((inserted + updated) % 100 === 0) {
            console.log(`  ... ${inserted + updated} processed`);
          }
        }

        // Check if we've reached target
        const { count: newCount } = await supabase
          .from('cima_entities')
          .select('*', { count: 'exact', head: true });

        if (newCount >= TARGET_TOTAL) {
          console.log(`\n🎯 Reached target of ${TARGET_TOTAL} entities!`);
          break;
        }

      } catch (err) {
        failed++;
      }

      await new Promise(resolve => setTimeout(resolve, 50));
    }

    console.log(`\n📊 Import Summary:`);
    console.log(`  ✅ Inserted: ${inserted}`);
    console.log(`  🔄 Updated: ${updated}`);
    console.log(`  ❌ Failed: ${failed}`);

    const { count: finalCount } = await supabase
      .from('cima_entities')
      .select('*', { count: 'exact', head: true });

    console.log(`\n🎉 Total CIMA entities: ${finalCount || 0}`);
    console.log(`   Target: ${TARGET_TOTAL}`);
    console.log(`   Status: ${finalCount >= TARGET_TOTAL ? '✅ COMPLETE' : `⚠️ ${TARGET_TOTAL - finalCount} remaining`}`);

  } catch (error) {
    console.error('\n❌ Error importing CSV:', error.message);
  }
}

// Check command line args
const csvFile = process.argv[2];

if (!csvFile) {
  console.log('Usage: node bulk-import-cima-csv.js <csv-file>');
  console.log('\nCSV format should have columns:');
  console.log('  entity_name, entity_type, license_number, license_status, address');
  process.exit(1);
}

importFromCSV(csvFile);
