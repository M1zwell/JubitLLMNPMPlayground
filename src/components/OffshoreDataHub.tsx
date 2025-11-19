/**
 * Offshore Data Hub - Cayman Islands & BVI Financial Regulators
 *
 * Features:
 * - Modern tabbed interface with CIMA and BVI FSC
 * - Integrated viewers with advanced features
 * - Enhanced data visualization
 * - Export capabilities
 * - Real-time statistics
 */

import React, { useState } from 'react';
import {
  Shield,
  Globe,
  BarChart3,
  Database,
  Activity,
  Building2
} from 'lucide-react';
import CIMAViewer from './CIMAViewer';
import BVIViewer from './BVIViewer';

type DataSource = 'cima' | 'bvi';
type ViewMode = 'view' | 'analyze' | 'scrape';

export default function OffshoreDataHub() {
  const [activeSource, setActiveSource] = useState<DataSource>('cima');
  const [viewMode, setViewMode] = useState<ViewMode>('view');

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-pink-50 to-fuchsia-50 dark:from-gray-900 dark:via-pink-950 dark:to-rose-950 p-3 md:p-6">
      <div className="max-w-7xl mx-auto space-y-4">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-4 md:p-6 border border-pink-100 dark:border-pink-800">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-4 md:mb-6 gap-4">
            <div>
              <h1 className="text-xl md:text-2xl font-bold bg-gradient-to-r from-pink-600 to-rose-600 bg-clip-text text-transparent flex items-center gap-2">
                <Shield className="text-pink-500" size={32} />
                Offshore Financial Data Hub
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-1 text-sm md:text-base">
                Cayman Islands & BVI Regulatory Data Platform
              </p>
            </div>
            <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-pink-100 to-rose-100 dark:from-pink-900/40 dark:to-rose-900/40 rounded-lg border border-pink-200 dark:border-pink-700">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-xs md:text-sm font-medium text-pink-700 dark:text-pink-300">Live Data</span>
            </div>
          </div>

          {/* Data Source Tabs */}
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 mb-4 md:mb-6">
            <button
              onClick={() => setActiveSource('cima')}
              className={`flex-1 px-4 md:px-6 py-3 md:py-4 rounded-xl font-semibold text-base md:text-lg transition-all ${
                activeSource === 'cima'
                  ? 'bg-gradient-to-r from-pink-500 to-pink-600 text-white shadow-lg md:scale-105'
                  : 'bg-pink-50 dark:bg-pink-900/20 text-pink-700 dark:text-pink-200 hover:bg-pink-100 dark:hover:bg-pink-900/40 border border-pink-200 dark:border-pink-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Shield size={18} />
                <span>🇰🇾 CIMA</span>
              </div>
              <div className="text-xs mt-1 opacity-90">Cayman Islands</div>
            </button>

            <button
              onClick={() => setActiveSource('bvi')}
              className={`flex-1 px-4 md:px-6 py-3 md:py-4 rounded-xl font-semibold text-base md:text-lg transition-all ${
                activeSource === 'bvi'
                  ? 'bg-gradient-to-r from-rose-500 to-rose-600 text-white shadow-lg md:scale-105'
                  : 'bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-200 hover:bg-rose-100 dark:hover:bg-rose-900/40 border border-rose-200 dark:border-rose-700'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Shield size={18} />
                <span>🇻🇬 BVI FSC</span>
              </div>
              <div className="text-xs mt-1 opacity-90">British Virgin Islands</div>
            </button>
          </div>

          {/* View Mode Tabs */}
          <div className="flex gap-1 sm:gap-2 p-1 bg-pink-50 dark:bg-pink-900/20 rounded-lg border border-pink-100 dark:border-pink-800">
            <button
              onClick={() => setViewMode('view')}
              className={`flex-1 px-2 sm:px-4 py-2 rounded-md font-medium text-xs sm:text-sm transition-all ${
                viewMode === 'view'
                  ? activeSource === 'cima'
                    ? 'bg-pink-500 text-white shadow-md'
                    : 'bg-rose-500 text-white shadow-md'
                  : 'text-pink-600 dark:text-pink-300 hover:text-pink-900 dark:hover:text-white hover:bg-pink-100 dark:hover:bg-pink-900/40'
              }`}
            >
              <span className="hidden sm:inline">📊 View Data</span>
              <span className="sm:hidden">📊 View</span>
            </button>
            <button
              onClick={() => setViewMode('analyze')}
              className={`flex-1 px-2 sm:px-4 py-2 rounded-md font-medium text-xs sm:text-sm transition-all ${
                viewMode === 'analyze'
                  ? activeSource === 'cima'
                    ? 'bg-pink-500 text-white shadow-md'
                    : 'bg-rose-500 text-white shadow-md'
                  : 'text-pink-600 dark:text-pink-300 hover:text-pink-900 dark:hover:text-white hover:bg-pink-100 dark:hover:bg-pink-900/40'
              }`}
            >
              <span className="hidden sm:inline">📈 Analyze</span>
              <span className="sm:hidden">📈</span>
            </button>
            <button
              onClick={() => setViewMode('scrape')}
              className={`flex-1 px-2 sm:px-4 py-2 rounded-md font-medium text-xs sm:text-sm transition-all ${
                viewMode === 'scrape'
                  ? activeSource === 'cima'
                    ? 'bg-pink-500 text-white shadow-md'
                    : 'bg-rose-500 text-white shadow-md'
                  : 'text-pink-600 dark:text-pink-300 hover:text-pink-900 dark:hover:text-white hover:bg-pink-100 dark:hover:bg-pink-900/40'
              }`}
            >
              <span className="hidden sm:inline">🔄 Scrape</span>
              <span className="sm:hidden">🔄</span>
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-pink-100 dark:border-pink-800">
          {activeSource === 'cima' && (
            <div>
              {viewMode === 'view' && <CIMAViewer />}
              {viewMode === 'analyze' && (
                <div className="p-4">
                  <ComingSoonPlaceholder
                    title="CIMA Analytics"
                    description="Advanced analytics for Cayman Islands regulated entities"
                    icon="📊"
                  />
                </div>
              )}
              {viewMode === 'scrape' && (
                <div className="p-4">
                  <ComingSoonPlaceholder
                    title="CIMA Scraper"
                    description="Automated data scraping from CIMA regulatory database"
                    icon="🔄"
                  />
                </div>
              )}
            </div>
          )}

          {activeSource === 'bvi' && (
            <div>
              {viewMode === 'view' && <BVIViewer />}
              {viewMode === 'analyze' && (
                <div className="p-4">
                  <ComingSoonPlaceholder
                    title="BVI FSC Analytics"
                    description="Advanced analytics for BVI regulated entities"
                    icon="📊"
                  />
                </div>
              )}
              {viewMode === 'scrape' && (
                <div className="p-4">
                  <ComingSoonPlaceholder
                    title="BVI FSC Scraper"
                    description="Automated data scraping from BVI FSC regulatory database"
                    icon="🔄"
                  />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Quick Stats Footer */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
          <StatCard
            icon={<Shield className="text-purple-500" />}
            title="Jurisdictions"
            value="2"
            subtitle="Cayman & BVI"
            color="purple"
          />
          <StatCard
            icon={<Database className="text-indigo-500" />}
            title="Data Sources"
            value="2"
            subtitle="Active Regulators"
            color="indigo"
          />
          <StatCard
            icon={<Building2 className="text-violet-500" />}
            title="Entity Types"
            value="15+"
            subtitle="Categories"
            color="violet"
          />
          <StatCard
            icon={<Activity className="text-fuchsia-500" />}
            title="Last Update"
            value="Real-time"
            subtitle="Live Sync"
            color="fuchsia"
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
    purple: 'from-pink-50 to-pink-100 border-pink-200 dark:from-pink-900/20 dark:to-pink-800/20 dark:border-pink-700',
    indigo: 'from-rose-50 to-rose-100 border-rose-200 dark:from-rose-900/20 dark:to-rose-800/20 dark:border-rose-700',
    violet: 'from-fuchsia-50 to-fuchsia-100 border-fuchsia-200 dark:from-fuchsia-900/20 dark:to-fuchsia-800/20 dark:border-fuchsia-700',
    fuchsia: 'from-pink-50 to-pink-100 border-pink-200 dark:from-pink-900/20 dark:to-pink-800/20 dark:border-pink-700'
  };

  return (
    <div
      className={`bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} border rounded-xl p-4 md:p-6 shadow-lg hover:shadow-xl transition-all`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-300">{title}</div>
        {icon}
      </div>
      <div className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-1">{value}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</div>
    </div>
  );
}

// Coming Soon Placeholder
function ComingSoonPlaceholder({
  title,
  description,
  icon
}: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="text-center py-12 md:py-16 px-4">
      <div className="text-4xl md:text-6xl mb-3 md:mb-4">{icon}</div>
      <h3 className="text-lg md:text-xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-sm md:text-base text-gray-600 dark:text-gray-300 mb-4 md:mb-6 max-w-md mx-auto">{description}</p>
      <div className="inline-flex items-center gap-2 px-4 md:px-6 py-2 md:py-3 bg-gradient-to-r from-pink-100 to-rose-100 dark:from-pink-900/40 dark:to-rose-900/40 rounded-lg border border-pink-200 dark:border-pink-700">
        <div className="w-2 h-2 bg-pink-500 rounded-full animate-pulse"></div>
        <span className="text-xs md:text-sm font-medium text-pink-700 dark:text-pink-300">Coming Soon</span>
      </div>
    </div>
  );
}
