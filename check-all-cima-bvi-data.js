import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkData() {
  console.log('📊 Checking current database status...\n');

  // Check CIMA entities
  const { data: cimaData, error: cimaError, count: cimaCount } = await supabase
    .from('cima_entities')
    .select('entity_type', { count: 'exact' });

  if (!cimaError) {
    console.log('✅ CIMA Entities:', cimaCount || 0);
    if (cimaData) {
      const typeGroups = {};
      cimaData.forEach(e => {
        typeGroups[e.entity_type] = (typeGroups[e.entity_type] || 0) + 1;
      });
      console.log('   By type:');
      Object.entries(typeGroups).forEach(([type, count]) => {
        console.log(`   - ${type}: ${count}`);
      });
    }
  } else {
    console.log('❌ CIMA Error:', cimaError.message);
  }

  // Check BVI entities
  const { data: bviData, error: bviError, count: bviCount } = await supabase
    .from('bvi_entities')
    .select('entity_type', { count: 'exact' });

  if (!bviError) {
    console.log('\n✅ BVI Entities:', bviCount || 0);
    if (bviData && bviData.length > 0) {
      const typeGroups = {};
      bviData.forEach(e => {
        typeGroups[e.entity_type] = (typeGroups[e.entity_type] || 0) + 1;
      });
      console.log('   By type:');
      Object.entries(typeGroups).forEach(([type, count]) => {
        console.log(`   - ${type}: ${count}`);
      });
    } else {
      console.log('   (No data yet)');
    }
  } else {
    console.log('❌ BVI Error:', bviError.message);
  }
}

checkData();
