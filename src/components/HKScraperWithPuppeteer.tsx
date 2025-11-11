/**
 * HK Scraper with Puppeteer Integration
 *
 * Adds Puppeteer-based scraping for:
 * 1. CCASS Holdings - Participant shareholding data
 * 2. Market Stats - Trading statistics with pagination
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
}

export default function HKScraperWithPuppeteer() {
  const [scrapeType, setScrapeType] = useState<'ccass' | 'market-stats'>('ccass');
  const [stockCode, setStockCode] = useState('00700');
  const [maxPages, setMaxPages] = useState(3);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PuppeteerResult | null>(null);
  const [savedRecords, setSavedRecords] = useState<number>(0);

  // Database data states
  const [ccassData, setCcassData] = useState<any[]>([]);
  const [marketStatsData, setMarketStatsData] = useState<any[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [activeTab, setActiveTab] = useState<'scrape' | 'view'>('scrape');

  const handleScrape = async () => {
    setIsLoading(true);
    setResult(null);
    setSavedRecords(0);

    try {
      let scrapeResult: PuppeteerResult;

      if (scrapeType === 'ccass') {
        // Scrape CCASS holdings
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

      // Save to database if successful
      if (scrapeResult.success && scrapeResult.data.length > 0) {
        await saveToDatabase(scrapeResult);
      }
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

  const saveToDatabase = async (scrapeResult: PuppeteerResult) => {
    let saved = 0;

    try {
      if (scrapeType === 'ccass') {
        // Save CCASS data to hkex_announcements table (or create new table)
        for (const row of scrapeResult.data) {
          const { error } = await supabase.from('hkex_ccass_holdings').upsert(
            {
              stock_code: stockCode.padStart(5, '0'),
              participant_id: row.participantID,
              participant_name: row.participantName,
              shareholding: row.shareholding,
              percentage: row.percentage,
              scraped_at: new Date().toISOString(),
              content_hash: `ccass-${stockCode}-${row.participantID}`,
            },
            {
              onConflict: 'content_hash',
            }
          );

          if (!error) saved++;
        }
      } else {
        // Save market stats
        for (const row of scrapeResult.data) {
          const { error } = await supabase.from('hkex_market_stats').upsert(
            {
              date: row.column_0 || '',
              turnover: row.column_1 || '',
              volume: row.column_2 || '',
              data: row,
              scraped_at: new Date().toISOString(),
              content_hash: `market-stats-${row.column_0}`,
            },
            {
              onConflict: 'content_hash',
            }
          );

          if (!error) saved++;
        }
      }

      setSavedRecords(saved);
    } catch (error) {
      console.error('Error saving to database:', error);
    }
  };

  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      if (scrapeType === 'ccass') {
        const { data, error } = await supabase
          .from('hkex_ccass_holdings')
          .select('*')
          .eq('stock_code', stockCode.padStart(5, '0'))
          .order('scraped_at', { ascending: false })
          .limit(200);

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

  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map((row) =>
        headers.map((header) => {
          const value = row[header];
          const stringValue = String(value || '').replace(/"/g, '""');
          return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
        }).join(',')
      ),
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
            HK Scraper with Puppeteer
          </h1>
          <p className="text-gray-400">
            JavaScript-rendered table scraping for CCASS Holdings and Market Statistics
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-4 border-b border-gray-700">
          <button
            onClick={() => setActiveTab('scrape')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'scrape'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <Search className="inline-block w-4 h-4 mr-2" />
            Scrape Data
          </button>
          <button
            onClick={() => {
              setActiveTab('view');
              fetchData();
            }}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'view'
                ? 'text-blue-400 border-b-2 border-blue-400'
                : 'text-gray-400 hover:text-gray-300'
            }`}
          >
            <Database className="inline-block w-4 h-4 mr-2" />
            View Database
          </button>
        </div>

        {activeTab === 'scrape' && (
          <>
            {/* Scraping Controls */}
            <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Data Type
                </label>
                <div className="flex gap-4">
                  <button
                    onClick={() => setScrapeType('ccass')}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                      scrapeType === 'ccass'
                        ? 'border-blue-500 bg-blue-500/20 text-blue-300'
                        : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <div className="font-semibold">CCASS Holdings</div>
                    <div className="text-xs mt-1 opacity-75">Participant shareholding data</div>
                  </button>
                  <button
                    onClick={() => setScrapeType('market-stats')}
                    className={`flex-1 px-4 py-3 rounded-lg border-2 transition-colors ${
                      scrapeType === 'market-stats'
                        ? 'border-purple-500 bg-purple-500/20 text-purple-300'
                        : 'border-gray-600 bg-gray-700 text-gray-300 hover:border-gray-500'
                    }`}
                  >
                    <div className="font-semibold">Market Statistics</div>
                    <div className="text-xs mt-1 opacity-75">Trading stats with pagination</div>
                  </button>
                </div>
              </div>

              {scrapeType === 'ccass' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Stock Code
                  </label>
                  <input
                    type="text"
                    value={stockCode}
                    onChange={(e) => setStockCode(e.target.value)}
                    placeholder="e.g., 00700, 00005"
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:border-blue-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Enter stock code (1-5 digits). Examples: 700, 00700, 00005
                  </p>
                </div>
              )}

              {scrapeType === 'market-stats' && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Max Pages to Scrape
                  </label>
                  <input
                    type="number"
                    value={maxPages}
                    onChange={(e) => setMaxPages(parseInt(e.target.value) || 3)}
                    min={1}
                    max={10}
                    className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-100 focus:outline-none focus:border-purple-500"
                  />
                  <p className="text-xs text-gray-400 mt-1">
                    Number of pages to scrape (1-10). More pages = more data but slower.
                  </p>
                </div>
              )}

              <button
                onClick={handleScrape}
                disabled={isLoading}
                className={`w-full px-6 py-3 rounded-lg font-medium transition-colors ${
                  isLoading
                    ? 'bg-gray-700 text-gray-400 cursor-not-allowed'
                    : scrapeType === 'ccass'
                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                    : 'bg-purple-600 hover:bg-purple-700 text-white'
                }`}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="inline-block w-5 h-5 mr-2 animate-spin" />
                    Scraping with Puppeteer...
                  </>
                ) : (
                  <>
                    <Search className="inline-block w-5 h-5 mr-2" />
                    Start Puppeteer Scraping
                  </>
                )}
              </button>
            </div>

            {/* Results */}
            {result && (
              <div
                className={`border rounded-lg p-6 ${
                  result.success
                    ? 'bg-green-900/20 border-green-700'
                    : 'bg-red-900/20 border-red-700'
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className={result.success ? 'text-green-400' : 'text-red-400'}>
                    {result.success ? (
                      <CheckCircle className="w-6 h-6" />
                    ) : (
                      <AlertCircle className="w-6 h-6" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h3
                      className={`font-semibold mb-2 ${
                        result.success ? 'text-green-400' : 'text-red-400'
                      }`}
                    >
                      {result.success ? '✅ Scraping Successful' : '❌ Scraping Failed'}
                    </h3>
                    {result.success ? (
                      <div className="space-y-2 text-sm">
                        <p className="text-gray-300">
                          <strong>Total Rows:</strong> {result.totalRows}
                        </p>
                        <p className="text-gray-300">
                          <strong>Pages Scraped:</strong> {result.pagesScraped}
                        </p>
                        <p className="text-gray-300">
                          <strong>Saved to Database:</strong> {savedRecords} records
                        </p>
                        <p className="text-gray-300">
                          <strong>URL:</strong>{' '}
                          <a
                            href={result.metadata.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-400 hover:underline"
                          >
                            {result.metadata.url}
                          </a>
                        </p>
                        <div className="flex gap-4 mt-4">
                          <button
                            onClick={() => exportToCSV(result.data, scrapeType)}
                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2"
                          >
                            <Download className="w-4 h-4" />
                            Export CSV
                          </button>
                          <button
                            onClick={() => {
                              setActiveTab('view');
                              fetchData();
                            }}
                            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-2"
                          >
                            <Eye className="w-4 h-4" />
                            View in Database
                          </button>
                        </div>
                      </div>
                    ) : (
                      <p className="text-red-300 text-sm">{result.error}</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </>
        )}

        {activeTab === 'view' && (
          <div className="bg-gray-800 border border-gray-700 rounded-lg p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-semibold text-gray-100">
                {scrapeType === 'ccass'
                  ? `CCASS Holdings - ${stockCode}`
                  : 'Market Statistics'}
              </h2>
              <button
                onClick={fetchData}
                disabled={isLoadingData}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${isLoadingData ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            {isLoadingData ? (
              <div className="text-center py-12">
                <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-400" />
                <p className="text-gray-400 mt-4">Loading data...</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-700">
                    <tr>
                      {scrapeType === 'ccass' ? (
                        <>
                          <th className="px-4 py-3 text-left">Participant ID</th>
                          <th className="px-4 py-3 text-left">Participant Name</th>
                          <th className="px-4 py-3 text-left">Shareholding</th>
                          <th className="px-4 py-3 text-left">Percentage</th>
                          <th className="px-4 py-3 text-left">Scraped At</th>
                        </>
                      ) : (
                        <>
                          <th className="px-4 py-3 text-left">Date</th>
                          <th className="px-4 py-3 text-left">Turnover</th>
                          <th className="px-4 py-3 text-left">Volume</th>
                          <th className="px-4 py-3 text-left">Scraped At</th>
                        </>
                      )}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-700">
                    {scrapeType === 'ccass'
                      ? ccassData.map((row, index) => (
                          <tr key={index} className="hover:bg-gray-750">
                            <td className="px-4 py-3">{row.participant_id}</td>
                            <td className="px-4 py-3">{row.participant_name}</td>
                            <td className="px-4 py-3">{row.shareholding}</td>
                            <td className="px-4 py-3">{row.percentage}</td>
                            <td className="px-4 py-3">
                              {new Date(row.scraped_at).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      : marketStatsData.map((row, index) => (
                          <tr key={index} className="hover:bg-gray-750">
                            <td className="px-4 py-3">{row.date}</td>
                            <td className="px-4 py-3">{row.turnover}</td>
                            <td className="px-4 py-3">{row.volume}</td>
                            <td className="px-4 py-3">
                              {new Date(row.scraped_at).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                  </tbody>
                </table>
                {((scrapeType === 'ccass' && ccassData.length === 0) ||
                  (scrapeType === 'market-stats' && marketStatsData.length === 0)) && (
                  <p className="text-center text-gray-400 py-12">
                    No data found. Try scraping first.
                  </p>
                )}
              </div>
            )}

            {((scrapeType === 'ccass' && ccassData.length > 0) ||
              (scrapeType === 'market-stats' && marketStatsData.length > 0)) && (
              <div className="flex gap-4">
                <button
                  onClick={() =>
                    exportToCSV(
                      scrapeType === 'ccass' ? ccassData : marketStatsData,
                      scrapeType
                    )
                  }
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg flex items-center gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export CSV
                </button>
                <button
                  onClick={() => {
                    const data = scrapeType === 'ccass' ? ccassData : marketStatsData;
                    const blob = new Blob([JSON.stringify(data, null, 2)], {
                      type: 'application/json',
                    });
                    const link = document.createElement('a');
                    link.href = URL.createObjectURL(blob);
                    link.download = `${scrapeType}_${
                      new Date().toISOString().split('T')[0]
                    }.json`;
                    link.click();
                  }}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-2"
                >
                  <FileJson className="w-4 h-4" />
                  Export JSON
                </button>
              </div>
            )}
          </div>
        )}

        {/* Info Card */}
        <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-blue-400 mb-3">
            About Puppeteer Scraping
          </h3>
          <div className="space-y-3 text-sm text-gray-300">
            <div className="bg-gray-900 p-3 rounded">
              <div className="font-semibold text-green-400">✓ CCASS Holdings</div>
              <p className="text-gray-400 mt-1">
                Scrapes participant shareholding data from HKEx CCASS system. Handles JavaScript-rendered
                tables and AJAX form submissions. Perfect for tracking institutional holdings.
              </p>
            </div>
            <div className="bg-gray-900 p-3 rounded">
              <div className="font-semibold text-purple-400">✓ Market Statistics</div>
              <p className="text-gray-400 mt-1">
                Scrapes market trading statistics with automatic pagination support. Retrieves turnover,
                volume, and other market data across multiple pages.
              </p>
            </div>
            <div className="bg-gray-900 p-3 rounded">
              <div className="font-semibold text-yellow-400">⚡ Server-Side Execution</div>
              <p className="text-gray-400 mt-1">
                Puppeteer runs on Supabase Edge Functions (server-side), bypassing browser CORS
                limitations and handling complex JavaScript rendering automatically.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
