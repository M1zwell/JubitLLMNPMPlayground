/**
 * HK Financial Scraper - Enhanced Web Scraping UI Component
 *
 * Features:
 * - Dual scraping engine (Firecrawl + Puppeteer)
 * - Multiple data sources (NPM, HKSFC, HKEX CCASS)
 * - Real-time progress tracking
 * - Advanced options (retry, cache, rate limiting)
 * - Export to JSON/CSV
 * - Professional responsive UI
 */

import React, { useState } from 'react';
import {
  Download,
  Search,
  FileJson,
  FileSpreadsheet,
  Calendar,
  Building2,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  Loader2,
  ExternalLink,
  Package,
  Settings,
  Trash2,
  RefreshCw,
  Eye
} from 'lucide-react';
import {
  batchScrape,
  exportToJSON,
  exportToCSV,
  exportToXLSX,
  downloadFile,
  downloadBlob,
  generateFilename,
  clearCache,
  getCacheStats,
  type ScrapeOptions,
  type BatchScrapeResult,
  type ScrapingStrategy
} from '../lib/scraping/hk-financial-scraper';
import DataPreviewModal from './DataPreviewModal';

// ============================================================================
// TypeScript Interfaces
// ============================================================================

interface ScraperTarget {
  id: string;
  name: string;
  url: string;
  description: string;
  category: 'HKEX' | 'HKSFC' | 'NPM';
  icon: React.ReactNode;
  requiresInput?: 'stockCodes' | 'query' | 'none';
}

interface ScrapeResultDisplay extends BatchScrapeResult {
  id: string;
  timestamp: Date;
}

// ============================================================================
// Main Component
// ============================================================================

export default function HKFinancialScraper() {
  // State Management
  const [selectedTargets, setSelectedTargets] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [results, setResults] = useState<ScrapeResultDisplay[]>([]);
  const [progress, setProgress] = useState({ current: 0, total: 0 });

  // Input States
  const [customUrl, setCustomUrl] = useState('');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [stockCodes, setStockCodes] = useState('00700,00005,00388'); // Tencent, HSBC, HKEX
  const [npmQuery, setNpmQuery] = useState('react');

  // Advanced Options
  const [strategy, setStrategy] = useState<ScrapingStrategy>('auto');
  const [maxRetries, setMaxRetries] = useState(3);
  const [rateLimit, setRateLimit] = useState(1000);
  const [useCache, setUseCache] = useState(true);
  const [cacheTTL, setCacheTTL] = useState(3600);
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Preview Modal State
  const [previewData, setPreviewData] = useState<{
    open: boolean;
    result: ScrapeResultDisplay | null;
  }>({ open: false, result: null });

  // ============================================================================
  // Data Source Definitions
  // ============================================================================

  const scraperTargets: ScraperTarget[] = [
    // HKEX Sources
    {
      id: 'hkex-ccass',
      name: 'CCASS Shareholding',
      url: 'https://www3.hkexnews.hk/sdw/search/searchsdw.aspx',
      description: 'Daily shareholding disclosure by CCASS participants',
      category: 'HKEX',
      icon: <Building2 className="w-5 h-5" />,
      requiresInput: 'stockCodes'
    },
    {
      id: 'hkex-announcements',
      name: 'Company Announcements',
      url: 'https://www1.hkexnews.hk/search/titlesearch.xhtml',
      description: 'Listed company announcements and circulars',
      category: 'HKEX',
      icon: <FileJson className="w-5 h-5" />,
      requiresInput: 'none'
    },
    {
      id: 'hkex-market-stats',
      name: 'Market Statistics',
      url: 'https://www.hkex.com.hk/Market-Data/Statistics/Consolidated-Reports',
      description: 'Daily market turnover and trading statistics',
      category: 'HKEX',
      icon: <TrendingUp className="w-5 h-5" />,
      requiresInput: 'none'
    },

    // HKSFC Sources
    {
      id: 'hksfc-news',
      name: 'HKSFC News',
      url: 'https://apps.sfc.hk/edistributionWeb/gateway/EN/news-and-announcements/news/',
      description: 'Latest news and announcements from Hong Kong SFC',
      category: 'HKSFC',
      icon: <AlertCircle className="w-5 h-5" />,
      requiresInput: 'none'
    },
    {
      id: 'hksfc-enforcement',
      name: 'Enforcement News',
      url: 'https://www.sfc.hk/en/News-and-announcements/News/Enforcement-News',
      description: 'Regulatory enforcement actions and penalties',
      category: 'HKSFC',
      icon: <AlertCircle className="w-5 h-5" />,
      requiresInput: 'none'
    },
    {
      id: 'hksfc-circulars',
      name: 'Circulars & Guidance',
      url: 'https://www.sfc.hk/en/Regulatory-functions/Intermediaries/Circulars-to-intermediaries',
      description: 'Regulatory circulars and guidance notes',
      category: 'HKSFC',
      icon: <FileJson className="w-5 h-5" />,
      requiresInput: 'none'
    },

    // NPM Sources
    {
      id: 'npm-search',
      name: 'NPM Package Search',
      url: 'https://www.npmjs.com/search',
      description: 'Search NPM packages by keyword',
      category: 'NPM',
      icon: <Package className="w-5 h-5" />,
      requiresInput: 'query'
    },
    {
      id: 'npm-package',
      name: 'NPM Package Details',
      url: 'https://www.npmjs.com/package/react',
      description: 'Get detailed information about specific NPM packages',
      category: 'NPM',
      icon: <Package className="w-5 h-5" />,
      requiresInput: 'query'
    }
  ];

  // ============================================================================
  // Event Handlers
  // ============================================================================

  const toggleTarget = (targetId: string) => {
    setSelectedTargets(prev =>
      prev.includes(targetId)
        ? prev.filter(id => id !== targetId)
        : [...prev, targetId]
    );
  };

  const selectAllCategory = (category: 'HKEX' | 'HKSFC' | 'NPM') => {
    const categoryTargets = scraperTargets
      .filter(t => t.category === category)
      .map(t => t.id);

    const allSelected = categoryTargets.every(id => selectedTargets.includes(id));

    if (allSelected) {
      setSelectedTargets(prev => prev.filter(id => !categoryTargets.includes(id)));
    } else {
      setSelectedTargets(prev => [...new Set([...prev, ...categoryTargets])]);
    }
  };

  const startScraping = async () => {
    if (selectedTargets.length === 0) {
      alert('Please select at least one data source');
      return;
    }

    setIsLoading(true);
    setProgress({ current: 0, total: selectedTargets.length });

    try {
      const targets = selectedTargets.map(id => {
        const target = scraperTargets.find(t => t.id === id)!;

        const options: Partial<ScrapeOptions> = {
          strategy,
          maxRetries,
          rateLimit,
          useCache,
          cacheTTL,
          dateRange
        };

        // Add specific inputs based on target type
        if (target.requiresInput === 'stockCodes') {
          options.stockCodes = stockCodes.split(',').map(s => s.trim()).filter(Boolean);
        } else if (target.requiresInput === 'query') {
          options.query = npmQuery;
        }

        return {
          name: target.name,
          url: target.url,
          category: target.category as any,
          options
        };
      });

      // Use batch scraper
      const batchResults = await batchScrape(targets, {
        strategy,
        maxRetries,
        rateLimit,
        useCache,
        cacheTTL
      });

      // Convert to display format
      const displayResults: ScrapeResultDisplay[] = batchResults.map(br => ({
        ...br,
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date()
      }));

      setResults(prev => [...displayResults, ...prev]);
      setProgress({ current: selectedTargets.length, total: selectedTargets.length });

    } catch (error) {
      console.error('Scraping error:', error);
      alert(`Error: ${(error as Error).message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const downloadJSON = (result: ScrapeResultDisplay) => {
    const json = exportToJSON(result.result.data, { prettify: true });
    const filename = generateFilename(result.targetName, 'json');
    downloadFile(json, filename, 'application/json');
  };

  const downloadCSV = (result: ScrapeResultDisplay) => {
    const data = Array.isArray(result.result.data) ? result.result.data : [result.result.data];
    const csv = exportToCSV(data);
    const filename = generateFilename(result.targetName, 'csv');
    downloadFile(csv, filename, 'text/csv');
  };

  const downloadXLSX = (result: ScrapeResultDisplay) => {
    const data = Array.isArray(result.result.data) ? result.result.data : [result.result.data];
    const blob = exportToXLSX(data, { format: 'xlsx', sheetName: result.targetName });
    const filename = generateFilename(result.targetName, 'xlsx');
    downloadBlob(blob, filename);
  };

  const handlePreviewExport = (format: 'json' | 'csv' | 'xlsx') => {
    if (!previewData.result) return;

    if (format === 'json') {
      downloadJSON(previewData.result);
    } else if (format === 'csv') {
      downloadCSV(previewData.result);
    } else if (format === 'xlsx') {
      downloadXLSX(previewData.result);
    }
  };

  const downloadAllJSON = () => {
    const allData = results.map(r => ({
      target: r.targetName,
      timestamp: r.timestamp,
      ...r.result
    }));
    const json = exportToJSON(allData, { prettify: true });
    const filename = generateFilename('all-results', 'json');
    downloadFile(json, filename, 'application/json');
  };

  const clearResults = () => {
    if (confirm('Clear all results?')) {
      setResults([]);
    }
  };

  const handleClearCache = () => {
    clearCache();
    alert('Cache cleared successfully!');
  };

  const viewCacheStats = () => {
    const stats = getCacheStats();
    alert(`Cache Stats:\nEntries: ${stats.size}\n\nDetails:\n${JSON.stringify(stats.entries, null, 2)}`);
  };

  // ============================================================================
  // UI Rendering
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-100 mb-2">
              HK Financial Scraper
            </h1>
            <p className="text-gray-400">
              Dual-engine web scraping for HKEX, HKSFC, and NPM data sources
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={viewCacheStats}
              className="px-4 py-2 bg-gray-700 text-gray-100 rounded-lg hover:bg-gray-600 flex items-center gap-2"
            >
              <Settings className="w-4 h-4" />
              Cache Stats
            </button>
            <button
              onClick={handleClearCache}
              className="px-4 py-2 bg-gray-700 text-gray-100 rounded-lg hover:bg-gray-600 flex items-center gap-2"
            >
              <Trash2 className="w-4 h-4" />
              Clear Cache
            </button>
            {results.length > 0 && (
              <button
                onClick={downloadAllJSON}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Download className="w-4 h-4" />
                Export All
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: Target Selection */}
        <div className="lg:col-span-2 space-y-6">
          {/* HKEX Sources */}
          <div className="bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-blue-600 flex items-center gap-2">
                <Building2 className="w-5 h-5" />
                HKEX Sources
              </h2>
              <button
                onClick={() => selectAllCategory('HKEX')}
                className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200"
              >
                {scraperTargets.filter(t => t.category === 'HKEX').every(t => selectedTargets.includes(t.id))
                  ? 'Deselect All'
                  : 'Select All'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scraperTargets.filter(t => t.category === 'HKEX').map(target => (
                <div
                  key={target.id}
                  onClick={() => toggleTarget(target.id)}
                  className={`
                    p-4 rounded-lg border-2 cursor-pointer transition-all
                    ${selectedTargets.includes(target.id)
                      ? 'border-blue-500 bg-blue-900 shadow-md'
                      : 'border-gray-700 hover:border-blue-300 hover:bg-blue-900/50'}
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-blue-600">{target.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-100 ">{target.name}</h3>
                      <p className="text-sm text-gray-400 mt-1">{target.description}</p>
                    </div>
                    {selectedTargets.includes(target.id) && (
                      <CheckCircle className="w-5 h-5 text-blue-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* HKSFC Sources */}
          <div className="bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-purple-600 flex items-center gap-2">
                <AlertCircle className="w-5 h-5" />
                HKSFC Sources
              </h2>
              <button
                onClick={() => selectAllCategory('HKSFC')}
                className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200"
              >
                {scraperTargets.filter(t => t.category === 'HKSFC').every(t => selectedTargets.includes(t.id))
                  ? 'Deselect All'
                  : 'Select All'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scraperTargets.filter(t => t.category === 'HKSFC').map(target => (
                <div
                  key={target.id}
                  onClick={() => toggleTarget(target.id)}
                  className={`
                    p-4 rounded-lg border-2 cursor-pointer transition-all
                    ${selectedTargets.includes(target.id)
                      ? 'border-purple-500 bg-purple-900 shadow-md'
                      : 'border-gray-700 hover:border-purple-300 hover:bg-purple-900/50'}
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-purple-600">{target.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-100 ">{target.name}</h3>
                      <p className="text-sm text-gray-400 mt-1">{target.description}</p>
                    </div>
                    {selectedTargets.includes(target.id) && (
                      <CheckCircle className="w-5 h-5 text-purple-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* NPM Sources */}
          <div className="bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-red-600 flex items-center gap-2">
                <Package className="w-5 h-5" />
                NPM Sources
              </h2>
              <button
                onClick={() => selectAllCategory('NPM')}
                className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
              >
                {scraperTargets.filter(t => t.category === 'NPM').every(t => selectedTargets.includes(t.id))
                  ? 'Deselect All'
                  : 'Select All'}
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {scraperTargets.filter(t => t.category === 'NPM').map(target => (
                <div
                  key={target.id}
                  onClick={() => toggleTarget(target.id)}
                  className={`
                    p-4 rounded-lg border-2 cursor-pointer transition-all
                    ${selectedTargets.includes(target.id)
                      ? 'border-red-500 bg-red-900 shadow-md'
                      : 'border-gray-700 hover:border-red-300 hover:bg-red-900/50'}
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className="text-red-600">{target.icon}</div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-100 ">{target.name}</h3>
                      <p className="text-sm text-gray-400 mt-1">{target.description}</p>
                    </div>
                    {selectedTargets.includes(target.id) && (
                      <CheckCircle className="w-5 h-5 text-red-600" />
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel: Options & Results */}
        <div className="space-y-6">
          {/* Input Options */}
          <div className="bg-gray-800 rounded-xl shadow-lg p-6">
            <h2 className="text-xl font-bold text-gray-100 mb-4 flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Options
            </h2>

            {/* Date Range */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                <Calendar className="w-4 h-4 inline mr-1" />
                Date Range
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="date"
                  value={dateRange.start}
                  onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                  className="px-3 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-700 text-gray-100"
                />
                <input
                  type="date"
                  value={dateRange.end}
                  onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                  className="px-3 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-700 text-gray-100"
                />
              </div>
            </div>

            {/* Stock Codes */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Stock Codes (HKEX)
              </label>
              <input
                type="text"
                value={stockCodes}
                onChange={(e) => setStockCodes(e.target.value)}
                placeholder="00700,00005,00388"
                className="w-full px-3 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-700 text-gray-100"
              />
              <p className="text-xs text-gray-500 mt-1">Comma-separated</p>
            </div>

            {/* NPM Query */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                NPM Search Query
              </label>
              <input
                type="text"
                value={npmQuery}
                onChange={(e) => setNpmQuery(e.target.value)}
                placeholder="react, vue, angular"
                className="w-full px-3 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-700 text-gray-100"
              />
            </div>

            {/* Custom URL */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-300 mb-2">
                Custom URL
              </label>
              <input
                type="url"
                value={customUrl}
                onChange={(e) => setCustomUrl(e.target.value)}
                placeholder="https://example.com"
                className="w-full px-3 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-700 text-gray-100"
              />
            </div>

            {/* Advanced Options Toggle */}
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="w-full px-4 py-2 bg-gray-700 text-gray-100 rounded-lg hover:bg-gray-600 flex items-center justify-between mb-4"
            >
              <span>Advanced Options</span>
              <span className="text-xs">{showAdvanced ? '▲' : '▼'}</span>
            </button>

            {/* Advanced Options Panel */}
            {showAdvanced && (
              <div className="space-y-3 mb-4 p-4 bg-gray-700 rounded-lg">
                {/* Strategy */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Scraping Strategy
                  </label>
                  <select
                    value={strategy}
                    onChange={(e) => setStrategy(e.target.value as ScrapingStrategy)}
                    className="w-full px-3 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-600 text-gray-100"
                  >
                    <option value="auto">Auto (Firecrawl → Puppeteer)</option>
                    <option value="firecrawl">Firecrawl Only</option>
                    <option value="puppeteer">Puppeteer Only</option>
                  </select>
                </div>

                {/* Max Retries */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Max Retries: {maxRetries}
                  </label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={maxRetries}
                    onChange={(e) => setMaxRetries(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Rate Limit */}
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Rate Limit: {rateLimit}ms
                  </label>
                  <input
                    type="range"
                    min="0"
                    max="5000"
                    step="500"
                    value={rateLimit}
                    onChange={(e) => setRateLimit(parseInt(e.target.value))}
                    className="w-full"
                  />
                </div>

                {/* Cache Settings */}
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={useCache}
                    onChange={(e) => setUseCache(e.target.checked)}
                    className="w-4 h-4"
                  />
                  <label className="text-sm text-gray-300">
                    Use Cache (TTL: {cacheTTL}s)
                  </label>
                </div>
                {useCache && (
                  <input
                    type="range"
                    min="60"
                    max="7200"
                    step="60"
                    value={cacheTTL}
                    onChange={(e) => setCacheTTL(parseInt(e.target.value))}
                    className="w-full"
                  />
                )}
              </div>
            )}

            {/* Start Button */}
            <button
              onClick={startScraping}
              disabled={isLoading || selectedTargets.length === 0}
              className={`
                w-full px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2
                ${isLoading || selectedTargets.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'}
              `}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Scraping...
                </>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  Start Scraping ({selectedTargets.length})
                </>
              )}
            </button>

            {/* Progress Bar */}
            {isLoading && progress.total > 0 && (
              <div className="mt-4">
                <div className="flex justify-between text-sm text-gray-400 mb-2">
                  <span>Progress</span>
                  <span>{progress.current} / {progress.total}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all"
                    style={{ width: `${(progress.current / progress.total) * 100}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Results */}
          <div className="bg-gray-800 rounded-xl shadow-lg p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-100">
                Results ({results.length})
              </h2>
              {results.length > 0 && (
                <button
                  onClick={clearResults}
                  className="text-sm text-red-600 hover:text-red-700"
                >
                  <Trash2 className="w-4 h-4 inline mr-1" />
                  Clear
                </button>
              )}
            </div>

            {results.length === 0 ? (
              <p className="text-gray-400 text-center py-8">
                No results yet. Select targets and start scraping.
              </p>
            ) : (
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {results.map((result) => (
                  <div
                    key={result.id}
                    className={`
                      p-4 rounded-lg border-2
                      ${result.result.success
                        ? 'border-green-700 bg-green-900'
                        : 'border-red-700 bg-red-900'}
                    `}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex items-center gap-2">
                        {result.result.success ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <AlertCircle className="w-5 h-5 text-red-600" />
                        )}
                        <h3 className="font-semibold text-gray-100">{result.targetName}</h3>
                      </div>
                      <span className="text-xs text-gray-400">
                        {result.timestamp.toLocaleTimeString()}
                      </span>
                    </div>

                    {result.result.success ? (
                      <>
                        <p className="text-sm text-gray-400 mb-2">
                          {result.result.recordCount} records • {result.result.executionTime}ms • {result.result.source}
                          {result.result.cached && ' • (cached)'}
                        </p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setPreviewData({ open: true, result })}
                            className="px-3 py-1 text-sm bg-purple-100 text-purple-700 rounded hover:bg-purple-200 flex items-center gap-1"
                          >
                            <Eye className="w-4 h-4" />
                            Preview
                          </button>
                          <button
                            onClick={() => downloadJSON(result)}
                            className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center gap-1"
                          >
                            <FileJson className="w-4 h-4" />
                            JSON
                          </button>
                          <button
                            onClick={() => downloadCSV(result)}
                            className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center gap-1"
                          >
                            <FileSpreadsheet className="w-4 h-4" />
                            CSV
                          </button>
                          <button
                            onClick={() => downloadXLSX(result)}
                            className="px-3 py-1 text-sm bg-emerald-100 text-emerald-700 rounded hover:bg-emerald-200 flex items-center gap-1"
                          >
                            <Download className="w-4 h-4" />
                            XLSX
                          </button>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-red-600">
                        Error: {result.result.error}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Data Preview Modal */}
      {previewData.open && previewData.result && (
        <DataPreviewModal
          isOpen={previewData.open}
          data={Array.isArray(previewData.result.result.data)
            ? previewData.result.result.data
            : [previewData.result.result.data]}
          targetName={previewData.result.targetName}
          metadata={{
            recordCount: previewData.result.result.recordCount,
            executionTime: previewData.result.result.executionTime,
            source: previewData.result.result.source,
            timestamp: previewData.result.timestamp
          }}
          onClose={() => setPreviewData({ open: false, result: null })}
          onExport={handlePreviewExport}
        />
      )}
    </div>
  );
}
