/**
 * HKSFC Dashboard - Unified view for Filings and Statistics
 * Combines HKSFCViewer and HKSFCStatisticsViewer with tab navigation
 */

import React, { useState } from 'react';
import { Newspaper, BarChart3 } from 'lucide-react';
import HKSFCViewer from './HKSFCViewer';
import HKSFCStatisticsViewer from './HKSFCStatisticsViewer';

type DashboardTab = 'filings' | 'statistics';

export default function HKSFCDashboard() {
  const [activeTab, setActiveTab] = useState<DashboardTab>('filings');

  return (
    <div className="space-y-6">
      {/* Main Header */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-700 rounded-2xl p-8 shadow-2xl">
        <h1 className="text-4xl font-bold text-white mb-3">
          Hong Kong SFC Data Hub
        </h1>
        <p className="text-green-100 text-lg">
          Regulatory filings, market statistics, and compliance data from Hong Kong Securities & Futures Commission
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="bg-white rounded-2xl shadow-xl p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('filings')}
            className={`flex-1 py-4 px-8 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 ${
              activeTab === 'filings'
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-xl transform scale-105'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-102'
            }`}
          >
            <Newspaper size={24} />
            HKSFC Filings
            {activeTab === 'filings' && (
              <span className="ml-2 px-3 py-1 bg-white/30 backdrop-blur-sm rounded-full text-xs font-bold">
                ACTIVE
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('statistics')}
            className={`flex-1 py-4 px-8 rounded-xl font-bold text-lg transition-all duration-300 flex items-center justify-center gap-3 ${
              activeTab === 'statistics'
                ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-xl transform scale-105'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-102'
            }`}
          >
            <BarChart3 size={24} />
            Market Statistics
            {activeTab === 'statistics' && (
              <span className="ml-2 px-3 py-1 bg-white/30 backdrop-blur-sm rounded-full text-xs font-bold">
                ACTIVE
              </span>
            )}
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div className="transition-all duration-300">
        {activeTab === 'filings' && <HKSFCViewer />}
        {activeTab === 'statistics' && <HKSFCStatisticsViewer />}
      </div>
    </div>
  );
}
