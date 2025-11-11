import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MTYyODE3NywiZXhwIjoyMDY3MjA0MTc3fQ.aXgFqY7MvYcBJ4oa0jmR6hX_fBx0pV0rnWt5iXcPX9c';

async function testDatabase() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  console.log('🔍 Testing HKSFC database schema and insertion...\n');

  // Test 1: Try to insert a test record
  console.log('1️⃣ Attempting to insert test record...');
  const testRecord = {
    title: 'TEST: Schema verification',
    filing_date: '2025-11-11',
    filing_type: 'news',
    url: `https://test.example.com/test-${Date.now()}`,
    content_hash: `test-hash-${Date.now()}`,
    summary: 'This is a test summary',
    pdf_url: 'https://test.example.com/test.pdf',
    tags: ['test', 'schema-check']
  };

  const { data: insertData, error: insertError } = await supabase
    .from('hksfc_filings')
    .insert(testRecord)
    .select('id, title, summary, pdf_url, tags');

  if (insertError) {
    console.error('   ❌ Insert failed:', insertError.message);
    console.error('   Details:', insertError);

    // Check if it's a missing column error
    if (insertError.message.includes('column') && insertError.message.includes('does not exist')) {
      console.error('\n   ⚠️  DIAGNOSIS: Columns were not added to the database!');
      console.error('   Please run the SQL in Supabase Dashboard > SQL Editor:\n');
      console.error('   ALTER TABLE hksfc_filings ADD COLUMN IF NOT EXISTS summary text;');
      console.error('   ALTER TABLE hksfc_filings ADD COLUMN IF NOT EXISTS pdf_url text;');
      console.error('   ALTER TABLE hksfc_filings ADD COLUMN IF NOT EXISTS tags text[];');
    }
  } else {
    console.log('   ✅ Insert successful!');
    console.log('   Record ID:', insertData[0]?.id);
    console.log('   Title:', insertData[0]?.title);
    console.log('   Summary:', insertData[0]?.summary);
    console.log('   PDF URL:', insertData[0]?.pdf_url);
    console.log('   Tags:', insertData[0]?.tags);

    // Clean up test record
    console.log('\n2️⃣ Cleaning up test record...');
    const { error: deleteError } = await supabase
      .from('hksfc_filings')
      .delete()
      .eq('id', insertData[0].id);

    if (deleteError) {
      console.error('   ⚠️  Cleanup failed:', deleteError.message);
    } else {
      console.log('   ✅ Test record deleted');
    }
  }

  // Test 2: Check existing records
  console.log('\n3️⃣ Checking existing HKSFC records...');
  const { data: records, error: queryError } = await supabase
    .from('hksfc_filings')
    .select('id, title, filing_date, summary, tags')
    .order('scraped_at', { ascending: false })
    .limit(5);

  if (queryError) {
    console.error('   ❌ Query failed:', queryError.message);
  } else {
    console.log(`   ✅ Found ${records.length} recent records`);
    if (records.length > 0) {
      records.forEach((rec, i) => {
        console.log(`\n   ${i + 1}. ${rec.title}`);
        console.log(`      Date: ${rec.filing_date}`);
        console.log(`      Summary: ${rec.summary || '(none)'}`);
        console.log(`      Tags: ${rec.tags?.join(', ') || '(none)'}`);
      });
    } else {
      console.log('   📭 No records in database yet');
    }
  }

  console.log('\n' + '='.repeat(80));
  return !insertError;
}

testDatabase()
  .then(success => {
    if (success) {
      console.log('✅ Database schema is correct!');
      console.log('Run: node test-hksfc-news.js to test actual scraping\n');
    } else {
      console.log('❌ Database schema has issues. See errors above.\n');
    }
  });
