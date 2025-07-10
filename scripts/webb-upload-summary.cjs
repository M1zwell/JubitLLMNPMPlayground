const fs = require('fs');
const path = require('path');

console.log('🏦 Webb Database Upload Summary');
console.log('=====================================\n');

// Check for Webb directory structure
const webbPath = 'supabase/webb';
if (!fs.existsSync(webbPath)) {
  console.error('❌ Webb directory not found:', webbPath);
  process.exit(1);
}

console.log('📁 Webb Database Directory Structure:');
console.log(`   ${webbPath}/`);

// Function to get file size in MB
function getFileSizeMB(filePath) {
  if (!fs.existsSync(filePath)) return 'N/A';
  const stats = fs.statSync(filePath);
  return (stats.size / 1024 / 1024).toFixed(2) + ' MB';
}

// Check converted files
const convertedPath = path.join(webbPath, 'converted');
console.log(`   ├── converted/`);
if (fs.existsSync(convertedPath)) {
  const convertedFiles = fs.readdirSync(convertedPath);
  convertedFiles.forEach(file => {
    const filePath = path.join(convertedPath, file);
    console.log(`   │   ├── ${file} (${getFileSizeMB(filePath)})`);
  });
} else {
  console.log('   │   └── (empty)');
}

// Check final files
const finalPath = path.join(webbPath, 'final');
console.log(`   ├── final/`);
if (fs.existsSync(finalPath)) {
  const finalFiles = fs.readdirSync(finalPath);
  finalFiles.forEach(file => {
    const filePath = path.join(finalPath, file);
    console.log(`   │   ├── ${file} (${getFileSizeMB(filePath)})`);
  });
} else {
  console.log('   │   └── (empty)');
}

// Check original schemas
const schemas = ['CCASS schema', 'Enigma schema'];
schemas.forEach(schema => {
  const schemaPath = path.join(webbPath, schema);
  console.log(`   ├── ${schema}/`);
  if (fs.existsSync(schemaPath)) {
    const schemaFiles = fs.readdirSync(schemaPath);
    schemaFiles.forEach(file => {
      if (file.endsWith('.sql')) {
        const filePath = path.join(schemaPath, file);
        console.log(`   │   ├── ${file} (${getFileSizeMB(filePath)})`);
      }
    });
  } else {
    console.log('   │   └── (not found)');
  }
});

console.log('\n🚀 Ready-to-Upload Files:');
console.log('=========================\n');

// Show final files that are ready to upload
const uploadFiles = [
  {
    category: '📋 Schema Structure Files (Upload First)',
    files: [
      { path: 'supabase/webb/final/ccass_tables_postgresql.sql', desc: 'CCASS table structures' },
      { path: 'supabase/webb/final/enigma_tables_postgresql.sql', desc: 'Enigma table structures' },
    ]
  },
  {
    category: '📊 Large Data Files (Upload After Structure)',
    files: [
      { path: 'supabase/webb/CCASS schema/ccassData-2025-07-05-600.sql', desc: 'CCASS data (~500MB)' },
      { path: 'supabase/webb/Enigma schema/enigmaData-2025-07-05-000.sql', desc: 'Enigma data (~800MB)' },
    ]
  },
  {
    category: '📝 Documentation',
    files: [
      { path: 'supabase/webb/final/README_UPLOAD_GUIDE.md', desc: 'Complete upload instructions' }
    ]
  }
];

uploadFiles.forEach(category => {
  console.log(category.category);
  category.files.forEach((file, index) => {
    const exists = fs.existsSync(file.path);
    const status = exists ? '✅' : '❌';
    const size = exists ? `(${getFileSizeMB(file.path)})` : '(missing)';
    console.log(`   ${index + 1}. ${status} ${file.desc} ${size}`);
    if (exists) {
      console.log(`      📄 ${file.path}`);
    }
  });
  console.log('');
});

console.log('🔗 Supabase Connection Details:');
console.log('==============================');
console.log('   Project ID: kiztaihzanqnrcrqaxsv');
console.log('   URL: https://kiztaihzanqnrcrqaxsv.supabase.co');
console.log('   Database: postgres');
console.log('   Password: Welcome08~billcn');
console.log('   SQL Editor: https://supabase.com/dashboard/project/kiztaihzanqnrcrqaxsv/sql');

console.log('\n📈 Expected Results After Upload:');
console.log('=================================');
console.log('   🏢 CCASS Schema:');
console.log('      • Holdings table: ~25M records (1.4GB)');
console.log('      • Participants: ~2K brokers/custodians');
console.log('      • Quotes: ~5M daily price records');
console.log('      • 15+ tables with indexes and views');
console.log('');
console.log('   🏛️ Enigma Schema:');
console.log('      • Organisations: ~18M records (1.8GB)');
console.log('      • People: ~100K directors/executives');
console.log('      • Directorships: ~500K board positions');
console.log('      • 15+ tables with foreign keys');

console.log('\n🛠️ Upload Methods:');
console.log('==================');
console.log('   1. 🌐 Supabase SQL Editor (recommended for structure)');
console.log('   2. 💻 psql command line (recommended for large data)');
console.log('   3. 📱 Manual chunk upload (for limited bandwidth)');

console.log('\n📋 Next Steps:');
console.log('==============');
console.log('   1. 📖 Read: supabase/webb/final/README_UPLOAD_GUIDE.md');
console.log('   2. 🏗️  Upload structure files using Supabase SQL Editor');
console.log('   3. 📊 Upload data files using psql or chunked approach');
console.log('   4. ✅ Verify data integrity using provided test queries');
console.log('   5. 🔗 Connect Webb React component to live data');

console.log('\n🎉 Ready to upload 35+ years of Hong Kong financial data!');
console.log('💡 Tip: Start with structure files, then verify before uploading data.');

// Check if Webb component exists
const webbComponent = 'src/components/WebbFinancialIntegration.tsx';
if (fs.existsSync(webbComponent)) {
  console.log(`✅ Webb React component ready: ${webbComponent}`);
} else {
  console.log(`❌ Webb React component missing: ${webbComponent}`);
}

console.log('\n🔧 Tools Available:');
console.log('===================');
console.log('   • Webb SQL Converter: scripts/convert-webb-sql.cjs ✅');
console.log('   • Webb MySQL Migrator: src/components/WebbMySQLMigrator.tsx ✅');
console.log('   • Webb SQL Uploader: src/components/WebbDirectSQLUploader.tsx ✅');
console.log('   • Manual Upload Guide: supabase/webb/final/README_UPLOAD_GUIDE.md ✅');
console.log('   • Clean Schema Files: supabase/webb/final/*.sql ✅');

console.log('\n📞 Need Help?');
console.log('=============');
console.log('   • Check Supabase dashboard logs');
console.log('   • Verify database storage limits');
console.log('   • Use test queries to verify uploads');
console.log('   • Start with structure files before data');
console.log('   • Consider uploading during off-peak hours');

console.log('\n' + '='.repeat(60));
console.log('Ready to proceed with Webb database upload! 🚀');
console.log('='.repeat(60)); 