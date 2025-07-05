import React, { useState, useEffect } from 'react';
import { 
  Download, Package, Search, Filter, RefreshCw, 
  Check, AlertCircle, X, PlusCircle, Tag, Code,
  Database, FileText, Clock, Zap, Layers, Settings
} from 'lucide-react';
import { importNPMPackages } from '../hooks/useNPMPackages';

interface ImportStatus {
  inProgress: boolean;
  message: string;
  error: string | null;
  stats: {
    processed: number;
    added: number;
    updated: number;
  };
}

interface ImportPreset {
  name: string;
  query: string;
  description: string;
  icon: React.ReactNode;
  limit: number;
}

const IMPORT_PRESETS: ImportPreset[] = [
  {
    name: 'CSS & Styling',
    query: 'keywords:css OR keywords:styling OR keywords:postcss OR keywords:sass OR keywords:less OR keywords:stylesheet OR keywords:tailwind',
    description: 'CSS processors, design systems, and styling utilities',
    icon: <span className="text-pink-500">🎨</span>,
    limit: 200
  },
  {
    name: 'Math',
    query: 'keywords:math OR keywords:mathematics OR keywords:calculation OR keywords:numeric OR keywords:statistics OR keywords:algebra',
    description: 'Mathematical libraries, calculators, and numerical algorithms',
    icon: <span className="text-blue-500">🧮</span>,
    limit: 150
  },
  {
    name: 'Front-end Components',
    query: 'keywords:react-component OR keywords:ui-component OR keywords:vue-component OR keywords:ui-library OR keywords:design-system',
    description: 'UI component libraries and design systems',
    icon: <span className="text-indigo-500">🧩</span>,
    limit: 200
  },
  {
    name: 'Back-end Frameworks',
    query: 'keywords:express OR keywords:koa OR keywords:fastify OR keywords:hapi OR keywords:nest OR keywords:server-framework',
    description: 'Node.js server frameworks and middleware',
    icon: <span className="text-green-500">⚙️</span>,
    limit: 150
  },
  {
    name: 'Testing Utilities',
    query: 'keywords:testing OR keywords:test-runner OR keywords:jest OR keywords:mocha OR keywords:test-utils OR keywords:assert',
    description: 'Testing frameworks, runners, and assertion libraries',
    icon: <span className="text-cyan-500">🧪</span>,
    limit: 150
  },
  {
    name: 'Data Validation',
    query: 'keywords:validation OR keywords:validate OR keywords:schema OR keywords:form-validation',
    description: 'Data validation libraries and schema validators',
    icon: <span className="text-yellow-500">✅</span>,
    limit: 100
  }
];

const NPMImportTool: React.FC<{ onComplete?: () => void }> = ({ onComplete }) => {
  const [customQuery, setCustomQuery] = useState('');
  const [customKeywords, setCustomKeywords] = useState('');
  const [limit, setLimit] = useState(100);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [currentImport, setCurrentImport] = useState<ImportStatus>({
    inProgress: false,
    message: '',
    error: null,
    stats: { processed: 0, added: 0, updated: 0 }
  });
  const [importHistory, setImportHistory] = useState<{
    timestamp: Date;
    query: string;
    stats: ImportStatus['stats'];
  }[]>([]);

  // Load import history from localStorage
  useEffect(() => {
    const history = localStorage.getItem('npm-import-history');
    if (history) {
      try {
        setImportHistory(JSON.parse(history));
      } catch (e) {
        console.error('Failed to parse import history:', e);
      }
    }
  }, []);

  // Save import history to localStorage
  const saveImportHistory = (history: typeof importHistory) => {
    localStorage.setItem('npm-import-history', JSON.stringify(history));
    setImportHistory(history);
  };

  // Run import based on preset
  const runPresetImport = async (preset: ImportPreset) => {
    if (currentImport.inProgress) return;
    
    setCurrentImport({
      inProgress: true,
      message: `Starting import for ${preset.name}...`,
      error: null,
      stats: { processed: 0, added: 0, updated: 0 }
    });

    try {
      setCurrentImport(prev => ({
        ...prev,
        message: `Searching npm registry for ${preset.name} packages...`
      }));
      
      const result = await importNPMPackages({
        searchQuery: preset.query,
        limit: preset.limit,
        pages: 1,
        importType: 'manual'
      });
      
      setCurrentImport({
        inProgress: false,
        message: `Successfully imported ${preset.name} packages!`,
        error: null,
        stats: { 
          processed: result.packagesProcessed || 0, 
          added: result.packagesAdded || 0, 
          updated: result.packagesUpdated || 0 
        }
      });
      
      // Add to history
      const newHistory = [
        {
          timestamp: new Date(),
          query: preset.name,
          stats: { 
            processed: result.packagesProcessed || 0, 
            added: result.packagesAdded || 0, 
            updated: result.packagesUpdated || 0 
          }
        },
        ...importHistory
      ].slice(0, 10); // Keep only most recent 10
      
      saveImportHistory(newHistory);
      
      // Notify parent
      if (onComplete) {
        setTimeout(onComplete, 2000);
      }
      
    } catch (error) {
      console.error('Import error:', error);
      setCurrentImport({
        inProgress: false,
        message: '',
        error: error.message || 'Import failed',
        stats: { processed: 0, added: 0, updated: 0 }
      });
    }
  };

  // Run custom import
  const runCustomImport = async () => {
    if (currentImport.inProgress || (!customQuery && !customKeywords)) return;
    
    let searchQuery = customQuery;
    
    // If keywords are specified, format them for the query
    if (customKeywords) {
      const keywords = customKeywords.split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);
        
      if (keywords.length > 0) {
        searchQuery = keywords.map(k => `keywords:${k}`).join(' OR ');
        if (customQuery) {
          searchQuery = `(${searchQuery}) AND ${customQuery}`;
        }
      }
    }
    
    setCurrentImport({
      inProgress: true,
      message: `Starting import for custom query...`,
      error: null,
      stats: { processed: 0, added: 0, updated: 0 }
    });

    try {
      setCurrentImport(prev => ({
        ...prev,
        message: `Searching npm registry with custom query...`
      }));
      
      const result = await importNPMPackages({
        searchQuery,
        limit,
        pages: 1,
        importType: 'manual'
      });
      
      setCurrentImport({
        inProgress: false,
        message: `Successfully imported packages!`,
        error: null,
        stats: { 
          processed: result.packagesProcessed || 0, 
          added: result.packagesAdded || 0, 
          updated: result.packagesUpdated || 0 
        }
      });
      
      // Add to history
      const newHistory = [
        {
          timestamp: new Date(),
          query: searchQuery.substring(0, 30) + (searchQuery.length > 30 ? '...' : ''),
          stats: { 
            processed: result.packagesProcessed || 0, 
            added: result.packagesAdded || 0, 
            updated: result.packagesUpdated || 0 
          }
        },
        ...importHistory
      ].slice(0, 10);
      
      saveImportHistory(newHistory);
      
      // Reset form
      setCustomQuery('');
      setCustomKeywords('');
      
      // Notify parent
      if (onComplete) {
        setTimeout(onComplete, 2000);
      }
      
    } catch (error) {
      console.error('Import error:', error);
      setCurrentImport({
        inProgress: false,
        message: '',
        error: error.message || 'Import failed',
        stats: { processed: 0, added: 0, updated: 0 }
      });
    }
  };

  return (
    <div className="card-minimal space-y-6">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-subheading flex items-center gap-2">
          <Package className="text-blue-600" size={18} />
          NPM Package Importer
        </h2>
        
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="btn-minimal btn-ghost"
        >
          <Settings size={14} />
          {showAdvanced ? 'Hide' : 'Advanced'}
        </button>
      </div>
      
      {/* Import Status */}
      {(currentImport.inProgress || currentImport.message || currentImport.error) && (
        <div className={`p-4 rounded-md mb-4 ${
          currentImport.error 
            ? 'bg-red-50 border border-red-200 dark:bg-red-900/20 dark:border-red-800' 
            : currentImport.message && !currentImport.inProgress
            ? 'bg-green-50 border border-green-200 dark:bg-green-900/20 dark:border-green-800'
            : 'bg-blue-50 border border-blue-200 dark:bg-blue-900/20 dark:border-blue-800'
        }`}>
          {currentImport.inProgress && (
            <div className="flex items-center gap-3 mb-2">
              <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
              <p className="font-medium text-blue-700 dark:text-blue-300">{currentImport.message}</p>
            </div>
          )}
          
          {!currentImport.inProgress && currentImport.message && (
            <div className="flex items-center gap-2">
              <Check size={16} className="text-green-600" />
              <p className="font-medium text-green-700 dark:text-green-300">{currentImport.message}</p>
            </div>
          )}
          
          {currentImport.error && (
            <div className="flex items-center gap-2">
              <AlertCircle size={16} className="text-red-600" />
              <p className="font-medium text-red-700 dark:text-red-300">{currentImport.error}</p>
            </div>
          )}
          
          {(currentImport.stats.processed > 0 || currentImport.inProgress) && (
            <div className="mt-2 grid grid-cols-3 gap-2 text-sm">
              <div className="bg-white dark:bg-gray-800 p-2 rounded text-center">
                <div className="font-medium">{currentImport.stats.processed}</div>
                <div className="text-caption">Processed</div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-2 rounded text-center">
                <div className="font-medium text-green-600">{currentImport.stats.added}</div>
                <div className="text-caption">Added</div>
              </div>
              <div className="bg-white dark:bg-gray-800 p-2 rounded text-center">
                <div className="font-medium text-blue-600">{currentImport.stats.updated}</div>
                <div className="text-caption">Updated</div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Quick Import Presets */}
      <div>
        <h3 className="font-semibold mb-3 text-sm">Quick Import Categories</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {IMPORT_PRESETS.map((preset, index) => (
            <button
              key={index}
              onClick={() => runPresetImport(preset)}
              disabled={currentImport.inProgress}
              className="card-minimal hover:shadow-md transition-all text-left cursor-pointer disabled:opacity-50"
            >
              <div className="flex items-center gap-2 mb-1">
                {preset.icon}
                <h4 className="font-medium">{preset.name}</h4>
              </div>
              <p className="text-caption text-gray-600 dark:text-gray-400">{preset.description}</p>
              <div className="flex items-center justify-between mt-2 text-xs">
                <span className="text-blue-600">{preset.limit} packages</span>
                <span className="text-green-600 flex items-center gap-1">
                  <Download size={12} />
                  Import
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Custom Import */}
      {showAdvanced && (
        <div className="p-4 border border-gray-200 dark:border-gray-700 rounded-md bg-gray-50 dark:bg-gray-800">
          <h3 className="font-semibold mb-3 text-sm flex items-center gap-2">
            <Zap className="text-yellow-600" size={14} />
            Custom Import
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Search Query</label>
              <input
                type="text"
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                placeholder="Example: 'css library' (optional)"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1 flex items-center gap-2">
                <Tag size={14} />
                Keywords (comma separated)
              </label>
              <input
                type="text"
                value={customKeywords}
                onChange={(e) => setCustomKeywords(e.target.value)}
                placeholder="Example: css,styling,postcss"
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm"
              />
              <p className="text-caption mt-1">
                Will search for packages tagged with these keywords
              </p>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-1">
                Limit (packages per page)
              </label>
              <select
                value={limit}
                onChange={(e) => setLimit(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm"
              >
                <option value={50}>50 packages</option>
                <option value={100}>100 packages</option>
                <option value={200}>200 packages</option>
                <option value={300}>300 packages</option>
                <option value={500}>500 packages (max)</option>
              </select>
            </div>
            
            <button
              onClick={runCustomImport}
              disabled={currentImport.inProgress || (!customQuery && !customKeywords)}
              className="w-full btn-minimal btn-primary mt-2"
            >
              {currentImport.inProgress ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  Importing...
                </>
              ) : (
                <>
                  <Download size={14} />
                  Run Custom Import
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Import History */}
      {importHistory.length > 0 && (
        <div className="mt-4">
          <h3 className="font-semibold mb-3 text-sm flex items-center gap-2">
            <Clock className="text-gray-600" size={14} />
            Recent Imports
          </h3>
          <div className="max-h-64 overflow-y-auto space-y-2">
            {importHistory.map((entry, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-md text-sm"
              >
                <div>
                  <div className="font-medium">{entry.query}</div>
                  <div className="text-caption">{entry.timestamp.toString()}</div>
                </div>
                <div className="text-right">
                  <div className="text-green-600">{entry.stats.added} added</div>
                  <div className="text-blue-600">{entry.stats.updated} updated</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NPMImportTool;