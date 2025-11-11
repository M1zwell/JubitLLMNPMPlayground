import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

/**
 * Test HKEX CCASS Scraping with Database Saving
 * Stock: 00700 (Tencent) - Popular stock with many participants
 */

async function testHKEXCCASS() {
  console.log('🔍 Testing HKEX CCASS Scraping with Database Saving...\n');
  console.log('Stock Code: 00700 (Tencent)\n');

  const startTime = Date.now();

  try {
    // Call the scrape-orchestrator Edge Function
    const response = await fetch(`${SUPABASE_URL}/functions/v1/scrape-orchestrator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        source: 'hkex-ccass',
        strategy: 'firecrawl',
        options: {
          stockCodes: ['00700'],  // Array of stock codes
          useActions: true  // Use Firecrawl actions for React SPA
        }
      })
    });

    const data = await response.json();
    const duration = Date.now() - startTime;

    console.log('📋 Response Status:', response.status);
    console.log('⏱️  Execution Time:', duration, 'ms\n');

    if (!response.ok || !data.success) {
      console.error('❌ Scraping failed!');
      console.error('Error:', JSON.stringify(data, null, 2));
      return null;
    }

    console.log('✅ Scraping successful!\n');

    // Extract CCASS data
    const ccassData = data.data;

    console.log('📊 CCASS Summary:');
    console.log(`   Stock Code: ${ccassData.stockCode}`);
    console.log(`   Stock Name: ${ccassData.stockName}`);
    console.log(`   Data Date: ${ccassData.dataDate}`);
    console.log(`   Total Participants: ${ccassData.participants?.length || 0}`);
    console.log(`   Total Shareholding: ${ccassData.totalShareholding?.toLocaleString()}`);
    console.log(`   Total Percentage: ${ccassData.totalPercentage}%`);

    if (ccassData.participants && ccassData.participants.length > 0) {
      console.log('\n📈 Top 5 Participants:\n');
      ccassData.participants.slice(0, 5).forEach((p, i) => {
        console.log(`${i + 1}. ${p.participantName || `Participant ${p.participantId}`}`);
        console.log(`   ID: ${p.participantId}`);
        console.log(`   Shareholding: ${p.shareholding?.toLocaleString()} (${p.percentage}%)`);
        console.log(`   Address: ${p.address || '(not available)'}`);
        console.log('');
      });
    }

    // Check database saving
    console.log('\n🗄️  Checking Database...\n');

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Query hkex_ccass_holdings table
    const { data: holdings, error: queryError } = await supabase
      .from('hkex_ccass_holdings')
      .select('id, stock_code, stock_name, data_date, participant_id, participant_name, shareholding, percentage')
      .eq('stock_code', '00700')
      .order('shareholding', { ascending: false })
      .limit(5);

    if (queryError) {
      console.error('❌ Database query failed:', queryError.message);
    } else if (holdings && holdings.length > 0) {
      console.log(`✅ Found ${holdings.length} records in database for 00700:\n`);
      holdings.forEach((rec, i) => {
        console.log(`${i + 1}. ${rec.participant_name || `Participant ${rec.participant_id}`}`);
        console.log(`   Stock: ${rec.stock_code} (${rec.stock_name})`);
        console.log(`   Date: ${rec.data_date}`);
        console.log(`   Shareholding: ${rec.shareholding?.toLocaleString()} (${rec.percentage}%)`);
        console.log('');
      });
    } else {
      console.log('⚠️  No records found in database for 00700');
      console.log('   Note: Database saving may not be enabled for CCASS yet');
    }

    // Save response for inspection
    const fs = await import('fs');
    fs.writeFileSync('hkex-ccass-response.json', JSON.stringify(data, null, 2), 'utf8');
    console.log('💾 Full response saved to: hkex-ccass-response.json\n');

    return ccassData;

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
    return null;
  }
}

// Run test
console.log('\n');
console.log('═'.repeat(80));
console.log('  HKEX CCASS SCRAPING & DATABASE TEST');
console.log('═'.repeat(80));
console.log('\n');

testHKEXCCASS()
  .then(data => {
    if (data && data.participants && data.participants.length > 0) {
      console.log('═'.repeat(80));
      console.log('  ✅ TEST COMPLETE');
      console.log('═'.repeat(80));
      console.log(`\n  Successfully scraped CCASS data for ${data.stockCode}`);
      console.log(`  Extracted ${data.participants.length} participants\n`);
    } else {
      console.log('═'.repeat(80));
      console.log('  ❌ TEST FAILED');
      console.log('═'.repeat(80));
      console.log('\n  Unable to scrape CCASS data - see errors above\n');
    }
  })
  .catch(console.error);
