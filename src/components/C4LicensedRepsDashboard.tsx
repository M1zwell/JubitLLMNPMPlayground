import React, { useState, useMemo } from 'react';
import { TrendingUp, Users, Activity, BarChart3 } from 'lucide-react';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { useC4AnnualData, useC4QuarterlyData } from '../hooks/useSFCStatistics';

const C4LicensedRepsDashboard: React.FC = () => {
  const { data: annualData, isLoading: loadingAnnual } = useC4AnnualData(50);
  const { data: quarterlyData, isLoading: loadingQuarterly } = useC4QuarterlyData(12);
  const [yearRange, setYearRange] = useState({ start: 2010, end: 2025 });
  const [viewMode, setViewMode] = useState<'charts' | 'table'>('charts');

  const isLoading = loadingAnnual || loadingQuarterly;

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
      totalChange: latest.lr_total && previous.lr_total
        ? ((latest.lr_total - previous.lr_total) / previous.lr_total) * 100
        : 0,
      ra1Change: latest.ra1 && previous.ra1
        ? ((latest.ra1 - previous.ra1) / previous.ra1) * 100
        : 0,
      ra4Change: latest.ra4 && previous.ra4
        ? ((latest.ra4 - previous.ra4) / previous.ra4) * 100
        : 0,
      ra9Change: latest.ra9 && previous.ra9
        ? ((latest.ra9 - previous.ra9) / previous.ra9) * 100
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

  // Multi-series line chart data: All RAs over time (combined annual + quarterly)
  const multiSeriesData = useMemo(() => {
    const annual = filteredAnnualData.map(d => ({
      period: String(d.year),
      year: d.year,
      quarter: null,
      RA1: d.ra1 || 0,
      RA2: d.ra2 || 0,
      RA3: d.ra3 || 0,
      RA4: d.ra4 || 0,
      RA5: d.ra5 || 0,
      RA6: d.ra6 || 0,
      RA7: d.ra7 || 0,
      RA8: d.ra8 || 0,
      RA9: d.ra9 || 0,
      RA10: d.ra10 || 0,
      RA13: d.ra13 || 0,
    }));

    const quarterly = filteredQuarterlyData.map(d => ({
      period: `${d.year} Q${d.quarter}`,
      year: d.year,
      quarter: d.quarter,
      RA1: d.ra1 || 0,
      RA2: d.ra2 || 0,
      RA3: d.ra3 || 0,
      RA4: d.ra4 || 0,
      RA5: d.ra5 || 0,
      RA6: d.ra6 || 0,
      RA7: d.ra7 || 0,
      RA8: d.ra8 || 0,
      RA9: d.ra9 || 0,
      RA10: d.ra10 || 0,
      RA13: d.ra13 || 0,
    }));

    return [...annual, ...quarterly].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return (a.quarter || 0) - (b.quarter || 0);
    });
  }, [filteredAnnualData, filteredQuarterlyData]);

  // Stacked area: Total LR growth over time (combined annual + quarterly)
  const totalLRGrowthData = useMemo(() => {
    const annual = filteredAnnualData.map(d => ({
      period: String(d.year),
      year: d.year,
      quarter: null,
      total: d.lr_total || 0,
      dealing: (d.ra1 || 0) + (d.ra2 || 0) + (d.ra3 || 0),
      advising: (d.ra4 || 0) + (d.ra5 || 0) + (d.ra6 || 0),
      assetMgmt: d.ra9 || 0,
      other: (d.ra7 || 0) + (d.ra8 || 0) + (d.ra10 || 0) + (d.ra13 || 0),
    }));

    const quarterly = filteredQuarterlyData.map(d => ({
      period: `${d.year} Q${d.quarter}`,
      year: d.year,
      quarter: d.quarter,
      total: d.lr_total || 0,
      dealing: (d.ra1 || 0) + (d.ra2 || 0) + (d.ra3 || 0),
      advising: (d.ra4 || 0) + (d.ra5 || 0) + (d.ra6 || 0),
      assetMgmt: d.ra9 || 0,
      other: (d.ra7 || 0) + (d.ra8 || 0) + (d.ra10 || 0) + (d.ra13 || 0),
    }));

    return [...annual, ...quarterly].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return (a.quarter || 0) - (b.quarter || 0);
    });
  }, [filteredAnnualData, filteredQuarterlyData]);

  // Heatmap data: Recent years x Top RAs
  const heatmapData = useMemo(() => {
    const recentYears = filteredAnnualData.slice(0, 10).reverse(); // Last 10 years
    const topRAs = ['RA1', 'RA4', 'RA9', 'RA2', 'RA6']; // Top 5 by volume

    return recentYears.map(d => ({
      year: d.year,
      RA1: d.ra1 || 0,
      RA2: d.ra2 || 0,
      RA4: d.ra4 || 0,
      RA6: d.ra6 || 0,
      RA9: d.ra9 || 0,
    }));
  }, [filteredAnnualData]);

  // RA1 vs RA4 ratio analysis (Dealing vs Advising - combined annual + quarterly)
  const dealingVsAdvisingRatio = useMemo(() => {
    const annual = filteredAnnualData.map(d => {
      const ra1Count = d.ra1 || 0;
      const ra4Count = d.ra4 || 0;
      const ratio = ra4Count > 0 ? ra1Count / ra4Count : 0;

      return {
        period: String(d.year),
        year: d.year,
        quarter: null,
        ra1: ra1Count,
        ra4: ra4Count,
        ratio: ratio,
        ratioPercent: ratio * 100,
      };
    });

    const quarterly = filteredQuarterlyData.map(d => {
      const ra1Count = d.ra1 || 0;
      const ra4Count = d.ra4 || 0;
      const ratio = ra4Count > 0 ? ra1Count / ra4Count : 0;

      return {
        period: `${d.year} Q${d.quarter}`,
        year: d.year,
        quarter: d.quarter,
        ra1: ra1Count,
        ra4: ra4Count,
        ratio: ratio,
        ratioPercent: ratio * 100,
      };
    });

    return [...annual, ...quarterly].sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return (a.quarter || 0) - (b.quarter || 0);
    });
  }, [filteredAnnualData, filteredQuarterlyData]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading C4 data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      {latestQuarterly && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Total LRs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <Users className="text-blue-600" size={24} />
              <span className="text-xs bg-blue-100 dark:bg-blue-900 text-blue-600 dark:text-blue-300 px-2 py-1 rounded">
                {latestQuarterly.year} Q{latestQuarterly.quarter}
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {latestQuarterly.lr_total?.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Licensed Reps</div>
            {qoqChanges && (
              <div className={`text-xs mt-2 ${qoqChanges.totalChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {qoqChanges.totalChange >= 0 ? '+' : ''}{qoqChanges.totalChange.toFixed(2)}% QoQ
              </div>
            )}
          </div>

          {/* RA1 - Dealing in Securities */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="text-green-600" size={24} />
              <span className="text-xs bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 px-2 py-1 rounded">
                RA1
              </span>
            </div>
            <div className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
              {latestQuarterly.ra1?.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Dealing in Securities</div>
            {qoqChanges && (
              <div className={`text-xs mt-2 ${qoqChanges.ra1Change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {qoqChanges.ra1Change >= 0 ? '+' : ''}{qoqChanges.ra1Change.toFixed(2)}% QoQ
              </div>
            )}
          </div>

          {/* RA4 - Advising on Securities */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <Activity className="text-purple-600" size={24} />
              <span className="text-xs bg-purple-100 dark:bg-purple-900 text-purple-600 dark:text-purple-300 px-2 py-1 rounded">
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

          {/* RA9 - Asset Management */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="text-orange-600" size={24} />
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
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Charts
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              viewMode === 'table'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            Table
          </button>
        </div>
      </div>

      {viewMode === 'charts' ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart 1: Multi-series Line - All RAs */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Licensed Representatives by Regulated Activity
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={multiSeriesData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis dataKey="period" stroke="#9CA3AF" fontSize={12} angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line type="monotone" dataKey="RA1" stroke="#10b981" strokeWidth={2} name="RA1 Dealing Securities" />
                <Line type="monotone" dataKey="RA4" stroke="#8b5cf6" strokeWidth={2} name="RA4 Advising Securities" />
                <Line type="monotone" dataKey="RA9" stroke="#f59e0b" strokeWidth={2} name="RA9 Asset Mgmt" />
                <Line type="monotone" dataKey="RA2" stroke="#3b82f6" strokeWidth={1} name="RA2 Futures" />
                <Line type="monotone" dataKey="RA6" stroke="#ec4899" strokeWidth={1} name="RA6 Corp Finance" />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              Top 5 regulated activities shown. RA1 (dealing) and RA4 (advising) dominate.
            </p>
          </div>

          {/* Chart 2: Stacked Area - Total LR Growth */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Total Licensed Representatives Growth by Category
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={totalLRGrowthData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis dataKey="period" stroke="#9CA3AF" fontSize={12} angle={-45} textAnchor="end" height={80} />
                <YAxis stroke="#9CA3AF" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Area type="monotone" dataKey="dealing" stackId="1" stroke="#10b981" fill="#10b981" name="Dealing (RA1-3)" />
                <Area type="monotone" dataKey="advising" stackId="1" stroke="#8b5cf6" fill="#8b5cf6" name="Advising (RA4-6)" />
                <Area type="monotone" dataKey="assetMgmt" stackId="1" stroke="#f59e0b" fill="#f59e0b" name="Asset Mgmt (RA9)" />
                <Area type="monotone" dataKey="other" stackId="1" stroke="#6b7280" fill="#6b7280" name="Other" />
              </AreaChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              Workforce expanded from 52K (2003) to 71K (2025 Q3). Advising & asset management grew fastest.
            </p>
          </div>

          {/* Chart 3: Heatmap Simulation - Top RAs over Recent Years */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Activity Intensity: Top 5 RAs (Recent 10 Years)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={heatmapData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis type="number" stroke="#9CA3AF" fontSize={12} />
                <YAxis type="category" dataKey="year" stroke="#9CA3AF" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="RA1" fill="#10b981" name="RA1" />
                <Bar dataKey="RA4" fill="#8b5cf6" name="RA4" />
                <Bar dataKey="RA9" fill="#f59e0b" name="RA9" />
                <Bar dataKey="RA2" fill="#3b82f6" name="RA2" />
                <Bar dataKey="RA6" fill="#ec4899" name="RA6" />
              </BarChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              Heatmap-style view showing concentration of LRs across top regulated activities.
            </p>
          </div>

          {/* Chart 4: RA1 vs RA4 Ratio Analysis */}
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Dealing vs Advising Ratio (RA1 / RA4)
            </h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={dealingVsAdvisingRatio}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" opacity={0.1} />
                <XAxis dataKey="period" stroke="#9CA3AF" fontSize={12} angle={-45} textAnchor="end" height={80} />
                <YAxis yAxisId="left" stroke="#9CA3AF" fontSize={12} />
                <YAxis yAxisId="right" orientation="right" stroke="#9CA3AF" fontSize={12} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1F2937', border: '1px solid #374151' }}
                  labelStyle={{ color: '#F3F4F6' }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Line yAxisId="left" type="monotone" dataKey="ra1" stroke="#10b981" strokeWidth={2} name="RA1 Dealing" />
                <Line yAxisId="left" type="monotone" dataKey="ra4" stroke="#8b5cf6" strokeWidth={2} name="RA4 Advising" />
                <Line yAxisId="right" type="monotone" dataKey="ratio" stroke="#ef4444" strokeWidth={2} name="RA1/RA4 Ratio" strokeDasharray="5 5" />
              </LineChart>
            </ResponsiveContainer>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              Ratio shows shift from dealing to advising. Ratio decreased from 1.0 (2003) to 1.6 (2025), indicating stronger growth in advising.
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
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">RA2</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">RA4</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">RA9</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total</th>
                </tr>
              </thead>
              <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                {filteredAnnualData.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-white">{row.year}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 text-right">{row.ra1?.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 text-right">{row.ra2?.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 text-right">{row.ra4?.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400 text-right">{row.ra9?.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900 dark:text-white text-right">{row.lr_total?.toLocaleString()}</td>
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

export default C4LicensedRepsDashboard;
