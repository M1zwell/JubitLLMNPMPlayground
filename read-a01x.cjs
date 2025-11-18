const XLSX = require('xlsx');
const fs = require('fs');

const filePath = 'c:\\Users\\user\\Desktop\\Oyin AM\\SFC statistics\\a01x.xlsx';

console.log('Reading Excel file:', filePath);

try {
  const workbook = XLSX.readFile(filePath);
  console.log('\n=== Workbook Info ===');
  console.log('Sheet Names:', workbook.SheetNames);

  // Read first sheet
  const firstSheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[firstSheetName];

  console.log('\n=== First Sheet:', firstSheetName, '===');

  // Convert to JSON to see structure
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: null });

  console.log('\n=== First 20 rows ===');
  jsonData.slice(0, 20).forEach((row, idx) => {
    console.log(`Row ${idx}:`, JSON.stringify(row));
  });

  console.log('\n=== Total rows:', jsonData.length, '===');

  // Try to detect headers
  console.log('\n=== Attempting to detect structure ===');
  const withHeaders = XLSX.utils.sheet_to_json(worksheet);
  console.log('Sample record (with headers):', JSON.stringify(withHeaders[0], null, 2));
  console.log('Total records:', withHeaders.length);

} catch (error) {
  console.error('Error reading file:', error.message);
  process.exit(1);
}
