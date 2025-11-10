import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkDatabase() {
  console.log('=== Checking HKSFC Filings ===\n');

  // Check HKSFC total count
  const { count: hksfcCount, error: hksfcCountError } = await supabase
    .from('hksfc_filings')
    .select('*', { count: 'exact', head: true });

  if (hksfcCountError) {
    console.log('Error counting HKSFC filings:', hksfcCountError.message);
  } else {
    console.log(`Total HKSFC records: ${hksfcCount}`);
  }

  // Get recent HKSFC records
  const { data: hksfcRecent, error: hksfcError } = await supabase
    .from('hksfc_filings')
    .select('id, title, filing_type, filing_date, url, scraped_at')
    .order('scraped_at', { ascending: false })
    .limit(5);

  if (hksfcError) {
    console.log('Error fetching HKSFC records:', hksfcError.message);
  } else {
    console.log('\nRecent HKSFC records:');
    hksfcRecent.forEach((record, idx) => {
      console.log(`${idx + 1}. [${record.filing_type}] ${record.title?.substring(0, 60)}...`);
      console.log(`   Filing Date: ${record.filing_date}`);
      console.log(`   Scraped At: ${record.scraped_at}`);
      console.log(`   URL: ${record.url?.substring(0, 80)}...`);
      console.log('');
    });
  }

  console.log('\n=== Checking HKEX Announcements ===\n');

  // Check HKEX total count
  const { count: hkexCount, error: hkexCountError } = await supabase
    .from('hkex_announcements')
    .select('*', { count: 'exact', head: true });

  if (hkexCountError) {
    console.log('Error counting HKEX announcements:', hkexCountError.message);
  } else {
    console.log(`Total HKEX records: ${hkexCount}`);
  }

  // Get recent HKEX records
  const { data: hkexRecent, error: hkexError } = await supabase
    .from('hkex_announcements')
    .select('id, announcement_title, announcement_type, announcement_date, scraped_at, ccass_participant_id')
    .order('scraped_at', { ascending: false })
    .limit(5);

  if (hkexError) {
    console.log('Error fetching HKEX records:', hkexError.message);
  } else {
    console.log('\nRecent HKEX records:');
    hkexRecent.forEach((record, idx) => {
      console.log(`${idx + 1}. ${record.announcement_title?.substring(0, 60)}...`);
      console.log(`   Type: ${record.announcement_type}`);
      console.log(`   Date: ${record.announcement_date}`);
      console.log(`   Scraped At: ${record.scraped_at}`);
      if (record.ccass_participant_id) {
        console.log(`   CCASS Participant: ${record.ccass_participant_id}`);
      }
      console.log('');
    });
  }

  // Check for data scraped before URL fix (before 2025-11-10 10:05:00)
  const urlFixTime = '2025-11-10T10:05:00Z';

  const { count: oldHksfcCount } = await supabase
    .from('hksfc_filings')
    .select('*', { count: 'exact', head: true })
    .lt('scraped_at', urlFixTime);

  const { count: oldHkexCount } = await supabase
    .from('hkex_announcements')
    .select('*', { count: 'exact', head: true })
    .lt('scraped_at', urlFixTime);

  console.log('\n=== Data from OLD URLs (before fix) ===');
  console.log(`HKSFC records from old URL: ${oldHksfcCount || 0}`);
  console.log(`HKEX records from old URL: ${oldHkexCount || 0}`);

  if ((oldHksfcCount && oldHksfcCount > 0) || (oldHkexCount && oldHkexCount > 0)) {
    console.log('\n⚠️ WARNING: Database contains data scraped with OLD URLs!');
    console.log('This data may be invalid/expired and should be cleaned.');
  } else {
    console.log('\n✅ Database only contains data from NEW URLs (after fix)');
  }
}

checkDatabase().catch(console.error);
