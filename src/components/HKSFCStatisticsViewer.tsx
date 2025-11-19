/**
 * HKSFC Statistics Viewer Component
 * Displays real SFC market statistics from A1-D4 tables
 */

import React, { useState } from 'react';
import {
  TrendingUp,
  Building2,
  PieChart,
  BarChart3,
  DollarSign,
  ArrowRightLeft,
  Activity
} from 'lucide-react';
import A1MarketHighlightsDashboard from './A1MarketHighlightsDashboard';
import A2MarketStructureDashboard from './A2MarketStructureDashboard';
import A3LiquidityDashboard from './A3LiquidityDashboard';
import C4LicensedRepsDashboard from './C4LicensedRepsDashboard';
import C5ResponsibleOfficersDashboard from './C5ResponsibleOfficersDashboard';
import D3FundNavDashboard from './D3FundNavDashboard';
import D4FundFlowsDashboard from './D4FundFlowsDashboard';

type TabType = 'a1' | 'a2' | 'a3' | 'c4' | 'c5' | 'd3' | 'd4';

export default function HKSFCStatisticsViewer() {
  const [activeTab, setActiveTab] = useState<TabType>('a1');

  const tabs = [
    {
      id: 'a1' as TabType,
      label: 'A1: Market Highlights',
      icon: <TrendingUp size={18} />,
      category: 'Market'
    },
    {
      id: 'a2' as TabType,
      label: 'A2: Market Structure',
      icon: <Building2 size={18} />,
      category: 'Market'
    },
    {
      id: 'a3' as TabType,
      label: 'A3: Market Liquidity',
      icon: <Activity size={18} />,
      category: 'Market'
    },
    {
      id: 'c4' as TabType,
      label: 'C4: Licensees',
      icon: <Building2 size={18} />,
      category: 'Licensees'
    },
    {
      id: 'c5' as TabType,
      label: 'C5: Licence Classes',
      icon: <BarChart3 size={18} />,
      category: 'Licensees'
    },
    {
      id: 'd3' as TabType,
      label: 'D3: Fund NAV',
      icon: <DollarSign size={18} />,
      category: 'Funds'
    },
    {
      id: 'd4' as TabType,
      label: 'D4: Fund Flows',
      icon: <ArrowRightLeft size={18} />,
      category: 'Funds'
    }
  ];

  const marketTabs = tabs.filter(t => t.category === 'Market');
  const licenseeTabs = tabs.filter(t => t.category === 'Licensees');
  const fundTabs = tabs.filter(t => t.category === 'Funds');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 shadow-2xl">
        <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
          <BarChart3 size={36} />
          SFC Market Statistics - Real Data
        </h2>
        <p className="text-blue-100 text-lg">
          Complete Hong Kong market data from A1, A2, A3, C4, C5, D3, and D4 tables
        </p>
      </div>

      {/* Category Groups */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 space-y-6">
        {/* Market Statistics (A1, A2, A3) */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-500" />
            Market Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {marketTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`p-4 rounded-xl font-semibold transition-all flex items-center gap-3 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg transform scale-105'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Licensee Statistics (C4, C5) */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
            <Building2 size={20} className="text-green-500" />
            Licensee Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {licenseeTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`p-4 rounded-xl font-semibold transition-all flex items-center gap-3 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg transform scale-105'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Fund Statistics (D3, D4) */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
            <PieChart size={20} className="text-purple-500" />
            Fund Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {fundTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`p-4 rounded-xl font-semibold transition-all flex items-center gap-3 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg transform scale-105'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Dashboard Content */}
      <div className="transition-all duration-300">
        {activeTab === 'a1' && <A1MarketHighlightsDashboard />}
        {activeTab === 'a2' && <A2MarketStructureDashboard />}
        {activeTab === 'a3' && <A3LiquidityDashboard />}
        {activeTab === 'c4' && <C4LicensedRepsDashboard />}
        {activeTab === 'c5' && <C5ResponsibleOfficersDashboard />}
        {activeTab === 'd3' && <D3FundNavDashboard />}
        {activeTab === 'd4' && <D4FundFlowsDashboard />}
      </div>
    </div>
  );
}
