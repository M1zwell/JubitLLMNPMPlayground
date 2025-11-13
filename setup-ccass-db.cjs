/**
 * Setup script for HKEX CCASS Holdings database table
 * Run this to create the necessary table and views in Supabase
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function setupDatabase() {
  console.log('🔧 Setting up HKEX CCASS Holdings database...\n');

  try {
    // Test connection
    console.log('📡 Testing Supabase connection...');
    const { data: tables, error: listError } = await supabase
      .from('hkex_ccass_holdings')
      .select('count')
      .limit(1);

    if (listError) {
      if (listError.message.includes('relation') && listError.message.includes('does not exist')) {
        console.log('⚠️  Table does not exist yet.');
        console.log('\n📋 Please create the table manually in Supabase SQL Editor:');
        console.log('   1. Go to: https://supabase.com/dashboard/project/kiztaihzanqnrcrqaxsv/sql/new');
        console.log('   2. Copy and paste the SQL from: supabase/migrations/20251112_create_hkex_ccass_table.sql');
        console.log('   3. Click "Run" to execute\n');

        // Show the SQL content
        const sqlPath = './supabase/migrations/20251112_create_hkex_ccass_table.sql';
        if (fs.existsSync(sqlPath)) {
          console.log('📄 SQL Migration File Content:\n');
          console.log('─'.repeat(80));
          const sql = fs.readFileSync(sqlPath, 'utf8');
          console.log(sql);
          console.log('─'.repeat(80));
        }

        return false;
      } else {
        throw listError;
      }
    }

    console.log('✅ Table exists! Checking structure...\n');

    // Insert a test record to verify schema
    const testRecord = {
      stock_code: 'TEST001',
      stock_name: 'Test Stock',
      shareholding_date: '2025-11-08',
      participant_id: 'TEST001',
      participant_name: 'Test Participant',
      address: 'Test Address',
      shareholding: 1000000,
      percentage: 1.5
    };

    console.log('🧪 Testing insert operation...');
    const { data: inserted, error: insertError } = await supabase
      .from('hkex_ccass_holdings')
      .insert([testRecord])
      .select();

    if (insertError) {
      console.error('❌ Insert test failed:', insertError.message);
      return false;
    }

    console.log('✅ Insert test successful!');

    // Clean up test record
    if (inserted && inserted.length > 0) {
      console.log('🧹 Cleaning up test record...');
      await supabase
        .from('hkex_ccass_holdings')
        .delete()
        .eq('id', inserted[0].id);
      console.log('✅ Test record removed');
    }

    // Get table statistics
    console.log('\n📊 Current Database Statistics:');
    const { count: totalRecords, error: countError } = await supabase
      .from('hkex_ccass_holdings')
      .select('*', { count: 'exact', head: true });

    if (!countError) {
      console.log(`   Total Records: ${totalRecords || 0}`);
    }

    // Get distinct stocks
    const { data: stocks, error: stocksError } = await supabase
      .from('hkex_ccass_holdings')
      .select('stock_code, stock_name')
      .order('stock_code');

    if (!stocksError && stocks) {
      const uniqueStocks = [...new Map(stocks.map(s => [s.stock_code, s])).values()];
      console.log(`   Unique Stocks: ${uniqueStocks.length}`);

      if (uniqueStocks.length > 0 && uniqueStocks.length <= 10) {
        console.log('\n   Stocks in database:');
        uniqueStocks.forEach(stock => {
          console.log(`     - ${stock.stock_code}: ${stock.stock_name || 'N/A'}`);
        });
      }
    }

    console.log('\n✅ Database setup complete and verified!');
    console.log('\n📚 Next steps:');
    console.log('   1. Run: node scrape-ccass-complete.cjs 00700 2025/11/08 2025/11/08 --supabase');
    console.log('   2. Check data: https://supabase.com/dashboard/project/kiztaihzanqnrcrqaxsv/editor');

    return true;

  } catch (error) {
    console.error('❌ Error:', error.message);
    return false;
  }
}

// Run setup
setupDatabase()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
