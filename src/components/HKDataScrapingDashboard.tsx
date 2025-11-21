import React, { useState, useEffect, useMemo } from 'react';
import {
  Play,
  Pause,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Database,
  RefreshCw,
  Calendar,
  Filter,
  Download,
  AlertTriangle,
  Activity,
  BarChart3,
  FileText
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// Types
interface ScrapingJob {
  id: string;
  source: 'hkex-di' | 'sfc-rss' | 'sfc-stats' | 'ccass';
  config: Record<string, any>;
  status: 'pending' | 'running' | 'completed' | 'failed';
  progress: number;
  records_inserted: number;
  records_updated: number;
  records_failed: number;
  error_message?: string;
  error_stack?: string;
  created_at: string;
  started_at?: string;
  completed_at?: string;
  duration_ms?: number;
  source_url?: string;
}

interface ScrapingStats {
  source: string;
  total_jobs: number;
  successful_jobs: number;
  failed_jobs: number;
  running_jobs: number;
  avg_duration_ms: number;
  total_records_inserted: number;
  total_records_updated: number;
  last_run?: string;
}

interface TriggerConfig {
  source: 'hkex-di' | 'sfc-rss' | 'sfc-stats' | 'ccass';
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  params?: Record<string, any>;
}

/**
 * HK Data Scraping Dashboard
 *
 * Admin dashboard for monitoring and triggering HK financial data scraping jobs.
 * Features:
 * - Manual trigger buttons for all 4 data sources
 * - Real-time job monitoring via Supabase subscriptions
 * - Historical job logs with filtering and search
 * - Statistics dashboard with success rates
 * - WCAG 2.1 AA accessible
 */
export function HKDataScrapingDashboard() {
  // State
  const [jobs, setJobs] = useState<ScrapingJob[]>([]);
  const [stats, setStats] = useState<ScrapingStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggering, setTriggering] = useState<string | null>(null);
  const [filterSource, setFilterSource] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [statsDays, setStatsDays] = useState(7);

  // Configurable parameters for scraping
  const [stockCodes, setStockCodes] = useState<string>('00700');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [latestOnly, setLatestOnly] = useState<boolean>(true);

  // Calculate default dates
  const today = new Date().toISOString().split('T')[0];
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

  // Trigger configurations
  const triggers: TriggerConfig[] = [
    {
      source: 'hkex-di',
      label: 'HKEX Disclosure',
      description: 'Scrape substantial shareholder disclosures',
      icon: <FileText className="w-5 h-5" />,
      color: 'blue',
      params: { stock_codes: stockCodes, start_date: dateFrom || thirtyDaysAgo, end_date: dateTo || today }
    },
    {
      source: 'sfc-rss',
      label: 'SFC RSS Feeds',
      description: 'Sync press releases, circulars, consultations',
      icon: <Activity className="w-5 h-5" />,
      color: 'green'
    },
    {
      source: 'sfc-stats',
      label: 'SFC Statistics',
      description: 'Import XLSX statistics tables',
      icon: <BarChart3 className="w-5 h-5" />,
      color: 'purple',
      params: { tables: ['A1', 'A2', 'A3', 'C4', 'C5', 'D3', 'D4'] }
    },
    {
      source: 'ccass',
      label: 'CCASS Holdings',
      description: 'Scrape stock participant shareholdings',
      icon: <Database className="w-5 h-5" />,
      color: 'orange',
      params: {
        stock_codes: stockCodes,
        date_from: latestOnly ? null : (dateFrom || today),
        date_to: latestOnly ? null : (dateTo || today),
        latest_only: latestOnly,
        limit: 50
      }
    }
  ];

  // Load initial data
  useEffect(() => {
    loadJobs();
    loadStats();
  }, []);

  // Real-time subscription for job updates
  useEffect(() => {
    if (!supabase) return;

    const channel = supabase
      .channel('scraping_jobs_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'scraping_jobs'
        },
        (payload) => {
          console.log('[Dashboard] Job update:', payload);

          if (payload.eventType === 'INSERT') {
            setJobs(prev => [payload.new as ScrapingJob, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setJobs(prev => prev.map(job =>
              job.id === payload.new.id ? payload.new as ScrapingJob : job
            ));
          } else if (payload.eventType === 'DELETE') {
            setJobs(prev => prev.filter(job => job.id !== payload.old.id));
          }

          // Reload stats when job completes
          if (payload.new?.status === 'completed' || payload.new?.status === 'failed') {
            loadStats();
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Load jobs from database
  async function loadJobs() {
    if (!supabase) {
      console.warn('[Dashboard] Supabase not initialized');
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('scraping_jobs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      setJobs(data || []);
    } catch (error) {
      console.error('[Dashboard] Error loading jobs:', error);
    } finally {
      setLoading(false);
    }
  }

  // Load statistics
  async function loadStats() {
    if (!supabase) return;

    try {
      const { data, error } = await supabase
        .rpc('get_scraping_stats', {
          p_source: null,
          p_days: statsDays
        });

      if (error) throw error;

      setStats(data || []);
    } catch (error) {
      console.error('[Dashboard] Error loading stats:', error);
    }
  }

  // Trigger scraping job
  async function triggerScrape(config: TriggerConfig) {
    if (!supabase || triggering) return;

    setTriggering(config.source);

    try {
      let rpcFunction = '';
      let rpcParams = {};
      let edgeFunction = '';
      let edgeFunctionPayload = {};

      switch (config.source) {
        case 'hkex-di':
          rpcFunction = 'trigger_hkex_di_scrape';
          rpcParams = {
            p_stock_code: config.params?.stock_codes?.split(',')[0] || '00700',
            p_start_date: config.params?.start_date,
            p_end_date: config.params?.end_date
          };
          edgeFunction = 'hkex-disclosure-scraper';
          edgeFunctionPayload = {
            stock_codes: config.params?.stock_codes || '00700',
            start_date: config.params?.start_date || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            end_date: config.params?.end_date || new Date().toISOString().split('T')[0]
          };
          break;

        case 'sfc-rss':
          rpcFunction = 'trigger_sfc_rss_sync';
          edgeFunction = 'hksfc-rss-sync';
          edgeFunctionPayload = {};
          break;

        case 'sfc-stats':
          rpcFunction = 'trigger_sfc_stats_sync';
          rpcParams = {
            p_tables: config.params?.tables || ['A1', 'A2', 'A3', 'C4', 'C5', 'D3', 'D4']
          };
          edgeFunction = 'sfc-statistics-sync';
          edgeFunctionPayload = {
            tables: config.params?.tables || ['A1', 'A2', 'A3', 'C4', 'C5', 'D3', 'D4']
          };
          break;

        case 'ccass':
          rpcFunction = 'trigger_ccass_scrape';
          rpcParams = {
            p_stock_code: config.params?.stock_codes?.split(',')[0] || '00700',
            p_limit: config.params?.limit || 50
          };
          edgeFunction = 'ccass-scraper'; // Use standalone ccass-scraper
          edgeFunctionPayload = {
            stock_codes: config.params?.stock_codes || '00700',
            date_from: config.params?.date_from,
            date_to: config.params?.date_to,
            latest_only: config.params?.latest_only ?? true,
            limit: config.params?.limit || 50
          };
          break;
      }

      // Step 1: Create job record via RPC
      const { data: jobId, error: rpcError } = await supabase.rpc(rpcFunction, rpcParams);

      if (rpcError) throw rpcError;

      console.log(`[Dashboard] Created job record:`, jobId);

      // Step 2: Trigger edge function directly via HTTP
      const { data: supabaseSession } = await supabase.auth.getSession();
      const authToken = supabaseSession?.session?.access_token;

      const edgeFunctionUrl = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${edgeFunction}`;

      const response = await fetch(edgeFunctionUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${authToken || import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...edgeFunctionPayload,
          job_id: jobId // Pass job ID so edge function can update it
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`[Dashboard] Edge function error:`, errorText);
        throw new Error(`Edge function failed: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log(`[Dashboard] Edge function result:`, result);

      // Show success notification
      alert(`✅ ${config.label} scraping job started!\nJob ID: ${jobId}\nStatus: ${result.success ? 'Running' : 'Check logs for errors'}`);
    } catch (error) {
      console.error('[Dashboard] Error triggering scrape:', error);
      alert(`❌ Failed to trigger ${config.label}: ${error.message}`);
    } finally {
      setTriggering(null);
    }
  }

  // Filter jobs
  const filteredJobs = useMemo(() => {
    return jobs.filter(job => {
      if (filterSource !== 'all' && job.source !== filterSource) return false;
      if (filterStatus !== 'all' && job.status !== filterStatus) return false;
      return true;
    });
  }, [jobs, filterSource, filterStatus]);

  // Format duration
  function formatDuration(ms?: number): string {
    if (!ms) return 'N/A';
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
    return `${(ms / 60000).toFixed(1)}m`;
  }

  // Format date
  function formatDate(date?: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleString();
  }

  // Get status badge
  function getStatusBadge(status: string) {
    const badges = {
      pending: { bg: 'bg-gray-100', text: 'text-gray-800', icon: <Clock className="w-4 h-4" /> },
      running: { bg: 'bg-blue-100', text: 'text-blue-800', icon: <RefreshCw className="w-4 h-4 animate-spin" /> },
      completed: { bg: 'bg-green-100', text: 'text-green-800', icon: <CheckCircle className="w-4 h-4" /> },
      failed: { bg: 'bg-red-100', text: 'text-red-800', icon: <XCircle className="w-4 h-4" /> }
    };

    const badge = badges[status] || badges.pending;

    return (
      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        {badge.icon}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  }

  // Get source label
  function getSourceLabel(source: string): string {
    const labels = {
      'hkex-di': 'HKEX DI',
      'sfc-rss': 'SFC RSS',
      'sfc-stats': 'SFC Stats',
      'ccass': 'CCASS'
    };
    return labels[source] || source;
  }

  if (!supabase) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5" />
            <div>
              <h3 className="font-semibold text-yellow-900">Supabase Not Configured</h3>
              <p className="text-sm text-yellow-700 mt-1">
                This dashboard requires Supabase to be configured. Please set up your Supabase environment variables.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="border-b border-gray-200 pb-4">
        <h1 className="text-3xl font-bold text-gray-900">HK Financial Data Scraping</h1>
        <p className="text-gray-600 mt-1">Monitor and trigger web scraping jobs for Hong Kong financial data</p>
      </div>

      {/* Configuration Panel */}
      <section className="bg-white border border-gray-200 rounded-lg p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Scraping Configuration</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Stock Codes */}
          <div>
            <label htmlFor="stock-codes" className="block text-sm font-medium text-gray-700 mb-1">
              Stock Codes
            </label>
            <input
              id="stock-codes"
              type="text"
              value={stockCodes}
              onChange={(e) => setStockCodes(e.target.value)}
              placeholder="00700, 09988, 01810"
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">Comma-separated stock codes (max 20)</p>
          </div>

          {/* Latest Only Toggle */}
          <div className="flex items-center">
            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={latestOnly}
                  onChange={(e) => setLatestOnly(e.target.checked)}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">Latest Day Only</span>
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">Skip date range, fetch only today's data</p>
            </div>
          </div>

          {/* Date From */}
          <div>
            <label htmlFor="date-from" className="block text-sm font-medium text-gray-700 mb-1">
              Date From
            </label>
            <input
              id="date-from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              disabled={latestOnly}
              max={today}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>

          {/* Date To */}
          <div>
            <label htmlFor="date-to" className="block text-sm font-medium text-gray-700 mb-1">
              Date To
            </label>
            <input
              id="date-to"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              disabled={latestOnly}
              max={today}
              className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            />
          </div>
        </div>
        <p className="text-xs text-gray-500 mt-3 border-t border-gray-100 pt-2">
          <strong>Note:</strong> CCASS: max 100 days | HKEX DI: max 365 days | Applies to HKEX DI and CCASS scrapers
        </p>
      </section>

      {/* Quick Actions */}
      <section aria-labelledby="actions-heading">
        <h2 id="actions-heading" className="text-lg font-semibold text-gray-900 mb-3">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {triggers.map(trigger => (
            <button
              key={trigger.source}
              onClick={() => triggerScrape(trigger)}
              disabled={triggering !== null}
              className={`
                relative p-4 bg-white border-2 rounded-lg text-left transition-all
                hover:shadow-md focus:outline-none focus:ring-2 focus:ring-offset-2
                disabled:opacity-50 disabled:cursor-not-allowed
                border-${trigger.color}-200 hover:border-${trigger.color}-400
                focus:ring-${trigger.color}-500
              `}
              aria-label={`Trigger ${trigger.label} scraping job`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 bg-${trigger.color}-100 text-${trigger.color}-600 rounded-lg`}>
                  {trigger.icon}
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{trigger.label}</h3>
                  <p className="text-xs text-gray-600 mt-1">{trigger.description}</p>
                </div>
              </div>
              {triggering === trigger.source && (
                <div className="absolute inset-0 bg-white bg-opacity-50 rounded-lg flex items-center justify-center">
                  <RefreshCw className="w-6 h-6 text-gray-600 animate-spin" />
                </div>
              )}
            </button>
          ))}
        </div>
      </section>

      {/* Statistics */}
      <section aria-labelledby="stats-heading">
        <div className="flex items-center justify-between mb-3">
          <h2 id="stats-heading" className="text-lg font-semibold text-gray-900">
            Statistics
          </h2>
          <div className="flex items-center gap-2">
            <label htmlFor="stats-days" className="text-sm text-gray-600">
              Last
            </label>
            <select
              id="stats-days"
              value={statsDays}
              onChange={(e) => {
                setStatsDays(Number(e.target.value));
                loadStats();
              }}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={1}>1 day</option>
              <option value={7}>7 days</option>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map(stat => {
            const successRate = stat.total_jobs > 0
              ? ((stat.successful_jobs / stat.total_jobs) * 100).toFixed(1)
              : '0.0';

            return (
              <div key={stat.source} className="bg-white border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-medium text-gray-600">{getSourceLabel(stat.source)}</h3>
                  <TrendingUp className="w-4 h-4 text-gray-400" />
                </div>
                <div className="space-y-2">
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-bold text-gray-900">{stat.total_jobs}</span>
                    <span className="text-sm text-gray-500">jobs</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <span className="text-green-600">{stat.successful_jobs} ✓</span>
                    <span className="text-red-600">{stat.failed_jobs} ✗</span>
                    {stat.running_jobs > 0 && (
                      <span className="text-blue-600">{stat.running_jobs} ↻</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    Success rate: {successRate}%
                  </div>
                  <div className="text-xs text-gray-500">
                    Avg duration: {formatDuration(stat.avg_duration_ms)}
                  </div>
                  <div className="text-xs text-gray-500">
                    Records: {stat.total_records_inserted.toLocaleString()} inserted
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Job History */}
      <section aria-labelledby="history-heading">
        <div className="flex items-center justify-between mb-3">
          <h2 id="history-heading" className="text-lg font-semibold text-gray-900">
            Job History
          </h2>
          <div className="flex items-center gap-3">
            {/* Source filter */}
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                aria-label="Filter by source"
              >
                <option value="all">All Sources</option>
                <option value="hkex-di">HKEX DI</option>
                <option value="sfc-rss">SFC RSS</option>
                <option value="sfc-stats">SFC Stats</option>
                <option value="ccass">CCASS</option>
              </select>
            </div>

            {/* Status filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="text-sm border border-gray-300 rounded px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Filter by status"
            >
              <option value="all">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>

            {/* Refresh */}
            <button
              onClick={loadJobs}
              className="p-2 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded"
              aria-label="Refresh job list"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {loading ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <RefreshCw className="w-8 h-8 text-gray-400 animate-spin mx-auto mb-2" />
            <p className="text-gray-600">Loading jobs...</p>
          </div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
            <Database className="w-8 h-8 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-600">No jobs found</p>
            <p className="text-sm text-gray-500 mt-1">Trigger a scraping job to get started</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-900">Source</th>
                    <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-900">Status</th>
                    <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-900">Progress</th>
                    <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-900">Records</th>
                    <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-900">Duration</th>
                    <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-900">Created</th>
                    <th scope="col" className="px-4 py-3 text-left font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredJobs.map(job => (
                    <tr key={job.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        <span className="font-medium text-gray-900">
                          {getSourceLabel(job.source)}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        {getStatusBadge(job.status)}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="flex-1 bg-gray-200 rounded-full h-2 max-w-[100px]">
                            <div
                              className={`h-2 rounded-full transition-all ${
                                job.status === 'completed' ? 'bg-green-500' :
                                job.status === 'failed' ? 'bg-red-500' :
                                job.status === 'running' ? 'bg-blue-500' :
                                'bg-gray-400'
                              }`}
                              style={{ width: `${job.progress}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-600">{job.progress}%</span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs space-y-0.5">
                          <div className="text-green-600">↑ {job.records_inserted}</div>
                          <div className="text-blue-600">⟳ {job.records_updated}</div>
                          {job.records_failed > 0 && (
                            <div className="text-red-600">✗ {job.records_failed}</div>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {formatDuration(job.duration_ms)}
                      </td>
                      <td className="px-4 py-3 text-gray-600 text-xs">
                        {formatDate(job.created_at)}
                      </td>
                      <td className="px-4 py-3">
                        {job.error_message && (
                          <button
                            onClick={() => alert(`Error: ${job.error_message}\n\n${job.error_stack || ''}`)}
                            className="text-red-600 hover:text-red-800 text-xs"
                            aria-label="View error details"
                          >
                            View Error
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* Footer info */}
      <div className="text-center text-sm text-gray-500 pt-4 border-t border-gray-200">
        <p>Real-time updates enabled • Job history limited to 100 most recent entries</p>
        <p className="mt-1">
          For scheduled jobs, see pg_cron configuration in database migration
        </p>
      </div>
    </div>
  );
}
