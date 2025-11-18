const XLSX = require('xlsx');

const filePath = 'c:\\Users\\user\\Desktop\\Oyin AM\\SFC statistics\\a01x.xlsx';

console.log('Reading Excel file:', filePath, '\n');

const workbook = XLSX.readFile(filePath);
const worksheet = workbook.Sheets[workbook.SheetNames[0]];
const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

console.log('=== ALL ROWS (showing all 54 rows) ===\n');

for (let i = 0; i < rawData.length; i++) {
  const row = rawData[i];
  if (row && row[0]) {
    console.log(`Row ${i}: [${row[0]}] => ${JSON.stringify(row)}`);
  } else if (i >= 7) {
    console.log(`Row ${i}: [EMPTY]`);
  }
}

console.log('\n=== ROWS 20-54 (Recent years + any quarterly data) ===\n');

for (let i = 20; i < rawData.length; i++) {
  const row = rawData[i];
  console.log(`Row ${i}:`, row);
}
