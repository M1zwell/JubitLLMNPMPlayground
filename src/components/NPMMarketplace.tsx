import React, { useState, useEffect, useMemo } from 'react';
import { 
  Package, Search, Filter, Download, Star, Github, ExternalLink, 
  TrendingUp, Calendar, Code, Shield, Zap, Users, BarChart3,
  RefreshCw, Plus, Import, Clock, CheckCircle, AlertCircle,
  Eye, Copy, Globe, Terminal, Settings, Palette, Database,
  BookOpen, Wifi, Smartphone, Cpu, Calculator
} from 'lucide-react';
import { useNPMPackages, useNPMCategories, importNPMPackages } from '../hooks/useNPMPackages';
import { NPMPackage } from '../lib/supabase';
import { usePlayground } from '../context/PlaygroundContext';
import AIWorkflowAdvisor from './AIWorkflowAdvisor';

const CATEGORIES = {
  all: { name: 'All Packages', icon: Package, color: 'text-gray-400' },
  'front-end': { name: 'Front-end', icon: Globe, color: 'text-blue-400' },
  'back-end': { name: 'Back-end', icon: Code, color: 'text-green-400' },
  cli: { name: 'CLI Tools', icon: Terminal, color: 'text-purple-400' },
  documentation: { name: 'Documentation', icon: BookOpen, color: 'text-indigo-400' },
  css: { name: 'CSS & Styling', icon: Palette, color: 'text-pink-400' },
  frameworks: { name: 'Frameworks', icon: Zap, color: 'text-yellow-400' },
  testing: { name: 'Testing', icon: CheckCircle, color: 'text-cyan-400' },
  iot: { name: 'IoT', icon: Wifi, color: 'text-emerald-400' },
  coverage: { name: 'Coverage', icon: BarChart3, color: 'text-orange-400' },
  mobile: { name: 'Mobile', icon: Smartphone, color: 'text-purple-400' },
  robotics: { name: 'Robotics', icon: Cpu, color: 'text-red-400' },
  math: { name: 'Math', icon: Calculator, color: 'text-blue-400' }
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
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedPackage, setSelectedPackage] = useState<NPMPackage | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('downloads');
  const [sortDesc, setSortDesc] = useState(true);
  const [showImportModal, setShowImportModal] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<string | null>(null);

  const { packages, loading, error, refetch } = useNPMPackages({
    category: selectedCategory,
    search: searchTerm,
    sortBy,
    sortDesc,
    limit: 200
  });

  const { categories } = useNPMCategories();

  // Filter packages
  const filteredPackages = useMemo(() => {
    return packages.filter(pkg => {
      const categoryMatch = selectedCategory === 'all' || pkg.categories.includes(selectedCategory);
      const searchMatch = !searchTerm || 
        pkg.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        pkg.keywords.some(k => k.toLowerCase().includes(searchTerm.toLowerCase()));
      
      return categoryMatch && searchMatch;
    });
  }, [packages, selectedCategory, searchTerm]);

  // Statistics
  const stats = useMemo(() => {
    const total = filteredPackages.length;
    const totalDownloads = filteredPackages.reduce((sum, pkg) => sum + pkg.weekly_downloads, 0);
    const avgQuality = total > 0 ? filteredPackages.reduce((sum, pkg) => sum + pkg.quality_score, 0) / total : 0;
    const withTypeScript = filteredPackages.filter(pkg => pkg.typescript_support).length;
    
    return { total, totalDownloads, avgQuality, withTypeScript };
  }, [filteredPackages]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const getPackageIcon = (pkg: NPMPackage): string => {
    if (pkg.categories.includes('frontend')) return '🌐';
    if (pkg.categories.includes('backend')) return '⚙️';
    if (pkg.categories.includes('cli')) return '💻';
    if (pkg.categories.includes('testing')) return '🧪';
    if (pkg.categories.includes('css')) return '🎨';
    if (pkg.categories.includes('build-tools')) return '🔧';
    return '📦';
  };

  const getTrendColor = (trend: string): string => {
    switch (trend) {
      case 'rising': return 'text-green-400';
      case 'falling': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const handleImport = async (importData: {
    searchQuery?: string;
    categories?: string[];
    limit?: number;
    pages?: number;
    sortBy?: string;
  }) => {
    try {
      setImporting(true);
      setImportStatus(`🔍 Searching NPM registry for ${importData.searchQuery || 'packages'} across ${importData.pages || 1} pages...`);
      
      const result = await importNPMPackages({
        ...importData,
        importType: 'manual'
      });
      
      setImportStatus(`✅ Import completed! Added ${result.packagesAdded} new packages, updated ${result.packagesUpdated} existing packages (${result.packagesProcessed} total processed)`);
      
      // Refresh the package list
      setTimeout(() => {
        refetch();
        setShowImportModal(false);
        setImporting(false);
        setImportStatus(null);
      }, 2000);
      
    } catch (error) {
      setImportStatus(`Import failed: ${error.message}`);
      setImporting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-green-400 mx-auto"></div>
          <p className="mt-4 text-xl text-green-300">Loading NPM packages...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center">
          <div className="text-red-400 text-xl mb-4">Error loading packages</div>
          <p className="text-gray-400">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent mb-4">
          📦 NPM Package Marketplace
        </h1>
        <p className="text-xl text-green-300 mb-2">
          Discover {packages.length} NPM packages • Real data from npmjs.com
        </p>
        <div className="text-sm text-gray-400">
          Download statistics, quality metrics, and GitHub data updated regularly
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-blue-400">{stats.total}</div>
          <div className="text-sm opacity-80">Packages Found</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-green-400">{formatNumber(stats.totalDownloads)}</div>
          <div className="text-sm opacity-80">Weekly Downloads</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-yellow-400">{stats.avgQuality.toFixed(1)}</div>
          <div className="text-sm opacity-80">Avg Quality</div>
        </div>
        <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center">
          <div className="text-2xl font-bold text-purple-400">{stats.withTypeScript}</div>
          <div className="text-sm opacity-80">TypeScript Ready</div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <Filter size={20} />
            <h3 className="text-lg font-bold">Filters & Search</h3>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowImportModal(true)}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              <Import size={16} />
              Import from NPM
            </button>
            <button
              onClick={refetch}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-sm transition-colors flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
            <input
              type="text"
              placeholder="Search packages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
            />
          </div>

          {/* Category Filter */}
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
          >
            {Object.entries(CATEGORIES).map(([key, category]) => (
              <option key={key} value={key}>{category.name}</option>
            ))}
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
          >
            {SORT_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>

          {/* Sort Direction */}
          <button
            onClick={() => setSortDesc(!sortDesc)}
            className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg hover:bg-white/15 flex items-center justify-center gap-2"
          >
            {sortDesc ? '↓' : '↑'} {sortDesc ? 'Desc' : 'Asc'}
          </button>
        </div>
      </div>

      {/* Packages Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredPackages.map(pkg => (
          <div
            key={pkg.id}
            onClick={() => setSelectedPackage(selectedPackage?.id === pkg.id ? null : pkg)}
            className={`
              bg-white/10 backdrop-blur-sm border border-white/20 rounded-xl p-6 cursor-pointer 
              transform hover:scale-105 transition-all duration-300 shadow-lg
              ${selectedPackage?.id === pkg.id ? 'ring-4 ring-green-500/50 scale-105' : ''}
            `}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{getPackageIcon(pkg)}</span>
                <div>
                  <h3 className="font-bold text-lg">{pkg.name}</h3>
                  <p className="text-sm text-gray-400">v{pkg.version}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm font-bold text-green-400">
                  {formatNumber(pkg.weekly_downloads)}
                </div>
                <div className="text-xs opacity-80">weekly</div>
              </div>
            </div>

            {/* Description */}
            <p className="text-sm text-gray-300 mb-4 line-clamp-2">
              {pkg.description || 'No description available'}
            </p>

            {/* Metrics */}
            <div className="grid grid-cols-3 gap-2 mb-4 text-xs">
              <div className="bg-white/20 rounded px-2 py-1 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Star size={10} />
                  <span>{formatNumber(pkg.github_stars)}</span>
                </div>
              </div>
              <div className="bg-white/20 rounded px-2 py-1 text-center">
                <div className="flex items-center justify-center gap-1">
                  <BarChart3 size={10} />
                  <span>{pkg.quality_score}</span>
                </div>
              </div>
              <div className="bg-white/20 rounded px-2 py-1 text-center">
                <div className="flex items-center justify-center gap-1">
                  <Shield size={10} />
                  <span>{pkg.license || 'N/A'}</span>
                </div>
              </div>
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-1 mb-3">
              {pkg.keywords.slice(0, 3).map((keyword, idx) => (
                <span key={idx} className="bg-white/30 px-2 py-1 rounded text-xs">
                  {keyword}
                </span>
              ))}
              {pkg.typescript_support && (
                <span className="bg-blue-600/30 px-2 py-1 rounded text-xs">TS</span>
              )}
            </div>

            {/* Footer */}
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-400">
                Updated {new Date(pkg.last_published || pkg.updated_at).toLocaleDateString()}
              </span>
              <div className="flex items-center gap-2">
                <span className={`${getTrendColor(pkg.download_trend)} capitalize`}>
                  {pkg.download_trend}
                </span>
                <div className="flex gap-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      actions.selectNPMPackage(pkg);
                      actions.addComponentToWorkflow(pkg, 'npm');
                    }}
                    className="bg-green-600/80 hover:bg-green-600 px-2 py-1 rounded text-xs transition-colors"
                    title="Add to Workflow"
                  >
                    +
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      actions.navigateToPlaygroundWithComponent(pkg, 'npm');
                    }}
                    className="bg-blue-600/80 hover:bg-blue-600 px-2 py-1 rounded text-xs transition-colors flex items-center gap-1"
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
        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 mb-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Package Details */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-4xl">{getPackageIcon(selectedPackage)}</span>
                <div>
                  <h2 className="text-2xl font-bold">{selectedPackage.name}</h2>
                  <p className="text-green-300">v{selectedPackage.version} • {selectedPackage.author}</p>
                </div>
              </div>

              <p className="text-gray-300 mb-6">{selectedPackage.description}</p>

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/10 rounded-lg p-3">
                    <h4 className="font-bold mb-2 flex items-center gap-2">
                      <Download className="text-green-400" size={16} />
                      Downloads
                    </h4>
                    <div className="text-sm">
                      <div>Weekly: {formatNumber(selectedPackage.weekly_downloads)}</div>
                      <div>Monthly: {formatNumber(selectedPackage.monthly_downloads)}</div>
                    </div>
                  </div>

                  <div className="bg-white/10 rounded-lg p-3">
                    <h4 className="font-bold mb-2 flex items-center gap-2">
                      <Star className="text-yellow-400" size={16} />
                      GitHub
                    </h4>
                    <div className="text-sm">
                      <div>Stars: {formatNumber(selectedPackage.github_stars)}</div>
                      <div>Forks: {formatNumber(selectedPackage.github_forks)}</div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/10 rounded-lg p-3">
                  <h4 className="font-bold mb-2">Package Info</h4>
                  <div className="text-sm grid grid-cols-2 gap-2">
                    <div>License: {selectedPackage.license}</div>
                    <div>Size: {formatNumber(selectedPackage.file_size)} bytes</div>
                    <div>Quality: {selectedPackage.quality_score}/100</div>
                    <div>TypeScript: {selectedPackage.typescript_support ? '✅' : '❌'}</div>
                  </div>
                </div>

                <div className="bg-white/10 rounded-lg p-3">
                  <h4 className="font-bold mb-2">Keywords</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedPackage.keywords.map((keyword, idx) => (
                      <span key={idx} className="bg-purple-600/30 px-3 py-1 rounded-full text-sm">
                        {keyword}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Right: Links and Actions */}
            <div>
              <h3 className="text-xl font-bold mb-4">Quick Actions</h3>
              
              <div className="space-y-3">
                {selectedPackage.npm_url && (
                  <a 
                    href={selectedPackage.npm_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block w-full p-3 bg-red-600/20 hover:bg-red-600/30 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Package className="text-red-400" size={20} />
                      <div>
                        <div className="font-medium">View on NPM</div>
                        <div className="text-xs text-gray-400">Official package page</div>
                      </div>
                      <ExternalLink size={16} className="ml-auto" />
                    </div>
                  </a>
                )}

                {selectedPackage.repository_url && (
                  <a 
                    href={selectedPackage.repository_url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block w-full p-3 bg-gray-600/20 hover:bg-gray-600/30 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Github className="text-gray-400" size={20} />
                      <div>
                        <div className="font-medium">Source Code</div>
                        <div className="text-xs text-gray-400">GitHub repository</div>
                      </div>
                      <ExternalLink size={16} className="ml-auto" />
                    </div>
                  </a>
                )}

                {selectedPackage.homepage && (
                  <a 
                    href={selectedPackage.homepage} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="block w-full p-3 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <Globe className="text-blue-400" size={20} />
                      <div>
                        <div className="font-medium">Homepage</div>
                        <div className="text-xs text-gray-400">Official website</div>
                      </div>
                      <ExternalLink size={16} className="ml-auto" />
                    </div>
                  </a>
                )}

                <div className="bg-white/10 rounded-lg p-3">
                  <h4 className="font-bold mb-2">Install Command</h4>
                  <div className="bg-gray-800 rounded p-2 text-green-400 font-mono text-sm">
                    npm install {selectedPackage.name}
                  </div>
                  <button 
                    onClick={() => navigator.clipboard.writeText(`npm install ${selectedPackage.name}`)}
                    className="mt-2 text-xs text-gray-400 hover:text-white flex items-center gap-1"
                  >
                    <Copy size={12} />
                    Copy command
                  </button>
                </div>
                
                <button
                  onClick={() => onNavigateToPlayground?.(selectedPackage)}
                  className="w-full bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded text-sm transition-colors flex items-center gap-2"
                >
                  <Code size={16} />
                  Use in Playground
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-gray-900 rounded-xl p-6 max-w-md w-full mx-4 border border-white/20">
            <h3 className="text-xl font-bold mb-4">Import NPM Packages</h3>
            
            {importing ? (
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto mb-4"></div>
                <p className="text-gray-300">{importStatus}</p>
              </div>
            ) : (
              <div className="space-y-4">
                <button
                  onClick={() => handleImport({ 
                    searchQuery: 'keywords:frontend OR keywords:react OR keywords:vue OR keywords:angular OR keywords:ui OR keywords:component OR keywords:browser', 
                    limit: 100, 
                    pages: 2 
                  })}
                  className="w-full p-3 bg-green-600 hover:bg-green-700 rounded-lg transition-colors"
                >
                  🌐 Import Front-end Packages (2 pages)
                </button>
                
                <button
                  onClick={() => handleImport({ 
                    searchQuery: 'keywords:backend OR keywords:express OR keywords:server OR keywords:api OR keywords:framework OR keywords:nodejs OR keywords:web', 
                    limit: 100, 
                    pages: 2 
                  })}
                  className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  ⚙️ Import Back-end Packages (2 pages)
                </button>
                
                <button
                  onClick={() => handleImport({ 
                    searchQuery: 'keywords:cli OR keywords:command OR keywords:terminal OR keywords:tool OR keywords:bin OR keywords:console', 
                    limit: 80, 
                    pages: 2 
                  })}
                  className="w-full p-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                >
                  💻 Import CLI Tools (2 pages)
                </button>
                
                <button
                  onClick={() => handleImport({ 
                    searchQuery: 'keywords:testing OR keywords:test OR keywords:jest OR keywords:mocha OR keywords:spec OR keywords:e2e OR keywords:unit', 
                    limit: 70, 
                    pages: 2 
                  })}
                  className="w-full p-3 bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors"
                >
                  🧪 Import Testing Packages (2 pages)
                </button>
                
                <button
                  onClick={() => handleImport({ 
                    searchQuery: 'keywords:css OR keywords:style OR keywords:sass OR keywords:less OR keywords:postcss OR keywords:styling OR keywords:stylesheet', 
                    limit: 60, 
                    pages: 2 
                  })}
                  className="w-full p-3 bg-pink-600 hover:bg-pink-700 rounded-lg transition-colors"
                >
                  🎨 Import CSS & Styling (2 pages)
                </button>
                
                <button
                  onClick={() => handleImport({ 
                    searchQuery: 'keywords:documentation OR keywords:docs OR keywords:jsdoc OR keywords:docgen OR keywords:api-docs OR keywords:readme', 
                    limit: 40, 
                    pages: 2 
                  })}
                  className="w-full p-3 bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors"
                >
                  📚 Import Documentation Tools (2 pages)
                </button>
                
                <button
                  onClick={() => handleImport({ 
                    searchQuery: 'keywords:iot OR keywords:arduino OR keywords:raspberry-pi OR keywords:hardware OR keywords:sensor OR keywords:embedded', 
                    limit: 30, 
                    pages: 2 
                  })}
                  className="w-full p-3 bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
                >
                  📡 Import IoT Packages (2 pages)
                </button>
                
                <button
                  onClick={() => handleImport({ 
                    searchQuery: 'keywords:coverage OR keywords:codecov OR keywords:istanbul OR keywords:nyc OR keywords:code-coverage', 
                    limit: 25, 
                    pages: 2 
                  })}
                  className="w-full p-3 bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors"
                >
                  📊 Import Coverage Tools (2 pages)
                </button>
                
                <button
                  onClick={() => handleImport({ 
                    searchQuery: 'keywords:mobile OR keywords:react-native OR keywords:ionic OR keywords:cordova OR keywords:phonegap OR keywords:android OR keywords:ios', 
                    limit: 50, 
                    pages: 2 
                  })}
                  className="w-full p-3 bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors"
                >
                  📱 Import Mobile Packages (2 pages)
                </button>
                
                <button
                  onClick={() => handleImport({ 
                    searchQuery: 'keywords:framework OR keywords:next OR keywords:nuxt OR keywords:gatsby OR keywords:remix OR keywords:sveltekit', 
                    limit: 40, 
                    pages: 2 
                  })}
                  className="w-full p-3 bg-yellow-600 hover:bg-yellow-700 rounded-lg transition-colors"
                >
                  🚀 Import Framework Packages (2 pages)
                </button>
                
                <button
                  onClick={() => handleImport({ 
                    searchQuery: 'keywords:robotics OR keywords:robot OR keywords:automation OR keywords:johnny-five OR keywords:firmata', 
                    limit: 20, 
                    pages: 2 
                  })}
                  className="w-full p-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                >
                  🤖 Import Robotics Packages (2 pages)
                </button>
                
                <button
                  onClick={() => handleImport({ 
                    searchQuery: 'keywords:math OR keywords:mathematics OR keywords:algorithm OR keywords:calculation OR keywords:numeric OR keywords:statistics', 
                    limit: 35, 
                    pages: 2 
                  })}
                  className="w-full p-3 bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
                >
                  🧮 Import Math Packages (2 pages)
                </button>
                
                <button
                  onClick={() => handleImport({ 
                    searchQuery: 'popular', 
                    limit: 100, 
                    pages: 2,
                    sortBy: 'popularity' 
                  })}
                  className="w-full p-3 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 rounded-lg transition-colors font-bold"
                >
                  ⭐ Import Most Popular Packages (2 pages)
                </button>
                
                <button
                  onClick={() => setShowImportModal(false)}
                  className="w-full p-3 bg-gray-600 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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