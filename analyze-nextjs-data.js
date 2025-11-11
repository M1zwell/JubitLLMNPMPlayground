// Analyze Next.js data structure from artificialanalysis.ai

async function analyzeNextJSData() {
  console.log('🔍 Analyzing Next.js data structure...');
  console.log('═'.repeat(60));

  const url = 'https://artificialanalysis.ai/leaderboards/providers';

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      }
    });

    const html = await response.text();
    console.log(`✅ Fetched ${html.length} characters\n`);

    // Look for Next.js script tags with JSON data
    console.log('🔍 Looking for Next.js data patterns...\n');

    // Pattern 1: <script id="__NEXT_DATA__" type="application/json">
    const nextDataMatch = html.match(/<script id="__NEXT_DATA__" type="application\/json">([^<]*)<\/script>/);
    if (nextDataMatch) {
      console.log('✅ Found __NEXT_DATA__!');
      const jsonString = nextDataMatch[1];
      console.log(`JSON Length: ${jsonString.length} chars`);

      try {
        const data = JSON.parse(jsonString);
        console.log('\n✅ Successfully parsed __NEXT_DATA__!');
        console.log('Top-level keys:', Object.keys(data));

        if (data.props) {
          console.log('  props keys:', Object.keys(data.props));
          if (data.props.pageProps) {
            console.log('    pageProps keys:', Object.keys(data.props.pageProps));

            // Look for model data
            const pagePropsStr = JSON.stringify(data.props.pageProps);
            console.log(`\n📊 pageProps size: ${pagePropsStr.length} chars`);

            // Check for model references
            const modelChecks = ['gpt-4', 'claude', 'gemini', 'llama', 'mistral', 'provider'];
            modelChecks.forEach(term => {
              const count = (pagePropsStr.toLowerCase().match(new RegExp(term, 'g')) || []).length;
              if (count > 0) {
                console.log(`  - "${term}": ${count} occurrences`);
              }
            });

            // Try to find arrays that might contain model data
            if (data.props.pageProps.providers) {
              console.log('\n✅ Found providers array!');
              console.log(`  Providers count: ${data.props.pageProps.providers.length}`);
              if (data.props.pageProps.providers[0]) {
                console.log('  First provider sample:', JSON.stringify(data.props.pageProps.providers[0], null, 2).substring(0, 500));
              }
            }

            if (data.props.pageProps.models) {
              console.log('\n✅ Found models array!');
              console.log(`  Models count: ${data.props.pageProps.models.length}`);
              if (data.props.pageProps.models[0]) {
                console.log('  First model sample:', JSON.stringify(data.props.pageProps.models[0], null, 2).substring(0, 500));
              }
            }

            // Search for any arrays
            for (const [key, value] of Object.entries(data.props.pageProps)) {
              if (Array.isArray(value) && value.length > 0) {
                console.log(`\n✅ Found array: ${key} (${value.length} items)`);
                const sample = JSON.stringify(value[0], null, 2);
                console.log(`  Sample:\n${sample.substring(0, 300)}...`);
              }
            }
          }
        }

        // Save full data for inspection
        const fs = require('fs');
        fs.writeFileSync('nextjs-data.json', JSON.stringify(data, null, 2));
        console.log('\n📁 Saved full data to nextjs-data.json');

      } catch (parseError) {
        console.error('❌ Failed to parse JSON:', parseError.message);
      }
    } else {
      console.log('❌ No __NEXT_DATA__ found');

      // Try to find any JSON in script tags
      console.log('\n🔍 Searching for any JSON in script tags...');
      const scriptMatches = html.match(/<script[^>]*>([^<]+)<\/script>/gi);
      if (scriptMatches) {
        console.log(`Found ${scriptMatches.length} script tags`);

        let foundJsonScript = false;
        for (let i = 0; i < Math.min(scriptMatches.length, 50); i++) {
          const script = scriptMatches[i];
          if (script.includes('{') && script.includes('providers') || script.includes('models')) {
            console.log(`\nScript ${i} (contains providers/models):`);
            console.log(script.substring(0, 500));
            foundJsonScript = true;
          }
        }

        if (!foundJsonScript) {
          console.log('No scripts with provider/model data found in first 50 scripts');
        }
      }
    }

    // Look for inline window objects
    console.log('\n🔍 Looking for window.* data assignments...');
    const windowMatches = html.match(/window\.__[A-Z_]+__\s*=\s*{/g);
    if (windowMatches) {
      console.log('Found window assignments:', windowMatches);
    }

  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

analyzeNextJSData().catch(console.error);
