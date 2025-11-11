/**
 * HK Scraper Production - Connected to Production Edge Functions
 *
 * Features:
 * - Real-time scraping via unified-scraper Edge Function
 * - HKSFC and HKEX data sources
 * - CSV/JSON/XLSX export
 * - Date range and stock code filters
 * - View scraped data from database
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
  filing_type: string;
  company_code?: string;
  company_name?: string;
  filing_date?: string;
  url: string;
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

export default function HKScraperProduction() {
  const [activeTab, setActiveTab] = useState<'scrape' | 'view'>('scrape');
  const [source, setSource] = useState<'hksfc' | 'hkex'>('hksfc');
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ScrapeResult | null>(null);

  // Filter states
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0]
  });
  const [stockCodes, setStockCodes] = useState('00700,00005,00388');
  const [filingType, setFilingType] = useState<string>('all');

  // Validation states
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Database data states
  const [hksfcData, setHksfcData] = useState<HKSFCFiling[]>([]);
  const [hkexData, setHkexData] = useState<HKEXAnnouncement[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Fetch data from database
  const fetchData = async () => {
    setIsLoadingData(true);
    try {
      if (source === 'hksfc') {
        let query = supabase
          .from('hksfc_filings')
          .select('*')
          .order('scraped_at', { ascending: false })
          .limit(100);

        if (filingType !== 'all') {
          query = query.eq('filing_type', filingType);
        }

        const { data, error } = await query;
        if (error) throw error;
        setHksfcData(data || []);
      } else {
        let query = supabase
          .from('hkex_announcements')
          .select('*')
          .order('scraped_at', { ascending: false })
          .limit(100);

        // Apply date range filter for HKEX
        if (dateRange.start) {
          query = query.gte('announcement_date', dateRange.start);
        }
        if (dateRange.end) {
          query = query.lte('announcement_date', dateRange.end);
        }

        // Apply stock code filter for HKEX
        if (stockCodes.trim()) {
          const codes = stockCodes.split(',').map(code => code.trim().padStart(5, '0'));
          query = query.in('company_code', codes);
        }

        const { data, error } = await query;
        if (error) throw error;
        setHkexData(data || []);
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
  }, [activeTab, source, filingType, dateRange.start, dateRange.end, stockCodes]);

  // Validation functions
  const validateStockCodes = (codes: string): string[] => {
    const errors: string[] = [];
    const codeList = codes.split(',').map(c => c.trim()).filter(c => c);

    if (codeList.length === 0) {
      errors.push('At least one stock code is required');
      return errors;
    }

    for (const code of codeList) {
      // Check if code is 1-5 digits
      if (!/^\d{1,5}$/.test(code)) {
        errors.push(`Invalid stock code "${code}": must be 1-5 digits (e.g., "700" or "00700")`);
      }
    }

    return errors;
  };

  const validateDateRange = (start: string, end?: string): string[] => {
    const errors: string[] = [];
    const startDate = new Date(start);
    const endDate = end ? new Date(end) : new Date();
    const today = new Date();
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setFullYear(twelveMonthsAgo.getFullYear() - 1);

    // For HKEX, validate 12-month range
    if (source === 'hkex') {
      if (startDate < twelveMonthsAgo) {
        errors.push(
          `Start date too far in past. HKEX only provides data for past 12 months ` +
          `(from ${twelveMonthsAgo.toISOString().split('T')[0]})`
        );
      }
    }

    if (startDate > today) {
      errors.push('Start date cannot be in the future');
    }

    if (end && endDate > today) {
      errors.push('End date cannot be in the future');
    }

    if (end && startDate > endDate) {
      errors.push('Start date must be before end date');
    }

    return errors;
  };

  const validateInputs = (): boolean => {
    const errors: string[] = [];

    // Validate stock codes for HKEX
    if (source === 'hkex') {
      errors.push(...validateStockCodes(stockCodes));
    }

    // Validate date range
    errors.push(...validateDateRange(dateRange.start, dateRange.end));

    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Trigger scraping
  const startScraping = async () => {
    // Clear previous results and validation errors
    setResult(null);
    setValidationErrors([]);

    // Validate inputs before scraping
    if (!validateInputs()) {
      return;
    }

    setIsLoading(true);

    try {
      // Build request for production scrape-orchestrator Edge Function
      const requestBody: any = {
        source: source === 'hksfc' ? 'hksfc-news' : 'hkex-ccass',
        strategy: 'firecrawl',
        options: {}
      };

      // Add source-specific options
      if (source === 'hksfc') {
        requestBody.options.url = 'https://apps.sfc.hk/edistributionWeb/gateway/EN/news-and-announcements/news/';
        if (dateRange.start && dateRange.end) {
          requestBody.options.dateRange = {
            start: dateRange.start,
            end: dateRange.end
          };
        }
      } else {
        // HKEX
        requestBody.options.stockCodes = stockCodes.split(',').map(code => code.trim());
        if (dateRange.start) {
          requestBody.options.dateRange = {
            start: dateRange.start,
            end: dateRange.end
          };
        }
      }

      const response = await fetch(`${SUPABASE_URL}/functions/v1/scrape-orchestrator`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
        },
        body: JSON.stringify(requestBody)
      });

      const data = await response.json();

      if (response.ok && data.success) {
        // Production scraper returns structured data, need to count and insert to database
        const extractedData = data.data;
        let recordsInserted = 0;

        // Insert to database based on source
        if (source === 'hksfc' && extractedData.articles) {
          // Insert HKSFC articles to database
          for (const article of extractedData.articles) {
            const { error } = await supabase
              .from('hksfc_filings')
              .upsert({
                title: article.title,
                content: article.summary || '',
                filing_type: article.category.toLowerCase(),
                url: article.url,
                filing_date: article.publishDate,
                content_hash: `hksfc-${article.id}`,
              }, {
                onConflict: 'content_hash'
              });

            if (!error) recordsInserted++;
          }
        } else if (source === 'hkex' && Array.isArray(extractedData)) {
          // Insert HKEX CCASS data to database
          for (const stockData of extractedData) {
            if (stockData.participants) {
              for (const participant of stockData.participants) {
                const { error } = await supabase
                  .from('hkex_announcements')
                  .upsert({
                    announcement_title: `CCASS Holdings - ${stockData.stockName} (${stockData.stockCode})`,
                    announcement_content: `Participant: ${participant.participantName}`,
                    announcement_type: 'ccass',
                    company_code: stockData.stockCode,
                    company_name: stockData.stockName,
                    announcement_date: stockData.dataDate,
                    url: `https://www3.hkexnews.hk/sdw/search/searchsdw.aspx?stockCode=${stockData.stockCode}`,
                    ccass_participant_id: participant.participantId,
                    ccass_shareholding: participant.shareholding,
                    ccass_percentage: participant.percentage,
                    content_hash: `ccass-${stockData.stockCode}-${participant.participantId}-${stockData.dataDate}`,
                  }, {
                    onConflict: 'content_hash'
                  });

                if (!error) recordsInserted++;
              }
            }
          }
        }

        setResult({
          source,
          records_inserted: recordsInserted,
          records_updated: 0,
          records_failed: 0,
          duration_ms: data.executionTime,
          success: true
        });

        // Refresh data view if it's open
        if (activeTab === 'view') {
          setTimeout(() => fetchData(), 1000);
        }
      } else {
        setResult({
          source,
          records_inserted: 0,
          records_updated: 0,
          records_failed: 0,
          duration_ms: data.executionTime || 0,
          success: false,
          error: data.error || 'Unknown error'
        });
      }
    } catch (error) {
      console.error('Scraping error:', error);
      setResult({
        source,
        records_inserted: 0,
        records_updated: 0,
        records_failed: 0,
        duration_ms: 0,
        success: false,
        error: (error as Error).message
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Export functions
  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header];
          // Escape quotes and wrap in quotes if contains comma
          const stringValue = String(value || '').replace(/"/g, '""');
          return stringValue.includes(',') ? `"${stringValue}"` : stringValue;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  const exportToJSON = (data: any[], filename: string) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `${filename}_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const downloadCurrentView = (format: 'csv' | 'json') => {
    const data = source === 'hksfc' ? hksfcData : hkexData;

    // Build filename with filters
    let filename = `${source}_data`;
    if (source === 'hkex') {
      if (stockCodes.trim()) {
        filename += `_stocks_${stockCodes.replace(/,/g, '-')}`;
      }
      if (dateRange.start && dateRange.end) {
        filename += `_${dateRange.start}_to_${dateRange.end}`;
      }
    }

    if (format === 'csv') {
      exportToCSV(data, filename);
    } else {
      exportToJSON(data, filename);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-indigo-900 to-purple-900 p-6">
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-8">
        <h1 className="text-4xl font-bold text-gray-100 mb-2">
          HK Financial Scraper
        </h1>
        <p className="text-gray-400">
          Production scraping via Firecrawl → Extractors → Database
        </p>
      </div>

      <div className="max-w-7xl mx-auto">
        {/* Tab Navigation */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('scrape')}
            className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 ${
              activeTab === 'scrape'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <Search className="w-5 h-5" />
            Scrape Data
          </button>
          <button
            onClick={() => setActiveTab('view')}
            className={`px-6 py-3 rounded-lg font-semibold flex items-center gap-2 ${
              activeTab === 'view'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            <Database className="w-5 h-5" />
            View Database
          </button>
        </div>

        {activeTab === 'scrape' ? (
          // Scraping Interface
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left: Options */}
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-100 mb-4">Scraping Options</h2>

                {/* Source Selection */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    Data Source
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={() => setSource('hksfc')}
                      className={`px-4 py-2 rounded-lg border-2 ${
                        source === 'hksfc'
                          ? 'border-purple-500 bg-purple-900 text-white'
                          : 'border-gray-700 bg-gray-700 text-gray-400 hover:border-purple-300'
                      }`}
                    >
                      <AlertCircle className="w-4 h-4 inline mr-1" />
                      HKSFC
                    </button>
                    <button
                      onClick={() => setSource('hkex')}
                      className={`px-4 py-2 rounded-lg border-2 ${
                        source === 'hkex'
                          ? 'border-blue-500 bg-blue-900 text-white'
                          : 'border-gray-700 bg-gray-700 text-gray-400 hover:border-blue-300'
                      }`}
                    >
                      <Building2 className="w-4 h-4 inline mr-1" />
                      HKEX
                    </button>
                  </div>
                </div>

                {/* Stock Codes (for HKEX) */}
                {source === 'hkex' && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Stock Codes
                    </label>
                    <input
                      type="text"
                      value={stockCodes}
                      onChange={(e) => setStockCodes(e.target.value)}
                      placeholder="00700,00005,00388"
                      className="w-full px-3 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-700 text-gray-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      1-5 digits, comma-separated (e.g., "700" or "00700")
                    </p>
                  </div>
                )}

                {/* Date Range */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    <Calendar className="w-4 h-4 inline mr-1" />
                    Date Range
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="date"
                      value={dateRange.start}
                      onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                      className="px-3 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-700 text-gray-100"
                    />
                    <input
                      type="date"
                      value={dateRange.end}
                      onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                      className="px-3 py-2 border border-gray-700 rounded-lg focus:ring-2 focus:ring-blue-500 bg-gray-700 text-gray-100"
                    />
                  </div>
                  {source === 'hkex' && (
                    <p className="text-xs text-yellow-500 mt-1">
                      ⚠️ HKEX only provides data for past 12 months
                    </p>
                  )}
                </div>

                {/* Start Button */}
                <button
                  onClick={startScraping}
                  disabled={isLoading}
                  className={`
                    w-full px-6 py-3 rounded-lg font-semibold flex items-center justify-center gap-2
                    ${isLoading
                      ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                      : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white hover:from-blue-700 hover:to-purple-700'}
                  `}
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Scraping...
                    </>
                  ) : (
                    <>
                      <Search className="w-5 h-5" />
                      Start Scraping
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Right: Results */}
            <div className="lg:col-span-2">
              <div className="bg-gray-800 rounded-xl shadow-lg p-6">
                <h2 className="text-xl font-bold text-gray-100 mb-4">Scraping Results</h2>

                {/* Validation Errors */}
                {validationErrors.length > 0 && (
                  <div className="mb-4 p-4 rounded-lg border-2 border-yellow-600 bg-yellow-900/30">
                    <div className="flex items-start gap-3">
                      <AlertCircle className="w-6 h-6 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <h3 className="text-lg font-bold text-yellow-400 mb-2">Validation Errors</h3>
                        <ul className="list-disc list-inside space-y-1">
                          {validationErrors.map((error, idx) => (
                            <li key={idx} className="text-sm text-yellow-300">{error}</li>
                          ))}
                        </ul>
                        <p className="text-xs text-yellow-500 mt-3">
                          Please fix the errors above before starting the scrape.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {result ? (
                  <div className={`p-6 rounded-lg border-2 ${
                    result.success
                      ? 'border-green-600 bg-green-900/30'
                      : 'border-red-600 bg-red-900/30'
                  }`}>
                    <div className="flex items-center gap-3 mb-4">
                      {result.success ? (
                        <CheckCircle className="w-8 h-8 text-green-500" />
                      ) : (
                        <AlertCircle className="w-8 h-8 text-red-500" />
                      )}
                      <div>
                        <h3 className="text-xl font-bold text-gray-100">
                          {result.success ? 'Scraping Successful!' : 'Scraping Failed'}
                        </h3>
                        <p className="text-sm text-gray-400">
                          Source: {result.source.toUpperCase()}
                        </p>
                      </div>
                    </div>

                    {result.success ? (
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div className="bg-gray-700/50 p-3 rounded-lg">
                          <p className="text-sm text-gray-400">Records Inserted</p>
                          <p className="text-2xl font-bold text-green-400">{result.records_inserted}</p>
                        </div>
                        <div className="bg-gray-700/50 p-3 rounded-lg">
                          <p className="text-sm text-gray-400">Records Updated</p>
                          <p className="text-2xl font-bold text-blue-400">{result.records_updated}</p>
                        </div>
                        <div className="bg-gray-700/50 p-3 rounded-lg">
                          <p className="text-sm text-gray-400">Failed</p>
                          <p className="text-2xl font-bold text-yellow-400">{result.records_failed}</p>
                        </div>
                        <div className="bg-gray-700/50 p-3 rounded-lg">
                          <p className="text-sm text-gray-400">Duration</p>
                          <p className="text-2xl font-bold text-purple-400">{result.duration_ms}ms</p>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-red-900/30 p-4 rounded-lg">
                        <p className="text-red-400">{result.error}</p>
                      </div>
                    )}

                    <div className="flex gap-2 mt-4">
                      <button
                        onClick={() => setActiveTab('view')}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                      >
                        <Database className="w-4 h-4" />
                        View in Database
                      </button>
                      <button
                        onClick={() => setResult(null)}
                        className="px-4 py-2 bg-gray-700 text-gray-100 rounded-lg hover:bg-gray-600"
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Search className="w-16 h-16 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400">
                      Configure options and click "Start Scraping" to begin
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Database View
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-gray-800 rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Data Source
                    </label>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSource('hksfc')}
                        className={`px-4 py-2 rounded-lg ${
                          source === 'hksfc'
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-700 text-gray-400'
                        }`}
                      >
                        HKSFC
                      </button>
                      <button
                        onClick={() => setSource('hkex')}
                        className={`px-4 py-2 rounded-lg ${
                          source === 'hkex'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-700 text-gray-400'
                        }`}
                      >
                        HKEX
                      </button>
                    </div>
                  </div>

                  {source === 'hksfc' && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Filing Type
                      </label>
                      <select
                        value={filingType}
                        onChange={(e) => setFilingType(e.target.value)}
                        className="px-4 py-2 bg-gray-700 text-gray-100 rounded-lg border border-gray-600"
                      >
                        <option value="all">All Types</option>
                        <option value="news">News</option>
                        <option value="enforcement">Enforcement</option>
                        <option value="circular">Circular</option>
                        <option value="consultation">Consultation</option>
                      </select>
                    </div>
                  )}

                  {source === 'hkex' && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Stock Codes
                        </label>
                        <input
                          type="text"
                          value={stockCodes}
                          onChange={(e) => setStockCodes(e.target.value)}
                          placeholder="00700,00005,00388"
                          className="px-3 py-2 w-48 bg-gray-700 text-gray-100 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">
                          Date Range
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="date"
                            value={dateRange.start}
                            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
                            className="px-3 py-2 bg-gray-700 text-gray-100 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500"
                          />
                          <input
                            type="date"
                            value={dateRange.end}
                            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
                            className="px-3 py-2 bg-gray-700 text-gray-100 rounded-lg border border-gray-600 focus:ring-2 focus:ring-blue-500"
                          />
                        </div>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={fetchData}
                    disabled={isLoadingData}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                  >
                    <RefreshCw className={`w-4 h-4 ${isLoadingData ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                  <button
                    onClick={() => downloadCurrentView('csv')}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                  >
                    <FileSpreadsheet className="w-4 h-4" />
                    Export CSV
                  </button>
                  <button
                    onClick={() => downloadCurrentView('json')}
                    className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 flex items-center gap-2"
                  >
                    <FileJson className="w-4 h-4" />
                    Export JSON
                  </button>
                </div>
              </div>
            </div>

            {/* Data Table */}
            <div className="bg-gray-800 rounded-xl shadow-lg p-6">
              <h2 className="text-xl font-bold text-gray-100 mb-4">
                {source === 'hksfc' ? 'HKSFC Filings' : 'HKEX Announcements'} ({source === 'hksfc' ? hksfcData.length : hkexData.length})
              </h2>

              {isLoadingData ? (
                <div className="text-center py-12">
                  <Loader2 className="w-8 h-8 text-blue-500 mx-auto mb-4 animate-spin" />
                  <p className="text-gray-400">Loading data...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-gray-700">
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Title</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Type</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Company</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Date</th>
                        <th className="text-left py-3 px-4 text-gray-400 font-medium">Scraped</th>
                      </tr>
                    </thead>
                    <tbody>
                      {source === 'hksfc' ? (
                        hksfcData.length > 0 ? hksfcData.map((item) => (
                          <tr key={item.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                            <td className="py-3 px-4">
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 hover:underline"
                              >
                                {item.title?.substring(0, 80)}...
                              </a>
                            </td>
                            <td className="py-3 px-4 text-gray-300">{item.filing_type}</td>
                            <td className="py-3 px-4 text-gray-300">{item.company_code || '-'}</td>
                            <td className="py-3 px-4 text-gray-300">
                              {item.filing_date ? new Date(item.filing_date).toLocaleDateString() : '-'}
                            </td>
                            <td className="py-3 px-4 text-gray-400 text-sm">
                              {new Date(item.scraped_at).toLocaleString()}
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-gray-400">
                              No HKSFC data found. Try scraping first.
                            </td>
                          </tr>
                        )
                      ) : (
                        hkexData.length > 0 ? hkexData.map((item) => (
                          <tr key={item.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                            <td className="py-3 px-4">
                              <a
                                href={item.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-400 hover:text-blue-300 hover:underline"
                              >
                                {item.announcement_title?.substring(0, 80)}...
                              </a>
                            </td>
                            <td className="py-3 px-4 text-gray-300">{item.announcement_type}</td>
                            <td className="py-3 px-4 text-gray-300">{item.company_code || '-'}</td>
                            <td className="py-3 px-4 text-gray-300">
                              {item.announcement_date ? new Date(item.announcement_date).toLocaleDateString() : '-'}
                            </td>
                            <td className="py-3 px-4 text-gray-400 text-sm">
                              {new Date(item.scraped_at).toLocaleString()}
                            </td>
                          </tr>
                        )) : (
                          <tr>
                            <td colSpan={5} className="py-8 text-center text-gray-400">
                              No HKEX data found. Try scraping first.
                            </td>
                          </tr>
                        )
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
