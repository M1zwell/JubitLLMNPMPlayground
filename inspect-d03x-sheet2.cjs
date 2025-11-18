const XLSX = require('xlsx');
const path = require('path');

// Excel file path
const filePath = path.join('c:', 'Users', 'user', 'Desktop', 'Oyin AM', 'SFC statistics', 'd03x.xlsx');

console.log('═══ D3 Sheet 2 Inspector ═══\n');
console.log('File:', filePath);

// Read Excel file
const workbook = XLSX.readFile(filePath);
console.log('\nSheet names:', workbook.SheetNames);

const sheetName = workbook.SheetNames[1]; // Second sheet
console.log('\nAnalyzing sheet:', sheetName);

const sheet = workbook.Sheets[sheetName];

// Convert to JSON with header row
const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

console.log(`\nTotal rows: ${rawData.length}`);
console.log('\n═══ All rows ═══\n');

for (let i = 0; i < rawData.length; i++) {
  const row = rawData[i];
  console.log(`Row ${i.toString().padStart(2)}: ${JSON.stringify(row)}`);
}
