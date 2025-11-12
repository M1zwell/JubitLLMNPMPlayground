const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
  console.log('\n🔍 Checking table schemas...\n');

  // Get HKSFC table structure
  const { data: hksfc } = await supabase
    .from('hksfc_filings')
    .select('*')
    .limit(1);

  console.log('HKSFC Table Columns:');
  if (hksfc && hksfc[0]) {
    Object.keys(hksfc[0]).forEach(col => console.log(`  - ${col}`));
  }

  // Get CCASS table structure
  const { data: ccass } = await supabase
    .from('hkex_ccass_holdings')
    .select('*')
    .limit(1);

  console.log('\nCCASS Table Columns:');
  if (ccass && ccass[0]) {
    Object.keys(ccass[0]).forEach(col => console.log(`  - ${col}`));
  }

  // Check what V2 adapter is trying to insert
  console.log('\n📋 V2 Adapter fields (from code):');
  console.log('\nHKSFC V2 returns:');
  console.log('  - title');
  console.log('  - content');
  console.log('  - summary');
  console.log('  - filing_type');
  console.log('  - category ❓');
  console.log('  - company_code');
  console.log('  - company_name');
  console.log('  - filing_date');
  console.log('  - publish_date ❓');
  console.log('  - url');
  console.log('  - pdf_url');
  console.log('  - tags');

  console.log('\nCCASS V2 returns:');
  console.log('  - stock_code');
  console.log('  - stock_name');
  console.log('  - participant_id');
  console.log('  - participant_name');
  console.log('  - address');
  console.log('  - shareholding');
  console.log('  - percentage');
  console.log('  - data_date ❓');
  console.log('  - scraped_at');
}

checkSchema().catch(console.error);
