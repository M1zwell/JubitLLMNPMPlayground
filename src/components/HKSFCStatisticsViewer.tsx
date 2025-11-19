/**
 * HKSFC Statistics Viewer Component
 * Displays SFC market statistics as filterable tables (no charts)
 */

import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Building2,
  PieChart,
  BarChart3,
  DollarSign,
  ArrowRightLeft,
  Activity,
  Search,
  Download,
  Filter
} from 'lucide-react';
import {
  useA1MarketHighlights,
  useA2QuarterlyData,
  useA3QuarterlyData,
  useC4AnnualData,
  useC5AnnualData,
  useD3FundNavData,
  useD4FundFlows
} from '../hooks/useSFCStatistics';
import { formatHKDBillions, formatUSDMillions } from '../lib/utils';

type TabType = 'a1' | 'a2' | 'a3' | 'c4' | 'c5' | 'd3' | 'd4';

export default function HKSFCStatisticsViewer() {
  const [activeTab, setActiveTab] = useState<TabType>('a1');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedYear, setSelectedYear] = useState<string>('all');

  // Fetch data
  const { data: a1Data, isLoading: a1Loading } = useA1MarketHighlights(100);
  const { data: a2Data, isLoading: a2Loading } = useA2QuarterlyData(100);
  const { data: a3Data, isLoading: a3Loading } = useA3QuarterlyData(100);
  const { data: c4Data, isLoading: c4Loading } = useC4AnnualData();
  const { data: c5Data, isLoading: c5Loading } = useC5AnnualData();
  const { data: d3Data, isLoading: d3Loading } = useD3FundNavData(undefined, 1000);
  const { data: d4Data, isLoading: d4Loading } = useD4FundFlows(100);

  const tabs = [
    {
      id: 'a1' as TabType,
      label: 'A1: Market Highlights',
      icon: <TrendingUp size={18} />,
      category: 'Market'
    },
    {
      id: 'a2' as TabType,
      label: 'A2: Market Structure',
      icon: <Building2 size={18} />,
      category: 'Market'
    },
    {
      id: 'a3' as TabType,
      label: 'A3: Market Liquidity',
      icon: <Activity size={18} />,
      category: 'Market'
    },
    {
      id: 'c4' as TabType,
      label: 'C4: Licensed Reps',
      icon: <Building2 size={18} />,
      category: 'Licensees'
    },
    {
      id: 'c5' as TabType,
      label: 'C5: Licence Classes',
      icon: <BarChart3 size={18} />,
      category: 'Licensees'
    },
    {
      id: 'd3' as TabType,
      label: 'D3: Fund NAV',
      icon: <DollarSign size={18} />,
      category: 'Funds'
    },
    {
      id: 'd4' as TabType,
      label: 'D4: Fund Flows',
      icon: <ArrowRightLeft size={18} />,
      category: 'Funds'
    }
  ];

  const marketTabs = tabs.filter(t => t.category === 'Market');
  const licenseeTabs = tabs.filter(t => t.category === 'Licensees');
  const fundTabs = tabs.filter(t => t.category === 'Funds');

  // Export to CSV
  const exportToCSV = () => {
    let data: any[] = [];
    let filename = '';

    switch (activeTab) {
      case 'a1':
        data = a1Data;
        filename = 'a1_market_highlights.csv';
        break;
      case 'a2':
        data = a2Data;
        filename = 'a2_market_structure.csv';
        break;
      case 'a3':
        data = a3Data;
        filename = 'a3_market_liquidity.csv';
        break;
      case 'c4':
        data = c4Data;
        filename = 'c4_licensed_reps.csv';
        break;
      case 'c5':
        data = c5Data;
        filename = 'c5_licence_classes.csv';
        break;
      case 'd3':
        data = d3Data;
        filename = 'd3_fund_nav.csv';
        break;
      case 'd4':
        data = d4Data;
        filename = 'd4_fund_flows.csv';
        break;
    }

    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];

    data.forEach(row => {
      const values = headers.map(header => {
        const value = row[header] !== null && row[header] !== undefined ? row[header] : '';
        return typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
      });
      csvRows.push(values.join(','));
    });

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-8 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-white mb-2 flex items-center gap-3">
              <BarChart3 size={36} />
              SFC Market Statistics - Data Tables
            </h2>
            <p className="text-blue-100 text-lg">
              Filterable data tables from A1, A2, A3, C4, C5, D3, and D4 sources
            </p>
          </div>
          <button
            onClick={exportToCSV}
            className="px-6 py-3 bg-white text-blue-600 rounded-xl font-semibold shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            <Download size={20} />
            Export CSV
          </button>
        </div>
      </div>

      {/* Category Groups */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6 space-y-6">
        {/* Market Statistics (A1, A2, A3) */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
            <TrendingUp size={20} className="text-blue-500" />
            Market Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {marketTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`p-4 rounded-xl font-semibold transition-all flex items-center gap-3 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg transform scale-105'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Licensee Statistics (C4, C5) */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
            <Building2 size={20} className="text-green-500" />
            Licensee Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {licenseeTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`p-4 rounded-xl font-semibold transition-all flex items-center gap-3 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg transform scale-105'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Fund Statistics (D3, D4) */}
        <div>
          <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-3 flex items-center gap-2">
            <PieChart size={20} className="text-purple-500" />
            Fund Statistics
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {fundTabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`p-4 rounded-xl font-semibold transition-all flex items-center gap-3 ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg transform scale-105'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Search and Filter Controls */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-6">
        <div className="flex items-center gap-4 flex-wrap">
          <div className="flex-1 min-w-[300px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                placeholder="Search data..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Filter className="text-gray-600 dark:text-gray-400" size={20} />
            <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">Filters active: {searchTerm ? '1' : '0'}</span>
          </div>
        </div>
      </div>

      {/* Data Table Content */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl overflow-hidden">
        {activeTab === 'a1' && <A1Table data={a1Data} searchTerm={searchTerm} isLoading={a1Loading} />}
        {activeTab === 'a2' && <A2Table data={a2Data} searchTerm={searchTerm} isLoading={a2Loading} />}
        {activeTab === 'a3' && <A3Table data={a3Data} searchTerm={searchTerm} isLoading={a3Loading} />}
        {activeTab === 'c4' && <C4Table data={c4Data} searchTerm={searchTerm} isLoading={c4Loading} />}
        {activeTab === 'c5' && <C5Table data={c5Data} searchTerm={searchTerm} isLoading={c5Loading} />}
        {activeTab === 'd3' && <D3Table data={d3Data} searchTerm={searchTerm} isLoading={d3Loading} />}
        {activeTab === 'd4' && <D4Table data={d4Data} searchTerm={searchTerm} isLoading={d4Loading} />}
      </div>
    </div>
  );
}

// A1 Market Highlights Table
function A1Table({ data, searchTerm, isLoading }: any) {
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter((row: any) =>
      Object.values(row).some(val =>
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  if (isLoading) return <div className="p-12 text-center text-gray-500">Loading...</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-semibold">Quarter</th>
            <th className="px-4 py-3 text-right text-sm font-semibold">Market Cap (HK$bn)</th>
            <th className="px-4 py-3 text-right text-sm font-semibold">Daily Turnover (HK$bn)</th>
            <th className="px-4 py-3 text-right text-sm font-semibold">P/E Ratio</th>
            <th className="px-4 py-3 text-right text-sm font-semibold">Dividend Yield (%)</th>
            <th className="px-4 py-3 text-right text-sm font-semibold">Total Companies</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((row: any, idx: number) => (
            <tr key={idx} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="px-4 py-3 text-sm font-semibold text-gray-800 dark:text-white">{row.quarter}</td>
              <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                {formatHKDBillions(row.market_cap_hkd_bn || 0)}
              </td>
              <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                {formatHKDBillions(row.daily_turnover_hkd_bn || 0)}
              </td>
              <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                {row.pe_ratio?.toFixed(2) || 'N/A'}
              </td>
              <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                {row.dividend_yield?.toFixed(2) || 'N/A'}%
              </td>
              <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                {row.total_companies || 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filteredData.length === 0 && (
        <div className="p-12 text-center text-gray-500">No data found matching your search</div>
      )}
    </div>
  );
}

// A2 Market Structure Table
function A2Table({ data, searchTerm, isLoading }: any) {
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter((row: any) =>
      Object.values(row).some(val =>
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  if (isLoading) return <div className="p-12 text-center text-gray-500">Loading...</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-semibold">Quarter</th>
            <th className="px-4 py-3 text-left text-sm font-semibold">Stock Type</th>
            <th className="px-4 py-3 text-right text-sm font-semibold">Market Cap (HK$bn)</th>
            <th className="px-4 py-3 text-right text-sm font-semibold">Percentage (%)</th>
            <th className="px-4 py-3 text-right text-sm font-semibold">No. of Companies</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((row: any, idx: number) => (
            <tr key={idx} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="px-4 py-3 text-sm font-semibold text-gray-800 dark:text-white">{row.quarter}</td>
              <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.stock_type}</td>
              <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                {formatHKDBillions(row.market_cap_hkd_bn || 0)}
              </td>
              <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                {row.percentage?.toFixed(2) || 'N/A'}%
              </td>
              <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                {row.number_of_companies || 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filteredData.length === 0 && (
        <div className="p-12 text-center text-gray-500">No data found matching your search</div>
      )}
    </div>
  );
}

// A3 Liquidity Table
function A3Table({ data, searchTerm, isLoading }: any) {
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter((row: any) =>
      Object.values(row).some(val =>
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  if (isLoading) return <div className="p-12 text-center text-gray-500">Loading...</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-semibold">Quarter</th>
            <th className="px-4 py-3 text-left text-sm font-semibold">Market Segment</th>
            <th className="px-4 py-3 text-right text-sm font-semibold">Turnover (HK$bn)</th>
            <th className="px-4 py-3 text-right text-sm font-semibold">Percentage (%)</th>
            <th className="px-4 py-3 text-right text-sm font-semibold">Velocity (%)</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((row: any, idx: number) => (
            <tr key={idx} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="px-4 py-3 text-sm font-semibold text-gray-800 dark:text-white">{row.quarter}</td>
              <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.market_segment}</td>
              <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                {formatHKDBillions(row.turnover_hkd_bn || 0)}
              </td>
              <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                {row.percentage?.toFixed(2) || 'N/A'}%
              </td>
              <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                {row.velocity?.toFixed(2) || 'N/A'}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filteredData.length === 0 && (
        <div className="p-12 text-center text-gray-500">No data found matching your search</div>
      )}
    </div>
  );
}

// C4 Licensed Reps Table
function C4Table({ data, searchTerm, isLoading }: any) {
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter((row: any) =>
      Object.values(row).some(val =>
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  if (isLoading) return <div className="p-12 text-center text-gray-500">Loading...</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-semibold">Year</th>
            <th className="px-4 py-3 text-right text-sm font-semibold">Licensed Reps</th>
            <th className="px-4 py-3 text-right text-sm font-semibold">YoY Change</th>
            <th className="px-4 py-3 text-right text-sm font-semibold">YoY Change (%)</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((row: any, idx: number) => (
            <tr key={idx} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="px-4 py-3 text-sm font-semibold text-gray-800 dark:text-white">{row.year}</td>
              <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                {row.licensed_reps?.toLocaleString() || 'N/A'}
              </td>
              <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                {row.yoy_change !== null && row.yoy_change !== undefined
                  ? (row.yoy_change > 0 ? '+' : '') + row.yoy_change.toLocaleString()
                  : 'N/A'}
              </td>
              <td className={`px-4 py-3 text-sm text-right font-semibold ${
                (row.yoy_change_pct || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {row.yoy_change_pct !== null && row.yoy_change_pct !== undefined
                  ? (row.yoy_change_pct > 0 ? '+' : '') + row.yoy_change_pct.toFixed(2) + '%'
                  : 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filteredData.length === 0 && (
        <div className="p-12 text-center text-gray-500">No data found matching your search</div>
      )}
    </div>
  );
}

// C5 Licence Classes Table
function C5Table({ data, searchTerm, isLoading }: any) {
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter((row: any) =>
      Object.values(row).some(val =>
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  if (isLoading) return <div className="p-12 text-center text-gray-500">Loading...</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gradient-to-r from-green-500 to-emerald-500 text-white">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-semibold">Year</th>
            <th className="px-4 py-3 text-left text-sm font-semibold">Licence Class</th>
            <th className="px-4 py-3 text-right text-sm font-semibold">Count</th>
            <th className="px-4 py-3 text-right text-sm font-semibold">YoY Change</th>
            <th className="px-4 py-3 text-right text-sm font-semibold">YoY Change (%)</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((row: any, idx: number) => (
            <tr key={idx} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="px-4 py-3 text-sm font-semibold text-gray-800 dark:text-white">{row.year}</td>
              <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.licence_class}</td>
              <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                {row.count?.toLocaleString() || 'N/A'}
              </td>
              <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                {row.yoy_change !== null && row.yoy_change !== undefined
                  ? (row.yoy_change > 0 ? '+' : '') + row.yoy_change.toLocaleString()
                  : 'N/A'}
              </td>
              <td className={`px-4 py-3 text-sm text-right font-semibold ${
                (row.yoy_change_pct || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {row.yoy_change_pct !== null && row.yoy_change_pct !== undefined
                  ? (row.yoy_change_pct > 0 ? '+' : '') + row.yoy_change_pct.toFixed(2) + '%'
                  : 'N/A'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filteredData.length === 0 && (
        <div className="p-12 text-center text-gray-500">No data found matching your search</div>
      )}
    </div>
  );
}

// D3 Fund NAV Table
function D3Table({ data, searchTerm, isLoading }: any) {
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter((row: any) =>
      Object.values(row).some(val =>
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  if (isLoading) return <div className="p-12 text-center text-gray-500">Loading...</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-semibold">Date</th>
            <th className="px-4 py-3 text-left text-sm font-semibold">Domicile</th>
            <th className="px-4 py-3 text-left text-sm font-semibold">Fund Type</th>
            <th className="px-4 py-3 text-right text-sm font-semibold">NAV (US$mn)</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.slice(0, 100).map((row: any, idx: number) => (
            <tr key={idx} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="px-4 py-3 text-sm font-semibold text-gray-800 dark:text-white">{row.as_at_date}</td>
              <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.domicile}</td>
              <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.fund_type}</td>
              <td className="px-4 py-3 text-sm text-right text-gray-700 dark:text-gray-300">
                {formatUSDMillions(row.nav_usd_mn || 0, { decimals: 1, compact: false })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filteredData.length === 0 && (
        <div className="p-12 text-center text-gray-500">No data found matching your search</div>
      )}
      {filteredData.length > 100 && (
        <div className="p-4 bg-gray-50 dark:bg-gray-700 text-center text-sm text-gray-600 dark:text-gray-400">
          Showing first 100 of {filteredData.length} records. Use search to filter results.
        </div>
      )}
    </div>
  );
}

// D4 Fund Flows Table
function D4Table({ data, searchTerm, isLoading }: any) {
  const filteredData = useMemo(() => {
    if (!searchTerm) return data;
    return data.filter((row: any) =>
      Object.values(row).some(val =>
        String(val).toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [data, searchTerm]);

  if (isLoading) return <div className="p-12 text-center text-gray-500">Loading...</div>;

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <tr>
            <th className="px-4 py-3 text-left text-sm font-semibold">Year</th>
            <th className="px-4 py-3 text-left text-sm font-semibold">Domicile</th>
            <th className="px-4 py-3 text-left text-sm font-semibold">Fund Type</th>
            <th className="px-4 py-3 text-right text-sm font-semibold">Net Flow (US$mn)</th>
          </tr>
        </thead>
        <tbody>
          {filteredData.map((row: any, idx: number) => (
            <tr key={idx} className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700">
              <td className="px-4 py-3 text-sm font-semibold text-gray-800 dark:text-white">{row.year}</td>
              <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.domicile}</td>
              <td className="px-4 py-3 text-sm text-gray-700 dark:text-gray-300">{row.fund_type}</td>
              <td className={`px-4 py-3 text-sm text-right font-semibold ${
                (row.net_flow_usd_mn || 0) >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {formatUSDMillions(row.net_flow_usd_mn || 0, { decimals: 1, compact: false, showSign: true })}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {filteredData.length === 0 && (
        <div className="p-12 text-center text-gray-500">No data found matching your search</div>
      )}
    </div>
  );
}
