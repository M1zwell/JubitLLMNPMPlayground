/**
 * CCASS Holdings Viewer Component
 * Display and filter HKEX CCASS shareholding data
 */

import React, { useState, useMemo, useEffect } from 'react';
import { useCCASSData, getStockStatistics, getStockCodes, type CCassHolding } from '../hooks/useCCASSData';
import {
  Search,
  Download,
  FileJson,
  FileSpreadsheet,
  TrendingUp,
  Building2,
  BarChart3,
  Loader2,
  AlertCircle,
  Info,
  Calendar
} from 'lucide-react';

export default function CCASSViewer() {
  const [stockCode, setStockCode] = useState('');
  const [participant, setParticipant] = useState('');
  const [minPercentage, setMinPercentage] = useState<number | undefined>(undefined);
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [limit, setLimit] = useState(500);
  const [availableStocks, setAvailableStocks] = useState<string[]>([]);

  // Load available stock codes
  useEffect(() => {
    getStockCodes().then(setAvailableStocks);
  }, []);

  const { data, isLoading, error, totalRecords, reload } = useCCASSData({
    stockCode: stockCode || undefined,
    participant: participant || undefined,
    minPercentage,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
    limit
  });

  const [showStats, setShowStats] = useState(false);
  const [stats, setStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const loadStatistics = async () => {
    setLoadingStats(true);
    try {
      const stockStats = await getStockStatistics(stockCode);
      setStats(stockStats);
      setShowStats(true);
    } catch (err) {
      console.error('Error loading statistics:', err);
    } finally {
      setLoadingStats(false);
    }
  };

  const formatNumber = (num: string | number) => {
    const n = typeof num === 'string' ? parseInt(num) : num;
    return n.toLocaleString();
  };

  const exportToJSON = () => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ccass-${stockCode}-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const exportToCSV = () => {
    const headers = ['Stock Code', 'Participant ID', 'Participant Name', 'Shareholding', 'Percentage (%)', 'Scraped At'];
    const rows = data.map(h => [
      h.stock_code,
      h.participant_id,
      h.participant_name,
      h.shareholding.toString(),
      h.percentage.toString(),
      h.scraped_at
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    const dataBlob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ccass-${stockCode}-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Building2 className="text-blue-500" />
              HKEX CCASS Holdings Viewer
            </h2>
            <p className="text-gray-600 mt-1">View and analyze CCASS participant shareholding data</p>
          </div>
          <button
            onClick={reload}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 flex items-center gap-2"
          >
            <Search size={16} />
            Refresh
          </button>
        </div>

        {/* Primary Filters - Stock and Date Range */}
        <div className="p-3 bg-blue-50 rounded-lg border-2 border-blue-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-semibold text-blue-700 mb-1.5 flex items-center gap-1">
                <Building2 size={14} />
                Stock Code
              </label>
              <select
                value={stockCode}
                onChange={(e) => setStockCode(e.target.value)}
                className="w-full px-3 py-2 text-sm font-medium border-2 border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              >
                <option value="">All Stocks ({availableStocks.length})</option>
                {availableStocks.map(code => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-semibold text-blue-700 mb-1.5 flex items-center gap-1">
                <Calendar size={14} />
                Date From
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full px-3 py-2 text-sm font-medium border-2 border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-blue-700 mb-1.5 flex items-center gap-1">
                <Calendar size={14} />
                Date To
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full px-3 py-2 text-sm font-medium border-2 border-blue-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Secondary Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Participant Filter
            </label>
            <input
              type="text"
              value={participant}
              onChange={(e) => setParticipant(e.target.value)}
              placeholder="ID or Name"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Min Percentage (%)
            </label>
            <input
              type="number"
              value={minPercentage || ''}
              onChange={(e) => setMinPercentage(e.target.value ? parseFloat(e.target.value) : undefined)}
              placeholder="e.g., 1.0"
              step="0.1"
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 placeholder-gray-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">
              Limit
            </label>
            <select
              value={limit}
              onChange={(e) => setLimit(parseInt(e.target.value))}
              className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 font-medium"
            >
              <option value={100}>100</option>
              <option value={200}>200</option>
              <option value={500}>500</option>
              <option value={1000}>1000</option>
            </select>
          </div>
        </div>

        {/* Statistics Button */}
        <div className="mt-4 flex gap-2">
          <button
            onClick={loadStatistics}
            disabled={loadingStats}
            className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 flex items-center gap-2 disabled:bg-gray-400"
          >
            {loadingStats ? <Loader2 size={16} className="animate-spin" /> : <BarChart3 size={16} />}
            View Statistics
          </button>

          <button
            onClick={exportToJSON}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 flex items-center gap-2"
          >
            <FileJson size={16} />
            Export JSON
          </button>

          <button
            onClick={exportToCSV}
            className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 flex items-center gap-2"
          >
            <FileSpreadsheet size={16} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Statistics Panel */}
      {showStats && stats && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-md p-6">
          <h3 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
            <TrendingUp className="text-blue-500" />
            {stats.stockName || stats.stockCode} Statistics
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-white rounded-lg p-4 shadow">
              <p className="text-sm text-gray-600">Total Shares</p>
              <p className="text-2xl font-bold text-blue-600">{formatNumber(stats.totalShares)}</p>
            </div>

            <div className="bg-white rounded-lg p-4 shadow">
              <p className="text-sm text-gray-600">Total Participants</p>
              <p className="text-2xl font-bold text-green-600">{formatNumber(stats.totalParticipants)}</p>
            </div>

            <div className="bg-white rounded-lg p-4 shadow">
              <p className="text-sm text-gray-600">Top 5 Concentration</p>
              <p className="text-2xl font-bold text-purple-600">{stats.top5Percentage}%</p>
            </div>

            <div className="bg-white rounded-lg p-4 shadow">
              <p className="text-sm text-gray-600">Data Source</p>
              <p className="text-lg font-semibold text-gray-700">HKEX CCASS</p>
            </div>
          </div>

          {/* Top 5 Shareholders */}
          <div className="bg-white rounded-lg p-4 shadow">
            <h4 className="font-semibold text-gray-900 mb-3">Top 5 Shareholders</h4>
            <div className="space-y-2">
              {stats.top5Shareholders.map((sh: CCassHolding, idx: number) => (
                <div key={sh.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-500">#{idx + 1}</span>
                    <div>
                      <p className="font-medium text-gray-900">{sh.participant_name}</p>
                      <p className="text-xs text-gray-500">{sh.participant_id}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-blue-600">{formatNumber(sh.shareholding)}</p>
                    <p className="text-xs text-gray-500">{sh.percentage}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="text-red-500" size={20} />
          <p className="text-red-700">Error: {error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 flex items-center justify-center gap-2">
          <Loader2 className="animate-spin text-blue-500" size={20} />
          <p className="text-blue-700">Loading CCASS data...</p>
        </div>
      )}

      {/* Data Table */}
      {!isLoading && !error && (
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-gray-900">
                Holdings Data
              </h3>
              <p className="text-sm text-gray-600">
                Showing {data.length} of {totalRecords} total records
              </p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shareholding Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participant ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Participant Name
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Shareholding
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Percentage
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {data.map((holding, index) => (
                  <tr key={holding.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {index + 1}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono font-semibold text-blue-700">
                      {holding.stock_code}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-semibold">
                      {holding.shareholding_date || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-mono">
                      {holding.participant_id}
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900">
                      {holding.participant_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-blue-600">
                      {formatNumber(holding.shareholding)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-semibold text-purple-600">
                      {holding.percentage}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {data.length === 0 && (
            <div className="text-center py-12">
              <Info className="mx-auto text-gray-400 mb-2" size={48} />
              <p className="text-gray-500">No CCASS holdings data found</p>
              <p className="text-sm text-gray-400 mt-1">Try adjusting your filters or scrape new data</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
