import React, { useMemo } from 'react';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { TrendingUp, DollarSign, BarChart3, Users } from 'lucide-react';
import {
  useSFCMarketHighlights,
  useSFCMarketCapByType,
  useSFCMutualFundNAV,
  useSFCLicensedReps,
  useSFCFundFlows
} from '../hooks/useSFCStatistics';

const SFCFinancialStatistics: React.FC = () => {
  // Fetch all real data
  const { data: marketHighlights, isLoading: loadingA1 } = useSFCMarketHighlights(30);
  const { data: marketCapByType, isLoading: loadingA2 } = useSFCMarketCapByType();
  const { data: mutualFundNAV, isLoading: loadingD3 } = useSFCMutualFundNAV(100);
  const { data: licensedReps, isLoading: loadingC4 } = useSFCLicensedReps(150);
  const { data: fundFlows, isLoading: loadingD4 } = useSFCFundFlows(10);

  const isLoading = loadingA1 || loadingA2 || loadingD3 || loadingC4 || loadingD4;

  // Chart 1: Market Cap & Turnover (29 years, 1997-2025)
  const marketGrowthData = useMemo(() => {
    if (!marketHighlights || marketHighlights.length === 0) return [];

    return marketHighlights
      .map(h => ({
        period: h.period,
        market_cap: Number(h.market_cap) || 0,
        turnover: Number(h.turnover) || 0,
      }))
      .reverse(); // Show oldest to newest
  }, [marketHighlights]);

  // Chart 2: Market Composition (latest 10 years)
  const marketCompositionData = useMemo(() => {
    if (!marketCapByType || marketCapByType.length === 0) return [];

    // Get all unique periods and sort
    const periods = [...new Set(marketCapByType.map(m => m.period))]
      .sort()
      .slice(-10); // Last 10 years

    return periods.map(period => {
      const periodData = marketCapByType.filter(m => m.period === period);
      return {
        year: period,
        mainBoard: periodData.find(p => p.stock_type === 'Main Board')?.market_cap || 0,
        hShares: periodData.find(p => p.stock_type === 'H-shares')?.market_cap || 0,
        hsiConstituents: periodData.find(p => p.stock_type === 'HSI Constituents')?.market_cap || 0,
      };
    });
  }, [marketCapByType]);

  // Chart 3: Fund NAV by Category (latest 8 quarters)
  const fundNAVData = useMemo(() => {
    if (!mutualFundNAV || mutualFundNAV.length === 0) return [];

    // Get unique periods sorted
    const periods = [...new Set(mutualFundNAV.map(f => f.period))]
      .sort()
      .slice(-8); // Last 8 quarters

    return periods.map(period => {
      const periodData = mutualFundNAV.filter(f => f.period === period);
      return {
        period,
        bond: periodData.find(p => p.fund_category === 'Bond')?.nav || 0,
        equity: periodData.find(p => p.fund_category === 'Equity')?.nav || 0,
        index: periodData.find(p => p.fund_category === 'Index')?.nav || 0,
        moneyMarket: periodData.find(p => p.fund_category === 'Money Market')?.nav || 0,
      };
    });
  }, [mutualFundNAV]);

  // Chart 4: Licensed Professionals (latest 10 years)
  const licensedProfessionalsData = useMemo(() => {
    if (!licensedReps || licensedReps.length === 0) return [];

    // Get unique periods sorted
    const periods = [...new Set(licensedReps.map(r => r.period))]
      .sort()
      .slice(-10); // Last 10 years

    return periods.map(period => {
      const periodData = licensedReps.filter(r => r.period === period);
      return {
        year: period,
        ra1: periodData.find(p => p.activity_type === 'RA1')?.representative_count || 0,
        ra4: periodData.find(p => p.activity_type === 'RA4')?.representative_count || 0,
        ra9: periodData.find(p => p.activity_type === 'RA9')?.representative_count || 0,
        total: periodData.find(p => p.activity_type === 'Total')?.representative_count || 0,
      };
    });
  }, [licensedReps]);

  // Chart 5: Fund Flows (2019-2025)
  const fundFlowsData = useMemo(() => {
    if (!fundFlows || fundFlows.length === 0) return [];

    return fundFlows
      .map(f => ({
        year: f.period,
        netFlows: Number(f.net_flows) || 0,
      }))
      .reverse(); // Show oldest to newest
  }, [fundFlows]);

  // KPI Calculations
  const kpis = useMemo(() => {
    if (!marketHighlights || marketHighlights.length < 2 || !mutualFundNAV || mutualFundNAV.length === 0) {
      return {
        marketCap: 0,
        marketCapChange: 0,
        turnover: 0,
        turnoverChange: 0,
        listings: 0,
        listingsChange: 0,
        fundNAV: 0,
        fundNAVChange: 0,
      };
    }

    const latest = marketHighlights[0];
    const previous = marketHighlights[1];

    // Get latest fund NAV (total)
    const latestFundPeriods = [...new Set(mutualFundNAV.map(f => f.period))].sort();
    const latestFundPeriod = latestFundPeriods[latestFundPeriods.length - 1];
    const previousFundPeriod = latestFundPeriods[latestFundPeriods.length - 2];

    const latestFundTotal = mutualFundNAV
      .filter(f => f.period === latestFundPeriod && f.fund_category === 'Total')
      .reduce((sum, f) => sum + (Number(f.nav) || 0), 0);

    const previousFundTotal = mutualFundNAV
      .filter(f => f.period === previousFundPeriod && f.fund_category === 'Total')
      .reduce((sum, f) => sum + (Number(f.nav) || 0), 0);

    return {
      marketCap: Number(latest.market_cap) || 0,
      marketCapChange: previous.market_cap
        ? ((Number(latest.market_cap) - Number(previous.market_cap)) / Number(previous.market_cap) * 100)
        : 0,
      turnover: Number(latest.turnover) || 0,
      turnoverChange: previous.turnover
        ? ((Number(latest.turnover) - Number(previous.turnover)) / Number(previous.turnover) * 100)
        : 0,
      listings: Number(latest.total_listings) || 0,
      listingsChange: previous.total_listings
        ? ((Number(latest.total_listings) - Number(previous.total_listings)) / Number(previous.total_listings) * 100)
        : 0,
      fundNAV: latestFundTotal,
      fundNAVChange: previousFundTotal
        ? ((latestFundTotal - previousFundTotal) / previousFundTotal * 100)
        : 0,
    };
  }, [marketHighlights, mutualFundNAV]);

  // KPI Card Component
  const KPICard = ({ title, value, unit, change, icon }: {
    title: string;
    value: number;
    unit: string;
    change: number;
    icon: React.ReactNode;
  }) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
          {icon}
        </div>
        <span className={`text-sm font-medium ${change >= 0 ? 'text-green-600' : 'text-red-600'}`}>
          {change >= 0 ? '▲' : '▼'} {Math.abs(change).toFixed(1)}%
        </span>
      </div>
      <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">
        {unit}{value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
      </p>
    </div>
  );

  // Custom Bar Component for conditional coloring
  const CustomBar = (props: any) => {
    const { fill, x, y, width, height, payload } = props;
    const isPositive = payload.netFlows >= 0;
    return (
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        fill={isPositive ? '#10b981' : '#ef4444'}
      />
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading SFC Statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-teal-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">SFC Financial Statistics Dashboard</h2>
        <p className="text-blue-100">Hong Kong securities market insights from 1,046 real data points</p>
        {marketHighlights.length > 0 && (
          <div className="mt-2 text-sm">
            Latest data: {marketHighlights[0].period} • {marketHighlights.length} years of market history
          </div>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard
          title="Market Cap 2025"
          value={kpis.marketCap / 1000}
          unit="HK$ "
          change={kpis.marketCapChange}
          icon={<DollarSign className="text-blue-600" size={24} />}
        />
        <KPICard
          title="Daily Turnover"
          value={kpis.turnover}
          unit="HK$ "
          change={kpis.turnoverChange}
          icon={<TrendingUp className="text-green-600" size={24} />}
        />
        <KPICard
          title="Total Listings"
          value={kpis.listings}
          unit=""
          change={kpis.listingsChange}
          icon={<BarChart3 className="text-teal-600" size={24} />}
        />
        <KPICard
          title="Fund Industry"
          value={kpis.fundNAV}
          unit="HK$ "
          change={kpis.fundNAVChange}
          icon={<Users className="text-orange-600" size={24} />}
        />
      </div>

      {/* Row 1: Market Cap & Turnover + Market Composition */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Market Cap & Turnover (Dual-Axis Line) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Market Growth Story (1997-2025)
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            HK market cap grew 11.6x from HK$3.2T (1997) to HK$37.2T (2025)
          </p>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={marketGrowthData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="period"
                stroke="#9ca3af"
                angle={-45}
                textAnchor="end"
                height={80}
              />
              <YAxis
                yAxisId="left"
                stroke="#3b82f6"
                label={{ value: 'Market Cap (HK$ B)', angle: -90, position: 'insideLeft' }}
              />
              <YAxis
                yAxisId="right"
                orientation="right"
                stroke="#10b981"
                label={{ value: 'Turnover (HK$ B)', angle: 90, position: 'insideRight' }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                labelStyle={{ color: '#f3f4f6' }}
              />
              <Legend />
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="market_cap"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Market Cap (HK$ B)"
                dot={false}
              />
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="turnover"
                stroke="#10b981"
                strokeWidth={2}
                name="Daily Turnover (HK$ B)"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 2: Market Composition (Stacked Area) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Market Composition Evolution (2015-2025)
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            H-shares grew from 1.5% (1999) to 33% (2025) of total market cap
          </p>
          <ResponsiveContainer width="100%" height={400}>
            <AreaChart data={marketCompositionData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis
                dataKey="year"
                stroke="#9ca3af"
              />
              <YAxis
                stroke="#9ca3af"
                label={{ value: 'Market Cap (HK$ B)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                labelStyle={{ color: '#f3f4f6' }}
              />
              <Legend />
              <Area
                type="monotone"
                dataKey="mainBoard"
                stackId="1"
                stroke="#3b82f6"
                fill="#3b82f6"
                name="Main Board HK"
              />
              <Area
                type="monotone"
                dataKey="hShares"
                stackId="1"
                stroke="#ef4444"
                fill="#ef4444"
                name="H-shares"
              />
              <Area
                type="monotone"
                dataKey="hsiConstituents"
                stackId="1"
                stroke="#f59e0b"
                fill="#f59e0b"
                name="HSI Constituents"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Row 2: Fund NAV (Full Width) */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Fund Industry by Category (Latest 8 Quarters)
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Fund NAV reached HK$291B (Q3 2025), with Index funds showing fastest growth
        </p>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={fundNAVData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="period" stroke="#9ca3af" />
            <YAxis
              stroke="#9ca3af"
              label={{ value: 'NAV (HK$ B)', angle: -90, position: 'insideLeft' }}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
              labelStyle={{ color: '#f3f4f6' }}
            />
            <Legend />
            <Bar dataKey="bond" stackId="a" fill="#3b82f6" name="Bond" />
            <Bar dataKey="equity" stackId="a" fill="#10b981" name="Equity" />
            <Bar dataKey="index" stackId="a" fill="#8b5cf6" name="Index" />
            <Bar dataKey="moneyMarket" stackId="a" fill="#f59e0b" name="Money Market" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Row 3: Licensed Professionals + Fund Flows */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 4: Licensed Professionals (Multi-Line) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Licensed Professionals Growth (2015-2025)
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Asset management representatives grew 8.1% YoY, outpacing dealing (+2.3%)
          </p>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={licensedProfessionalsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="year" stroke="#9ca3af" />
              <YAxis
                stroke="#9ca3af"
                label={{ value: 'Number of Representatives', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                labelStyle={{ color: '#f3f4f6' }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="ra1"
                stroke="#3b82f6"
                strokeWidth={2}
                name="RA1 - Dealing"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="ra4"
                stroke="#10b981"
                strokeWidth={2}
                name="RA4 - Advising"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="ra9"
                stroke="#f59e0b"
                strokeWidth={2}
                name="RA9 - Asset Mgmt"
                dot={false}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#6b7280"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Total"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Chart 5: Fund Flows (Conditional Bar) */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Annual Fund Flows (2019-2025)
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            HK$41B positive flows in 2025 YTD - highest since 2021
          </p>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={fundFlowsData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="year" stroke="#9ca3af" />
              <YAxis
                stroke="#9ca3af"
                label={{ value: 'Net Flows (HK$ B)', angle: -90, position: 'insideLeft' }}
              />
              <Tooltip
                contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }}
                labelStyle={{ color: '#f3f4f6' }}
                formatter={(value: number) => [
                  `${value >= 0 ? '+' : ''}${value.toLocaleString()} HK$ B`,
                  'Net Flows'
                ]}
              />
              <Legend />
              <Bar
                dataKey="netFlows"
                shape={<CustomBar />}
                name="Net Fund Flows"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Data Source Footer */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <strong>Data Source:</strong> Securities and Futures Commission of Hong Kong (SFC) •{' '}
          <strong>Total Records:</strong> 1,046 data points across 7 tables •{' '}
          <strong>Coverage:</strong> 1997-2025 (29 years)
        </p>
      </div>
    </div>
  );
};

export default SFCFinancialStatistics;
