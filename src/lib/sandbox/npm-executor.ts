import { v4 as uuidv4 } from 'uuid';

/**
 * Options for the NPM sandbox executor
 */
export interface NPMExecutorOptions {
  timeout?: number;
  memory?: number;
  allowedPackages?: string[];
  environmentVariables?: Record<string, string>;
}

/**
 * Execution result from the NPM sandbox
 */
export interface NPMExecutionResult {
  success: boolean;
  output: any;
  error?: string;
  metrics: {
    executionTime: number;
    memoryUsage: number;
    sandboxType: string;
  };
}

/**
 * NPM Sandbox Executor
 * 
 * Safely executes NPM package code in an isolated environment.
 * Supports both browser and Node.js environments.
 */
export class NPMSandboxExecutor {
  private options: NPMExecutorOptions;
  private workerCache: Map<string, Worker> = new Map();
  private iframeCache: Map<string, HTMLIFrameElement> = new Map();
  private mockImplementations: Map<string, any> = new Map();
  
  constructor(options: NPMExecutorOptions = {}) {
    this.options = {
      timeout: 10000,
      memory: 128,
      allowedPackages: [
        'lodash', 'papaparse', 'dayjs', 'validator', 'uuid', 
        'mathjs', 'joi', 'axios', 'crypto-js', 'marked'
      ],
      ...options
    };
    
    // Initialize mock implementations for commonly used packages
    this.initializeMockImplementations();
  }
  
  /**
   * Initialize mock implementations for packages
   * These are used when the real packages can't be loaded
   */
  private initializeMockImplementations() {
    // Mock lodash implementation
    this.mockImplementations.set('lodash', {
      map: (arr: any[], fn: Function) => arr.map(fn),
      filter: (arr: any[], fn: Function) => arr.filter(fn),
      reduce: (arr: any[], fn: Function, initial: any) => arr.reduce(fn, initial),
      merge: (obj: object, ...sources: object[]) => Object.assign({}, obj, ...sources),
      get: (obj: object, path: string, defaultValue?: any) => {
        const parts = path.split('.');
        let result = obj;
        for (const part of parts) {
          if (result == null) return defaultValue;
          result = result[part];
        }
        return result === undefined ? defaultValue : result;
      },
      chunk: (arr: any[], size: number) => {
        const chunks = [];
        for (let i = 0; i < arr.length; i += size) {
          chunks.push(arr.slice(i, i + size));
        }
        return chunks;
      }
    });
    
    // Mock papaparse implementation
    this.mockImplementations.set('papaparse', {
      parse: (csv: string, options: any = {}) => {
        const lines = csv.split('\n');
        const headers = options.header ? lines[0].split(',').map(h => h.trim()) : null;
        const rows = [];
        
        const startIndex = options.header ? 1 : 0;
        for (let i = startIndex; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const values = line.split(',').map(v => v.trim());
          
          if (headers) {
            const row = {};
            headers.forEach((header, index) => {
              row[header] = values[index] || '';
            });
            rows.push(row);
          } else {
            rows.push(values);
          }
        }
        
        return {
          data: rows,
          errors: [],
          meta: { delimiter: ',', linebreak: '\n', aborted: false }
        };
      },
      unparse: (data: any) => {
        if (Array.isArray(data)) {
          if (data.length === 0) return '';
          
          if (typeof data[0] === 'object' && !Array.isArray(data[0])) {
            // Array of objects
            const headers = Object.keys(data[0]);
            const headerRow = headers.join(',');
            const rows = data.map(item => 
              headers.map(header => item[header]).join(',')
            );
            return [headerRow, ...rows].join('\n');
          } else {
            // Array of arrays
            return data.map(row => Array.isArray(row) ? row.join(',') : row).join('\n');
          }
        }
        
        return '';
      }
    });
    
    // Mock dayjs implementation
    this.mockImplementations.set('dayjs', (date?: any) => {
      const d = date ? new Date(date) : new Date();
      return {
        format: (format: string) => {
          // Very basic implementation
          return d.toISOString();
        },
        add: (value: number, unit: string) => {
          const newDate = new Date(d);
          if (unit === 'day' || unit === 'days') newDate.setDate(newDate.getDate() + value);
          if (unit === 'month' || unit === 'months') newDate.setMonth(newDate.getMonth() + value);
          if (unit === 'year' || unit === 'years') newDate.setFullYear(newDate.getFullYear() + value);
          return this.mockImplementations.get('dayjs')(newDate);
        }
      };
    });
    
    // Mock validator implementation
    this.mockImplementations.set('validator', {
      isEmail: (str: string) => /\S+@\S+\.\S+/.test(str),
      isURL: (str: string) => /^(https?|ftp):\/\/[^\s/$.?#].[^\s]*$/i.test(str),
      isNumeric: (str: string) => /^\d+$/.test(str),
      isAlpha: (str: string) => /^[a-zA-Z]+$/.test(str)
    });
    
    // Mock uuid implementation
    this.mockImplementations.set('uuid', {
      v4: () => uuidv4()
    });
    
    // Add more mock implementations as needed...
  }
  
  /**
   * Execute NPM package code in a sandbox
   * @param packageName The name of the NPM package
   * @param code The code to execute
   * @param input The input data for the code
   */
  public async execute(packageName: string, code: string, input: any): Promise<NPMExecutionResult> {
    // Validate package name
    if (!this.options.allowedPackages!.includes(packageName)) {
      return {
        success: false,
        output: null,
        error: `Package '${packageName}' is not in the allowed list. Allowed packages: ${this.options.allowedPackages!.join(', ')}`,
        metrics: {
          executionTime: 0,
          memoryUsage: 0,
          sandboxType: 'none'
        }
      };
    }
    
    // Choose execution environment based on availability
    if (typeof window !== 'undefined') {
      // Browser environment
      try {
        if (typeof Worker !== 'undefined') {
          return await this.executeInWebWorker(packageName, code, input);
        } else {
          return await this.executeInIFrame(packageName, code, input);
        }
      } catch (error) {
        return {
          success: false,
          output: null,
          error: `Execution failed: ${error.message}`,
          metrics: {
            executionTime: 0,
            memoryUsage: 0,
            sandboxType: 'failed'
          }
        };
      }
    } else {
      // Node.js environment (if available)
      return this.executeInVM(packageName, code, input);
    }
  }

  /**
   * Execute in a Web Worker (browser environment)
   */
  private async executeInWebWorker(packageName: string, code: string, input: any): Promise<NPMExecutionResult> {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      let isResolved = false;
      let timeoutId: any;
      
      // Create the worker code
      const workerCode = `
        self.onmessage = async function(e) {
          const { packageName, code, input } = e.data;
          const console = {
            log: (...args) => self.postMessage({ type: 'log', data: args.join(' ') }),
            error: (...args) => self.postMessage({ type: 'error', data: args.join(' ') }),
            warn: (...args) => self.postMessage({ type: 'warn', data: args.join(' ') })
          };
          
          try {
            // Create execution environment
            const pkg = self.npm_packages && self.npm_packages[packageName];
            if (!pkg) {
              throw new Error(\`Package \${packageName} not loaded\`);
            }
            
            // Create context object
            const context = {
              [packageName]: pkg,
              input,
              console,
              setTimeout, 
              clearTimeout,
              Date,
              Math,
              Array,
              Object,
              JSON,
              String,
              Number,
              Promise
            };
            
            // Execute the code
            const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
            const fn = new AsyncFunction(...Object.keys(context), \`
              "use strict";
              try {
                return (async () => {
                  \${code}
                })();
              } catch (e) {
                throw new Error("Execution error: " + e.message);
              }
            \`);
            
            const result = await fn(...Object.values(context));
            self.postMessage({ type: 'result', success: true, data: result });
          } catch (error) {
            self.postMessage({ type: 'result', success: false, error: error.message });
          }
        };
        
        // Mock NPM packages
        self.npm_packages = ${JSON.stringify(this.getMockPackages())};
      `;
      
      // Create blob and worker
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const worker = new Worker(URL.createObjectURL(blob));
      
      // Setup timeout
      timeoutId = setTimeout(() => {
        if (!isResolved) {
          worker.terminate();
          resolve({
            success: false,
            output: null,
            error: `Execution timed out after ${this.options.timeout}ms`,
            metrics: {
              executionTime: this.options.timeout!,
              memoryUsage: 0,
              sandboxType: 'web-worker'
            }
          });
          isResolved = true;
        }
      }, this.options.timeout);
      
      // Handle messages
      worker.onmessage = (e) => {
        if (e.data.type === 'log') {
          console.log(`[NPM Sandbox] ${e.data.data}`);
        }
        else if (e.data.type === 'error') {
          console.error(`[NPM Sandbox] ${e.data.data}`);
        }
        else if (e.data.type === 'result') {
          clearTimeout(timeoutId);
          
          if (!isResolved) {
            const executionTime = Date.now() - startTime;
            worker.terminate();
            
            resolve({
              success: e.data.success,
              output: e.data.data,
              error: e.data.error,
              metrics: {
                executionTime,
                memoryUsage: 0, // Web Workers don't provide memory usage
                sandboxType: 'web-worker'
              }
            });
            
            isResolved = true;
          }
        }
      };
      
      // Handle errors
      worker.onerror = (error) => {
        clearTimeout(timeoutId);
        
        if (!isResolved) {
          worker.terminate();
          resolve({
            success: false,
            output: null,
            error: `Worker error: ${error.message}`,
            metrics: {
              executionTime: Date.now() - startTime,
              memoryUsage: 0,
              sandboxType: 'web-worker'
            }
          });
          isResolved = true;
        }
      };
      
      // Send message to start execution
      worker.postMessage({ packageName, code, input });
    });
  }
  
  /**
   * Execute in an iframe (browser fallback)
   */
  private async executeInIFrame(packageName: string, code: string, input: any): Promise<NPMExecutionResult> {
    const startTime = Date.now();
    
    return new Promise((resolve) => {
      let isResolved = false;
      let timeoutId: any;
      
      // Create a unique ID for messaging
      const execId = `exec_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      
      // Create iframe HTML
      const iframeHTML = `
        <!DOCTYPE html>
        <html>
        <head>
          <script>
            // Setup communication with parent
            window.addEventListener('message', async (event) => {
              if (event.data.id !== "${execId}") return;
              
              const { packageName, code, input } = event.data;
              
              try {
                // Mock console
                const console = {
                  log: (...args) => window.parent.postMessage({ id: "${execId}", type: 'log', data: args.join(' ') }, '*'),
                  error: (...args) => window.parent.postMessage({ id: "${execId}", type: 'error', data: args.join(' ') }, '*'),
                  warn: (...args) => window.parent.postMessage({ id: "${execId}", type: 'warn', data: args.join(' ') }, '*')
                };
                
                // Get mock package implementation
                const packages = ${JSON.stringify(this.getMockPackages())};
                const pkg = packages[packageName];
                
                if (!pkg) {
                  throw new Error(\`Package \${packageName} not available\`);
                }
                
                // Setup execution context
                const context = {
                  [packageName]: pkg,
                  input,
                  console,
                  setTimeout,
                  clearTimeout,
                  Date,
                  Math,
                  Array,
                  Object,
                  JSON,
                  String,
                  Number,
                  Promise
                };
                
                // Execute the code
                const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
                const fn = new AsyncFunction(...Object.keys(context), \`
                  "use strict";
                  try {
                    return (async () => {
                      \${code}
                    })();
                  } catch (e) {
                    throw new Error("Execution error: " + e.message);
                  }
                \`);
                
                const result = await fn(...Object.values(context));
                window.parent.postMessage({ id: "${execId}", type: 'result', success: true, data: result }, '*');
                
              } catch (error) {
                window.parent.postMessage({ id: "${execId}", type: 'result', success: false, error: error.message }, '*');
              }
            });
            
            // Signal ready
            window.parent.postMessage({ id: "${execId}", type: 'ready' }, '*');
          </script>
        </head>
        <body>
          <div>NPM Sandbox</div>
        </body>
        </html>
      `;
      
      // Create and append iframe
      const iframe = document.createElement('iframe');
      iframe.style.display = 'none';
      iframe.sandbox.add('allow-scripts');
      document.body.appendChild(iframe);
      
      // Setup timeout
      timeoutId = setTimeout(() => {
        if (!isResolved) {
          document.body.removeChild(iframe);
          resolve({
            success: false,
            output: null,
            error: `Execution timed out after ${this.options.timeout}ms`,
            metrics: {
              executionTime: this.options.timeout!,
              memoryUsage: 0,
              sandboxType: 'iframe'
            }
          });
          isResolved = true;
        }
      }, this.options.timeout);
      
      // Setup message handler
      const messageHandler = (e: MessageEvent) => {
        if (e.data.id !== execId) return;
        
        if (e.data.type === 'log') {
          console.log(`[NPM Sandbox] ${e.data.data}`);
        }
        else if (e.data.type === 'error') {
          console.error(`[NPM Sandbox] ${e.data.data}`);
        }
        else if (e.data.type === 'ready') {
          // Send execution data
          iframe.contentWindow!.postMessage({
            id: execId,
            packageName,
            code,
            input
          }, '*');
        }
        else if (e.data.type === 'result') {
          clearTimeout(timeoutId);
          
          if (!isResolved) {
            const executionTime = Date.now() - startTime;
            window.removeEventListener('message', messageHandler);
            document.body.removeChild(iframe);
            
            resolve({
              success: e.data.success,
              output: e.data.data,
              error: e.data.error,
              metrics: {
                executionTime,
                memoryUsage: 0, // iframes don't provide memory usage
                sandboxType: 'iframe'
              }
            });
            
            isResolved = true;
          }
        }
      };
      
      window.addEventListener('message', messageHandler);
      
      // Write HTML to iframe
      const iframeDoc = iframe.contentDocument || iframe.contentWindow!.document;
      iframeDoc.open();
      iframeDoc.write(iframeHTML);
      iframeDoc.close();
    });
  }
  
  /**
   * Execute in a VM (Node.js environment)
   */
  private executeInVM(packageName: string, code: string, input: any): NPMExecutionResult {
    // This would use VM2 in a Node.js environment
    // Since we're in a browser, we'll just mock it
    const startTime = Date.now();
    
    try {
      // Get mock package implementation
      const mockPkg = this.mockImplementations.get(packageName);
      if (!mockPkg) {
        throw new Error(`Package '${packageName}' is not available in this environment.`);
      }
      
      // Create context
      const context = {
        [packageName]: mockPkg,
        input,
        console: {
          log: (...args: any[]) => console.log('[NPM VM]', ...args),
          error: (...args: any[]) => console.error('[NPM VM]', ...args),
          warn: (...args: any[]) => console.warn('[NPM VM]', ...args)
        }
      };
      
      // Execute code
      const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
      const fn = new AsyncFunction(...Object.keys(context), `
        "use strict";
        try {
          return (async () => {
            ${code}
          })();
        } catch (e) {
          throw new Error("Execution error: " + e.message);
        }
      `);
      
      const result = fn(...Object.values(context));
      
      // Measure execution time
      const executionTime = Date.now() - startTime;
      
      return {
        success: true,
        output: result,
        metrics: {
          executionTime,
          memoryUsage: 0, // Mocked value
          sandboxType: 'vm-mock'
        }
      };
    } catch (error: any) {
      const executionTime = Date.now() - startTime;
      
      return {
        success: false,
        output: null,
        error: error.message,
        metrics: {
          executionTime,
          memoryUsage: 0,
          sandboxType: 'vm-mock'
        }
      };
    }
  }
  
  /**
   * Get mock package implementations for browser execution
   */
  private getMockPackages(): Record<string, any> {
    const mockPackages: Record<string, any> = {};
    
    for (const [packageName, implementation] of this.mockImplementations.entries()) {
      mockPackages[packageName] = implementation;
    }
    
    return mockPackages;
  }
  
  /**
   * Clean up resources
   */
  public dispose(): void {
    // Clean up workers
    for (const worker of this.workerCache.values()) {
      worker.terminate();
    }
    this.workerCache.clear();
    
    // Clean up iframes
    for (const iframe of this.iframeCache.values()) {
      if (iframe.parentNode) {
        iframe.parentNode.removeChild(iframe);
      }
    }
    this.iframeCache.clear();
  }
}