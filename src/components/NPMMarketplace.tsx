import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, Search as SearchIcon, Filter, Download, Star, Github, ExternalLink, 
  TrendingUp, Calendar, Code, Shield, Zap, Users, BarChart3,
  RefreshCw, Plus, Import, Clock, CheckCircle, AlertCircle,
  Eye, Copy, Globe, Terminal, Settings, Palette, Database,
  BookOpen, Wifi, Smartphone, Cpu, Calculator
} from 'lucide-react';
import { useNPMPackages, useNPMCategories, importNPMPackages } from '../hooks/useNPMPackages';
import { NPMPackage } from '../lib/supabase';
import NPMImportTool from './NPMImportTool';
import { usePlayground } from '../context/PlaygroundContext';
import AIWorkflowAdvisor, { AIAdvisorEventManager } from './AIWorkflowAdvisor';
import NPMImportModal from './NPMImportModal';

// Utility function to format numbers for display
const formatNumber = (num: number | null | undefined): string => {
  if (num === null || num === undefined || isNaN(num)) return '0';
  
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(1) + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

// Utility function to get package icon based on categories
const getPackageIcon = (pkg: NPMPackage): string => {
  if (pkg.categories.includes('front-end')) return '🌐';
  if (pkg.categories.includes('back-end')) return '⚙️';
  if (pkg.categories.includes('testing')) return '🧪';
  if (pkg.categories.includes('css-styling')) return '🎨';
  if (pkg.categories.includes('frameworks')) return '⚡';
  if (pkg.categories.includes('cli-tools')) return '💻';
  if (pkg.categories.includes('mobile')) return '📱';
  if (pkg.categories.includes('documentation')) return '📚';
  return '📦';
};

// Utility function to get trend color
const getTrendColor = (trend: string): string => {
  switch (trend) {
    case 'rising': return 'text-green-600';
    case 'falling': return 'text-red-600';
    case 'stable': return 'text-gray-600';
    default: return 'text-gray-600';
  }
};

const CATEGORIES = {
  'all-packages': { name: 'All Packages', icon: Package, color: 'text-gray-500' },
  'front-end': { name: 'Front-end', icon: Globe, color: 'text-blue-500' },
  'back-end': { name: 'Back-end', icon: Code, color: 'text-green-500' },
  'cli-tools': { name: 'CLI Tools', icon: Terminal, color: 'text-teal-500' },
  documentation: { name: 'Documentation', icon: BookOpen, color: 'text-pink-500' },
  'css-styling': { name: 'CSS & Styling', icon: Palette, color: 'text-pink-500' },
  'frameworks': { name: 'Frameworks', icon: Zap, color: 'text-yellow-500' },
  'testing': { name: 'Testing', icon: CheckCircle, color: 'text-cyan-500' },
  iot: { name: 'IoT', icon: Wifi, color: 'text-emerald-600' },
  coverage: { name: 'Coverage', icon: BarChart3, color: 'text-orange-600' },
  mobile: { name: 'Mobile', icon: Smartphone, color: 'text-teal-600' },
  robotics: { name: 'Robotics', icon: Cpu, color: 'text-red-600' },
  math: { name: 'Math', icon: Calculator, color: 'text-blue-600' }
};

const SORT_OPTIONS = [
  { value: 'downloads', label: 'Weekly Downloads', desc: true },
  { value: 'stars', label: 'GitHub Stars', desc: true },
  { value: 'quality', label: 'Quality Score', desc: true },
  { value: 'updated', label: 'Last Updated', desc: true },
  { value: 'name', label: 'Name', desc: false }
];

interface NPMMarketplaceProps {
  onNavigateToPlayground?: (pkg: NPMPackage) => void;
}

const NPMMarketplace: React.FC<NPMMarketplaceProps> = ({ onNavigateToPlayground }) => {
  const { actions } = usePlayground();
  const [selectedCategory, setSelectedCategory] = useState('all-packages');
  const [selectedPackage, setSelectedPackage] = useState<NPMPackage | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('downloads');
  const [sortDesc, setSortDesc] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  
  const { packages, loading, error, refetch, stats } = useNPMPackages({
    sortBy,
    sortDesc
  });

  const { categories } = useNPMCategories();

  // Filter packages
  const filteredPackages = useMemo(() => {
    return packages.filter(pkg => {
      const categoryMatch = selectedCategory === 'all-packages' || pkg.categories.includes(selectedCategory);
      const searchMatch = !searchTerm || 
        pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()));
      return categoryMatch && searchMatch;
    });
  }, [packages, selectedCategory, searchTerm]);


  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-300">Loading NPM packages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center py-12">
          <div className="text-red-600 dark:text-red-400 text-lg mb-2">Error loading packages</div>
          <p className="text-gray-500 dark:text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-heading-lg mb-2">
          NPM Package Marketplace
        </h1>
        <p className="text-body-sm mb-1">
          Discover {packages.length} NPM packages • Real data from npmjs.com
        </p>
        <div className="text-caption">
          Download statistics, quality metrics, and GitHub data updated regularly
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-minimal text-center">
          <div className="text-2xl font-semibold text-blue-600">{stats.total}</div>
          <div className="text-caption">Packages Found</div>
        </div>
        <div className="card-minimal text-center">
          <div className="text-2xl font-semibold text-green-600">{formatNumber(stats.totalDownloads)}</div>
          <div className="text-caption">Weekly Downloads</div>
        </div>
        <div className="card-minimal text-center">
          <div className="text-2xl font-semibold text-yellow-600">{stats.avgQuality.toFixed(1)}</div>
          <div className="text-caption">Avg Quality</div>
        </div>
        <div className="card-minimal text-center">
          <div className="text-2xl font-semibold text-teal-600">{stats.withTypeScript}</div>
          <div className="text-caption">TypeScript Ready</div>
        </div>
      </div>

      {/* Controls */}
      <div className="card-minimal">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter size={16} />
            <h3 className="text-subheading">Filters & Search</h3>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="btn-minimal btn-primary"
            >
              <Plus size={14} />
              Import from NPM
            </button>
            <button
              onClick={refetch}
              className="btn-minimal btn-secondary"
            >
              <RefreshCw size={14} />
              Refresh
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500" size={14} />
            <input
              type="text"
              placeholder="Search packages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500"
          >
            {Object.entries(CATEGORIES).map(([key, category]) => (
              <option key={key} value={key}>{category.name}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-green-500"
          >
            {SORT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

           <button
             onClick={refetch}
             className="btn-minimal btn-secondary"
           >
             <RefreshCw size={14} />
             Refresh
           </button>
        </div>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPackages.map(pkg => (
          <div
            key={pkg.id}
            onClick={() => setSelectedPackage(selectedPackage?.id === pkg.id ? null : pkg)}
            onMouseEnter={() => {
              const eventManager = AIAdvisorEventManager.getInstance();
              eventManager.setQuotedData({
                type: 'npm',
                name: pkg.name,
                description: pkg.description || 'A useful NPM package for your projects',
                version: pkg.version,
                context: `NPM Package - Downloads: ${formatNumber(pkg.weekly_downloads)}/week, Stars: ${formatNumber(pkg.github_stars)}, Quality: ${pkg.quality_score}`
              });
            }}
            onMouseLeave={() => {
              setTimeout(() => {
                const eventManager = AIAdvisorEventManager.getInstance();
                eventManager.setQuotedData(null);
              }, 500);
            }}
            className={`card-minimal cursor-pointer transition-all duration-200 ${
              selectedPackage?.id === pkg.id ? 'ring-2 ring-green-500 shadow-lg' : ''
            }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-lg">{getPackageIcon(pkg)}</span>
                <div>
                  <h3 className="font-semibold text-sm">{pkg.name}</h3>
                  <p className="text-caption">v{pkg.version}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-semibold text-green-600">
                  {formatNumber(pkg.weekly_downloads)}
                </div>
                <div className="text-caption">weekly</div>
              </div>
            </div>

            {/* Description */}
            <p className="text-body-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">
              {pkg.description || 'No description available'}
            </p>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              <div className="bg-gray-50 dark:bg-gray-800 rounded px-2 py-1 text-center">
                <div className="text-xs font-medium flex items-center justify-center gap-1 text-gray-900 dark:text-white">
                  <Star size={10} />
                  {formatNumber(pkg.github_stars)}
                </div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded px-2 py-1 text-center">
                <div className="text-xs font-medium text-gray-900 dark:text-white">{pkg.quality_score}</div>
              </div>
              <div className="bg-gray-50 dark:bg-gray-800 rounded px-2 py-1 text-center">
                <div className="text-xs font-medium text-gray-900 dark:text-white">{pkg.license || 'N/A'}</div>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1 mb-3">
              {pkg.keywords.slice(0, 3).map((keyword, idx) => (
                <span key={idx} className="badge badge-secondary">
                  {keyword}
                </span>
              ))}
              {pkg.typescript_support && (
                <span className="badge badge-primary">TS</span>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center">
              <span className="text-caption">
                Updated {new Date(pkg.last_published || pkg.updated_at).toLocaleDateString()}
              </span>
              <div className="flex items-center gap-2">
                <span className={`text-caption capitalize ${getTrendColor(pkg.download_trend)}`}>
                  {pkg.download_trend}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      actions.selectNPMPackage(pkg);
                      actions.addComponentToWorkflow(pkg, 'npm');
                    }}
                    className="btn-minimal btn-primary text-xs px-2 py-1"
                    title="Add to Workflow"
                  >
                    +
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      actions.navigateToPlaygroundWithComponent(pkg, 'npm');
                    }}
                    className="btn-minimal btn-secondary text-xs px-2 py-1 flex items-center gap-1"
                    title="Use in Playground"
                  >
                    <Code size={10} />
                    Use
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Detailed Package Info */}
      {selectedPackage && (
        <div className="card-minimal">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Package Details */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">{getPackageIcon(selectedPackage)}</span>
                <div>
                  <h2 className="text-heading">{selectedPackage.name}</h2>
                  <p className="text-body-sm">v{selectedPackage.version} • {selectedPackage.author}</p>
                </div>
              </div>

              <p className="text-body-sm text-gray-700 dark:text-gray-300 mb-6">{selectedPackage.description}</p>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="card-minimal">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Download className="text-green-600" size={14} />
                      Downloads
                    </h4>
                    <div className="text-sm space-y-1">
                      <div>Weekly: {formatNumber(selectedPackage.weekly_downloads)}</div>
                      <div>Monthly: {formatNumber(selectedPackage.monthly_downloads)}</div>
                    </div>
                  </div>

                  <div className="card-minimal">
                    <h4 className="font-semibold mb-2 flex items-center gap-2">
                      <Star className="text-yellow-600" size={14} />
                      GitHub
                    </h4>
                    <div className="text-sm space-y-1">
                      <div>Stars: {formatNumber(selectedPackage.github_stars)}</div>
                      <div>Forks: {formatNumber(selectedPackage.github_forks)}</div>
                    </div>
                  </div>
                </div>

                <div className="card-minimal">
                  <h4 className="font-semibold mb-2">Package Info</h4>
                  <div className="text-sm grid grid-cols-2 gap-2">
                    <div>License: {selectedPackage.license}</div>
                    <div>Size: {formatNumber(selectedPackage.file_size)} bytes</div>
                    <div>Quality: {selectedPackage.quality_score}/100</div>
                    <div>TypeScript: {selectedPackage.typescript_support ? '✅' : '❌'}</div>
                  </div>
                </div>

                <div className="card-minimal">
                  <h4 className="font-semibold mb-2">Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPackage.keywords.map((keyword, idx) => (
                      <span key={idx} className="badge badge-primary">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Links and Actions */}
            <div>
              <h3 className="text-subheading mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                {selectedPackage.npm_url && (
                  <a
                    href={selectedPackage.npm_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full card-minimal hover:shadow-md transition-shadow bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800"
                  >
                    <div className="flex items-center gap-3">
                      <Package className="text-red-600" size={20} />
                      <div>
                        <div className="font-semibold">View on NPM</div>
                        <div className="text-caption">Official package page</div>
                      </div>
                      <ExternalLink size={14} className="ml-auto" />
                    </div>
                  </a>
                )}

                {selectedPackage.repository_url && (
                  <a
                    href={selectedPackage.repository_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full card-minimal hover:shadow-md transition-shadow bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <Github className="text-gray-400" size={20} />
                      <div>
                        <div className="font-semibold">Source Code</div>
                        <div className="text-caption">GitHub repository</div>
                      </div>
                      <ExternalLink size={14} className="ml-auto" />
                    </div>
                  </a>
                )}

                {selectedPackage.homepage && (
                  <a
                    href={selectedPackage.homepage}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block w-full card-minimal hover:shadow-md transition-shadow bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800"
                  >
                    <div className="flex items-center gap-3">
                      <Globe className="text-blue-600" size={20} />
                      <div>
                        <div className="font-semibold">Homepage</div>
                        <div className="text-caption">Official website</div>
                      </div>
                      <ExternalLink size={14} className="ml-auto" />
                    </div>
                  </a>
                )}

                <div className="card-minimal">
                  <h4 className="font-semibold mb-2">Install Command</h4>
                  <div className="bg-gray-900 dark:bg-gray-950 text-green-400 dark:text-green-300 rounded p-3 font-mono text-sm">
                    npm install {selectedPackage.name}
                  </div>
                  <button 
                    onClick={() => navigator.clipboard.writeText(`npm install ${selectedPackage.name}`)}
                    className="mt-2 btn-minimal btn-ghost text-xs flex items-center gap-1"
                  >
                    <Copy size={12} />
                    Copy command
                  </button>
                </div>
                
                <button
                  onClick={() => onNavigateToPlayground?.(selectedPackage)}
                  className="w-full btn-minimal btn-primary"
                >
                  <Code size={14} />
                  Use in Playground
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal - New Component */}
      <NPMImportModal 
        isOpen={showImportModal}
        onClose={() => {
          setShowImportModal(false);
          refetch(); // Refresh data after import
        }}
        onComplete={() => refetch()}
      />

      {/* AI Workflow Advisor */}
      <AIWorkflowAdvisor
        onComponentAdd={(component, type) => {
          if (type === 'npm') {
            actions.selectNPMPackage(component);
            actions.addComponentToWorkflow(component, type);
          }
        }}
        selectedComponents={[]}
      />
    </div>
  );
};

export default NPMMarketplace;