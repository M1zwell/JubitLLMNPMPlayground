/**
 * HKSFC Filings Viewer Component - News/Regulatory Dashboard
 * Modern news-focused UI with expandable cards, badges, and timeline view
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
  Tag,
  Filter,
  X,
  ChevronDown,
  ChevronUp,
  Clock,
  TrendingUp,
  AlertTriangle,
  FileText,
  Grid,
  List,
  Newspaper
} from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

interface Filters {
  filingType: string;
  searchText: string;
  companyCode: string;
  dateFrom: string;
  dateTo: string;
  selectedTag: string;
  sortBy: string;
}

type ViewMode = 'cards' | 'timeline' | 'compact';

// Tag color mapping based on category
const getTagColor = (tag: string) => {
  const tagLower = tag.toLowerCase();
  if (tagLower.includes('compliance') || tagLower.includes('regulation')) return 'bg-red-100 text-red-700 border-red-200';
  if (tagLower.includes('disclosure') || tagLower.includes('announcement')) return 'bg-blue-100 text-blue-700 border-blue-200';
  if (tagLower.includes('financial') || tagLower.includes('report')) return 'bg-green-100 text-green-700 border-green-200';
  if (tagLower.includes('warning') || tagLower.includes('alert')) return 'bg-orange-100 text-orange-700 border-orange-200';
  return 'bg-purple-100 text-purple-700 border-purple-200';
};

// Filing type color mapping
const getFilingTypeColor = (type: string) => {
  const typeLower = type.toLowerCase();
  if (typeLower.includes('enforcement') || typeLower.includes('disciplinary')) return 'bg-red-500 text-white';
  if (typeLower.includes('consultation') || typeLower.includes('proposal')) return 'bg-blue-500 text-white';
  if (typeLower.includes('guideline') || typeLower.includes('circular')) return 'bg-green-500 text-white';
  if (typeLower.includes('news') || typeLower.includes('announcement')) return 'bg-purple-500 text-white';
  return 'bg-gray-500 text-white';
};

// Calculate reading time
const getReadingTime = (content?: string, summary?: string): string => {
  const text = (content || summary || '');
  const words = text.split(/\s+/).length;
  const minutes = Math.ceil(words / 200);
  return minutes === 1 ? '1 min read' : `${minutes} min read`;
};

// Check if filing is new (within last 7 days)
const isNewFiling = (filingDate?: string, scrapedDate?: string): boolean => {
  const date = new Date(filingDate || scrapedDate || '');
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = diffTime / (1000 * 60 * 60 * 24);
  return diffDays <= 7;
};

// Format relative time
const getRelativeTime = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffTime / (1000 * 60 * 60));

  if (diffHours < 1) return 'Just now';
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
  return date.toLocaleDateString();
};

export default function HKSFCViewer() {
  const [data, setData] = useState<HKSFCFiling[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('cards');
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());

  const [filters, setFilters] = useState<Filters>({
    filingType: 'all',
    searchText: '',
    companyCode: '',
    dateFrom: '',
    dateTo: '',
    selectedTag: 'all',
    sortBy: 'date-desc'
  });

  const [showFilters, setShowFilters] = useState(true);

  // Fetch data from database
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: filings, error: fetchError } = await supabase
        .from('hksfc_filings')
        .select('*')
        .order('filing_date', { ascending: false })
        .limit(500);

      if (fetchError) throw fetchError;
      setData(filings || []);
    } catch (err) {
      console.error('Error fetching HKSFC data:', err);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Get all unique tags and filing types
  const getAllTags = () => {
    const tags = new Set<string>();
    data.forEach(f => f.tags?.forEach(t => tags.add(t)));
    return Array.from(tags).sort();
  };

  const getAllFilingTypes = () => {
    const types = new Set<string>();
    data.forEach(f => types.add(f.filing_type));
    return Array.from(types).sort();
  };

  // Filter and sort data
  const getFilteredData = () => {
    let filtered = [...data];

    if (filters.filingType !== 'all') {
      filtered = filtered.filter(f => f.filing_type === filters.filingType);
    }

    if (filters.searchText) {
      const search = filters.searchText.toLowerCase();
      filtered = filtered.filter(f =>
        f.title.toLowerCase().includes(search) ||
        f.content?.toLowerCase().includes(search) ||
        f.summary?.toLowerCase().includes(search)
      );
    }

    if (filters.companyCode) {
      filtered = filtered.filter(f =>
        f.company_code?.includes(filters.companyCode)
      );
    }

    if (filters.selectedTag !== 'all') {
      filtered = filtered.filter(f =>
        f.tags?.includes(filters.selectedTag)
      );
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(f => {
        if (!f.filing_date) return false;
        return new Date(f.filing_date) >= new Date(filters.dateFrom);
      });
    }

    if (filters.dateTo) {
      filtered = filtered.filter(f => {
        if (!f.filing_date) return false;
        return new Date(f.filing_date) <= new Date(filters.dateTo);
      });
    }

    filtered.sort((a, b) => {
      switch (filters.sortBy) {
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

  const filteredData = getFilteredData();

  const clearFilters = () => {
    setFilters({
      filingType: 'all',
      searchText: '',
      companyCode: '',
      dateFrom: '',
      dateTo: '',
      selectedTag: 'all',
      sortBy: 'date-desc'
    });
  };

  const toggleCard = (id: string) => {
    const newExpanded = new Set(expandedCards);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedCards(newExpanded);
  };

  const exportToJSON = () => {
    const dataStr = JSON.stringify(filteredData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hksfc-filings-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const exportToCSV = () => {
    const headers = ['Title', 'Type', 'Company Code', 'Company Name', 'Filing Date', 'Summary', 'URL', 'PDF URL', 'Tags'];
    const rows = filteredData.map(f => [
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

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 rounded-2xl shadow-xl p-6 border border-green-100">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent flex items-center gap-3">
              <Newspaper className="text-green-500" size={32} />
              HKSFC Regulatory News
            </h2>
            <p className="text-gray-600 mt-2">Securities & Futures Commission - Latest Filings & Announcements</p>
          </div>
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="px-5 py-2.5 bg-green-500 text-white rounded-xl hover:bg-green-600 flex items-center gap-2 shadow-lg hover:shadow-xl transition-all font-semibold"
          >
            <Search size={18} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white/80 backdrop-blur rounded-xl p-4 shadow-md border border-green-100">
            <p className="text-sm text-gray-600 font-medium">Total Filings</p>
            <p className="text-3xl font-bold text-green-600 mt-1">{data.length}</p>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-xl p-4 shadow-md border border-blue-100">
            <p className="text-sm text-gray-600 font-medium">Showing</p>
            <p className="text-3xl font-bold text-blue-600 mt-1">{filteredData.length}</p>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-xl p-4 shadow-md border border-purple-100">
            <p className="text-sm text-gray-600 font-medium">Categories</p>
            <p className="text-3xl font-bold text-purple-600 mt-1">{getAllFilingTypes().length}</p>
          </div>
          <div className="bg-white/80 backdrop-blur rounded-xl p-4 shadow-md border border-orange-100">
            <p className="text-sm text-gray-600 font-medium">New (7d)</p>
            <p className="text-3xl font-bold text-orange-600 mt-1">
              {data.filter(f => isNewFiling(f.filing_date, f.scraped_at)).length}
            </p>
          </div>
        </div>
      </div>

      {/* View Mode Selector */}
      <div className="bg-white rounded-xl shadow-md p-4 border border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-gray-700">View Mode:</span>
            <div className="flex gap-1 p-1 bg-gray-100 rounded-lg">
              <button
                onClick={() => setViewMode('cards')}
                className={`px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 text-sm ${
                  viewMode === 'cards'
                    ? 'bg-white text-green-600 shadow'
                    : 'text-gray-600 hover:bg-white/50'
                }`}
              >
                <Grid size={16} />
                Cards
              </button>
              <button
                onClick={() => setViewMode('timeline')}
                className={`px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 text-sm ${
                  viewMode === 'timeline'
                    ? 'bg-white text-green-600 shadow'
                    : 'text-gray-600 hover:bg-white/50'
                }`}
              >
                <Clock size={16} />
                Timeline
              </button>
              <button
                onClick={() => setViewMode('compact')}
                className={`px-4 py-2 rounded-md font-medium transition-all flex items-center gap-2 text-sm ${
                  viewMode === 'compact'
                    ? 'bg-white text-green-600 shadow'
                    : 'text-gray-600 hover:bg-white/50'
                }`}
              >
                <List size={16} />
                Compact
              </button>
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={exportToJSON}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2 text-sm shadow hover:shadow-md transition-all"
            >
              <FileJson size={14} />
              JSON
            </button>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2 text-sm shadow hover:shadow-md transition-all"
            >
              <FileSpreadsheet size={14} />
              CSV
            </button>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
        <div className="px-6 py-4 bg-gradient-to-r from-gray-50 to-green-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 font-semibold text-gray-900 hover:text-green-600 transition-colors"
            >
              <Filter size={18} />
              Filters & Search
              {!showFilters && <span className="text-sm text-gray-500">({filteredData.length} results)</span>}
            </button>
            <div className="flex items-center gap-2">
              {(filters.searchText || filters.filingType !== 'all' || filters.companyCode ||
                filters.dateFrom || filters.dateTo || filters.selectedTag !== 'all') && (
                <button
                  onClick={clearFilters}
                  className="text-sm text-red-600 hover:text-red-700 flex items-center gap-1 font-medium"
                >
                  <X size={14} />
                  Clear all
                </button>
              )}
            </div>
          </div>
        </div>

        {showFilters && (
          <div className="p-6 bg-gradient-to-br from-gray-50 to-green-50/30">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
              {/* Search Text */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                  <Search size={14} className="text-green-500" />
                  Search Keywords
                </label>
                <input
                  type="text"
                  value={filters.searchText}
                  onChange={(e) => setFilters({...filters, searchText: e.target.value})}
                  placeholder="Search title, summary, content..."
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-500"
                />
              </div>

              {/* Filing Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                  <FileText size={14} className="text-blue-500" />
                  Filing Type
                </label>
                <select
                  value={filters.filingType}
                  onChange={(e) => setFilters({...filters, filingType: e.target.value})}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 font-medium"
                >
                  <option value="all">All Types ({data.length})</option>
                  {getAllFilingTypes().map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Tag Filter */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                  <Tag size={14} className="text-purple-500" />
                  Topic Tag
                </label>
                <select
                  value={filters.selectedTag}
                  onChange={(e) => setFilters({...filters, selectedTag: e.target.value})}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 font-medium"
                >
                  <option value="all">All Topics</option>
                  {getAllTags().map(tag => (
                    <option key={tag} value={tag}>{tag}</option>
                  ))}
                </select>
              </div>

              {/* Company Code */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                  <Building2 size={14} className="text-gray-500" />
                  Company Code
                </label>
                <input
                  type="text"
                  value={filters.companyCode}
                  onChange={(e) => setFilters({...filters, companyCode: e.target.value})}
                  placeholder="e.g., 00700"
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900 placeholder-gray-500"
                />
              </div>

              {/* Date From */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                  <Calendar size={14} className="text-blue-500" />
                  Date From
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-2 flex items-center gap-1">
                  <Calendar size={14} className="text-blue-500" />
                  Date To
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                  className="w-full px-4 py-2.5 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-gray-900"
                />
              </div>
            </div>

            {/* Sort */}
            <div className="flex items-center gap-3 pt-4 border-t border-gray-200">
              <label className="text-sm font-semibold text-gray-900">Sort by:</label>
              <select
                value={filters.sortBy}
                onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                className="px-4 py-2 text-sm border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 text-gray-900 font-medium"
              >
                <option value="date-desc">📅 Date (Newest First)</option>
                <option value="date-asc">📅 Date (Oldest First)</option>
                <option value="type">📑 Filing Type</option>
                <option value="company">🏢 Company Code</option>
              </select>
            </div>
          </div>
        )}
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-3 shadow-md">
          <AlertCircle className="text-red-500" size={24} />
          <div>
            <p className="text-red-700 font-semibold">Error loading filings</p>
            <p className="text-red-600 text-sm">{error}</p>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="bg-green-50 border-2 border-green-200 rounded-xl p-12 flex flex-col items-center justify-center gap-3 shadow-md">
          <Loader2 className="animate-spin text-green-500" size={48} />
          <p className="text-green-700 font-semibold text-lg">Loading regulatory filings...</p>
        </div>
      )}

      {/* Results */}
      {!isLoading && !error && (
        <div className="space-y-4">
          {filteredData.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-2xl shadow-lg border border-gray-200">
              <Newspaper className="mx-auto text-gray-400 mb-4" size={64} />
              <p className="text-gray-600 text-lg font-medium mb-2">No filings found matching your criteria</p>
              <p className="text-gray-500 text-sm mb-4">Try adjusting your filters or search terms</p>
              <button
                onClick={clearFilters}
                className="mt-4 px-6 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold shadow-md hover:shadow-lg transition-all"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <>
              {/* Cards View */}
              {viewMode === 'cards' && (
                <div className="grid grid-cols-1 gap-5">
                  {filteredData.map(filing => (
                    <div key={filing.id} className="bg-white rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 group">
                      {/* Card Header */}
                      <div className="p-6">
                        <div className="flex items-start justify-between gap-4 mb-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-3">
                              {isNewFiling(filing.filing_date, filing.scraped_at) && (
                                <span className="px-3 py-1 bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-bold rounded-full shadow-md animate-pulse">
                                  🔥 NEW
                                </span>
                              )}
                              <span className={`px-3 py-1.5 text-xs font-bold rounded-lg shadow-sm ${getFilingTypeColor(filing.filing_type)}`}>
                                {filing.filing_type}
                              </span>
                              {filing.company_code && (
                                <span className="px-3 py-1.5 bg-green-100 text-green-700 text-sm font-mono rounded-lg border border-green-200 font-semibold">
                                  {filing.company_code}
                                </span>
                              )}
                            </div>
                            <h3 className="font-bold text-xl text-gray-900 leading-tight mb-2 group-hover:text-green-600 transition-colors">
                              {filing.title}
                            </h3>
                          </div>
                          <button
                            onClick={() => toggleCard(filing.id)}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors flex-shrink-0"
                          >
                            {expandedCards.has(filing.id) ? (
                              <ChevronUp size={24} className="text-gray-600" />
                            ) : (
                              <ChevronDown size={24} className="text-gray-600" />
                            )}
                          </button>
                        </div>

                        {/* Summary */}
                        {filing.summary && (
                          <p className="text-gray-700 text-sm leading-relaxed mb-4 line-clamp-2">
                            {filing.summary}
                          </p>
                        )}

                        {/* Tags */}
                        {filing.tags && filing.tags.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-4">
                            {filing.tags.map((tag, idx) => (
                              <span
                                key={idx}
                                className={`px-3 py-1 text-xs font-semibold rounded-lg border flex items-center gap-1 ${getTagColor(tag)}`}
                              >
                                <Tag size={10} />
                                {tag}
                              </span>
                            ))}
                          </div>
                        )}

                        {/* Metadata */}
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 pb-4 border-b border-gray-100">
                          {filing.filing_date && (
                            <span className="flex items-center gap-1.5 font-medium">
                              <Calendar size={16} className="text-blue-500" />
                              {new Date(filing.filing_date).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric'
                              })}
                              <span className="text-xs text-gray-500">({getRelativeTime(filing.filing_date)})</span>
                            </span>
                          )}
                          {filing.company_name && (
                            <span className="flex items-center gap-1.5 truncate font-medium">
                              <Building2 size={16} className="text-green-500" />
                              {filing.company_name}
                            </span>
                          )}
                          <span className="flex items-center gap-1.5 text-gray-500">
                            <Clock size={16} />
                            {getReadingTime(filing.content, filing.summary)}
                          </span>
                        </div>

                        {/* Expanded Content */}
                        {expandedCards.has(filing.id) && filing.content && (
                          <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
                              <FileText size={16} className="text-green-500" />
                              Full Content
                            </h4>
                            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto">
                              {filing.content}
                            </div>
                          </div>
                        )}

                        {/* Actions */}
                        <div className="flex items-center gap-4 mt-4">
                          <a
                            href={filing.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex-1 px-4 py-2.5 bg-green-500 text-white rounded-lg hover:bg-green-600 font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                          >
                            <Eye size={16} />
                            View Full Filing
                          </a>
                          {filing.pdf_url && (
                            <a
                              href={filing.pdf_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 px-4 py-2.5 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold flex items-center justify-center gap-2 shadow-md hover:shadow-lg transition-all"
                            >
                              <Download size={16} />
                              Download PDF
                            </a>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Timeline View */}
              {viewMode === 'timeline' && (
                <div className="relative">
                  <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gradient-to-b from-green-200 via-blue-200 to-purple-200"></div>
                  <div className="space-y-6">
                    {filteredData.map((filing, index) => (
                      <div key={filing.id} className="relative pl-16">
                        <div className="absolute left-5 w-6 h-6 bg-green-500 rounded-full border-4 border-white shadow-lg flex items-center justify-center">
                          <div className="w-2 h-2 bg-white rounded-full"></div>
                        </div>
                        <div className="bg-white rounded-xl shadow-md hover:shadow-xl transition-all p-5 border border-gray-200">
                          <div className="flex items-center gap-3 mb-2">
                            {isNewFiling(filing.filing_date, filing.scraped_at) && (
                              <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded-full">NEW</span>
                            )}
                            <span className="text-sm font-bold text-gray-500">
                              {filing.filing_date ? new Date(filing.filing_date).toLocaleDateString() : 'No date'}
                            </span>
                            <span className="text-xs text-gray-400">•</span>
                            <span className="text-xs text-gray-500">{getRelativeTime(filing.filing_date || filing.scraped_at)}</span>
                          </div>
                          <h4 className="font-bold text-gray-900 mb-2">{filing.title}</h4>
                          {filing.summary && (
                            <p className="text-sm text-gray-600 mb-3">{filing.summary}</p>
                          )}
                          <div className="flex items-center gap-3">
                            <span className={`px-2 py-1 text-xs font-bold rounded ${getFilingTypeColor(filing.filing_type)}`}>
                              {filing.filing_type}
                            </span>
                            {filing.company_code && (
                              <span className="px-2 py-1 bg-green-100 text-green-700 text-xs font-mono rounded">
                                {filing.company_code}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Compact View */}
              {viewMode === 'compact' && (
                <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200">
                  <div className="divide-y divide-gray-100">
                    {filteredData.map(filing => (
                      <div key={filing.id} className="p-4 hover:bg-green-50 transition-colors">
                        <div className="flex items-center justify-between gap-4">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              {isNewFiling(filing.filing_date, filing.scraped_at) && (
                                <span className="px-2 py-0.5 bg-red-500 text-white text-xs font-bold rounded">NEW</span>
                              )}
                              <h4 className="font-semibold text-gray-900 truncate">{filing.title}</h4>
                            </div>
                            <div className="flex items-center gap-3 text-xs text-gray-600">
                              <span className={`px-2 py-0.5 rounded ${getFilingTypeColor(filing.filing_type)}`}>
                                {filing.filing_type}
                              </span>
                              {filing.filing_date && (
                                <span>{new Date(filing.filing_date).toLocaleDateString()}</span>
                              )}
                              {filing.company_code && (
                                <span className="font-mono">{filing.company_code}</span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <a
                              href={filing.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-green-600 hover:bg-green-100 rounded-lg transition-colors"
                            >
                              <Eye size={18} />
                            </a>
                            {filing.pdf_url && (
                              <a
                                href={filing.pdf_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="p-2 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors"
                              >
                                <Download size={18} />
                              </a>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
