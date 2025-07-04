import { useState, useEffect, useCallback } from 'react';
import { WorkflowExecutor, Workflow, WorkflowExecutionResult } from '../lib/execution/workflow-executor';
import { analyzeExecution, generatePerformanceTips } from '../lib/execution/analytics';
import { NPMSandboxExecutor } from '../lib/sandbox/npm-executor';
import { LLMProviderFactory, MockLLMProvider } from '../lib/adapters/llm-provider';

/**
 * Hook for executing workflows
 */
export const useWorkflowExecution = (options = {}) => {
  const [isExecuting, setIsExecuting] = useState(false);
  const [lastResult, setLastResult] = useState<WorkflowExecutionResult | null>(null);
  const [analytics, setAnalytics] = useState(null);
  const [performanceTips, setPerformanceTips] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [logs, setLogs] = useState<string[]>([]);
  
  // Create workflow executor instance
  const [executor] = useState(() => {
    // Create NPM sandbox
    const npmExecutor = new NPMSandboxExecutor({
      timeout: 15000,
      allowedPackages: [
        'lodash', 'papaparse', 'axios', 'joi', 'validator',
        'uuid', 'dayjs', 'marked', 'mathjs', 'crypto-js'
      ]
    });
    
    // Create mock LLM provider
    const mockLLM = new MockLLMProvider();
    
    // Create workflow executor
    const executor = new WorkflowExecutor({
      debug: true,
      apiKeys: {},
      onProgress: (nodeId, status, data) => {
        addLog(`Node ${nodeId}: ${status} ${data ? JSON.stringify(data) : ''}`);
      }
    });
    
    // Add mock LLM provider
    executor.setApiKey('mock', 'mock-key');
    
    // Setup event listeners
    executor.on('workflow:start', ({ workflow }) => {
      addLog(`Starting execution of workflow: ${workflow.name || 'Unnamed workflow'}`);
    });
    
    executor.on('workflow:complete', (result) => {
      addLog(`Workflow completed in ${result.executionTime}ms with cost $${result.totalCost.toFixed(4)}`);
    });
    
    executor.on('workflow:error', ({ error }) => {
      addLog(`Workflow execution failed: ${error}`);
    });
    
    executor.on('node:start', ({ nodeId, type }) => {
      addLog(`Executing node ${nodeId} (${type})`);
    });
    
    executor.on('node:complete', ({ nodeId, result }) => {
      addLog(`Node ${nodeId} completed in ${result.metrics.executionTime}ms`);
    });
    
    executor.on('node:error', ({ nodeId, error }) => {
      addLog(`Node ${nodeId} failed: ${error}`);
    });
    
    return executor;
  });
  
  // Add a log message
  const addLog = useCallback((message: string) => {
    setLogs(prev => [...prev, `[${new Date().toISOString()}] ${message}`]);
  }, []);
  
  // Clear logs
  const clearLogs = useCallback(() => {
    setLogs([]);
  }, []);
  
  // Execute a workflow
  const executeWorkflow = useCallback(async (workflow: Workflow, input?: any) => {
    setIsExecuting(true);
    setError(null);
    clearLogs();
    
    try {
      addLog(`Preparing to execute workflow with ${workflow.nodes.length} nodes`);
      
      // Execute the workflow
      const result = await executor.execute(workflow, input);
      
      setLastResult(result);
      
      // Analyze execution results
      const executionAnalytics = analyzeExecution(result);
      setAnalytics(executionAnalytics);
      
      // Generate performance tips
      const tips = generatePerformanceTips(executionAnalytics);
      setPerformanceTips(tips);
      
      return result;
    } catch (err: any) {
      setError(err.message);
      addLog(`Execution error: ${err.message}`);
      return null;
    } finally {
      setIsExecuting(false);
    }
  }, [executor, addLog, clearLogs]);
  
  // Set an API key for a specific provider
  const setApiKey = useCallback((provider: string, apiKey: string) => {
    executor.setApiKey(provider, apiKey);
    addLog(`Set API key for ${provider}`);
  }, [executor, addLog]);
  
  return {
    isExecuting,
    executeWorkflow,
    lastResult,
    analytics,
    performanceTips,
    error,
    logs,
    clearLogs,
    setApiKey
  };
};