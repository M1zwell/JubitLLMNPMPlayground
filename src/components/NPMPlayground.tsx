import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, Copy, Star, Github, Calendar, Package, Code, Terminal,
  Lightbulb, Zap, CheckCircle, Globe, RefreshCw, Plus, X, ArrowRight, 
  Settings, Save, Upload, Layers, Brain, Target, Users, BarChart3,
  FileText, Image, Database, Mail, Lock, Search as SearchIcon, Filter,
  Workflow, Share2, TrendingUp, Award, Clock, DollarSign,
  ShoppingCart, ExternalLink, Cpu, Eye, ArrowLeft
} from 'lucide-react';
import { useNPMPackages } from '../hooks/useNPMPackages';
import { NPMPackage } from '../lib/supabase';
import AIWorkflowAdvisor from './AIWorkflowAdvisor';

// Atomic Function Categories mapping real packages
const ATOMIC_CATEGORIES = {
  all: { name: 'All Atomic Functions', icon: Package, color: 'text-gray-500', count: 0 },
  
  // File Processing Atoms
  'pdf-extraction': { name: 'PDF Extraction', icon: FileText, color: 'text-red-600', count: 0 },
  'image-processing': { name: 'Image Processing', icon: Image, color: 'text-blue-600', count: 0 },
  'excel-manipulation': { name: 'Excel/CSV Handling', icon: BarChart3, color: 'text-green-600', count: 0 },
  'compression': { name: 'File Compression', icon: Package, color: 'text-purple-600', count: 0 },
  
  // Text Processing Atoms
  'text-parsing': { name: 'Text Parsing', icon: FileText, color: 'text-yellow-600', count: 0 },
  'text-analysis': { name: 'Text Analysis', icon: Brain, color: 'text-pink-600', count: 0 },
  'text-cleaning': { name: 'Text Cleaning', icon: Zap, color: 'text-cyan-600', count: 0 },
  
  // Data Transformation Atoms
  'encoding-decoding': { name: 'Encoding/Decoding', icon: Code, color: 'text-indigo-600', count: 0 },
  'encryption-hashing': { name: 'Encryption/Hashing', icon: Lock, color: 'text-orange-600', count: 0 },
  'data-serialization': { name: 'Data Serialization', icon: Database, color: 'text-emerald-600', count: 0 },
  
  // Validation Atoms
  'format-validation': { name: 'Format Validation', icon: CheckCircle, color: 'text-teal-600', count: 0 },
  'data-validation': { name: 'Data Validation', icon: Target, color: 'text-rose-600', count: 0 },
  
  // Network Atoms
  'http-requests': { name: 'HTTP Requests', icon: Globe, color: 'text-blue-600', count: 0 },
  'email-sending': { name: 'Email Sending', icon: Mail, color: 'text-red-600', count: 0 },
  
  // Time Processing Atoms
  'date-processing': { name: 'Date Processing', icon: Calendar, color: 'text-amber-600', count: 0 },
  'scheduling': { name: 'Task Scheduling', icon: Clock, color: 'text-gray-600', count: 0 },
};

// Map real packages to atomic functions
const ATOMIC_FUNCTION_MAPPING = {
  'pdf-parse': {
    atomicFunction: 'PDF Text Extraction',
    category: 'pdf-extraction',
    icon: '📄',
    inputs: ['PDF Buffer', 'PDF File Path'],
    outputs: ['Plain Text', 'Page Count', 'Metadata'],
    useCase: 'Extract readable text from PDF documents',
    example: `const pdfParse = require('pdf-parse');\nconst text = await pdfParse(buffer);`,
    performance: 'Fast',
    complexity: 'Low'
  },
  'sharp': {
    atomicFunction: 'Image Resizing',
    category: 'image-processing',
    icon: '🖼️',
    inputs: ['Image Buffer', 'Image File', 'Dimensions'],
    outputs: ['Resized Image', 'Image Metadata'],
    useCase: 'Resize, crop, and convert image formats',
    example: `const sharp = require('sharp');\nconst resized = await sharp(input).resize(300, 200).toBuffer();`,
    performance: 'Very Fast',
    complexity: 'Low'
  },
  'papaparse': {
    atomicFunction: 'CSV Parsing',
    category: 'excel-manipulation',
    icon: '📋',
    inputs: ['CSV String', 'CSV File', 'Parse Config'],
    outputs: ['JSON Array', 'Parse Errors'],
    useCase: 'Parse CSV files with error handling',
    example: `const Papa = require('papaparse');\nconst results = Papa.parse(csvString, {header: true});`,
    performance: 'Very Fast',
    complexity: 'Low'
  },
  'joi': {
    atomicFunction: 'Data Validation',
    category: 'data-validation',
    icon: '✅',
    inputs: ['Object Data', 'Schema Definition'],
    outputs: ['Validation Result', 'Error Details'],
    useCase: 'Validate object structure and data types',
    example: `const Joi = require('joi');\nconst schema = Joi.object({name: Joi.string().required()});`,
    performance: 'Fast',
    complexity: 'Medium'
  },
  'validator': {
    atomicFunction: 'String Validation',
    category: 'format-validation',
    icon: '🔍',
    inputs: ['String Value', 'Validation Rules'],
    outputs: ['Boolean Result', 'Sanitized String'],
    useCase: 'Validate emails, URLs, credit cards, etc.',
    example: `const validator = require('validator');\nconst isEmail = validator.isEmail('test@example.com');`,
    performance: 'Very Fast',
    complexity: 'Very Low'
  },
  'axios': {
    atomicFunction: 'HTTP Requests',
    category: 'http-requests',
    icon: '🌐',
    inputs: ['URL', 'Request Config', 'Data'],
    outputs: ['Response Data', 'Status Code', 'Headers'],
    useCase: 'Make HTTP requests to APIs and servers',
    example: `const axios = require('axios');\nconst response = await axios.get('https://api.example.com');`,
    performance: 'Fast',
    complexity: 'Low'
  }
};

// Workflow Templates using real packages
const WORKFLOW_TEMPLATES = {
  'pdf-processor': {
    name: '📄 PDF Intelligence Pipeline',
    description: 'Extract text from PDF → Analyze with NLP → Validate data → Export to Excel',
    category: 'Document Processing',
    difficulty: 'Beginner',
    estimatedTime: '5-10 seconds',
    atoms: [
      { package: 'pdf-parse', step: 'Extract text content' },
      { package: 'validator', step: 'Validate extracted data' },
      { package: 'papaparse', step: 'Process structured data' }
    ],
    connections: ['pdf-parse→validator', 'validator→papaparse'],
    realWorldUse: 'Process invoices, contracts, legal documents',
    popularity: 4.8,
    communityRating: 4.9
  },

  'image-optimizer': {
    name: '🖼️ Smart Image Processing Factory',
    description: 'Upload → Resize → Process → Store',
    category: 'Media Processing',
    difficulty: 'Beginner', 
    estimatedTime: '3-5 seconds',
    atoms: [
      { package: 'sharp', step: 'Resize and optimize' },
      { package: 'validator', step: 'Validate metadata' }
    ],
    connections: ['sharp→validator'],
    realWorldUse: 'E-commerce product images, social media content',
    popularity: 4.7,
    communityRating: 4.8
  },

  'data-validator': {
    name: '✅ Ultra-Secure Data Validation Chain',
    description: 'Parse CSV → Validate each field → Process data → Generate report',
    category: 'Data Security',
    difficulty: 'Intermediate',
    estimatedTime: '8-15 seconds',
    atoms: [
      { package: 'papaparse', step: 'Parse CSV data' },
      { package: 'joi', step: 'Validate data structure' },
      { package: 'validator', step: 'Validate specific fields' }
    ],
    connections: ['papaparse→joi', 'joi→validator'],
    realWorldUse: 'User registration, financial data processing',
    popularity: 4.6,
    communityRating: 4.9
  },

  'api-integration': {
    name: '🌐 API Integration Pipeline',
    description: 'Make HTTP requests → Validate responses → Process data',
    category: 'Integration',
    difficulty: 'Intermediate',
    estimatedTime: '5-10 seconds',
    atoms: [
      { package: 'axios', step: 'Make API requests' },
      { package: 'joi', step: 'Validate response structure' },
      { package: 'validator', step: 'Validate specific fields' }
    ],
    connections: ['axios→joi', 'joi→validator'],
    realWorldUse: 'Third-party API integration, data aggregation',
    popularity: 4.5,
    communityRating: 4.7
  }
};

interface NPMPlaygroundProps {
  onNavigateToMarket?: () => void;
  initialPackage?: NPMPackage;
}

const NPMPlayground: React.FC<NPMPlaygroundProps> = ({ onNavigateToMarket, initialPackage }) => {
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [workflowCanvas, setWorkflowCanvas] = useState([]);
  const [connections, setConnections] = useState([]);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResults, setExecutionResults] = useState({});
  const [searchTerm, setSearchTerm] = useState('');
  const [showTemplates, setShowTemplates] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [workflowName, setWorkflowName] = useState('');
  const [executionStats, setExecutionStats] = useState({
    totalCost: 0,
    estimatedTime: 0,
    complexity: 'Low',
    reliability: 95
  });
  const [showMarketIntegration, setShowMarketIntegration] = useState(false);
  const [packageSearchTerm, setPackageSearchTerm] = useState('');

  // Fetch packages from the market
  const { packages: marketPackages, loading: marketLoading } = useNPMPackages({
    search: packageSearchTerm,
    sortBy: 'github_stars',
    sortDesc: true,
    limit: 20
  });

  // Generate atomic info for packages not in mapping
  const generateAtomicInfo = (pkg: NPMPackage) => {
    const keywords = pkg.keywords.join(' ').toLowerCase();
    const description = (pkg.description || '').toLowerCase();
    
    let category = 'data-serialization';
    let icon = '📦';
    let atomicFunction = 'Data Processing';
    
    if (keywords.includes('pdf') || description.includes('pdf')) {
      category = 'pdf-extraction';
      icon = '📄';
      atomicFunction = 'PDF Processing';
    } else if (keywords.includes('image') || keywords.includes('picture')) {
      category = 'image-processing';
      icon = '🖼️';
      atomicFunction = 'Image Processing';
    } else if (keywords.includes('csv') || keywords.includes('excel')) {
      category = 'excel-manipulation';
      icon = '📊';
      atomicFunction = 'Spreadsheet Processing';
    } else if (keywords.includes('validation') || keywords.includes('validate')) {
      category = 'data-validation';
      icon = '✅';
      atomicFunction = 'Data Validation';
    } else if (keywords.includes('http') || keywords.includes('request')) {
      category = 'http-requests';
      icon = '🌐';
      atomicFunction = 'Network Request';
    } else if (keywords.includes('date') || keywords.includes('time')) {
      category = 'date-processing';
      icon = '📅';
      atomicFunction = 'Date Processing';
    }
    
    return {
      atomicFunction,
      category,
      icon,
      inputs: ['Data Input'],
      outputs: ['Processed Data'],
      useCase: pkg.description || 'Process data',
      example: `const ${pkg.name.replace(/[^a-zA-Z0-9]/g, '')} = require('${pkg.name}');`,
      performance: pkg.weekly_downloads > 1000000 ? 'Fast' : 'Medium',
      complexity: 'Medium'
    };
  };

  // Add initial package to canvas if provided
  useEffect(() => {
    if (initialPackage && !workflowCanvas.find(atom => atom.package === initialPackage.name)) {
      addPackageToCanvas(initialPackage);
    }
  }, [initialPackage]);

  // Filter market packages for atomic functions
  const atomicPackages = marketPackages.filter(pkg => 
    ATOMIC_FUNCTION_MAPPING[pkg.name] || 
    pkg.keywords.some(k => ['parse', 'extract', 'convert', 'validate', 'encrypt', 'hash', 'resize', 'compress'].includes(k.toLowerCase()))
  ).map(pkg => ({
    ...pkg,
    atomicInfo: ATOMIC_FUNCTION_MAPPING[pkg.name] || generateAtomicInfo(pkg)
  }));

  // Calculate execution statistics
  useEffect(() => {
    const stats = workflowCanvas.reduce((acc, atom) => {
      acc.totalCost += 0.01; // Simulated cost per atom
      acc.estimatedTime += 2; // Base time per atom
      return acc;
    }, { totalCost: 0, estimatedTime: 0, complexity: 'Low', reliability: 95 });

    setExecutionStats(stats);
  }, [workflowCanvas]);

  // Add package to workflow canvas from market
  const addPackageToCanvas = (pkg: NPMPackage) => {
    const atomicInfo = ATOMIC_FUNCTION_MAPPING[pkg.name] || generateAtomicInfo(pkg);
    
    const newAtom = {
      id: `${pkg.name}_${Date.now()}`,
      package: pkg.name,
      packageData: pkg,
      atomicInfo,
      step: workflowCanvas.length + 1,
      x: 100 + (workflowCanvas.length * 200),
      y: 100,
      config: {},
      status: 'ready'
    };

    setWorkflowCanvas(prev => [...prev, newAtom]);
    generateAISuggestions([...workflowCanvas, newAtom]);
    setShowMarketIntegration(false);
  };

  // Remove atom from canvas
  const removeAtomFromCanvas = (atomId) => {
    setWorkflowCanvas(prev => prev.filter(atom => atom.id !== atomId));
    setConnections(prev => prev.filter(conn => 
      conn.from !== atomId && conn.to !== atomId
    ));
  };

  // Load workflow template
  const loadTemplate = (templateKey) => {
    const template = WORKFLOW_TEMPLATES[templateKey];
    if (!template) return;

    const atoms = template.atoms.map((atom, index) => {
      const pkg = marketPackages.find(p => p.name === atom.package);
      const atomicInfo = ATOMIC_FUNCTION_MAPPING[atom.package] || generateAtomicInfo(pkg || { name: atom.package, keywords: [] });
      
      return {
        id: `${atom.package}_${Date.now()}_${index}`,
        package: atom.package,
        packageData: pkg,
        atomicInfo,
        step: index + 1,
        x: 100 + (index * 200),
        y: 100,
        config: {},
        status: 'ready'
      };
    });

    setWorkflowCanvas(atoms);
    setWorkflowName(template.name);
    setShowTemplates(false);
    generateAISuggestions(atoms);
  };

  // Generate AI suggestions based on current workflow
  const generateAISuggestions = (currentAtoms) => {
    if (currentAtoms.length === 0) return;

    const suggestions = [];
    const lastAtom = currentAtoms[currentAtoms.length - 1];

    // Suggest complementary packages based on categories
    if (lastAtom.atomicInfo.category === 'pdf-extraction') {
      suggestions.push({
        type: 'next-step',
        title: 'Process the extracted text',
        packages: ['validator', 'joi'],
        reason: 'Validate the extracted text data for further processing'
      });
    }

    if (lastAtom.atomicInfo.category === 'image-processing') {
      suggestions.push({
        type: 'optimization',
        title: 'Optimize image workflow',
        packages: ['sharp'],
        reason: 'Add image optimization for better performance'
      });
    }

    // Suggest validation for data processing workflows
    if (currentAtoms.some(atom => atom.package.includes('parse'))) {
      suggestions.push({
        type: 'quality',
        title: 'Add data validation',
        packages: ['joi', 'validator'],
        reason: 'Validate parsed data to ensure quality'
      });
    }

    setAiSuggestions(suggestions);
  };

  // Execute workflow simulation
  const executeWorkflow = async () => {
    if (workflowCanvas.length === 0) return;

    setIsExecuting(true);
    const results = {};

    for (let i = 0; i < workflowCanvas.length; i++) {
      const atom = workflowCanvas[i];

      // Update atom status
      setWorkflowCanvas(prev => prev.map(a => 
        a.id === atom.id ? { ...a, status: 'running' } : a
      ));

      // Simulate processing time
      const delay = 1500;
      await new Promise(resolve => setTimeout(resolve, delay));

      // Generate realistic results
      const result = {
        output: generateMockOutput(atom),
        metadata: {
          processingTime: delay,
          inputSize: Math.floor(Math.random() * 1000) + 100,
          outputSize: Math.floor(Math.random() * 800) + 50,
          success: Math.random() > 0.05
        },
        performance: {
          memoryUsed: `${Math.floor(Math.random() * 50) + 10}MB`,
          cpuTime: `${delay}ms`,
          efficiency: `${90 + Math.floor(Math.random() * 10)}%`
        }
      };

      results[atom.id] = result;
      setExecutionResults(prev => ({ ...prev, [atom.id]: result }));

      // Update atom status to completed
      setWorkflowCanvas(prev => prev.map(a => 
        a.id === atom.id ? { ...a, status: 'completed' } : a
      ));
    }

    setIsExecuting(false);
  };

  // Generate mock output
  const generateMockOutput = (atom) => {
    const outputs = {
      'pdf-parse': '# Document Analysis\n\nExtracted 2,450 words from PDF document...',
      'sharp': 'Image resized to 800x600px, optimized size: 245KB',
      'papaparse': 'CSV parsed successfully: 325 rows, 12 columns processed',
      'joi': 'Validation passed: 98% of records valid, 23 errors found',
      'validator': 'Validation complete: 47 fields checked, 3 issues found',
      'axios': 'HTTP GET request completed: 200 OK, response time: 245ms'
    };

    return outputs[atom.package] || `${atom.atomicInfo.atomicFunction} completed successfully`;
  };

  // Clear workflow canvas
  const clearCanvas = () => {
    setWorkflowCanvas([]);
    setConnections([]);
    setExecutionResults({});
    setAiSuggestions([]);
    setWorkflowName('');
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  if (marketLoading) {
    return (
      <div className="text-center py-12">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">Loading atomic functions...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Market Integration */}
      <div className="text-center">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onNavigateToMarket}
            className="btn-minimal btn-secondary"
          >
            <ArrowLeft size={14} />
            <ShoppingCart size={14} />
            Browse NPM Market
          </button>
          
          <h1 className="text-heading-lg">
            Atomic NPM Playground
          </h1>
          
          <button
            onClick={() => setShowMarketIntegration(!showMarketIntegration)}
            className="btn-minimal btn-primary"
          >
            <Plus size={14} />
            Add from Market
          </button>
        </div>
        
        <p className="text-body-sm mb-1">
          Build powerful workflows by combining atomic function blocks from the NPM ecosystem
        </p>
      </div>

      {/* Market Integration Panel */}
      {showMarketIntegration && (
        <div className="card-minimal">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-subheading flex items-center gap-2">
              <ShoppingCart className="text-green-600" size={16} />
              Add Packages from NPM Market
            </h3>
            <button
              onClick={() => setShowMarketIntegration(false)}
              className="btn-minimal btn-ghost"
            >
              <X size={16} />
            </button>
          </div>
          
          <div className="relative mb-4">
            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Search atomic functions in market..."
              value={packageSearchTerm}
              onChange={(e) => setPackageSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-80 overflow-y-auto">
            {atomicPackages.slice(0, 12).map(pkg => (
              <div
                key={pkg.id}
                onClick={() => addPackageToCanvas(pkg)}
                className="card-minimal cursor-pointer hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{pkg.atomicInfo.icon}</span>
                  <div className="flex-1">
                    <h4 className="font-medium text-sm">{pkg.name}</h4>
                    <p className="text-caption">{pkg.atomicInfo.atomicFunction}</p>
                  </div>
                </div>
                
                <p className="text-caption text-gray-600 dark:text-gray-300 mb-2 line-clamp-2">
                  {pkg.description}
                </p>
                
                <div className="flex items-center justify-between text-xs">
                  <span className="text-green-600">{formatNumber(pkg.weekly_downloads)}/week</span>
                  <span className="flex items-center gap-1">
                    <Star size={10} className="text-yellow-600" />
                    {formatNumber(pkg.github_stars)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Statistics Dashboard */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card-minimal text-center">
          <div className="text-xl font-semibold text-green-600">${executionStats.totalCost.toFixed(3)}</div>
          <div className="text-caption">Estimated Cost</div>
        </div>
        <div className="card-minimal text-center">
          <div className="text-xl font-semibold text-blue-600">{executionStats.estimatedTime}s</div>
          <div className="text-caption">Processing Time</div>
        </div>
        <div className="card-minimal text-center">
          <div className="text-xl font-semibold text-yellow-600">{executionStats.complexity}</div>
          <div className="text-caption">Complexity</div>
        </div>
        <div className="card-minimal text-center">
          <div className="text-xl font-semibold text-pink-600">{workflowCanvas.length}</div>
          <div className="text-caption">Atomic Blocks</div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        
        {/* Left Sidebar: Quick Add & Categories */}
        <div className="col-span-3">
          <div className="sticky top-6">
            <h2 className="text-subheading mb-4 flex items-center gap-2">
              <Zap className="text-yellow-600" size={16} />
              Quick Add Functions
            </h2>

            {/* Popular atomic functions */}
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {atomicPackages.slice(0, 8).map(pkg => (
                <div
                  key={pkg.id}
                  onClick={() => addPackageToCanvas(pkg)}
                  className="card-minimal cursor-pointer hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-lg">{pkg.atomicInfo.icon}</span>
                    <div className="flex-1">
                      <h3 className="font-medium text-sm">{pkg.name}</h3>
                      <p className="text-caption">{pkg.atomicInfo.atomicFunction}</p>
                    </div>
                  </div>
                  
                  <div className="flex justify-between text-xs">
                    <span className="text-green-600">{formatNumber(pkg.weekly_downloads)}</span>
                    <span className="text-yellow-600">{pkg.atomicInfo.performance}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Center: Workflow Canvas */}
        <div className="col-span-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-subheading flex items-center gap-2">
              <Workflow className="text-blue-600" size={16} />
              Workflow Canvas
            </h2>
            
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Name your workflow..."
                value={workflowName}
                onChange={(e) => setWorkflowName(e.target.value)}
                className="px-3 py-1 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm"
              />
              <button
                onClick={executeWorkflow}
                disabled={workflowCanvas.length === 0 || isExecuting}
                className="btn-minimal btn-primary"
              >
                <Play size={14} />
                {isExecuting ? 'Running...' : 'Execute'}
              </button>
              <button
                onClick={clearCanvas}
                className="btn-minimal btn-secondary"
              >
                Clear
              </button>
            </div>
          </div>
          
          <div className="card-minimal border-dashed min-h-64">
            {workflowCanvas.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <Layers size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-subheading mb-1">Start building your atomic workflow</p>
                  <p className="text-body-sm">Add atomic functions from the left or browse the NPM market</p>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                {workflowCanvas.map((atom, index) => {
                  const result = executionResults[atom.id];
                  
                  return (
                    <div key={atom.id} className="flex items-center gap-3">
                      <div className="text-caption w-6">{index + 1}.</div>
                      
                      <div className={`
                        card-minimal flex-1 relative group
                        ${atom.status === 'running' ? 'animate-pulse border-yellow-600' : ''}
                        ${atom.status === 'completed' ? 'border-green-600' : ''}
                      `}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-lg">{atom.atomicInfo.icon}</span>
                          <div className="flex-1">
                            <h4 className="font-medium text-sm">{atom.package}</h4>
                            <p className="text-caption">{atom.atomicInfo.atomicFunction}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            {atom.status === 'running' && (
                              <div className="animate-spin rounded-full h-3 w-3 border-2 border-yellow-600 border-t-transparent"></div>
                            )}
                            {atom.status === 'completed' && (
                              <CheckCircle className="text-green-600" size={14} />
                            )}
                            <button
                              onClick={() => removeAtomFromCanvas(atom.id)}
                              className="opacity-0 group-hover:opacity-100 text-red-600 hover:text-red-700 transition-opacity"
                            >
                              <X size={12} />
                            </button>
                          </div>
                        </div>
                        
                        <div className="text-caption text-gray-600 dark:text-gray-300 mb-2">
                          Input: {atom.atomicInfo.inputs.join(', ')} → Output: {atom.atomicInfo.outputs.join(', ')}
                        </div>
                        
                        {result && (
                          <div className="mt-2 bg-gray-50 dark:bg-gray-800 rounded-md p-3">
                            <div className="text-xs text-green-600 mb-1">✅ Completed</div>
                            <div className="text-sm font-mono">{result.output}</div>
                            <div className="text-caption mt-2 flex gap-4">
                              <span>⏱️ {result.metadata.processingTime}ms</span>
                              <span>💾 {result.performance.memoryUsed}</span>
                              <span>⚡ {result.performance.efficiency}</span>
                            </div>
                          </div>
                        )}
                      </div>
                      
                      {index < workflowCanvas.length - 1 && (
                        <ArrowRight className="text-gray-400" size={16} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* AI Suggestions */}
          {aiSuggestions.length > 0 && (
            <div className="mt-4 card-minimal bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
              <h3 className="text-subheading mb-3 flex items-center gap-2">
                <Brain className="text-blue-600" />
                AI Suggestions
              </h3>
              <div className="space-y-2">
                {aiSuggestions.map((suggestion, index) => (
                  <div key={index} className="bg-white dark:bg-gray-800 rounded-md p-3 border border-gray-200 dark:border-gray-700">
                    <div className="font-medium text-sm mb-1">{suggestion.title}</div>
                    <div className="text-caption mb-2">{suggestion.reason}</div>
                    <div className="flex gap-2">
                      {suggestion.packages.map(pkgName => {
                        const pkg = atomicPackages.find(p => p.name === pkgName);
                        return pkg ? (
                          <button
                            key={pkgName}
                            onClick={() => addPackageToCanvas(pkg)}
                            className="btn-minimal btn-primary text-xs py-1 px-2"
                          >
                            + {pkgName}
                          </button>
                        ) : null;
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Right Sidebar: Templates & Tools */}
        <div className="col-span-3">
          <div className="sticky top-6">
            <h2 className="text-subheading mb-4 flex items-center gap-2">
              <Star className="text-yellow-600" size={16} />
              Proven Templates
            </h2>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {Object.entries(WORKFLOW_TEMPLATES).map(([key, template]) => (
                <div key={key} className="card-minimal hover:border-yellow-600 transition-colors">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-medium text-sm">{template.name}</h3>
                    <div className="flex items-center gap-1 text-xs">
                      <Star className="text-yellow-600" size={12} />
                      <span>{template.popularity}</span>
                    </div>
                  </div>
                  
                  <p className="text-caption text-gray-600 dark:text-gray-300 mb-3">{template.description}</p>
                  
                  <div className="space-y-1 mb-3">
                    <div className="text-xs text-purple-600">💼 {template.realWorldUse}</div>
                    <div className="text-xs text-green-600">⏱️ {template.estimatedTime}</div>
                    <div className="text-xs text-blue-600">📊 {template.difficulty}</div>
                  </div>
                  
                  <button
                    onClick={() => loadTemplate(key)}
                    className="w-full btn-minimal btn-primary text-sm"
                  >
                    Use Template
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Integration Notice */}
      <div className="card-minimal bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-800">
        <h3 className="text-subheading mb-4 text-center flex items-center justify-center gap-2">
          <Globe className="text-green-600" />
          Seamlessly Connected to NPM Market
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <ShoppingCart className="mx-auto mb-2 text-green-600" size={20} />
            <h4 className="font-semibold mb-1">Browse & Discover</h4>
            <p className="text-caption">Explore {atomicPackages.length}+ atomic functions directly from the NPM ecosystem</p>
          </div>
          <div>
            <Zap className="mx-auto mb-2 text-yellow-600" size={20} />
            <h4 className="font-semibold mb-1">One-Click Add</h4>
            <p className="text-caption">Add any package from the market directly to your workflow canvas</p>
          </div>
          <div>
            <TrendingUp className="mx-auto mb-2 text-blue-600" size={20} />
            <h4 className="font-semibold mb-1">Live Data</h4>
            <p className="text-caption">Real download stats, GitHub stars, and community ratings</p>
          </div>
        </div>
      </div>

      {/* AI Workflow Advisor */}
      <AIWorkflowAdvisor
        onComponentAdd={(component, type) => {
          if (type === 'npm') {
            addPackageToCanvas(component);
          }
        }}
        onSuggestionApply={(suggestion) => {
          // Clear existing workflow and apply suggestion
          clearCanvas();
          suggestion.steps.forEach(step => {
            if (step.type === 'npm' && step.component) {
              addPackageToCanvas(step.component);
            }
          });
        }}
        selectedComponents={workflowCanvas}
      />
    </div>
  );
};

export default NPMPlayground;