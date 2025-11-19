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
  Filter, Calendar, BarChartIcon
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

  // Filter quarterly data by year range
  const filteredQuarterlyData = useMemo(() => {
    if (!quarterlyData) return [];
    return quarterlyData.filter(d => d.year >= yearRange.start && d.year <= yearRange.end);
  }, [quarterlyData, yearRange]);

  // Chart 1: Market Cap Trend (combined annual + quarterly)
  const marketCapTrendData = useMemo(() => {
    const annual = filteredAnnualData.map(d => ({
      period: String(d.year),
      year: d.year,
      quarter: null,
      mainCap: d.main_mktcap_hkbn || 0,
      gemCap: showGEM ? (d.gem_mktcap_hkbn || 0) : undefined,
      totalCap: (d.main_mktcap_hkbn || 0) + (d.gem_mktcap_hkbn || 0),
    }));

    const quarterly = filteredQuarterlyData.map(d => ({
      period: `${d.year} Q${d.quarter}`,
      year: d.year,
      quarter: d.quarter,
      mainCap: d.main_mktcap_hkbn || 0,
      gemCap: showGEM ? (d.gem_mktcap_hkbn || 0) : undefined,
      totalCap: (d.main_mktcap_hkbn || 0) + (d.gem_mktcap_hkbn || 0),
    }));

    return [...annual, ...quarterly].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return (a.quarter || 0) - (b.quarter || 0);
    });
  }, [filteredAnnualData, filteredQuarterlyData, showGEM]);

  // Chart 2: Turnover Trend (combined annual + quarterly)
  const turnoverTrendData = useMemo(() => {
    const annual = filteredAnnualData.map(d => ({
      period: String(d.year),
      year: d.year,
      quarter: null,
      mainTurnover: d.main_turnover_hkmm || 0,
      gemTurnover: showGEM ? (d.gem_turnover_hkmm || 0) : undefined,
    }));

    const quarterly = filteredQuarterlyData.map(d => ({
      period: `${d.year} Q${d.quarter}`,
      year: d.year,
      quarter: d.quarter,
      mainTurnover: d.main_turnover_hkmm || 0,
      gemTurnover: showGEM ? (d.gem_turnover_hkmm || 0) : undefined,
    }));

    return [...annual, ...quarterly].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return (a.quarter || 0) - (b.quarter || 0);
    });
  }, [filteredAnnualData, filteredQuarterlyData, showGEM]);

  // Chart 3: Listed Companies (combined annual + quarterly)
  const listedCompaniesData = useMemo(() => {
    const annual = filteredAnnualData.map(d => ({
      period: String(d.year),
      year: d.year,
      quarter: null,
      mainListed: d.main_listed || 0,
      gemListed: showGEM ? (d.gem_listed || 0) : undefined,
      total: (d.main_listed || 0) + (d.gem_listed || 0),
    }));

    const quarterly = filteredQuarterlyData.map(d => ({
      period: `${d.year} Q${d.quarter}`,
      year: d.year,
      quarter: d.quarter,
      mainListed: d.main_listed || 0,
      gemListed: showGEM ? (d.gem_listed || 0) : undefined,
      total: (d.main_listed || 0) + (d.gem_listed || 0),
    }));

    return [...annual, ...quarterly].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return (a.quarter || 0) - (b.quarter || 0);
    });
  }, [filteredAnnualData, filteredQuarterlyData, showGEM]);

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

  const isLoading = isLoadingAnnual || isLoadingQuarterly;

  if (isLoading) {
    return (
      <div className="space-y-4 p-3">
        <div className="animate-pulse">
          <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Controls */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            A1 Market Highlights
          </h2>
          {latestKPIs && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
              Latest data: <span className="font-semibold text-blue-600">{latestKPIs.period}</span>
            </p>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Year Range Filter */}
          <div className="flex items-center gap-1.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-2 py-1.5">
            <Calendar className="w-3.5 h-3.5 text-gray-500 dark:text-gray-400" />
            <select
              value={yearRange.start}
              onChange={(e) => setYearRange({ ...yearRange, start: parseInt(e.target.value) })}
              className="bg-transparent text-xs border-none focus:outline-none cursor-pointer"
            >
              {[1997, 2000, 2005, 2010, 2015, 2020].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <span className="text-xs text-gray-500 dark:text-gray-400">-</span>
            <select
              value={yearRange.end}
              onChange={(e) => setYearRange({ ...yearRange, end: parseInt(e.target.value) })}
              className="bg-transparent text-xs border-none focus:outline-none cursor-pointer"
            >
              {[2020, 2021, 2022, 2023, 2024, 2025].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* GEM Toggle */}
          <button
            onClick={() => setShowGEM(!showGEM)}
            className={`flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              showGEM
                ? 'bg-orange-100 dark:bg-orange-900 text-orange-700 dark:text-orange-300 border border-orange-300 dark:border-orange-700'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-600'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            {showGEM ? 'Hide GEM' : 'Show GEM'}
          </button>
        </div>
      </div>

      {/* KPI Cards - Latest Quarterly Data */}
      {latestKPIs && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* KPI 1: Total Market Cap */}
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 border border-blue-200 dark:border-blue-700 rounded-lg p-3 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-blue-700 dark:text-blue-300">
                <DollarSign className="w-4 h-4" />
                <span className="text-xs font-medium">Total Market Cap</span>
              </div>
              {latestKPIs.qoqCapChange !== null && (
                <div className={`flex items-center text-xs ${latestKPIs.qoqCapChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {latestKPIs.qoqCapChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span className="ml-0.5">{formatPercent(latestKPIs.qoqCapChange)} QoQ</span>
                </div>
              )}
            </div>
            <div className="text-xl font-bold text-blue-900 dark:text-blue-100">
              HK${formatBillions(latestKPIs.totalMarketCap)}
            </div>
            <div className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
              Main: ${formatBillions(latestKPIs.mainMarketCap)} | GEM: ${formatBillions(latestKPIs.gemMarketCap)}
            </div>
          </div>

          {/* KPI 2: Average Daily Turnover */}
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 border border-purple-200 dark:border-purple-700 rounded-lg p-3 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-purple-700 dark:text-purple-300">
                <BarChart3 className="w-4 h-4" />
                <span className="text-xs font-medium">Avg Daily Turnover</span>
              </div>
              {latestKPIs.qoqTurnoverChange !== null && (
                <div className={`flex items-center text-xs ${latestKPIs.qoqTurnoverChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {latestKPIs.qoqTurnoverChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span className="ml-0.5">{formatPercent(latestKPIs.qoqTurnoverChange)} QoQ</span>
                </div>
              )}
            </div>
            <div className="text-xl font-bold text-purple-900 dark:text-purple-100">
              HK${formatMillions(latestKPIs.mainTurnover)}
            </div>
            <div className="text-xs text-purple-600 dark:text-purple-400 mt-0.5">
              {latestKPIs.tradingDays} trading days in {latestKPIs.period}
            </div>
          </div>

          {/* KPI 3: Total Listings */}
          <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 border border-green-200 dark:border-green-700 rounded-lg p-3 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-green-700 dark:text-green-300">
                <Building2 className="w-4 h-4" />
                <span className="text-xs font-medium">Total Listings</span>
              </div>
              {latestKPIs.qoqListingsChange !== null && (
                <div className={`flex items-center text-xs ${latestKPIs.qoqListingsChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {latestKPIs.qoqListingsChange >= 0 ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                  <span className="ml-0.5">{formatPercent(latestKPIs.qoqListingsChange)} QoQ</span>
                </div>
              )}
            </div>
            <div className="text-xl font-bold text-green-900 dark:text-green-100">
              {latestKPIs.totalListings.toLocaleString()}
            </div>
            <div className="text-xs text-green-600 dark:text-green-400 mt-0.5">
              Main: {latestKPIs.mainListings.toLocaleString()} | GEM: {latestKPIs.gemListings.toLocaleString()}
            </div>
          </div>

          {/* KPI 4: GEM Market Share */}
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 border border-orange-200 dark:border-orange-700 rounded-lg p-3 shadow-sm">
            <div className="flex items-center justify-between mb-1.5">
              <div className="flex items-center gap-1.5 text-orange-700 dark:text-orange-300">
                <PieChart className="w-4 h-4" />
                <span className="text-xs font-medium">GEM Market Share</span>
              </div>
            </div>
            <div className="text-xl font-bold text-orange-900 dark:text-orange-100">
              {latestKPIs.gemMarketShare.toFixed(2)}%
            </div>
            <div className="text-xs text-orange-600 dark:text-orange-400 mt-0.5">
              of total market capitalisation
            </div>
          </div>
        </div>
      )}

      {/* Charts View */}
      <div className="space-y-4">
          {/* Chart 1: Market Cap Trend */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
              Market Capitalisation Trend ({yearRange.start} - {yearRange.end})
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={marketCapTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="period" stroke="#6b7280" angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#6b7280" label={{ value: 'HK$ Billions', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  formatter={(value: number) => `HK$${formatBillions(value)}`}
                  contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }}
                />
                <Legend />
                <Line type="monotone" dataKey="totalCap" stroke="#3b82f6" strokeWidth={2} name="Total Market Cap" />
                <Line type="monotone" dataKey="mainCap" stroke="#8b5cf6" strokeWidth={2} name="Main Board" />
                {showGEM && <Line type="monotone" dataKey="gemCap" stroke="#f59e0b" strokeWidth={1} name="GEM" />}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 2: Turnover Trend */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
              Average Daily Turnover Evolution ({yearRange.start} - {yearRange.end})
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={turnoverTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="period" stroke="#6b7280" angle={-45} textAnchor="end" height={80} />
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
          </div>

          {/* Chart 3: Listed Companies */}
          <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
            <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
              Number of Listed Companies ({yearRange.start} - {yearRange.end})
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={listedCompaniesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="period" stroke="#6b7280" angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#6b7280" label={{ value: 'Number of Companies', angle: -90, position: 'insideLeft' }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb', borderRadius: '8px' }} />
                <Legend />
                <Line type="monotone" dataKey="total" stroke="#3b82f6" strokeWidth={2} name="Total" />
                <Line type="monotone" dataKey="mainListed" stroke="#8b5cf6" strokeWidth={2} name="Main Board" />
                {showGEM && <Line type="monotone" dataKey="gemListed" stroke="#f59e0b" strokeWidth={2} name="GEM" />}
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Chart 4: Quarterly Turnover */}
          {quarterlyTurnoverData.length > 0 && (
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 shadow-sm">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-3">
                Quarterly Average Daily Turnover (All Available Quarters)
              </h3>
              <ResponsiveContainer width="100%" height={250}>
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

      {/* Data Source Footer */}
      <div className="bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 text-xs text-gray-600 dark:text-gray-400">
        <strong>Data Source:</strong> SFC Table A1 - Highlights of Hong Kong Stock Market |
        <strong className="ml-2">Schema:</strong> Normalized a1_market_highlights table |
        <strong className="ml-2">Coverage:</strong> {annualData.length} annual records (1997-2024) + {quarterlyData.length} quarterly records (2023-2025 Q3)
      </div>
    </div>
  );
};

export default A1MarketHighlightsDashboard;
