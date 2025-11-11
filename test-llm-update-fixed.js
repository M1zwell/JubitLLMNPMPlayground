// Test script for fixed llm-update Edge Function

const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

async function testFixedLLMUpdate() {
  console.log('🧪 Testing Fixed LLM Update Function');
  console.log('═'.repeat(60));

  try {
    console.log('📤 Calling llm-update with proper payload...\n');

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

    console.log(`📊 Response Status: ${response.status} ${response.statusText}`);

    const data = await response.json();

    console.log('\n📄 Response Data:');
    console.log(JSON.stringify(data, null, 2));

    if (data.success) {
      console.log('\n✅ SUCCESS! Function is now working!');
      console.log('═'.repeat(60));
      console.log('Statistics:');
      console.log(`  📊 Total Processed: ${data.stats.total_processed}`);
      console.log(`  ➕ Models Added: ${data.stats.models_added}`);
      console.log(`  🔄 Models Updated: ${data.stats.models_updated}`);
      console.log(`  🏢 Providers: ${data.stats.providers_found.length}`);
      console.log(`  📂 Categories: ${data.stats.categories_updated.length}`);
      console.log('═'.repeat(60));

      console.log('\n🏢 Providers Found:');
      data.stats.providers_found.forEach(provider => {
        console.log(`  - ${provider}`);
      });

      console.log('\n📂 Categories Updated:');
      data.stats.categories_updated.forEach(category => {
        console.log(`  - ${category}`);
      });

      console.log('\n💾 Log ID:', data.logId);
      console.log('📝 Message:', data.message);

      // Verify database
      console.log('\n🔍 Verifying database...');
      await verifyDatabase();

    } else {
      console.log('\n❌ FAILED! Function still has issues:');
      console.log('═'.repeat(60));
      console.log('Error:', data.error);
      console.log('Timestamp:', data.timestamp);
      console.log('═'.repeat(60));
      console.log('\n📋 Troubleshooting steps:');
      console.log('1. Check if Docker Desktop is running');
      console.log('2. Deploy the function: supabase functions deploy llm-update');
      console.log('3. Check function logs: supabase functions logs llm-update');
      console.log('4. Verify environment variables in Supabase dashboard');
    }

  } catch (error) {
    console.error('\n💥 Test Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

async function verifyDatabase() {
  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/llm_models?select=name,provider,model_id,created_at&order=created_at.desc&limit=5`,
      {
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
          'Accept': 'application/json'
        }
      }
    );

    if (response.ok) {
      const models = await response.json();
      console.log(`✅ Found ${models.length} recent models in database`);

      if (models.length > 0) {
        console.log('\n📋 Latest Models:');
        models.forEach((model, index) => {
          console.log(`  ${index + 1}. ${model.name} (${model.provider}) - ${model.model_id}`);
        });
      }
    } else {
      console.log('⚠️  Could not verify database (may need authentication)');
    }
  } catch (error) {
    console.log('⚠️  Database verification skipped:', error.message);
  }
}

async function checkDeploymentStatus() {
  console.log('\n🔍 Checking Deployment Status');
  console.log('━'.repeat(60));

  // Check if Docker is running
  console.log('📦 Docker Status:');
  try {
    const { exec } = require('child_process');
    exec('docker info', (error, stdout, stderr) => {
      if (error) {
        console.log('  ❌ Docker is not running or not accessible');
        console.log('  💡 Start Docker Desktop to deploy the function');
      } else {
        console.log('  ✅ Docker is running');
      }
    });
  } catch (error) {
    console.log('  ⚠️  Could not check Docker status');
  }

  // Check if function file exists
  const fs = require('fs');
  const functionPath = 'supabase/functions/llm-update/index.ts';
  const backupPath = 'supabase/functions/llm-update/index.ts.backup';

  console.log('\n📁 Function Files:');
  if (fs.existsSync(functionPath)) {
    console.log(`  ✅ ${functionPath} exists`);
    const stats = fs.statSync(functionPath);
    console.log(`     Size: ${stats.size} bytes`);
    console.log(`     Modified: ${stats.mtime.toLocaleString()}`);
  } else {
    console.log(`  ❌ ${functionPath} not found`);
  }

  if (fs.existsSync(backupPath)) {
    console.log(`  ✅ ${backupPath} exists (backup created)`);
  }
}

// Run all tests
async function runAllTests() {
  await testFixedLLMUpdate();
  await checkDeploymentStatus();

  console.log('\n' + '═'.repeat(60));
  console.log('🎯 NEXT STEPS:');
  console.log('═'.repeat(60));
  console.log('1. If test failed, ensure Docker Desktop is running');
  console.log('2. Deploy: supabase functions deploy llm-update');
  console.log('3. Re-run this test: node test-llm-update-fixed.js');
  console.log('4. Check full test suite: node test-bmad-scraping.js');
  console.log('═'.repeat(60));
}

runAllTests().catch(console.error);
