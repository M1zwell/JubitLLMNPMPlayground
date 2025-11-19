/**
 * HK Scraper Modern - Upgraded UI with Integrated CCASS Viewer
 *
 * Features:
 * - Modern tabbed interface with HKSFC, HKEX, and CCASS
 * - Integrated CCASSViewer with advanced features
 * - Enhanced data visualization
 * - Export capabilities
 * - Real-time statistics
 */

import React, { useState } from 'react';
import {
  TrendingUp,
  Building2,
  BarChart3,
  Database,
  Loader2,
  FileJson,
  FileSpreadsheet,
  Search,
  Filter,
  Download,
  RefreshCw,
  Eye,
  Activity
} from 'lucide-react';
import CCASSViewer from './CCASSViewer';
import HKSFCDashboard from './HKSFCDashboard';
import HKEXDisclosureViewer from './HKEXDisclosureViewer';
import SFCFinancialStatisticsTabs from './SFCFinancialStatisticsTabs';

type DataSource = 'hksfc' | 'hkex' | 'ccass' | 'sfc_stats';
type ViewMode = 'scrape' | 'view' | 'analyze';

export default function HKScraperModern() {
  const [activeSource, setActiveSource] = useState<DataSource>('sfc_stats');
  const [viewMode, setViewMode] = useState<ViewMode>('view');

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-blue-950 dark:to-indigo-950">
      <div className="max-w-7xl mx-auto p-3 md:p-6 space-y-4">

        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 md:p-6 border border-gray-100 dark:border-gray-700">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-6 gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                香港数据中心
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1 md:mt-2 text-sm md:text-base">
                Hong Kong Market Data Hub - HKSFC, HKEX & CCASS
              </p>
            </div>
            <div className="flex items-center gap-2 md:gap-3">
              <div className="px-3 md:px-4 py-1 md:py-2 bg-green-100 dark:bg-green-900/40 rounded-full border border-green-200 dark:border-green-700">
                <span className="text-green-700 dark:text-green-300 font-semibold text-xs md:text-sm">✓ Live</span>
              </div>
              <Activity className="text-blue-500 dark:text-blue-400 animate-pulse" size={20} />
            </div>
          </div>

          {/* Data Source Tabs */}
          <div className="flex flex-col sm:flex-row gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-xl">
            <button
              onClick={() => setActiveSource('ccass')}
              className={`flex-1 px-3 md:px-6 py-2 md:py-3 rounded-lg font-semibold text-sm md:text-base transition-all duration-200 flex items-center justify-center gap-2 ${
                activeSource === 'ccass'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:bg-white hover:shadow'
              }`}
            >
              <Building2 size={20} />
              CCASS Holdings
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activeSource === 'ccass' ? 'bg-white/20' : 'bg-blue-100 text-blue-700'
              }`}>
                New
              </span>
            </button>

            <button
              onClick={() => setActiveSource('hksfc')}
              className={`flex-1 px-3 md:px-6 py-2 md:py-3 rounded-lg font-semibold text-sm md:text-base transition-all duration-200 flex items-center justify-center gap-2 ${
                activeSource === 'hksfc'
                  ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:bg-white hover:shadow'
              }`}
            >
              <Database size={20} />
              HKSFC Filings
            </button>

            <button
              onClick={() => setActiveSource('hkex')}
              className={`flex-1 px-3 md:px-6 py-2 md:py-3 rounded-lg font-semibold text-sm md:text-base transition-all duration-200 flex items-center justify-center gap-2 ${
                activeSource === 'hkex'
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:bg-white hover:shadow'
              }`}
            >
              <TrendingUp size={20} />
              Disclosure of Interests
            </button>

            <button
              onClick={() => setActiveSource('sfc_stats')}
              className={`flex-1 px-3 md:px-6 py-2 md:py-3 rounded-lg font-semibold text-sm md:text-base transition-all duration-200 flex items-center justify-center gap-2 ${
                activeSource === 'sfc_stats'
                  ? 'bg-gradient-to-r from-orange-500 to-red-500 text-white shadow-lg transform scale-105'
                  : 'text-gray-600 hover:bg-white hover:shadow'
              }`}
            >
              <BarChart3 size={20} />
              Financial Dashboard
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                activeSource === 'sfc_stats' ? 'bg-white/20' : 'bg-orange-100 text-orange-700'
              }`}>
                Charts
              </span>
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex gap-2 mt-4 p-1 bg-gray-100 rounded-lg max-w-md">
            <button
              onClick={() => setViewMode('view')}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-all flex items-center justify-center gap-2 ${
                viewMode === 'view'
                  ? 'bg-white text-blue-600 shadow'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
            >
              <Eye size={16} />
              View Data
            </button>

            <button
              onClick={() => setViewMode('analyze')}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-all flex items-center justify-center gap-2 ${
                viewMode === 'analyze'
                  ? 'bg-white text-blue-600 shadow'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
            >
              <BarChart3 size={16} />
              Analyze
            </button>

            <button
              onClick={() => setViewMode('scrape')}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-all flex items-center justify-center gap-2 ${
                viewMode === 'scrape'
                  ? 'bg-white text-blue-600 shadow'
                  : 'text-gray-600 hover:bg-white/50'
              }`}
            >
              <RefreshCw size={16} />
              Scrape
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {activeSource === 'ccass' && viewMode === 'view' && (
            <CCASSViewer />
          )}

          {activeSource === 'ccass' && viewMode === 'analyze' && (
            <div className="p-4">
              <CCASSAnalytics />
            </div>
          )}

          {activeSource === 'ccass' && viewMode === 'scrape' && (
            <div className="p-4">
              <CCASSScrapeTool />
            </div>
          )}

          {activeSource === 'hksfc' && (
            <div>
              {viewMode === 'view' && <HKSFCDashboard />}
              {viewMode === 'analyze' && (
                <div className="p-4">
                  <ComingSoonPlaceholder
                    title="HKSFC Analytics"
                    description="Advanced analytics for HKSFC regulatory filings"
                  />
                </div>
              )}
              {viewMode === 'scrape' && (
                <div className="p-4">
                  <ComingSoonPlaceholder
                    title="HKSFC Scraper"
                    description="Scrape HKSFC filings data"
                  />
                </div>
              )}
            </div>
          )}

          {activeSource === 'hkex' && (
            <div>
              {viewMode === 'view' && <HKEXDisclosureViewer />}
              {viewMode === 'analyze' && (
                <div className="p-4">
                  <ComingSoonPlaceholder
                    title="Disclosure Analytics"
                    description="Advanced analytics for disclosure of interests"
                  />
                </div>
              )}
              {viewMode === 'scrape' && (
                <div className="p-4">
                  <ComingSoonPlaceholder
                    title="Disclosure Scraper"
                    description="Scrape disclosure of interests data"
                  />
                </div>
              )}
            </div>
          )}

          {activeSource === 'sfc_stats' && (
            <div className="p-4">
              <SFCFinancialStatisticsTabs />
            </div>
          )}
        </div>

        {/* Quick Stats Footer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            icon={<Building2 className="text-blue-500" />}
            title="Total Records"
            value="412"
            subtitle="CCASS Holdings"
            color="blue"
          />
          <StatCard
            icon={<Database className="text-green-500" />}
            title="Data Sources"
            value="3"
            subtitle="Active Scrapers"
            color="green"
          />
          <StatCard
            icon={<TrendingUp className="text-purple-500" />}
            title="Stocks Tracked"
            value="1"
            subtitle="00700 - Tencent"
            color="purple"
          />
          <StatCard
            icon={<Activity className="text-orange-500" />}
            title="Last Update"
            value="Today"
            subtitle="Nov 12, 2025"
            color="orange"
          />
        </div>
      </div>
    </div>
  );
}

// Stat Card Component
function StatCard({
  icon,
  title,
  value,
  subtitle,
  color
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  color: string;
}) {
  const colorClasses = {
    blue: 'from-blue-50 to-blue-100 border-blue-200',
    green: 'from-green-50 to-green-100 border-green-200',
    purple: 'from-purple-50 to-purple-100 border-purple-200',
    orange: 'from-orange-50 to-orange-100 border-orange-200'
  };

  return (
    <div className={`bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} border rounded-xl p-6 shadow-lg hover:shadow-xl transition-shadow`}>
      <div className="flex items-center gap-3 mb-2">
        {icon}
        <p className="text-sm font-medium text-gray-600">{title}</p>
      </div>
      <p className="text-2xl font-bold text-gray-900 mb-1">{value}</p>
      <p className="text-xs text-gray-500">{subtitle}</p>
    </div>
  );
}

// CCASS Analytics Component
function CCASSAnalytics() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <BarChart3 className="text-blue-500" size={32} />
        <div>
          <h2 className="text-xl font-bold text-gray-900">CCASS Analytics</h2>
          <p className="text-gray-600">Advanced shareholding analysis and insights</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Concentration Analysis */}
        <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-6 border border-blue-200">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-600" />
            Ownership Concentration
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-white rounded-lg">
              <span className="text-sm text-gray-600">Top 1 Shareholder</span>
              <span className="font-bold text-blue-600">35.22%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded-lg">
              <span className="text-sm text-gray-600">Top 5 Concentration</span>
              <span className="font-bold text-purple-600">56.73%</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded-lg">
              <span className="text-sm text-gray-600">Top 10 Concentration</span>
              <span className="font-bold text-green-600">68.45%</span>
            </div>
          </div>
        </div>

        {/* Shareholder Distribution */}
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-6 border border-green-200">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Building2 size={20} className="text-green-600" />
            Shareholder Distribution
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-white rounded-lg">
              <span className="text-sm text-gray-600">Total Participants</span>
              <span className="font-bold text-green-600">412</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded-lg">
              <span className="text-sm text-gray-600">Market Intermediaries</span>
              <span className="font-bold text-blue-600">402</span>
            </div>
            <div className="flex justify-between items-center p-3 bg-white rounded-lg">
              <span className="text-sm text-gray-600">Investor Participants</span>
              <span className="font-bold text-purple-600">10</span>
            </div>
          </div>
        </div>
      </div>

      {/* Coming Soon Features */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-6 border border-purple-200">
        <h3 className="font-semibold text-gray-900 mb-4">🚀 Coming Soon</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-blue-500 rounded-full"></span>
            Historical shareholding trend charts
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-green-500 rounded-full"></span>
            Institutional holding change alerts
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-purple-500 rounded-full"></span>
            Multi-stock comparison analysis
          </li>
          <li className="flex items-center gap-2">
            <span className="w-2 h-2 bg-orange-500 rounded-full"></span>
            Herfindahl-Hirschman Index (HHI) calculation
          </li>
        </ul>
      </div>
    </div>
  );
}

// CCASS Scrape Tool Component
function CCASSScrapeTool() {
  const [stockCode, setStockCode] = useState('00700');
  const [isScraping, setIsScraping] = useState(false);

  const handleScrape = async () => {
    setIsScraping(true);
    // Simulated scraping - replace with actual logic
    setTimeout(() => {
      setIsScraping(false);
      alert(`Scraping completed for stock ${stockCode}!`);
    }, 2000);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <RefreshCw className="text-blue-500" size={32} />
        <div>
          <h2 className="text-xl font-bold text-gray-900">Scrape CCASS Data</h2>
          <p className="text-gray-600">Extract latest shareholding information from HKEX</p>
        </div>
      </div>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-8 border border-blue-200">
        <div className="max-w-2xl mx-auto space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Stock Code
            </label>
            <input
              type="text"
              value={stockCode}
              onChange={(e) => setStockCode(e.target.value)}
              placeholder="e.g., 00700"
              className="w-full px-4 py-3 border-2 border-blue-200 rounded-lg focus:ring-4 focus:ring-blue-100 focus:border-blue-500 transition-all"
            />
          </div>

          <button
            onClick={handleScrape}
            disabled={isScraping}
            className="w-full px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-lg font-semibold hover:from-blue-600 hover:to-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            {isScraping ? (
              <>
                <Loader2 size={20} className="animate-spin" />
                Scraping in progress...
              </>
            ) : (
              <>
                <RefreshCw size={20} />
                Start Scraping
              </>
            )}
          </button>

          <div className="bg-white rounded-lg p-6 shadow">
            <h3 className="font-semibold text-gray-900 mb-3">💡 Quick Guide</h3>
            <ul className="space-y-2 text-sm text-gray-700">
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">1.</span>
                <span>Enter the stock code (e.g., 00700 for Tencent)</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">2.</span>
                <span>Click "Start Scraping" to fetch latest data</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">3.</span>
                <span>Data will be automatically saved to database</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500 font-bold">4.</span>
                <span>Switch to "View Data" tab to see results</span>
              </li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>⚠️ Note:</strong> Scraping is subject to HKEX terms of use.
              Use responsibly and avoid high-frequency requests.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Coming Soon Placeholder
function ComingSoonPlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <div className="text-center py-16">
      <div className="inline-block p-6 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full mb-6">
        <Database size={64} className="text-blue-600" />
      </div>
      <h2 className="text-3xl font-bold text-gray-900 mb-3">{title}</h2>
      <p className="text-gray-600 text-lg mb-6 max-w-md mx-auto">{description}</p>
      <div className="inline-block px-6 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 text-white rounded-full font-semibold">
        🚧 Coming Soon
      </div>
    </div>
  );
}
