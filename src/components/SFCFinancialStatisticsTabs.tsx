import React, { useState, useMemo } from 'react';
import { FileText, BarChart3, Table as TableIcon, TrendingUp, Sparkles, PieChart, Activity, Users, Shield, DollarSign, ArrowRightLeft } from 'lucide-react';
import {
  useSFCMarketHighlights,
  useSFCMarketCapByType,
  useSFCTurnoverByType,
  useSFCMutualFundNAV,
  useSFCLicensedReps,
  useSFCFundFlows,
  useSFCResponsibleOfficers
} from '../hooks/useSFCStatistics';
import SFCAnalyzeDashboard from './SFCAnalyzeDashboard';
import A1MarketHighlightsDashboard from './A1MarketHighlightsDashboard';
import A2MarketStructureDashboard from './A2MarketStructureDashboard';
import A3LiquidityDashboard from './A3LiquidityDashboard';
import C4LicensedRepsDashboard from './C4LicensedRepsDashboard';
import C5ResponsibleOfficersDashboard from './C5ResponsibleOfficersDashboard';
import D3FundNavDashboard from './D3FundNavDashboard';
import D4FundFlowsDashboard from './D4FundFlowsDashboard';
import SFCTablesView from './SFCTablesView';

type TabType = 'tables' | 'analyze' | 'a1-refined' | 'a2-market-structure' | 'a3-liquidity' | 'c4-licensed-reps' | 'c5-responsible-officers' | 'd3-fund-nav' | 'd4-fund-flows';

const SFCFinancialStatisticsTabs: React.FC = () => {
  const [activeTab, setActiveTab] = useState<TabType>('a1-refined');

  // Fetch all data (shared across both tabs)
  const { data: marketHighlights, isLoading: loadingA1 } = useSFCMarketHighlights(30);
  const { data: marketCapByType, isLoading: loadingA2 } = useSFCMarketCapByType();
  const { data: turnoverByType, isLoading: loadingA3 } = useSFCTurnoverByType();
  const { data: mutualFundNAV, isLoading: loadingD3 } = useSFCMutualFundNAV(100);
  const { data: licensedReps, isLoading: loadingC4 } = useSFCLicensedReps(150);
  const { data: responsibleOfficers, isLoading: loadingC5 } = useSFCResponsibleOfficers(150);
  const { data: fundFlows, isLoading: loadingD4 } = useSFCFundFlows(10);

  const isLoading = loadingA1 || loadingA2 || loadingA3 || loadingD3 || loadingC4 || loadingC5 || loadingD4;

  // Count total records
  const totalRecords = useMemo(() => {
    return (
      marketHighlights.length +
      marketCapByType.length +
      turnoverByType.length +
      mutualFundNAV.length +
      licensedReps.length +
      responsibleOfficers.length +
      fundFlows.length
    );
  }, [marketHighlights, marketCapByType, turnoverByType, mutualFundNAV, licensedReps, responsibleOfficers, fundFlows]);

  const tabs = [
    {
      id: 'a1-refined' as TabType,
      label: 'A1: Market Highlights',
      icon: <Sparkles size={18} />,
      description: 'Market cap, listings & turnover trends'
    },
    {
      id: 'a2-market-structure' as TabType,
      label: 'A2: Market Structure',
      icon: <PieChart size={18} />,
      description: 'Market cap by stock type (HSI, H-shares, Non-H)'
    },
    {
      id: 'a3-liquidity' as TabType,
      label: 'A3: Liquidity',
      icon: <Activity size={18} />,
      description: 'Turnover analysis & trading patterns'
    },
    {
      id: 'c4-licensed-reps' as TabType,
      label: 'C4: Licensed Reps',
      icon: <Users size={18} />,
      description: 'Licensed representatives by regulated activity'
    },
    {
      id: 'c5-responsible-officers' as TabType,
      label: 'C5: Responsible Officers',
      icon: <Shield size={18} />,
      description: 'RO/AO by regulated activity'
    },
    {
      id: 'd3-fund-nav' as TabType,
      label: 'D3: Fund NAV',
      icon: <DollarSign size={18} />,
      description: 'Mutual fund NAV by domicile & type'
    },
    {
      id: 'd4-fund-flows' as TabType,
      label: 'D4: Fund Flows',
      icon: <ArrowRightLeft size={18} />,
      description: 'Annual net fund flows by type'
    }
  ];

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading SFC Statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <TrendingUp size={32} />
          <h2 className="text-2xl font-bold">HK Market Insights Cockpit</h2>
        </div>
        <p className="text-blue-100">
          Hong Kong securities market data from {totalRecords.toLocaleString()} records across 7 SFC statistical tables
        </p>
        {marketHighlights.length > 0 && (
          <div className="mt-3 flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <FileText size={16} />
              <span>Latest: {marketHighlights[0].period}</span>
            </div>
            <div className="flex items-center gap-2">
              <BarChart3 size={16} />
              <span>{marketHighlights.length} years of history</span>
            </div>
          </div>
        )}
      </div>

      {/* Tab Navigation */}
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="border-b border-gray-200 dark:border-gray-700">
          <div className="flex">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-6 py-4 font-medium transition-all relative ${
                  activeTab === tab.id
                    ? 'text-blue-600 dark:text-blue-400'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
                }`}
              >
                {tab.icon}
                <div className="text-left">
                  <div className="font-semibold">{tab.label}</div>
                  <div className="text-xs opacity-75">{tab.description}</div>
                </div>
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 dark:bg-blue-400" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-6">
          {activeTab === 'a1-refined' && (
            <A1MarketHighlightsDashboard />
          )}

          {activeTab === 'a2-market-structure' && (
            <A2MarketStructureDashboard />
          )}

          {activeTab === 'a3-liquidity' && (
            <A3LiquidityDashboard />
          )}

          {activeTab === 'c4-licensed-reps' && (
            <C4LicensedRepsDashboard />
          )}

          {activeTab === 'c5-responsible-officers' && (
            <C5ResponsibleOfficersDashboard />
          )}

          {activeTab === 'd3-fund-nav' && (
            <D3FundNavDashboard />
          )}

          {activeTab === 'd4-fund-flows' && (
            <D4FundFlowsDashboard />
          )}

          {activeTab === 'analyze' && (
            <SFCAnalyzeDashboard
              marketHighlights={marketHighlights}
              marketCapByType={marketCapByType}
              mutualFundNAV={mutualFundNAV}
              licensedReps={licensedReps}
              fundFlows={fundFlows}
            />
          )}

          {activeTab === 'tables' && (
            <SFCTablesView
              marketHighlights={marketHighlights}
              marketCapByType={marketCapByType}
              turnoverByType={turnoverByType}
              mutualFundNAV={mutualFundNAV}
              licensedReps={licensedReps}
              responsibleOfficers={responsibleOfficers}
              fundFlows={fundFlows}
            />
          )}
        </div>
      </div>

      {/* Data Source Footer */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <strong>Data Source:</strong> Securities and Futures Commission of Hong Kong (SFC) •{' '}
          <strong>Total Records:</strong> {totalRecords.toLocaleString()} data points across 7 tables •{' '}
          <strong>Coverage:</strong> 1997-2025 (29 years)
        </p>
      </div>
    </div>
  );
};

export default SFCFinancialStatisticsTabs;
