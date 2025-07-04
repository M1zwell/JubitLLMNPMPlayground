/**
 * Analytics and metrics for workflow execution
 */
import { WorkflowExecutionResult, NodeExecutionResult } from './workflow-executor';

// Performance metrics
export interface PerformanceMetrics {
  executionTime: number;
  memoryUsage: number;
  throughput: number;
  latency: number;
}

// Cost metrics
export interface CostMetrics {
  llmApiCost: number;
  computeResourceCost: number;
  storageCost: number;
  networkCost: number;
  totalCost: number;
}

// Quality metrics
export interface QualityMetrics {
  success: boolean;
  errorRate: number;
  completionRate: number;
  averageResponseLength: number;
}

// Complete analytics result
export interface ExecutionAnalytics {
  performance: PerformanceMetrics;
  cost: CostMetrics;
  quality: QualityMetrics;
  nodeBreakdown: Record<string, {
    executionTime: number;
    cost?: number;
    tokensProcessed?: number;
    success: boolean;
    type: string;
    name: string;
  }>;
  timestamp: number;
}

// Compute cost constants
const COMPUTE_COST_PER_SEC = 0.00003; // $0.03 per 1000 seconds
const STORAGE_COST_PER_GB = 0.02; // $0.02 per GB
const NETWORK_COST_PER_GB = 0.01; // $0.01 per GB
const MIN_USAGE_MB = 10; // Minimum memory usage to report

/**
 * Analyze a workflow execution result
 */
export function analyzeExecution(executionResult: WorkflowExecutionResult): ExecutionAnalytics {
  const { results, executionTime, totalCost, status } = executionResult;
  const nodeResults = Object.values(results);
  
  // Calculate performance metrics
  const performance = calculatePerformanceMetrics(nodeResults, executionTime);
  
  // Calculate cost metrics
  const cost = calculateCostMetrics(nodeResults, executionTime, totalCost);
  
  // Calculate quality metrics
  const quality = calculateQualityMetrics(nodeResults, status);
  
  // Create node breakdown
  const nodeBreakdown: Record<string, any> = {};
  for (const nodeId in results) {
    const result = results[nodeId];
    
    nodeBreakdown[nodeId] = {
      executionTime: result.metrics.executionTime,
      cost: result.metrics.cost || 0,
      tokensProcessed: result.metrics.tokensUsed || 0,
      success: !result.error,
      type: nodeId.split('_')[0], // Extract type from node ID
      name: nodeId.split('_')[1] || 'unknown' // Extract name from node ID
    };
  }
  
  return {
    performance,
    cost,
    quality,
    nodeBreakdown,
    timestamp: Date.now()
  };
}

/**
 * Calculate performance metrics
 */
function calculatePerformanceMetrics(
  results: NodeExecutionResult[],
  totalExecutionTime: number
): PerformanceMetrics {
  // Calculate memory usage
  const maxMemoryUsage = Math.max(
    ...results.map(result => result.metrics.memoryUsage || 0),
    MIN_USAGE_MB
  );
  
  // Calculate throughput (operations per second)
  const throughput = results.length > 0 ? (results.length / (totalExecutionTime / 1000)) : 0;
  
  // Calculate average latency
  const avgLatency = results.length > 0 
    ? results.reduce((sum, result) => sum + result.metrics.executionTime, 0) / results.length
    : 0;
  
  return {
    executionTime: totalExecutionTime,
    memoryUsage: maxMemoryUsage,
    throughput,
    latency: avgLatency
  };
}

/**
 * Calculate cost metrics
 */
function calculateCostMetrics(
  results: NodeExecutionResult[],
  executionTime: number,
  totalLLMCost: number
): CostMetrics {
  // Calculate LLM API cost
  const llmApiCost = totalLLMCost;
  
  // Calculate compute cost based on execution time
  const computeSeconds = executionTime / 1000;
  const computeCost = computeSeconds * COMPUTE_COST_PER_SEC;
  
  // Estimate storage cost (very rough approximation)
  const storageMB = results.reduce((sum, result) => {
    const outputSize = result.output 
      ? (typeof result.output === 'string' 
         ? result.output.length / 1024 
         : JSON.stringify(result.output).length / 1024)
      : 0;
    return sum + outputSize;
  }, 0);
  const storageCost = (storageMB / 1024) * STORAGE_COST_PER_GB;
  
  // Estimate network cost (very rough approximation)
  const networkMB = results.reduce((sum, result) => {
    const inputSize = result.metrics.tokensUsed 
      ? (result.metrics.tokensUsed * 4) / 1024 // Approx 4 bytes per token
      : 0;
    return sum + inputSize;
  }, 0);
  const networkCost = (networkMB / 1024) * NETWORK_COST_PER_GB;
  
  // Calculate total cost
  const totalCost = llmApiCost + computeCost + storageCost + networkCost;
  
  return {
    llmApiCost,
    computeResourceCost: computeCost,
    storageCost,
    networkCost,
    totalCost
  };
}

/**
 * Calculate quality metrics
 */
function calculateQualityMetrics(
  results: NodeExecutionResult[],
  status: 'completed' | 'failed' | 'partial'
): QualityMetrics {
  // Calculate error rate
  const failedNodes = results.filter(result => result.error).length;
  const errorRate = results.length > 0 ? failedNodes / results.length : 0;
  
  // Calculate completion rate
  const completionRate = status === 'completed' ? 1 : status === 'partial' ? 0.5 : 0;
  
  // Calculate average response length (for LLM outputs)
  const llmResults = results.filter(r => r.nodeId.startsWith('llm_'));
  const avgResponseLength = llmResults.length > 0 
    ? llmResults.reduce((sum, r) => {
        const length = typeof r.output === 'string' ? r.output.length : 0;
        return sum + length;
      }, 0) / llmResults.length
    : 0;
  
  return {
    success: status === 'completed',
    errorRate,
    completionRate,
    averageResponseLength: avgResponseLength
  };
}

/**
 * Generate performance tips based on execution analytics
 */
export function generatePerformanceTips(analytics: ExecutionAnalytics): string[] {
  const tips: string[] = [];
  
  // Check execution time
  if (analytics.performance.executionTime > 10000) {
    tips.push('Consider optimizing long-running components to improve overall performance.');
  }
  
  // Check memory usage
  if (analytics.performance.memoryUsage > 100) {
    tips.push('High memory usage detected. Consider processing data in smaller chunks.');
  }
  
  // Check cost
  if (analytics.cost.llmApiCost > 0.1) {
    tips.push('Consider using smaller, more efficient LLM models for better cost-efficiency.');
  }
  
  // Check error rate
  if (analytics.quality.errorRate > 0) {
    tips.push('Some components failed. Add error handling and fallback mechanisms.');
  }
  
  // Node-specific tips
  for (const [nodeId, node] of Object.entries(analytics.nodeBreakdown)) {
    if (node.executionTime > 5000) {
      tips.push(`Node "${node.name}" took ${Math.round(node.executionTime / 1000)}s to execute. Consider optimization.`);
    }
    
    if (node.type === 'llm' && node.tokensProcessed > 1000) {
      tips.push(`High token usage in "${node.name}". Consider reducing input length or using a more efficient prompt.`);
    }
  }
  
  // Add general tips
  tips.push('Use parallel execution for independent operations to improve throughput.');
  tips.push('Cache results for frequently used operations to reduce API calls.');
  
  return tips;
}