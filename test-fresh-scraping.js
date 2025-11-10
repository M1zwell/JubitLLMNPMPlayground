import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

async function testFreshScraping() {
  console.log('🧪 Testing FRESH scraping with NEW URLs...\n');

  // Test HKSFC scraping with new URL
  console.log('1️⃣  Testing HKSFC News scraping...');
  console.log('   New URL: https://www.sfc.hk/en/News-and-announcements/News/All-news\n');

  try {
    const hksfcResponse = await fetch(`${SUPABASE_URL}/functions/v1/scrape-orchestrator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        source: 'hksfc-news',
        strategy: 'firecrawl',
        options: {
          dateRange: {
            start: '2025-10-01',
            end: '2025-11-10'
          }
        }
      })
    });

    const hksfcData = await hksfcResponse.json();

    if (hksfcResponse.ok && hksfcData.success) {
      console.log('✅ HKSFC scraping succeeded!');
      console.log(`   Execution time: ${hksfcData.executionTime}ms`);
      console.log(`   Articles found: ${hksfcData.data?.articles?.length || 0}`);

      if (hksfcData.data?.articles?.length > 0) {
        console.log('\n   Sample articles:');
        hksfcData.data.articles.slice(0, 3).forEach((article, idx) => {
          console.log(`   ${idx + 1}. [${article.category}] ${article.title?.substring(0, 60)}...`);
          console.log(`      Date: ${article.publishDate || 'N/A'}`);
        });
      }
    } else {
      console.log('❌ HKSFC scraping failed:');
      console.log(`   Error: ${hksfcData.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.log('❌ HKSFC request failed:', error.message);
  }

  console.log('\n' + '='.repeat(70) + '\n');

  // Test HKEX scraping with new date format
  console.log('2️⃣  Testing HKEX CCASS scraping...');
  console.log('   Date format: YYYY/MM/DD (e.g., 2025/11/10)\n');

  try {
    const hkexResponse = await fetch(`${SUPABASE_URL}/functions/v1/scrape-orchestrator`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      },
      body: JSON.stringify({
        source: 'hkex-ccass',
        strategy: 'firecrawl',
        options: {
          stockCodes: ['00700'], // Just Tencent for quick test
          dateRange: {
            start: '2025-11-09' // Yesterday's date
          }
        }
      })
    });

    const hkexData = await hkexResponse.json();

    if (hkexResponse.ok && hkexData.success) {
      console.log('✅ HKEX scraping succeeded!');
      console.log(`   Execution time: ${hkexData.executionTime}ms`);

      if (Array.isArray(hkexData.data) && hkexData.data.length > 0) {
        const stockData = hkexData.data[0];
        console.log(`   Stock: ${stockData.stockName} (${stockData.stockCode})`);
        console.log(`   Participants: ${stockData.participants?.length || 0}`);
        console.log(`   Total shares: ${stockData.totalShares?.toLocaleString() || 'N/A'}`);

        if (stockData.participants && stockData.participants.length > 0) {
          console.log('\n   Sample participants:');
          stockData.participants.slice(0, 3).forEach((p, idx) => {
            console.log(`   ${idx + 1}. ${p.participantId} - ${p.participantName}`);
            console.log(`      Shares: ${p.shareholding?.toLocaleString()} (${p.percentage}%)`);
          });
        }
      }
    } else {
      console.log('❌ HKEX scraping failed:');
      console.log(`   Error: ${hkexData.error || 'Unknown error'}`);
    }
  } catch (error) {
    console.log('❌ HKEX request failed:', error.message);
  }

  console.log('\n' + '='.repeat(70) + '\n');
  console.log('✅ Fresh scraping test complete!');
  console.log('📝 New data uses corrected URLs and date formats');
}

testFreshScraping().catch(console.error);
