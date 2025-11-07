import React, { useState, useMemo } from 'react';
import {
  X,
  Download,
  Search,
  Table as TableIcon,
  Code,
  FileText,
  ArrowUp,
  ArrowDown,
  Copy,
  Check,
  Eye
} from 'lucide-react';

interface DataPreviewModalProps {
  isOpen: boolean;
  data: any[];
  targetName: string;
  metadata: {
    recordCount: number;
    executionTime: number;
    source: 'firecrawl' | 'puppeteer';
    timestamp: Date;
  };
  onClose: () => void;
  onExport: (format: 'json' | 'csv' | 'xlsx') => void;
}

type ViewMode = 'table' | 'json' | 'raw';
type SortDirection = 'asc' | 'desc';

const DataPreviewModal: React.FC<DataPreviewModalProps> = ({
  isOpen,
  data,
  targetName,
  metadata,
  onClose,
  onExport
}) => {
  const [viewMode, setViewMode] = useState<ViewMode>('table');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [copied, setCopied] = useState(false);

  // Filter and sort data
  const processedData = useMemo(() => {
    if (!data || data.length === 0) return [];

    let filtered = data;

    // Apply search filter
    if (searchTerm) {
      filtered = data.filter(row => {
        return Object.values(row).some(value => {
          const str = String(value || '').toLowerCase();
          return str.includes(searchTerm.toLowerCase());
        });
      });
    }

    // Apply sorting
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];

        // Handle null/undefined
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;

        // Numeric comparison
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }

        // String comparison
        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();

        if (sortDirection === 'asc') {
          return aStr.localeCompare(bStr);
        } else {
          return bStr.localeCompare(aStr);
        }
      });
    }

    return filtered;
  }, [data, searchTerm, sortColumn, sortDirection]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleCopy = async () => {
    const text = viewMode === 'json'
      ? JSON.stringify(processedData, null, 2)
      : JSON.stringify(processedData);

    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] flex flex-col border border-gray-700">
        {/* Header */}
        <div className="p-6 border-b border-gray-700">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-100 flex items-center gap-2">
                <Eye className="text-blue-500" size={24} />
                Data Preview: {targetName}
              </h2>
              <div className="flex items-center gap-4 mt-2 text-sm text-gray-400">
                <span className="flex items-center gap-1">
                  <span className="font-semibold text-green-400">{metadata.recordCount}</span> records
                </span>
                <span className="text-gray-600">•</span>
                <span className="flex items-center gap-1">
                  <span className="font-semibold text-blue-400">{metadata.executionTime}ms</span> execution time
                </span>
                <span className="text-gray-600">•</span>
                <span className="flex items-center gap-1">
                  Source: <span className="font-semibold text-purple-400">{metadata.source}</span>
                </span>
                {processedData.length !== metadata.recordCount && (
                  <>
                    <span className="text-gray-600">•</span>
                    <span className="text-yellow-400">Showing {processedData.length} filtered</span>
                  </>
                )}
              </div>
            </div>

            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-200 transition-colors"
              title="Close"
            >
              <X size={24} />
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setViewMode('table')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <TableIcon size={16} />
              Table
            </button>
            <button
              onClick={() => setViewMode('json')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                viewMode === 'json'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <Code size={16} />
              JSON
            </button>
            <button
              onClick={() => setViewMode('raw')}
              className={`flex items-center gap-2 px-4 py-2 rounded-md transition-all ${
                viewMode === 'raw'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              <FileText size={16} />
              Raw
            </button>
          </div>
        </div>

        {/* Search Bar */}
        {viewMode === 'table' && (
          <div className="px-6 py-4 border-b border-gray-700">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Search in all columns..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-md text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-200"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {viewMode === 'table' && (
            <DataTable
              data={processedData}
              onSort={handleSort}
              sortColumn={sortColumn}
              sortDirection={sortDirection}
            />
          )}

          {viewMode === 'json' && (
            <div className="relative">
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 flex items-center gap-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md transition-colors text-sm"
              >
                {copied ? (
                  <>
                    <Check size={14} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    Copy
                  </>
                )}
              </button>
              <pre className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-auto max-h-[60vh]">
                <code>{JSON.stringify(processedData, null, 2)}</code>
              </pre>
            </div>
          )}

          {viewMode === 'raw' && (
            <div className="relative">
              <button
                onClick={handleCopy}
                className="absolute top-2 right-2 flex items-center gap-2 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md transition-colors text-sm z-10"
              >
                {copied ? (
                  <>
                    <Check size={14} />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    Copy
                  </>
                )}
              </button>
              <textarea
                value={JSON.stringify(processedData)}
                readOnly
                className="w-full h-[60vh] p-4 bg-gray-900 text-gray-100 font-mono text-sm rounded-md border border-gray-700 focus:outline-none"
              />
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-700 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            {processedData.length === 0 ? (
              <span className="text-yellow-400">No data to display</span>
            ) : (
              <span>Ready to export {processedData.length} records</span>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onExport('json')}
              disabled={processedData.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={16} />
              Export JSON
            </button>
            <button
              onClick={() => onExport('csv')}
              disabled={processedData.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={16} />
              Export CSV
            </button>
            <button
              onClick={() => onExport('xlsx')}
              disabled={processedData.length === 0}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download size={16} />
              Export XLSX
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-md transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// DataTable Component
interface DataTableProps {
  data: any[];
  onSort: (column: string) => void;
  sortColumn: string | null;
  sortDirection: SortDirection;
}

const DataTable: React.FC<DataTableProps> = ({ data, onSort, sortColumn, sortDirection }) => {
  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <TableIcon size={48} className="mx-auto mb-4 opacity-50" />
        <p className="text-lg">No data to display</p>
        <p className="text-sm mt-2">Try adjusting your search filters</p>
      </div>
    );
  }

  const columns = Object.keys(data[0]);

  const formatValue = (value: any): string => {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'object') return JSON.stringify(value);
    if (typeof value === 'boolean') return value ? '✓' : '✗';
    return String(value);
  };

  const truncate = (str: string, maxLength: number = 100): string => {
    if (str.length <= maxLength) return str;
    return str.substring(0, maxLength) + '...';
  };

  return (
    <div className="overflow-auto border border-gray-700 rounded-md">
      <table className="w-full border-collapse">
        <thead className="bg-gray-700 sticky top-0 z-10">
          <tr>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider border-b border-gray-600">
              #
            </th>
            {columns.map((col) => (
              <th
                key={col}
                onClick={() => onSort(col)}
                className="px-4 py-3 text-left text-xs font-semibold text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-600 transition-colors border-b border-gray-600"
              >
                <div className="flex items-center gap-2">
                  <span>{col}</span>
                  {sortColumn === col && (
                    <span className="text-blue-400">
                      {sortDirection === 'asc' ? <ArrowUp size={14} /> : <ArrowDown size={14} />}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-gray-800">
          {data.map((row, idx) => (
            <tr
              key={idx}
              className="border-b border-gray-700 hover:bg-gray-750 transition-colors"
            >
              <td className="px-4 py-3 text-sm text-gray-400 font-mono">
                {idx + 1}
              </td>
              {columns.map((col) => (
                <td
                  key={col}
                  className="px-4 py-3 text-sm text-gray-200"
                  title={formatValue(row[col])}
                >
                  {truncate(formatValue(row[col]))}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default DataPreviewModal;
