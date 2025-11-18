/**
 * HKSFC Statistics Viewer Component
 * Displays SFC market statistics with charts and tables
 */

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Building2,
  PieChart,
  BarChart3,
  Calendar,
  Download,
  FileSpreadsheet,
  Loader2,
  AlertCircle,
  RefreshCw
} from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface MarketHighlight {
  period: string;
  period_type: string;
  market_cap?: number;
  turnover?: number;
  total_listings?: number;
  new_listings?: number;
  funds_raised?: number;
  main_board_cap?: number;
  gem_cap?: number;
}

interface MarketCapByType {
  period: string;
  period_type: string;
  stock_type: string;
  market_cap?: number;
  percentage?: number;
  number_of_companies?: number;
}

interface FundFlow {
  period: string;
  period_type: string;
  fund_category: string;
  subscriptions?: number;
  redemptions?: number;
  net_flow?: number;
}

type TabType = 'market' | 'licensees' | 'funds';
type PeriodType = 'monthly' | 'quarterly' | 'annual';

export default function HKSFCStatisticsViewer() {
  const [activeTab, setActiveTab] = useState<TabType>('market');
  const [periodType, setPeriodType] = useState<PeriodType>('quarterly');
  const [selectedPeriod, setSelectedPeriod] = useState<string>('');

  const [marketHighlights, setMarketHighlights] = useState<MarketHighlight[]>([]);
  const [marketCapByType, setMarketCapByType] = useState<MarketCapByType[]>([]);
  const [fundFlows, setFundFlows] = useState<FundFlow[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [syncMessage, setSyncMessage] = useState<string | null>(null);

  // Fetch market highlights
  const fetchMarketHighlights = async () => {
    try {
      const { data, error } = await supabase
        .from('sfc_market_highlights')
        .select('*')
        .eq('period_type', periodType)
        .order('period', { ascending: false })
        .limit(12);

      if (error) throw error;
      setMarketHighlights(data || []);

      if (data && data.length > 0 && !selectedPeriod) {
        setSelectedPeriod(data[0].period);
      }
    } catch (err: any) {
      console.error('Error fetching market highlights:', err);
    }
  };

  // Fetch market cap by type
  const fetchMarketCapByType = async () => {
    if (!selectedPeriod) return;

    try {
      const { data, error } = await supabase
        .from('sfc_market_cap_by_type')
        .select('*')
        .eq('period', selectedPeriod)
        .eq('period_type', periodType)
        .order('market_cap', { ascending: false });

      if (error) throw error;
      setMarketCapByType(data || []);
    } catch (err: any) {
      console.error('Error fetching market cap by type:', err);
    }
  };

  // Fetch fund flows
  const fetchFundFlows = async () => {
    try {
      const { data, error } = await supabase
        .from('sfc_fund_flows')
        .select('*')
        .eq('period_type', periodType)
        .order('period', { ascending: false })
        .limit(12);

      if (error) throw error;
      setFundFlows(data || []);
    } catch (err: any) {
      console.error('Error fetching fund flows:', err);
    }
  };

  // Load all data
  const loadData = async () => {
    setIsLoading(true);
    setError(null);

    try {
      await Promise.all([
        fetchMarketHighlights(),
        fetchMarketCapByType(),
        fetchFundFlows()
      ]);
    } catch (err: any) {
      setError(err.message || 'Failed to load statistics');
    } finally {
      setIsLoading(false);
    }
  };

  // Sync statistics from SFC
  const syncStatistics = async () => {
    setIsSyncing(true);
    setSyncMessage(null);

    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/sfc-statistics-sync`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({})
      });

      const result = await response.json();

      if (result.success) {
        setSyncMessage(`✅ Synced ${result.stats?.totalRecords || 0} records from ${result.stats?.tablesProcessed || 0} tables`);
        await loadData();
      } else {
        throw new Error(result.error || 'Sync failed');
      }
    } catch (err: any) {
      setSyncMessage(`❌ Sync failed: ${err.message}`);
      console.error('Sync error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  // Export to CSV
  const exportToCSV = () => {
    let csvData: any[] = [];
    let filename = '';

    if (activeTab === 'market') {
      csvData = marketHighlights;
      filename = `sfc_market_highlights_${periodType}.csv`;
    } else if (activeTab === 'funds') {
      csvData = fundFlows;
      filename = `sfc_fund_flows_${periodType}.csv`;
    }

    if (csvData.length === 0) return;

    const headers = Object.keys(csvData[0]);
    const csvRows = [headers.join(',')];

    csvData.forEach(row => {
      const values = headers.map(header => {
        const value = row[header] !== null && row[header] !== undefined ? row[header] : '';
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      });
      csvRows.push(values.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  // Format numbers
  const formatNumber = (num?: number, decimals: number = 2): string => {
    if (num === null || num === undefined) return 'N/A';
    return num.toLocaleString('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });
  };

  // Load data on mount and when dependencies change
  useEffect(() => {
    loadData();
  }, [periodType, selectedPeriod]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <BarChart3 size={36} />
              SFC Market Statistics
            </h2>
            <p className="text-blue-100 text-lg">
              Hong Kong securities and funds market data
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={syncStatistics}
              disabled={isSyncing}
              className="px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center gap-2"
            >
              {isSyncing ? (
                <>
                  <Loader2 className="animate-spin" size={20} />
                  Syncing...
                </>
              ) : (
                <>
                  <RefreshCw size={20} />
                  Sync Data
                </>
              )}
            </button>
            <button
              onClick={exportToCSV}
              className="px-6 py-3 bg-green-500 text-white rounded-xl font-semibold shadow-lg hover:shadow-xl hover:bg-green-600 transition-all flex items-center gap-2"
            >
              <FileSpreadsheet size={20} />
              Export CSV
            </button>
          </div>
        </div>

        {/* Sync Message */}
        {syncMessage && (
          <div className="mt-4 px-4 py-3 bg-white/20 backdrop-blur-sm rounded-xl text-white font-medium">
            {syncMessage}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-2xl shadow-lg p-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('market')}
            className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
              activeTab === 'market'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <TrendingUp className="inline mr-2" size={20} />
            Market Statistics
          </button>
          <button
            onClick={() => setActiveTab('licensees')}
            className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
              activeTab === 'licensees'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <Building2 className="inline mr-2" size={20} />
            Licensees
          </button>
          <button
            onClick={() => setActiveTab('funds')}
            className={`flex-1 py-3 px-6 rounded-xl font-semibold transition-all ${
              activeTab === 'funds'
                ? 'bg-blue-500 text-white shadow-lg'
                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
            }`}
          >
            <PieChart className="inline mr-2" size={20} />
            Funds
          </button>
        </div>
      </div>

      {/* Period Type Selector */}
      <div className="bg-white rounded-2xl shadow-lg p-6">
        <div className="flex items-center gap-4">
          <Calendar className="text-gray-600" size={24} />
          <span className="text-gray-700 font-semibold">Period:</span>
          <div className="flex gap-2">
            <button
              onClick={() => setPeriodType('monthly')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                periodType === 'monthly'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setPeriodType('quarterly')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                periodType === 'quarterly'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Quarterly
            </button>
            <button
              onClick={() => setPeriodType('annual')}
              className={`px-4 py-2 rounded-lg font-semibold transition-all ${
                periodType === 'annual'
                  ? 'bg-blue-500 text-white shadow-md'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Annual
            </button>
          </div>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-3">
          <AlertCircle className="text-red-500" size={24} />
          <p className="text-red-700 font-semibold">{error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-12 flex flex-col items-center justify-center gap-3">
          <Loader2 className="animate-spin text-blue-500" size={48} />
          <p className="text-blue-700 font-semibold text-lg">Loading statistics...</p>
        </div>
      )}

      {/* Content */}
      {!isLoading && !error && (
        <>
          {/* Market Statistics Tab */}
          {activeTab === 'market' && (
            <div className="space-y-6">
              {/* Key Metrics Cards */}
              {marketHighlights.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Market Cap */}
                  <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 shadow-lg text-white">
                    <div className="flex items-center justify-between mb-2">
                      <DollarSign size={32} />
                      <span className="text-blue-100 text-sm font-semibold">{marketHighlights[0].period}</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-1">Market Cap</h3>
                    <p className="text-3xl font-bold">{formatNumber(marketHighlights[0].market_cap, 0)} B</p>
                    <p className="text-blue-100 text-sm mt-1">HK$</p>
                  </div>

                  {/* Turnover */}
                  <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-2xl p-6 shadow-lg text-white">
                    <div className="flex items-center justify-between mb-2">
                      <TrendingUp size={32} />
                      <span className="text-green-100 text-sm font-semibold">{marketHighlights[0].period}</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-1">Avg Daily Turnover</h3>
                    <p className="text-3xl font-bold">{formatNumber(marketHighlights[0].turnover, 1)} B</p>
                    <p className="text-green-100 text-sm mt-1">HK$</p>
                  </div>

                  {/* Total Listings */}
                  <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-2xl p-6 shadow-lg text-white">
                    <div className="flex items-center justify-between mb-2">
                      <Building2 size={32} />
                      <span className="text-purple-100 text-sm font-semibold">{marketHighlights[0].period}</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-1">Total Listings</h3>
                    <p className="text-3xl font-bold">{formatNumber(marketHighlights[0].total_listings, 0)}</p>
                    <p className="text-purple-100 text-sm mt-1">Companies</p>
                  </div>

                  {/* Funds Raised */}
                  <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-2xl p-6 shadow-lg text-white">
                    <div className="flex items-center justify-between mb-2">
                      <TrendingUp size={32} />
                      <span className="text-orange-100 text-sm font-semibold">{marketHighlights[0].period}</span>
                    </div>
                    <h3 className="text-lg font-semibold mb-1">Funds Raised</h3>
                    <p className="text-3xl font-bold">{formatNumber(marketHighlights[0].funds_raised, 1)} B</p>
                    <p className="text-orange-100 text-sm mt-1">HK$</p>
                  </div>
                </div>
              )}

              {/* Market Highlights Table */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-gray-800">Market Highlights - Historical Data</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-gray-100">
                        <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Period</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Market Cap (HK$B)</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Turnover (HK$B)</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Listings</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">New Listings</th>
                        <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Funds Raised (HK$B)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {marketHighlights.map((row, idx) => (
                        <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-semibold text-gray-800">{row.period}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-700">{formatNumber(row.market_cap, 0)}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-700">{formatNumber(row.turnover, 2)}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-700">{formatNumber(row.total_listings, 0)}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-700">{formatNumber(row.new_listings, 0)}</td>
                          <td className="px-4 py-3 text-sm text-right text-gray-700">{formatNumber(row.funds_raised, 2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Market Cap by Type */}
              {marketCapByType.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-xl font-bold mb-4 text-gray-800">
                    Market Capitalisation by Stock Type - {selectedPeriod}
                  </h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Stock Type</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Market Cap (HK$B)</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Percentage</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Companies</th>
                        </tr>
                      </thead>
                      <tbody>
                        {marketCapByType.map((row, idx) => (
                          <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-semibold text-gray-800">{row.stock_type}</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-700">{formatNumber(row.market_cap, 2)}</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-700">{formatNumber(row.percentage, 1)}%</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-700">{formatNumber(row.number_of_companies, 0)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Licensees Tab */}
          {activeTab === 'licensees' && (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <Building2 className="mx-auto text-gray-400 mb-4" size={64} />
              <p className="text-gray-600 text-lg font-medium mb-2">Licensee Statistics Coming Soon</p>
              <p className="text-gray-500 text-sm">Tables C4 and C5 data will be displayed here</p>
            </div>
          )}

          {/* Funds Tab */}
          {activeTab === 'funds' && (
            <div className="space-y-6">
              {/* Fund Flows Table */}
              {fundFlows.length > 0 && (
                <div className="bg-white rounded-2xl shadow-lg p-6">
                  <h3 className="text-xl font-bold mb-4 text-gray-800">Fund Flows - Historical Data</h3>
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="bg-gray-100">
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Period</th>
                          <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Category</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Subscriptions (HK$B)</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Redemptions (HK$B)</th>
                          <th className="px-4 py-3 text-right text-sm font-semibold text-gray-700">Net Flow (HK$B)</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fundFlows.map((row, idx) => (
                          <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm font-semibold text-gray-800">{row.period}</td>
                            <td className="px-4 py-3 text-sm text-gray-700">{row.fund_category}</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-700">{formatNumber(row.subscriptions, 2)}</td>
                            <td className="px-4 py-3 text-sm text-right text-gray-700">{formatNumber(row.redemptions, 2)}</td>
                            <td className={`px-4 py-3 text-sm text-right font-semibold ${
                              (row.net_flow || 0) >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              {formatNumber(row.net_flow, 2)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* No Data Message */}
          {marketHighlights.length === 0 && activeTab === 'market' && (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <BarChart3 className="mx-auto text-gray-400 mb-4" size={64} />
              <p className="text-gray-600 text-lg font-medium mb-2">No statistics data available</p>
              <p className="text-gray-500 text-sm mb-4">Click "Sync Data" to download latest statistics from SFC</p>
              <button
                onClick={syncStatistics}
                disabled={isSyncing}
                className="mt-4 px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50"
              >
                <RefreshCw className="inline mr-2" size={20} />
                Sync Data Now
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
