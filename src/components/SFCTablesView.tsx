import React, { useState, useMemo } from 'react';
import { ChevronDown, ChevronUp, Download, Search } from 'lucide-react';

interface Props {
  marketHighlights: any[];
  marketCapByType: any[];
  turnoverByType: any[];
  mutualFundNAV: any[];
  licensedReps: any[];
  responsibleOfficers: any[];
  fundFlows: any[];
}

type TableName = 'A1' | 'A2' | 'A3' | 'C4' | 'C5' | 'D3' | 'D4';

const SFCTablesView: React.FC<Props> = ({
  marketHighlights,
  marketCapByType,
  turnoverByType,
  mutualFundNAV,
  licensedReps,
  responsibleOfficers,
  fundFlows
}) => {
  const [activeTable, setActiveTable] = useState<TableName>('A1');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<string>('');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');

  const tables = [
    {
      id: 'A1' as TableName,
      title: 'Market Highlights',
      description: 'Total market cap, turnover, listings (annual)',
      recordCount: marketHighlights.length,
      data: marketHighlights
    },
    {
      id: 'A2' as TableName,
      title: 'Market Cap by Type',
      description: 'Market capitalisation by stock type (annual)',
      recordCount: marketCapByType.length,
      data: marketCapByType
    },
    {
      id: 'A3' as TableName,
      title: 'Turnover by Type',
      description: 'Average daily turnover by stock type (annual)',
      recordCount: turnoverByType.length,
      data: turnoverByType
    },
    {
      id: 'C4' as TableName,
      title: 'Licensed Representatives',
      description: 'Number of licensed representatives by activity type',
      recordCount: licensedReps.length,
      data: licensedReps
    },
    {
      id: 'C5' as TableName,
      title: 'Responsible Officers',
      description: 'Number of responsible officers by activity type',
      recordCount: responsibleOfficers.length,
      data: responsibleOfficers
    },
    {
      id: 'D3' as TableName,
      title: 'Mutual Fund NAV',
      description: 'Net asset value by fund category (quarterly)',
      recordCount: mutualFundNAV.length,
      data: mutualFundNAV
    },
    {
      id: 'D4' as TableName,
      title: 'Fund Flows',
      description: 'Net flows of authorised funds (annual)',
      recordCount: fundFlows.length,
      data: fundFlows
    }
  ];

  const currentTable = tables.find(t => t.id === activeTable);

  // Filter and sort data
  const processedData = useMemo(() => {
    if (!currentTable) return [];

    let filtered = currentTable.data;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(row =>
        Object.values(row).some(val =>
          String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    // Sort
    if (sortColumn) {
      filtered = [...filtered].sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];

        // Handle numbers
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
        }

        // Handle strings
        const aStr = String(aVal || '');
        const bStr = String(bVal || '');
        return sortDirection === 'asc'
          ? aStr.localeCompare(bStr)
          : bStr.localeCompare(aStr);
      });
    }

    return filtered;
  }, [currentTable, searchTerm, sortColumn, sortDirection]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('desc');
    }
  };

  const exportToCSV = () => {
    if (!currentTable || processedData.length === 0) return;

    const headers = Object.keys(processedData[0]);
    const csvContent = [
      headers.join(','),
      ...processedData.map(row =>
        headers.map(h => {
          const val = row[h];
          // Quote strings that contain commas
          return typeof val === 'string' && val.includes(',')
            ? `"${val}"`
            : val;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sfc_table_${activeTable}_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const renderTableContent = () => {
    if (!currentTable || processedData.length === 0) {
      return (
        <div className="text-center py-12 text-gray-500 dark:text-gray-400">
          No data available
        </div>
      );
    }

    const columns = Object.keys(processedData[0]);

    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 dark:bg-gray-700 sticky top-0">
            <tr>
              {columns.map(col => (
                <th
                  key={col}
                  onClick={() => handleSort(col)}
                  className="px-4 py-3 text-left text-gray-700 dark:text-gray-300 font-medium cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span>{col.replace(/_/g, ' ').toUpperCase()}</span>
                    {sortColumn === col && (
                      sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {processedData.map((row, idx) => (
              <tr
                key={idx}
                className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                {columns.map(col => (
                  <td key={col} className="px-4 py-3 text-gray-900 dark:text-gray-100">
                    {typeof row[col] === 'number'
                      ? row[col].toLocaleString()
                      : row[col] || '-'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Table Selector */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {tables.map(table => (
          <button
            key={table.id}
            onClick={() => {
              setActiveTable(table.id);
              setSearchTerm('');
              setSortColumn('');
            }}
            className={`p-4 rounded-lg border-2 text-left transition-all ${
              activeTable === table.id
                ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-blue-400'
            }`}
          >
            <div className="font-semibold text-gray-900 dark:text-white mb-1">
              Table {table.id} - {table.title}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              {table.description}
            </div>
            <div className="text-xs font-medium text-blue-600 dark:text-blue-400">
              {table.recordCount} records
            </div>
          </button>
        ))}
      </div>

      {/* Current Table Controls */}
      {currentTable && (
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Table {activeTable} - {currentTable.title}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {currentTable.description} • {processedData.length} of {currentTable.recordCount} records shown
                </p>
              </div>
              <button
                onClick={exportToCSV}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <Download size={16} />
                Export CSV
              </button>
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search all columns..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Table Content */}
          <div className="max-h-[600px] overflow-y-auto">
            {renderTableContent()}
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              <strong>Tip:</strong> Click on column headers to sort. Use the search box to filter records.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default SFCTablesView;
