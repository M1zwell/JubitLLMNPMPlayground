import React, { useState, useEffect, useRef, useCallback } from 'react';
import { 
  Play, Copy, Star, Github, Calendar, Package, Code, Terminal,
  Lightbulb, Zap, CheckCircle, Globe, RefreshCw, Plus, X, ArrowRight, 
  Settings, Save, Upload, Layers, Brain, Target, Users, BarChart3,
  FileText, Image, Database, Mail, Lock, Search as SearchIcon, Filter,
  Workflow, Share2, TrendingUp, Award, Clock, DollarSign, ArrowLeft,
  ShoppingCart, ExternalLink, Cpu, Eye
} from 'lucide-react';
import { useNPMPackages } from '../hooks/useNPMPackages';
import { NPMPackage } from '../lib/supabase';
import AIWorkflowAdvisor from './AIWorkflowAdvisor';
import _ from 'lodash';
import * as math from 'mathjs';
import Papa from 'papaparse';

// NPM Packages for Sandbox Environment
const NPM_PACKAGES = {
  'lodash': {
    description: 'JavaScript utility library',
    example: `// 使用 lodash 处理数组和对象
const users = [
  { name: 'John', age: 30, active: true },
  { name: 'Jane', age: 25, active: false },
  { name: 'Mike', age: 35, active: true }
];

// 获取所有活跃用户的名字
const activeNames = _.chain(users)
  .filter('active')
  .map('name')
  .value();

// 根据年龄分组
const byAge = _.groupBy(users, user => 
  user.age < 30 ? 'younger' : 'older'
);

return { activeNames, byAge };`,
    icon: '_',
    color: '#3498db'
  },
  'mathjs': {
    description: 'Math library for JavaScript',
    example: `// 使用 mathjs 进行复杂计算
// 创建矩阵
const matrix1 = math.matrix([[1, 2], [3, 4]]);
const matrix2 = math.matrix([[5, 6], [7, 8]]);

// 矩阵运算
const addition = math.add(matrix1, matrix2);
const multiplication = math.multiply(matrix1, matrix2);

// 统计功能
const numbers = [2, 4, 6, 8, 10];
const stats = {
  mean: math.mean(numbers),
  std: math.std(numbers),
  median: math.median(numbers)
};

// 求解方程
const eq = math.evaluate('x^2 + 4x - 5 = 0');
const roots = math.solve(eq, 'x');

return { 
  matrices: { 
    addition: addition.toArray(), 
    multiplication: multiplication.toArray() 
  },
  stats,
  equation: { roots }
};`,
    icon: '∑',
    color: '#e74c3c'
  },
  'papaparse': {
    description: 'CSV parser',
    example: `// 使用 PapaParse 处理 CSV 数据
const csvString = \`name,age,city
John,30,New York
Jane,25,San Francisco
Mike,35,Chicago
Sarah,28,Boston\`;

// 解析 CSV 为 JSON
const result = Papa.parse(csvString, {
  header: true,
  dynamicTyping: true
});

// 基础分析
const ageSum = result.data.reduce((sum, row) => sum + row.age, 0);
const avgAge = ageSum / result.data.length;

// 按城市分组
const byCity = {};
result.data.forEach(row => {
  if (!byCity[row.city]) byCity[row.city] = [];
  byCity[row.city].push(row);
});

return {
  parsedData: result.data,
  statistics: {
    count: result.data.length,
    avgAge
  },
  byCity
};`,
    icon: '📊',
    color: '#2ecc71'
  },
  'validator': {
    description: 'String validation library',
    example: `// 使用 validator 验证各种格式
// 模拟数据
const inputs = {
  email: 'test@example.com',
  url: 'https://example.com',
  phone: '(123) 456-7890',
  creditCard: '4111111111111111',
  postalCode: '10001',
  alphanumeric: 'abc123'
};

// 验证结果
const validations = {
  isEmail: validator.isEmail(inputs.email),
  isURL: validator.isURL(inputs.url),
  isCreditCard: validator.isCreditCard(inputs.creditCard),
  isPostalCode: validator.isPostalCode(inputs.postalCode, 'US'),
  isAlphanumeric: validator.isAlphanumeric(inputs.alphanumeric)
};

// 净化处理
const sanitized = {
  email: validator.normalizeEmail(inputs.email),
  html: validator.escape('<script>alert("XSS")</script>'),
  trim: validator.trim('  test  ')
};

return { inputs, validations, sanitized };`,
    icon: '✓',
    color: '#9b59b6'
  }
};

// Atomic Function Categories for Playground
const ATOMIC_CATEGORIES = {
  'all-packages': { name: 'All Atomic Functions', icon: Package, color: 'text-gray-500', count: 0 },
  
  // File Processing Atoms
  'pdf-extraction': { name: 'PDF Extraction', icon: FileText, color: 'text-red-600', count: 0 },
  'image-processing': { name: 'Image Processing', icon: Image, color: 'text-blue-600', count: 0 },
  'excel-manipulation': { name: 'Excel/CSV Handling', icon: BarChart3, color: 'text-green-600', count: 0 },
  
  // Text Processing Atoms
  'text-parsing': { name: 'Text Parsing', icon: FileText, color: 'text-yellow-600', count: 0 },
  'text-analysis': { name: 'Text Analysis', icon: Brain, color: 'text-pink-600', count: 0 },
  
  // Data Transformation Atoms
  'data-serialization': { name: 'Data Serialization', icon: Database, color: 'text-emerald-600', count: 0 },
  
  // Validation Atoms
  'data-validation': { name: 'Data Validation', icon: CheckCircle, color: 'text-teal-600', count: 0 },
  
  // Network Atoms
  'http-requests': { name: 'HTTP Requests', icon: Globe, color: 'text-blue-600', count: 0 },
};

// Map real packages to atomic functions
const ATOMIC_FUNCTION_MAPPING = {
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
  'validator': {
    atomicFunction: 'String Validation',
    category: 'data-validation',
    icon: '🔍',
    inputs: ['String Value', 'Validation Rules'],
    outputs: ['Boolean Result', 'Sanitized String'],
    useCase: 'Validate emails, URLs, credit cards, etc.',
    example: `const validator = require('validator');\nconst isEmail = validator.isEmail('test@example.com');`,
    performance: 'Very Fast',
    complexity: 'Very Low'
  },
  'lodash': {
    atomicFunction: 'Data Transformation',
    category: 'data-serialization',
    icon: '⚙️',
    inputs: ['Array/Object Data', 'Transformation Config'],
    outputs: ['Transformed Data'],
    useCase: 'Process, filter, and transform data collections',
    example: `const _ = require('lodash');\nconst result = _.groupBy(data, 'category');`,
    performance: 'Fast',
    complexity: 'Medium'
  },
  'mathjs': {
    atomicFunction: 'Mathematical Computing',
    category: 'text-analysis',
    icon: '🧮',
    inputs: ['Numeric Data', 'Expressions', 'Matrices'],
    outputs: ['Calculation Results', 'Solved Equations'],
    useCase: 'Complex math operations and statistical analysis',
    example: `const math = require('mathjs');\nconst result = math.evaluate('2x + 3y = 10');`,
    performance: 'Fast',
    complexity: 'Medium'
  }
};

// NPM command interpreter for the terminal
class NPMInterpreter {
  private output: string[] = [];
  private currentDir = '~/playground';
  
  constructor(private setOutput: (output: string[]) => void) {}
  
  async execute(command: string): Promise<void> {
    const parts = command.trim().split(' ');
    const [cmd, ...args] = parts;
    
    this.output.push(`$ ${command}`);
    
    switch(cmd) {
      case 'npm':
        await this.handleNpm(args);
        break;
      case 'cd':
        this.handleCd(args[0]);
        break;
      case 'ls':
        this.handleLs();
        break;
      case 'pwd':
        this.output.push(this.currentDir);
        break;
      case 'clear':
        this.output = [];
        break;
      default:
        this.output.push(`Command not found: ${cmd}`);
    }
    
    this.setOutput([...this.output]);
  }
  
  private async handleNpm(args: string[]) {
    const [subCmd, ...subArgs] = args;
    
    switch(subCmd) {
      case 'init':
        this.output.push('Creating package.json...');
        await this.delay(500);
        this.output.push('✓ package.json created');
        break;
        
      case 'install':
      case 'i':
        if (subArgs.length === 0) {
          this.output.push('Installing dependencies from package.json...');
          await this.delay(1000);
          this.output.push('✓ 37 packages installed');
        } else {
          const pkg = subArgs[0];
          this.output.push(`Installing ${pkg}...`);
          await this.delay(800);
          this.output.push(`✓ ${pkg} installed`);
        }
        break;
        
      case 'run':
        const script = subArgs[0];
        if (script === 'dev') {
          this.output.push('Starting development server...');
          await this.delay(1000);
          this.output.push('Server running at http://localhost:3000');
        } else {
          this.output.push(`Running script: ${script}`);
        }
        break;
        
      case 'create':
        this.output.push('Creating new project...');
        await this.delay(1500);
        this.output.push('✓ Project created successfully');
        break;
        
      default:
        this.output.push(`Unknown npm command: ${subCmd}`);
    }
  }
  
  private handleCd(path: string) {
    if (!path || path === '~') {
      this.currentDir = '~/playground';
    } else if (path === '..') {
      const parts = this.currentDir.split('/');
      parts.pop();
      this.currentDir = parts.join('/') || '/';
    } else {
      this.currentDir = `${this.currentDir}/${path}`;
    }
    this.output.push(`Changed directory to: ${this.currentDir}`);
  }
  
  private handleLs() {
    this.output.push('node_modules/');
    this.output.push('src/');
    this.output.push('package.json');
    this.output.push('package-lock.json');
  }
  
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Package.json editor component for visualizing and editing package.json
const PackageJsonEditor = ({ packageJson, onChange }: any) => {
  return (
    <div className="bg-gray-800 rounded-lg p-4">
      <h3 className="text-lg font-bold mb-2 text-green-400">📦 package.json</h3>
      <pre className="text-sm overflow-auto">
        <code>{JSON.stringify(packageJson, null, 2)}</code>
      </pre>
    </div>
  );
};

// NPM package executor for running package code
const PackageExecutor = ({ packageName, code, onResult }: any) => {
  const [isRunning, setIsRunning] = useState(false);
  
  const execute = async () => {
    setIsRunning(true);
    try {
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      const packages: any = { _: _, math: math, Papa: Papa };
      
      // Mock validator package
      packages.validator = {
        isEmail: (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email),
        isURL: (url: string) => /^https?:\/\//.test(url),
        isCreditCard: (cc: string) => /^\d{16}$/.test(cc),
        isPostalCode: (code: string) => /^\d{5}(-\d{4})?$/.test(code),
        isAlphanumeric: (str: string) => /^[a-zA-Z0-9]+$/.test(str),
        escape: (html: string) => html.replace(/[<>]/g, c => c === '<' ? '&lt;' : '&gt;'),
        normalizeEmail: (email: string) => email.toLowerCase(),
        trim: (str: string) => str.trim()
      };
      
      const fn = new AsyncFunction('_', 'math', 'Papa', 'validator', code);
      const result = await fn(_, math, Papa, packages.validator);
      onResult({
        success: true,
        result,
        package: packageName
      });
    } catch (error: any) {
      onResult({
        success: false,
        error: error.message,
        package: packageName
      });
    } finally {
      setIsRunning(false);
    }
  };
  
  return (
    <div className="bg-gray-700 rounded-lg p-4">
      <div className="flex justify-between items-center mb-2">
        <h4 className="font-bold text-sm">{packageName}</h4>
        <button
          onClick={execute}
          disabled={isRunning}
          className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm text-white disabled:opacity-50 flex items-center gap-1"
        >
          {isRunning ? (
            <>
              <div className="animate-spin h-3 w-3 border-2 border-white border-t-transparent rounded-full"></div>
              <span>运行中...</span>
            </>
          ) : (
            <>
              <Play size={12} />
              运行
            </>
          )}
        </button>
      </div>
      <pre className="text-xs bg-gray-800 p-2 rounded overflow-auto max-h-40">
        <code className="text-gray-200">{code}</code>
      </pre>
    </div>
  );
};

// Workflow template for the playground
interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  atoms: { package: string; step: string }[];
  difficulty: string;
  estimatedTime: string;
}

// Workflow templates
const WORKFLOW_TEMPLATES: Record<string, WorkflowTemplate> = {
  'data-processor': {
    id: 'data-processor',
    name: '📊 数据处理管道',
    description: '使用多个包处理和转换数据',
    atoms: [
      { package: 'papaparse', step: '解析CSV数据' },
      { package: 'lodash', step: '转换和过滤数据' },
      { package: 'mathjs', step: '执行统计分析' }
    ],
    difficulty: '初级',
    estimatedTime: '5-10分钟'
  },
  'validation-chain': {
    id: 'validation-chain',
    name: '✅ 数据验证链',
    description: '验证和清理用户输入',
    atoms: [
      { package: 'validator', step: '验证输入格式' },
      { package: 'lodash', step: '清理和标准化数据' }
    ],
    difficulty: '初级',
    estimatedTime: '3-5分钟'
  }
};

// Main Component
const NPMIntegratedPlayground: React.FC<{ onNavigateToMarket?: () => void; initialPackage?: NPMPackage }> = ({ 
  onNavigateToMarket, 
  initialPackage
}) => {
  // Navigation state
  const [activeTab, setActiveTab] = useState<'playground' | 'sandbox' | 'terminal'>('playground');
  const [showMarketIntegration, setShowMarketIntegration] = useState(false);
  
  // Playground state
  const [workflowCanvas, setWorkflowCanvas] = useState<any[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [executionResults, setExecutionResults] = useState<Record<string, any>>({});
  const [isExecuting, setIsExecuting] = useState(false);
  
  // Sandbox state
  const [packageSearchTerm, setPackageSearchTerm] = useState('');
  const [sandboxMode, setSandboxMode] = useState<'visual' | 'playground' | 'terminal'>('playground');
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    '欢迎使用 NPM 终端！',
    '尝试以下命令：',
    '  npm init - 初始化项目',
    '  npm install <package> - 安装包',
    '  npm run dev - 运行开发服务器',
    '  cd <directory> - 切换目录',
    '  ls - 列出文件',
    ''
  ]);
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [currentCommand, setCurrentCommand] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [sandboxResults, setSandboxResults] = useState<any[]>([]);
  const [customCode, setCustomCode] = useState(`// 组合使用多个包
const numbers = _.range(1, 11);
const squared = _.map(numbers, n => math.pow(n, 2));
const sum = math.sum(squared);
return { numbers, squared, sum };`);
  
  // Refs
  const terminalRef = useRef<HTMLDivElement>(null);
  const npmInterpreter = useRef(new NPMInterpreter(setTerminalOutput));
  
  // Package json state
  const [packageJson, setPackageJson] = useState({
    name: "npm-playground",
    version: "1.0.0",
    description: "NPM Playground for LLM integration",
    scripts: {
      dev: "vite",
      build: "vite build",
      preview: "vite preview"
    },
    dependencies: {
      "lodash": "^4.17.21",
      "mathjs": "^14.3.0",
      "papaparse": "^5.4.1",
      "validator": "^13.11.0"
    },
    devDependencies: {
      "vite": "^5.0.0",
      "typescript": "^5.2.2"
    }
  });
  
  // Fetch packages from the market
  const { packages: marketPackages, loading: marketLoading } = useNPMPackages({
    search: packageSearchTerm,
    sortBy: 'github_stars',
    sortDesc: true,
    limit: 20
  });
  
  // Filter packages for atomic functions
  const atomicPackages = marketPackages.filter(pkg => 
    ATOMIC_FUNCTION_MAPPING[pkg.name] || 
    pkg.keywords.some(k => [
      'parse', 'extract', 'convert', 'validate', 'transform', 'calculate', 'format'
    ].includes(k.toLowerCase()))
  ).map(pkg => ({
    ...pkg,
    atomicInfo: ATOMIC_FUNCTION_MAPPING[pkg.name] || generateAtomicInfo(pkg)
  }));
  
  // Add initial package to canvas if provided
  useEffect(() => {
    if (initialPackage && !workflowCanvas.find(atom => atom.package === initialPackage.name)) {
      addPackageToCanvas(initialPackage);
    }
  }, [initialPackage]);
  
  // Auto-scroll terminal
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalOutput]);
  
  // Generate atomic info for packages not in mapping
  const generateAtomicInfo = (pkg: NPMPackage) => {
    const keywords = pkg.keywords.join(' ').toLowerCase();
    const description = (pkg.description || 'NPM package').toLowerCase();
    
    let category = 'data-serialization';
    let icon = '📦';
    let atomicFunction = 'Data Processing';
    
    if (keywords.includes('csv') || keywords.includes('excel') || description.includes('csv')) {
      category = 'excel-manipulation';
      icon = '📊';
      atomicFunction = 'Spreadsheet Processing';
    } else if (keywords.includes('valid') || description.includes('valid')) {
      category = 'data-validation';
      icon = '✅';
      atomicFunction = 'Data Validation';
    } else if (keywords.includes('http') || keywords.includes('request')) {
      category = 'http-requests';
      icon = '🌐';
      atomicFunction = 'Network Request';
    } else if (keywords.includes('parse') || description.includes('parser')) {
      category = 'text-parsing';
      icon = '📝';
      atomicFunction = 'Text Parser';
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
  
  // Add package to workflow canvas
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
    setShowMarketIntegration(false);
  };
  
  // Remove atom from canvas
  const removeAtomFromCanvas = (atomId: string) => {
    setWorkflowCanvas(prev => prev.filter(atom => atom.id !== atomId));
  };
  
  // Load workflow template
  const loadTemplate = (templateId: string) => {
    const template = WORKFLOW_TEMPLATES[templateId];
    if (!template) return;
    
    const atoms = template.atoms.map((atom, index) => {
      const pkg = marketPackages.find(p => p.name === atom.package) || 
                  { name: atom.package, keywords: [], description: '' };
      const atomicInfo = ATOMIC_FUNCTION_MAPPING[atom.package] || generateAtomicInfo(pkg);
      
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
    setSelectedTemplate(templateId);
  };
  
  // Execute workflow
  const executeWorkflow = async () => {
    if (workflowCanvas.length === 0) return;

    setIsExecuting(true);
    const results: Record<string, any> = {};

    for (let i = 0; i < workflowCanvas.length; i++) {
      const atom = workflowCanvas[i];

      // Update status to running
      setWorkflowCanvas(prev => prev.map(c => 
        c.id === atom.id ? { ...c, status: 'running' } : c
      ));
      
      // Simulate processing time
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Generate mock result
      let result;
      switch(atom.package) {
        case 'lodash':
          result = '✅ Lodash 数据处理完成：\n• 输入: [数组/对象]\n• 操作: 分组, 过滤, 映射\n• 输出: 处理后的数据结构';
          break;
        case 'mathjs':
          result = '✅ MathJS 计算完成：\n• 矩阵运算完成\n• 统计分析完成\n• 解方程: 2个解';
          break;
        case 'papaparse':
          result = '✅ CSV 解析完成：\n• 解析: 4行数据\n• 列数: 3\n• 格式: 结构化JSON';
          break;
        case 'validator':
          result = '✅ 验证完成：\n• 验证通过: 5项\n• 验证失败: 1项\n• 已净化字段: 2';
          break;
        default:
          result = `✅ ${atom.package} 处理完成`;
      }
      
      results[atom.id] = result;
      setExecutionResults(prev => ({ ...prev, [atom.id]: result }));

      // Update status to completed
      setWorkflowCanvas(prev => prev.map(c => 
        c.id === atom.id ? { ...c, status: 'completed' } : c
      ));
    }
    
    setIsExecuting(false);
  };
  
  // Clear the workflow canvas
  const clearCanvas = () => {
    setWorkflowCanvas([]);
    setExecutionResults({});
    setSelectedTemplate(null);
  };
  
  // Terminal command handling
  const handleCommand = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && currentCommand.trim()) {
      setCommandHistory(prev => [...prev, currentCommand]);
      setHistoryIndex(-1);
      await npmInterpreter.current.execute(currentCommand);
      setCurrentCommand('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setCurrentCommand(commandHistory[commandHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        setHistoryIndex(-1);
        setCurrentCommand('');
      }
    }
  };
  
  // Execute custom code
  const executeCustomCode = () => {
    if (!customCode.trim()) return;
    
    const packageExecutor = {
      packageName: 'custom',
      code: customCode,
      onResult: (result: any) => {
        setSandboxResults(prev => [{
          ...result,
          timestamp: new Date().toLocaleTimeString()
        }, ...prev]);
      }
    };
    
    PackageExecutor(packageExecutor).execute();
  };
  
  // Format number utility
  const formatNumber = (num: number | null | undefined): string => {
    if (num === null || num === undefined || isNaN(num)) return '0';
    
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  return (
    <div className="space-y-6">
      {/* Header with tabs */}
      <div className="text-center">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onNavigateToMarket}
            className="btn-minimal btn-secondary"
          >
            <ArrowLeft size={14} />
            <ShoppingCart size={14} />
            返回 NPM 市场
          </button>
          
          <h1 className="text-heading-lg">
            NPM Playground
          </h1>
          
          <button
            onClick={() => setShowMarketIntegration(!showMarketIntegration)}
            className="btn-minimal btn-primary"
          >
            <Plus size={14} />
            添加 NPM 包
          </button>
        </div>
        
        <div className="flex justify-center space-x-2 mb-4">
          <button
            onClick={() => setActiveTab('playground')}
            className={`btn-minimal ${activeTab === 'playground' ? 'btn-primary' : 'btn-ghost'}`}
          >
            <Workflow size={16} className="mr-1" />
            工作流编排
          </button>
          <button
            onClick={() => setActiveTab('sandbox')}
            className={`btn-minimal ${activeTab === 'sandbox' ? 'btn-primary' : 'btn-ghost'}`}
          >
            <Code size={16} className="mr-1" />
            代码执行器
          </button>
          <button
            onClick={() => setActiveTab('terminal')}
            className={`btn-minimal ${activeTab === 'terminal' ? 'btn-primary' : 'btn-ghost'}`}
          >
            <Terminal size={16} className="mr-1" />
            NPM 终端
          </button>
        </div>
      </div>

      {/* Market Integration Panel */}
      {showMarketIntegration && (
        <div className="card-minimal">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-subheading flex items-center gap-2">
              <ShoppingCart className="text-green-600" size={16} />
              添加 NPM 包到工作区
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
              placeholder="搜索 NPM 包..."
              value={packageSearchTerm}
              onChange={(e) => setPackageSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm"
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-h-80 overflow-y-auto">
            {marketLoading ? (
              <div className="col-span-full text-center py-4">
                <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full mx-auto"></div>
                <p className="mt-2 text-sm text-gray-500">加载包中...</p>
              </div>
            ) : atomicPackages.length > 0 ? (
              atomicPackages.slice(0, 12).map(pkg => (
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
              ))
            ) : (
              <div className="col-span-full text-center py-4">
                <p className="text-gray-500">没有找到匹配的包</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Main Content Area based on active tab */}
      {activeTab === 'playground' && (
        <div className="grid grid-cols-12 gap-6">
          {/* Left: Templates & Tools */}
          <div className="col-span-3">
            <div className="sticky top-6">
              <h2 className="text-lg font-medium mb-3 flex items-center gap-2">
                <Star className="text-yellow-600" size={16} />
                预设工作流
              </h2>
              
              <div className="space-y-4 max-h-96 overflow-y-auto">
                {Object.entries(WORKFLOW_TEMPLATES).map(([key, template]) => (
                  <div 
                    key={key} 
                    className={`card-minimal hover:border-yellow-600 transition-colors ${
                      selectedTemplate === key ? 'border-yellow-600 bg-yellow-50 dark:bg-yellow-900/20' : ''
                    }`}
                    onClick={() => loadTemplate(key)}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-medium text-sm">{template.name}</h3>
                    </div>
                    
                    <p className="text-caption text-gray-600 dark:text-gray-300 mb-3">{template.description}</p>
                    
                    <div className="space-y-1 mb-3">
                      <div className="text-xs text-purple-600 flex items-center gap-1">
                        <Clock size={10} />
                        {template.estimatedTime}
                      </div>
                      <div className="text-xs text-blue-600 flex items-center gap-1">
                        <Target size={10} />
                        {template.difficulty}
                      </div>
                      <div className="text-xs text-green-600 flex items-center gap-1">
                        <Layers size={10} />
                        {template.atoms.length} 组件
                      </div>
                    </div>
                    
                    <button
                      className="w-full btn-minimal btn-primary text-sm"
                    >
                      使用模板
                    </button>
                  </div>
                ))}
              </div>
              
              <h2 className="text-lg font-medium mt-6 mb-3 flex items-center gap-2">
                <Brain className="text-purple-600" size={16} />
                AI 建议
              </h2>
              
              <div className="card-minimal bg-purple-50 dark:bg-purple-900/20 border-purple-200 dark:border-purple-800">
                <h3 className="font-medium text-sm mb-2">推荐组合</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-600" />
                    <span>CSV解析 → 数据验证 → 数学计算</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-purple-600" />
                    <span>HTTP请求 → 数据转换 → 验证</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Center: Workflow Canvas */}
          <div className="col-span-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium flex items-center gap-2">
                <Workflow className="text-blue-600" size={16} />
                工作流画布
              </h2>
              
              <div className="flex gap-2">
                <button
                  onClick={executeWorkflow}
                  disabled={workflowCanvas.length === 0 || isExecuting}
                  className="btn-minimal btn-primary"
                >
                  {isExecuting ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></div>
                      执行中...
                    </>
                  ) : (
                    <>
                      <Play size={14} />
                      执行工作流
                    </>
                  )}
                </button>
                
                <button
                  onClick={clearCanvas}
                  disabled={workflowCanvas.length === 0}
                  className="btn-minimal btn-secondary"
                >
                  清空
                </button>
              </div>
            </div>
            
            <div className="card-minimal border-dashed min-h-64">
              {workflowCanvas.length === 0 ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <Layers size={32} className="mx-auto mb-2 opacity-50" />
                    <p className="text-subheading mb-1">开始构建您的原子工作流</p>
                    <p className="text-body-sm">从左侧添加预设模板或右侧浏览 NPM 包</p>
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
                            输入: {atom.atomicInfo.inputs.join(', ')} → 输出: {atom.atomicInfo.outputs.join(', ')}
                          </div>
                          
                          {result && (
                            <div className="mt-2 bg-gray-50 dark:bg-gray-800 rounded p-3">
                              <div className="text-xs text-green-600 mb-1">✅ 完成</div>
                              <div className="text-sm font-mono whitespace-pre-wrap">{result}</div>
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
          </div>

          {/* Right: Available Atomic Functions */}
          <div className="col-span-3">
            <div className="sticky top-6">
              <h2 className="text-lg font-medium mb-3 flex items-center gap-2">
                <Package className="text-green-600" size={16} />
                可用原子函数
              </h2>
              <div className="space-y-2 max-h-80 overflow-y-auto">
                {Object.entries(NPM_PACKAGES).map(([name, pkg]) => (
                  <div
                    key={name}
                    onClick={() => {
                      const mockPackage = {
                        id: `${name}-${Date.now()}`,
                        name: name,
                        description: pkg.description,
                        keywords: [name],
                        weekly_downloads: 1000000,
                        github_stars: 10000
                      } as any;
                      addPackageToCanvas(mockPackage);
                    }}
                    className="card-minimal cursor-pointer hover:shadow-md transition-all duration-200"
                  >
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xl" style={{ color: pkg.color }}>{pkg.icon}</span>
                      <div className="flex-1">
                        <h3 className="font-medium text-sm">{name}</h3>
                        <p className="text-caption">{pkg.description}</p>
                      </div>
                    </div>
                    
                    <div className="flex justify-between text-xs">
                      <span className="text-green-600">高性能</span>
                      <span className="text-yellow-600">低复杂度</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {activeTab === 'sandbox' && (
        <div className="space-y-6">
          {/* Sandbox Mode Selector */}
          <div className="flex justify-center space-x-2 mb-4">
            <button
              onClick={() => setSandboxMode('playground')}
              className={`btn-minimal ${sandboxMode === 'playground' ? 'btn-primary' : 'btn-ghost'}`}
            >
              <Code size={16} className="mr-1" />
              代码执行器
            </button>
            <button
              onClick={() => setSandboxMode('visual')}
              className={`btn-minimal ${sandboxMode === 'visual' ? 'btn-primary' : 'btn-ghost'}`}
            >
              <Settings size={16} className="mr-1" />
              包管理器
            </button>
            <button
              onClick={() => setSandboxMode('terminal')}
              className={`btn-minimal ${sandboxMode === 'terminal' ? 'btn-primary' : 'btn-ghost'}`}
            >
              <Terminal size={16} className="mr-1" />
              NPM 终端
            </button>
          </div>
          
          {/* Sandbox Content based on mode */}
          {sandboxMode === 'playground' && (
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-8">
                <div className="space-y-4">
                  {/* Package Executors */}
                  {Object.entries(NPM_PACKAGES).map(([name, pkg]) => (
                    <PackageExecutor
                      key={name}
                      packageName={name}
                      code={pkg.example}
                      onResult={(result: any) => {
                        setSandboxResults(prev => [{
                          ...result,
                          timestamp: new Date().toLocaleTimeString()
                        }, ...prev]);
                      }}
                    />
                  ))}
                </div>
                
                <div className="mt-6 bg-gray-800 rounded-lg p-4">
                  <h3 className="font-bold mb-2 text-purple-400">✏️ 自定义代码</h3>
                  <textarea
                    className="w-full h-40 bg-gray-700 rounded p-2 text-sm font-mono text-gray-200"
                    placeholder="// 编写你的代码，可以使用 lodash (_), mathjs (math), papaparse (Papa), validator"
                    value={customCode}
                    onChange={(e) => setCustomCode(e.target.value)}
                  />
                  <button 
                    onClick={executeCustomCode}
                    className="mt-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 rounded text-white"
                  >
                    <Play size={14} className="inline mr-1" />
                    运行代码
                  </button>
                </div>
              </div>

              <div className="col-span-4">
                <div className="bg-gray-800 rounded-lg p-4 max-h-[600px] overflow-y-auto">
                  <h3 className="font-bold mb-2 text-yellow-400 sticky top-0 bg-gray-800 pb-2">
                    📋 执行结果
                  </h3>
                  
                  {sandboxResults.length === 0 ? (
                    <p className="text-gray-500 text-sm">点击运行按钮查看结果...</p>
                  ) : (
                    <div className="space-y-3">
                      {sandboxResults.map((result, i) => (
                        <div 
                          key={i} 
                          className={`p-3 rounded text-sm ${
                            result.success ? 'bg-green-900/30 border border-green-700' : 'bg-red-900/30 border border-red-700'
                          }`}
                        >
                          <div className="flex justify-between mb-1">
                            <span className="font-bold">{result.package}</span>
                            <span className="text-xs text-gray-400">{result.timestamp}</span>
                          </div>
                          <pre className="overflow-auto text-xs">
                            {result.success 
                              ? JSON.stringify(result.result, null, 2)
                              : `Error: ${result.error}`
                            }
                          </pre>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
          
          {sandboxMode === 'visual' && (
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-6">
                <PackageJsonEditor 
                  packageJson={packageJson} 
                  onChange={setPackageJson}
                />
                
                <div className="mt-4 bg-gray-800 rounded-lg p-4">
                  <h3 className="font-bold mb-2 text-blue-400">📦 已安装的包</h3>
                  <div className="grid grid-cols-2 gap-2">
                    {Object.entries(NPM_PACKAGES).map(([name, pkg]) => (
                      <div 
                        key={name}
                        className="flex items-center p-2 bg-gray-700 rounded hover:bg-gray-600 transition-colors"
                      >
                        <span 
                          className="text-2xl mr-2"
                          style={{ color: pkg.color }}
                        >
                          {pkg.icon}
                        </span>
                        <div>
                          <div className="font-medium text-sm">{name}</div>
                          <div className="text-xs text-gray-400">{pkg.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="col-span-6">
                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="font-bold mb-4 text-green-400">🔗 依赖关系图</h3>
                  <div className="relative h-64">
                    {/* 简化的依赖关系可视化 */}
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="bg-blue-600 px-4 py-2 rounded-lg font-bold text-white">
                        npm-playground
                      </div>
                    </div>
                    
                    <div className="absolute top-1/4 left-1/4">
                      <div className="bg-gray-700 px-3 py-1 rounded text-sm text-white">
                        lodash
                      </div>
                    </div>
                    
                    <div className="absolute top-1/4 right-1/4">
                      <div className="bg-gray-700 px-3 py-1 rounded text-sm text-white">
                        mathjs
                      </div>
                    </div>
                    
                    <div className="absolute bottom-1/3 left-1/3">
                      <div className="bg-gray-700 px-3 py-1 rounded text-sm text-white">
                        papaparse
                      </div>
                    </div>
                    
                    <div className="absolute bottom-1/3 right-1/3">
                      <div className="bg-gray-700 px-3 py-1 rounded text-sm text-white">
                        validator
                      </div>
                    </div>
                    
                    <div className="absolute bottom-1/5 left-1/2 transform -translate-x-1/2">
                      <div className="bg-gray-600 px-3 py-1 rounded text-sm text-white">
                        vite (dev)
                      </div>
                    </div>
                    
                    {/* 连接线 */}
                    <svg className="absolute inset-0 w-full h-full pointer-events-none">
                      <line x1="50%" y1="50%" x2="25%" y2="25%" stroke="#666" strokeWidth="2" />
                      <line x1="50%" y1="50%" x2="75%" y2="25%" stroke="#666" strokeWidth="2" />
                      <line x1="50%" y1="50%" x2="33%" y2="67%" stroke="#666" strokeWidth="2" />
                      <line x1="50%" y1="50%" x2="67%" y2="67%" stroke="#666" strokeWidth="2" />
                      <line x1="50%" y1="50%" x2="50%" y2="80%" stroke="#666" strokeWidth="2" strokeDasharray="5,5" />
                    </svg>
                  </div>
                  
                  <div className="mt-4 text-sm text-gray-400">
                    <p>实线：生产依赖 (dependencies)</p>
                    <p>虚线：开发依赖 (devDependencies)</p>
                  </div>
                </div>
                
                <div className="bg-gray-800 rounded-lg p-4 mt-4">
                  <h3 className="font-bold mb-2 text-purple-400">🚀 NPM 命令</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <button className="bg-purple-600 hover:bg-purple-700 text-white rounded p-2 text-sm flex items-center justify-center">
                      <RefreshCw size={14} className="mr-1" />
                      npm install
                    </button>
                    <button className="bg-green-600 hover:bg-green-700 text-white rounded p-2 text-sm flex items-center justify-center">
                      <Play size={14} className="mr-1" />
                      npm run dev
                    </button>
                    <button className="bg-blue-600 hover:bg-blue-700 text-white rounded p-2 text-sm flex items-center justify-center">
                      <Plus size={14} className="mr-1" />
                      添加依赖
                    </button>
                    <button className="bg-yellow-600 hover:bg-yellow-700 text-white rounded p-2 text-sm flex items-center justify-center">
                      <Code size={14} className="mr-1" />
                      更新依赖
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          {sandboxMode === 'terminal' && (
            <div className="grid grid-cols-12 gap-6">
              <div className="col-span-8">
                <div className="bg-black rounded-lg p-4 font-mono text-sm">
                  <div className="flex items-center mb-2">
                    <div className="flex space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    </div>
                    <div className="ml-4 text-gray-400">NPM Terminal</div>
                  </div>
                  
                  <div 
                    ref={terminalRef}
                    className="h-96 overflow-y-auto pr-2"
                    style={{ scrollbarWidth: 'thin' }}
                  >
                    {terminalOutput.map((line, i) => (
                      <div key={i} className={`
                        ${line.startsWith('$') ? 'text-green-400' : 
                          line.includes('✓') ? 'text-green-300' : 
                          line.startsWith('Error') ? 'text-red-400' : 
                          'text-gray-300'}
                      `}>
                        {line}
                      </div>
                    ))}
                    
                    <div className="flex items-center mt-2">
                      <span className="text-green-400 mr-2">$</span>
                      <input
                        type="text"
                        value={currentCommand}
                        onChange={(e) => setCurrentCommand(e.target.value)}
                        onKeyDown={handleCommand}
                        className="flex-1 bg-transparent outline-none text-white"
                        placeholder="输入 npm 命令..."
                        autoFocus
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-span-4">
                <div className="bg-gray-800 rounded-lg p-4 mb-4">
                  <h3 className="font-bold mb-2 text-green-400">📚 NPM 基础命令</h3>
                  <div className="space-y-1 text-sm text-gray-300">
                    <div><code className="text-yellow-400">npm init</code> - 初始化项目</div>
                    <div><code className="text-yellow-400">npm install</code> - 安装依赖</div>
                    <div><code className="text-yellow-400">npm i lodash</code> - 安装特定包</div>
                    <div><code className="text-yellow-400">npm run dev</code> - 运行脚本</div>
                    <div><code className="text-yellow-400">npm update</code> - 更新依赖</div>
                    <div><code className="text-yellow-400">npm ls</code> - 列出依赖</div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg p-4">
                  <h3 className="font-bold mb-2 text-blue-400">💡 使用提示</h3>
                  <ul className="text-sm space-y-1 list-disc list-inside text-gray-300">
                    <li>终端支持上下箭头查看命令历史</li>
                    <li>使用 clear 命令清空终端</li>
                    <li>尝试使用 cd 命令导航目录</li>
                    <li>结合其他功能选项卡使用更高效</li>
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'terminal' && (
        <div className="grid grid-cols-12 gap-6">
          <div className="col-span-8">
            <div className="bg-black rounded-lg p-4 font-mono text-sm">
              <div className="flex items-center mb-2">
                <div className="flex space-x-2">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                </div>
                <div className="ml-4 text-gray-400">NPM Terminal</div>
              </div>
              
              <div 
                ref={terminalRef}
                className="h-96 overflow-y-auto pr-2"
                style={{ scrollbarWidth: 'thin' }}
              >
                {terminalOutput.map((line, i) => (
                  <div key={i} className={`
                    ${line.startsWith('$') ? 'text-green-400' : 
                      line.includes('✓') ? 'text-green-300' : 
                      line.startsWith('Error') ? 'text-red-400' : 
                      'text-gray-300'}
                  `}>
                    {line}
                  </div>
                ))}
                
                <div className="flex items-center mt-2">
                  <span className="text-green-400 mr-2">$</span>
                  <input
                    type="text"
                    value={currentCommand}
                    onChange={(e) => setCurrentCommand(e.target.value)}
                    onKeyDown={handleCommand}
                    className="flex-1 bg-transparent outline-none text-white"
                    placeholder="输入 npm 命令..."
                    autoFocus
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="col-span-4">
            <div className="bg-gray-800 rounded-lg p-4 mb-4">
              <h3 className="font-bold mb-2 text-green-400">📚 NPM 基础命令</h3>
              <div className="space-y-1 text-sm text-gray-300">
                <div><code className="text-yellow-400">npm init</code> - 初始化项目</div>
                <div><code className="text-yellow-400">npm install</code> - 安装依赖</div>
                <div><code className="text-yellow-400">npm i lodash</code> - 安装特定包</div>
                <div><code className="text-yellow-400">npm run dev</code> - 运行脚本</div>
                <div><code className="text-yellow-400">npm update</code> - 更新依赖</div>
                <div><code className="text-yellow-400">npm ls</code> - 列出依赖</div>
              </div>
            </div>

            <div className="bg-gray-800 rounded-lg p-4">
              <h3 className="font-bold mb-2 text-blue-400">💡 学习要点</h3>
              <ul className="text-sm space-y-1 list-disc list-inside text-gray-300">
                <li>NPM 是 Node Package Manager</li>
                <li>package.json 管理项目依赖</li>
                <li>node_modules 存储安装的包</li>
                <li>使用 --save-dev 安装开发依赖</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Integration Notice */}
      <div className="card-minimal bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-800">
        <h3 className="text-subheading mb-4 text-center flex items-center justify-center gap-2">
          <Globe className="text-green-600" />
          集成式 NPM 开发环境
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-center">
          <div>
            <Workflow className="mx-auto mb-2 text-blue-600" size={20} />
            <h4 className="font-semibold mb-1">工作流编排</h4>
            <p className="text-caption">通过拖放组合NPM包创建数据处理工作流</p>
          </div>
          <div>
            <Code className="mx-auto mb-2 text-purple-600" size={20} />
            <h4 className="font-semibold mb-1">代码执行</h4>
            <p className="text-caption">在安全沙箱中直接运行NPM包代码</p>
          </div>
          <div>
            <Terminal className="mx-auto mb-2 text-green-600" size={20} />
            <h4 className="font-semibold mb-1">包管理终端</h4>
            <p className="text-caption">模拟NPM命令行体验，学习包管理</p>
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

export default NPMIntegratedPlayground;