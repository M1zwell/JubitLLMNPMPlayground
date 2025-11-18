/**
 * Apply CCASS content_hash fix directly to Supabase
 * Makes content_hash column nullable to allow scraper inserts
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function applyFix() {
  console.log('🔧 Applying CCASS content_hash fix...\n');

  try {
    // Check current table structure
    console.log('📋 Checking current table structure...');
    const { data: columns, error: checkError } = await supabase
      .rpc('exec', {
        sql: `
          SELECT column_name, data_type, is_nullable
          FROM information_schema.columns
          WHERE table_name = 'hkex_ccass_holdings'
          ORDER BY ordinal_position;
        `
      });

    if (checkError) {
      console.log('⚠️  Could not check table structure (expected if RPC not available)');
      console.log('   Error:', checkError.message);
    } else {
      console.log('Current columns:', columns);
    }

    // Apply the fix using raw SQL
    console.log('\n🔧 Applying ALTER TABLE to make content_hash nullable...');

    const { data, error } = await supabase
      .rpc('exec', {
        sql: 'ALTER TABLE hkex_ccass_holdings ALTER COLUMN content_hash DROP NOT NULL;'
      });

    if (error) {
      console.error('❌ Error applying fix:', error.message);
      console.log('\n📝 Please apply this SQL manually in Supabase SQL Editor:');
      console.log('   URL: https://supabase.com/dashboard/project/kiztaihzanqnrcrqaxsv/sql/new\n');
      console.log('   SQL:');
      console.log('   ALTER TABLE hkex_ccass_holdings');
      console.log('     ALTER COLUMN content_hash DROP NOT NULL;\n');
      return false;
    }

    console.log('✅ Successfully applied fix!');
    console.log('   content_hash column is now nullable\n');

    // Verify the fix
    console.log('🔍 Verifying fix...');
    const { data: verifyData, error: verifyError } = await supabase
      .rpc('exec', {
        sql: `
          SELECT column_name, is_nullable
          FROM information_schema.columns
          WHERE table_name = 'hkex_ccass_holdings'
            AND column_name = 'content_hash';
        `
      });

    if (!verifyError && verifyData) {
      console.log('Verification:', verifyData);
    }

    console.log('\n✅ Fix applied successfully!');
    console.log('🚀 Ready to restart batch scraper\n');
    return true;

  } catch (error) {
    console.error('❌ Unexpected error:', error.message);
    console.log('\n📝 Please apply the fix manually:');
    console.log('   1. Open: https://supabase.com/dashboard/project/kiztaihzanqnrcrqaxsv/sql/new');
    console.log('   2. Run: ALTER TABLE hkex_ccass_holdings ALTER COLUMN content_hash DROP NOT NULL;');
    return false;
  }
}

// Run the fix
applyFix().then(success => {
  if (success) {
    console.log('✅ All done! You can now run the batch scraper:');
    console.log('   timeout 1800 node scrape-ccass-batch.cjs stock-codes-top30.txt 2025/11/10 2025/11/11\n');
  }
  process.exit(success ? 0 : 1);
});
