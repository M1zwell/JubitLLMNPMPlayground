import { LLMModel, NPMPackage } from '../supabase';
import { NPMSandboxExecutor } from '../sandbox/npm-executor';
import { LLMProviderFactory } from '../adapters/llm-provider';
import { EventEmitter } from 'events';

// Component types
export type ComponentType = 'llm' | 'npm' | 'input' | 'output';

// Node in a workflow
export interface WorkflowNode {
  id: string;
  type: ComponentType;
  data: any; // Component-specific data
  config: any; // User configuration
  position?: { x: number; y: number };
  status: 'ready' | 'running' | 'completed' | 'error';
}

// Connection between nodes
export interface Connection {
  source: string;
  target: string;
}

// Complete workflow definition
export interface Workflow {
  id?: string;
  name: string;
  description?: string;
  nodes: WorkflowNode[];
  connections: Connection[];
  createdBy?: string;
  isPublic?: boolean;
}

// Execution result for a single node
export interface NodeExecutionResult {
  nodeId: string;
  output: any;
  error?: string;
  metrics: {
    startTime: number;
    endTime: number;
    executionTime: number;
    memoryUsage: number;
    cost?: number;
    tokensUsed?: number;
  };
}

// Complete execution result for a workflow
export interface WorkflowExecutionResult {
  workflowId?: string;
  status: 'completed' | 'failed' | 'partial';
  results: Record<string, NodeExecutionResult>;
  startTime: number;
  endTime: number;
  executionTime: number;
  totalCost: number;
  errorMessage?: string;
}

// Options for workflow execution
export interface WorkflowExecutorOptions {
  maxConcurrency?: number;
  timeout?: number;
  debug?: boolean;
  apiKeys?: Record<string, string>;
  onProgress?: (nodeId: string, status: 'start' | 'complete' | 'error', data?: any) => void;
}

/**
 * Core workflow execution engine responsible for executing LLM and NPM components
 */
export class WorkflowExecutor extends EventEmitter {
  private npmExecutor: NPMSandboxExecutor;
  private llmProviders: Record<string, any> = {};
  private apiKeys: Record<string, string> = {};
  private options: WorkflowExecutorOptions;

  constructor(options: WorkflowExecutorOptions = {}) {
    super();
    this.options = {
      maxConcurrency: 1,
      timeout: 30000,
      debug: false,
      ...options
    };
    
    // Initialize NPM executor
    this.npmExecutor = new NPMSandboxExecutor();
    
    // Set API keys if provided
    if (options.apiKeys) {
      this.apiKeys = options.apiKeys;
      this.initializeLLMProviders();
    }
  }

  /**
   * Initialize LLM providers with API keys
   */
  private initializeLLMProviders() {
    // Create providers based on available API keys
    if (this.apiKeys.openai) {
      this.llmProviders.openai = LLMProviderFactory.create('openai', this.apiKeys.openai);
    }
    
    if (this.apiKeys.anthropic) {
      this.llmProviders.anthropic = LLMProviderFactory.create('anthropic', this.apiKeys.anthropic);
    }
    
    if (this.apiKeys.deepseek) {
      this.llmProviders.deepseek = LLMProviderFactory.create('deepseek', this.apiKeys.deepseek);
    }
    
    // Local Ollama if available
    try {
      this.llmProviders.ollama = LLMProviderFactory.create('ollama', '');
    } catch (e) {
      // Ollama not available, continue without it
    }
  }

  /**
   * Set API key for a specific provider
   */
  public setApiKey(provider: string, apiKey: string) {
    this.apiKeys[provider] = apiKey;
    this.llmProviders[provider] = LLMProviderFactory.create(provider, apiKey);
    return this;
  }

  /**
   * Execute a complete workflow
   */
  public async execute(
    workflow: Workflow, 
    initialInput?: any
  ): Promise<WorkflowExecutionResult> {
    const startTime = Date.now();
    const results: Record<string, NodeExecutionResult> = {};
    
    try {
      this.log('Starting workflow execution:', workflow.name);
      this.emit('workflow:start', { workflow, startTime });
      
      // Validate workflow
      this.validateWorkflow(workflow);
      
      // Sort nodes in execution order
      const sortedNodes = this.topologicalSort(workflow.nodes, workflow.connections);
      
      // Execute nodes in order
      for (const node of sortedNodes) {
        try {
          this.log(`Executing node: ${node.id} (${node.type})`);
          
          // Update node status
          node.status = 'running';
          this.emit('node:start', { nodeId: node.id, type: node.type });
          
          // Get input from previous nodes
          const nodeInput = this.getNodeInput(node.id, workflow.nodes, workflow.connections, results, initialInput);
          
          // Execute node based on type
          const nodeStartTime = Date.now();
          let output: any;
          let cost = 0;
          let tokensUsed = 0;
          
          if (node.type === 'input') {
            // Input nodes just pass through the initialInput
            output = initialInput || node.data.defaultValue || null;
          }
          else if (node.type === 'llm') {
            const result = await this.executeLLMNode(node, nodeInput);
            output = result.output;
            cost = result.cost || 0;
            tokensUsed = result.tokensUsed || 0;
          }
          else if (node.type === 'npm') {
            output = await this.executeNPMNode(node, nodeInput);
          }
          else if (node.type === 'output') {
            // Output nodes just collect the data for final result
            output = nodeInput;
          }
          
          const nodeEndTime = Date.now();
          const executionTime = nodeEndTime - nodeStartTime;
          
          // Create result
          const nodeResult: NodeExecutionResult = {
            nodeId: node.id,
            output,
            metrics: {
              startTime: nodeStartTime,
              endTime: nodeEndTime,
              executionTime,
              memoryUsage: this.getMemoryUsage(),
              cost,
              tokensUsed
            }
          };
          
          results[node.id] = nodeResult;
          
          // Update node status
          node.status = 'completed';
          this.emit('node:complete', { nodeId: node.id, result: nodeResult });
          
          this.log(`Completed node: ${node.id} (${executionTime}ms)`);
          
          // Call progress callback if provided
          if (this.options.onProgress) {
            this.options.onProgress(node.id, 'complete', nodeResult);
          }
          
        } catch (error: any) {
          this.log(`Error executing node ${node.id}:`, error);
          
          // Update node status
          node.status = 'error';
          
          const nodeResult: NodeExecutionResult = {
            nodeId: node.id,
            output: null,
            error: error.message,
            metrics: {
              startTime: Date.now(),
              endTime: Date.now(),
              executionTime: 0,
              memoryUsage: this.getMemoryUsage()
            }
          };
          
          results[node.id] = nodeResult;
          this.emit('node:error', { nodeId: node.id, error: error.message });
          
          // Call progress callback if provided
          if (this.options.onProgress) {
            this.options.onProgress(node.id, 'error', { error: error.message });
          }
          
          // Determine whether to continue or abort the workflow
          if (this.shouldAbortOnNodeError(node, workflow)) {
            throw new Error(`Workflow execution aborted due to error in node ${node.id}: ${error.message}`);
          }
        }
      }
      
      // Calculate total cost and create final result
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      const totalCost = Object.values(results).reduce((sum, result) => sum + (result.metrics.cost || 0), 0);
      
      const finalResult: WorkflowExecutionResult = {
        workflowId: workflow.id,
        status: 'completed',
        results,
        startTime,
        endTime,
        executionTime,
        totalCost
      };
      
      this.emit('workflow:complete', finalResult);
      this.log('Workflow execution completed successfully');
      
      return finalResult;
      
    } catch (error: any) {
      this.log('Workflow execution failed:', error);
      
      const endTime = Date.now();
      const executionTime = endTime - startTime;
      const totalCost = Object.values(results).reduce((sum, result) => sum + (result.metrics.cost || 0), 0);
      
      const finalResult: WorkflowExecutionResult = {
        workflowId: workflow.id,
        status: 'failed',
        results,
        startTime,
        endTime,
        executionTime,
        totalCost,
        errorMessage: error.message
      };
      
      this.emit('workflow:error', { error: error.message, result: finalResult });
      
      return finalResult;
    }
  }

  /**
   * Execute an LLM node
   */
  private async executeLLMNode(node: WorkflowNode, input: any): Promise<{output: any; cost?: number; tokensUsed?: number}> {
    const model = node.data;
    const provider = model.provider.toLowerCase();
    
    // Check if provider is available
    if (!this.llmProviders[provider]) {
      throw new Error(`LLM provider ${provider} is not configured. Please add an API key.`);
    }
    
    // Prepare prompt
    const promptText = typeof input === 'string' ? input : JSON.stringify(input);
    
    // Execute LLM call
    try {
      const llmProvider = this.llmProviders[provider];
      const result = await llmProvider.call({
        model: model.model_id,
        prompt: promptText,
        temperature: node.config.temperature || 0.7,
        maxTokens: node.config.maxTokens
      });
      
      return {
        output: result.content,
        cost: this.calculateLLMCost(model, result.usage),
        tokensUsed: result.usage.promptTokens + result.usage.completionTokens
      };
    } catch (error) {
      console.error('LLM execution error:', error);
      throw new Error(`Error executing LLM node: ${error.message}`);
    }
  }

  /**
   * Calculate LLM cost based on model pricing and token usage
   */
  private calculateLLMCost(model: LLMModel, usage: {promptTokens: number; completionTokens: number}): number {
    const inputCost = model.input_price * usage.promptTokens / 1000000; // Convert to millions of tokens
    const outputCost = model.output_price * usage.completionTokens / 1000000;
    return inputCost + outputCost;
  }

  /**
   * Execute an NPM node
   */
  private async executeNPMNode(node: WorkflowNode, input: any): Promise<any> {
    const pkg = node.data;
    const code = node.config.code || this.generateDefaultNPMCode(pkg.name);
    
    try {
      // Execute the code in the sandbox
      return await this.npmExecutor.executeWithPackage(pkg.name, code, input);
    } catch (error) {
      console.error('NPM execution error:', error);
      throw new Error(`Error executing NPM node: ${error.message}`);
    }
  }

  /**
   * Generate default code for an NPM package
   */
  private generateDefaultNPMCode(packageName: string): string {
    const defaultCodes: Record<string, string> = {
      'lodash': 'return _.map(input, item => _.cloneDeep(item));',
      'papaparse': 'return Papa.parse(input, { header: true });',
      'axios': 'return (await axios.get(input)).data;',
      'dayjs': 'return dayjs(input).format("YYYY-MM-DD");',
      'validator': 'return validator.isEmail(input);',
      'joi': 'const schema = Joi.object().keys({ value: Joi.string().required() }); return schema.validate({ value: input });',
      'uuid': 'return uuidv4();',
      'sharp': 'return await sharp(input).resize(300, 300).toBuffer();',
      'bcrypt': 'return await bcrypt.hash(input, 10);'
    };
    
    return defaultCodes[packageName] || 'return input;';
  }

  /**
   * Get the input for a node based on its connections
   */
  private getNodeInput(
    nodeId: string,
    nodes: WorkflowNode[],
    connections: Connection[],
    results: Record<string, NodeExecutionResult>,
    initialInput?: any
  ): any {
    // Find all incoming connections to this node
    const incoming = connections.filter(conn => conn.target === nodeId);
    
    if (incoming.length === 0) {
      // No incoming connections, use initialInput if this is an input node
      const node = nodes.find(n => n.id === nodeId);
      if (node?.type === 'input') {
        return initialInput !== undefined ? initialInput : node.data.defaultValue;
      }
      return null;
    }
    
    if (incoming.length === 1) {
      // Single input, return the output from the source node
      const sourceNodeId = incoming[0].source;
      return results[sourceNodeId]?.output;
    }
    
    // Multiple inputs, return an array of outputs from all source nodes
    return incoming.map(conn => results[conn.source]?.output);
  }

  /**
   * Sort nodes in execution order using topological sort
   */
  private topologicalSort(nodes: WorkflowNode[], connections: Connection[]): WorkflowNode[] {
    // Build adjacency list and in-degree map
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();
    
    // Initialize
    for (const node of nodes) {
      graph.set(node.id, []);
      inDegree.set(node.id, 0);
    }
    
    // Build graph
    for (const conn of connections) {
      graph.get(conn.source)?.push(conn.target);
      inDegree.set(conn.target, (inDegree.get(conn.target) || 0) + 1);
    }
    
    // Find nodes with no incoming edges
    const queue: string[] = [];
    for (const [nodeId, degree] of inDegree.entries()) {
      if (degree === 0) queue.push(nodeId);
    }
    
    // Process nodes
    const result: string[] = [];
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      result.push(currentId);
      
      // Reduce in-degree of neighbors
      for (const neighbor of graph.get(currentId) || []) {
        const newDegree = (inDegree.get(neighbor) || 0) - 1;
        inDegree.set(neighbor, newDegree);
        if (newDegree === 0) {
          queue.push(neighbor);
        }
      }
    }
    
    // Check for cycles
    if (result.length !== nodes.length) {
      throw new Error('Workflow contains cycles, which are not supported.');
    }
    
    // Convert back to nodes in sorted order
    return result.map(id => nodes.find(node => node.id === id)!);
  }

  /**
   * Validate workflow before execution
   */
  private validateWorkflow(workflow: Workflow): void {
    if (!workflow.nodes || workflow.nodes.length === 0) {
      throw new Error('Workflow must contain at least one node');
    }
    
    // Check for unsupported node types
    const invalidNode = workflow.nodes.find(node => !['input', 'llm', 'npm', 'output'].includes(node.type));
    if (invalidNode) {
      throw new Error(`Unsupported node type: ${invalidNode.type}`);
    }
    
    // Check for cycles using topological sort
    try {
      this.topologicalSort(workflow.nodes, workflow.connections);
    } catch (error) {
      throw new Error('Workflow validation failed: ' + error.message);
    }
  }

  /**
   * Determine if workflow should abort after a node error
   */
  private shouldAbortOnNodeError(node: WorkflowNode, workflow: Workflow): boolean {
    // For critical nodes like input or early in the workflow, abort
    if (node.type === 'input') return true;
    
    // By default, continue if there are alternative paths
    return false;
  }

  /**
   * Get current memory usage
   */
  private getMemoryUsage(): number {
    // In browser, use performance.memory if available
    if (typeof performance !== 'undefined' && (performance as any).memory) {
      return Math.round((performance as any).memory.usedJSHeapSize / (1024 * 1024));
    }
    
    // In Node.js, use process.memoryUsage
    if (typeof process !== 'undefined' && process.memoryUsage) {
      const memUsage = process.memoryUsage();
      return Math.round(memUsage.heapUsed / (1024 * 1024));
    }
    
    // Fallback
    return 0;
  }

  /**
   * Debug logging
   */
  private log(...args: any[]): void {
    if (this.options.debug) {
      console.log('[WorkflowExecutor]', ...args);
    }
  }
}