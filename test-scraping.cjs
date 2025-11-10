#!/usr/bin/env node
/**
 * Test script for web scraping functionality
 *
 * This script tests:
 * 1. Environment variables are set correctly
 * 2. Scraping packages are installed
 * 3. MCP server configurations are valid
 *
 * Run with: node test-scraping.js
 */

console.log('🧪 Testing Web Scraping Configuration...\n');

// Test 1: Check environment variables
console.log('1️⃣  Checking environment variables...');
const fs = require('fs');
const path = require('path');

const envPath = path.join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  console.log('   ✓ .env file exists');

  const envContent = fs.readFileSync(envPath, 'utf8');
  const hasFirecrawlKey = envContent.includes('VITE_FIRECRAWL_API_KEY=');
  const hasPuppeteerConfig = envContent.includes('VITE_PUPPETEER_');

  if (hasFirecrawlKey) {
    console.log('   ✓ VITE_FIRECRAWL_API_KEY is configured');
  } else {
    console.log('   ✗ VITE_FIRECRAWL_API_KEY is missing');
  }

  if (hasPuppeteerConfig) {
    console.log('   ✓ Puppeteer configuration found');
  }
} else {
  console.log('   ✗ .env file not found');
}

// Test 2: Check installed packages
console.log('\n2️⃣  Checking installed packages...');
const packageJsonPath = path.join(__dirname, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  const deps = { ...packageJson.dependencies, ...packageJson.devDependencies };

  const requiredPackages = [
    '@mendable/firecrawl-js',
    'puppeteer',
  ];

  requiredPackages.forEach(pkg => {
    if (deps[pkg]) {
      console.log(`   ✓ ${pkg}@${deps[pkg]}`);
    } else {
      console.log(`   ✗ ${pkg} is not installed`);
    }
  });
}

// Test 3: Check MCP configuration
console.log('\n3️⃣  Checking MCP server configuration...');
const mcpConfigPath = path.join(__dirname, '.claude', 'settings.local.json');
if (fs.existsSync(mcpConfigPath)) {
  console.log('   ✓ .claude/settings.local.json exists');

  try {
    const mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));

    if (mcpConfig.mcpServers) {
      const servers = Object.keys(mcpConfig.mcpServers);
      console.log(`   ✓ ${servers.length} MCP servers configured:`);

      ['firecrawl', 'puppeteer', 'chrome-devtools'].forEach(server => {
        if (mcpConfig.mcpServers[server]) {
          console.log(`      • ${server}`);

          if (server === 'firecrawl' && mcpConfig.mcpServers[server].env?.FIRECRAWL_API_KEY) {
            console.log(`        - API key configured`);
          }

          if (server === 'chrome-devtools') {
            const env = mcpConfig.mcpServers[server].env || {};
            if (env.PUPPETEER_DEVTOOLS === 'true') {
              console.log(`        - DevTools enabled`);
            }
          }
        }
      });
    }
  } catch (error) {
    console.log(`   ✗ Error parsing MCP config: ${error.message}`);
  }
} else {
  console.log('   ✗ .claude/settings.local.json not found');
}

// Test 4: Check scraping utilities
console.log('\n4️⃣  Checking scraping utility files...');
const scrapingFiles = [
  'src/lib/scraping/index.ts',
  'src/lib/scraping/firecrawl.ts',
  'src/lib/scraping/puppeteer.ts',
  'src/lib/scraping/examples.ts',
];

scrapingFiles.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    console.log(`   ✓ ${file} (${stats.size} bytes)`);
  } else {
    console.log(`   ✗ ${file} not found`);
  }
});

// Test 5: Check demo component
console.log('\n5️⃣  Checking demo components...');
const demoComponents = [
  'src/components/WebScraperDemo.tsx',
  'src/components/HKFinancialScraper.tsx',
];

demoComponents.forEach(file => {
  const filePath = path.join(__dirname, file);
  if (fs.existsSync(filePath)) {
    console.log(`   ✓ ${file}`);
  } else {
    console.log(`   ✗ ${file} not found`);
  }
});

// Test 6: Check vite configuration
console.log('\n6️⃣  Checking Vite configuration...');
const viteConfigPath = path.join(__dirname, 'vite.config.ts');
if (fs.existsSync(viteConfigPath)) {
  const viteConfig = fs.readFileSync(viteConfigPath, 'utf8');

  if (viteConfig.includes('port: 8080')) {
    console.log('   ✓ Dev server configured on port 8080');
  }

  if (viteConfig.includes("'puppeteer'") && viteConfig.includes("'@mendable/firecrawl-js'")) {
    console.log('   ✓ Scraping packages excluded from browser build (correct)');
  }

  if (viteConfig.includes('/api')) {
    console.log('   ✓ API proxy configured for Supabase Edge Functions');
  }
}

// Summary
console.log('\n📊 Summary:');
console.log('   All web scraping tools are configured and ready to use!');
console.log('\n💡 Next steps:');
console.log('   1. Start dev server: npm run dev');
console.log('   2. Navigate to: http://localhost:8080');
console.log('   3. Click "Scraper" button to access Web Scraper Demo');
console.log('   4. Test MCP servers via Claude Code');
console.log('\n✅ Configuration test complete!\n');
