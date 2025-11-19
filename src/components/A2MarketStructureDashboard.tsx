/**
 * A2 Market Structure - Market Cap by Stock Type Dashboard
 *
 * Features:
 * - Main Board composition (stacked area chart)
 * - Latest year composition (pie chart)
 * - GEM vs Main Board comparison
 * - H-share penetration KPI
 */

import React, { useMemo, useState } from 'react';
import {
  AreaChart, Area, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import {
  TrendingUp, TrendingDown, PieChart as PieChartIcon, BarChart3,
  Filter, Calendar
} from 'lucide-react';
import {
  useA2AnnualData,
  useA2QuarterlyData,
  A2MktCapByStockType
} from '../hooks/useSFCStatistics';
import { formatHKDBillions } from '../lib/utils';

const A2MarketStructureDashboard: React.FC = () => {
  const { data: annualData, isLoading: isLoadingAnnual } = useA2AnnualData(200);
  const { data: quarterlyData, isLoading: isLoadingQuarterly } = useA2QuarterlyData(100);

  // View state
  const [yearRange, setYearRange] = useState<{ start: number; end: number }>({ start: 2000, end: 2025 });

  const isLoading = isLoadingAnnual || isLoadingQuarterly;

  // Get latest quarterly data for KPIs
  const latestQuarterly = useMemo(() => {
    if (!quarterlyData || quarterlyData.length === 0) return null;

    const sorted = [...quarterlyData].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return (b.quarter || 0) - (a.quarter || 0);
    });

    // Group by year/quarter
    const latestPeriod = sorted[0];
    return quarterlyData.filter(
      d => d.year === latestPeriod.year && d.quarter === latestPeriod.quarter
    );
  }, [quarterlyData]);

  // Calculate H-share penetration KPI
  const hSharePenetration = useMemo(() => {
    if (!latestQuarterly) return null;

    const mainTotal = latestQuarterly.find(d => d.board === 'Main' && d.stock_type === 'Total')?.mktcap_hkbn || 0;
    const mainHShares = latestQuarterly.find(d => d.board === 'Main' && d.stock_type === 'H_shares')?.mktcap_hkbn || 0;
    const gemTotal = latestQuarterly.find(d => d.board === 'GEM' && d.stock_type === 'Total')?.mktcap_hkbn || 0;
    const gemHShares = latestQuarterly.find(d => d.board === 'GEM' && d.stock_type === 'H_shares')?.mktcap_hkbn || 0;

    const totalMktCap = mainTotal + gemTotal;
    const totalHShares = mainHShares + gemHShares;

    const penetration = totalMktCap > 0 ? (totalHShares / totalMktCap) * 100 : 0;

    // Find previous quarter for QoQ
    const prevQuarter = quarterlyData?.filter(
      d => !(d.year === latestQuarterly[0].year && d.quarter === latestQuarterly[0].quarter)
    ).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return (b.quarter || 0) - (a.quarter || 0);
    })[0];

    let qoqChange = null;
    if (prevQuarter) {
      const prevQuarterData = quarterlyData?.filter(
        d => d.year === prevQuarter.year && d.quarter === prevQuarter.quarter
      );
      const prevMainTotal = prevQuarterData?.find(d => d.board === 'Main' && d.stock_type === 'Total')?.mktcap_hkbn || 0;
      const prevMainHShares = prevQuarterData?.find(d => d.board === 'Main' && d.stock_type === 'H_shares')?.mktcap_hkbn || 0;
      const prevGemTotal = prevQuarterData?.find(d => d.board === 'GEM' && d.stock_type === 'Total')?.mktcap_hkbn || 0;
      const prevGemHShares = prevQuarterData?.find(d => d.board === 'GEM' && d.stock_type === 'H_shares')?.mktcap_hkbn || 0;

      const prevTotalMktCap = prevMainTotal + prevGemTotal;
      const prevTotalHShares = prevMainHShares + prevGemHShares;
      const prevPenetration = prevTotalMktCap > 0 ? (prevTotalHShares / prevTotalMktCap) * 100 : 0;

      qoqChange = penetration - prevPenetration;
    }

    return {
      period: `${latestQuarterly[0].year} Q${latestQuarterly[0].quarter}`,
      penetration,
      totalMktCap,
      mainHShares,
      gemHShares,
      totalHShares,
      qoqChange
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

  // Prepare stacked area chart data (Main Board composition - combined annual + quarterly)
  const mainBoardCompositionData = useMemo(() => {
    if (!filteredAnnualData) return [];

    // Annual data points
    const years = [...new Set(filteredAnnualData.map(d => d.year))].sort();
    const annualPoints = years.map(year => {
      const yearData = filteredAnnualData.filter(d => d.year === year && d.board === 'Main');

      const hsi = yearData.find(d => d.stock_type === 'HSI_constituents')?.mktcap_hkbn || 0;
      const nonH = yearData.find(d => d.stock_type === 'nonH_mainland')?.mktcap_hkbn || 0;
      const hShares = yearData.find(d => d.stock_type === 'H_shares')?.mktcap_hkbn || 0;

      return {
        period: String(year),
        year,
        quarter: null,
        HSI_constituents: hsi,
        nonH_mainland: nonH,
        H_shares: hShares
      };
    });

    // Quarterly data points
    const quarterlyPoints = filteredQuarterlyData
      .filter(d => d.board === 'Main')
      .reduce((acc, item) => {
        const key = `${item.year}_Q${item.quarter}`;
        if (!acc[key]) {
          acc[key] = {
            period: `${item.year} Q${item.quarter}`,
            year: item.year,
            quarter: item.quarter,
            HSI_constituents: 0,
            nonH_mainland: 0,
            H_shares: 0
          };
        }

        if (item.stock_type === 'HSI_constituents') acc[key].HSI_constituents = item.mktcap_hkbn || 0;
        if (item.stock_type === 'nonH_mainland') acc[key].nonH_mainland = item.mktcap_hkbn || 0;
        if (item.stock_type === 'H_shares') acc[key].H_shares = item.mktcap_hkbn || 0;

        return acc;
      }, {} as Record<string, any>);

    const quarterlyArray = Object.values(quarterlyPoints);

    return [...annualPoints, ...quarterlyArray].sort((a: any, b: any) => {
      if (a.year !== b.year) return a.year - b.year;
      return (a.quarter || 0) - (b.quarter || 0);
    });
  }, [filteredAnnualData, filteredQuarterlyData]);

  // Prepare GEM vs Main Board data (combined annual + quarterly)
  const gemVsMainData = useMemo(() => {
    if (!filteredAnnualData) return [];

    // Annual data points
    const years = [...new Set(filteredAnnualData.map(d => d.year))].sort();
    const annualPoints = years.map(year => {
      const yearData = filteredAnnualData.filter(d => d.year === year);

      const mainTotal = yearData.find(d => d.board === 'Main' && d.stock_type === 'Total')?.mktcap_hkbn || 0;
      const gemTotal = yearData.find(d => d.board === 'GEM' && d.stock_type === 'Total')?.mktcap_hkbn || 0;

      return {
        period: String(year),
        year,
        quarter: null,
        Main: mainTotal,
        GEM: gemTotal
      };
    });

    // Quarterly data points
    const quarterlyPoints = filteredQuarterlyData
      .filter(d => d.stock_type === 'Total')
      .reduce((acc, item) => {
        const key = `${item.year}_Q${item.quarter}`;
        if (!acc[key]) {
          acc[key] = {
            period: `${item.year} Q${item.quarter}`,
            year: item.year,
            quarter: item.quarter,
            Main: 0,
            GEM: 0
          };
        }

        if (item.board === 'Main') acc[key].Main = item.mktcap_hkbn || 0;
        if (item.board === 'GEM') acc[key].GEM = item.mktcap_hkbn || 0;

        return acc;
      }, {} as Record<string, any>);

    const quarterlyArray = Object.values(quarterlyPoints);

    return [...annualPoints, ...quarterlyArray].sort((a: any, b: any) => {
      if (a.year !== b.year) return a.year - b.year;
      return (a.quarter || 0) - (b.quarter || 0);
    });
  }, [filteredAnnualData, filteredQuarterlyData]);

  // Latest period composition (for pie chart - use quarterly if available)
  const latestYearComposition = useMemo(() => {
    // Try to use latest quarterly data first
    if (latestQuarterly) {
      const latestData = quarterlyData?.filter(
        d => d.year === latestQuarterly.year &&
        d.quarter === latestQuarterly.quarter &&
        d.board === 'Main'
      ) || [];

      const hsi = latestData.find(d => d.stock_type === 'HSI_constituents')?.mktcap_hkbn || 0;
      const nonH = latestData.find(d => d.stock_type === 'nonH_mainland')?.mktcap_hkbn || 0;
      const hShares = latestData.find(d => d.stock_type === 'H_shares')?.mktcap_hkbn || 0;

      if (hsi > 0 || nonH > 0 || hShares > 0) {
        return [
          { name: 'HSI Constituents', value: hsi, color: '#3b82f6' },
          { name: 'Non-H Mainland', value: nonH, color: '#10b981' },
          { name: 'H-shares', value: hShares, color: '#f59e0b' }
        ];
      }
    }

    // Fallback to annual data
    if (!filteredAnnualData || filteredAnnualData.length === 0) return [];

    const latestYear = Math.max(...filteredAnnualData.map(d => d.year));
    const latestData = filteredAnnualData.filter(d => d.year === latestYear && d.board === 'Main');

    const hsi = latestData.find(d => d.stock_type === 'HSI_constituents')?.mktcap_hkbn || 0;
    const nonH = latestData.find(d => d.stock_type === 'nonH_mainland')?.mktcap_hkbn || 0;
    const hShares = latestData.find(d => d.stock_type === 'H_shares')?.mktcap_hkbn || 0;

    return [
      { name: 'HSI Constituents', value: hsi, color: '#3b82f6' },
      { name: 'Non-H Mainland', value: nonH, color: '#10b981' },
      { name: 'H-shares', value: hShares, color: '#f59e0b' }
    ];
  }, [filteredAnnualData, latestQuarterly, quarterlyData]);

  // Table data
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading A2 market structure data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with period and controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Market Structure - Market Cap by Stock Type</h2>
          {hSharePenetration && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Latest: {hSharePenetration.period}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Year Range Filter */}
          <div className="flex items-center gap-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg px-3 py-2">
            <Calendar className="w-4 h-4 text-gray-500 dark:text-gray-400" />
            <select
              value={yearRange.start}
              onChange={(e) => setYearRange({ ...yearRange, start: parseInt(e.target.value) })}
              className="border-0 bg-transparent text-sm font-semibold text-gray-900 dark:text-gray-100 focus:outline-none cursor-pointer"
            >
              {[1997, 2000, 2005, 2010, 2015, 2020].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <span className="text-gray-600 dark:text-gray-400 font-medium">-</span>
            <select
              value={yearRange.end}
              onChange={(e) => setYearRange({ ...yearRange, end: parseInt(e.target.value) })}
              className="border-0 bg-transparent text-sm font-semibold text-gray-900 dark:text-gray-100 focus:outline-none cursor-pointer"
            >
              {[2020, 2021, 2022, 2023, 2024, 2025].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
          {hSharePenetration && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* H-share Penetration */}
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <PieChartIcon className="w-8 h-8 opacity-80" />
                  {hSharePenetration.qoqChange !== null && (
                    <div className={`flex items-center text-sm ${
                      hSharePenetration.qoqChange >= 0 ? 'text-green-200' : 'text-red-200'
                    }`}>
                      {hSharePenetration.qoqChange >= 0 ? (
                        <TrendingUp className="w-4 h-4 mr-1" />
                      ) : (
                        <TrendingDown className="w-4 h-4 mr-1" />
                      )}
                      {Math.abs(hSharePenetration.qoqChange).toFixed(2)}pp QoQ
                    </div>
                  )}
                </div>
                <div className="text-3xl font-bold mb-1">
                  {hSharePenetration.penetration.toFixed(2)}%
                </div>
                <div className="text-sm opacity-90">H-share Penetration</div>
                <div className="text-xs opacity-75 mt-2">
                  {formatHKDBillions(hSharePenetration.totalHShares)} H-shares
                </div>
              </div>

              {/* Total Market Cap */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <div className="flex items-center justify-between mb-2">
                  <BarChart3 className="w-8 h-8 text-blue-500" />
                </div>
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {formatHKDBillions(hSharePenetration.totalMktCap)}
                </div>
                <div className="text-sm text-gray-600 dark:text-gray-400">Total Market Cap</div>
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">{hSharePenetration.period}</div>
              </div>

              {/* Main Board H-shares */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Main Board H-shares</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatHKDBillions(hSharePenetration.mainHShares)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  {((hSharePenetration.mainHShares / hSharePenetration.totalMktCap) * 100).toFixed(2)}% of total
                </div>
              </div>

              {/* GEM H-shares */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">GEM H-shares</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatHKDBillions(hSharePenetration.gemHShares)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  {((hSharePenetration.gemHShares / hSharePenetration.totalMktCap) * 100).toFixed(2)}% of total
                </div>
              </div>
            </div>
          )}

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Main Board Composition (Stacked Area) */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Main Board Market Cap by Stock Type ({yearRange.start}-{yearRange.end})
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={mainBoardCompositionData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" angle={-45} textAnchor="end" height={80} />
                  <YAxis label={{ value: 'HK$ bn', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value: number) => [formatHKDBillions(value), '']} />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="HSI_constituents"
                    stackId="1"
                    stroke="#3b82f6"
                    fill="#3b82f6"
                    name="HSI Constituents"
                  />
                  <Area
                    type="monotone"
                    dataKey="nonH_mainland"
                    stackId="1"
                    stroke="#10b981"
                    fill="#10b981"
                    name="Non-H Mainland"
                  />
                  <Area
                    type="monotone"
                    dataKey="H_shares"
                    stackId="1"
                    stroke="#f59e0b"
                    fill="#f59e0b"
                    name="H-shares"
                  />
                </AreaChart>
              </ResponsiveContainer>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Shows how Main Board market cap is distributed across stock types over time
              </p>
            </div>

            {/* Chart 2: Latest Year Composition (Pie) */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Main Board Composition - Latest Year
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={latestYearComposition}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(1)}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {latestYearComposition.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => [formatHKDBillions(value), '']} />
                </PieChart>
              </ResponsiveContainer>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Current market cap distribution showing the dominance of different stock types
              </p>
            </div>

            {/* Chart 3: GEM vs Main Board */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6 lg:col-span-2">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                GEM vs Main Board Total Market Cap ({yearRange.start}-{yearRange.end})
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={gemVsMainData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" angle={-45} textAnchor="end" height={80} />
                  <YAxis label={{ value: 'HK$ bn', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value: number) => [formatHKDBillions(value), '']} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="Main"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    name="Main Board"
                  />
                  <Line
                    type="monotone"
                    dataKey="GEM"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="GEM"
                  />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Emphasizes the scale difference between Main Board and GEM markets
              </p>
            </div>
          </div>

      {/* Data Source Footer */}
      <div className="text-xs text-gray-500 text-center">
        Data source: HKEX Table A2 - Market Capitalisation by Stock Type | Latest: {hSharePenetration?.period}
      </div>
    </div>
  );
};

export default A2MarketStructureDashboard;
