import React, { useState, useEffect } from 'react';
import { BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Download, TrendingUp, Users, DollarSign, FileText, RefreshCw, BarChart3 } from 'lucide-react';

// SFC Statistics Table URLs
const STATISTICS_URLS = {
  'A1': {
    title: 'Highlights of the Hong Kong Stock Market',
    url: 'https://www.sfc.hk/-/media/EN/files/SOM/MarketStatistics/a01x.xlsx',
    description: 'Market cap, turnover, listings, and funds raised'
  },
  'A2': {
    title: 'Market Capitalisation by Stock Type',
    url: 'https://www.sfc.hk/-/media/EN/files/SOM/MarketStatistics/a02x.xlsx',
    description: 'H-shares, Red chips, Main Board, GEM breakdown'
  },
  'A3': {
    title: 'Average Daily Turnover by Stock Type',
    url: 'https://www.sfc.hk/-/media/EN/files/SOM/MarketStatistics/a03x.xlsx',
    description: 'Daily trading volume by stock category'
  },
  'C4': {
    title: 'Licensed Representatives',
    url: 'https://www.sfc.hk/-/media/EN/files/SOM/MarketStatistics/c04x.xlsx',
    description: 'Number of licensed representatives by activity type'
  },
  'C5': {
    title: 'Responsible Officers',
    url: 'https://www.sfc.hk/-/media/EN/files/SOM/MarketStatistics/c05x.xlsx',
    description: 'Number of responsible/approved officers'
  },
  'D3': {
    title: 'Mutual Fund NAV',
    url: 'https://www.sfc.hk/-/media/EN/files/SOM/MarketStatistics/d03x.xlsx',
    description: 'Net asset value of authorized mutual funds'
  }
};

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6', '#f97316'];

interface StatisticsData {
  tableId: string;
  title: string;
  data: any;
  lastUpdated: string;
}

const SFCFinancialStatistics: React.FC = () => {
  const [activeTable, setActiveTable] = useState<string>('A1');
  const [loading, setLoading] = useState<boolean>(false);
  const [statisticsData, setStatisticsData] = useState<Record<string, StatisticsData>>({});
  const [viewMode, setViewMode] = useState<'table' | 'chart'>('chart');

  // Mock data for demonstration (replace with actual scraped data)
  const mockMarketHighlights = [
    { period: 'Q1 2024', marketCap: 32500, turnover: 124, listings: 2580, newListings: 15, fundsRaised: 28 },
    { period: 'Q2 2024', marketCap: 33200, turnover: 132, listings: 2595, newListings: 18, fundsRaised: 35 },
    { period: 'Q3 2024', marketCap: 34100, turnover: 128, listings: 2608, newListings: 12, fundsRaised: 22 },
    { period: 'Q4 2024', marketCap: 35000, turnover: 135, listings: 2620, newListings: 14, fundsRaised: 30 },
    { period: 'Q1 2025', marketCap: 35800, turnover: 140, listings: 2635, newListings: 16, fundsRaised: 33 },
    { period: 'Q2 2025', marketCap: 36500, turnover: 145, listings: 2650, newListings: 19, fundsRaised: 38 },
    { period: 'Q3 2025', marketCap: 37200, turnover: 148, listings: 2665, newListings: 15, fundsRaised: 28 },
  ];

  const mockMarketCapByType = [
    { type: 'Main Board - HK', value: 18500, percentage: 49.7 },
    { type: 'Main Board - H-shares', value: 12300, percentage: 33.1 },
    { type: 'Main Board - Red chips', value: 4200, percentage: 11.3 },
    { type: 'GEM', value: 2200, percentage: 5.9 },
  ];

  const mockLicensedReps = [
    { activity: 'Type 1 - Dealing in securities', count: 45230, change: 2.3 },
    { activity: 'Type 2 - Dealing in futures', count: 12450, change: 1.8 },
    { activity: 'Type 4 - Advising on securities', count: 25680, change: 3.1 },
    { activity: 'Type 5 - Advising on futures', count: 8920, change: 0.9 },
    { activity: 'Type 6 - Advising on corporate finance', count: 5340, change: 2.7 },
    { activity: 'Type 9 - Asset management', count: 15670, change: 4.2 },
  ];

  const mockMutualFundNAV = [
    { category: 'Equity funds', nav: 3245, count: 1230, percentage: 45.2 },
    { category: 'Bond funds', nav: 2180, count: 980, percentage: 30.3 },
    { category: 'Mixed funds', nav: 890, count: 450, percentage: 12.4 },
    { category: 'Money market funds', nav: 520, count: 280, percentage: 7.2 },
    { category: 'Others', nav: 350, count: 190, percentage: 4.9 },
  ];

  const downloadXLSX = (tableId: string) => {
    const url = STATISTICS_URLS[tableId as keyof typeof STATISTICS_URLS]?.url;
    if (url) {
      window.open(url, '_blank');
    }
  };

  const renderStatCard = (title: string, value: string, icon: React.ReactNode, trend?: string) => (
    <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-blue-100 dark:bg-blue-900 rounded-lg">
          {icon}
        </div>
        {trend && (
          <span className={`text-sm font-medium ${trend.startsWith('+') ? 'text-green-600' : 'text-red-600'}`}>
            {trend}
          </span>
        )}
      </div>
      <h3 className="text-gray-600 dark:text-gray-400 text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
    </div>
  );

  const renderTableA1 = () => (
    <div className="space-y-6">
      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {renderStatCard('Market Cap', 'HK$37.2T', <DollarSign className="text-blue-600" size={24} />, '+4.2%')}
        {renderStatCard('Daily Turnover', 'HK$148B', <TrendingUp className="text-green-600" size={24} />, '+3.1%')}
        {renderStatCard('Listed Companies', '2,665', <BarChart3 className="text-purple-600" size={24} />, '+0.6%')}
        {renderStatCard('New Listings (Q3)', '15', <FileText className="text-orange-600" size={24} />, '-21%')}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Market Cap Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Market Capitalisation Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockMarketHighlights}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="period" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
              <Legend />
              <Line type="monotone" dataKey="marketCap" stroke="#3b82f6" strokeWidth={2} name="Market Cap (HK$B)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Turnover Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Average Daily Turnover</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockMarketHighlights}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="period" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
              <Legend />
              <Bar dataKey="turnover" fill="#10b981" name="Turnover (HK$B)" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* New Listings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">New Listings & Funds Raised</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockMarketHighlights}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="period" stroke="#9ca3af" />
              <YAxis yAxisId="left" stroke="#9ca3af" />
              <YAxis yAxisId="right" orientation="right" stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
              <Legend />
              <Line yAxisId="left" type="monotone" dataKey="newListings" stroke="#f59e0b" strokeWidth={2} name="New Listings" />
              <Line yAxisId="right" type="monotone" dataKey="fundsRaised" stroke="#8b5cf6" strokeWidth={2} name="Funds Raised (HK$B)" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Total Listings Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Total Listed Companies</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockMarketHighlights}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="period" stroke="#9ca3af" />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
              <Legend />
              <Line type="monotone" dataKey="listings" stroke="#ef4444" strokeWidth={2} name="Total Listings" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderTableA2 = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Market Capitalisation Distribution</h3>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Pie Chart */}
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={mockMarketCapByType}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ type, percentage }) => `${type}: ${percentage}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="value"
              >
                {mockMarketCapByType.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>

          {/* Bar Chart */}
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={mockMarketCapByType} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis type="number" stroke="#9ca3af" />
              <YAxis dataKey="type" type="category" width={150} stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
              <Bar dataKey="value" fill="#3b82f6" name="Market Cap (HK$B)" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );

  const renderTableC4 = () => (
    <div className="space-y-6">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Licensed Representatives by Activity Type</h3>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={mockLicensedReps} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis type="number" stroke="#9ca3af" />
            <YAxis dataKey="activity" type="category" width={250} stroke="#9ca3af" />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
            <Legend />
            <Bar dataKey="count" fill="#10b981" name="Number of Representatives" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Growth Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Year-over-Year Growth</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-medium">Activity Type</th>
                <th className="px-4 py-3 text-right text-gray-700 dark:text-gray-300 font-medium">Count</th>
                <th className="px-4 py-3 text-right text-gray-700 dark:text-gray-300 font-medium">YoY Change</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {mockLicensedReps.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{item.activity}</td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100">{item.count.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`font-medium ${item.change > 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {item.change > 0 ? '+' : ''}{item.change}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderTableD3 = () => (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Fund NAV Distribution</h3>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={mockMutualFundNAV}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ category, percentage }) => `${category}: ${percentage}%`}
                outerRadius={120}
                fill="#8884d8"
                dataKey="nav"
              >
                {mockMutualFundNAV.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Bar Chart - Fund Count */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Number of Funds by Category</h3>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={mockMutualFundNAV}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="category" stroke="#9ca3af" angle={-45} textAnchor="end" height={100} />
              <YAxis stroke="#9ca3af" />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none', borderRadius: '8px' }} />
              <Bar dataKey="count" fill="#8b5cf6" name="Number of Funds" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-6 shadow-sm border border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Detailed Fund Statistics</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-medium">Category</th>
                <th className="px-4 py-3 text-right text-gray-700 dark:text-gray-300 font-medium">NAV (HK$B)</th>
                <th className="px-4 py-3 text-right text-gray-700 dark:text-gray-300 font-medium">Number of Funds</th>
                <th className="px-4 py-3 text-right text-gray-700 dark:text-gray-300 font-medium">% of Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {mockMutualFundNAV.map((item, index) => (
                <tr key={index} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-3 text-gray-900 dark:text-gray-100">{item.category}</td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100">{item.nav.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100">{item.count.toLocaleString()}</td>
                  <td className="px-4 py-3 text-right text-gray-900 dark:text-gray-100">{item.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeTable) {
      case 'A1':
        return renderTableA1();
      case 'A2':
        return renderTableA2();
      case 'C4':
        return renderTableC4();
      case 'D3':
        return renderTableD3();
      default:
        return renderTableA1();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">SFC Financial Statistics</h2>
        <p className="text-blue-100">Hong Kong securities markets data updated to Q3 2025</p>
        <div className="mt-4 flex items-center gap-2 text-sm">
          <FileText size={16} />
          <span>Data source: Securities and Futures Commission of Hong Kong</span>
        </div>
      </div>

      {/* Table Selector */}
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Select Statistics Table</h3>
          <button
            onClick={() => downloadXLSX(activeTable)}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Download size={16} />
            Download XLSX
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Object.entries(STATISTICS_URLS).map(([id, info]) => (
            <button
              key={id}
              onClick={() => setActiveTable(id)}
              className={`p-4 rounded-lg border-2 text-left transition-all ${
                activeTable === id
                  ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-blue-400'
              }`}
            >
              <div className="font-semibold text-gray-900 dark:text-white mb-1">{id} - {info.title}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{info.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      {renderContent()}

      {/* Data Info */}
      <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          <strong>Note:</strong> Data is currently showing mock/demo values for visualization purposes.
          Click "Download XLSX" to get the latest official data from SFC.
          The actual scraper will populate real data from the downloaded files.
        </p>
      </div>
    </div>
  );
};

export default SFCFinancialStatistics;
