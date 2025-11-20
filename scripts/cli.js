#!/usr/bin/env node

/**
 * Jubit Project CLI
 * Unified interface for scraping, deployment, and management.
 */

const { spawn, execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const SERVICES = {
  puppeteer: {
    port: 3001,
    url: 'http://localhost:3001'
  }
};

const COMMANDS = {
  help: showHelp,
  status: checkStatus,
  deploy: runDeploy,
  'mcp:start': startMCP,
  'service:puppeteer': startPuppeteer,
  'scrape:test': runScrapeTest
};

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (!command || !COMMANDS[command]) {
    showHelp();
    process.exit(command ? 1 : 0);
  }

  try {
    await COMMANDS[command](args.slice(1));
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

function showHelp() {
  console.log(`
🚀 Jubit Project CLI

Usage: node scripts/cli.js <command> [options]

Commands:
  status              Check status of local services and configurations
  deploy              Run the deployment script
  mcp:start <server>  Start an MCP server (firecrawl, puppeteer, etc.)
  service:puppeteer   Start the standalone Puppeteer service
  scrape:test         Run a test scrape using the Puppeteer service
  help                Show this help message
  `);
}

async function checkStatus() {
  console.log('🔍 Checking System Status...\n');

  // Check Node & NPM
  try {
    const nodeVer = execSync('node -v').toString().trim();
    console.log(`✅ Node.js: ${nodeVer}`);
  } catch (e) { console.log('❌ Node.js not found'); }

  // Check Puppeteer Service
  try {
    const response = await fetch(`${SERVICES.puppeteer.url}/health`);
    if (response.ok) {
      const data = await response.json();
      console.log(`✅ Puppeteer Service: Running (Port ${SERVICES.puppeteer.port}, Uptime: ${Math.floor(data.uptime)}s)`);
    } else {
      console.log('❌ Puppeteer Service: Responded with error');
    }
  } catch (e) {
    console.log(`❌ Puppeteer Service: Not running on port ${SERVICES.puppeteer.port}`);
    console.log('   Run "node scripts/cli.js service:puppeteer" to start it.');
  }

  // Check MCP Config
  if (fs.existsSync('MCP_SETUP.md')) {
    console.log('✅ MCP Configuration: Found (MCP_SETUP.md)');
  } else {
    console.log('❌ MCP Configuration: Missing');
  }

  // Check Env
  if (fs.existsSync('.env')) {
    console.log('✅ Environment: .env found');
  } else {
    console.log('⚠️ Environment: .env missing (Setup might be incomplete)');
  }
}

function runDeploy() {
  console.log('🚀 Initiating Deployment...');
  const deployScript = process.platform === 'win32' ? 'deploy.sh' : './deploy.sh'; // strictly speaking sh on win requires bash
  
  // Assuming bash is available (Git Bash or WSL)
  const child = spawn('bash', ['deploy.sh'], { stdio: 'inherit' });
  
  child.on('close', (code) => {
    if (code !== 0) console.log(`Deployment exited with code ${code}`);
  });
}

function startMCP(args) {
  const server = args[0];
  if (!server) {
    console.log('Please specify a server: firecrawl, puppeteer, chrome');
    return;
  }

  const scriptMap = {
    firecrawl: 'mcp:firecrawl',
    puppeteer: 'mcp:puppeteer',
    chrome: 'mcp:chrome'
  };

  if (!scriptMap[server]) {
    console.log(`Unknown MCP server: ${server}`);
    return;
  }

  console.log(`Starting MCP Server: ${server}...`);
  spawn('npm', ['run', scriptMap[server]], { stdio: 'inherit', shell: true });
}

function startPuppeteer() {
  console.log('Starting Puppeteer Service...');
  const servicePath = path.join(process.cwd(), 'puppeteer-service');
  
  // Check if node_modules exists
  if (!fs.existsSync(path.join(servicePath, 'node_modules'))) {
    console.log('Installing dependencies...');
    execSync('npm install', { cwd: servicePath, stdio: 'inherit' });
  }

  const child = spawn('node', ['server.js'], { 
    cwd: servicePath, 
    stdio: 'inherit' 
  });
  
  child.on('error', (err) => console.error('Failed to start:', err));
}

async function runScrapeTest() {
  console.log('🧪 Testing Scraper (via Puppeteer Service)...');
  try {
    const response = await fetch(`${SERVICES.puppeteer.url}/api/scrape/url`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        url: 'https://example.com',
        extractData: true
      })
    });

    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    
    const result = await response.json();
    console.log('✅ Scrape Successful!');
    console.log('Title:', result.data.title);
    console.log('Content Preview:', result.data.content.substring(0, 100) + '...');
  } catch (e) {
    console.error('❌ Scrape Failed:', e.message);
    console.log('Ensure the service is running using "status" or "service:puppeteer"');
  }
}

main().catch(console.error);

