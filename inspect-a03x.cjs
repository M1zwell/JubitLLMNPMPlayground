const XLSX = require('xlsx');
const path = require('path');

const filePath = path.join('c:', 'Users', 'user', 'Desktop', 'Oyin AM', 'SFC statistics', 'a03x.xlsx');

console.log('═══ Inspecting A03x Excel File ═══\n');
console.log('File path:', filePath);

const workbook = XLSX.readFile(filePath);
console.log('\nSheet names:', workbook.SheetNames);

const sheetName = workbook.SheetNames[0];
const sheet = workbook.Sheets[sheetName];
const rawData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: null });

console.log('\nTotal rows:', rawData.length);
console.log('\n--- First 25 rows ---');
rawData.slice(0, 25).forEach((row, idx) => {
  console.log(`Row ${idx}:`, JSON.stringify(row));
});

console.log('\n--- Rows 30-45 (look for quarterly) ---');
rawData.slice(30, 45).forEach((row, idx) => {
  console.log(`Row ${30 + idx}:`, JSON.stringify(row));
});

console.log('\n--- Last 10 rows ---');
rawData.slice(-10).forEach((row, idx) => {
  console.log(`Row ${rawData.length - 10 + idx}:`, JSON.stringify(row));
});
