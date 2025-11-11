/**
 * HK Scraper with Puppeteer Integration - FIXED
 *
 * CHANGES:
 * - Removed frontend database INSERT/UPSERT operations
 * - Shows informational message about Puppeteer limitations
 * - Displays scraped data without saving to database
 * - Users can use MCP servers or Node.js scripts for actual Puppeteer scraping
 */

import React, { useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Download,
  Search,
  FileJson,
  Database,
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw,
  Eye,
  Info,
} from 'lucide-react';
import { scrapeCCASSWithPuppeteer, scrapeMarketStatsWithPuppeteer } from '../lib/scraping/puppeteer-client';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface PuppeteerResult {
  success: boolean;
  data: any[];
  totalRows: number;
  pagesScraped: number;
  metadata: {
    url: string;
    scrapedAt: string;
    executionTime: number;
  };
  error?: string;
  message?: string;
}

export default function HKScraperWithPuppeteer() {
  const [scrapeType, setScrapeType] = useState<'ccass' | 'market-stats'>('ccass');
  const [stockCode, setStockCode] = useState('00700');
  const [maxPages, setMaxPages] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PuppeteerResult | null>(null);

  // Database data states
  const [ccassData, setCcassData] = useState<any[]>([]);
  const [marketStatsData, setMarketStatsData] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [activeTab, setActiveTab] = useState<'scrape' | 'view'>('scrape');

  const handleScrape = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      let scrapeResult: PuppeteerResult;

      if (scrapeType === 'ccass') {
        // Call puppeteer-scraper Edge Function
        scrapeResult = await scrapeCCASSWithPuppeteer(
          stockCode,
          SUPABASE_URL,
          SUPABASE_ANON_KEY
        );
      } else {
        // Scrape market stats
        const dateRange = {
          start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          end: new Date().toISOString().split('T')[0],
        };
        scrapeResult = await scrapeMarketStatsWithPuppeteer(
          dateRange,
          maxPages,
          SUPABASE_URL,
          SUPABASE_ANON_KEY
        );
      }

      setResult(scrapeResult);

      // NOTE: We do NOT save to database from frontend
      // Database operations should only happen server-side
      // If Puppeteer was working, the Edge Function would handle DB writes
    } catch (error) {
      setResult({
        success: false,
        data: [],
        totalRows: 0,
        pagesScraped: 0,
        metadata: {
          url: '',
          scrapedAt: new Date().toISOString(),
          executionTime: 0,
        },
        error: error instanceof Error ? error.message : String(error),
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch data from database (READ ONLY)
  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      if (scrapeType === 'ccass') {
        const { data, error } = await supabase
          .from('hkex_ccass_holdings')
          .select('*')
          .order('scraped_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        setCcassData(data || []);
      } else {
        const { data, error } = await supabase
          .from('hkex_market_stats')
          .select('*')
          .order('scraped_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        setMarketStatsData(data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoadingData(false);
    }
  };

  React.useEffect(() => {
    if (activeTab === 'view') {
      fetchData();
    }
  }, [activeTab, scrapeType]);

  const exportToJSON = () => {
    if (!result || !result.data.length) return;

    const jsonStr = JSON.stringify(result.data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `hkex-${scrapeType}-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="card-minimal">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-heading">HK Scraper (Puppeteer)</h2>
            <p className="text-caption">
              Puppeteer-based scraping (via MCP or Node.js scripts)
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('scrape')}
              className={`btn-minimal ${activeTab === 'scrape' ? 'btn-primary' : 'btn-secondary'}`}
            >
              <Search size={16} />
              Test Scrape
            </button>
            <button
              onClick={() => setActiveTab('view')}
              className={`btn-minimal ${activeTab === 'view' ? 'btn-primary' : 'btn-secondary'}`}
            >
              <Eye size={16} />
              View Data
            </button>
          </div>
        </div>

        {/* Scrape Tab */}
        {activeTab === 'scrape' && (
          <div className="space-y-4">
            {/* Info Box */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-start gap-2">
                <Info className="text-blue-600 mt-0.5" size={16} />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 mb-1">Puppeteer Limitations in Edge Functions</p>
                  <ul className="text-blue-700 space-y-1 text-xs">
                    <li>⚠️ Puppeteer doesn't work in Supabase Edge Functions (no browser binary)</li>
                    <li>✅ Use Puppeteer MCP Server: Ask Claude Code "Use Puppeteer to scrape..."</li>
                    <li>✅ Or use Node.js script: <code>node examples/puppeteer-hkex-ccass-example.js</code></li>
                    <li>✅ For HK data, use unified-scraper with Firecrawl instead</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Scrape Type Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Scrape Type</label>
              <select
                value={scrapeType}
                onChange={(e) => setScrapeType(e.target.value as 'ccass' | 'market-stats')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={isLoading}
              >
                <option value="ccass">CCASS Holdings (Participant Shareholding)</option>
                <option value="market-stats">Market Statistics (Trading Data)</option>
              </select>
            </div>

            {/* Stock Code (CCASS only) */}
            {scrapeType === 'ccass' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Stock Code (e.g., 00700 for Tencent)
                </label>
                <input
                  type="text"
                  value={stockCode}
                  onChange={(e) => setStockCode(e.target.value)}
                  placeholder="00700"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={isLoading}
                />
              </div>
            )}

            {/* Max Pages (Market Stats only) */}
            {scrapeType === 'market-stats' && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Maximum Pages to Scrape
                </label>
                <input
                  type="number"
                  value={maxPages}
                  onChange={(e) => setMaxPages(Math.max(1, parseInt(e.target.value) || 1))}
                  min="1"
                  max="10"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                  disabled={isLoading}
                />
              </div>
            )}

            {/* Test Button */}
            <button
              onClick={handleScrape}
              disabled={isLoading}
              className="w-full btn-minimal btn-primary flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Testing Puppeteer endpoint...
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  Test Puppeteer Scraper
                </>
              )}
            </button>

            {/* Results */}
            {result && (
              <div className={`p-4 rounded-md ${
                result.success
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-orange-50 border border-orange-200'
              }`}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="text-green-600" size={20} />
                    ) : (
                      <AlertCircle className="text-orange-600" size={20} />
                    )}
                    <h3 className="font-medium">
                      {result.success ? 'Scrape Result' : 'Puppeteer Not Available'}
                    </h3>
                  </div>
                  {result.success && result.data.length > 0 && (
                    <button
                      onClick={exportToJSON}
                      className="btn-minimal btn-secondary"
                    >
                      <Download size={14} />
                      Export JSON
                    </button>
                  )}
                </div>

                {result.success ? (
                  <div className="space-y-2">
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="text-gray-600">Total Rows:</span>
                        <span className="ml-2 font-semibold">{result.totalRows}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Pages Scraped:</span>
                        <span className="ml-2 font-semibold">{result.pagesScraped}</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Execution Time:</span>
                        <span className="ml-2 font-semibold">
                          {(result.metadata.executionTime / 1000).toFixed(2)}s
                        </span>
                      </div>
                    </div>

                    {/* Preview Data */}
                    {result.data.length > 0 && (
                      <div className="mt-3">
                        <p className="text-sm font-medium mb-2">Preview (first 5 rows):</p>
                        <div className="bg-white p-3 rounded border border-gray-200 overflow-x-auto">
                          <pre className="text-xs">
                            {JSON.stringify(result.data.slice(0, 5), null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="text-orange-700 text-sm font-medium">
                      {result.error}
                    </p>
                    {result.message && (
                      <pre className="text-xs bg-white p-3 rounded border border-orange-200 whitespace-pre-wrap">
                        {result.message}
                      </pre>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* View Tab */}
        {activeTab === 'view' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">
                {scrapeType === 'ccass' ? 'CCASS Holdings' : 'Market Statistics'}
              </h3>
              <button
                onClick={fetchData}
                disabled={isLoadingData}
                className="btn-minimal btn-secondary"
              >
                <RefreshCw size={14} className={isLoadingData ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>

            {isLoadingData ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-gray-400" size={32} />
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {scrapeType === 'ccass' ? (
                  ccassData.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      No CCASS data found. Use MCP servers or Node.js scripts to scrape.
                    </p>
                  ) : (
                    ccassData.map((holding, idx) => (
                      <div key={idx} className="p-3 border border-gray-200 rounded-md hover:bg-gray-50">
                        <div className="flex justify-between">
                          <div>
                            <h4 className="font-medium text-sm">
                              {holding.participant_name || 'N/A'}
                            </h4>
                            <p className="text-xs text-gray-500">
                              ID: {holding.participant_id} | Stock: {holding.stock_code}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">
                              {holding.shareholding?.toLocaleString() || '0'}
                            </p>
                            <p className="text-xs text-gray-500">
                              {holding.percentage}%
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )
                ) : (
                  marketStatsData.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      No market stats found. Use MCP servers or Node.js scripts to scrape.
                    </p>
                  ) : (
                    marketStatsData.map((stat, idx) => (
                      <div key={idx} className="p-3 border border-gray-200 rounded-md hover:bg-gray-50">
                        <div className="grid grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="text-gray-500">Date:</span>
                            <span className="ml-1 font-medium">{stat.date}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Turnover:</span>
                            <span className="ml-1 font-medium">{stat.turnover}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Volume:</span>
                            <span className="ml-1 font-medium">{stat.volume}</span>
                          </div>
                        </div>
                      </div>
                    ))
                  )
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
