/**
 * CIMA Entities Viewer Component
 * Display and filter Cayman Islands Monetary Authority regulated entities
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
  Shield,
  Filter,
  X,
  Globe,
  Award,
  MapPin,
  Database,
  CheckCircle2
} from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

interface CIMAEntity {
  id: string;
  entity_name: string;
  entity_type: string;
  entity_category?: string;
  license_number?: string;
  license_status?: string;
  registration_date?: string;
  expiry_date?: string;
  registered_agent_status?: boolean;
  address?: string;
  contact_phone?: string;
  contact_email?: string;
  website?: string;
  jurisdiction: string;
  additional_info?: Record<string, any>;
  scraped_at: string;
}

interface Filters {
  entityType: string;
  entityCategory: string;
  searchText: string;
  licenseStatus: string;
  registeredAgentStatus: string;
  sortBy: string;
}

const ENTITY_TYPES = [
  'Banking, Financing and Money Services',
  'Trust & Corporate Services Providers',
  'Insurance',
  'Investment Business',
  'Insolvency Practitioners',
  'Registered Agents',
  'Virtual Assets Service Providers',
  'Mutual Fund - Administered',
  'Mutual Fund - Licenced',
  'Mutual Fund - Limited Investor',
  'Mutual Fund - Master Fund',
  'Mutual Fund - Registered',
  'Mutual Fund Administrator - Full',
  'Mutual Fund Administrator - Restricted'
];

const TRUST_CATEGORIES = [
  'Class I Trust Licences - Registered Agent Status',
  'Class I Trust Licences No Registered Agent Status',
  'Class II Trust Licences',
  'Class III Licences',
  'Company Management',
  'Restricted Class II Trust Licences',
  'Restricted Class III Licences'
];

export default function CIMAViewer() {
  const [data, setData] = useState<CIMAEntity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<Filters>({
    entityType: 'all',
    entityCategory: 'all',
    searchText: '',
    licenseStatus: 'all',
    registeredAgentStatus: 'all',
    sortBy: 'name-asc'
  });

  const [showFilters, setShowFilters] = useState(true);

  // Update functionality state
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateResult, setUpdateResult] = useState<any>(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [selectedEntityTypes, setSelectedEntityTypes] = useState<string[]>(ENTITY_TYPES);
  const [selectedTrustCategories, setSelectedTrustCategories] = useState<string[]>(TRUST_CATEGORIES);
  const [clearExisting, setClearExisting] = useState(false);

  // Fetch data from database
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: entities, error: fetchError } = await supabase
        .from('cima_entities')
        .select('*')
        .order('entity_name', { ascending: true })
        .limit(1000);

      if (fetchError) throw fetchError;
      setData(entities || []);
    } catch (err) {
      console.error('Error fetching CIMA data:', err);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update data from CIMA source
  const updateDataFromSource = async () => {
    setIsUpdating(true);
    setUpdateResult(null);
    try {
      const response = await fetch(`${SUPABASE_URL}/functions/v1/cima-scraper`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          entity_types: selectedEntityTypes,
          trust_categories: selectedTrustCategories,
          clear_existing: clearExisting
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      setUpdateResult(result);

      // Refresh data after update
      await fetchData();
    } catch (err) {
      console.error('Error updating CIMA data:', err);
      setUpdateResult({
        success: false,
        error: (err as Error).message
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Toggle entity type selection
  const toggleEntityType = (type: string) => {
    setSelectedEntityTypes(prev =>
      prev.includes(type)
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  // Toggle trust category selection
  const toggleTrustCategory = (category: string) => {
    setSelectedTrustCategories(prev =>
      prev.includes(category)
        ? prev.filter(c => c !== category)
        : [...prev, category]
    );
  };

  // Get all unique license statuses
  const getAllLicenseStatuses = () => {
    const statuses = new Set<string>();
    data.forEach(e => {
      if (e.license_status) statuses.add(e.license_status);
    });
    return Array.from(statuses).sort();
  };

  // Filter and sort data
  const getFilteredData = () => {
    let filtered = [...data];

    if (filters.entityType !== 'all') {
      filtered = filtered.filter(e => e.entity_type === filters.entityType);
    }

    if (filters.entityCategory !== 'all') {
      filtered = filtered.filter(e => e.entity_category === filters.entityCategory);
    }

    if (filters.searchText) {
      const search = filters.searchText.toLowerCase();
      filtered = filtered.filter(e =>
        e.entity_name.toLowerCase().includes(search) ||
        e.license_number?.toLowerCase().includes(search) ||
        e.address?.toLowerCase().includes(search)
      );
    }

    if (filters.licenseStatus !== 'all') {
      filtered = filtered.filter(e => e.license_status === filters.licenseStatus);
    }

    if (filters.registeredAgentStatus !== 'all') {
      const hasStatus = filters.registeredAgentStatus === 'yes';
      filtered = filtered.filter(e => e.registered_agent_status === hasStatus);
    }

    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case 'name-asc':
          return a.entity_name.localeCompare(b.entity_name);
        case 'name-desc':
          return b.entity_name.localeCompare(a.entity_name);
        case 'type':
          return a.entity_type.localeCompare(b.entity_type);
        case 'status':
          return (a.license_status || '').localeCompare(b.license_status || '');
        default:
          return 0;
      }
    });

    return filtered;
  };

  const filteredData = getFilteredData();

  const clearFilters = () => {
    setFilters({
      entityType: 'all',
      entityCategory: 'all',
      searchText: '',
      licenseStatus: 'all',
      registeredAgentStatus: 'all',
      sortBy: 'name-asc'
    });
  };

  const exportToJSON = () => {
    const dataStr = JSON.stringify(filteredData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cima-entities-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const exportToCSV = () => {
    const headers = ['Entity Name', 'Type', 'Category', 'License Number', 'Status', 'Registration Date', 'Address', 'Phone', 'Email', 'Website'];
    const rows = filteredData.map(e => [
      e.entity_name,
      e.entity_type,
      e.entity_category || '',
      e.license_number || '',
      e.license_status || '',
      e.registration_date || '',
      e.address || '',
      e.contact_phone || '',
      e.contact_email || '',
      e.website || ''
    ]);
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    const dataBlob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `cima-entities-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-cyan-50 to-blue-50 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="text-cyan-500" />
              CIMA Regulated Entities
            </h2>
            <p className="text-gray-600 mt-1">Cayman Islands Monetary Authority licensed entities</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="px-4 py-2 bg-cyan-500 text-white rounded-lg hover:bg-cyan-600 flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
            >
              <Search size={16} className={isLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={() => setShowUpdateDialog(true)}
              disabled={isUpdating}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
            >
              <Database size={16} className={isUpdating ? 'animate-pulse' : ''} />
              Update Data
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white rounded-lg p-4 shadow">
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <Database size={14} />
              Total Entities
            </p>
            <p className="text-2xl font-bold text-cyan-600">{data.length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <Search size={14} />
              Filtered Results
            </p>
            <p className="text-2xl font-bold text-blue-600">{filteredData.length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <CheckCircle2 size={14} />
              Active Licenses
            </p>
            <p className="text-2xl font-bold text-green-600">
              {data.filter(e => e.license_status?.toLowerCase().includes('active')).length}
            </p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <Building2 size={14} />
              Entity Types
            </p>
            <p className="text-2xl font-bold text-teal-600">{new Set(data.map(e => e.entity_type)).size}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <p className="text-sm text-gray-600 flex items-center gap-1">
              <Calendar size={14} />
              Last Updated
            </p>
            <p className="text-sm font-bold text-gray-700">
              {data.length > 0
                ? new Date(Math.max(...data.map(e => new Date(e.scraped_at).getTime()))).toLocaleDateString()
                : 'Never'}
            </p>
            <p className="text-xs text-gray-500">
              {data.length > 0
                ? new Date(Math.max(...data.map(e => new Date(e.scraped_at).getTime()))).toLocaleTimeString()
                : ''}
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
              className="flex items-center gap-2 font-semibold text-gray-900 hover:text-cyan-600 transition-colors"
            >
              <Filter size={18} />
              Filters & Search
              {!showFilters && <span className="text-sm text-gray-500">({filteredData.length} results)</span>}
            </button>
            <div className="flex items-center gap-2">
              {(filters.searchText || filters.entityType !== 'all' || filters.entityCategory !== 'all' ||
                filters.licenseStatus !== 'all' || filters.registeredAgentStatus !== 'all') && (
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
          <div className="p-6 bg-gradient-to-br from-gray-50 to-cyan-50">
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
                  placeholder="Search name, license number..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-gray-900 placeholder-gray-500"
                />
              </div>

              {/* Entity Type */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  <Building2 size={14} className="inline mr-1" />
                  Entity Type
                </label>
                <select
                  value={filters.entityType}
                  onChange={(e) => setFilters({...filters, entityType: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-gray-900 font-medium"
                >
                  <option value="all">All Types</option>
                  {ENTITY_TYPES.map(type => (
                    <option key={type} value={type}>{type}</option>
                  ))}
                </select>
              </div>

              {/* Entity Category (for Trust providers) */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  <Award size={14} className="inline mr-1" />
                  Category (Trust)
                </label>
                <select
                  value={filters.entityCategory}
                  onChange={(e) => setFilters({...filters, entityCategory: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-gray-900 font-medium"
                  disabled={filters.entityType !== 'Trust & Corporate Services Providers'}
                >
                  <option value="all">All Categories</option>
                  {TRUST_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* License Status */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">
                  <Shield size={14} className="inline mr-1" />
                  License Status
                </label>
                <select
                  value={filters.licenseStatus}
                  onChange={(e) => setFilters({...filters, licenseStatus: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-gray-900 font-medium"
                >
                  <option value="all">All Statuses</option>
                  {getAllLicenseStatuses().map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>

              {/* Registered Agent Status */}
              <div>
                <label className="block text-sm font-semibold text-gray-900 mb-1">Registered Agent</label>
                <select
                  value={filters.registeredAgentStatus}
                  onChange={(e) => setFilters({...filters, registeredAgentStatus: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500 text-gray-900 font-medium"
                >
                  <option value="all">All</option>
                  <option value="yes">Has Registered Agent Status</option>
                  <option value="no">No Registered Agent Status</option>
                </select>
              </div>
            </div>

            {/* Sort and Export */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium text-gray-700">Sort by:</label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => setFilters({...filters, sortBy: e.target.value})}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-cyan-500"
                >
                  <option value="name-asc">Name (A-Z)</option>
                  <option value="name-desc">Name (Z-A)</option>
                  <option value="type">Entity Type</option>
                  <option value="status">License Status</option>
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
        <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-8 flex items-center justify-center gap-2">
          <Loader2 className="animate-spin text-cyan-500" size={24} />
          <p className="text-cyan-700">Loading CIMA entities...</p>
        </div>
      )}

      {/* Results */}
      {!isLoading && !error && (
        <div className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="text-lg font-semibold text-gray-900">
              Showing {filteredData.length} {filteredData.length === 1 ? 'entity' : 'entities'}
            </h3>
          </div>

          {filteredData.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl shadow">
              <Shield className="mx-auto text-gray-400 mb-2" size={48} />
              <p className="text-gray-500">No entities found matching your criteria</p>
              <button
                onClick={clearFilters}
                className="mt-4 text-sm text-cyan-600 hover:text-cyan-700 hover:underline"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredData.map(entity => (
                <div key={entity.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-5 border border-gray-100">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h4 className="font-semibold text-gray-900 flex-1 leading-snug">{entity.entity_name}</h4>
                    <div className="flex items-center gap-2">
                      {entity.license_status && (
                        <span className={`px-3 py-1 text-sm font-medium rounded-lg ${
                          entity.license_status.toLowerCase().includes('active')
                            ? 'bg-green-100 text-green-700'
                            : entity.license_status.toLowerCase().includes('suspended')
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-gray-100 text-gray-700'
                        }`}>
                          {entity.license_status}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* License Info */}
                  {entity.license_number && (
                    <p className="text-sm text-gray-600 mb-3 flex items-center gap-2">
                      <Shield size={14} className="text-cyan-500" />
                      License: <span className="font-mono font-semibold">{entity.license_number}</span>
                    </p>
                  )}

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3 pb-3 border-b border-gray-100">
                    <span className="flex items-center gap-1">
                      <Building2 size={14} className="text-cyan-500" />
                      {entity.entity_type}
                    </span>
                    {entity.entity_category && (
                      <span className="flex items-center gap-1">
                        <Award size={14} className="text-teal-500" />
                        {entity.entity_category}
                      </span>
                    )}
                    {entity.registration_date && (
                      <span className="flex items-center gap-1">
                        <Calendar size={14} className="text-blue-500" />
                        Registered: {new Date(entity.registration_date).toLocaleDateString()}
                      </span>
                    )}
                    {entity.registered_agent_status && (
                      <span className="flex items-center gap-1 text-green-600 font-medium">
                        <Award size={14} />
                        Registered Agent
                      </span>
                    )}
                  </div>

                  {/* Contact Info */}
                  {(entity.address || entity.contact_phone || entity.contact_email || entity.website) && (
                    <div className="space-y-1 text-sm mb-3">
                      {entity.address && (
                        <p className="flex items-start gap-2 text-gray-600">
                          <MapPin size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                          <span>{entity.address}</span>
                        </p>
                      )}
                      <div className="flex flex-wrap gap-4">
                        {entity.contact_phone && (
                          <span className="text-gray-600">📞 {entity.contact_phone}</span>
                        )}
                        {entity.contact_email && (
                          <a href={`mailto:${entity.contact_email}`} className="text-cyan-600 hover:underline">
                            ✉️ {entity.contact_email}
                          </a>
                        )}
                        {entity.website && (
                          <a
                            href={entity.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-cyan-600 hover:underline flex items-center gap-1"
                          >
                            <Globe size={14} />
                            Website
                          </a>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Update Data Dialog */}
      {showUpdateDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Dialog Header */}
            <div className="sticky top-0 bg-gradient-to-r from-cyan-500 to-blue-500 text-white px-6 py-4 rounded-t-xl">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold flex items-center gap-2">
                  <Database size={20} />
                  Update CIMA Entities Database
                </h3>
                <button
                  onClick={() => setShowUpdateDialog(false)}
                  className="p-1 hover:bg-white/20 rounded-lg transition-colors"
                  disabled={isUpdating}
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Dialog Content */}
            <div className="p-6 space-y-6">
              {/* Info Box */}
              <div className="bg-cyan-50 border border-cyan-200 rounded-lg p-4">
                <p className="text-sm text-gray-700">
                  <strong>Data Source:</strong> CIMA (Cayman Islands Monetary Authority)
                  <br />
                  <strong>Website:</strong> https://www.cima.ky/search-entities-cima
                  <br />
                  <strong>Update Method:</strong> Firecrawl browser automation with form submission
                  <br />
                  <strong>Technology:</strong> Automated browser actions to select entity types, submit forms, and parse results
                </p>
              </div>

              {/* Entity Type Selection */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                    <Building2 size={16} />
                    Select Entity Types to Update
                  </h4>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setSelectedEntityTypes(ENTITY_TYPES)}
                      className="text-xs px-2 py-1 bg-cyan-100 text-cyan-700 rounded hover:bg-cyan-200"
                    >
                      Select All
                    </button>
                    <button
                      onClick={() => setSelectedEntityTypes([])}
                      className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                    >
                      Clear All
                    </button>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {ENTITY_TYPES.map(type => (
                    <label key={type} className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedEntityTypes.includes(type)}
                        onChange={() => toggleEntityType(type)}
                        disabled={isUpdating}
                        className="w-4 h-4 text-cyan-500 focus:ring-cyan-500 rounded"
                      />
                      <span className="text-sm text-gray-700">{type}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Trust Categories Selection */}
              {selectedEntityTypes.includes('Trust & Corporate Services Providers') && (
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-900 flex items-center gap-2">
                      <Award size={16} />
                      Select Trust Categories
                    </h4>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setSelectedTrustCategories(TRUST_CATEGORIES)}
                        className="text-xs px-2 py-1 bg-teal-100 text-teal-700 rounded hover:bg-teal-200"
                      >
                        Select All
                      </button>
                      <button
                        onClick={() => setSelectedTrustCategories([])}
                        className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        Clear All
                      </button>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 gap-2">
                    {TRUST_CATEGORIES.map(category => (
                      <label key={category} className="flex items-center gap-2 p-3 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedTrustCategories.includes(category)}
                          onChange={() => toggleTrustCategory(category)}
                          disabled={isUpdating}
                          className="w-4 h-4 text-teal-500 focus:ring-teal-500 rounded"
                        />
                        <span className="text-sm text-gray-700">{category}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}

              {/* Clear Existing Data Option */}
              <div className="border border-yellow-200 bg-yellow-50 rounded-lg p-4">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={clearExisting}
                    onChange={(e) => setClearExisting(e.target.checked)}
                    disabled={isUpdating}
                    className="w-5 h-5 text-yellow-500 focus:ring-yellow-500 rounded mt-0.5"
                  />
                  <div>
                    <span className="font-semibold text-yellow-900">Clear existing data before update</span>
                    <p className="text-sm text-yellow-700 mt-1">
                      ⚠️ This will delete all existing CIMA entities from the database before inserting new data.
                      Use with caution!
                    </p>
                  </div>
                </label>
              </div>

              {/* Update Result Display */}
              {updateResult && (
                <div className={`border rounded-lg p-4 ${
                  updateResult.success
                    ? 'bg-green-50 border-green-200'
                    : 'bg-red-50 border-red-200'
                }`}>
                  <h4 className={`font-semibold mb-3 flex items-center gap-2 ${
                    updateResult.success ? 'text-green-900' : 'text-red-900'
                  }`}>
                    {updateResult.success ? (
                      <>
                        <CheckCircle2 size={18} />
                        Update Completed Successfully
                      </>
                    ) : (
                      <>
                        <AlertCircle size={18} />
                        Update Failed
                      </>
                    )}
                  </h4>

                  {updateResult.success ? (
                    <div className="space-y-3">
                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <p className="text-2xl font-bold text-green-600">{updateResult.total_inserted}</p>
                          <p className="text-xs text-gray-600">Inserted</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <p className="text-2xl font-bold text-blue-600">{updateResult.total_updated}</p>
                          <p className="text-xs text-gray-600">Updated</p>
                        </div>
                        <div className="bg-white rounded-lg p-3 shadow-sm">
                          <p className="text-2xl font-bold text-red-600">{updateResult.total_failed}</p>
                          <p className="text-xs text-gray-600">Failed</p>
                        </div>
                      </div>

                      {/* Detailed Results by Entity Type */}
                      {updateResult.results && updateResult.results.length > 0 && (
                        <div className="mt-4 space-y-2">
                          <h5 className="font-semibold text-sm text-gray-700">Details by Entity Type:</h5>
                          <div className="bg-white rounded-lg p-3 space-y-2 max-h-40 overflow-y-auto">
                            {updateResult.results.map((result: any, idx: number) => (
                              <div key={idx} className="flex items-center justify-between text-sm pb-2 border-b border-gray-100 last:border-0">
                                <span className="font-medium text-gray-700">{result.entity_type}</span>
                                <div className="flex gap-3 text-xs">
                                  <span className="text-green-600">✓ {result.inserted}</span>
                                  <span className="text-blue-600">↻ {result.updated}</span>
                                  {result.failed > 0 && <span className="text-red-600">✗ {result.failed}</span>}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <p className="text-xs text-gray-600">
                        Updated at: {new Date(updateResult.timestamp).toLocaleString()}
                      </p>
                    </div>
                  ) : (
                    <p className="text-sm text-red-700">
                      Error: {updateResult.error || 'Unknown error occurred'}
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  onClick={() => {
                    setShowUpdateDialog(false);
                    setUpdateResult(null);
                  }}
                  disabled={isUpdating}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors disabled:opacity-50"
                >
                  {updateResult ? 'Close' : 'Cancel'}
                </button>
                <button
                  onClick={updateDataFromSource}
                  disabled={isUpdating || selectedEntityTypes.length === 0}
                  className="px-6 py-2 bg-gradient-to-r from-cyan-500 to-blue-500 text-white rounded-lg hover:from-cyan-600 hover:to-blue-600 flex items-center gap-2 shadow-md hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      Updating...
                    </>
                  ) : (
                    <>
                      <Database size={16} />
                      Start Update
                    </>
                  )}
                </button>
              </div>

              {/* Warning for no selection */}
              {selectedEntityTypes.length === 0 && (
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3">
                  <p className="text-sm text-orange-700 flex items-center gap-2">
                    <AlertCircle size={14} />
                    Please select at least one entity type to update.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
