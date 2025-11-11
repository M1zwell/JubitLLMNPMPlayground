/**
 * Puppeteer Scraping Service
 *
 * Standalone Node.js service that provides Puppeteer-based web scraping
 * as an API endpoint for Supabase Edge Functions to call.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const hkexScraper = require('./scrapers/hkex-ccass');
const hksfcScraper = require('./scrapers/hksfc-news');

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(helmet());
app.use(cors());
app.use(compression());
app.use(express.json({ limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'puppeteer-scraping-service',
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// HKEX CCASS Scraping Endpoint
app.post('/api/scrape/hkex-ccass', async (req, res) => {
  const startTime = Date.now();

  try {
    const { stockCodes, date } = req.body;

    if (!stockCodes || !Array.isArray(stockCodes) || stockCodes.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'stockCodes array is required'
      });
    }

    console.log(`[HKEX CCASS] Scraping ${stockCodes.length} stock codes for date ${date}`);

    const results = await hkexScraper.scrapeMultipleStocks(stockCodes, date);

    res.json({
      success: true,
      data: results,
      executionTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[HKEX CCASS] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      executionTime: Date.now() - startTime
    });
  }
});

// HKSFC News Scraping Endpoint
app.post('/api/scrape/hksfc-news', async (req, res) => {
  const startTime = Date.now();

  try {
    const { url, dateRange } = req.body;

    console.log('[HKSFC News] Scraping:', url || 'default URL');

    const results = await hksfcScraper.scrapeNews(url, dateRange);

    res.json({
      success: true,
      data: results,
      executionTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[HKSFC News] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      executionTime: Date.now() - startTime
    });
  }
});

// Generic URL scraping endpoint
app.post('/api/scrape/url', async (req, res) => {
  const startTime = Date.now();

  try {
    const { url, waitForSelector, extractData } = req.body;

    if (!url) {
      return res.status(400).json({
        success: false,
        error: 'url is required'
      });
    }

    console.log('[Generic Scrape] URL:', url);

    const puppeteer = require('puppeteer');
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    await page.goto(url, { waitUntil: 'networkidle2' });

    if (waitForSelector) {
      await page.waitForSelector(waitForSelector, { timeout: 10000 });
    }

    const content = await page.content();
    const title = await page.title();

    let extractedData = null;
    if (extractData) {
      extractedData = await page.evaluate(() => {
        return document.body.innerText;
      });
    }

    await browser.close();

    res.json({
      success: true,
      data: {
        url,
        title,
        content: extractedData || content.substring(0, 5000),
        contentLength: content.length
      },
      executionTime: Date.now() - startTime,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('[Generic Scrape] Error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      executionTime: Date.now() - startTime
    });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: err.message
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    availableEndpoints: [
      'GET /health',
      'POST /api/scrape/hkex-ccass',
      'POST /api/scrape/hksfc-news',
      'POST /api/scrape/url'
    ]
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Puppeteer Scraping Service running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`🔍 HKEX endpoint: http://localhost:${PORT}/api/scrape/hkex-ccass`);
  console.log(`📰 HKSFC endpoint: http://localhost:${PORT}/api/scrape/hksfc-news`);
});

module.exports = app;
