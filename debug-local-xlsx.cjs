/**
 * Debug local XLSX file structure
 */

const XLSX = require('xlsx');

function debugXLSX(filePath, tableName) {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`📋 ${tableName}`);
  console.log(`📂 ${filePath}`);
  console.log('='.repeat(70));

  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });

  console.log(`\nTotal rows: ${data.length}\n`);

  // Show first 15 rows
  for (let i = 0; i < Math.min(15, data.length); i++) {
    const row = data[i];
    const rowData = row.map((cell, idx) => {
      if (cell === null || cell === undefined || cell === '') return `[${idx}:empty]`;
      const str = String(cell).substring(0, 20);
      return `[${idx}:${str}]`;
    }).join(' ');
    console.log(`Row ${i}: ${rowData}`);
  }
}

// Debug all local files
console.log('\n🔍 DEBUGGING LOCAL XLSX FILES STRUCTURE\n');

const files = [
  { path: 'C:\\Users\\user\\Downloads\\a01x (3).xlsx', name: 'Table A1 - Market Highlights' },
  { path: 'C:\\Users\\user\\Downloads\\a02x (1).xlsx', name: 'Table A2 - Market Cap by Type' },
  { path: 'C:\\Users\\user\\Downloads\\c04x.xlsx', name: 'Table C4 - Licensed Representatives' }
];

files.forEach(file => debugXLSX(file.path, file.name));

console.log('\n' + '='.repeat(70));
console.log('✅ Debug complete!');
console.log('='.repeat(70) + '\n');
