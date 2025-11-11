// Test script to fetch data from artificialanalysis.ai
// Debug the LLM update function issue

async function testFetchArtificialAnalysis() {
  console.log('🔍 Testing artificialanalysis.ai data fetch...');
  console.log('═'.repeat(60));

  const url = 'https://artificialanalysis.ai/leaderboards/providers';

  try {
    console.log(`📡 Fetching: ${url}`);

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.5',
        'Accept-Encoding': 'gzip, deflate, br',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
      }
    });

    console.log(`\n📊 Response Status: ${response.status} ${response.statusText}`);
    console.log('Response Headers:');
    console.log('  Content-Type:', response.headers.get('content-type'));
    console.log('  Content-Length:', response.headers.get('content-length'));

    if (!response.ok) {
      console.error(`❌ HTTP Error: ${response.status}`);
      return;
    }

    const html = await response.text();
    console.log(`\n📄 HTML Length: ${html.length} characters`);
    console.log(`\n🔍 First 500 characters:`);
    console.log(html.substring(0, 500));
    console.log('\n...\n');

    // Look for JSON data in script tags
    console.log('🔍 Searching for JSON data in script tags...');

    // Try to find __NUXT__ data
    const nuxtMatches = html.match(/<script[^>]*>[\s\S]*?window\.__NUXT__\s*=\s*({[\s\S]*?});[\s\S]*?<\/script>/);
    if (nuxtMatches) {
      console.log('✅ Found window.__NUXT__ data!');
      const jsonString = nuxtMatches[1];
      console.log(`JSON Length: ${jsonString.length} characters`);
      console.log(`First 500 chars of JSON:\n${jsonString.substring(0, 500)}`);

      try {
        const jsonData = JSON.parse(jsonString);
        console.log('\n✅ Successfully parsed JSON!');
        console.log('JSON structure:', Object.keys(jsonData));

        if (jsonData.data) {
          console.log('jsonData.data structure:', Object.keys(jsonData.data));
        }

        // Look for model data
        const dataString = JSON.stringify(jsonData);
        if (dataString.includes('gpt-4') || dataString.includes('GPT-4')) {
          console.log('✅ Found GPT-4 references in data');
        }
        if (dataString.includes('claude') || dataString.includes('Claude')) {
          console.log('✅ Found Claude references in data');
        }
        if (dataString.includes('gemini') || dataString.includes('Gemini')) {
          console.log('✅ Found Gemini references in data');
        }

      } catch (parseError) {
        console.error('❌ Failed to parse JSON:', parseError.message);
        console.log('JSON sample:', jsonString.substring(0, 200));
      }
    } else {
      console.log('❌ No window.__NUXT__ data found');
    }

    // Look for table data
    console.log('\n🔍 Searching for table data...');
    const tableMatches = html.match(/<table[^>]*>[\s\S]*?<\/table>/gi);
    if (tableMatches) {
      console.log(`✅ Found ${tableMatches.length} table(s)`);
      console.log('First table length:', tableMatches[0].length, 'chars');
    } else {
      console.log('❌ No tables found');
    }

    // Look for specific model names in HTML
    console.log('\n🔍 Checking for model names in HTML...');
    const modelChecks = [
      'gpt-4', 'GPT-4',
      'claude', 'Claude',
      'gemini', 'Gemini',
      'llama', 'Llama',
      'mistral', 'Mistral'
    ];

    modelChecks.forEach(model => {
      if (html.toLowerCase().includes(model.toLowerCase())) {
        const count = (html.toLowerCase().match(new RegExp(model.toLowerCase(), 'g')) || []).length;
        console.log(`  ✅ "${model}" found ${count} time(s)`);
      }
    });

    // Check for API endpoints in the HTML
    console.log('\n🔍 Looking for API endpoints...');
    const apiMatches = html.match(/https?:\/\/[^\s"'<>]+api[^\s"'<>]*/gi);
    if (apiMatches) {
      console.log('Found potential API endpoints:');
      [...new Set(apiMatches)].slice(0, 5).forEach(api => console.log('  -', api));
    }

  } catch (error) {
    console.error('💥 Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

async function testLLMUpdateWithPayload() {
  console.log('\n\n🤖 Testing llm-update Edge Function with proper payload...');
  console.log('═'.repeat(60));

  const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
  const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

  try {
    console.log('📤 Calling llm-update with valid JSON payload...');

    const response = await fetch(`${SUPABASE_URL}/functions/v1/llm-update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
        'apikey': SUPABASE_ANON_KEY
      },
      body: JSON.stringify({
        update_type: 'manual',
        force_refresh: false
      })
    });

    console.log(`Response Status: ${response.status}`);

    const contentType = response.headers.get('content-type');
    console.log('Content-Type:', contentType);

    const text = await response.text();
    console.log(`Response Length: ${text.length} chars`);
    console.log('Response:', text);

    if (text) {
      try {
        const data = JSON.parse(text);
        console.log('\n✅ Parsed response:', data);
      } catch (e) {
        console.log('❌ Could not parse as JSON:', e.message);
      }
    }

  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

// Run both tests
async function runTests() {
  await testFetchArtificialAnalysis();
  await testLLMUpdateWithPayload();
}

runTests().catch(console.error);
