import React, { useState, useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, Cell
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, Activity, AlertCircle } from 'lucide-react';
import { useD4FundFlows } from '../hooks/useSFCStatistics';
import { useD3FundNavByDomicile } from '../hooks/useSFCStatistics';

const D4FundFlowsDashboard: React.FC = () => {
  const [yearRange, setYearRange] = useState({ start: 2019, end: 2025 });

  // Fetch D4 fund flows data
  const { data: flowsData, isLoading: loadingFlows } = useD4FundFlows(100);

  // Fetch D3 NAV data for HK domicile to compare flows vs NAV
  const { data: navData, isLoading: loadingNAV } = useD3FundNavByDomicile('HK', 200);

  const isLoading = loadingFlows || loadingNAV;

  // Filter flows by year range
  const filteredFlows = useMemo(() => {
    return flowsData.filter(d => d.year >= yearRange.start && d.year <= yearRange.end);
  }, [flowsData, yearRange]);

  // Latest year data for KPIs
  const latestYear = useMemo(() => {
    if (flowsData.length === 0) return null;
    return Math.max(...flowsData.map(d => d.year));
  }, [flowsData]);

  const latestYearFlows = useMemo(() => {
    return flowsData.filter(d => d.year === latestYear);
  }, [flowsData, latestYear]);

  const latestTotalFlow = latestYearFlows.find(d => d.fund_type === 'Total')?.net_flow_usd_mn || 0;

  const prevYear = latestYear ? latestYear - 1 : null;
  const prevYearTotal = flowsData.find(d => d.year === prevYear && d.fund_type === 'Total')?.net_flow_usd_mn || 0;
  const yoyChange = prevYearTotal !== 0 ? ((latestTotalFlow - prevYearTotal) / Math.abs(prevYearTotal)) * 100 : 0;

  // Top inflows and outflows for latest year
  const latestTopInflows = useMemo(() => {
    return latestYearFlows
      .filter(d => d.fund_type !== 'Total' && (d.net_flow_usd_mn || 0) > 0)
      .sort((a, b) => (b.net_flow_usd_mn || 0) - (a.net_flow_usd_mn || 0))
      .slice(0, 3);
  }, [latestYearFlows]);

  const latestTopOutflows = useMemo(() => {
    return latestYearFlows
      .filter(d => d.fund_type !== 'Total' && (d.net_flow_usd_mn || 0) < 0)
      .sort((a, b) => (a.net_flow_usd_mn || 0) - (b.net_flow_usd_mn || 0))
      .slice(0, 3);
  }, [latestYearFlows]);

  // Chart 1: Annual Net Flows by Fund Type (Grouped Bar Chart)
  const flowsByYearData = useMemo(() => {
    const yearMap = new Map<number, any>();

    filteredFlows.forEach(d => {
      if (d.fund_type === 'Total') return; // Exclude total

      if (!yearMap.has(d.year)) {
        yearMap.set(d.year, { year: d.year });
      }
      const entry = yearMap.get(d.year)!;
      entry[d.fund_type] = d.net_flow_usd_mn || 0;
    });

    return Array.from(yearMap.values()).sort((a, b) => a.year - b.year);
  }, [filteredFlows]);

  // Chart 2: Heatmap - Flow Sign (Positive/Negative)
  const flowSignHeatmapData = useMemo(() => {
    const yearMap = new Map<number, any>();

    filteredFlows.forEach(d => {
      if (d.fund_type === 'Total') return;

      if (!yearMap.has(d.year)) {
        yearMap.set(d.year, { year: d.year });
      }
      const entry = yearMap.get(d.year)!;
      entry[d.fund_type] = d.net_flow_usd_mn || 0;
    });

    return Array.from(yearMap.values()).sort((a, b) => a.year - b.year);
  }, [filteredFlows]);

  // Chart 3: Flows vs NAV - Join D3 and D4 data
  const flowsVsNAVData = useMemo(() => {
    // Get end-of-year NAV data (December = Q4)
    const yearEndNAV = new Map<number, Map<string, number>>();

    navData.forEach(d => {
      const date = new Date(d.as_at_date);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;

      // Only use Q4 data (closest to year-end)
      if (month === 11 || month === 12) { // November or December
        if (!yearEndNAV.has(year)) {
          yearEndNAV.set(year, new Map());
        }
        const fundMap = yearEndNAV.get(year)!;
        if (d.fund_type !== 'Total') {
          fundMap.set(d.fund_type, d.nav_usd_mn || 0);
        }
      }
    });

    // Calculate flow as % of NAV for key fund types
    const result: any[] = [];

    filteredFlows.forEach(flow => {
      if (flow.fund_type === 'Total') return;
      if (!['Bond', 'Equity', 'MoneyMarket', 'Index'].includes(flow.fund_type)) return;

      const prevYearNAV = yearEndNAV.get(flow.year - 1)?.get(flow.fund_type) || 0;
      const flowAsPercent = prevYearNAV > 0 ? ((flow.net_flow_usd_mn || 0) / prevYearNAV) * 100 : 0;

      result.push({
        year: flow.year,
        fundType: flow.fund_type,
        flowPercent: flowAsPercent,
        flowAbsolute: flow.net_flow_usd_mn || 0
      });
    });

    return result;
  }, [filteredFlows, navData]);

  // Chart 4: Total Annual Flows Trend
  const totalFlowsTrendData = useMemo(() => {
    return filteredFlows
      .filter(d => d.fund_type === 'Total')
      .map(d => ({
        year: d.year,
        totalFlow: d.net_flow_usd_mn || 0
      }))
      .sort((a, b) => a.year - b.year);
  }, [filteredFlows]);

  const COLORS = {
    positive: '#10b981',
    negative: '#ef4444',
    neutral: '#94a3b8'
  };

  const FUND_COLORS: Record<string, string> = {
    Bond: '#8b5cf6',
    Equity: '#3b82f6',
    Mixed: '#ef4444',
    MoneyMarket: '#f59e0b',
    Feeder: '#ec4899',
    FundOfFunds: '#14b8a6',
    Index: '#10b981',
    Guaranteed: '#f97316',
    CommodityVirtual: '#a855f7',
    OtherSpecialised: '#06b6d4'
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading D4 Fund Flows data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
            D4: Fund Industry Flows
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Annual Net Subscription/(Redemption) of HK-Domiciled Funds
          </p>
        </div>
        <div className="flex gap-2">
          <select
            className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            value={yearRange.start}
            onChange={(e) => setYearRange({ ...yearRange, start: parseInt(e.target.value) })}
          >
            {[2015, 2016, 2017, 2018, 2019, 2020].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <span className="py-2 text-gray-600 dark:text-gray-400">to</span>
          <select
            className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            value={yearRange.end}
            onChange={(e) => setYearRange({ ...yearRange, end: parseInt(e.target.value) })}
          >
            {[2022, 2023, 2024, 2025, 2026].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">{latestYear} Total Net Flow</p>
              <p className="text-2xl font-bold text-green-900">
                ${(latestTotalFlow / 1000).toFixed(1)}bn
              </p>
              <p className={`text-xs flex items-center gap-1 mt-1 ${yoyChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {yoyChange >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                {Math.abs(yoyChange).toFixed(1)}% YoY
              </p>
            </div>
            <DollarSign className="text-green-600" size={32} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600">Top Inflow</p>
              {latestTopInflows[0] && (
                <>
                  <p className="text-xl font-bold text-blue-900">{latestTopInflows[0].fund_type}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    +${(latestTopInflows[0].net_flow_usd_mn! / 1000).toFixed(1)}bn
                  </p>
                </>
              )}
            </div>
            <TrendingUp className="text-blue-600" size={32} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 border border-red-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600">Top Outflow</p>
              {latestTopOutflows[0] && (
                <>
                  <p className="text-xl font-bold text-red-900">{latestTopOutflows[0].fund_type}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    ${(latestTopOutflows[0].net_flow_usd_mn! / 1000).toFixed(1)}bn
                  </p>
                </>
              )}
            </div>
            <TrendingDown className="text-red-600" size={32} />
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Flow Pattern</p>
              <p className="text-xl font-bold text-purple-900">
                {latestTotalFlow >= 0 ? 'Net Inflow' : 'Net Outflow'}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                {latestYear} overall trend
              </p>
            </div>
            <Activity className="text-purple-600" size={32} />
          </div>
        </div>
      </div>

      {/* Chart 1: Annual Net Flows by Fund Type */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
        <div className="mb-2">
          <h3 className="flex items-center gap-2 text-lg font-semibold">
            <Activity className="text-blue-600" size={20} />
            Annual Net Fund Flows by Type
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Shows which fund categories attract or lose money each year. Positive bars = net inflows, negative bars = net outflows.
          </p>
        </div>
        <div className="p-4">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={flowsByYearData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="year" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} label={{ value: 'Net Flow (US$ millions)', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                formatter={(value: any) => [`$${(value / 1000).toFixed(2)}bn`]}
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px' }}
              />
              <Legend wrapperStyle={{ fontSize: '11px' }} />
              <Bar dataKey="Bond" fill={FUND_COLORS.Bond} stackId="a" />
              <Bar dataKey="Equity" fill={FUND_COLORS.Equity} stackId="a" />
              <Bar dataKey="MoneyMarket" fill={FUND_COLORS.MoneyMarket} stackId="a" />
              <Bar dataKey="Index" fill={FUND_COLORS.Index} stackId="a" />
              <Bar dataKey="Mixed" fill={FUND_COLORS.Mixed} stackId="a" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts 2 & 3 Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 2: Flows as % of NAV */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
          <div className="mb-2">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <TrendingUp className="text-purple-600" size={20} />
              Flows vs Asset Base (% of NAV)
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Net flow as percentage of previous year-end NAV. Shows organic growth rate for each fund type.
            </p>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={flowsVsNAVData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="year" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} label={{ value: 'Flow as % of NAV', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  formatter={(value: any, name) => {
                    if (name === 'flowPercent') return [`${value.toFixed(2)}%`];
                    return [`$${(value / 1000).toFixed(2)}bn`];
                  }}
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="flowPercent" name="Flow % of NAV">
                  {flowsVsNAVData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.flowPercent >= 0 ? COLORS.positive : COLORS.negative} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Total Flows Trend */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
          <div className="mb-2">
            <h3 className="flex items-center gap-2 text-lg font-semibold">
              <DollarSign className="text-green-600" size={20} />
              Total Industry Flows Trend
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Overall industry-wide net inflow/outflow trend. All years show net inflows (positive sentiment).
            </p>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={350}>
              <LineChart data={totalFlowsTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} label={{ value: 'Total Net Flow (US$ millions)', angle: -90, position: 'insideLeft' }} />
                <Tooltip
                  formatter={(value: any) => [`$${(value / 1000).toFixed(2)}bn`]}
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px' }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="totalFlow"
                  stroke="#10b981"
                  strokeWidth={3}
                  name="Total Net Flow"
                  dot={{ r: 5, fill: '#10b981' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Insights Box */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex gap-3">
          <AlertCircle className="text-blue-600 flex-shrink-0" size={24} />
          <div>
            <h4 className="font-semibold text-blue-900 mb-2">Key Insights ({latestYear})</h4>
            <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
              <li>
                <strong>MoneyMarket dominance:</strong> {latestYearFlows.find(d => d.fund_type === 'MoneyMarket')?.net_flow_usd_mn &&
                  `$${((latestYearFlows.find(d => d.fund_type === 'MoneyMarket')!.net_flow_usd_mn! / 1000)).toFixed(1)}bn inflow - investors seeking safety and liquidity`}
              </li>
              <li>
                <strong>Index funds growth:</strong> {latestYearFlows.find(d => d.fund_type === 'Index')?.net_flow_usd_mn &&
                  `$${((latestYearFlows.find(d => d.fund_type === 'Index')!.net_flow_usd_mn! / 1000)).toFixed(1)}bn - passive investing trend continues`}
              </li>
              <li>
                <strong>Overall sentiment:</strong> {latestTotalFlow >= 0 ?
                  `Strong net inflow of $${(latestTotalFlow / 1000).toFixed(1)}bn indicates robust investor confidence` :
                  `Net outflow of $${Math.abs(latestTotalFlow / 1000).toFixed(1)}bn signals caution`}
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default D4FundFlowsDashboard;
