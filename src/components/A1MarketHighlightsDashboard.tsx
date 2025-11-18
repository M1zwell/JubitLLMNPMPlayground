/**
 * A1 Market Highlights - Refined Dashboard with Filtering
 *
 * Features:
 * - Latest quarterly data (2025 Q3) in KPIs
 * - Year range filtering
 * - Chart/Table view toggle
 * - 4 interactive charts
 */

import React, { useMemo, useState } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, TrendingDown, DollarSign, BarChart3, Building2, PieChart,
  Filter, Calendar, TableIcon, BarChartIcon, Download
} from 'lucide-react';
import {
  useA1MarketHighlights,
  useA1QuarterlyData,
  A1MarketHighlight
} from '../hooks/useSFCStatistics';

const A1MarketHighlightsDashboard: React.FC = () => {
  const { data: annualData, isLoading: isLoadingAnnual } = useA1MarketHighlights(50);
  const { data: quarterlyData, isLoading: isLoadingQuarterly } = useA1QuarterlyData(20);

  // View state
  const [viewMode, setViewMode] = useState<'charts' | 'table'>('charts');
  const [yearRange, setYearRange] = useState<{ start: number; end: number }>({ start: 1997, end: 2025 });
  const [showGEM, setShowGEM] = useState(true);

  // Get latest quarterly data for KPIs
  const latestQuarterly = useMemo(() => {
    if (!quarterlyData || quarterlyData.length === 0) return null;

    // Sort by year and quarter descending
    const sorted = [...quarterlyData].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return (b.quarter || 0) - (a.quarter || 0);
    });

    return sorted[0];
  }, [quarterlyData]);

  // Calculate KPIs from latest quarterly data
  const latestKPIs = useMemo(() => {
    if (!latestQuarterly) return null;

    const mainCap = latestQuarterly.main_mktcap_hkbn || 0;
    const gemCap = latestQuarterly.gem_mktcap_hkbn || 0;
    const totalCap = mainCap + gemCap;

    // Find previous quarter for QoQ comparison
    const prevQuarter = quarterlyData?.find(q => {
      if (latestQuarterly.quarter === 1) {
        return q.year === latestQuarterly.year - 1 && q.quarter === 4;
      } else {
        return q.year === latestQuarterly.year && q.quarter === (latestQuarterly.quarter || 1) - 1;
      }
    });

    let qoqCapChange = null;
    let qoqTurnoverChange = null;
    let qoqListingsChange = null;

    if (prevQuarter) {
      const prevCap = (prevQuarter.main_mktcap_hkbn || 0) + (prevQuarter.gem_mktcap_hkbn || 0);
      const prevTurnover = prevQuarter.main_turnover_hkmm || 0;
      const prevListings = (prevQuarter.main_listed || 0) + (prevQuarter.gem_listed || 0);

      if (prevCap > 0) qoqCapChange = ((totalCap - prevCap) / prevCap) * 100;
      if (prevTurnover > 0) qoqTurnoverChange = (((latestQuarterly.main_turnover_hkmm || 0) - prevTurnover) / prevTurnover) * 100;
      const currentListings = (latestQuarterly.main_listed || 0) + (latestQuarterly.gem_listed || 0);
      if (prevListings > 0) qoqListingsChange = ((currentListings - prevListings) / prevListings) * 100;
    }

    return {
      period: `${latestQuarterly.year} Q${latestQuarterly.quarter}`,
      mainListings: latestQuarterly.main_listed || 0,
      gemListings: latestQuarterly.gem_listed || 0,
      totalListings: (latestQuarterly.main_listed || 0) + (latestQuarterly.gem_listed || 0),
      mainMarketCap: mainCap,
      gemMarketCap: gemCap,
      totalMarketCap: totalCap,
      mainTurnover: latestQuarterly.main_turnover_hkmm || 0,
      gemTurnover: latestQuarterly.gem_turnover_hkmm || 0,
      gemMarketShare: totalCap > 0 ? (gemCap / totalCap) * 100 : 0,
      tradingDays: latestQuarterly.trading_days || 0,
      qoqCapChange,
      qoqTurnoverChange,
      qoqListingsChange
    };
  }, [latestQuarterly, quarterlyData]);

  // Filter annual data by year range
  const filteredAnnualData = useMemo(() => {
    if (!annualData) return [];
    return annualData.filter(d => d.year >= yearRange.start && d.year <= yearRange.end);
  }, [annualData, yearRange]);

  // Chart 1: Market Cap Trend
  const marketCapTrendData = useMemo(() => {
    return filteredAnnualData
      .map(d => ({
        year: d.year,
        mainCap: d.main_mktcap_hkbn || 0,
        gemCap: showGEM ? (d.gem_mktcap_hkbn || 0) : undefined,
        totalCap: (d.main_mktcap_hkbn || 0) + (d.gem_mktcap_hkbn || 0),
      }))
      .reverse();
  }, [filteredAnnualData, showGEM]);

  // Chart 2: Turnover Trend
  const turnoverTrendData = useMemo(() => {
    return filteredAnnualData
      .map(d => ({
        year: d.year,
        mainTurnover: d.main_turnover_hkmm || 0,
        gemTurnover: showGEM ? (d.gem_turnover_hkmm || 0) : undefined,
      }))
      .reverse();
  }, [filteredAnnualData, showGEM]);

  // Chart 3: Listed Companies
  const listedCompaniesData = useMemo(() => {
    return filteredAnnualData
      .map(d => ({
        year: d.year,
        mainListed: d.main_listed || 0,
        gemListed: showGEM ? (d.gem_listed || 0) : undefined,
        total: (d.main_listed || 0) + (d.gem_listed || 0),
      }))
      .reverse();
  }, [filteredAnnualData, showGEM]);

  // Chart 4: Quarterly Turnover (all available quarters)
  const quarterlyTurnoverData = useMemo(() => {
    if (!quarterlyData || quarterlyData.length === 0) return [];
    return quarterlyData
      .map(d => ({
        quarter: `${d.year} Q${d.quarter}`,
        year: d.year,
        q: d.quarter,
        mainTurnover: d.main_turnover_hkmm || 0,
        gemTurnover: showGEM ? (d.gem_turnover_hkmm || 0) : undefined,
      }))
      .sort((a, b) => {
        if (a.year !== b.year) return a.year - b.year;
        return (a.q || 0) - (b.q || 0);
      });
  }, [quarterlyData, showGEM]);

  // Combined data for table view
  const tableData = useMemo(() => {
    const annual = filteredAnnualData.map(d => ({ ...d, displayPeriod: String(d.year) }));
    const quarterly = quarterlyData
      ?.filter(d => d.year >= yearRange.start && d.year <= yearRange.end)
      .map(d => ({ ...d, displayPeriod: `${d.year} Q${d.quarter}` })) || [];

    return [...annual, ...quarterly].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return (b.quarter || 0) - (a.quarter || 0);
    });
  }, [filteredAnnualData, quarterlyData, yearRange]);

  // Format helpers
  const formatBillions = (value: number) => {
    if (value >= 1000) return `${(value / 1000).toFixed(1)}T`;
    return `${value.toFixed(1)}B`;
  };

  const formatMillions = (value: number) => {
    if (value >= 1000) return `${(value / 1000).toFixed(1)}B`;
    return `${value.toFixed(0)}M`;
  };

  const formatPercent = (value: number | null) => {
    if (value === null) return 'N/A';
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const downloadCSV = () => {
    const headers = ['Period', 'Type', 'Year', 'Quarter', 'Main Listed', 'Main Mkt Cap (HK$bn)', 'Main Turnover (HK$m)',
                     'GEM Listed', 'GEM Mkt Cap (HK$bn)', 'GEM Turnover (HK$m)', 'Trading Days'];
    const rows = tableData.map(d => [
      d.displayPeriod,
      d.period_type,
      d.year,
      d.quarter || '',
      d.main_listed || '',
      d.main_mktcap_hkbn || '',
      d.main_turnover_hkmm || '',
      d.gem_listed || '',
      d.gem_mktcap_hkbn || '',
      d.gem_turnover_hkmm || '',
      d.trading_days || ''
    ]);

    const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `a1_market_highlights_${yearRange.start}-${yearRange.end}.csv`;
    a.click();
  };

  const isLoading = isLoadingAnnual || isLoadingQuarterly;

  if (isLoading) {
    return (
      <div className="space-y-6 p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Controls */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
            A1 Market Highlights
          </h2>
          {latestKPIs && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Latest data: <span className="font-semibold text-blue-600">{latestKPIs.period}</span>
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Year Range Filter */}
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <select
              value={yearRange.start}
              onChange={(e) => setYearRange({ ...yearRange, start: parseInt(e.target.value) })}
              className="bg-transparent text-sm border-none focus:outline-none cursor-pointer"
            >
              {[1997, 2000, 2005, 2010, 2015, 2020].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <span className="text-gray-500">-</span>
            <select
              value={yearRange.end}
              onChange={(e) => setYearRange({ ...yearRange, end: parseInt(e.target.value) })}
              className="bg-transparent text-sm border-none focus:outline-none cursor-pointer"
            >
              {[2020, 2021, 2022, 2023, 2024, 2025].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* GEM Toggle */}
          <button
            onClick={() => setShowGEM(!showGEM)}
            className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
              showGEM
                ? 'bg-orange-100 text-orange-700 border border-orange-300'
                : 'bg-gray-100 text-gray-600 border border-gray-300'
            }`}
          >
            <Filter className="w-4 h-4" />
            {showGEM ? 'Hide GEM' : 'Show GEM'}
          </button>

          {/* View Toggle */}
          <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => setViewMode('charts')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'charts'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <BarChartIcon className="w-4 h-4" />
              Charts
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm'
                  : 'text-gray-600 dark:text-gray-400'
              }`}
            >
              <TableIcon className="w-4 h-4" />
              Table
            </button>
          </div>

          {/* Download CSV */}
          {viewMode === 'table' && (
            <button
              onClick={downloadCSV}
              className="flex items-center gap-2 px-3 py-2 bg-green-100 text-green-700 border border-green-300 rounded-lg text-sm font-medium hover:bg-green-200 transition-colors"
            >
              <Download className="w-4 h-4" />
              CSV
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards - Latest Quarterly Data */}
      {latestKPIs && viewMode === 'charts' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* KPI 1: Total Market Cap */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 border border-blue-200 dark:border-blue-700 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <DollarSign className="w-5 h-5" />
                <span className="text-sm font-medium">Total Market Cap</span>
              </div>
              {latestKPIs.qoqCapChange !== null && (
                <div className={`flex items-center text-xs ${latestKPIs.qoqCapChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {latestKPIs.qoqCapChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span className="ml-1">{formatPercent(latestKPIs.qoqCapChange)} QoQ</span>
                </div>
              )}
            </div>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              HK${formatBillions(latestKPIs.totalMarketCap)}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
              Main: ${formatBillions(latestKPIs.mainMarketCap)} | GEM: ${formatBillions(latestKPIs.gemMarketCap)}
            </div>
          </div>

          {/* KPI 2: Average Daily Turnover */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 border border-purple-200 dark:border-purple-700 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                <BarChart3 className="w-5 h-5" />
                <span className="text-sm font-medium">Avg Daily Turnover</span>
              </div>
              {latestKPIs.qoqTurnoverChange !== null && (
                <div className={`flex items-center text-xs ${latestKPIs.qoqTurnoverChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {latestKPIs.qoqTurnoverChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span className="ml-1">{formatPercent(latestKPIs.qoqTurnoverChange)} QoQ</span>
                </div>
              )}
            </div>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              HK${formatMillions(latestKPIs.mainTurnover)}
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400 mt-1">
              {latestKPIs.tradingDays} trading days in {latestKPIs.period}
            </div>
          </div>

          {/* KPI 3: Total Listings */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 border border-green-200 dark:border-green-700 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-green-700 dark:text-green-300">
                <Building2 className="w-5 h-5" />
                <span className="text-sm font-medium">Total Listings</span>
              </div>
              {latestKPIs.qoqListingsChange !== null && (
                <div className={`flex items-center text-xs ${latestKPIs.qoqListingsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {latestKPIs.qoqListingsChange >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                  <span className="ml-1">{formatPercent(latestKPIs.qoqListingsChange)} QoQ</span>
                </div>
              )}
            </div>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {latestKPIs.totalListings.toLocaleString()}
            </div>
            <div className="text-xs text-green-600 dark:text-green-400 mt-1">
              Main: {latestKPIs.mainListings.toLocaleString()} | GEM: {latestKPIs.gemListings.toLocaleString()}
            </div>
          </div>

          {/* KPI 4: GEM Market Share */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 border border-orange-200 dark:border-orange-700 rounded-lg p-4 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2 text-orange-700 dark:text-orange-300">
                <PieChart className="w-5 h-5" />
                <span className="text-sm font-medium">GEM Market Share</span>
              </div>
            </div>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              {latestKPIs.gemMarketShare.toFixed(2)}%
            </div>
            <div className="text-xs text-orange-600 dark:text-orange-400 mt-1">
              of total market capitalisation
            </div>
          </div>
        </div>
      )}

      {/* Charts View */}
      {viewMode === 'charts' && (
        <div className="space-y-6">
          {/* Chart 1: Market Cap Trend */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Market Capitalisation Trend ({yearRange.start} - {yearRange.end})
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={marketCapTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="year" stroke="#6b7280" />
                <YAxis stroke="#6b7280" label={{ value: 'HK$ Billions', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  formatter={(value: number) => `HK$${formatBillions(value)}`}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Legend />
                <Line type="monotone" dataKey="totalCap" stroke="#3b82f6" strokeWidth={2} name="Total Market Cap" dot={false} />
                <Line type="monotone" dataKey="mainCap" stroke="#8b5cf6" strokeWidth={2} name="Main Board" dot={false} />
                {showGEM && <Line type="monotone" dataKey="gemCap" stroke="#f59e0b" strokeWidth={1} name="GEM" dot={false} />}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 2: Turnover Trend */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Average Daily Turnover Evolution ({yearRange.start} - {yearRange.end})
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={turnoverTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="year" stroke="#6b7280" />
                <YAxis stroke="#6b7280" label={{ value: 'HK$ Millions', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  formatter={(value: number) => `HK$${formatMillions(value)}`}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Legend />
                <Line type="monotone" dataKey="mainTurnover" stroke="#8b5cf6" strokeWidth={2} name="Main Board" dot={false} />
                {showGEM && <Line type="monotone" dataKey="gemTurnover" stroke="#f59e0b" strokeWidth={1} name="GEM" dot={false} />}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 3: Listed Companies */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Number of Listed Companies ({yearRange.start} - {yearRange.end})
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={listedCompaniesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="year" stroke="#6b7280" />
                <YAxis stroke="#6b7280" label={{ value: 'Number of Companies', angle: -90, position: 'insideLeft' }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} name="Total" dot={false} />
                <Line type="monotone" dataKey="mainListed" stroke="#8b5cf6" strokeWidth={2} name="Main Board" dot={false} />
                {showGEM && <Line type="monotone" dataKey="gemListed" stroke="#f59e0b" strokeWidth={2} name="GEM" dot={false} />}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 4: Quarterly Turnover */}
          {quarterlyTurnoverData.length > 0 && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                Quarterly Average Daily Turnover (All Available Quarters)
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={quarterlyTurnoverData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="quarter" stroke="#6b7280" angle={-45} textAnchor="end" height={80} />
                  <YAxis stroke="#6b7280" label={{ value: 'HK$ Millions', angle: -90, position: 'insideLeft' }} />
                  <Tooltip
                    formatter={(value: number) => `HK$${formatMillions(value)}`}
                    contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                  />
                  <Legend />
                  <Line type="monotone" dataKey="mainTurnover" stroke="#8b5cf6" strokeWidth={2} name="Main Board" />
                  {showGEM && <Line type="monotone" dataKey="gemTurnover" stroke="#f59e0b" strokeWidth={1} name="GEM" />}
                </LineChart>
              </ResponsiveContainer>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-4">
                <strong>Latest:</strong> {latestKPIs?.period} shows {latestKPIs?.qoqTurnoverChange && latestKPIs.qoqTurnoverChange >= 0 ? 'increasing' : 'decreasing'} market liquidity
              </p>
            </div>
          )}
        </div>
      )}

      {/* Table View */}
      {viewMode === 'table' && (
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Period</th>
                  <th className="px-4 py-3 text-left font-semibold text-gray-700 dark:text-gray-300">Type</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Main Listed</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Main Mkt Cap (HK$bn)</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Main Turnover (HK$m)</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">GEM Listed</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">GEM Mkt Cap (HK$bn)</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">GEM Turnover (HK$m)</th>
                  <th className="px-4 py-3 text-right font-semibold text-gray-700 dark:text-gray-300">Trading Days</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {tableData.map((row, idx) => (
                  <tr key={`${row.year}-${row.quarter || 'annual'}`} className={idx === 0 ? 'bg-blue-50 dark:bg-blue-900/20' : 'hover:bg-gray-50 dark:hover:bg-gray-700/50'}>
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{row.displayPeriod}</td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-400">
                      <span className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                        row.period_type === 'quarter'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {row.period_type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{row.main_listed?.toLocaleString() || '-'}</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{row.main_mktcap_hkbn?.toLocaleString() || '-'}</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{row.main_turnover_hkmm?.toLocaleString() || '-'}</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{row.gem_listed?.toLocaleString() || '-'}</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{row.gem_mktcap_hkbn?.toLocaleString() || '-'}</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{row.gem_turnover_hkmm?.toLocaleString() || '-'}</td>
                    <td className="px-4 py-3 text-right text-gray-900 dark:text-white">{row.trading_days || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Data Source Footer */}
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-400">
        <strong>Data Source:</strong> SFC Table A1 - Highlights of Hong Kong Stock Market |
        <strong className="ml-2">Schema:</strong> Normalized a1_market_highlights table |
        <strong className="ml-2">Coverage:</strong> {annualData.length} annual records (1997-2024) + {quarterlyData.length} quarterly records (2023-2025 Q3)
      </div>
    </div>
  );
};

export default A1MarketHighlightsDashboard;
