// Read D3 Excel file to understand structure
const XLSX = require('xlsx');
const path = require('path');

const excelPath = 'c:\\Users\\user\\Desktop\\Oyin AM\\SFC statistics\\d03x.xlsx';

console.log('Reading Excel file:', excelPath);

try {
  const workbook = XLSX.readFile(excelPath);

  console.log('\n=== WORKBOOK INFO ===');
  console.log('Sheet Names:', workbook.SheetNames);

  workbook.SheetNames.forEach(sheetName => {
    console.log(`\n=== SHEET: ${sheetName} ===`);
    const worksheet = workbook.Sheets[sheetName];
    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

    console.log(`Rows: ${data.length}`);
    console.log('\nFirst 10 rows:');
    data.slice(0, 10).forEach((row, idx) => {
      console.log(`Row ${idx}:`, row);
    });

    // Try to parse as JSON with headers
    const jsonData = XLSX.utils.sheet_to_json(worksheet);
    if (jsonData.length > 0) {
      console.log('\nColumn headers detected:', Object.keys(jsonData[0]));
      console.log('\nFirst 3 data rows as JSON:');
      console.log(JSON.stringify(jsonData.slice(0, 3), null, 2));
    }
  });

} catch (error) {
  console.error('Error reading Excel file:', error.message);
  process.exit(1);
}
