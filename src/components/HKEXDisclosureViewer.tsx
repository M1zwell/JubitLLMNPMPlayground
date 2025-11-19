/**
 * HKEX Disclosure of Interests Viewer Component
 * Display and filter substantial shareholder disclosure data
 */

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Download,
  FileJson,
  FileSpreadsheet,
  Search,
  Building2,
  Calendar,
  Eye,
  Loader2,
  AlertCircle,
  TrendingUp,
  Filter,
  X,
  Users,
  BarChart3,
  RefreshCw
} from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface DisclosureInterest {
  id: string;
  stock_code: string;
  stock_name?: string;
  company_name?: string;
  form_serial_number: string;
  shareholder_name: string;
  shareholder_type?: string;
  shares_long?: number;
  shares_short?: number;
  shares_lending_pool?: number;
  percentage_long?: number;
  percentage_short?: number;
  percentage_lending_pool?: number;
  filing_date: string;
  notice_url?: string;
  search_date?: string;
  scraped_at: string;
}

interface Filters {
  shareholderType: string;
  searchText: string;
  stockCode: string;
  dateFrom: string;
  dateTo: string;
  minPercentage: number;
  sortBy: string;
}

export default function HKEXDisclosureViewer() {
  const [data, setData] = useState<DisclosureInterest[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isScraping, setIsScraping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scrapeStockCode, setScrapeStockCode] = useState('00700');

  const [filters, setFilters] = useState<Filters>({
    shareholderType: 'all',
    searchText: '',
    stockCode: '',
    dateFrom: '',
    dateTo: '',
    minPercentage: 0,
    sortBy: 'percentage-desc'
  });

  const [showFilters, setShowFilters] = useState(true);

  // Fetch data from database
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: disclosures, error: fetchError } = await supabase
        .from('hkex_disclosure_interests')
        .select('*')
        .order('filing_date', { ascending: false })
        .limit(500);

      if (fetchError) throw fetchError;
      setData(disclosures || []);
    } catch (err) {
      console.error('Error fetching disclosure data:', err);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Scrape new data for a stock
  const scrapeDisclosureData = async () => {
    if (!scrapeStockCode) {
      setError('Please enter a stock code');
      return;
    }

    setIsScraping(true);
    setError(null);

    try {
      console.log(`🔍 Scraping disclosure data for ${scrapeStockCode}...`);

      const response = await fetch(`${SUPABASE_URL}/functions/v1/hkex-disclosure-scraper`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          stock_code: scrapeStockCode,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Scraping failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();

      if (result.success) {
        console.log('✅ Scraping completed:', result);
        alert(`Successfully scraped ${result.shareholders_found} shareholders for ${result.stock_name || scrapeStockCode}!`);
        // Refresh data
        await fetchData();
      } else {
        throw new Error(result.error || 'Scraping failed');
      }

    } catch (err) {
      console.error('❌ Scraping error:', err);
      setError((err as Error).message);
    } finally {
      setIsScraping(false);
    }
  };

  // Get all unique shareholder types
  const getAllShareholderTypes = () => {
    const types = new Set<string>();
    data.forEach(d => {
      if (d.shareholder_type) types.add(d.shareholder_type);
    });
    return Array.from(types).sort();
  };

  // Filter and sort data
  const getFilteredData = () => {
    let filtered = [...data];

    if (filters.shareholderType !== 'all') {
      filtered = filtered.filter(d => d.shareholder_type === filters.shareholderType);
    }

    if (filters.searchText) {
      const search = filters.searchText.toLowerCase();
      filtered = filtered.filter(d =>
        d.shareholder_name.toLowerCase().includes(search) ||
        d.stock_name?.toLowerCase().includes(search) ||
        d.stock_code.includes(search)
      );
    }

    if (filters.stockCode) {
      filtered = filtered.filter(d =>
        d.stock_code.includes(filters.stockCode)
      );
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(d =>
        new Date(d.filing_date) >= new Date(filters.dateFrom)
      );
    }

    if (filters.dateTo) {
      filtered = filtered.filter(d =>
        new Date(d.filing_date) <= new Date(filters.dateTo)
      );
    }

    if (filters.minPercentage > 0) {
      filtered = filtered.filter(d =>
        (d.percentage_long || 0) >= filters.minPercentage
      );
    }

    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'percentage-desc':
          return (b.percentage_long || 0) - (a.percentage_long || 0);
        case 'percentage-asc':
          return (a.percentage_long || 0) - (b.percentage_long || 0);
        case 'shares-desc':
          return (b.shares_long || 0) - (a.shares_long || 0);
        case 'shares-asc':
          return (a.shares_long || 0) - (b.shares_long || 0);
        case 'date-desc':
          return new Date(b.filing_date).getTime() - new Date(a.filing_date).getTime();
        case 'date-asc':
          return new Date(a.filing_date).getTime() - new Date(b.filing_date).getTime();
        case 'shareholder':
          return a.shareholder_name.localeCompare(b.shareholder_name);
        case 'stock':
          return a.stock_code.localeCompare(b.stock_code);
        default:
          return 0;
      }
    });

    return filtered;
  };

  const filteredData = getFilteredData();

  const clearFilters = () => {
    setFilters({
      shareholderType: 'all',
      searchText: '',
      stockCode: '',
      dateFrom: '',
      dateTo: '',
      minPercentage: 0,
      sortBy: 'percentage-desc'
    });
  };

  const exportToJSON = () => {
    const dataStr = JSON.stringify(filteredData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hkex-disclosure-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const exportToCSV = () => {
    const headers = ['Stock Code', 'Stock Name', 'Shareholder Name', 'Shares (Long)', 'Percentage (Long)', 'Shares (Short)', 'Filing Date', 'Form Serial Number'];
    const rows = filteredData.map(d => [
      d.stock_code,
      d.stock_name || '',
      d.shareholder_name,
      d.shares_long || 0,
      d.percentage_long || 0,
      d.shares_short || 0,
      d.filing_date,
      d.form_serial_number
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    const dataBlob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hkex-disclosure-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-50 to-pink-50 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="text-teal-500" />
              HKEX Disclosure of Interests
            </h2>
            <p className="text-gray-600 mt-1">Substantial Shareholder Holdings / 主要股东持股</p>
          </div>
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Scrape Panel */}
        <div className="bg-white rounded-lg p-4 border border-teal-200">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">Scrape New Data / 抓取新数据</h3>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={scrapeStockCode}
              onChange={(e) => setScrapeStockCode(e.target.value)}
              placeholder="Stock code (e.g., 00700)"
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 placeholder-gray-500"
              maxLength={5}
            />
            <button
              onClick={scrapeDisclosureData}
              disabled={isScraping}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2 shadow-md hover:shadow-lg transition-all disabled:bg-gray-400"
            >
              {isScraping ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Scraping...
                </>
              ) : (
                <>
                  <Download size={16} />
                  Scrape
                </>
              )}
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
          <div className="bg-white rounded-lg p-4 shadow">
            <p className="text-sm text-gray-600">Total Records</p>
            <p className="text-2xl font-bold text-teal-600">{data.length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <p className="text-sm text-gray-600">Filtered Results</p>
            <p className="text-2xl font-bold text-blue-600">{filteredData.length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <p className="text-sm text-gray-600">Unique Stocks</p>
            <p className="text-2xl font-bold text-green-600">
              {new Set(data.map(d => d.stock_code)).size}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <p className="text-sm text-gray-600">Shareholders</p>
            <p className="text-2xl font-bold text-pink-600">
              {new Set(data.map(d => d.shareholder_name)).size}
            </p>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 font-semibold text-gray-900 hover:text-teal-600 transition-colors"
            >
              <Filter size={18} />
              Filters & Search
              {!showFilters && <span className="text-sm text-gray-500">({filteredData.length} results)</span>}
            </button>
            <div className="flex items-center gap-2">
              {(filters.searchText || filters.stockCode || filters.shareholderType !== 'all' || filters.minPercentage > 0) && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1"
                >
                  <X size={14} />
                  Clear all
                </button>
              )}
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="p-6 bg-gradient-to-br from-gray-50 to-teal-50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
              {/* Search Text */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  <Search size={14} className="inline mr-1" />
                  Search Keywords
                </label>
                <input
                  type="text"
                  value={filters.searchText}
                  onChange={(e) => setFilters({...filters, searchText: e.target.value})}
                  placeholder="Shareholder, stock name..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 placeholder-gray-500"
                />
              </div>

              {/* Stock Code */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  <Building2 size={14} className="inline mr-1" />
                  Stock Code
                </label>
                <input
                  type="text"
                  value={filters.stockCode}
                  onChange={(e) => setFilters({...filters, stockCode: e.target.value})}
                  placeholder="e.g., 00700"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 placeholder-gray-500"
                />
              </div>

              {/* Min Percentage */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  <BarChart3 size={14} className="inline mr-1" />
                  Min Percentage (%)
                </label>
                <input
                  type="number"
                  value={filters.minPercentage || ''}
                  onChange={(e) => setFilters({...filters, minPercentage: e.target.value ? parseFloat(e.target.value) : 0})}
                  placeholder="e.g., 5"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 placeholder-gray-500"
                />
              </div>

              {/* Date From */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  <Calendar size={14} className="inline mr-1" />
                  Filing Date From
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 placeholder-gray-500"
                />
              </div>
            </div>

            {/* Sort and Export */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <label className="text-sm font-semibold text-gray-900">Sort by:</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 text-gray-900 font-medium"
                >
                  <option value="percentage-desc">Percentage (High to Low)</option>
                  <option value="percentage-asc">Percentage (Low to High)</option>
                  <option value="shares-desc">Shares (High to Low)</option>
                  <option value="shares-asc">Shares (Low to High)</option>
                  <option value="date-desc">Filing Date (Newest First)</option>
                  <option value="date-asc">Filing Date (Oldest First)</option>
                  <option value="shareholder">Shareholder Name</option>
                  <option value="stock">Stock Code</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={exportToJSON}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2 text-sm shadow hover:shadow-md transition-all"
                >
                  <FileJson size={14} />
                  Export JSON
                </button>
                <button
                  onClick={exportToCSV}
                  className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2 text-sm shadow hover:shadow-md transition-all"
                >
                  <FileSpreadsheet size={14} />
                  Export CSV
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-2">
          <AlertCircle className="text-red-500" size={20} />
          <p className="text-red-700">Error: {error}</p>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-8 flex items-center justify-center gap-2">
          <Loader2 className="animate-spin text-teal-500" size={24} />
          <p className="text-teal-700">Loading disclosure data...</p>
        </div>
      )}

      {/* Results */}
      {!isLoading && !error && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-semibold text-gray-900">
              Showing {filteredData.length} {filteredData.length === 1 ? 'disclosure' : 'disclosures'}
            </h3>
          </div>

          {filteredData.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow">
              <Users className="mx-auto text-gray-400 mb-2" size={48} />
              <p className="text-gray-500">No disclosure data found</p>
              <button
                onClick={clearFilters}
                className="mt-4 text-sm text-teal-600 hover:text-teal-700 hover:underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredData.map(disclosure => (
                <div key={disclosure.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-5 border border-gray-100">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900 text-lg mb-1">{disclosure.shareholder_name}</h4>
                      <p className="text-sm text-gray-600">
                        {disclosure.stock_code} - {disclosure.stock_name || disclosure.company_name || 'Unknown Company'}
                      </p>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <div className="px-3 py-1 bg-teal-100 text-teal-700 rounded-lg font-semibold text-lg">
                        {disclosure.percentage_long?.toFixed(2)}%
                      </div>
                      <span className="text-xs text-gray-500">Long Position</span>
                    </div>
                  </div>

                  {/* Shareholding Details */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 pb-3 border-b border-gray-100">
                    {disclosure.shares_long && (
                      <div>
                        <p className="text-xs text-gray-500">Shares (Long)</p>
                        <p className="font-semibold text-gray-900">{disclosure.shares_long.toLocaleString()}</p>
                      </div>
                    )}
                    {disclosure.shares_short !== undefined && disclosure.shares_short > 0 && (
                      <div>
                        <p className="text-xs text-gray-500">Shares (Short)</p>
                        <p className="font-semibold text-gray-900">{disclosure.shares_short.toLocaleString()}</p>
                      </div>
                    )}
                    {disclosure.percentage_short !== undefined && disclosure.percentage_short > 0 && (
                      <div>
                        <p className="text-xs text-gray-500">% (Short)</p>
                        <p className="font-semibold text-gray-900">{disclosure.percentage_short.toFixed(2)}%</p>
                      </div>
                    )}
                    {disclosure.filing_date && (
                      <div>
                        <p className="text-xs text-gray-500">Filing Date</p>
                        <p className="font-semibold text-gray-900">
                          {new Date(disclosure.filing_date).toLocaleDateString()}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Footer */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500 font-mono text-xs">Form: {disclosure.form_serial_number}</span>
                    {disclosure.notice_url && (
                      <a
                        href={disclosure.notice_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-teal-600 hover:text-teal-700 hover:underline flex items-center gap-1"
                      >
                        <Eye size={14} />
                        View Notice
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
