import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function cleanupDatabase() {
  console.log('🧹 Starting database cleanup...\n');

  // URL fix deployment time - delete everything before this
  const urlFixTime = '2025-11-10T10:05:00Z';

  console.log(`Deleting records scraped before: ${urlFixTime}\n`);

  // Delete old HKSFC filings
  const { data: deletedHksfc, error: hksfcError } = await supabase
    .from('hksfc_filings')
    .delete()
    .lt('scraped_at', urlFixTime)
    .select();

  if (hksfcError) {
    console.log('❌ Error deleting HKSFC filings:', hksfcError.message);
  } else {
    console.log(`✅ Deleted ${deletedHksfc?.length || 0} HKSFC filing records`);
  }

  // Delete old HKEX announcements
  const { data: deletedHkex, error: hkexError } = await supabase
    .from('hkex_announcements')
    .delete()
    .lt('scraped_at', urlFixTime)
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
    console.log('\n✅ Database cleaned successfully - ready for fresh data!');
  } else {
    console.log('\n⚠️ Some records remain (these were scraped after URL fix)');
  }
}

cleanupDatabase().catch(console.error);
