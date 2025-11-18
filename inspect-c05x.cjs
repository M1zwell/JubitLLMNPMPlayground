const XLSX = require('xlsx');
const path = require('path');

// Excel file path
const filePath = path.join('c:', 'Users', 'user', 'Desktop', 'Oyin AM', 'SFC statistics', 'c05x.xlsx');

console.log('═══ C5 Excel File Inspector ═══\n');
console.log('File:', filePath);

// Read Excel file
const workbook = XLSX.readFile(filePath);
console.log('\nSheet names:', workbook.SheetNames);

const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];

// Convert to JSON with header row
const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

console.log(`\nTotal rows: ${rawData.length}`);
console.log('\n═══ First 40 rows ═══\n');

for (let i = 0; i < Math.min(40, rawData.length); i++) {
  const row = rawData[i];
  console.log(`Row ${i.toString().padStart(2)}: ${JSON.stringify(row)}`);
}

console.log('\n═══ Sample Data Structure ═══\n');

// Try to identify header row and data rows
console.log('Looking for year column and RA1-RA13 columns...\n');

// Check rows 5-10 for potential data
for (let i = 5; i < Math.min(15, rawData.length); i++) {
  const row = rawData[i];
  if (row && row[0] && typeof row[0] === 'number' && row[0] >= 1990 && row[0] <= 2030) {
    console.log(`Potential data row ${i}:`);
    console.log(`  Year: ${row[0]}`);
    console.log(`  RA1: ${row[1]}`);
    console.log(`  RA2: ${row[2]}`);
    console.log(`  RA3: ${row[3]}`);
    console.log(`  RA4: ${row[4]}`);
    console.log(`  RA5: ${row[5]}`);
    console.log(`  RA6: ${row[6]}`);
    console.log(`  RA7: ${row[7]}`);
    console.log(`  Total: ${row[12]}`);
    console.log('');
  }
}

console.log('\n═══ Last 10 rows ═══\n');
for (let i = Math.max(0, rawData.length - 10); i < rawData.length; i++) {
  const row = rawData[i];
  console.log(`Row ${i.toString().padStart(2)}: ${JSON.stringify(row)}`);
}
