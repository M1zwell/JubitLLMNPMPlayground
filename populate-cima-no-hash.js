import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://kiztaihzanqnrcrqaxsv.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Sample CIMA entities based on real Cayman Islands financial entities
const sampleEntities = [
  // Banking
  {
    entity_name: 'Cayman National Bank Ltd.',
    entity_type: 'Banking, Financing and Money Services',
    license_number: 'BNK-001',
    license_status: 'Active',
    address: 'Grand Cayman, Cayman Islands',
    contact_phone: '+1-345-949-4655',
    website: 'https://www.caymannational.com'
  },
  {
    entity_name: 'Butterfield Bank (Cayman) Limited',
    entity_type: 'Banking, Financing and Money Services',
    license_number: 'BNK-002',
    license_status: 'Active',
    address: '65 Market Street, George Town, Grand Cayman',
    contact_phone: '+1-345-949-7055',
    website: 'https://www.butterfieldgroup.com'
  },
  {
    entity_name: 'Royal Bank of Canada (Cayman) Limited',
    entity_type: 'Banking, Financing and Money Services',
    license_number: 'BNK-003',
    license_status: 'Active',
    address: 'RBC House, 24 Shedden Road, George Town',
    contact_phone: '+1-345-949-9107',
    website: 'https://www.rbc.com/caribbean/cayman'
  },
  {
    entity_name: 'Scotiabank & Trust (Cayman) Ltd.',
    entity_type: 'Banking, Financing and Money Services',
    license_number: 'BNK-004',
    license_status: 'Active',
    address: 'Cardinal Plaza, 2nd Floor, 349 Dr. Roy Shores Drive',
    contact_phone: '+1-345-949-7666',
    website: 'https://www.scotiabank.com'
  },

  // Trust & Corporate Services
  {
    entity_name: 'Maples Fiduciary Services (Cayman) Limited',
    entity_type: 'Trust & Corporate Services Providers',
    entity_category: 'Class I Trust Licences - Registered Agent Status',
    license_number: 'TRS-001',
    license_status: 'Active',
    registered_agent_status: true,
    address: 'PO Box 1093, Boundary Hall, Cricket Square, Grand Cayman'
  },
  {
    entity_name: 'Walkers Corporate Limited',
    entity_type: 'Trust & Corporate Services Providers',
    entity_category: 'Class I Trust Licences - Registered Agent Status',
    license_number: 'TRS-002',
    license_status: 'Active',
    registered_agent_status: true,
    address: 'Cayman Corporate Centre, 27 Hospital Road, George Town'
  },
  {
    entity_name: 'Appleby Trust (Cayman) Ltd.',
    entity_type: 'Trust & Corporate Services Providers',
    entity_category: 'Class I Trust Licences - Registered Agent Status',
    license_number: 'TRS-003',
    license_status: 'Active',
    registered_agent_status: true,
    address: '71 Fort Street, Grand Cayman'
  },

  // Insurance
  {
    entity_name: 'Cayman First Insurance Company Ltd',
    entity_type: 'Insurance',
    license_number: 'INS-001',
    license_status: 'Active',
    address: 'Cayman First Building, South Church Street, George Town',
    contact_phone: '+1-345-949-8699'
  },
  {
    entity_name: 'Sagicor General Insurance (Cayman) Limited',
    entity_type: 'Insurance',
    license_number: 'INS-002',
    license_status: 'Active',
    address: 'Sagicor House, Mary Street, George Town',
    contact_phone: '+1-345-949-7822',
    website: 'https://www.sagicor.com'
  },

  // Investment Business
  {
    entity_name: 'Cayman Islands Stock Exchange',
    entity_type: 'Investment Business',
    license_number: 'INV-001',
    license_status: 'Active',
    address: 'Elizabethan Square, 4th Floor, George Town',
    contact_phone: '+1-345-945-6060',
    website: 'https://www.csx.com.ky'
  },
  {
    entity_name: 'Fortress Fund Managers Limited',
    entity_type: 'Investment Business',
    license_number: 'INV-002',
    license_status: 'Active',
    address: 'PO Box 31106, 190 Elgin Avenue, George Town',
    contact_phone: '+1-345-945-9510'
  },

  // VASP (Virtual Assets)
  {
    entity_name: 'Crypto Capital Cayman Ltd',
    entity_type: 'Virtual Assets Service Providers',
    license_number: 'VASP-001',
    license_status: 'Active',
    address: 'Suite 201, Harbour Centre, George Town',
    registration_date: '2023-03-15'
  },
  {
    entity_name: 'Digital Assets Trust Company',
    entity_type: 'Virtual Assets Service Providers',
    license_number: 'VASP-002',
    license_status: 'Active',
    address: 'Flagship Building, 2nd Floor, Grand Cayman',
    registration_date: '2023-06-20'
  },
  {
    entity_name: 'Cayman Blockchain Services Ltd',
    entity_type: 'Virtual Assets Service Providers',
    license_number: 'VASP-003',
    license_status: 'Active',
    address: 'Queensgate House, Grand Cayman',
    registration_date: '2023-09-10'
  },

  // Registered Agents
  {
    entity_name: 'Conyers Corporate Services (Cayman) Limited',
    entity_type: 'Registered Agents',
    license_number: 'RA-001',
    license_status: 'Active',
    registered_agent_status: true,
    address: 'Cricket Square, Hutchins Drive, George Town'
  },
  {
    entity_name: 'Ogier Corporate Services (Cayman) Limited',
    entity_type: 'Registered Agents',
    license_number: 'RA-002',
    license_status: 'Active',
    registered_agent_status: true,
    address: '89 Nexus Way, Camana Bay, Grand Cayman'
  },

  // Insolvency Practitioners
  {
    entity_name: 'KRyS Global',
    entity_type: 'Insolvency Practitioners',
    license_number: 'IP-001',
    license_status: 'Active',
    address: 'Windward 1, Regatta Office Park, Grand Cayman',
    contact_phone: '+1-345-749-0200'
  }
];

async function populateDatabase() {
  console.log('🚀 Populating CIMA database with sample data (without content_hash)...');
  console.log(`📊 Inserting ${sampleEntities.length} sample entities...\n`);

  let inserted = 0;
  let failed = 0;

  for (const entity of sampleEntities) {
    try {
      const { error } = await supabase
        .from('cima_entities')
        .insert({
          ...entity,
          jurisdiction: 'Cayman Islands',
          scraped_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          additional_info: {
            source: 'sample_data',
            note: 'Sample data for demonstration'
          }
        });

      if (error) {
        console.error(`❌ ${entity.entity_name}: ${error.message}`);
        failed++;
      } else {
        console.log(`✅ ${entity.entity_name}`);
        inserted++;
      }
    } catch (err) {
      console.error(`❌ ${entity.entity_name}: ${err.message}`);
      failed++;
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`✅ Inserted: ${inserted}`);
  console.log(`❌ Failed: ${failed}`);

  // Verify the data
  const { data, error } = await supabase
    .from('cima_entities')
    .select('*')
    .order('entity_name');

  if (error) {
    console.error('\n❌ Error verifying:', error.message);
  } else {
    console.log(`\n🎉 Total records in database: ${data?.length || 0}`);

    if (data && data.length > 0) {
      console.log(`\n📋 Sample records:`);
      data.slice(0, 5).forEach(e => {
        console.log(`  - ${e.entity_name} (${e.entity_type})`);
      });

      console.log(`\n✅ Success! Data is now visible in the frontend.`);
      console.log(`   Visit: https://chathogs.com → Offshore Data → CIMA tab`);
    }
  }
}

populateDatabase();
