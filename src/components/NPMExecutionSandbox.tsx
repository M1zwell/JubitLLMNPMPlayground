import React, { useState, useEffect, useRef } from 'react';
import { Terminal, Play, Square, RefreshCw, Shield, Cpu, Clock, Database, AlertTriangle, CheckCircle, Code, Package } from 'lucide-react';

interface SandboxEnvironment {
  id: string;
  name: string;
  type: 'browser' | 'worker' | 'iframe' | 'vm';
  description: string;
  features: string[];
  security: 'high' | 'medium' | 'low';
  performance: 'fast' | 'medium' | 'slow';
  limitations: string[];
}

interface ExecutionResult {
  success: boolean;
  output: any;
  error?: string;
  executionTime: number;
  memoryUsage: number;
  sandboxType: string;
  timestamp: number;
}

const SANDBOX_ENVIRONMENTS: SandboxEnvironment[] = [
  {
    id: 'web-worker',
    name: 'Web Worker Sandbox',
    type: 'worker',
    description: 'Isolated worker thread with no DOM access',
    features: ['No DOM access', 'Parallel execution', 'CDN imports', 'Timeout control'],
    security: 'high',
    performance: 'fast',
    limitations: ['No file system', 'Limited APIs', 'No localStorage']
  },
  {
    id: 'iframe-sandbox',
    name: 'Sandboxed iFrame',
    type: 'iframe',
    description: 'Isolated iframe with restricted permissions',
    features: ['DOM isolation', 'Restricted APIs', 'CSP enforcement', 'Resource limits'],
    security: 'high',
    performance: 'medium',
    limitations: ['Limited storage', 'Network restrictions', 'API limitations']
  },
  {
    id: 'vm-context',
    name: 'VM Context (Simulated)',
    type: 'vm',
    description: 'Virtual machine context simulation',
    features: ['Full isolation', 'Custom globals', 'Memory limits', 'Timeout control'],
    security: 'high',
    performance: 'medium',
    limitations: ['Simulated environment', 'Limited packages', 'Basic functionality']
  }
];

interface NPMExecutionSandboxProps {
  packageName: string;
  code: string;
  input: any;
  onExecutionComplete?: (result: ExecutionResult) => void;
  className?: string;
}

const NPMExecutionSandbox: React.FC<NPMExecutionSandboxProps> = ({
  packageName,
  code,
  input,
  onExecutionComplete,
  className = ''
}) => {
  const [selectedSandbox, setSelectedSandbox] = useState<string>('web-worker');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionHistory, setExecutionHistory] = useState<ExecutionResult[]>([]);
  const [consoleOutput, setConsoleOutput] = useState<string[]>([]);
  const [resourceUsage, setResourceUsage] = useState({
    memory: 0,
    cpu: 0,
    time: 0
  });
  const workerRef = useRef<Worker | null>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const consoleRef = useRef<HTMLDivElement>(null);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (workerRef.current) {
        workerRef.current.terminate();
      }
    };
  }, []);

  // Auto-scroll console
  useEffect(() => {
    if (consoleRef.current) {
      consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
    }
  }, [consoleOutput]);

  // Web Worker execution
  const executeInWebWorker = async (): Promise<ExecutionResult> => {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      // Create worker with sandboxed environment
      const workerCode = `
        // Sandbox console
        const sandbox_console = {
          log: (...args) => self.postMessage({type: 'console', level: 'log', message: args.join(' ')}),
          error: (...args) => self.postMessage({type: 'console', level: 'error', message: args.join(' ')}),
          warn: (...args) => self.postMessage({type: 'console', level: 'warn', message: args.join(' ')}),
          info: (...args) => self.postMessage({type: 'console', level: 'info', message: args.join(' ')})
        };

        // Load package dynamically
        self.onmessage = async function(e) {
          const { packageName, code, input } = e.data;
          
          try {
            // Simulate package loading with timeout
            const timeoutPromise = new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Execution timeout')), 10000)
            );
            
            const executionPromise = (async () => {
              let packageModule;
              
              // Mock package implementations for demo
              const mockPackages = {
                'lodash': {
                  map: (arr, fn) => arr.map(fn),
                  filter: (arr, fn) => arr.filter(fn),
                  reduce: (arr, fn, init) => arr.reduce(fn, init),
                  chunk: (arr, size) => {
                    const chunks = [];
                    for (let i = 0; i < arr.length; i += size) {
                      chunks.push(arr.slice(i, i + size));
                    }
                    return chunks;
                  }
                },
                'moment': {
                  format: (date) => new Date(date).toISOString(),
                  add: (date, amount, unit) => new Date(Date.parse(date) + amount * 86400000),
                  diff: (date1, date2) => Date.parse(date1) - Date.parse(date2)
                },
                'axios': {
                  get: async (url) => ({ 
                    data: { message: 'Mock API response', url, status: 200 }, 
                    status: 200,
                    statusText: 'OK'
                  })
                },
                'uuid': {
                  v4: () => 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
                    const r = Math.random() * 16 | 0;
                    const v = c === 'x' ? r : (r & 0x3 | 0x8);
                    return v.toString(16);
                  })
                }
              };
              
              if (mockPackages[packageName]) {
                packageModule = mockPackages[packageName];
              } else {
                // Try to load from CDN
                try {
                  const cdnUrl = \`https://cdn.skypack.dev/\${packageName}\`;
                  packageModule = await import(cdnUrl);
                } catch (error) {
                  packageModule = { process: (input) => input };
                }
              }
              
              // Create execution context
              const context = {
                [packageName]: packageModule,
                _: mockPackages.lodash,
                console: sandbox_console,
                input: input,
                require: (name) => mockPackages[name] || {},
                setTimeout,
                clearTimeout,
                setInterval,
                clearInterval,
                Date,
                Math,
                JSON,
                Array,
                Object,
                String,
                Number,
                Boolean
              };
              
              // Execute user code
              const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
              const userFunction = new AsyncFunction(...Object.keys(context), \`
                "use strict";
                return (async () => {
                  \${code}
                })();
              \`);
              
              const result = await userFunction(...Object.values(context));
              return result;
            })();
            
            const result = await Promise.race([executionPromise, timeoutPromise]);
            
            self.postMessage({
              type: 'result',
              success: true,
              output: result,
              executionTime: Date.now() - ${startTime}
            });
            
          } catch (error) {
            sandbox_console.error('Execution error:', error.message);
            self.postMessage({
              type: 'result',
              success: false,
              error: error.message,
              executionTime: Date.now() - ${startTime}
            });
          }
        };
      `;

      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const worker = new Worker(URL.createObjectURL(blob));
      workerRef.current = worker;

      worker.onmessage = (e) => {
        const { type, success, output, error, executionTime, level, message } = e.data;
        
        if (type === 'console') {
          setConsoleOutput(prev => [...prev, `[${level.toUpperCase()}] ${message}`]);
        } else if (type === 'result') {
          const result: ExecutionResult = {
            success,
            output,
            error,
            executionTime,
            memoryUsage: Math.floor(Math.random() * 50) + 10, // Mock memory usage
            sandboxType: 'web-worker',
            timestamp: Date.now()
          };
          
          worker.terminate();
          resolve(result);
        }
      };

      worker.onerror = (error) => {
        const result: ExecutionResult = {
          success: false,
          output: null,
          error: error.message,
          executionTime: Date.now() - startTime,
          memoryUsage: 0,
          sandboxType: 'web-worker',
          timestamp: Date.now()
        };
        
        worker.terminate();
        resolve(result);
      };

      // Start execution
      worker.postMessage({ packageName, code, input });
    });
  };

  // iFrame execution
  const executeInIFrame = async (): Promise<ExecutionResult> => {
    return new Promise((resolve) => {
      const startTime = Date.now();
      
      const iframeCode = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.skypack.dev;">
        </head>
        <body>
          <script>
            const console = {
              log: (...args) => parent.postMessage({type: 'console', level: 'log', message: args.join(' ')}, '*'),
              error: (...args) => parent.postMessage({type: 'console', level: 'error', message: args.join(' ')}, '*'),
              warn: (...args) => parent.postMessage({type: 'console', level: 'warn', message: args.join(' ')}, '*'),
              info: (...args) => parent.postMessage({type: 'console', level: 'info', message: args.join(' ')}, '*')
            };
            
            window.addEventListener('message', async (e) => {
              if (e.data.type === 'execute') {
                try {
                  const { packageName, code, input } = e.data;
                  
                  // Simple execution for iframe
                  const result = eval(\`
                    (() => {
                      const mockResult = "Executed in iframe sandbox: " + JSON.stringify(input);
                      \${code.includes('return') ? code : 'return ' + JSON.stringify(input)};
                    })()
                  \`);
                  
                  parent.postMessage({
                    type: 'result',
                    success: true,
                    output: result,
                    executionTime: Date.now() - ${startTime}
                  }, '*');
                  
                } catch (error) {
                  console.error('Execution error:', error.message);
                  parent.postMessage({
                    type: 'result',
                    success: false,
                    error: error.message,
                    executionTime: Date.now() - ${startTime}
                  }, '*');
                }
              }
            });
            
            parent.postMessage({type: 'ready'}, '*');
          </script>
        </body>
        </html>
      `;

      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.sandbox.add('allow-scripts');
      iframe.srcdoc = iframeCode;
      
      const messageHandler = (e: MessageEvent) => {
        const { type, success, output, error, executionTime, level, message } = e.data;
        
        if (type === 'console') {
          setConsoleOutput(prev => [...prev, `[${level.toUpperCase()}] ${message}`]);
        } else if (type === 'result') {
          const result: ExecutionResult = {
            success,
            output,
            error,
            executionTime,
            memoryUsage: Math.floor(Math.random() * 30) + 5,
            sandboxType: 'iframe-sandbox',
            timestamp: Date.now()
          };
          
          window.removeEventListener('message', messageHandler);
          document.body.removeChild(iframe);
          resolve(result);
        } else if (type === 'ready') {
          iframe.contentWindow?.postMessage({
            type: 'execute',
            packageName,
            code,
            input
          }, '*');
        }
      };

      window.addEventListener('message', messageHandler);
      document.body.appendChild(iframe);
      iframeRef.current = iframe;
    });
  };

  // VM Context execution (simulated)
  const executeInVMContext = async (): Promise<ExecutionResult> => {
    const startTime = Date.now();
    
    try {
      // Simulate VM execution
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const mockOutput = `VM Context execution of ${packageName}:\nInput: ${JSON.stringify(input)}\nCode: ${code.substring(0, 50)}...\nResult: Processed successfully in isolated context`;
      
      return {
        success: true,
        output: mockOutput,
        executionTime: Date.now() - startTime,
        memoryUsage: Math.floor(Math.random() * 40) + 15,
        sandboxType: 'vm-context',
        timestamp: Date.now()
      };
    } catch (error) {
      return {
        success: false,
        output: null,
        error: error.message,
        executionTime: Date.now() - startTime,
        memoryUsage: 0,
        sandboxType: 'vm-context',
        timestamp: Date.now()
      };
    }
  };

  // Execute in selected sandbox
  const executeCode = async () => {
    setIsExecuting(true);
    setConsoleOutput([`🚀 Starting execution in ${selectedSandbox}...`]);
    
    let result: ExecutionResult;
    
    try {
      switch (selectedSandbox) {
        case 'web-worker':
          result = await executeInWebWorker();
          break;
        case 'iframe-sandbox':
          result = await executeInIFrame();
          break;
        case 'vm-context':
          result = await executeInVMContext();
          break;
        default:
          throw new Error('Unknown sandbox type');
      }
      
      setExecutionHistory(prev => [result, ...prev.slice(0, 9)]); // Keep last 10
      setResourceUsage({
        memory: result.memoryUsage,
        cpu: Math.floor(Math.random() * 30) + 20,
        time: result.executionTime
      });
      
      if (onExecutionComplete) {
        onExecutionComplete(result);
      }
      
    } catch (error) {
      setConsoleOutput(prev => [...prev, `❌ Execution failed: ${error.message}`]);
    } finally {
      setIsExecuting(false);
    }
  };

  const stopExecution = () => {
    if (workerRef.current) {
      workerRef.current.terminate();
      workerRef.current = null;
    }
    
    if (iframeRef.current) {
      document.body.removeChild(iframeRef.current);
      iframeRef.current = null;
    }
    
    setIsExecuting(false);
    setConsoleOutput(prev => [...prev, '🛑 Execution stopped by user']);
  };

  const clearConsole = () => {
    setConsoleOutput([]);
  };

  const getSecurityColor = (level: string) => {
    switch (level) {
      case 'high': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'low': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  const getPerformanceColor = (level: string) => {
    switch (level) {
      case 'fast': return 'text-green-400';
      case 'medium': return 'text-yellow-400';
      case 'slow': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className={`bg-white/90 dark:bg-slate-800/50 backdrop-blur-sm rounded-xl p-6 border border-gray-200 dark:border-gray-200 dark:border-slate-600 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Shield className="text-green-400" />
          NPM Execution Sandbox
        </h3>
        <div className="flex items-center gap-2">
          <Package className="text-blue-400" size={16} />
          <span className="text-sm font-medium">{packageName}</span>
        </div>
      </div>

      {/* Sandbox Selection */}
      <div className="mb-6">
        <h4 className="font-medium mb-3 text-gray-700 dark:text-slate-300">Choose Execution Environment</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {SANDBOX_ENVIRONMENTS.map(env => (
            <div
              key={env.id}
              onClick={() => setSelectedSandbox(env.id)}
              className={`
                cursor-pointer rounded-lg p-4 border transition-all duration-200
                ${selectedSandbox === env.id 
                  ? 'border-blue-400 bg-blue-600/20' 
                  : 'border-gray-200 dark:border-slate-600 bg-slate-700/30 hover:border-slate-500'
                }
              `}
            >
              <div className="flex items-center justify-between mb-2">
                <h5 className="font-medium text-white">{env.name}</h5>
                <div className="flex items-center gap-1">
                  <Shield className={getSecurityColor(env.security)} size={14} />
                  <Cpu className={getPerformanceColor(env.performance)} size={14} />
                </div>
              </div>
              
              <p className="text-xs text-gray-600 dark:text-slate-400 mb-3">{env.description}</p>
              
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1">
                  {env.features.slice(0, 2).map(feature => (
                    <span key={feature} className="bg-blue-600/20 text-blue-300 px-2 py-1 rounded text-xs">
                      {feature}
                    </span>
                  ))}
                </div>
                
                <div className="text-xs">
                  <span className={`font-medium ${getSecurityColor(env.security)}`}>
                    {env.security.toUpperCase()} Security
                  </span>
                  <span className="mx-2">•</span>
                  <span className={`font-medium ${getPerformanceColor(env.performance)}`}>
                    {env.performance.toUpperCase()} Performance
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Execution Controls */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex gap-2">
          <button
            onClick={executeCode}
            disabled={isExecuting}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-2 rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            {isExecuting ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                Executing...
              </>
            ) : (
              <>
                <Play size={16} />
                Execute
              </>
            )}
          </button>
          
          {isExecuting && (
            <button
              onClick={stopExecution}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <Square size={16} />
              Stop
            </button>
          )}
          
          <button
            onClick={clearConsole}
            className="bg-gray-200 dark:bg-slate-600 hover:bg-gray-300 dark:hover:bg-slate-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
          >
            <RefreshCw size={16} />
            Clear
          </button>
        </div>

        {/* Resource Usage */}
        <div className="flex items-center gap-4 text-sm">
          <div className="flex items-center gap-1">
            <Database className="text-blue-400" size={14} />
            <span>{resourceUsage.memory}MB</span>
          </div>
          <div className="flex items-center gap-1">
            <Cpu className="text-green-400" size={14} />
            <span>{resourceUsage.cpu}%</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="text-yellow-400" size={14} />
            <span>{resourceUsage.time}ms</span>
          </div>
        </div>
      </div>

      {/* Console Output */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Terminal className="text-green-400" size={16} />
          <h4 className="font-medium text-gray-700 dark:text-slate-300">Console Output</h4>
        </div>
        <div 
          ref={consoleRef}
          className="bg-gray-50 dark:bg-slate-900/50 rounded-lg p-3 h-40 overflow-y-auto font-mono text-sm border border-gray-200 dark:border-slate-600"
        >
          {consoleOutput.length === 0 ? (
            <div className="text-gray-500 dark:text-slate-500 italic">Console output will appear here...</div>
          ) : (
            consoleOutput.map((line, index) => (
              <div 
                key={index} 
                className={`mb-1 ${
                  line.includes('[ERROR]') ? 'text-red-400' :
                  line.includes('[WARN]') ? 'text-yellow-400' :
                  line.includes('[INFO]') ? 'text-blue-400' :
                  'text-green-400'
                }`}
              >
                {line}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Execution History */}
      {executionHistory.length > 0 && (
        <div>
          <h4 className="font-medium mb-3 text-gray-700 dark:text-slate-300">Execution History</h4>
          <div className="space-y-2 max-h-32 overflow-y-auto">
            {executionHistory.map((result, index) => (
              <div 
                key={index}
                className={`
                  rounded-lg p-3 border text-sm
                  ${result.success 
                    ? 'border-green-600/50 bg-green-600/10' 
                    : 'border-red-600/50 bg-red-600/10'
                  }
                `}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    {result.success ? (
                      <CheckCircle className="text-green-400" size={14} />
                    ) : (
                      <AlertTriangle className="text-red-400" size={14} />
                    )}
                    <span className="font-medium">
                      {result.success ? 'Success' : 'Failed'}
                    </span>
                    <span className="text-gray-600 dark:text-slate-400">•</span>
                    <span className="text-gray-600 dark:text-slate-400">{result.sandboxType}</span>
                  </div>
                  <div className="text-xs text-gray-600 dark:text-slate-400">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </div>
                </div>
                
                <div className="text-xs text-gray-700 dark:text-slate-300 mb-2">
                  {result.success ? (
                    typeof result.output === 'string' 
                      ? result.output.substring(0, 100) + (result.output.length > 100 ? '...' : '')
                      : JSON.stringify(result.output).substring(0, 100) + '...'
                  ) : (
                    result.error
                  )}
                </div>
                
                <div className="flex gap-4 text-xs text-gray-600 dark:text-slate-400">
                  <span>⏱️ {result.executionTime}ms</span>
                  <span>💾 {result.memoryUsage}MB</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default NPMExecutionSandbox;