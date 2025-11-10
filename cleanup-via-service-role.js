import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
// Using service role key for admin operations (delete permission)
const SUPABASE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTcyMDE0Njk2NywiZXhwIjoyMDM1NzIyOTY3fQ.SrfCp7TLjFKOi_HJvL7dMwLQK0Ar6LT0c77fRPZa7Hc';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function cleanupDatabase() {
  console.log('🧹 Starting database cleanup with service role...\n');

  console.log('⚠️  This will DELETE ALL records from:');
  console.log('   - hksfc_filings');
  console.log('   - hkex_announcements');
  console.log('\nReason: All existing data was scraped with OLD/BROKEN URLs\n');

  // Delete all HKSFC filings
  const { data: deletedHksfc, error: hksfcError } = await supabase
    .from('hksfc_filings')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all (non-existent ID)
    .select();

  if (hksfcError) {
    console.log('❌ Error deleting HKSFC filings:', hksfcError.message);
  } else {
    console.log(`✅ Deleted ${deletedHksfc?.length || 0} HKSFC filing records`);
  }

  // Delete all HKEX announcements
  const { data: deletedHkex, error: hkexError } = await supabase
    .from('hkex_announcements')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000') // Delete all (non-existent ID)
    .select();

  if (hkexError) {
    console.log('❌ Error deleting HKEX announcements:', hkexError.message);
  } else {
    console.log(`✅ Deleted ${deletedHkex?.length || 0} HKEX announcement records`);
  }

  // Verify cleanup
  console.log('\n📊 Verifying cleanup...\n');

  const { count: hksfcRemaining } = await supabase
    .from('hksfc_filings')
    .select('*', { count: 'exact', head: true });

  const { count: hkexRemaining } = await supabase
    .from('hkex_announcements')
    .select('*', { count: 'exact', head: true });

  console.log(`Remaining HKSFC records: ${hksfcRemaining || 0}`);
  console.log(`Remaining HKEX records: ${hkexRemaining || 0}`);

  if (hksfcRemaining === 0 && hkexRemaining === 0) {
    console.log('\n✅ Database cleaned successfully!');
    console.log('📝 Ready to scrape fresh data with CORRECTED URLs');
  } else {
    console.log('\n⚠️ Cleanup incomplete');
  }
}

cleanupDatabase().catch(console.error);
