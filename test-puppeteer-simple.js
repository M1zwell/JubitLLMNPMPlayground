import puppeteer from 'puppeteer';

console.log('Testing Puppeteer...');

try {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  console.log('✅ Browser launched successfully!');

  const page = await browser.newPage();
  await page.goto('https://example.com');

  const title = await page.title();
  console.log(`✅ Page title: ${title}`);

  await browser.close();
  console.log('✅ Test completed successfully!');
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}
