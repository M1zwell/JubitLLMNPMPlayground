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

  // Database data states
  const [hksfcData, setHksfcData] = useState<HKSFCFiling[]>([]);
  const [hkexData, setHkexData] = useState<HKEXAnnouncement[]>([]);
  const [ccassData, setCcassData] = useState<CCassHolding[]>([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

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
          ...(source === 'ccass' && { stock_code: stockCode })
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
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {source === 'hksfc' ? (
                  hksfcData.length === 0 ? (
                    <p className="text-center text-gray-500 py-8">
                      No HKSFC data found. Try scraping first.
                    </p>
                  ) : (
                    hksfcData.map(filing => (
                      <div key={filing.id} className="p-3 border border-gray-200 rounded-md hover:bg-gray-50">
                        <h4 className="font-medium text-sm">{filing.title}</h4>
                        <p className="text-xs text-gray-500 mt-1">
                          Type: {filing.filing_type} | Date: {filing.filing_date || 'N/A'}
                        </p>
                        {filing.url && (
                          <a
                            href={filing.url}
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
