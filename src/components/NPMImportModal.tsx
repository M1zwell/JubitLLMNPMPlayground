import React, { useState } from 'react';
import { X, AlertCircle, PlusCircle } from 'lucide-react';
import NPMImportTool from './NPMImportTool';
import NPMScraper from './NPMScraper';

interface NPMImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onComplete?: () => void;
}

const NPMImportModal: React.FC<NPMImportModalProps> = ({ isOpen, onClose, onComplete }) => {
  const [activeTab, setActiveTab] = useState<'import' | 'scraper'>('import');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-xl max-w-4xl w-full border border-gray-200 dark:border-gray-700 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-green-50 dark:from-blue-900/30 dark:to-green-900/30 p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h2 className="text-heading flex items-center gap-2">
            <PlusCircle size={20} className="text-green-600" />
            Import NPM Packages
          </h2>
          
          <button
            onClick={onClose}
            className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'import' 
                ? 'border-blue-600 text-blue-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Package Importer
          </button>
          <button
            onClick={() => setActiveTab('scraper')}
            className={`px-4 py-2 text-sm font-medium border-b-2 ${
              activeTab === 'scraper' 
                ? 'border-green-600 text-green-600' 
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            Web Scraper
          </button>
        </div>
        
        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto">
          {activeTab === 'import' ? (
            <NPMImportTool onComplete={() => {
              onComplete?.();
              setTimeout(() => onClose(), 2000);
            }} />
          ) : (
            <NPMScraper onComplete={() => {
              onComplete?.();
              setTimeout(() => onClose(), 2000);
            }} />
          )}
        </div>
        
        {/* Footer */}
        <div className="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-between">
          <div className="text-sm text-gray-500">
            {activeTab === 'import' 
              ? 'Import packages directly from npm registry'
              : 'Scrape and import packages from npmjs.com website'}
          </div>
          <button
            onClick={onClose}
            className="btn-minimal btn-secondary"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

export default NPMImportModal;