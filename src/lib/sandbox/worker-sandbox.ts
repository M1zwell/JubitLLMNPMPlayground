/**
 * Worker-based sandbox for executing code in a browser environment
 */

/**
 * Options for worker sandbox execution
 */
export interface WorkerSandboxOptions {
  timeout?: number;
  memoryLimit?: number;
  allowedAPIs?: string[];
}

/**
 * Result of worker sandbox execution
 */
export interface WorkerSandboxResult {
  success: boolean;
  output?: any;
  error?: string;
  metrics: {
    executionTime: number;
    memoryUsage?: number;
  };
}

/**
 * Worker-based sandbox for executing JavaScript/TypeScript code
 * in an isolated environment
 */
export class WorkerSandbox {
  private options: WorkerSandboxOptions;
  
  constructor(options: WorkerSandboxOptions = {}) {
    this.options = {
      timeout: 10000, // 10 seconds default timeout
      memoryLimit: 128, // 128 MB default
      allowedAPIs: ['JSON', 'Math', 'Date', 'Array', 'Object', 'String', 'Number', 'Boolean', 'RegExp', 'Error'],
      ...options
    };
  }
  
  /**
   * Execute code in the sandbox
   * @param code JavaScript/TypeScript code to execute
   * @param context Additional context to provide to the code (e.g., input data)
   */
  public async execute(code: string, context: Record<string, any> = {}): Promise<WorkerSandboxResult> {
    if (typeof Worker === 'undefined') {
      return {
        success: false,
        error: 'Web Workers are not supported in this environment',
        metrics: {
          executionTime: 0
        }
      };
    }
    
    const startTime = performance.now();
    
    // Create the worker blob
    const workerBlob = new Blob([this.createWorkerScript(code, context)], { type: 'application/javascript' });
    const workerUrl = URL.createObjectURL(workerBlob);
    const worker = new Worker(workerUrl);
    
    try {
      // Execute code and wait for result
      const result = await this.executeInWorker(worker);
      
      const endTime = performance.now();
      const executionTime = endTime - startTime;
      
      return {
        ...result,
        metrics: {
          ...result.metrics,
          executionTime
        }
      };
    } finally {
      // Clean up
      worker.terminate();
      URL.revokeObjectURL(workerUrl);
    }
  }
  
  /**
   * Create the worker script with sandboxed environment
   */
  private createWorkerScript(code: string, context: Record<string, any>): string {
    // Create a safe JSON representation of the context
    const safeContext = JSON.stringify(context);
    
    // Create the worker script
    return `
      // Sandboxed console
      const sandboxConsole = {
        log: (...args) => self.postMessage({ type: 'log', level: 'log', message: args.map(arg => String(arg)).join(' ') }),
        error: (...args) => self.postMessage({ type: 'log', level: 'error', message: args.map(arg => String(arg)).join(' ') }),
        warn: (...args) => self.postMessage({ type: 'log', level: 'warn', message: args.map(arg => String(arg)).join(' ') }),
        info: (...args) => self.postMessage({ type: 'log', level: 'info', message: args.map(arg => String(arg)).join(' ') })
      };
      
      // Performance tracking
      const startTime = performance.now();
      
      // Execution timeout
      const executionTimeout = setTimeout(() => {
        self.postMessage({
          type: 'result',
          success: false,
          error: 'Execution timed out after ${this.options.timeout}ms',
          metrics: {
            executionTime: ${this.options.timeout}
          }
        });
        
        // Force terminate after timeout
        self.close();
      }, ${this.options.timeout});
      
      try {
        // Parse context
        const context = JSON.parse('${safeContext.replace(/'/g, "\\'")}');
        
        // Create secure execution context with allowed APIs only
        const secureContext = {
          ...context,
          console: sandboxConsole,
          self: undefined,
          window: undefined,
          document: undefined,
          location: undefined,
          localStorage: undefined,
          sessionStorage: undefined,
          navigator: undefined,
          parent: undefined,
          top: undefined
        };
        
        // Allowed APIs from options
        ${this.options.allowedAPIs?.map(api => `secureContext.${api} = ${api};`).join('\n')}
        
        // Create async function to execute code
        const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
        const sandboxFunction = new AsyncFunction(...Object.keys(secureContext),
          \`
            "use strict";
            // Prevent access to the global scope
            const globalThis = undefined;
            const global = undefined;
            const window = undefined;
            const self = undefined;
            const parent = undefined;
            
            try {
              return (async () => {
                ${code}
              })();
            } catch (error) {
              throw new Error("Execution error: " + error.message);
            }
          \`
        );
        
        // Execute code
        Promise.resolve(sandboxFunction(...Object.values(secureContext)))
          .then(result => {
            clearTimeout(executionTimeout);
            const endTime = performance.now();
            
            self.postMessage({
              type: 'result',
              success: true,
              output: result,
              metrics: {
                executionTime: endTime - startTime
              }
            });
          })
          .catch(error => {
            clearTimeout(executionTimeout);
            const endTime = performance.now();
            
            self.postMessage({
              type: 'result',
              success: false,
              error: error.message,
              metrics: {
                executionTime: endTime - startTime
              }
            });
          });
          
      } catch (error) {
        clearTimeout(executionTimeout);
        const endTime = performance.now();
        
        self.postMessage({
          type: 'result',
          success: false,
          error: 'Sandbox initialization error: ' + error.message,
          metrics: {
            executionTime: endTime - startTime
          }
        });
      }
    `;
  }
  
  /**
   * Execute code in a worker and handle messaging
   */
  private executeInWorker(worker: Worker): Promise<WorkerSandboxResult> {
    return new Promise((resolve) => {
      const logs: { level: string; message: string }[] = [];
      
      worker.onmessage = (event) => {
        const { type, level, message, success, output, error, metrics } = event.data;
        
        if (type === 'log') {
          logs.push({ level, message });
          
          // Forward logs to the main console, tagged with [Sandbox]
          switch (level) {
            case 'error': 
              console.error('[Sandbox]', message);
              break;
            case 'warn':
              console.warn('[Sandbox]', message);
              break;
            case 'info':
              console.info('[Sandbox]', message);
              break;
            default:
              console.log('[Sandbox]', message);
          }
        }
        else if (type === 'result') {
          resolve({
            success,
            output,
            error,
            metrics: {
              ...metrics,
              logs
            }
          });
        }
      };
      
      worker.onerror = (event) => {
        resolve({
          success: false,
          error: `Worker error: ${event.message}`,
          metrics: {
            executionTime: 0,
            logs
          }
        });
      };
    });
  }
}