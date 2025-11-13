/**
 * Check HKEX CCASS table structure and contents
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkTable() {
  console.log('🔍 Checking HKEX CCASS Holdings table...\n');

  try {
    // Try to get one record to see the schema
    const { data, error } = await supabase
      .from('hkex_ccass_holdings')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ Error querying table:', error.message);
      console.log('\n📋 Table might not exist. Please run the SQL migration:');
      console.log('   File: supabase/migrations/20251112_create_hkex_ccass_table.sql');
      return;
    }

    console.log('✅ Table exists!');

    if (data && data.length > 0) {
      console.log('\n📊 Sample Record:');
      console.log(JSON.stringify(data[0], null, 2));

      console.log('\n📋 Table Columns:');
      const columns = Object.keys(data[0]);
      columns.forEach(col => {
        const value = data[0][col];
        const type = typeof value;
        console.log(`   - ${col}: ${type}`);
      });
    } else {
      console.log('\n📊 Table is empty');
      console.log('\n💡 Run the scraper to populate data:');
      console.log('   node scrape-ccass-complete.cjs 00700 2025/11/08 2025/11/08 --supabase');
    }

    // Get count
    const { count, error: countError } = await supabase
      .from('hkex_ccass_holdings')
      .select('*', { count: 'exact', head: true });

    if (!countError) {
      console.log(`\n📈 Total Records: ${count || 0}`);
    }

  } catch (error) {
    console.error('❌ Fatal error:', error.message);
  }
}

checkTable().then(() => process.exit(0));
