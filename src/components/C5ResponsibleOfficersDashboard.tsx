import React, { useState, useMemo } from 'react';
import { Shield, TrendingUp, Award, Users } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useC4AnnualData, useC5AnnualData, useC5QuarterlyData } from '../hooks/useSFCStatistics';

const C5ResponsibleOfficersDashboard: React.FC = () => {
  const { data: annualData, isLoading: loadingAnnual } = useC5AnnualData(50);
  const { data: quarterlyData, isLoading: loadingQuarterly } = useC5QuarterlyData(12);
  const { data: c4AnnualData, isLoading: loadingC4 } = useC4AnnualData(50); // For RO-to-LR ratio
  const [yearRange, setYearRange] = useState({ start: 2010, end: 2025 });
  const [viewMode, setViewMode] = useState<'charts' | 'table'>('charts');

  const isLoading = loadingAnnual || loadingQuarterly || loadingC4;

  // Get latest quarterly record
  const latestQuarterly = useMemo(() => {
    if (!quarterlyData.length) return null;
    return quarterlyData[0];
  }, [quarterlyData]);

  // Calculate QoQ changes
  const qoqChanges = useMemo(() => {
    if (quarterlyData.length < 2) return null;

    const latest = quarterlyData[0];
    const previous = quarterlyData[1];

    return {
      totalChange: latest.ro_total && previous.ro_total
        ? ((latest.ro_total - previous.ro_total) / previous.ro_total) * 100
        : 0,
      ra9Change: latest.ra9 && previous.ra9
        ? ((latest.ra9 - previous.ra9) / previous.ra9) * 100
        : 0,
      ra4Change: latest.ra4 && previous.ra4
        ? ((latest.ra4 - previous.ra4) / previous.ra4) * 100
        : 0,
    };
  }, [quarterlyData]);

  // Filter annual data by year range
  const filteredAnnualData = useMemo(() => {
    return annualData.filter(d => d.year >= yearRange.start && d.year <= yearRange.end);
  }, [annualData, yearRange]);

  // Filter quarterly data by year range
  const filteredQuarterlyData = useMemo(() => {
    return quarterlyData.filter(d => d.year >= yearRange.start && d.year <= yearRange.end);
  }, [quarterlyData, yearRange]);

  // Multi-series line chart: Top RAs for RO/AO (combined annual + quarterly)
  const roTrendsData = useMemo(() => {
    const annual = filteredAnnualData.map(d => ({
      period: String(d.year),
      year: d.year,
      quarter: null,
      RA1: d.ra1 || 0,
      RA2: d.ra2 || 0,
      RA4: d.ra4 || 0,
      RA6: d.ra6 || 0,
      RA9: d.ra9 || 0,
    }));

    const quarterly = filteredQuarterlyData.map(d => ({
      period: `${d.year} Q${d.quarter}`,
      year: d.year,
      quarter: d.quarter,
      RA1: d.ra1 || 0,
      RA2: d.ra2 || 0,
      RA4: d.ra4 || 0,
      RA6: d.ra6 || 0,
      RA9: d.ra9 || 0,
    }));

    return [...annual, ...quarterly].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return (a.quarter || 0) - (b.quarter || 0);
    });
  }, [filteredAnnualData, filteredQuarterlyData]);

  // Stacked area: Total RO growth (combined annual + quarterly)
  const totalROGrowthData = useMemo(() => {
    const annual = filteredAnnualData.map(d => ({
      period: String(d.year),
      year: d.year,
      quarter: null,
      total: d.ro_total || 0,
      dealing: (d.ra1 || 0) + (d.ra2 || 0),
      advising: (d.ra4 || 0) + (d.ra5 || 0) + (d.ra6 || 0),
      assetMgmt: d.ra9 || 0,
      other: (d.ra3 || 0) + (d.ra7 || 0) + (d.ra8 || 0) + (d.ra10 || 0) + (d.ra13 || 0),
    }));

    const quarterly = filteredQuarterlyData.map(d => ({
      period: `${d.year} Q${d.quarter}`,
      year: d.year,
      quarter: d.quarter,
      total: d.ro_total || 0,
      dealing: (d.ra1 || 0) + (d.ra2 || 0),
      advising: (d.ra4 || 0) + (d.ra5 || 0) + (d.ra6 || 0),
      assetMgmt: d.ra9 || 0,
      other: (d.ra3 || 0) + (d.ra7 || 0) + (d.ra8 || 0) + (d.ra10 || 0) + (d.ra13 || 0),
    }));

    return [...annual, ...quarterly].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return (a.quarter || 0) - (b.quarter || 0);
    });
  }, [filteredAnnualData, filteredQuarterlyData]);

  // RO growth rate (combined annual + quarterly)
  const roGrowthRateData = useMemo(() => {
    const annual = filteredAnnualData.map(d => ({
      period: String(d.year),
      year: d.year,
      quarter: null,
      total: d.ro_total || 0,
    }));

    const quarterly = filteredQuarterlyData.map(d => ({
      period: `${d.year} Q${d.quarter}`,
      year: d.year,
      quarter: d.quarter,
      total: d.ro_total || 0,
    }));

    const combined = [...annual, ...quarterly].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return (a.quarter || 0) - (b.quarter || 0);
    });

    return combined.map((d, idx) => {
      const total = d.total;
      const prevPeriodChange = idx > 0 && combined[idx - 1].total
        ? ((total - combined[idx - 1].total) / combined[idx - 1].total) * 100
        : 0;

      return {
        ...d,
        periodChange: prevPeriodChange,
      };
    });
  }, [filteredAnnualData, filteredQuarterlyData]);

  // RA9 dominance in RO vs LR
  const ra9DominanceData = useMemo(() => {
    return filteredAnnualData.map(d => {
      const total = d.ro_total || 0;
      const ra9Count = d.ra9 || 0;
      const ra9Share = total > 0 ? (ra9Count / total) * 100 : 0;

      return {
        year: d.year,
        ra9Count,
        ra9Share,
      };
    }).reverse();
  }, [filteredAnnualData]);

  // NEW: RO-to-LR Ratio Analysis (Span of Control)
  const roToLRRatioData = useMemo(() => {
    if (!c4AnnualData.length) return [];

    const filteredC4 = c4AnnualData.filter(d => d.year >= yearRange.start && d.year <= yearRange.end);
    const filteredC5 = filteredAnnualData;

    return filteredC5.map(c5Row => {
      const c4Row = filteredC4.find(c4 => c4.year === c5Row.year);
      if (!c4Row) return null;

      const ra1Ratio = (c4Row.ra1 && c5Row.ra1 && c5Row.ra1 > 0) ? c4Row.ra1 / c5Row.ra1 : 0;
      const ra4Ratio = (c4Row.ra4 && c5Row.ra4 && c5Row.ra4 > 0) ? c4Row.ra4 / c5Row.ra4 : 0;
      const ra9Ratio = (c4Row.ra9 && c5Row.ra9 && c5Row.ra9 > 0) ? c4Row.ra9 / c5Row.ra9 : 0;
      const totalRatio = (c4Row.lr_total && c5Row.ro_total && c5Row.ro_total > 0) ? c4Row.lr_total / c5Row.ro_total : 0;

      return {
        year: c5Row.year,
        ra1Ratio,
        ra4Ratio,
        ra9Ratio,
        totalRatio,
      };
    }).filter(d => d !== null).reverse();
  }, [filteredAnnualData, c4AnnualData, yearRange]);

  // NEW: Total RO vs Total LR over time
  const roVsLRTotalData = useMemo(() => {
    if (!c4AnnualData.length) return [];

    const filteredC4 = c4AnnualData.filter(d => d.year >= yearRange.start && d.year <= yearRange.end);
    const filteredC5 = filteredAnnualData;

    return filteredC5.map(c5Row => {
      const c4Row = filteredC4.find(c4 => c4.year === c5Row.year);
      if (!c4Row) return null;

      return {
        year: c5Row.year,
        totalRO: c5Row.ro_total || 0,
        totalLR: c4Row.lr_total || 0,
      };
    }).filter(d => d !== null).reverse();
  }, [filteredAnnualData, c4AnnualData, yearRange]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading C5 data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      {latestQuarterly && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total RO/AO */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <Shield className="text-purple-600" size={24} />
              <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 px-2 py-1 rounded">
                {latestQuarterly.year} Q{latestQuarterly.quarter}
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {latestQuarterly.ro_total?.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total RO/AO</div>
            {qoqChanges && (
              <div className={`text-xs mt-2 ${qoqChanges.totalChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {qoqChanges.totalChange >= 0 ? '+' : ''}{qoqChanges.totalChange.toFixed(2)}% QoQ
              </div>
            )}
          </div>

          {/* RA9 - Asset Management (Top for RO/AO) */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="text-orange-600" size={24} />
              <span className="text-xs bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300 px-2 py-1 rounded">
                RA9
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {latestQuarterly.ra9?.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Asset Management</div>
            {qoqChanges && (
              <div className={`text-xs mt-2 ${qoqChanges.ra9Change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {qoqChanges.ra9Change >= 0 ? '+' : ''}{qoqChanges.ra9Change.toFixed(2)}% QoQ
              </div>
            )}
          </div>

          {/* RA4 - Advising on Securities */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <Award className="text-blue-600" size={24} />
              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2 py-1 rounded">
                RA4
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {latestQuarterly.ra4?.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Advising on Securities</div>
            {qoqChanges && (
              <div className={`text-xs mt-2 ${qoqChanges.ra4Change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {qoqChanges.ra4Change >= 0 ? '+' : ''}{qoqChanges.ra4Change.toFixed(2)}% QoQ
              </div>
            )}
          </div>

          {/* RA9 Share */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <Users className="text-green-600" size={24} />
              <span className="text-xs bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 px-2 py-1 rounded">
                Share
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {latestQuarterly.ra9 && latestQuarterly.ro_total
                ? ((latestQuarterly.ra9 / latestQuarterly.ro_total) * 100).toFixed(1)
                : '0'}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">RA9 of Total RO/AO</div>
            <div className="text-xs text-gray-500 dark:text-gray-500 mt-2">
              Asset mgmt dominates RO roles
            </div>
          </div>
        </div>
      )}

      {/* Year Range Filter and View Toggle */}
      <div className="flex justify-between items-center bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Year Range:</label>
          <select
            value={yearRange.start}
            onChange={(e) => setYearRange({ ...yearRange, start: parseInt(e.target.value) })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {[2003, 2005, 2010, 2015, 2020].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
          <span className="text-gray-600 dark:text-gray-400">to</span>
          <select
            value={yearRange.end}
            onChange={(e) => setYearRange({ ...yearRange, end: parseInt(e.target.value) })}
            className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          >
            {[2020, 2022, 2024, 2025].map(year => (
              <option key={year} value={year}>{year}</option>
            ))}
          </select>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setViewMode('charts')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'charts'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Charts
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'table'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Table
          </button>
        </div>
      </div>

      {viewMode === 'charts' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: RO/AO Trends by Top RAs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Responsible Officers by Top Regulated Activities
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={roTrendsData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis dataKey="period" stroke="#9CA3AF" fontSize={12} angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="RA9" stroke="#f59e0b" strokeWidth={2} name="RA9 Asset Mgmt" />
                <Line type="monotone" dataKey="RA4" stroke="#8b5cf6" strokeWidth={2} name="RA4 Advising Securities" />
                <Line type="monotone" dataKey="RA1" stroke="#10b981" strokeWidth={2} name="RA1 Dealing Securities" />
                <Line type="monotone" dataKey="RA6" stroke="#ec4899" strokeWidth={1} name="RA6 Corp Finance" />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              RA9 (Asset Management) is #1 for RO/AO, surpassing dealing and advising. Shows senior role focus.
            </p>
          </div>

          {/* Chart 2: Total RO/AO Growth (Stacked Area) */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Total Responsible Officers Growth by Category
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={totalROGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis dataKey="period" stroke="#9CA3AF" fontSize={12} angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area type="monotone" dataKey="assetMgmt" stackId="1" stroke="#f59e0b" fill="#f59e0b" name="Asset Mgmt (RA9)" />
                <Area type="monotone" dataKey="advising" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" name="Advising (RA4-6)" />
                <Area type="monotone" dataKey="dealing" stackId="1" stroke="#10b981" fill="#10b981" name="Dealing (RA1-2)" />
                <Area type="monotone" dataKey="other" stackId="1" stroke="#6b7280" fill="#6b7280" name="Other" />
              </AreaChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              RO/AO workforce grew from 6.7K (2003) to 19.7K (2025 Q3). Nearly 3x growth, led by asset management.
            </p>
          </div>

          {/* Chart 3: YoY Growth Rate */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              RO/AO Period-over-Period Growth Rate
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={roGrowthRateData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis dataKey="period" stroke="#9CA3AF" fontSize={12} angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="periodChange" fill="#8b5cf6" name="Period Growth %" />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              Growth accelerated post-2015, with peaks in 2016-2018. Recent stabilization showing in quarterly data.
            </p>
          </div>

          {/* Chart 4: RO-to-LR Ratio (Span of Control) */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              RO-to-LR Ratios by Activity (Span of Control)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={roToLRRatioData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis dataKey="year" stroke="#9CA3AF" fontSize={12} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#F3F4F6' }}
                  formatter={(value: number) => `${value.toFixed(1)} LR per RO`}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="totalRatio" stroke="#8b5cf6" strokeWidth={2} name="Total (All RAs)" />
                <Line type="monotone" dataKey="ra1Ratio" stroke="#10b981" strokeWidth={1.5} name="RA1 Dealing" />
                <Line type="monotone" dataKey="ra4Ratio" stroke="#3b82f6" strokeWidth={1.5} name="RA4 Advising" />
                <Line type="monotone" dataKey="ra9Ratio" stroke="#f59e0b" strokeWidth={1.5} name="RA9 Asset Mgmt" />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              Supervision ratio: ~3.6 LRs per RO (2025). Lower ratio in RA9 (1.7:1) suggests tighter governance in asset management.
            </p>
          </div>

          {/* Chart 5: Total RO vs Total LR Over Time */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Governance Capacity: Total RO/AO vs Total LR
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={roVsLRTotalData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis dataKey="year" stroke="#9CA3AF" fontSize={12} />
                <YAxis yAxisId="left" stroke="#9CA3AF" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line yAxisId="right" type="monotone" dataKey="totalLR" stroke="#10b981" strokeWidth={2} name="Total LRs (Right Axis)" />
                <Line yAxisId="left" type="monotone" dataKey="totalRO" stroke="#8b5cf6" strokeWidth={2} name="Total RO/AO (Left Axis)" />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              RO/AO grew 193% (6.7K→19.7K) vs LR 37% (52K→71.5K) from 2003-2025. Governance capacity outpaced frontline growth.
            </p>
          </div>

          {/* Chart 6: RA9 Dominance */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Asset Management (RA9) Share of RO/AO
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={ra9DominanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis dataKey="year" stroke="#9CA3AF" fontSize={12} />
                <YAxis yAxisId="left" stroke="#9CA3AF" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line yAxisId="left" type="monotone" dataKey="ra9Count" stroke="#f59e0b" strokeWidth={2} name="RA9 Count" />
                <Line yAxisId="right" type="monotone" dataKey="ra9Share" stroke="#ef4444" strokeWidth={2} name="RA9 Share %" strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              RA9 now represents ~29% of all RO/AO, up from 21% in 2003. Reflects HK's role as asset management hub.
            </p>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead className="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Year</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">RA1</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">RA4</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">RA6</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">RA9</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAnnualData.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{row.year}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 text-right">{row.ra1?.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 text-right">{row.ra4?.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 text-right">{row.ra6?.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 text-right">{row.ra9?.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white text-right">{row.ro_total?.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default C5ResponsibleOfficersDashboard;
