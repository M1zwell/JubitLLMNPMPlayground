import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

async function testHKEXScraping() {
  console.log('🧪 Testing HKEX CCASS scraping...\n');

  try {
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
          stockCodes: ['00005'], // HSBC
          dateRange: {
            start: '2025-11-09'
          }
        }
      })
    });

    const data = await response.json();

    console.log('Response Status:', response.status);
    console.log('Response OK:', response.ok);
    console.log('\nFull Response:');
    console.log(JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('\n✅ Scraping successful!');
      console.log('Strategy used:', data.strategy);
      console.log('Execution time:', data.executionTime, 'ms');

      if (Array.isArray(data.data)) {
        console.log('Number of stocks:', data.data.length);

        data.data.forEach((stock, idx) => {
          console.log(`\nStock ${idx + 1}:`);
          console.log('  Code:', stock.stockCode);
          console.log('  Name:', stock.stockName);
          console.log('  Participants:', stock.participants?.length || 0);
          console.log('  Total Shares:', stock.totalShares?.toLocaleString() || 'N/A');

          if (stock.error) {
            console.log('  ❌ Error:', stock.error);
          }

          if (stock.participants && stock.participants.length > 0) {
            console.log('\n  First 3 participants:');
            stock.participants.slice(0, 3).forEach((p, i) => {
              console.log(`    ${i + 1}. ${p.participantId} - ${p.participantName}`);
              console.log(`       Shares: ${p.shareholding?.toLocaleString()} (${p.percentage}%)`);
            });
          } else {
            console.log('  ⚠️ No participants found!');
          }
        });
      } else {
        console.log('⚠️ Unexpected data format:', typeof data.data);
      }
    } else {
      console.log('\n❌ Scraping failed!');
      console.log('Error:', data.error);
    }

  } catch (error) {
    console.log('\n❌ Request failed!');
    console.log('Error:', error.message);
  }
}

testHKEXScraping().catch(console.error);
