/**
 * A3 Market Structure - Liquidity (Turnover) Dashboard
 *
 * Features:
 * - Main Board turnover by stock type
 * - Market cap vs turnover scatter plot (A2 + A3 join)
 * - Turnover share vs market cap share
 * - GEM vs Main Board turnover comparison
 */

import React, { useMemo, useState } from 'react';
import {
  AreaChart, Area, LineChart, Line, ScatterChart, Scatter, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import {
  TrendingUp, TrendingDown, Activity, Zap, Filter, Calendar
} from 'lucide-react';
import {
  useA2AnnualData,
  useA3AnnualData,
  useA3QuarterlyData,
  A2MktCapByStockType,
  A3TurnoverByStockType
} from '../hooks/useSFCStatistics';
import { formatHKDBillions, formatHKDMillions } from '../lib/utils';

const A3LiquidityDashboard: React.FC = () => {
  const { data: a2AnnualData, isLoading: isLoadingA2 } = useA2AnnualData(200);
  const { data: a3AnnualData, isLoading: isLoadingA3 } = useA3AnnualData(200);
  const { data: a3QuarterlyData, isLoading: isLoadingA3Q } = useA3QuarterlyData(100);

  // View state
  const [yearRange, setYearRange] = useState<{ start: number; end: number }>({ start: 2000, end: 2025 });

  const isLoading = isLoadingA2 || isLoadingA3 || isLoadingA3Q;

  // Get latest quarterly data for KPIs
  const latestQuarterly = useMemo(() => {
    if (!a3QuarterlyData || a3QuarterlyData.length === 0) return null;

    const sorted = [...a3QuarterlyData].sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return (b.quarter || 0) - (a.quarter || 0);
    });

    return a3QuarterlyData.filter(
      d => d.year === sorted[0].year && d.quarter === sorted[0].quarter
    );
  }, [a3QuarterlyData]);

  // Calculate liquidity KPIs
  const liquidityKPIs = useMemo(() => {
    if (!latestQuarterly) return null;

    const mainTotal = latestQuarterly.find(d => d.board === 'Main' && d.stock_type === 'Total')?.avg_turnover_hkmm || 0;
    const gemTotal = latestQuarterly.find(d => d.board === 'GEM' && d.stock_type === 'Total')?.avg_turnover_hkmm || 0;
    const totalTurnover = mainTotal + gemTotal;

    const mainHShares = latestQuarterly.find(d => d.board === 'Main' && d.stock_type === 'H_shares')?.avg_turnover_hkmm || 0;
    const hSharePenetration = mainTotal > 0 ? (mainHShares / mainTotal) * 100 : 0;

    return {
      period: `${latestQuarterly[0].year} Q${latestQuarterly[0].quarter}`,
      totalTurnover,
      mainTurnover: mainTotal,
      gemTurnover: gemTotal,
      hShareTurnover: mainHShares,
      hSharePenetration,
      gemShare: totalTurnover > 0 ? (gemTotal / totalTurnover) * 100 : 0
    };
  }, [latestQuarterly]);

  // Filter annual data by year range
  const filteredA3Data = useMemo(() => {
    if (!a3AnnualData) return [];
    return a3AnnualData.filter(d => d.year >= yearRange.start && d.year <= yearRange.end);
  }, [a3AnnualData, yearRange]);

  // Filter quarterly data by year range
  const filteredA3QuarterlyData = useMemo(() => {
    if (!a3QuarterlyData) return [];
    return a3QuarterlyData.filter(d => d.year >= yearRange.start && d.year <= yearRange.end);
  }, [a3QuarterlyData, yearRange]);

  // Prepare Main Board turnover composition (stacked area - combined annual + quarterly)
  const mainBoardTurnoverData = useMemo(() => {
    if (!filteredA3Data) return [];

    // Annual data points
    const years = [...new Set(filteredA3Data.map(d => d.year))].sort();
    const annualPoints = years.map(year => {
      const yearData = filteredA3Data.filter(d => d.year === year && d.board === 'Main');

      const hsi = yearData.find(d => d.stock_type === 'HSI_constituents')?.avg_turnover_hkmm || 0;
      const nonH = yearData.find(d => d.stock_type === 'nonH_mainland')?.avg_turnover_hkmm || 0;
      const hShares = yearData.find(d => d.stock_type === 'H_shares')?.avg_turnover_hkmm || 0;

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
    const quarterlyPoints = filteredA3QuarterlyData
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

        if (item.stock_type === 'HSI_constituents') acc[key].HSI_constituents = item.avg_turnover_hkmm || 0;
        if (item.stock_type === 'nonH_mainland') acc[key].nonH_mainland = item.avg_turnover_hkmm || 0;
        if (item.stock_type === 'H_shares') acc[key].H_shares = item.avg_turnover_hkmm || 0;

        return acc;
      }, {} as Record<string, any>);

    const quarterlyArray = Object.values(quarterlyPoints);

    return [...annualPoints, ...quarterlyArray].sort((a: any, b: any) => {
      if (a.year !== b.year) return a.year - b.year;
      return (a.quarter || 0) - (b.quarter || 0);
    });
  }, [filteredA3Data, filteredA3QuarterlyData]);

  // GEM vs Main Board turnover (combined annual + quarterly)
  const gemVsMainTurnover = useMemo(() => {
    if (!filteredA3Data) return [];

    // Annual data points
    const years = [...new Set(filteredA3Data.map(d => d.year))].sort();
    const annualPoints = years.map(year => {
      const yearData = filteredA3Data.filter(d => d.year === year);

      const mainTotal = yearData.find(d => d.board === 'Main' && d.stock_type === 'Total')?.avg_turnover_hkmm || 0;
      const gemTotal = yearData.find(d => d.board === 'GEM' && d.stock_type === 'Total')?.avg_turnover_hkmm || 0;

      return {
        period: String(year),
        year,
        quarter: null,
        Main: mainTotal,
        GEM: gemTotal
      };
    });

    // Quarterly data points
    const quarterlyPoints = filteredA3QuarterlyData
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

        if (item.board === 'Main') acc[key].Main = item.avg_turnover_hkmm || 0;
        if (item.board === 'GEM') acc[key].GEM = item.avg_turnover_hkmm || 0;

        return acc;
      }, {} as Record<string, any>);

    const quarterlyArray = Object.values(quarterlyPoints);

    return [...annualPoints, ...quarterlyArray].sort((a: any, b: any) => {
      if (a.year !== b.year) return a.year - b.year;
      return (a.quarter || 0) - (b.quarter || 0);
    });
  }, [filteredA3Data, filteredA3QuarterlyData]);

  // Market Cap vs Turnover scatter (join A2 + A3)
  const mktCapVsTurnoverData = useMemo(() => {
    if (!a2AnnualData || !a3AnnualData) return [];

    const latestYear = Math.max(...a3AnnualData.map(d => d.year));

    const a2Latest = a2AnnualData.filter(d => d.year === latestYear && d.board === 'Main');
    const a3Latest = a3AnnualData.filter(d => d.year === latestYear && d.board === 'Main');

    const stockTypes = ['HSI_constituents', 'nonH_mainland', 'H_shares'];

    return stockTypes.map(stockType => {
      const mktcap = a2Latest.find(d => d.stock_type === stockType)?.mktcap_hkbn || 0;
      const turnover = a3Latest.find(d => d.stock_type === stockType)?.avg_turnover_hkmm || 0;

      return {
        name: stockType === 'HSI_constituents' ? 'HSI Constituents' :
              stockType === 'nonH_mainland' ? 'Non-H Mainland' : 'H-shares',
        mktcap,
        turnover,
        stockType
      };
    });
  }, [a2AnnualData, a3AnnualData]);

  // Turnover share vs Market cap share (latest year)
  const shareComparisonData = useMemo(() => {
    if (!a2AnnualData || !a3AnnualData) return [];

    const latestYear = Math.max(...a3AnnualData.map(d => d.year));

    const a2Latest = a2AnnualData.filter(d => d.year === latestYear && d.board === 'Main');
    const a3Latest = a3AnnualData.filter(d => d.year === latestYear && d.board === 'Main');

    const totalMktCap = a2Latest.find(d => d.stock_type === 'Total')?.mktcap_hkbn || 0;
    const totalTurnover = a3Latest.find(d => d.stock_type === 'Total')?.avg_turnover_hkmm || 0;

    const stockTypes = ['HSI_constituents', 'nonH_mainland', 'H_shares'];

    return stockTypes.map(stockType => {
      const mktcap = a2Latest.find(d => d.stock_type === stockType)?.mktcap_hkbn || 0;
      const turnover = a3Latest.find(d => d.stock_type === stockType)?.avg_turnover_hkmm || 0;

      const mktcapShare = totalMktCap > 0 ? (mktcap / totalMktCap) * 100 : 0;
      const turnoverShare = totalTurnover > 0 ? (turnover / totalTurnover) * 100 : 0;

      return {
        name: stockType === 'HSI_constituents' ? 'HSI' :
              stockType === 'nonH_mainland' ? 'Non-H' : 'H-shares',
        mktcapShare,
        turnoverShare,
        overtraded: turnoverShare - mktcapShare
      };
    });
  }, [a2AnnualData, a3AnnualData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading A3 liquidity data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with period and controls */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Market Structure - Liquidity (Turnover)</h2>
          {liquidityKPIs && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Latest: {liquidityKPIs.period}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          {/* Year Range Filter */}
          <div className="flex items-center gap-2 bg-white border rounded-lg px-3 py-2">
            <Calendar className="w-4 h-4 text-gray-500" />
            <select
              value={yearRange.start}
              onChange={(e) => setYearRange({ ...yearRange, start: parseInt(e.target.value) })}
              className="border-0 bg-transparent text-sm focus:outline-none"
            >
              {[1997, 2000, 2005, 2010, 2015, 2020].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
            <span className="text-gray-400">-</span>
            <select
              value={yearRange.end}
              onChange={(e) => setYearRange({ ...yearRange, end: parseInt(e.target.value) })}
              className="border-0 bg-transparent text-sm focus:outline-none"
            >
              {[2020, 2021, 2022, 2023, 2024, 2025].map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
          {liquidityKPIs && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Total Turnover */}
              <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-6 text-white">
                <div className="flex items-center justify-between mb-2">
                  <Zap className="w-8 h-8 opacity-80" />
                </div>
                <div className="text-3xl font-bold mb-1">
                  {formatHKDBillions(liquidityKPIs.totalTurnover / 1000)}
                </div>
                <div className="text-sm opacity-90">Avg Daily Turnover</div>
                <div className="text-xs opacity-75 mt-2">{liquidityKPIs.period}</div>
              </div>

              {/* H-share Turnover Penetration */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">H-share Trading Share</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {liquidityKPIs.hSharePenetration.toFixed(2)}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  {formatHKDBillions(liquidityKPIs.hShareTurnover / 1000)} daily
                </div>
              </div>

              {/* Main Board Turnover */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Main Board Turnover</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {formatHKDBillions(liquidityKPIs.mainTurnover / 1000)}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  {(100 - liquidityKPIs.gemShare).toFixed(2)}% of total
                </div>
              </div>

              {/* GEM Share */}
              <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">GEM Turnover Share</div>
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  {liquidityKPIs.gemShare.toFixed(3)}%
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
                  {formatHKDMillions(liquidityKPIs.gemTurnover)} daily
                </div>
              </div>
            </div>
          )}

          {/* Charts Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart 1: Main Board Turnover Composition */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Main Board Turnover by Stock Type ({yearRange.start}-{yearRange.end})
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={mainBoardTurnoverData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" angle={-45} textAnchor="end" height={80} />
                  <YAxis label={{ value: 'HK$ million', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value: number) => [formatHKDMillions(value), '']} />
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
                Identify which segments drive trading activity over time
              </p>
            </div>

            {/* Chart 2: Turnover Share vs Market Cap Share */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Turnover Share vs Market Cap Share (Latest Year)
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={shareComparisonData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis label={{ value: '% Share', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value: number) => [`${value.toFixed(2)}%`]} />
                  <Legend />
                  <Bar dataKey="mktcapShare" fill="#3b82f6" name="Market Cap Share %" />
                  <Bar dataKey="turnoverShare" fill="#10b981" name="Turnover Share %" />
                </BarChart>
              </ResponsiveContainer>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Shows which segments are over-traded (higher turnover % vs market cap %)
              </p>
            </div>

            {/* Chart 3: Market Cap vs Turnover Scatter */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                Market Cap vs Turnover by Stock Type (Latest Year)
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis
                    dataKey="mktcap"
                    name="Market Cap"
                    unit=" bn"
                    label={{ value: 'Market Cap (HK$ bn)', position: 'insideBottom', offset: -5 }}
                  />
                  <YAxis
                    dataKey="turnover"
                    name="Turnover"
                    unit=" m"
                    label={{ value: 'Avg Daily Turnover (HK$ m)', angle: -90, position: 'insideLeft' }}
                  />
                  <Tooltip
                    cursor={{ strokeDasharray: '3 3' }}
                    formatter={(value: number, name: string) => {
                      if (name === 'Market Cap') return [formatHKDBillions(value), ''];
                      if (name === 'Turnover') return [formatHKDMillions(value), ''];
                      return [value, name];
                    }}
                  />
                  <Legend />
                  <Scatter name="Stock Types" data={mktCapVsTurnoverData} fill="#8884d8">
                    {mktCapVsTurnoverData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.stockType === 'HSI_constituents' ? '#3b82f6' :
                              entry.stockType === 'nonH_mainland' ? '#10b981' : '#f59e0b'}
                      />
                    ))}
                  </Scatter>
                </ScatterChart>
              </ResponsiveContainer>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Position indicates trading intensity relative to market size
              </p>
            </div>

            {/* Chart 4: GEM vs Main Board Turnover */}
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                GEM vs Main Board Turnover ({yearRange.start}-{yearRange.end})
              </h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={gemVsMainTurnover}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" angle={-45} textAnchor="end" height={80} />
                  <YAxis label={{ value: 'HK$ million', angle: -90, position: 'insideLeft' }} />
                  <Tooltip formatter={(value: number) => [formatHKDMillions(value), '']} />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="Main"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="Main Board"
                  />
                  <Line
                    type="monotone"
                    dataKey="GEM"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                    name="GEM"
                  />
                </LineChart>
              </ResponsiveContainer>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                Underlines that GEM is marginal in liquidity terms
              </p>
            </div>
          </div>

      {/* Data Source Footer */}
      <div className="text-xs text-gray-500 text-center">
        Data source: HKEX Table A3 - Average Daily Turnover by Stock Type | Latest: {liquidityKPIs?.period}
      </div>
    </div>
  );
};

export default A3LiquidityDashboard;
