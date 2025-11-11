import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';

const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

async function debugScrape() {
  console.log('🔍 Debug scraping HKEX CCASS for stock 700...\n');

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
          stockCodes: ['00700'],
          dateRange: {
            start: '2025-11-04'
          }
        }
      })
    });

    const data = await response.json();

    console.log('📋 Full Response:');
    console.log(JSON.stringify(data, null, 2));

    // Save response to file for analysis
    writeFileSync('debug-scrape-response.json', JSON.stringify(data, null, 2), 'utf8');
    console.log('\n📁 Response saved to: debug-scrape-response.json');

    if (data.data && data.data[0]) {
      const stockData = data.data[0];

      if (stockData.error) {
        console.log('\n❌ Error:', stockData.error);
      }

      if (stockData.participants && stockData.participants.length > 0) {
        console.log(`\n✅ Success! Found ${stockData.participants.length} participants`);
      } else {
        console.log('\n⚠️  No participants found');
      }
    }

  } catch (error) {
    console.error('❌ Fetch error:', error.message);
  }
}

debugScrape().catch(console.error);
