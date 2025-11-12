// Check all scraping tables for mock/test data

const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

console.log('📊 Checking All Scraping Tables for Mock Data');
console.log('═'.repeat(60));

const tables = [
  'all_scraped_data',
  'hkex_announcements',
  'hksfc_filings',
  'npm_packages',
  'llm_models'
];

async function checkTable(tableName) {
  console.log(`\n📋 ${tableName}:`);

  try {
    // Get count
    const countResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/${tableName}?select=id`,
      {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Accept': 'application/json'
        }
      }
    );

    if (countResponse.ok) {
      const data = await countResponse.json();
      const count = data.length;
      console.log(`   Total records: ${count}`);

      if (count > 0) {
        // Get sample of recent records
        const sampleResponse = await fetch(
          `${SUPABASE_URL}/rest/v1/${tableName}?select=*&order=created_at.desc&limit=3`,
          {
            headers: {
              'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
              'apikey': SUPABASE_ANON_KEY,
              'Accept': 'application/json'
            }
          }
        );

        if (sampleResponse.ok) {
          const samples = await sampleResponse.json();
          console.log(`   Latest ${Math.min(3, samples.length)} records:`);

          samples.forEach((record, index) => {
            console.log(`\n   ${index + 1}.`, {
              id: record.id?.substring(0, 8) + '...' || 'N/A',
              name: record.name || record.title || record.filing_title || 'N/A',
              source: record.source || record.provider || 'N/A',
              created: record.created_at?.substring(0, 10) || 'N/A'
            });
          });
        }
      }

      return { tableName, count, exists: true };
    } else {
      console.log(`   ❌ Table not accessible (${countResponse.status})`);
      return { tableName, count: 0, exists: false };
    }
  } catch (error) {
    console.log(`   ❌ Error: ${error.message}`);
    return { tableName, count: 0, exists: false, error: error.message };
  }
}

async function main() {
  const results = [];

  for (const table of tables) {
    const result = await checkTable(table);
    results.push(result);
  }

  console.log('\n' + '═'.repeat(60));
  console.log('📊 SUMMARY');
  console.log('═'.repeat(60));

  results.forEach(result => {
    if (result.exists) {
      const status = result.count === 0 ? '✅ Empty' : `📊 ${result.count} records`;
      console.log(`${result.tableName.padEnd(25)} ${status}`);
    } else {
      console.log(`${result.tableName.padEnd(25)} ❌ Not accessible`);
    }
  });

  const totalRecords = results.reduce((sum, r) => sum + r.count, 0);
  console.log('\n' + '─'.repeat(60));
  console.log(`Total records across all tables: ${totalRecords}`);
  console.log('═'.repeat(60));
}

main();
