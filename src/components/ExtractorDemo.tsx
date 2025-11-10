/**
 * Extractor Demo Component
 *
 * Demonstrates the new domain-specific extractors in action:
 * - HKEx CCASS Extractor
 * - HKSFC News Extractor
 * - NPM Package Extractor
 */

import React, { useState } from 'react';
import {
  FileJson,
  Package,
  TrendingUp,
  Newspaper,
  Play,
  CheckCircle,
  XCircle,
  Loader2,
  Code,
  Download,
  AlertCircle,
} from 'lucide-react';
import { getEdgeFunctionScraper } from '../lib/scraping/edge-function-client';

// ============================================================================
// Types
// ============================================================================

interface ExtractorResult {
  success: boolean;
  data?: any;
  error?: string;
  executionTime?: number;
  timestamp?: string;
}

type DemoTab = 'hkex' | 'hksfc' | 'npm';

// ============================================================================
// Main Component
// ============================================================================

export default function ExtractorDemo() {
  const [activeTab, setActiveTab] = useState<DemoTab>('npm');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ExtractorResult | null>(null);

  // Input states
  const [stockCodes, setStockCodes] = useState('00700,00005');
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });
  const [packageName, setPackageName] = useState('react');

  const handleExtract = async () => {
    setIsLoading(true);
    setResult(null);

    try {
      const scraper = getEdgeFunctionScraper();
      let response;

      switch (activeTab) {
        case 'hkex':
          response = await scraper.scrapeHKEXCCASS(
            stockCodes.split(',').map(s => s.trim()),
            dateRange
          );
          break;

        case 'hksfc':
          response = await scraper.scrapeHKSFCNews(dateRange);
          break;

        case 'npm':
          response = await scraper.scrapeNPMPackage(packageName);
          break;
      }

      setResult({
        success: response.success,
        data: response.data,
        error: response.error,
        executionTime: response.executionTime,
        timestamp: response.timestamp,
      });
    } catch (error) {
      setResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const downloadJSON = () => {
    if (!result?.data) return;

    const blob = new Blob([JSON.stringify(result.data, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeTab}-extract-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Code className="text-blue-400" size={32} />
            Extractor Demo
          </h1>
          <p className="text-gray-400">
            Test the new domain-specific extractors with real data sources
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b border-gray-700">
          <TabButton
            active={activeTab === 'npm'}
            icon={<Package size={18} />}
            label="NPM Package"
            onClick={() => setActiveTab('npm')}
          />
          <TabButton
            active={activeTab === 'hkex'}
            icon={<TrendingUp size={18} />}
            label="HKEx CCASS"
            onClick={() => setActiveTab('hkex')}
          />
          <TabButton
            active={activeTab === 'hksfc'}
            icon={<Newspaper size={18} />}
            label="HKSFC News"
            onClick={() => setActiveTab('hksfc')}
          />
        </div>

        {/* Input Section */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">Input Parameters</h2>

          {activeTab === 'npm' && (
            <NPMInput
              packageName={packageName}
              setPackageName={setPackageName}
            />
          )}

          {activeTab === 'hkex' && (
            <HKEXInput
              stockCodes={stockCodes}
              setStockCodes={setStockCodes}
              dateRange={dateRange}
              setDateRange={setDateRange}
            />
          )}

          {activeTab === 'hksfc' && (
            <HKSFCInput dateRange={dateRange} setDateRange={setDateRange} />
          )}

          {/* Extract Button */}
          <button
            onClick={handleExtract}
            disabled={isLoading}
            className="mt-4 px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed rounded-lg font-medium flex items-center gap-2 transition-colors"
          >
            {isLoading ? (
              <>
                <Loader2 className="animate-spin" size={18} />
                Extracting...
              </>
            ) : (
              <>
                <Play size={18} />
                Extract Data
              </>
            )}
          </button>
        </div>

        {/* Results Section */}
        {result && (
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                {result.success ? (
                  <CheckCircle className="text-green-400" size={24} />
                ) : (
                  <XCircle className="text-red-400" size={24} />
                )}
                Extraction Result
              </h2>

              {result.success && (
                <button
                  onClick={downloadJSON}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Download size={16} />
                  Download JSON
                </button>
              )}
            </div>

            {/* Metadata */}
            {result.executionTime && (
              <div className="mb-4 text-sm text-gray-400">
                Execution time: {result.executionTime}ms
              </div>
            )}

            {/* Error Display */}
            {result.error && (
              <div className="bg-red-900/20 border border-red-700 rounded-lg p-4 mb-4">
                <div className="flex items-center gap-2 text-red-400">
                  <AlertCircle size={18} />
                  <span className="font-medium">Error</span>
                </div>
                <p className="text-red-300 mt-2">{result.error}</p>
              </div>
            )}

            {/* Data Display */}
            {result.success && result.data && (
              <div className="bg-gray-900 rounded-lg p-4 overflow-auto max-h-[600px]">
                <pre className="text-sm text-gray-300">
                  {JSON.stringify(result.data, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Documentation */}
        <div className="mt-8 bg-gray-800 rounded-lg p-6 border border-gray-700">
          <h2 className="text-xl font-semibold mb-4">About This Demo</h2>
          <div className="space-y-3 text-gray-300">
            <p>
              This demo showcases the new extractor architecture built by the BMad team:
            </p>
            <ul className="list-disc list-inside space-y-2 ml-4">
              <li>
                <strong>NPM Package Extractor:</strong> Fetches package metadata from NPM Registry API
                including downloads, dependencies, and GitHub stats
              </li>
              <li>
                <strong>HKEx CCASS Extractor:</strong> Extracts shareholding disclosure data from
                HKEX with form automation and table parsing
              </li>
              <li>
                <strong>HKSFC News Extractor:</strong> Scrapes news articles from HKSFC with
                category detection and date filtering
              </li>
            </ul>
            <p className="mt-4 text-sm text-gray-400">
              All extraction happens server-side via Supabase Edge Functions, allowing browser-based
              scraping without CORS issues.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// Input Components
// ============================================================================

interface NPMInputProps {
  packageName: string;
  setPackageName: (value: string) => void;
}

function NPMInput({ packageName, setPackageName }: NPMInputProps) {
  return (
    <div>
      <label className="block text-sm font-medium mb-2">Package Name</label>
      <input
        type="text"
        value={packageName}
        onChange={(e) => setPackageName(e.target.value)}
        placeholder="react"
        className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
      <p className="text-sm text-gray-400 mt-2">
        Examples: react, vue, express, @types/node
      </p>
    </div>
  );
}

interface HKEXInputProps {
  stockCodes: string;
  setStockCodes: (value: string) => void;
  dateRange: { start: string; end: string };
  setDateRange: (value: { start: string; end: string }) => void;
}

function HKEXInput({ stockCodes, setStockCodes, dateRange, setDateRange }: HKEXInputProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-2">Stock Codes (comma-separated)</label>
        <input
          type="text"
          value={stockCodes}
          onChange={(e) => setStockCodes(e.target.value)}
          placeholder="00700,00005"
          className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <p className="text-sm text-gray-400 mt-2">
          Examples: 00700 (Tencent), 00005 (HSBC), 00941 (China Mobile)
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium mb-2">Start Date</label>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">End Date</label>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
            className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>
    </div>
  );
}

interface HKSFCInputProps {
  dateRange: { start: string; end: string };
  setDateRange: (value: { start: string; end: string }) => void;
}

function HKSFCInput({ dateRange, setDateRange }: HKSFCInputProps) {
  return (
    <div className="grid grid-cols-2 gap-4">
      <div>
        <label className="block text-sm font-medium mb-2">Start Date</label>
        <input
          type="date"
          value={dateRange.start}
          onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
          className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-2">End Date</label>
        <input
          type="date"
          value={dateRange.end}
          onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
          className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
    </div>
  );
}

// ============================================================================
// UI Components
// ============================================================================

interface TabButtonProps {
  active: boolean;
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}

function TabButton({ active, icon, label, onClick }: TabButtonProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-3 flex items-center gap-2 border-b-2 transition-colors ${
        active
          ? 'border-blue-500 text-blue-400'
          : 'border-transparent text-gray-400 hover:text-gray-300'
      }`}
    >
      {icon}
      <span className="font-medium">{label}</span>
    </button>
  );
}
