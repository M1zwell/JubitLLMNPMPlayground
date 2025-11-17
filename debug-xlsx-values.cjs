/**
 * Debug XLSX values to identify numeric overflow cause
 */

const XLSX = require('xlsx');
const https = require('https');
const http = require('http');
const fs = require('fs');

function downloadFile(url, dest) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? https : http;
    const file = fs.createWriteStream(dest);

    protocol.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    }, (response) => {
      if (response.statusCode === 302 || response.statusCode === 301) {
        return downloadFile(response.headers.location, dest).then(resolve).catch(reject);
      }

      response.pipe(file);
      file.on('finish', () => {
        file.close();
        resolve();
      });
    }).on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });

    file.on('error', (err) => {
      fs.unlink(dest, () => {});
      reject(err);
    });
  });
}

async function debugTable(tableId, url, tableName) {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`Debugging Table ${tableId}: ${tableName}`);
  console.log('='.repeat(60));

  const filename = `./temp-${tableId}.xlsx`;

  try {
    console.log('📥 Downloading...');
    await downloadFile(url, filename);
    console.log('✅ Downloaded');

    const workbook = XLSX.readFile(filename);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false });

    console.log(`\n📊 Total rows: ${data.length}`);
    console.log('\n📋 First 10 rows:');

    for (let i = 0; i < Math.min(10, data.length); i++) {
      console.log(`Row ${i}:`, JSON.stringify(data[i]));
    }

    console.log('\n🔍 Sample data values (rows 5-10):');
    for (let i = 5; i < Math.min(10, data.length); i++) {
      const row = data[i];
      console.log(`\nRow ${i}:`);
      row.forEach((val, idx) => {
        if (val !== null && val !== undefined && val !== '') {
          const numVal = parseFloat(val);
          if (!isNaN(numVal)) {
            console.log(`  Col ${idx}: ${val} (parsed: ${numVal})`);
          } else {
            console.log(`  Col ${idx}: "${val}"`);
          }
        }
      });
    }

    // Clean up
    fs.unlinkSync(filename);

  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

async function main() {
  console.log('🔍 Debugging XLSX Numeric Overflow Issues\n');

  const tables = [
    { id: 'A2', url: 'https://www.sfc.hk/-/media/EN/files/SOM/MarketStatistics/a02x.xlsx', name: 'Market Cap by Type' },
    { id: 'D4', url: 'https://www.sfc.hk/-/media/EN/files/SOM/MarketStatistics/d04x.xlsx', name: 'Fund Flows' }
  ];

  for (const table of tables) {
    await debugTable(table.id, table.url, table.name);
  }
}

main().catch(console.error);
