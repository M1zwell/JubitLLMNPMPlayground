/**
 * Debug D3 and D4 file structures
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

  // Show first 20 rows
  for (let i = 0; i < Math.min(20, data.length); i++) {
    const row = data[i];
    const rowData = row.map((cell, idx) => {
      if (cell === null || cell === undefined || cell === '') return `[${idx}:empty]`;
      const str = String(cell).substring(0, 20);
      return `[${idx}:${str}]`;
    }).join(' ');
    console.log(`Row ${i}: ${rowData}`);
  }
}

// Debug D3 and D4
const files = [
  { path: 'c:\\Users\\user\\Desktop\\Oyin AM\\SFC statistics\\d03x.xlsx', name: 'Table D3 - Mutual Fund NAV' },
  { path: 'c:\\Users\\user\\Desktop\\Oyin AM\\SFC statistics\\d04x.xlsx', name: 'Table D4 - Fund Flows' }
];

files.forEach(file => debugXLSX(file.path, file.name));

console.log('\n' + '='.repeat(70));
console.log('✅ Debug complete!');
console.log('='.repeat(70) + '\n');
