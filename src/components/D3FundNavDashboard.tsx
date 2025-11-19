import React, { useState, useMemo } from 'react';
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, TrendingDown, DollarSign, PieChartIcon, Activity } from 'lucide-react';
import { useD3FundNavByDomicile } from '../hooks/useSFCStatistics';
import { formatUSDMillions } from '../lib/utils';

const D3FundNavDashboard: React.FC = () => {
  const [selectedDateRange, setSelectedDateRange] = useState({ start: 2020, end: 2025 });

  // Fetch data for all three domiciles
  const { data: hkData, isLoading: loadingHK } = useD3FundNavByDomicile('HK', 200);
  const { data: nonHKData, isLoading: loadingNonHK } = useD3FundNavByDomicile('NonHK', 200);
  const { data: allData, isLoading: loadingAll } = useD3FundNavByDomicile('All', 200);

  const isLoading = loadingHK || loadingNonHK || loadingAll;

  // Helper to format date as YYYY-Q#
  const formatQuarter = (dateStr: string) => {
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const quarter = Math.ceil(month / 3);
    return `${year}-Q${quarter}`;
  };

  // Helper to get year from date
  const getYear = (dateStr: string) => new Date(dateStr).getFullYear();

  // Filter data by date range
  const filteredHKData = useMemo(() => {
    return hkData.filter(d => {
      const year = getYear(d.as_at_date);
      return year >= selectedDateRange.start && year <= selectedDateRange.end;
    });
  }, [hkData, selectedDateRange]);

  const filteredNonHKData = useMemo(() => {
    return nonHKData.filter(d => {
      const year = getYear(d.as_at_date);
      return year >= selectedDateRange.start && year <= selectedDateRange.end;
    });
  }, [nonHKData, selectedDateRange]);

  const filteredAllData = useMemo(() => {
    return allData.filter(d => {
      const year = getYear(d.as_at_date);
      return year >= selectedDateRange.start && year <= selectedDateRange.end;
    });
  }, [allData, selectedDateRange]);

  // Latest quarter data
  const latestDate = useMemo(() => {
    if (hkData.length === 0) return null;
    return hkData[0].as_at_date; // Already sorted desc
  }, [hkData]);

  const latestHKData = useMemo(() => {
    return hkData.filter(d => d.as_at_date === latestDate);
  }, [hkData, latestDate]);

  const latestNonHKData = useMemo(() => {
    return nonHKData.filter(d => d.as_at_date === latestDate);
  }, [nonHKData, latestDate]);

  const latestAllData = useMemo(() => {
    return allData.filter(d => d.as_at_date === latestDate);
  }, [allData, latestDate]);

  // KPI Cards
  const latestHKTotal = latestHKData.find(d => d.fund_type === 'Total')?.nav_usd_mn || 0;
  const latestNonHKTotal = latestNonHKData.find(d => d.fund_type === 'Total')?.nav_usd_mn || 0;
  const latestAllTotal = latestAllData.find(d => d.fund_type === 'Total')?.nav_usd_mn || 0;

  const prevQuarterDate = useMemo(() => {
    if (hkData.length < 11) return null;
    return hkData[10].as_at_date; // 10 fund types per quarter, so index 10 is previous quarter
  }, [hkData]);

  const prevHKTotal = hkData.find(d => d.as_at_date === prevQuarterDate && d.fund_type === 'Total')?.nav_usd_mn || 0;
  const qoqHKChange = prevHKTotal > 0 ? ((latestHKTotal - prevHKTotal) / prevHKTotal) * 100 : 0;

  const prevNonHKTotal = nonHKData.find(d => d.as_at_date === prevQuarterDate && d.fund_type === 'Total')?.nav_usd_mn || 0;
  const qoqNonHKChange = prevNonHKTotal > 0 ? ((latestNonHKTotal - prevNonHKTotal) / prevNonHKTotal) * 100 : 0;

  // Chart 1: NAV by Domicile (HK vs Non-HK vs All) - Time Series
  const navByDomicileData = useMemo(() => {
    // Group by quarter
    const dateMap = new Map<string, any>();

    filteredHKData.forEach(d => {
      if (d.fund_type !== 'Total') return;
      const quarter = formatQuarter(d.as_at_date);
      if (!dateMap.has(quarter)) {
        dateMap.set(quarter, { quarter, date: d.as_at_date });
      }
      dateMap.get(quarter)!.HK = d.nav_usd_mn || 0;
    });

    filteredNonHKData.forEach(d => {
      if (d.fund_type !== 'Total') return;
      const quarter = formatQuarter(d.as_at_date);
      if (!dateMap.has(quarter)) {
        dateMap.set(quarter, { quarter, date: d.as_at_date });
      }
      dateMap.get(quarter)!.NonHK = d.nav_usd_mn || 0;
    });

    filteredAllData.forEach(d => {
      if (d.fund_type !== 'Total') return;
      const quarter = formatQuarter(d.as_at_date);
      if (!dateMap.has(quarter)) {
        dateMap.set(quarter, { quarter, date: d.as_at_date });
      }
      dateMap.get(quarter)!.All = d.nav_usd_mn || 0;
    });

    return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredHKData, filteredNonHKData, filteredAllData]);

  // Chart 2: NAV by Fund Type (HK-domiciled) - Stacked Area
  const navByTypeHKData = useMemo(() => {
    const dateMap = new Map<string, any>();

    filteredHKData.forEach(d => {
      if (d.fund_type === 'Total') return; // Exclude total
      const quarter = formatQuarter(d.as_at_date);
      if (!dateMap.has(quarter)) {
        dateMap.set(quarter, { quarter, date: d.as_at_date });
      }
      dateMap.get(quarter)![d.fund_type] = d.nav_usd_mn || 0;
    });

    return Array.from(dateMap.values()).sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredHKData]);

  // Chart 3: Latest Quarter - HK-domiciled NAV share by type (Pie Chart)
  const latestHKByType = useMemo(() => {
    return latestHKData
      .filter(d => d.fund_type !== 'Total' && (d.nav_usd_mn || 0) > 0)
      .map(d => ({
        name: d.fund_type,
        value: d.nav_usd_mn || 0
      }))
      .sort((a, b) => b.value - a.value);
  }, [latestHKData]);

  const COLORS = [
    '#8b5cf6', '#3b82f6', '#10b981', '#f59e0b', '#ef4444',
    '#ec4899', '#14b8a6', '#f97316', '#a855f7', '#06b6d4'
  ];

  // Chart 4: Index vs Active - Passive Penetration (Index / Total)
  const indexPenetrationData = useMemo(() => {
    const dateMap = new Map<string, any>();

    filteredHKData.forEach(d => {
      const quarter = formatQuarter(d.as_at_date);
      if (!dateMap.has(quarter)) {
        dateMap.set(quarter, { quarter, date: d.as_at_date, index: 0, total: 0 });
      }
      const entry = dateMap.get(quarter)!;
      if (d.fund_type === 'Index') {
        entry.index = d.nav_usd_mn || 0;
      }
      if (d.fund_type === 'Total') {
        entry.total = d.nav_usd_mn || 0;
      }
    });

    return Array.from(dateMap.values())
      .map(d => ({
        quarter: d.quarter,
        date: d.date,
        penetration: d.total > 0 ? (d.index / d.total) * 100 : 0
      }))
      .sort((a, b) => a.date.localeCompare(b.date));
  }, [filteredHKData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-lg">Loading D3 Fund NAV data...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            D3: Fund Industry Asset Base
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Net Asset Value of Authorised Unit Trusts and Mutual Funds
          </p>
        </div>
        <div className="flex gap-2">
          <select
            className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            value={selectedDateRange.start}
            onChange={(e) => setSelectedDateRange({ ...selectedDateRange, start: parseInt(e.target.value) })}
          >
            {[2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <span className="py-2 text-gray-600 dark:text-gray-400">to</span>
          <select
            className="px-3 py-2 border border-gray-200 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            value={selectedDateRange.end}
            onChange={(e) => setSelectedDateRange({ ...selectedDateRange, end: parseInt(e.target.value) })}
          >
            {[2023, 2024, 2025, 2026].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-4">
          <div className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">HK Domiciled NAV</p>
                <p className="text-2xl font-bold text-purple-900">
                  {formatUSDMillions(latestHKTotal)}
                </p>
                <p className={`text-xs flex items-center gap-1 mt-1 ${qoqHKChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {qoqHKChange >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {qoqHKChange.toFixed(2)}% QoQ
                </p>
              </div>
              <DollarSign className="text-purple-600" size={32} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-4">
          <div className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Non-HK Domiciled NAV</p>
                <p className="text-2xl font-bold text-blue-900">
                  {formatUSDMillions(latestNonHKTotal)}
                </p>
                <p className={`text-xs flex items-center gap-1 mt-1 ${qoqNonHKChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {qoqNonHKChange >= 0 ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                  {qoqNonHKChange.toFixed(2)}% QoQ
                </p>
              </div>
              <DollarSign className="text-blue-600" size={32} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 border border-green-200 rounded-lg p-4">
          <div className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Total NAV (All)</p>
                <p className="text-2xl font-bold text-green-900">
                  {formatUSDMillions(latestAllTotal)}
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  As of {latestDate ? formatQuarter(latestDate) : 'N/A'}
                </p>
              </div>
              <Activity className="text-green-600" size={32} />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-orange-50 to-orange-100 border border-orange-200 rounded-lg p-4">
          <div className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">HK Market Share</p>
                <p className="text-2xl font-bold text-orange-900">
                  {latestAllTotal > 0 ? ((latestHKTotal / latestAllTotal) * 100).toFixed(1) : 0}%
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                  Of total authorised funds
                </p>
              </div>
              <PieChartIcon className="text-orange-600" size={32} />
            </div>
          </div>
        </div>
      </div>

      {/* Chart 1: NAV by Domicile - Time Series */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
        <div className="mb-2">
          <h3 className="flex items-center gap-2">
            <TrendingUp className="text-purple-600" size={20} />
            NAV Growth Trajectory: HK vs Non-HK vs All Domiciles
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Shows the evolution of fund NAV by domicile. Non-HK funds dominate the market with $2.4 trillion in assets.
          </p>
        </div>
        <div className="p-4">
          <ResponsiveContainer width="100%" height={350}>
            <LineChart data={navByDomicileData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="quarter" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} label={{ value: 'NAV (US$ millions)', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                formatter={(value: any) => [formatUSDMillions(value), '']}
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px' }}
              />
              <Legend />
              <Line type="monotone" dataKey="HK" stroke="#8b5cf6" strokeWidth={2} name="HK Domiciled" dot={{ r: 3 }} />
              <Line type="monotone" dataKey="NonHK" stroke="#3b82f6" strokeWidth={2} name="Non-HK Domiciled" dot={{ r: 3 }} />
              <Line type="monotone" dataKey="All" stroke="#10b981" strokeWidth={2} name="All Funds" dot={{ r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts 2 & 3 Side by Side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 2: NAV by Fund Type (HK) - Stacked Area */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
          <div className="mb-2">
            <h3 className="flex items-center gap-2">
              <Activity className="text-blue-600" size={20} />
              HK-Domiciled Asset Allocation by Fund Type
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Stacked view showing evolution of bond, equity, mixed, and other fund categories.
            </p>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={navByTypeHKData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="quarter" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  formatter={(value: any) => [formatUSDMillions(value, { decimals: 2 })]}
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Area type="monotone" dataKey="Equity" stackId="1" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.8} />
                <Area type="monotone" dataKey="Bond" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.8} />
                <Area type="monotone" dataKey="Index" stackId="1" stroke="#10b981" fill="#10b981" fillOpacity={0.8} />
                <Area type="monotone" dataKey="MoneyMarket" stackId="1" stroke="#f59e0b" fill="#f59e0b" fillOpacity={0.8} />
                <Area type="monotone" dataKey="Mixed" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.8} />
                <Area type="monotone" dataKey="Hedge" stackId="1" stroke="#ec4899" fill="#ec4899" fillOpacity={0.6} />
                <Area type="monotone" dataKey="Guaranteed" stackId="1" stroke="#14b8a6" fill="#14b8a6" fillOpacity={0.6} />
                <Area type="monotone" dataKey="Feeder" stackId="1" stroke="#a855f7" fill="#a855f7" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 3: Latest Quarter Pie Chart */}
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
          <div className="mb-2">
            <h3 className="flex items-center gap-2">
              <PieChartIcon className="text-green-600" size={20} />
              HK Fund NAV by Type ({latestDate ? formatQuarter(latestDate) : 'Latest'})
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Current distribution of HK-domiciled fund assets across fund types.
            </p>
          </div>
          <div className="p-4">
            <ResponsiveContainer width="100%" height={350}>
              <PieChart>
                <Pie
                  data={latestHKByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {latestHKByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value: any) => [formatUSDMillions(value, { decimals: 2 })]}
                  contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Chart 4: Index Penetration */}
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg p-4">
        <div className="mb-2">
          <h3 className="flex items-center gap-2">
            <TrendingUp className="text-orange-600" size={20} />
            Passive (Index) Fund Penetration - HK Domiciled
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Index fund NAV as percentage of total HK-domiciled fund NAV. Rising trend indicates growing preference for passive investing.
          </p>
        </div>
        <div className="p-4">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={indexPenetrationData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="quarter" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} label={{ value: 'Index Penetration (%)', angle: -90, position: 'insideLeft' }} />
              <Tooltip
                formatter={(value: any) => [`${value.toFixed(2)}%`]}
                contentStyle={{ backgroundColor: 'rgba(255, 255, 255, 0.95)', borderRadius: '8px' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="penetration"
                stroke="#f59e0b"
                strokeWidth={3}
                name="Index Fund Penetration (%)"
                dot={{ r: 4, fill: '#f59e0b' }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default D3FundNavDashboard;
