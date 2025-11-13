/**
 * HKEX Announcements Viewer Component
 * Display and filter Hong Kong Stock Exchange announcements
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
  X
} from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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

interface Filters {
  announcementType: string;
  searchText: string;
  companyCode: string;
  dateFrom: string;
  dateTo: string;
  sortBy: string;
}

export default function HKEXViewer() {
  const [data, setData] = useState<HKEXAnnouncement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<Filters>({
    announcementType: 'all',
    searchText: '',
    companyCode: '',
    dateFrom: '',
    dateTo: '',
    sortBy: 'date-desc'
  });

  const [showFilters, setShowFilters] = useState(true);

  // Fetch data from database
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: announcements, error: fetchError } = await supabase
        .from('hkex_announcements')
        .select('*')
        .order('scraped_at', { ascending: false })
        .limit(500);

      if (fetchError) throw fetchError;
      setData(announcements || []);
    } catch (err) {
      console.error('Error fetching HKEX data:', err);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Get all unique announcement types
  const getAllAnnouncementTypes = () => {
    const types = new Set<string>();
    data.forEach(a => types.add(a.announcement_type));
    return Array.from(types).sort();
  };

  // Filter and sort data
  const getFilteredData = () => {
    let filtered = [...data];

    if (filters.announcementType !== 'all') {
      filtered = filtered.filter(a => a.announcement_type === filters.announcementType);
    }

    if (filters.searchText) {
      const search = filters.searchText.toLowerCase();
      filtered = filtered.filter(a =>
        a.announcement_title.toLowerCase().includes(search) ||
        a.announcement_content?.toLowerCase().includes(search) ||
        a.company_name?.toLowerCase().includes(search)
      );
    }

    if (filters.companyCode) {
      filtered = filtered.filter(a =>
        a.company_code?.includes(filters.companyCode)
      );
    }

    if (filters.dateFrom) {
      filtered = filtered.filter(a => {
        if (!a.announcement_date) return false;
        return new Date(a.announcement_date) >= new Date(filters.dateFrom);
      });
    }

    if (filters.dateTo) {
      filtered = filtered.filter(a => {
        if (!a.announcement_date) return false;
        return new Date(a.announcement_date) <= new Date(filters.dateTo);
      });
    }

    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'date-desc':
          return new Date(b.announcement_date || b.scraped_at).getTime() -
                 new Date(a.announcement_date || a.scraped_at).getTime();
        case 'date-asc':
          return new Date(a.announcement_date || a.scraped_at).getTime() -
                 new Date(b.announcement_date || b.scraped_at).getTime();
        case 'type':
          return a.announcement_type.localeCompare(b.announcement_type);
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
      announcementType: 'all',
      searchText: '',
      companyCode: '',
      dateFrom: '',
      dateTo: '',
      sortBy: 'date-desc'
    });
  };

  const exportToJSON = () => {
    const dataStr = JSON.stringify(filteredData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hkex-announcements-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const exportToCSV = () => {
    const headers = ['Title', 'Type', 'Company Code', 'Company Name', 'Announcement Date', 'Content', 'URL'];
    const rows = filteredData.map(a => [
      a.announcement_title,
      a.announcement_type,
      a.company_code || '',
      a.company_name || '',
      a.announcement_date || '',
      a.announcement_content || '',
      a.url
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    const dataBlob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `hkex-announcements-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <TrendingUp className="text-purple-500" />
              HKEX Announcements Viewer
            </h2>
            <p className="text-gray-600 mt-1">Hong Kong Stock Exchange corporate announcements</p>
          </div>
          <button
            onClick={fetchData}
            disabled={isLoading}
            className="px-4 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
          >
            <Search size={16} className={isLoading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          <div className="bg-white rounded-lg p-4 shadow">
            <p className="text-sm text-gray-600">Total Announcements</p>
            <p className="text-2xl font-bold text-purple-600">{data.length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <p className="text-sm text-gray-600">Filtered Results</p>
            <p className="text-2xl font-bold text-blue-600">{filteredData.length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <p className="text-sm text-gray-600">Announcement Types</p>
            <p className="text-2xl font-bold text-pink-600">{getAllAnnouncementTypes().length}</p>
          </div>
        </div>
      </div>

      {/* Filter Panel */}
      <div className="bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 font-semibold text-gray-900 hover:text-purple-600 transition-colors"
            >
              <Filter size={18} />
              Filters & Search
              {!showFilters && <span className="text-sm text-gray-500">({filteredData.length} results)</span>}
            </button>
            <div className="flex items-center gap-2">
              {(filters.searchText || filters.announcementType !== 'all' || filters.companyCode ||
                filters.dateFrom || filters.dateTo) && (
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
          <div className="p-6 bg-gradient-to-br from-gray-50 to-purple-50">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
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
                  placeholder="Search title, content..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-500"
                />
              </div>

              {/* Announcement Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  <Building2 size={14} className="inline mr-1" />
                  Announcement Type
                </label>
                <select
                  value={filters.announcementType}
                  onChange={(e) => setFilters({...filters, announcementType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 font-medium"
                >
                  <option value="all">All Types</option>
                  {getAllAnnouncementTypes().map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Company Code */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">Company Code</label>
                <input
                  type="text"
                  value={filters.companyCode}
                  onChange={(e) => setFilters({...filters, companyCode: e.target.value})}
                  placeholder="e.g., 00700"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-500"
                />
              </div>

              {/* Date From */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  <Calendar size={14} className="inline mr-1" />
                  Date From
                </label>
                <input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({...filters, dateFrom: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-500"
                />
              </div>

              {/* Date To */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  <Calendar size={14} className="inline mr-1" />
                  Date To
                </label>
                <input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({...filters, dateTo: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 text-gray-900 placeholder-gray-500"
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
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 text-gray-900 font-medium"
                >
                  <option value="date-desc">Date (Newest First)</option>
                  <option value="date-asc">Date (Oldest First)</option>
                  <option value="type">Announcement Type</option>
                  <option value="company">Company Code</option>
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
        <div className="bg-purple-50 border border-purple-200 rounded-lg p-8 flex items-center justify-center gap-2">
          <Loader2 className="animate-spin text-purple-500" size={24} />
          <p className="text-purple-700">Loading HKEX announcements...</p>
        </div>
      )}

      {/* Results */}
      {!isLoading && !error && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-semibold text-gray-900">
              Showing {filteredData.length} {filteredData.length === 1 ? 'announcement' : 'announcements'}
            </h3>
          </div>

          {filteredData.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow">
              <TrendingUp className="mx-auto text-gray-400 mb-2" size={48} />
              <p className="text-gray-500">No announcements found matching your criteria</p>
              <button
                onClick={clearFilters}
                className="mt-4 text-sm text-purple-600 hover:text-purple-700 hover:underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredData.map(announcement => (
                <div key={announcement.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-5 border border-gray-100">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h4 className="font-semibold text-gray-900 flex-1 leading-snug">{announcement.announcement_title}</h4>
                    {announcement.company_code && (
                      <span className="px-3 py-1 bg-purple-100 text-purple-700 text-sm font-mono rounded-lg">
                        {announcement.company_code}
                      </span>
                    )}
                  </div>

                  {/* Content Preview */}
                  {announcement.announcement_content && (
                    <p className="text-sm text-gray-600 mb-3 leading-relaxed line-clamp-2">
                      {announcement.announcement_content}
                    </p>
                  )}

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3 pb-3 border-b border-gray-100">
                    <span className="flex items-center gap-1">
                      <Building2 size={14} className="text-purple-500" />
                      {announcement.announcement_type}
                    </span>
                    {announcement.announcement_date && (
                      <span className="flex items-center gap-1">
                        <Calendar size={14} className="text-blue-500" />
                        {new Date(announcement.announcement_date).toLocaleDateString()}
                      </span>
                    )}
                    {announcement.company_name && (
                      <span className="truncate flex items-center gap-1">
                        <Building2 size={14} className="text-gray-400" />
                        {announcement.company_name}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3">
                    <a
                      href={announcement.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-purple-600 hover:text-purple-700 font-medium flex items-center gap-1 hover:underline"
                    >
                      <Eye size={14} />
                      View Announcement
                    </a>
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
