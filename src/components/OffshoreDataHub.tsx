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
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-cyan-50 to-teal-50 dark:from-gray-900 dark:via-cyan-950 dark:to-teal-950 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-3">
                <Shield className="text-cyan-500" size={40} />
                Offshore Financial Data Hub
              </h1>
              <p className="text-gray-600 dark:text-gray-300 mt-2 text-lg">
                Cayman Islands & BVI Regulatory Data Platform
              </p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-100 to-teal-100 dark:from-cyan-900 dark:to-teal-900 rounded-lg">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Live Data</span>
            </div>
          </div>

          {/* Data Source Tabs */}
          <div className="flex gap-3 mb-6">
            <button
              onClick={() => setActiveSource('cima')}
              className={`flex-1 px-6 py-4 rounded-xl font-semibold text-lg transition-all ${
                activeSource === 'cima'
                  ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg scale-105'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Shield size={20} />
                <span>🇰🇾 CIMA</span>
              </div>
              <div className="text-xs mt-1 opacity-90">Cayman Islands</div>
            </button>

            <button
              onClick={() => setActiveSource('bvi')}
              className={`flex-1 px-6 py-4 rounded-xl font-semibold text-lg transition-all ${
                activeSource === 'bvi'
                  ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg scale-105'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              <div className="flex items-center justify-center gap-2">
                <Shield size={20} />
                <span>🇻🇬 BVI FSC</span>
              </div>
              <div className="text-xs mt-1 opacity-90">British Virgin Islands</div>
            </button>
          </div>

          {/* View Mode Tabs */}
          <div className="flex gap-2 p-1 bg-gray-100 dark:bg-gray-700 rounded-lg">
            <button
              onClick={() => setViewMode('view')}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
                viewMode === 'view'
                  ? activeSource === 'cima'
                    ? 'bg-cyan-500 text-white shadow-md'
                    : 'bg-teal-500 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              📊 View Data
            </button>
            <button
              onClick={() => setViewMode('analyze')}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
                viewMode === 'analyze'
                  ? activeSource === 'cima'
                    ? 'bg-cyan-500 text-white shadow-md'
                    : 'bg-teal-500 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              📈 Analyze
            </button>
            <button
              onClick={() => setViewMode('scrape')}
              className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
                viewMode === 'scrape'
                  ? activeSource === 'cima'
                    ? 'bg-cyan-500 text-white shadow-md'
                    : 'bg-teal-500 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              🔄 Scrape
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          {activeSource === 'cima' && (
            <div>
              {viewMode === 'view' && <CIMAViewer />}
              {viewMode === 'analyze' && (
                <div className="p-8">
                  <ComingSoonPlaceholder
                    title="CIMA Analytics"
                    description="Advanced analytics for Cayman Islands regulated entities"
                    icon="📊"
                  />
                </div>
              )}
              {viewMode === 'scrape' && (
                <div className="p-8">
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
                <div className="p-8">
                  <ComingSoonPlaceholder
                    title="BVI FSC Analytics"
                    description="Advanced analytics for BVI regulated entities"
                    icon="📊"
                  />
                </div>
              )}
              {viewMode === 'scrape' && (
                <div className="p-8">
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard
            icon={<Shield className="text-cyan-500" />}
            title="Jurisdictions"
            value="2"
            subtitle="Cayman & BVI"
            color="cyan"
          />
          <StatCard
            icon={<Database className="text-teal-500" />}
            title="Data Sources"
            value="2"
            subtitle="Active Regulators"
            color="teal"
          />
          <StatCard
            icon={<Building2 className="text-purple-500" />}
            title="Entity Types"
            value="15+"
            subtitle="Categories"
            color="purple"
          />
          <StatCard
            icon={<Activity className="text-orange-500" />}
            title="Last Update"
            value="Real-time"
            subtitle="Live Sync"
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
    cyan: 'from-cyan-50 to-cyan-100 border-cyan-200',
    teal: 'from-teal-50 to-teal-100 border-teal-200',
    purple: 'from-purple-50 to-purple-100 border-purple-200',
    orange: 'from-orange-50 to-orange-100 border-orange-200'
  };

  return (
    <div
      className={`bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} dark:from-gray-800 dark:to-gray-700 border dark:border-gray-600 rounded-xl p-6 shadow-lg hover:shadow-xl transition-all`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-gray-600 dark:text-gray-300">{title}</div>
        {icon}
      </div>
      <div className="text-3xl font-bold text-gray-900 dark:text-white mb-1">{value}</div>
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
    <div className="text-center py-16">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{title}</h3>
      <p className="text-gray-600 dark:text-gray-300 mb-6 max-w-md mx-auto">{description}</p>
      <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-100 to-teal-100 dark:from-cyan-900 dark:to-teal-900 rounded-lg">
        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-200">Coming Soon</span>
      </div>
    </div>
  );
}
