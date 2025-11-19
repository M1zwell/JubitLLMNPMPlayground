import React, { useState, useEffect, useRef } from 'react';
import _ from 'lodash';
import * as math from 'mathjs';
import Papa from 'papaparse';

// 模拟的 npm 包执行环境
const NPM_PACKAGES = {
  'lodash': {
    description: 'JavaScript utility library',
    example: `// 使用 lodash 处理数组
const numbers = [1, 2, 3, 4, 5];
return _.map(numbers, n => n * 2);`,
    icon: '_',
    color: '#3498db'
  },
  'mathjs': {
    description: 'Math library for JavaScript',
    example: `// 使用 mathjs 进行计算
const matrix = [[1, 2], [3, 4]];
return math.multiply(matrix, 2);`,
    icon: '∑',
    color: '#e74c3c'
  },
  'moment': {
    description: 'Date manipulation library',
    example: `// 使用 moment 处理日期
const now = new Date();
return {
  formatted: now.toLocaleDateString(),
  timestamp: now.getTime()
};`,
    icon: '📅',
    color: '#f39c12'
  },
  'papaparse': {
    description: 'CSV parser',
    example: `// 解析 CSV 数据
const csv = "name,age\\nJohn,30\\nJane,25";
return Papa.parse(csv, { header: true }).data;`,
    icon: '📊',
    color: '#2ecc71'
  }
};

// NPM 命令解释器
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

// Package.json 可视化编辑器
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

// NPM 包执行器
const PackageExecutor = ({ packageName, code, onResult }: any) => {
  const [isRunning, setIsRunning] = useState(false);
  
  const execute = async () => {
    setIsRunning(true);
    try {
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      const packages = { _, math, Papa };
      const fn = new AsyncFunction('_', 'math', 'Papa', code);
      const result = await fn(_, math, Papa);
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
          className="px-3 py-1 bg-green-600 hover:bg-green-700 rounded text-sm disabled:opacity-50"
        >
          {isRunning ? '运行中...' : '▶ 运行'}
        </button>
      </div>
      <pre className="text-xs bg-gray-800 p-2 rounded overflow-auto max-h-32">
        <code>{code}</code>
      </pre>
    </div>
  );
};

export default function NPMSandboxDemo() {
  const [activeTab, setActiveTab] = useState<'terminal' | 'visual' | 'playground'>('terminal');
  const [terminalOutput, setTerminalOutput] = useState<string[]>([
    '欢迎使用 NPM 沙箱环境！',
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
  const [executionResults, setExecutionResults] = useState<any[]>([]);
  const terminalRef = useRef<HTMLDivElement>(null);
  const npmInterpreter = useRef(new NPMInterpreter(setTerminalOutput));
  
  const [packageJson, setPackageJson] = useState({
    name: "llm-playground",
    version: "1.0.0",
    description: "NPM Sandbox for LLM Playground",
    scripts: {
      dev: "vite",
      build: "vite build",
      preview: "vite preview"
    },
    dependencies: {
      "lodash": "^4.17.21",
      "mathjs": "^11.11.0"
    },
    devDependencies: {
      "vite": "^4.0.0"
    }
  });

  // 终端命令处理
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

  // 自动滚动终端
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [terminalOutput]);

  // 处理包执行结果
  const handlePackageResult = (result: any) => {
    setExecutionResults(prev => [...prev, {
      ...result,
      timestamp: new Date().toLocaleTimeString()
    }]);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 text-center bg-gradient-to-r from-green-400 to-blue-500 bg-clip-text text-transparent">
          🎯 NPM 沙箱环境 - 从初学到 LLM Playground
        </h1>

        {/* Tab 导航 */}
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setActiveTab('terminal')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'terminal' 
                ? 'bg-green-600 text-white' 
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            💻 终端模拟器
          </button>
          <button
            onClick={() => setActiveTab('visual')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'visual' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            📊 可视化管理
          </button>
          <button
            onClick={() => setActiveTab('playground')}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              activeTab === 'playground' 
                ? 'bg-teal-600 text-white' 
                : 'bg-gray-700 hover:bg-gray-600'
            }`}
          >
            🧪 包执行器
          </button>
        </div>

        {/* 终端模拟器 */}
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
                    <div key={i} className={line.startsWith('$') ? 'text-green-400' : 'text-gray-300'}>
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
                      className="flex-1 bg-transparent outline-none"
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
                <div className="space-y-1 text-sm">
                  <div><code className="text-yellow-400">npm init</code> - 初始化项目</div>
                  <div><code className="text-yellow-400">npm install</code> - 安装依赖</div>
                  <div><code className="text-yellow-400">npm i lodash</code> - 安装特定包</div>
                  <div><code className="text-yellow-400">npm run dev</code> - 运行脚本</div>
                </div>
              </div>

              <div className="bg-gray-800 rounded-lg p-4">
                <h3 className="font-bold mb-2 text-blue-400">💡 学习要点</h3>
                <ul className="text-sm space-y-1 list-disc list-inside">
                  <li>NPM 是 Node Package Manager</li>
                  <li>package.json 管理项目依赖</li>
                  <li>node_modules 存储安装的包</li>
                  <li>使用 --save-dev 安装开发依赖</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* 可视化管理 */}
        {activeTab === 'visual' && (
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
                    <div className="bg-blue-600 px-4 py-2 rounded-lg font-bold">
                      你的项目
                    </div>
                  </div>
                  
                  <div className="absolute top-1/4 left-1/4">
                    <div className="bg-gray-700 px-3 py-1 rounded text-sm">
                      lodash
                    </div>
                  </div>
                  
                  <div className="absolute top-1/4 right-1/4">
                    <div className="bg-gray-700 px-3 py-1 rounded text-sm">
                      mathjs
                    </div>
                  </div>
                  
                  <div className="absolute bottom-1/4 left-1/3">
                    <div className="bg-gray-600 px-3 py-1 rounded text-sm">
                      vite (dev)
                    </div>
                  </div>
                  
                  {/* 连接线 */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none">
                    <line x1="50%" y1="50%" x2="25%" y2="25%" stroke="#666" strokeWidth="2" />
                    <line x1="50%" y1="50%" x2="75%" y2="25%" stroke="#666" strokeWidth="2" />
                    <line x1="50%" y1="50%" x2="33%" y2="75%" stroke="#666" strokeWidth="2" strokeDasharray="5,5" />
                  </svg>
                </div>
                
                <div className="mt-4 text-sm text-gray-400">
                  <p>实线：生产依赖 (dependencies)</p>
                  <p>虚线：开发依赖 (devDependencies)</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 包执行器 */}
        {activeTab === 'playground' && (
          <div className="grid grid-cols-12 gap-6">
            <div className="col-span-8">
              <div className="space-y-4">
                {Object.entries(NPM_PACKAGES).map(([name, pkg]) => (
                  <PackageExecutor
                    key={name}
                    packageName={name}
                    code={pkg.example}
                    onResult={handlePackageResult}
                  />
                ))}
              </div>
              
              <div className="mt-6 bg-gray-800 rounded-lg p-4">
                <h3 className="font-bold mb-2 text-teal-400">✏️ 自定义代码</h3>
                <textarea
                  className="w-full h-32 bg-gray-700 rounded p-2 text-sm font-mono"
                  placeholder="// 编写你的代码，可以使用 lodash (_), mathjs (math), papaparse (Papa)"
                  defaultValue={`// 组合使用多个包
const numbers = _.range(1, 11);
const squared = _.map(numbers, n => math.pow(n, 2));
const sum = math.sum(squared);
return { numbers, squared, sum };`}
                />
                <button className="mt-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 rounded">
                  运行代码
                </button>
              </div>
            </div>

            <div className="col-span-4">
              <div className="bg-gray-800 rounded-lg p-4 max-h-[600px] overflow-y-auto">
                <h3 className="font-bold mb-2 text-yellow-400 sticky top-0 bg-gray-800 pb-2">
                  📋 执行结果
                </h3>
                
                {executionResults.length === 0 ? (
                  <p className="text-gray-500 text-sm">点击运行按钮查看结果...</p>
                ) : (
                  <div className="space-y-3">
                    {executionResults.map((result, i) => (
                      <div 
                        key={i} 
                        className={`p-3 rounded text-sm ${
                          result.success ? 'bg-green-900' : 'bg-red-900'
                        }`}
                      >
                        <div className="flex justify-between mb-1">
                          <span className="font-bold">{result.package}</span>
                          <span className="text-xs text-gray-400">{result.timestamp}</span>
                        </div>
                        <pre className="overflow-auto">
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

        {/* 底部提示 */}
        <div className="mt-8 bg-gradient-to-r from-blue-900 to-teal-900 rounded-lg p-6">
          <h2 className="text-xl font-bold mb-3">🚀 从 NPM 基础到 LLM Playground</h2>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <h3 className="font-bold mb-1 text-green-400">1. NPM 基础</h3>
              <p>学习包管理、依赖安装和脚本运行</p>
            </div>
            <div>
              <h3 className="font-bold mb-1 text-blue-400">2. 沙箱执行</h3>
              <p>安全地在浏览器中运行 npm 包代码</p>
            </div>
            <div>
              <h3 className="font-bold mb-1 text-teal-400">3. LLM 集成</h3>
              <p>将 npm 包与 AI 模型结合，创建强大工作流</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}