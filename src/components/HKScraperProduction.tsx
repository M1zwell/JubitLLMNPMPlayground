/**
 * HK Scraper Production - Fixed to use Backend-Only Scraping
 *
 * CHANGES:
 * - Removed frontend database insertions
 * - Uses unified-scraper Edge Function for all operations
 * - Frontend only triggers scraping and displays results
 * - No direct Supabase writes from frontend
 */

import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import {
  Download,
  Search,
  FileJson,
  FileSpreadsheet,
  Calendar,
  Building2,
  AlertCircle,
  CheckCircle,
  Loader2,
  Eye,
  RefreshCw,
  Trash2,
  Database
} from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface ScrapeResult {
  source: string;
  records_inserted: number;
  records_updated: number;
  records_failed: number;
  duration_ms: number;
  success: boolean;
  error?: string;
}

interface HKSFCFiling {
  id: string;
  title: string;
  content?: string;
  summary?: string;
  filing_type: string;
  company_code?: string;
  company_name?: string;
  filing_date?: string;
  url: string;
  pdf_url?: string;
  tags?: string[];
  scraped_at: string;
}

interface HKEXAnnouncement {
  id: string;
  announcement_title: string;
  announcement_content?: string;
  announcement_type: string;
  company_code?: string;
  company_name?: string;
  announcement_date?: string;
  url: string;
  scraped_at: string;
}

interface CCassHolding {
  id: string;
  stock_code: string;
  stock_name?: string;
  participant_id: string;
  participant_name: string;
  shareholding: number;
  percentage: number;
  scraped_at: string;
}

export default function HKScraperProduction() {
  const [activeTab, setActiveTab] = useState<'scrape' | 'view'>('scrape');
  const [source, setSource] = useState<'hksfc' | 'hkex' | 'ccass'>('hksfc');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScrapeResult | null>(null);

  // Filter states
  const [limit, setLimit] = useState(100);
  const [stockCode, setStockCode] = useState('00700'); // For CCASS scraping
  const [startDate, setStartDate] = useState('2025/11/08');
  const [endDate, setEndDate] = useState('2025/11/11');

  // Database data states
  const [hksfcData, setHksfcData] = useState<HKSFCFiling[]>([]);
  const [hkexData, setHkexData] = useState<HKEXAnnouncement[]>([]);
  const [ccassData, setCcassData] = useState<CCassHolding[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // HKSFC Filter states
  const [hksfcFilters, setHksfcFilters] = useState({
    filingType: 'all',
    searchText: '',
    companyCode: '',
    dateFrom: '',
    dateTo: '',
    selectedTag: 'all',
    sortBy: 'date-desc'
  });

  // Fetch data from database (READ ONLY)
  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      if (source === 'hksfc') {
        const { data, error } = await supabase
          .from('hksfc_filings')
          .select('*')
          .order('scraped_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        setHksfcData(data || []);
      } else if (source === 'hkex') {
        const { data, error } = await supabase
          .from('hkex_announcements')
          .select('*')
          .order('scraped_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        setHkexData(data || []);
      } else if (source === 'ccass') {
        const { data, error } = await supabase
          .from('hkex_ccass_holdings')
          .select('*')
          .order('scraped_at', { ascending: false })
          .limit(100);

        if (error) throw error;
        setCcassData(data || []);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      alert('Error loading data: ' + (error as Error).message);
    } finally {
      setIsLoadingData(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'view') {
      fetchData();
    }
  }, [activeTab, source]);

  // Filter and sort HKSFC data
  const getFilteredHKSFCData = () => {
    let filtered = [...hksfcData];

    // Filter by filing type
    if (hksfcFilters.filingType !== 'all') {
      filtered = filtered.filter(f => f.filing_type === hksfcFilters.filingType);
    }

    // Filter by search text (title or content)
    if (hksfcFilters.searchText) {
      const search = hksfcFilters.searchText.toLowerCase();
      filtered = filtered.filter(f =>
        f.title.toLowerCase().includes(search) ||
        f.content?.toLowerCase().includes(search) ||
        f.summary?.toLowerCase().includes(search)
      );
    }

    // Filter by company code
    if (hksfcFilters.companyCode) {
      filtered = filtered.filter(f =>
        f.company_code?.includes(hksfcFilters.companyCode)
      );
    }

    // Filter by tag
    if (hksfcFilters.selectedTag !== 'all') {
      filtered = filtered.filter(f =>
        f.tags?.includes(hksfcFilters.selectedTag)
      );
    }

    // Filter by date range
    if (hksfcFilters.dateFrom) {
      filtered = filtered.filter(f => {
        if (!f.filing_date) return false;
        return new Date(f.filing_date) >= new Date(hksfcFilters.dateFrom);
      });
    }
    if (hksfcFilters.dateTo) {
      filtered = filtered.filter(f => {
        if (!f.filing_date) return false;
        return new Date(f.filing_date) <= new Date(hksfcFilters.dateTo);
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (hksfcFilters.sortBy) {
        case 'date-desc':
          return new Date(b.filing_date || b.scraped_at).getTime() -
                 new Date(a.filing_date || a.scraped_at).getTime();
        case 'date-asc':
          return new Date(a.filing_date || a.scraped_at).getTime() -
                 new Date(b.filing_date || b.scraped_at).getTime();
        case 'type':
          return a.filing_type.localeCompare(b.filing_type);
        case 'company':
          return (a.company_code || '').localeCompare(b.company_code || '');
        default:
          return 0;
      }
    });

    return filtered;
  };

  // Get all unique tags and filing types from data
  const getAllTags = () => {
    const tags = new Set<string>();
    hksfcData.forEach(f => f.tags?.forEach(t => tags.add(t)));
    return Array.from(tags);
  };

  const getAllFilingTypes = () => {
    const types = new Set<string>();
    hksfcData.forEach(f => types.add(f.filing_type));
    return Array.from(types);
  };

  // Export functions
  const exportToJSON = () => {
    const filtered = getFilteredHKSFCData();
    const dataStr = JSON.stringify(filtered, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hksfc-filings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const exportToCSV = () => {
    const filtered = getFilteredHKSFCData();
    const headers = ['Title', 'Type', 'Company Code', 'Company Name', 'Filing Date', 'Summary', 'URL', 'PDF URL', 'Tags'];
    const rows = filtered.map(f => [
      f.title,
      f.filing_type,
      f.company_code || '',
      f.company_name || '',
      f.filing_date || '',
      f.summary || '',
      f.url,
      f.pdf_url || '',
      f.tags?.join('; ') || ''
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    const dataBlob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hksfc-filings-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  // Trigger scraping via unified-scraper Edge Function
  // The Edge Function handles both scraping AND database insertion
  const startScraping = async () => {
    setResult(null);
    setIsLoading(true);

    try {
      console.log(`🔥 Calling unified-scraper Edge Function for ${source}`);

      // Call unified-scraper Edge Function
      // This function will:
      // 1. Scrape the data from the source
      // 2. Insert/update records in the database
      // 3. Return statistics
      const response = await fetch(`${SUPABASE_URL}/functions/v1/unified-scraper`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          source: source,
          limit: limit,
          test_mode: false,
          ...(source === 'ccass' && {
            stock_code: stockCode,
            start_date: startDate,
            end_date: endDate
          })
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Scraping failed: ${response.status} - ${errorText}`);
      }

      const data: ScrapeResult = await response.json();

      if (data.success) {
        setResult(data);
        console.log(`✅ Scraping completed: ${data.records_inserted} inserted, ${data.records_updated} updated`);
      } else {
        throw new Error(data.error || 'Scraping failed');
      }

    } catch (error) {
      console.error('❌ Scraping error:', error);
      setResult({
        success: false,
        source: source,
        records_inserted: 0,
        records_updated: 0,
        records_failed: 0,
        duration_ms: 0,
        error: (error as Error).message
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="card-minimal">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-heading">HK Data Scraper</h2>
            <p className="text-caption">
              Backend-powered scraping via unified-scraper Edge Function
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('scrape')}
              className={`btn-minimal ${activeTab === 'scrape' ? 'btn-primary' : 'btn-secondary'}`}
            >
              <Search size={16} />
              Scrape
            </button>
            <button
              onClick={() => setActiveTab('view')}
              className={`btn-minimal ${activeTab === 'view' ? 'btn-primary' : 'btn-secondary'}`}
            >
              <Eye size={16} />
              View Data
            </button>
          </div>
        </div>

        {/* Scrape Tab */}
        {activeTab === 'scrape' && (
          <div className="space-y-4">
            {/* Source Selection */}
            <div>
              <label className="block text-sm font-medium mb-2">Data Source</label>
              <select
                value={source}
                onChange={(e) => setSource(e.target.value as 'hksfc' | 'hkex' | 'ccass')}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={isLoading}
              >
                <option value="hksfc">HKSFC (Securities & Futures Commission)</option>
                <option value="hkex">HKEX (Stock Exchange)</option>
                <option value="ccass">CCASS (Participant Shareholding)</option>
              </select>
            </div>

            {/* Stock Code (CCASS only) */}
            {source === 'ccass' && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Stock Code (e.g., 00700 for Tencent)
                  </label>
                  <input
                    type="text"
                    value={stockCode}
                    onChange={(e) => setStockCode(e.target.value)}
                    placeholder="00700"
                    maxLength={5}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    disabled={isLoading}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <Calendar className="inline mr-1" size={14} />
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={startDate.replace(/\//g, '-')}
                      onChange={(e) => setStartDate(e.target.value.replace(/-/g, '/'))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      disabled={isLoading}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      <Calendar className="inline mr-1" size={14} />
                      End Date
                    </label>
                    <input
                      type="date"
                      value={endDate.replace(/\//g, '-')}
                      onChange={(e) => setEndDate(e.target.value.replace(/-/g, '/'))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                      disabled={isLoading}
                    />
                  </div>
                </div>
              </>
            )}

            {/* Limit */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Record Limit (max: 1000)
              </label>
              <input
                type="number"
                value={limit}
                onChange={(e) => setLimit(Math.min(1000, Math.max(1, parseInt(e.target.value) || 100)))}
                min="1"
                max="1000"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                disabled={isLoading}
              />
            </div>

            {/* Info Box */}
            <div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
              <div className="flex items-start gap-2">
                <Database className="text-blue-600 mt-0.5" size={16} />
                <div className="text-sm">
                  <p className="font-medium text-blue-900 mb-1">Backend-Only Scraping</p>
                  <ul className="text-blue-700 space-y-1 text-xs">
                    <li>✅ Scraping performed by Edge Function (backend)</li>
                    <li>✅ Database writes handled securely server-side</li>
                    <li>✅ Frontend only triggers and displays results</li>
                    <li>✅ No MCP or scraping logic exposed to browser</li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Scrape Button */}
            <button
              onClick={startScraping}
              disabled={isLoading}
              className="w-full btn-minimal btn-primary flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Scraping in progress...
                </>
              ) : (
                <>
                  <RefreshCw size={16} />
                  Start Scraping
                </>
              )}
            </button>

            {/* Results */}
            {result && (
              <div className={`p-4 rounded-md ${
                result.success
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}>
                <div className="flex items-center gap-2 mb-2">
                  {result.success ? (
                    <CheckCircle className="text-green-600" size={20} />
                  ) : (
                    <AlertCircle className="text-red-600" size={20} />
                  )}
                  <h3 className="font-medium">
                    {result.success ? 'Scraping Completed' : 'Scraping Failed'}
                  </h3>
                </div>

                {result.success ? (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span className="text-gray-600">Inserted:</span>
                      <span className="ml-2 font-semibold text-green-600">
                        {result.records_inserted}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Updated:</span>
                      <span className="ml-2 font-semibold text-blue-600">
                        {result.records_updated}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Failed:</span>
                      <span className="ml-2 font-semibold text-red-600">
                        {result.records_failed}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Duration:</span>
                      <span className="ml-2 font-semibold">
                        {(result.duration_ms / 1000).toFixed(2)}s
                      </span>
                    </div>
                  </div>
                ) : (
                  <p className="text-red-700 text-sm">{result.error}</p>
                )}
              </div>
            )}
          </div>
        )}

        {/* View Tab */}
        {activeTab === 'view' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium">
                {source === 'hksfc' ? 'HKSFC Filings' : source === 'hkex' ? 'HKEX Announcements' : 'CCASS Holdings'}
              </h3>
              <button
                onClick={fetchData}
                disabled={isLoadingData}
                className="btn-minimal btn-secondary"
              >
                <RefreshCw size={14} className={isLoadingData ? 'animate-spin' : ''} />
                Refresh
              </button>
            </div>

            {isLoadingData ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="animate-spin text-gray-400" size={32} />
              </div>
            ) : (
              <div className="space-y-4">
                {source === 'hksfc' ? (
                  hksfcData.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      No HKSFC data found. Try scraping first.
                    </p>
                  ) : (
                    <>
                      {/* Stats Summary */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
                          <p className="text-xs text-blue-600 font-medium">Total Records</p>
                          <p className="text-2xl font-bold text-blue-900">{hksfcData.length}</p>
                        </div>
                        <div className="p-3 bg-green-50 border border-green-200 rounded-md">
                          <p className="text-xs text-green-600 font-medium">Filtered</p>
                          <p className="text-2xl font-bold text-green-900">{getFilteredHKSFCData().length}</p>
                        </div>
                        <div className="p-3 bg-purple-50 border border-purple-200 rounded-md">
                          <p className="text-xs text-purple-600 font-medium">Filing Types</p>
                          <p className="text-2xl font-bold text-purple-900">{getAllFilingTypes().length}</p>
                        </div>
                        <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
                          <p className="text-xs text-orange-600 font-medium">Tags</p>
                          <p className="text-2xl font-bold text-orange-900">{getAllTags().length}</p>
                        </div>
                      </div>

                      {/* Filter Panel */}
                      <div className="p-4 bg-gray-50 border border-gray-200 rounded-md space-y-3">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-sm">Filters</h4>
                          <button
                            onClick={() => setHksfcFilters({
                              filingType: 'all',
                              searchText: '',
                              companyCode: '',
                              dateFrom: '',
                              dateTo: '',
                              selectedTag: 'all',
                              sortBy: 'date-desc'
                            })}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Clear all
                          </button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                          {/* Search Text */}
                          <div>
                            <label className="block text-xs font-medium mb-1">Search</label>
                            <input
                              type="text"
                              value={hksfcFilters.searchText}
                              onChange={(e) => setHksfcFilters({...hksfcFilters, searchText: e.target.value})}
                              placeholder="Search title, summary..."
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                            />
                          </div>

                          {/* Filing Type */}
                          <div>
                            <label className="block text-xs font-medium mb-1">Filing Type</label>
                            <select
                              value={hksfcFilters.filingType}
                              onChange={(e) => setHksfcFilters({...hksfcFilters, filingType: e.target.value})}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                            >
                              <option value="all">All Types</option>
                              {getAllFilingTypes().map(type => (
                                <option key={type} value={type}>{type}</option>
                              ))}
                            </select>
                          </div>

                          {/* Tag Filter */}
                          <div>
                            <label className="block text-xs font-medium mb-1">Tag</label>
                            <select
                              value={hksfcFilters.selectedTag}
                              onChange={(e) => setHksfcFilters({...hksfcFilters, selectedTag: e.target.value})}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                            >
                              <option value="all">All Tags</option>
                              {getAllTags().map(tag => (
                                <option key={tag} value={tag}>{tag}</option>
                              ))}
                            </select>
                          </div>

                          {/* Company Code */}
                          <div>
                            <label className="block text-xs font-medium mb-1">Company Code</label>
                            <input
                              type="text"
                              value={hksfcFilters.companyCode}
                              onChange={(e) => setHksfcFilters({...hksfcFilters, companyCode: e.target.value})}
                              placeholder="e.g., 0700"
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                            />
                          </div>

                          {/* Date From */}
                          <div>
                            <label className="block text-xs font-medium mb-1">Date From</label>
                            <input
                              type="date"
                              value={hksfcFilters.dateFrom}
                              onChange={(e) => setHksfcFilters({...hksfcFilters, dateFrom: e.target.value})}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                            />
                          </div>

                          {/* Date To */}
                          <div>
                            <label className="block text-xs font-medium mb-1">Date To</label>
                            <input
                              type="date"
                              value={hksfcFilters.dateTo}
                              onChange={(e) => setHksfcFilters({...hksfcFilters, dateTo: e.target.value})}
                              className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
                            />
                          </div>
                        </div>

                        {/* Sort and Export */}
                        <div className="flex items-center justify-between pt-2 border-t border-gray-300">
                          <div className="flex items-center gap-2">
                            <label className="text-xs font-medium">Sort by:</label>
                            <select
                              value={hksfcFilters.sortBy}
                              onChange={(e) => setHksfcFilters({...hksfcFilters, sortBy: e.target.value})}
                              className="px-2 py-1 text-xs border border-gray-300 rounded"
                            >
                              <option value="date-desc">Date (Newest)</option>
                              <option value="date-asc">Date (Oldest)</option>
                              <option value="type">Filing Type</option>
                              <option value="company">Company Code</option>
                            </select>
                          </div>
                          <div className="flex gap-2">
                            <button
                              onClick={exportToJSON}
                              className="btn-minimal btn-secondary text-xs flex items-center gap-1"
                            >
                              <FileJson size={14} />
                              Export JSON
                            </button>
                            <button
                              onClick={exportToCSV}
                              className="btn-minimal btn-secondary text-xs flex items-center gap-1"
                            >
                              <FileSpreadsheet size={14} />
                              Export CSV
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Filtered Results */}
                      <div className="space-y-3 max-h-96 overflow-y-auto">
                        {getFilteredHKSFCData().map(filing => (
                          <div key={filing.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow bg-white">
                            {/* Header */}
                            <div className="flex items-start justify-between gap-3 mb-2">
                              <h4 className="font-semibold text-sm flex-1 leading-snug">{filing.title}</h4>
                              {filing.company_code && (
                                <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-mono rounded">
                                  {filing.company_code}
                                </span>
                              )}
                            </div>

                            {/* Summary */}
                            {filing.summary && (
                              <p className="text-xs text-gray-600 mb-2 leading-relaxed">
                                {filing.summary}
                              </p>
                            )}

                            {/* Tags */}
                            {filing.tags && filing.tags.length > 0 && (
                              <div className="flex flex-wrap gap-1 mb-2">
                                {filing.tags.map((tag, idx) => (
                                  <span
                                    key={idx}
                                    className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded"
                                  >
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            )}

                            {/* Metadata */}
                            <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
                              <span className="flex items-center gap-1">
                                <Building2 size={12} />
                                {filing.filing_type}
                              </span>
                              {filing.filing_date && (
                                <span className="flex items-center gap-1">
                                  <Calendar size={12} />
                                  {new Date(filing.filing_date).toLocaleDateString()}
                                </span>
                              )}
                              {filing.company_name && (
                                <span className="truncate">
                                  {filing.company_name}
                                </span>
                              )}
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2">
                              <a
                                href={filing.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:underline flex items-center gap-1"
                              >
                                <Eye size={12} />
                                View source
                              </a>
                              {filing.pdf_url && (
                                <a
                                  href={filing.pdf_url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-xs text-green-600 hover:underline flex items-center gap-1"
                                >
                                  <Download size={12} />
                                  Download PDF
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  )
                ) : source === 'hkex' ? (
                  hkexData.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      No HKEX data found. Try scraping first.
                    </p>
                  ) : (
                    hkexData.map(announcement => (
                      <div key={announcement.id} className="p-3 border border-gray-200 rounded-md hover:bg-gray-50">
                        <h4 className="font-medium text-sm">{announcement.announcement_title}</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          Type: {announcement.announcement_type} |
                          Code: {announcement.company_code || 'N/A'} |
                          Date: {announcement.announcement_date || 'N/A'}
                        </p>
                        {announcement.url && (
                          <a
                            href={announcement.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-blue-600 hover:underline mt-1 inline-block"
                          >
                            View source →
                          </a>
                        )}
                      </div>
                    ))
                  )
                ) : (
                  ccassData.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      No CCASS data found. Try scraping first.
                    </p>
                  ) : (
                    ccassData.map(holding => (
                      <div key={holding.id} className="p-3 border border-gray-200 rounded-md hover:bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div>
                            <h4 className="font-medium text-sm">{holding.participant_name}</h4>
                            <p className="text-xs text-gray-500 mt-1">
                              ID: {holding.participant_id} | Stock: {holding.stock_code}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-sm font-semibold">
                              {holding.shareholding.toLocaleString()}
                            </p>
                            <p className="text-xs text-gray-500">
                              {holding.percentage}%
                            </p>
                          </div>
                        </div>
                      </div>
                    ))
                  )
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
