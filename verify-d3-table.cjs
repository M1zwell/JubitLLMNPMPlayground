const { createClient } = require('@supabase/supabase-js');

// Supabase setup
const supabaseUrl = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';
const supabase = createClient(supabaseUrl, supabaseKey);

console.log('Verifying d3_fund_nav_by_type table...\n');

async function verify() {
  // Try to query the table
  const { data, error, count } = await supabase
    .from('d3_fund_nav_by_type')
    .select('*', { count: 'exact', head: false })
    .limit(5);

  console.log('Query result:');
  console.log('  Data:', data);
  console.log('  Error:', error);
  console.log('  Count:', count);

  if (error) {
    console.log('\nFull error object:', JSON.stringify(error, null, 2));
  }

  // Try a simple insert
  console.log('\n\nTrying simple insert...');
  const testRecord = {
    as_at_date: '2025-08-31',
    domicile: 'HK',
    fund_type: 'Bond',
    nav_usd_mn: 12345
  };

  const { data: insertData, error: insertError } = await supabase
    .from('d3_fund_nav_by_type')
    .insert([testRecord])
    .select();

  console.log('Insert result:');
  console.log('  Data:', insertData);
  console.log('  Error:', insertError);

  if (insertError) {
    console.log('\nFull insert error:', JSON.stringify(insertError, null, 2));
  }
}

verify().catch(e => console.error('Exception:', e));
