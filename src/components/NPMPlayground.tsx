import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, Copy, Download, Star, Github, Calendar, Package, Code, Terminal, 
  Lightbulb, Zap, CheckCircle, Globe, RefreshCw, Plus, X, ArrowRight, 
  Settings, Save, Upload, Layers, Brain, Target, Users, BarChart3,
  FileText, Image, Database, Mail, Lock, Search, Filter,
  Workflow, Share2, TrendingUp, Award, Clock, DollarSign,
  ShoppingCart, ExternalLink, Cpu, Eye, ArrowLeft
} from 'lucide-react';
import { useNPMPackages } from '../hooks/useNPMPackages';
import { NPMPackage } from '../lib/supabase';
import AIWorkflowAdvisor from './AIWorkflowAdvisor';

// Atomic Function Categories mapping real packages
const ATOMIC_CATEGORIES = {
  all: { name: 'All Atomic Functions', icon: Package, color: 'text-gray-400', count: 0 },
  
  // File Processing Atoms
  'pdf-extraction': { name: 'PDF Extraction', icon: FileText, color: 'text-red-400', count: 0 },
  'image-processing': { name: 'Image Processing', icon: Image, color: 'text-blue-400', count: 0 },
  'excel-manipulation': { name: 'Excel/CSV Handling', icon: BarChart3, color: 'text-green-400', count: 0 },
  'compression': { name: 'File Compression', icon: Package, color: 'text-purple-400', count: 0 },
  
  // Text Processing Atoms
  'text-parsing': { name: 'Text Parsing', icon: FileText, color: 'text-yellow-400', count: 0 },
  'text-analysis': { name: 'Text Analysis', icon: Brain, color: 'text-pink-400', count: 0 },
  'text-cleaning': { name: 'Text Cleaning', icon: Zap, color: 'text-cyan-400', count: 0 },
  
  // Data Transformation Atoms
  'encoding-decoding': { name: 'Encoding/Decoding', icon: Code, color: 'text-indigo-400', count: 0 },
  'encryption-hashing': { name: 'Encryption/Hashing', icon: Lock, color: 'text-orange-400', count: 0 },
  'data-serialization': { name: 'Data Serialization', icon: Database, color: 'text-emerald-400', count: 0 },
  
  // Validation Atoms
  'format-validation': { name: 'Format Validation', icon: CheckCircle, color: 'text-teal-400', count: 0 },
  'data-validation': { name: 'Data Validation', icon: Target, color: 'text-rose-400', count: 0 },
  
  // Network Atoms
  'http-requests': { name: 'HTTP Requests', icon: Globe, color: 'text-blue-500', count: 0 },
  'email-sending': { name: 'Email Sending', icon: Mail, color: 'text-red-500', count: 0 },
  
  // Time Processing Atoms
  'date-processing': { name: 'Date Processing', icon: Calendar, color: 'text-amber-400', count: 0 },
  'scheduling': { name: 'Task Scheduling', icon: Clock, color: 'text-gray-500', count: 0 },
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
  'pdf-lib': {
    atomicFunction: 'PDF Manipulation',
    category: 'pdf-extraction',
    icon: '🔧',
    inputs: ['PDF Buffer', 'Form Data', 'Images'],
    outputs: ['Modified PDF', 'Form Fields'],
    useCase: 'Edit existing PDFs or create new ones',
    example: `const { PDFDocument } = require('pdf-lib');\nconst pdfDoc = await PDFDocument.create();`,
    performance: 'Medium',
    complexity: 'Medium'
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
  'qrcode': {
    atomicFunction: 'QR Code Generation',
    category: 'image-processing',
    icon: '📱',
    inputs: ['Text', 'URL', 'Options'],
    outputs: ['QR Code Image', 'SVG', 'Terminal Output'],
    useCase: 'Create QR codes for URLs, text, or data',
    example: `const QRCode = require('qrcode');\nconst qr = await QRCode.toDataURL('Hello World');`,
    performance: 'Fast',
    complexity: 'Very Low'
  },
  'tesseract.js': {
    atomicFunction: 'Text Recognition',
    category: 'image-processing',
    icon: '👁️',
    inputs: ['Image File', 'Image Buffer', 'Language'],
    outputs: ['Extracted Text', 'Confidence Score'],
    useCase: 'Extract text from images and scanned documents',
    example: `const Tesseract = require('tesseract.js');\nconst { data } = await Tesseract.recognize(image, 'eng');`,
    performance: 'Slow',
    complexity: 'Medium'
  },
  'xlsx': {
    atomicFunction: 'Excel Processing',
    category: 'excel-manipulation',
    icon: '📊',
    inputs: ['Excel File', 'Worksheet Data', 'JSON'],
    outputs: ['JSON Data', 'Excel Buffer', 'CSV'],
    useCase: 'Read/write Excel files and convert to other formats',
    example: `const XLSX = require('xlsx');\nconst workbook = XLSX.readFile('file.xlsx');`,
    performance: 'Fast',
    complexity: 'Medium'
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
  'compromise': {
    atomicFunction: 'NLP Understanding',
    category: 'text-analysis',
    icon: '🧠',
    inputs: ['Text String', 'Document'],
    outputs: ['Parsed NLP Data', 'Entities', 'Sentiment'],
    useCase: 'Extract meaning and entities from natural language',
    example: `const nlp = require('compromise');\nconst doc = nlp('I saw the fox');\nconsole.log(doc.nouns().out());`,
    performance: 'Fast',
    complexity: 'Medium'
  },
  'sentiment': {
    atomicFunction: 'Sentiment Analysis',
    category: 'text-analysis',
    icon: '😊',
    inputs: ['Text String'],
    outputs: ['Sentiment Score', 'Comparative Score'],
    useCase: 'Analyze emotional tone of text',
    example: `const Sentiment = require('sentiment');\nconst result = sentiment.analyze('I love this!');`,
    performance: 'Very Fast',
    complexity: 'Very Low'
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
  'bcrypt': {
    atomicFunction: 'Password Hashing',
    category: 'encryption-hashing',
    icon: '🔐',
    inputs: ['Plain Password', 'Salt Rounds'],
    outputs: ['Hashed Password', 'Comparison Result'],
    useCase: 'Securely hash and verify passwords',
    example: `const bcrypt = require('bcrypt');\nconst hash = await bcrypt.hash(password, 10);`,
    performance: 'Slow (by design)',
    complexity: 'Low'
  },
  'uuid': {
    atomicFunction: 'UUID Generation',
    category: 'encoding-decoding',
    icon: '🆔',
    inputs: ['UUID Version', 'Namespace'],
    outputs: ['UUID String', 'UUID Buffer'],
    useCase: 'Generate unique identifiers',
    example: `const { v4: uuidv4 } = require('uuid');\nconst id = uuidv4();`,
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
  },
  'nodemailer': {
    atomicFunction: 'Email Sending',
    category: 'email-sending',
    icon: '📧',
    inputs: ['Email Config', 'Message Data', 'Attachments'],
    outputs: ['Send Result', 'Message ID'],
    useCase: 'Send emails with SMTP, attachments, HTML content',
    example: `const nodemailer = require('nodemailer');\nconst info = await transporter.sendMail(mailOptions);`,
    performance: 'Medium',
    complexity: 'Medium'
  },
  'multer': {
    atomicFunction: 'File Upload',
    category: 'compression',
    icon: '📤',
    inputs: ['HTTP Request', 'Upload Config'],
    outputs: ['File Objects', 'Field Data'],
    useCase: 'Handle file uploads in web applications',
    example: `const multer = require('multer');\nconst upload = multer({ dest: 'uploads/' });`,
    performance: 'Fast',
    complexity: 'Medium'
  },
  'adm-zip': {
    atomicFunction: 'ZIP Operations',
    category: 'compression',
    icon: '🗜️',
    inputs: ['ZIP File', 'Files to Compress'],
    outputs: ['ZIP Buffer', 'Extracted Files'],
    useCase: 'Create and extract ZIP archives',
    example: `const AdmZip = require('adm-zip');\nconst zip = new AdmZip();\nzip.addLocalFile('file.txt');`,
    performance: 'Fast',
    complexity: 'Low'
  },
  'dayjs': {
    atomicFunction: 'Date Manipulation',
    category: 'date-processing',
    icon: '📅',
    inputs: ['Date String', 'Timestamp', 'Format'],
    outputs: ['Formatted Date', 'Timestamp', 'Relative Time'],
    useCase: 'Parse, validate, manipulate, and display dates',
    example: `const dayjs = require('dayjs');\nconst formatted = dayjs().format('YYYY-MM-DD');`,
    performance: 'Very Fast',
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
      { package: 'multer', step: 'Upload PDF file' },
      { package: 'pdf-parse', step: 'Extract text content' },
      { package: 'compromise', step: 'Understand language structure' },
      { package: 'joi', step: 'Validate extracted data' },
      { package: 'xlsx', step: 'Generate Excel report' }
    ],
    connections: ['multer→pdf-parse', 'pdf-parse→compromise', 'compromise→joi', 'joi→xlsx'],
    realWorldUse: 'Process invoices, contracts, legal documents',
    popularity: 4.8,
    communityRating: 4.9
  },

  'image-optimizer': {
    name: '🖼️ Smart Image Processing Factory',
    description: 'Upload → Resize → Generate QR codes → Compress → Store',
    category: 'Media Processing',
    difficulty: 'Beginner', 
    estimatedTime: '3-5 seconds',
    atoms: [
      { package: 'multer', step: 'Handle image upload' },
      { package: 'sharp', step: 'Resize and optimize' },
      { package: 'qrcode', step: 'Generate tracking QR code' },
      { package: 'adm-zip', step: 'Bundle processed images' }
    ],
    connections: ['multer→sharp', 'sharp→qrcode', 'qrcode→adm-zip'],
    realWorldUse: 'E-commerce product images, social media content',
    popularity: 4.7,
    communityRating: 4.8
  },

  'data-validator': {
    name: '✅ Ultra-Secure Data Validation Chain',
    description: 'Parse CSV → Validate each field → Hash sensitive data → Generate report',
    category: 'Data Security',
    difficulty: 'Intermediate',
    estimatedTime: '8-15 seconds',
    atoms: [
      { package: 'papaparse', step: 'Parse CSV data' },
      { package: 'joi', step: 'Validate data structure' },
      { package: 'validator', step: 'Validate specific fields' },
      { package: 'bcrypt', step: 'Hash sensitive information' },
      { package: 'xlsx', step: 'Generate validation report' }
    ],
    connections: ['papaparse→joi', 'joi→validator', 'validator→bcrypt', 'bcrypt→xlsx'],
    realWorldUse: 'User registration, financial data processing',
    popularity: 4.6,
    communityRating: 4.9
  },

  'notification-system': {
    name: '📧 Smart Notification Engine',
    description: 'Generate unique IDs → Format dates → Send emails → Track delivery',
    category: 'Communication',
    difficulty: 'Intermediate',
    estimatedTime: '10-20 seconds',
    atoms: [
      { package: 'uuid', step: 'Generate tracking IDs' },
      { package: 'dayjs', step: 'Format timestamps' },
      { package: 'nodemailer', step: 'Send email notifications' },
      { package: 'axios', step: 'Track delivery status' }
    ],
    connections: ['uuid→dayjs', 'dayjs→nodemailer', 'nodemailer→axios'],
    realWorldUse: 'Order confirmations, password resets, alerts',
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
    } else if (keywords.includes('encrypt') || keywords.includes('hash')) {
      category = 'encryption-hashing';
      icon = '🔐';
      atomicFunction = 'Security Processing';
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
        packages: ['compromise', 'sentiment'],
        reason: 'PDF text can be analyzed for meaning and sentiment'
      });
    }

    if (lastAtom.atomicInfo.category === 'image-processing') {
      suggestions.push({
        type: 'optimization',
        title: 'Optimize image workflow',
        packages: ['sharp', 'qrcode'],
        reason: 'Add image optimization or QR code generation'
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
      'xlsx': 'Excel file generated with 3 worksheets, 1,250 rows processed',
      'joi': 'Validation passed: 98% of records valid, 23 errors found',
      'bcrypt': '5 passwords hashed successfully with salt rounds: 12',
      'axios': 'HTTP GET request completed: 200 OK, response time: 245ms',
      'qrcode': 'QR code generated: 177x177px, encoding capacity: 2,953 bytes',
      'compromise': 'NLP analysis: 45 nouns, 32 verbs, 18 adjectives identified',
      'sentiment': 'Sentiment score: 0.7 (positive), confidence: 85%',
      'nodemailer': 'Email sent successfully to 3 recipients, message ID: ABC123'
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
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-purple-400 mx-auto mb-4"></div>
          <p className="text-xl text-purple-300">Loading atomic functions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="max-w-[1800px] mx-auto p-6">
        
        {/* Header with Market Integration */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onNavigateToMarket}
              className="flex items-center gap-2 px-4 py-2 bg-green-600/20 hover:bg-green-600/30 rounded-lg transition-colors"
            >
              <ArrowLeft size={16} />
              <ShoppingCart size={16} />
              Browse NPM Market
            </button>
            
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
              🧩 Atomic NPM Playground
            </h1>
            
            <button
              onClick={() => setShowMarketIntegration(!showMarketIntegration)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600/20 hover:bg-blue-600/30 rounded-lg transition-colors"
            >
              <Plus size={16} />
              Add from Market
            </button>
          </div>
          
          <p className="text-xl text-purple-300 mb-2">
            Build powerful workflows by combining atomic function blocks from the NPM ecosystem!
          </p>
          <div className="text-sm text-gray-400 flex items-center justify-center gap-4">
            <span>💎 {atomicPackages.length} Atomic Functions Available</span>
            <span>🏗️ {Object.keys(WORKFLOW_TEMPLATES).length} Proven Templates</span>
            <span>🤖 AI-Powered Suggestions</span>
          </div>
        </div>

        {/* Market Integration Panel */}
        {showMarketIntegration && (
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-8 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <ShoppingCart className="text-green-400" />
                Add Packages from NPM Market
              </h3>
              <button
                onClick={() => setShowMarketIntegration(false)}
                className="p-2 hover:bg-white/10 rounded-lg"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Search atomic functions in market..."
                value={packageSearchTerm}
                onChange={(e) => setPackageSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400"
              />
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-80 overflow-y-auto custom-scrollbar">
              {atomicPackages.slice(0, 12).map(pkg => (
                <div
                  key={pkg.id}
                  onClick={() => addPackageToCanvas(pkg)}
                  className="bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg p-4 cursor-pointer 
              transform hover:scale-105 transition-all duration-200 shadow-lg"
                >
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-2xl">{pkg.atomicInfo.icon}</span>
                    <div className="flex-1">
                      <h4 className="font-bold text-sm">{pkg.name}</h4>
                      <p className="text-xs text-gray-400">{pkg.atomicInfo.atomicFunction}</p>
                    </div>
                  </div>
                  
                  <p className="text-xs text-gray-300 mb-2 line-clamp-2">
                    {pkg.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-green-400">{formatNumber(pkg.weekly_downloads)}/week</span>
                    <span className="flex items-center gap-1">
                      <Star size={10} className="text-yellow-400" />
                      {formatNumber(pkg.github_stars)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Statistics Dashboard */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-purple-400/30">
            <div className="text-2xl font-bold text-green-400">${executionStats.totalCost.toFixed(3)}</div>
            <div className="text-sm opacity-80">Estimated Cost</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-blue-400/30">
            <div className="text-2xl font-bold text-blue-400">{executionStats.estimatedTime}s</div>
            <div className="text-sm opacity-80">Processing Time</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-yellow-400/30">
            <div className="text-2xl font-bold text-yellow-400">{executionStats.complexity}</div>
            <div className="text-sm opacity-80">Complexity</div>
          </div>
          <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4 text-center border border-pink-400/30">
            <div className="text-2xl font-bold text-pink-400">{workflowCanvas.length}</div>
            <div className="text-sm opacity-80">Atomic Blocks</div>
          </div>
        </div>

        <div className="grid grid-cols-12 gap-6">
          
          {/* Left Sidebar: Quick Add & Categories */}
          <div className="col-span-3">
            <div className="sticky top-6">
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Zap className="text-yellow-400" />
                Quick Add Functions
              </h2>

              {/* Popular atomic functions */}
              <div className="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
                {atomicPackages.slice(0, 8).map(pkg => (
                  <div
                    key={pkg.id}
                    onClick={() => addPackageToCanvas(pkg)}
                    className="bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-4 rounded-lg cursor-pointer hover:scale-105 transition-all duration-200 shadow-lg border border-white/20 hover:shadow-xl hover:border-white/40"
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <span className="text-2xl">{pkg.atomicInfo.icon}</span>
                      <div className="flex-1">
                        <h3 className="font-bold text-sm">{pkg.name}</h3>
                        <p className="text-xs opacity-90">{pkg.atomicInfo.atomicFunction}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-xs">
                      <span className="text-green-400">{formatNumber(pkg.weekly_downloads)}</span>
                      <span className="text-yellow-400">{pkg.atomicInfo.performance}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Center: Workflow Canvas */}
          <div className="col-span-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Workflow className="text-blue-400" />
                Workflow Canvas
              </h2>
              
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Name your workflow..."
                  value={workflowName}
                  onChange={(e) => setWorkflowName(e.target.value)}
                  className="px-3 py-1 bg-white/10 border border-white/20 rounded text-sm"
                />
                <button
                  onClick={executeWorkflow}
                  disabled={workflowCanvas.length === 0 || isExecuting}
                  className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 rounded-lg text-sm transition-colors flex items-center gap-2"
                >
                  <Play size={16} />
                  {isExecuting ? 'Running...' : 'Execute'}
                </button>
                <button
                  onClick={clearCanvas}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg text-sm transition-colors"
                >
                  Clear
                </button>
              </div>
            </div>
            
            <div className="bg-gray-900/50 backdrop-blur-sm border-2 border-dashed border-purple-400/50 rounded-lg p-6 min-h-96 relative">
              {workflowCanvas.length === 0 ? (
                <div className="flex items-center justify-center h-full text-purple-300">
                  <div className="text-center">
                    <Layers size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">Start building your atomic workflow</p>
                    <p className="text-sm mt-2">Add atomic functions from the left or browse the NPM market</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {workflowCanvas.map((atom, index) => {
                    const result = executionResults[atom.id];
                    
                    return (
                      <div key={atom.id} className="flex items-center gap-4">
                        <div className="text-sm text-gray-400 w-8">{index + 1}.</div>
                        
                        <div className={`
                          bg-gradient-to-r from-blue-600/20 to-purple-600/20 p-4 rounded-lg flex-1 relative group
                          ${atom.status === 'running' ? 'animate-pulse ring-2 ring-yellow-400' : ''}
                          ${atom.status === 'completed' ? 'ring-2 ring-green-400' : ''}
                        `}>
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-xl">{atom.atomicInfo.icon}</span>
                            <div className="flex-1">
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold">{atom.package}</h4>
                                {atom.packageData && (
                                  <div className="flex items-center gap-1 text-xs">
                                    <Star size={10} className="text-yellow-400" />
                                    <span>{formatNumber(atom.packageData.github_stars)}</span>
                                    <span className="text-green-400 ml-2">{formatNumber(atom.packageData.weekly_downloads)}/week</span>
                                  </div>
                                )}
                              </div>
                              <p className="text-xs opacity-80">{atom.atomicInfo.atomicFunction}</p>
                            </div>
                            <div className="flex items-center gap-2">
                              {atom.status === 'running' && (
                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                              )}
                              {atom.status === 'completed' && (
                                <CheckCircle className="text-green-400" size={16} />
                              )}
                              <button
                                onClick={() => removeAtomFromCanvas(atom.id)}
                                className="opacity-0 group-hover:opacity-100 bg-red-500 rounded-full w-6 h-6 flex items-center justify-center transition-opacity"
                              >
                                <X size={12} />
                              </button>
                            </div>
                          </div>
                          
                          <div className="text-xs text-white/80 mb-2">
                            Input: {atom.atomicInfo.inputs.join(', ')} → Output: {atom.atomicInfo.outputs.join(', ')}
                          </div>
                          
                          {result && (
                            <div className="mt-3 bg-white/20 rounded p-3">
                              <div className="text-xs text-green-300 mb-1">✅ Completed</div>
                              <div className="text-sm font-mono">{result.output}</div>
                              <div className="text-xs text-gray-300 mt-2 flex gap-4">
                                <span>⏱️ {result.metadata.processingTime}ms</span>
                                <span>💾 {result.performance.memoryUsed}</span>
                                <span>⚡ {result.performance.efficiency}</span>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {index < workflowCanvas.length - 1 && (
                          <ArrowRight className="text-purple-400" size={24} />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* AI Suggestions */}
            {aiSuggestions.length > 0 && (
              <div className="mt-6 bg-blue-600/20 border border-blue-400/50 rounded-lg p-4">
                <h3 className="font-bold mb-3 flex items-center gap-2">
                  <Brain className="text-blue-400" />
                  🤖 AI Suggestions
                </h3>
                <div className="space-y-2">
                  {aiSuggestions.map((suggestion, index) => (
                    <div key={index} className="bg-white/10 rounded p-3">
                      <div className="font-medium text-sm">{suggestion.title}</div>
                      <div className="text-xs text-gray-300 mb-2">{suggestion.reason}</div>
                      <div className="flex gap-2">
                        {suggestion.packages.map(pkgName => {
                          const pkg = atomicPackages.find(p => p.name === pkgName);
                          return pkg ? (
                            <button
                              key={pkgName}
                              onClick={() => addPackageToCanvas(pkg)}
                              className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs transition-colors"
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
              <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                <Star className="text-yellow-400" />
                Proven Templates
              </h2>
              
              <div className="space-y-4 max-h-96 overflow-y-auto custom-scrollbar">
                {Object.entries(WORKFLOW_TEMPLATES).map(([key, template]) => (
                  <div key={key} className="bg-white/10 backdrop-blur-sm rounded-lg p-4 border border-white/20 hover:border-white/40 transition-colors">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-sm">{template.name}</h3>
                      <div className="flex items-center gap-1 text-xs">
                        <Star className="text-yellow-400" size={12} />
                        <span>{template.popularity}</span>
                      </div>
                    </div>
                    
                    <p className="text-xs text-gray-300 mb-3">{template.description}</p>
                    
                    <div className="space-y-2 mb-3">
                      <div className="text-xs text-purple-300">💼 {template.realWorldUse}</div>
                      <div className="text-xs text-green-300">⏱️ {template.estimatedTime}</div>
                      <div className="text-xs text-blue-300">📊 {template.difficulty}</div>
                    </div>
                    
                    <button
                      onClick={() => loadTemplate(key)}
                      className="w-full bg-purple-600 hover:bg-purple-700 px-3 py-2 rounded text-sm transition-colors"
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
        <div className="mt-12 bg-gradient-to-r from-green-600/20 to-blue-600/20 rounded-xl p-6 border border-green-400/30">
          <h3 className="text-xl font-bold mb-4 text-center flex items-center justify-center gap-2">
            <Globe className="text-green-400" />
            🔗 Seamlessly Connected to NPM Market
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
            <div>
              <ShoppingCart className="mx-auto mb-2 text-green-400" size={24} />
              <h4 className="font-bold mb-2">Browse & Discover</h4>
              <p className="text-sm text-gray-300">Explore {atomicPackages.length}+ atomic functions directly from the NPM ecosystem</p>
            </div>
            <div>
              <Zap className="mx-auto mb-2 text-yellow-400" size={24} />
              <h4 className="font-bold mb-2">One-Click Add</h4>
              <p className="text-sm text-gray-300">Add any package from the market directly to your workflow canvas</p>
            </div>
            <div>
              <TrendingUp className="mx-auto mb-2 text-blue-400" size={24} />
              <h4 className="font-bold mb-2">Live Data</h4>
              <p className="text-sm text-gray-300">Real download stats, GitHub stars, and community ratings</p>
            </div>
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

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(147, 51, 234, 0.5);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: rgba(147, 51, 234, 0.7);
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default NPMPlayground;