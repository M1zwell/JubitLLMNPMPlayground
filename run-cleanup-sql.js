// Run cleanup SQL directly on production database
async function cleanupDatabase() {
  const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

  console.log('🧹 Running cleanup SQL via Edge Function...\n');

  const cleanupSQL = `
-- Delete HKSFC filings from old URL (before 2025-11-10 10:05:00 UTC)
DELETE FROM hksfc_filings WHERE scraped_at < '2025-11-10 10:05:00+00';

-- Delete HKEX announcements from old URL
DELETE FROM hkex_announcements WHERE scraped_at < '2025-11-10 10:05:00+00';

-- Return counts
SELECT
  'HKSFC filings' as table_name,
  COUNT(*) as remaining_records
FROM hksfc_filings
UNION ALL
SELECT
  'HKEX announcements',
  COUNT(*)
FROM hkex_announcements;
  `.trim();

  try {
    const response = await fetch(`${SUPABASE_URL}/functions/v1/exec-sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({ query: cleanupSQL })
    });

    const data = await response.json();

    if (response.ok) {
      console.log('✅ Cleanup SQL executed successfully:');
      console.log(JSON.stringify(data, null, 2));
    } else {
      console.log('❌ Error executing SQL:');
      console.log(JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('❌ Request failed:', error.message);
  }
}

cleanupDatabase();
