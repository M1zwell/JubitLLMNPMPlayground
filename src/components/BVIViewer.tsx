/**
 * BVI Entities Viewer Component
 * Display and filter British Virgin Islands FSC regulated entities
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
  RefreshCw,
  Database
} from 'lucide-react';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || '';
const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// BVI FSC Entity Types (matching BVI FSC registry)
const BVI_ENTITY_TYPES = [
  'Virtual Assets Service Providers',
  'Banks',
  'Trust Companies',
  'Insurance Companies',
  'Mutual Funds',
  'Fund Administrators',
  'Investment Business',
  'Approved Auditors',
  'Insolvency Practitioners'
];

interface BVIEntity {
  id: string;
  entity_name: string;
  entity_type: string;
  entity_category?: string;
  license_number?: string;
  license_status?: string;
  registration_date?: string;
  expiry_date?: string;
  registered_agent?: string;
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
  searchText: string;
  licenseStatus: string;
  sortBy: string;
}

export default function BVIViewer() {
  const [data, setData] = useState<BVIEntity[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [filters, setFilters] = useState<Filters>({
    entityType: 'all',
    searchText: '',
    licenseStatus: 'all',
    sortBy: 'name-asc'
  });

  const [showFilters, setShowFilters] = useState(true);

  // Update/scraping states
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateResult, setUpdateResult] = useState<any>(null);
  const [showUpdateDialog, setShowUpdateDialog] = useState(false);
  const [selectedEntityTypes, setSelectedEntityTypes] = useState<string[]>(BVI_ENTITY_TYPES);
  const [clearExisting, setClearExisting] = useState(false);

  // Fetch data from database
  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: entities, error: fetchError } = await supabase
        .from('bvi_entities')
        .select('*')
        .order('entity_name', { ascending: true })
        .limit(1000);

      if (fetchError) throw fetchError;
      setData(entities || []);
    } catch (err) {
      console.error('Error fetching BVI data:', err);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Update data from BVI FSC (calls Edge Function)
  const updateDataFromSource = async () => {
    if (selectedEntityTypes.length === 0) {
      alert('Please select at least one entity type to update');
      return;
    }

    setIsUpdating(true);
    setUpdateResult(null);
    setError(null);

    try {
      console.log('🔄 Calling BVI scraper Edge Function...');

      const response = await fetch(`${SUPABASE_URL}/functions/v1/bvi-scraper`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
          'apikey': SUPABASE_ANON_KEY
        },
        body: JSON.stringify({
          entity_types: selectedEntityTypes,
          clear_existing: clearExisting
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Update failed: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      setUpdateResult(result);

      if (result.success) {
        console.log('✅ Update completed:', result);
        // Refresh data
        await fetchData();
      } else {
        throw new Error(result.error || 'Update failed');
      }

    } catch (err) {
      console.error('❌ Update error:', err);
      setError((err as Error).message);
      setUpdateResult({
        success: false,
        error: (err as Error).message
      });
    } finally {
      setIsUpdating(false);
    }
  };

  // Get all unique entity types and license statuses
  const getAllEntityTypes = () => {
    const types = new Set<string>();
    data.forEach(e => types.add(e.entity_type));
    return Array.from(types).sort();
  };

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

    if (filters.searchText) {
      const search = filters.searchText.toLowerCase();
      filtered = filtered.filter(e =>
        e.entity_name.toLowerCase().includes(search) ||
        e.license_number?.toLowerCase().includes(search) ||
        e.registered_agent?.toLowerCase().includes(search) ||
        e.address?.toLowerCase().includes(search)
      );
    }

    if (filters.licenseStatus !== 'all') {
      filtered = filtered.filter(e => e.license_status === filters.licenseStatus);
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
      searchText: '',
      licenseStatus: 'all',
      sortBy: 'name-asc'
    });
  };

  const exportToJSON = () => {
    const dataStr = JSON.stringify(filteredData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `bvi-entities-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
  };

  const exportToCSV = () => {
    const headers = ['Entity Name', 'Type', 'License Number', 'Status', 'Registered Agent', 'Registration Date', 'Address', 'Phone', 'Email', 'Website'];
    const rows = filteredData.map(e => [
      e.entity_name,
      e.entity_type,
      e.license_number || '',
      e.license_status || '',
      e.registered_agent || '',
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
    link.download = `bvi-entities-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-50 to-emerald-50 rounded-xl shadow-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Shield className="text-teal-500" />
              BVI FSC Regulated Entities
            </h2>
            <p className="text-gray-600 mt-1">British Virgin Islands Financial Services Commission</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={fetchData}
              disabled={isLoading}
              className="px-4 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
            >
              <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
              Refresh
            </button>
            <button
              onClick={() => setShowUpdateDialog(true)}
              disabled={isUpdating}
              className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 flex items-center gap-2 shadow-md hover:shadow-lg transition-all"
            >
              <Database size={16} className={isUpdating ? 'animate-spin' : ''} />
              Update Data
            </button>
          </div>
        </div>

        {/* Statistics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg p-4 shadow">
            <p className="text-sm text-gray-600">Total Entities</p>
            <p className="text-2xl font-bold text-teal-600">{data.length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <p className="text-sm text-gray-600">Filtered Results</p>
            <p className="text-2xl font-bold text-blue-600">{filteredData.length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <p className="text-sm text-gray-600">Entity Types</p>
            <p className="text-2xl font-bold text-purple-600">{getAllEntityTypes().length}</p>
          </div>
          <div className="bg-white rounded-lg p-4 shadow">
            <p className="text-sm text-gray-600">Jurisdiction</p>
            <p className="text-lg font-bold text-green-600">🇻🇬 BVI</p>
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
              {(filters.searchText || filters.entityType !== 'all' || filters.licenseStatus !== 'all') && (
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
                  placeholder="Search name, license, agent..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 placeholder-gray-500"
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 font-medium"
                >
                  <option value="all">All Types</option>
                  {getAllEntityTypes().map(type => (
                    <option key={type} value={type}>{type}</option>
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
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-teal-500 text-gray-900 font-medium"
                >
                  <option value="all">All Statuses</option>
                  {getAllLicenseStatuses().map(status => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
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
        <div className="bg-teal-50 border border-teal-200 rounded-lg p-8 flex items-center justify-center gap-2">
          <Loader2 className="animate-spin text-teal-500" size={24} />
          <p className="text-teal-700">Loading BVI entities...</p>
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
                className="mt-4 text-sm text-teal-600 hover:text-teal-700 hover:underline"
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

                  {/* License & Agent Info */}
                  <div className="space-y-1 mb-3">
                    {entity.license_number && (
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Shield size={14} className="text-teal-500" />
                        License: <span className="font-mono font-semibold">{entity.license_number}</span>
                      </p>
                    )}
                    {entity.registered_agent && (
                      <p className="text-sm text-gray-600 flex items-center gap-2">
                        <Building2 size={14} className="text-purple-500" />
                        Registered Agent: <span className="font-medium">{entity.registered_agent}</span>
                      </p>
                    )}
                  </div>

                  {/* Metadata */}
                  <div className="flex flex-wrap items-center gap-4 text-sm text-gray-600 mb-3 pb-3 border-b border-gray-100">
                    <span className="flex items-center gap-1">
                      <Building2 size={14} className="text-teal-500" />
                      {entity.entity_type}
                    </span>
                    {entity.registration_date && (
                      <span className="flex items-center gap-1">
                        <Calendar size={14} className="text-blue-500" />
                        Registered: {new Date(entity.registration_date).toLocaleDateString()}
                      </span>
                    )}
                  </div>

                  {/* Contact Info */}
                  {(entity.address || entity.contact_phone || entity.contact_email || entity.website) && (
                    <div className="space-y-1 text-sm">
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
                          <a href={`mailto:${entity.contact_email}`} className="text-teal-600 hover:underline">
                            ✉️ {entity.contact_email}
                          </a>
                        )}
                        {entity.website && (
                          <a
                            href={entity.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-teal-600 hover:underline flex items-center gap-1"
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
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-900">Update BVI FSC Data</h3>
                <button
                  onClick={() => setShowUpdateDialog(false)}
                  disabled={isUpdating}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                {/* Entity Types Selection */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-3">
                    Select Entity Types to Update:
                  </label>
                  <div className="space-y-2">
                    {BVI_ENTITY_TYPES.map(type => (
                      <label key={type} className="flex items-center gap-2 p-2 hover:bg-gray-50 rounded cursor-pointer">
                        <input
                          type="checkbox"
                          checked={selectedEntityTypes.includes(type)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedEntityTypes([...selectedEntityTypes, type]);
                            } else {
                              setSelectedEntityTypes(selectedEntityTypes.filter(t => t !== type));
                            }
                          }}
                          disabled={isUpdating}
                          className="w-4 h-4 text-teal-600 border-gray-300 rounded focus:ring-teal-500"
                        />
                        <span className="text-sm text-gray-700">{type}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Clear Existing Option */}
                <div className="border-t border-gray-200 pt-4">
                  <label className="flex items-start gap-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg cursor-pointer">
                    <input
                      type="checkbox"
                      checked={clearExisting}
                      onChange={(e) => setClearExisting(e.target.checked)}
                      disabled={isUpdating}
                      className="w-4 h-4 text-yellow-600 border-gray-300 rounded focus:ring-yellow-500 mt-0.5"
                    />
                    <div>
                      <span className="text-sm font-medium text-yellow-900">Clear existing data before update</span>
                      <p className="text-xs text-yellow-700 mt-1">
                        ⚠️ This will delete all existing BVI entities and replace them with fresh data
                      </p>
                    </div>
                  </label>
                </div>

                {/* Info Box */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <Database className="text-blue-600 mt-0.5 flex-shrink-0" size={18} />
                    <div className="text-sm">
                      <p className="font-medium text-blue-900 mb-1">Data Source</p>
                      <ul className="text-blue-700 space-y-1 text-xs">
                        <li>✅ Downloads official CSV files from www.bvifsc.vg</li>
                        <li>✅ Parses and imports data automatically</li>
                        <li>✅ Updates database via Supabase Edge Function</li>
                        <li>⏱️ Process may take 30-60 seconds</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Update Result */}
                {updateResult && (
                  <div className={`p-4 rounded-lg ${
                    updateResult.success
                      ? 'bg-green-50 border border-green-200'
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center gap-2 mb-2">
                      {updateResult.success ? (
                        <Shield className="text-green-600" size={20} />
                      ) : (
                        <AlertCircle className="text-red-600" size={20} />
                      )}
                      <h4 className="font-semibold">
                        {updateResult.success ? 'Update Completed!' : 'Update Failed'}
                      </h4>
                    </div>

                    {updateResult.success ? (
                      <div className="space-y-2 text-sm">
                        <div className="grid grid-cols-3 gap-2">
                          <div>
                            <span className="text-gray-600">Inserted:</span>
                            <span className="ml-2 font-semibold text-green-600">
                              {updateResult.total_inserted}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Updated:</span>
                            <span className="ml-2 font-semibold text-blue-600">
                              {updateResult.total_updated}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Failed:</span>
                            <span className="ml-2 font-semibold text-red-600">
                              {updateResult.total_failed}
                            </span>
                          </div>
                        </div>

                        {updateResult.results && updateResult.results.length > 0 && (
                          <div className="mt-3 pt-3 border-t border-green-200">
                            <p className="font-medium text-green-900 mb-2">Details by Type:</p>
                            {updateResult.results.map((r: any, idx: number) => (
                              <div key={idx} className="text-xs text-green-700 mb-1">
                                <strong>{r.entity_type}:</strong> {r.inserted} inserted
                                {r.error && <span className="text-red-600 ml-2">({r.error})</span>}
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ) : (
                      <p className="text-red-700 text-sm">{updateResult.error}</p>
                    )}
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-200">
                  <button
                    onClick={() => setShowUpdateDialog(false)}
                    disabled={isUpdating}
                    className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={updateDataFromSource}
                    disabled={isUpdating || selectedEntityTypes.length === 0}
                    className="px-6 py-2 bg-teal-500 text-white rounded-lg hover:bg-teal-600 flex items-center gap-2 shadow-md hover:shadow-lg transition-all disabled:bg-gray-400"
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
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
