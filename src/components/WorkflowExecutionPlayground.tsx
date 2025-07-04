import React, { useState, useEffect, useRef } from 'react';
import * as math from 'mathjs';
import _ from 'lodash';
import Papa from 'papaparse';

// 模拟 LLM API 调用（实际使用时替换为真实 API）
const mockLLMCall = async (provider: string, model: string, prompt: string) => {
  // 模拟延迟
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // 根据不同模型返回不同风格的响应
  const responses: Record<string, string> = {
    'gpt-4o-mini': `[GPT-4o mini Response]\n我理解了您的请求：${prompt}\n这是一个快速高效的响应。这里是一些有用的建议和分析...`,
    'claude-3.5-sonnet': `[Claude 3.5 Sonnet Response]\n分析您的输入：${prompt}\n\n经过深度分析，我可以提供以下洞察：\n1. 数据特征分析\n2. 趋势识别\n3. 建议和优化方案`,
    'deepseek-coder': `[DeepSeek Coder Response]\n\`\`\`javascript\n// 基于您的需求：${prompt}\nfunction processData(input) {\n  // 智能代码生成\n  return optimizedResult;\n}\n\`\`\`\n\n代码说明：上述实现提供了高效的数据处理方案。`,
  };
  
  return responses[model] || `[${model} Response] 处理请求：${prompt}`;
};

// NPM 包执行器
class NPMExecutor {
  static async execute(packageName: string, code: string, input: any) {
    const packages: Record<string, any> = {
      'lodash': _,
      'mathjs': math,
      'papaparse': Papa,
    };
    
    const pkg = packages[packageName];
    if (!pkg) {
      throw new Error(`Package ${packageName} not available`);
    }
    
    // 创建执行上下文
    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
    const fn = new AsyncFunction('pkg', 'input', '_', 'math', 'Papa', code);
    
    try {
      return await fn(pkg, input, _, math, Papa);
    } catch (error: any) {
      throw new Error(`Execution error: ${error.message}`);
    }
  }
}

// 工作流节点类型
interface WorkflowNode {
  id: string;
  type: 'llm' | 'npm' | 'input' | 'output';
  data: any;
  position: { x: number; y: number };
}

interface Connection {
  source: string;
  target: string;
}

// 预设工作流模板
const WORKFLOW_TEMPLATES = {
  chatbot: {
    name: '🤖 智能聊天机器人',
    nodes: [
      { id: '1', type: 'input', data: { label: '用户输入' }, position: { x: 50, y: 150 } },
      { id: '2', type: 'llm', data: { model: 'gpt-4o-mini', prompt: '你是一个友好的助手。用户说：{{input}}。请提供有帮助的回复。' }, position: { x: 250, y: 150 } },
      { id: '3', type: 'output', data: { label: '机器人回复' }, position: { x: 450, y: 150 } }
    ],
    connections: [
      { source: '1', target: '2' },
      { source: '2', target: '3' }
    ]
  },
  dataProcessor: {
    name: '📊 数据处理管道',
    nodes: [
      { id: '1', type: 'input', data: { label: '数据输入', defaultValue: '[1,2,3,4,5]' }, position: { x: 50, y: 150 } },
      { id: '2', type: 'npm', data: { package: 'lodash', code: 'return _.map(input, n => n * 2)' }, position: { x: 200, y: 150 } },
      { id: '3', type: 'npm', data: { package: 'mathjs', code: 'return math.sum(input)' }, position: { x: 350, y: 150 } },
      { id: '4', type: 'output', data: { label: '处理结果' }, position: { x: 500, y: 150 } }
    ],
    connections: [
      { source: '1', target: '2' },
      { source: '2', target: '3' },
      { source: '3', target: '4' }
    ]
  },
  aiAnalysis: {
    name: '🧠 AI 数据分析',
    nodes: [
      { id: '1', type: 'input', data: { label: 'CSV 数据', defaultValue: 'name,age,city\nJohn,25,NYC\nJane,30,LA\nBob,22,SF' }, position: { x: 50, y: 150 } },
      { id: '2', type: 'npm', data: { package: 'papaparse', code: 'return Papa.parse(input, { header: true }).data' }, position: { x: 200, y: 150 } },
      { id: '3', type: 'llm', data: { model: 'claude-3.5-sonnet', prompt: '分析这些用户数据并提供洞察：{{input}}' }, position: { x: 350, y: 150 } },
      { id: '4', type: 'output', data: { label: 'AI 分析结果' }, position: { x: 550, y: 150 } }
    ],
    connections: [
      { source: '1', target: '2' },
      { source: '2', target: '3' },
      { source: '3', target: '4' }
    ]
  },
  mathCalculator: {
    name: '🧮 高级数学计算器',
    nodes: [
      { id: '1', type: 'input', data: { label: '数学表达式', defaultValue: 'sqrt(16) + cos(pi)' }, position: { x: 50, y: 150 } },
      { id: '2', type: 'npm', data: { package: 'mathjs', code: 'return math.evaluate(input)' }, position: { x: 250, y: 150 } },
      { id: '3', type: 'llm', data: { model: 'deepseek-coder', prompt: '解释这个数学计算过程：{{input}}' }, position: { x: 450, y: 150 } },
      { id: '4', type: 'output', data: { label: '计算结果和解释' }, position: { x: 650, y: 150 } }
    ],
    connections: [
      { source: '1', target: '2' },
      { source: '2', target: '3' },
      { source: '3', target: '4' }
    ]
  }
};

export default function WorkflowExecutionPlayground() {
  const [nodes, setNodes] = useState<WorkflowNode[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionLog, setExecutionLog] = useState<string[]>([]);
  const [nodeResults, setNodeResults] = useState<Record<string, any>>({});
  const [inputValue, setInputValue] = useState('');
  const [currentExecutingNode, setCurrentExecutingNode] = useState<string | null>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  // 加载模板
  const loadTemplate = (templateKey: string) => {
    const template = WORKFLOW_TEMPLATES[templateKey as keyof typeof WORKFLOW_TEMPLATES];
    if (template) {
      setNodes(template.nodes);
      setConnections(template.connections);
      setSelectedTemplate(templateKey);
      setExecutionLog([`📋 加载模板：${template.name}`]);
      setNodeResults({});
      setCurrentExecutingNode(null);
      
      // 设置默认输入值
      const inputNode = template.nodes.find(n => n.type === 'input');
      if (inputNode?.data.defaultValue) {
        setInputValue(inputNode.data.defaultValue);
      }
    }
  };

  // 执行工作流
  const executeWorkflow = async () => {
    if (nodes.length === 0) {
      setExecutionLog(prev => [...prev, '❌ 请先选择一个工作流模板']);
      return;
    }

    setIsExecuting(true);
    setExecutionLog(prev => [...prev, '\n🚀 开始执行工作流...']);
    const results: Record<string, any> = {};

    try {
      // 拓扑排序
      const sortedNodes = topologicalSort(nodes, connections);
      setExecutionLog(prev => [...prev, `📝 执行顺序：${sortedNodes.map(n => n.type).join(' → ')}`]);
      
      for (const node of sortedNodes) {
        setCurrentExecutingNode(node.id);
        setExecutionLog(prev => [...prev, `\n⚙️ 执行节点 ${node.id}: ${node.type}`]);
        
        let result;
        switch (node.type) {
          case 'input':
            result = inputValue || node.data.defaultValue || 'Hello, AI!';
            setExecutionLog(prev => [...prev, `  📥 输入数据: ${JSON.stringify(result).substring(0, 100)}...`]);
            break;
            
          case 'llm':
            const llmInput = getNodeInput(node.id, connections, results);
            const prompt = node.data.prompt.replace('{{input}}', JSON.stringify(llmInput));
            setExecutionLog(prev => [...prev, `  🤖 调用 ${node.data.model}...`]);
            setExecutionLog(prev => [...prev, `  💬 提示词: ${prompt.substring(0, 80)}...`]);
            result = await mockLLMCall('', node.data.model, prompt);
            setExecutionLog(prev => [...prev, `  ✅ LLM 响应: ${result.substring(0, 120)}...`]);
            break;
            
          case 'npm':
            const npmInput = getNodeInput(node.id, connections, results);
            setExecutionLog(prev => [...prev, `  📦 执行 ${node.data.package} 包...`]);
            setExecutionLog(prev => [...prev, `  📄 代码: ${node.data.code}`]);
            try {
              // 处理输入数据
              let processedInput = npmInput;
              if (typeof npmInput === 'string' && (npmInput.startsWith('[') || npmInput.startsWith('{'))) {
                try {
                  processedInput = JSON.parse(npmInput);
                } catch {
                  // 保持原始字符串
                }
              }
              
              result = await NPMExecutor.execute(
                node.data.package,
                node.data.code,
                processedInput
              );
              setExecutionLog(prev => [...prev, `  ✅ 执行成功: ${JSON.stringify(result)}`]);
            } catch (error: any) {
              throw new Error(`NPM 执行失败: ${error.message}`);
            }
            break;
            
          case 'output':
            result = getNodeInput(node.id, connections, results);
            setExecutionLog(prev => [...prev, `  📤 最终输出: ${JSON.stringify(result).substring(0, 200)}...`]);
            break;
        }
        
        results[node.id] = result;
        setNodeResults(prev => ({ ...prev, [node.id]: result }));
        
        // 模拟执行延迟
        await new Promise(resolve => setTimeout(resolve, 800));
      }
      
      setExecutionLog(prev => [...prev, '\n🎉 工作流执行完成！']);
    } catch (error: any) {
      setExecutionLog(prev => [...prev, `\n❌ 执行错误: ${error.message}`]);
    } finally {
      setIsExecuting(false);
      setCurrentExecutingNode(null);
    }
  };

  // 拓扑排序
  const topologicalSort = (nodes: WorkflowNode[], connections: Connection[]): WorkflowNode[] => {
    const graph = new Map<string, string[]>();
    const inDegree = new Map<string, number>();
    
    // 初始化
    nodes.forEach(node => {
      graph.set(node.id, []);
      inDegree.set(node.id, 0);
    });
    
    // 构建图
    connections.forEach(conn => {
      graph.get(conn.source)?.push(conn.target);
      inDegree.set(conn.target, (inDegree.get(conn.target) || 0) + 1);
    });
    
    // 拓扑排序
    const queue: string[] = [];
    const sorted: WorkflowNode[] = [];
    
    inDegree.forEach((degree, nodeId) => {
      if (degree === 0) queue.push(nodeId);
    });
    
    while (queue.length > 0) {
      const nodeId = queue.shift()!;
      const node = nodes.find(n => n.id === nodeId)!;
      sorted.push(node);
      
      graph.get(nodeId)?.forEach(targetId => {
        const newDegree = (inDegree.get(targetId) || 0) - 1;
        inDegree.set(targetId, newDegree);
        if (newDegree === 0) queue.push(targetId);
      });
    }
    
    return sorted;
  };

  // 获取节点输入
  const getNodeInput = (nodeId: string, connections: Connection[], results: Record<string, any>): any => {
    const incomingConnection = connections.find(c => c.target === nodeId);
    if (incomingConnection) {
      return results[incomingConnection.source];
    }
    return null;
  };

  // 自动滚动日志
  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [executionLog]);

  // 可视化节点
  const NodeComponent = ({ node }: { node: WorkflowNode }) => {
    const colors = {
      input: 'from-green-500 to-green-600',
      llm: 'from-purple-500 to-purple-600',
      npm: 'from-blue-500 to-blue-600',
      output: 'from-orange-500 to-orange-600'
    };

    const icons = {
      input: '📥',
      llm: '🤖',
      npm: '📦',
      output: '📤'
    };

    const isExecuting = currentExecutingNode === node.id;
    const hasResult = nodeResults[node.id] !== undefined;

    return (
      <div
        className={`absolute p-3 rounded-lg text-white bg-gradient-to-r ${colors[node.type]} shadow-lg transition-all duration-300 hover:scale-105 min-w-[140px] ${
          isExecuting ? 'ring-4 ring-yellow-400 animate-pulse' : ''
        } ${hasResult ? 'ring-2 ring-green-400' : ''}`}
        style={{ left: node.position.x, top: node.position.y }}
      >
        <div className="flex items-center gap-2 mb-2">
          <span className="text-2xl">{icons[node.type]}</span>
          <div className="flex-1">
            <div className="font-bold text-sm">{node.type.toUpperCase()}</div>
            {node.data.label && <div className="text-xs opacity-90">{node.data.label}</div>}
            {node.data.model && <div className="text-xs opacity-75">{node.data.model}</div>}
            {node.data.package && <div className="text-xs opacity-75">{node.data.package}</div>}
          </div>
          {isExecuting && (
            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
          )}
          {hasResult && !isExecuting && (
            <div className="text-green-300">✓</div>
          )}
        </div>
        
        {nodeResults[node.id] && (
          <div className="mt-2 p-2 bg-black bg-opacity-30 rounded text-xs max-w-xs overflow-hidden">
            <div className="font-bold mb-1">结果:</div>
            {typeof nodeResults[node.id] === 'string' 
              ? nodeResults[node.id].substring(0, 60) + (nodeResults[node.id].length > 60 ? '...' : '')
              : JSON.stringify(nodeResults[node.id]).substring(0, 60) + '...'}
          </div>
        )}
      </div>
    );
  };

  // 连接线组件
  const ConnectionLine = ({ connection }: { connection: Connection }) => {
    const sourceNode = nodes.find(n => n.id === connection.source);
    const targetNode = nodes.find(n => n.id === connection.target);
    
    if (!sourceNode || !targetNode) return null;
    
    const x1 = sourceNode.position.x + 140;
    const y1 = sourceNode.position.y + 35;
    const x2 = targetNode.position.x;
    const y2 = targetNode.position.y + 35;
    
    return (
      <svg className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="7"
            refX="9"
            refY="3.5"
            orient="auto"
          >
            <polygon
              points="0 0, 10 3.5, 0 7"
              fill="#666"
            />
          </marker>
        </defs>
        <line
          x1={x1}
          y1={y1}
          x2={x2}
          y2={y2}
          stroke="#666"
          strokeWidth="2"
          markerEnd="url(#arrowhead)"
          className="transition-all duration-300"
        />
      </svg>
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
          ⚡ LLM + NPM 执行引擎演示
        </h1>
        <p className="text-gray-300 text-lg">
          体验真实的 AI 工作流编排 • 实时执行 • 可视化结果
        </p>
      </div>

      <div className="max-w-7xl mx-auto grid grid-cols-12 gap-6">
        {/* 控制面板 */}
        <div className="col-span-3 bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 border border-gray-700">
          <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
            🎮 控制面板
          </h2>
          
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">选择工作流模板：</label>
              <select
                value={selectedTemplate}
                onChange={(e) => loadTemplate(e.target.value)}
                className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white focus:ring-2 focus:ring-purple-500 transition-all"
              >
                <option value="">-- 选择模板 --</option>
                <option value="chatbot">🤖 智能聊天机器人</option>
                <option value="dataProcessor">📊 数据处理管道</option>
                <option value="aiAnalysis">🧠 AI 数据分析</option>
                <option value="mathCalculator">🧮 高级数学计算器</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">输入数据：</label>
              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="输入您的数据或使用模板默认值..."
                className="w-full p-3 rounded-lg bg-gray-700 border border-gray-600 text-white h-32 resize-none focus:ring-2 focus:ring-purple-500 transition-all"
              />
            </div>

            <button
              onClick={executeWorkflow}
              disabled={isExecuting || nodes.length === 0}
              className={`w-full py-3 rounded-lg font-bold transition-all duration-300 ${
                isExecuting 
                  ? 'bg-gray-600 cursor-not-allowed' 
                  : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 shadow-lg hover:shadow-xl'
              }`}
            >
              {isExecuting ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
                  执行中...
                </div>
              ) : (
                '🚀 执行工作流'
              )}
            </button>
          </div>

          <div className="mt-6 p-4 bg-gray-700/50 rounded-lg">
            <h3 className="font-bold mb-3 text-gray-300">📚 可用包：</h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                <span>lodash - 数据处理工具</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-400 rounded-full"></span>
                <span>mathjs - 数学计算引擎</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 bg-yellow-400 rounded-full"></span>
                <span>papaparse - CSV 解析器</span>
              </div>
            </div>
          </div>

          <div className="mt-4 p-4 bg-purple-600/20 rounded-lg border border-purple-500/30">
            <h3 className="font-bold mb-2 text-purple-300">🤖 AI 模型：</h3>
            <div className="space-y-1 text-xs text-gray-300">
              <div>• GPT-4o mini - 快速响应</div>
              <div>• Claude 3.5 Sonnet - 深度分析</div>
              <div>• DeepSeek Coder - 代码生成</div>
            </div>
          </div>
        </div>

        {/* 工作流可视化 */}
        <div className="col-span-6">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 h-[600px] relative overflow-hidden border border-gray-700">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              🔗 工作流可视化
              {isExecuting && (
                <div className="flex items-center gap-2 text-yellow-400">
                  <div className="animate-pulse w-2 h-2 bg-yellow-400 rounded-full"></div>
                  <span className="text-sm">执行中</span>
                </div>
              )}
            </h2>
            
            {nodes.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <div className="text-6xl mb-4 opacity-50">🎯</div>
                  <div className="text-xl font-bold mb-2">选择一个工作流模板开始</div>
                  <div className="text-sm">体验 AI 模型与 NPM 包的强大组合</div>
                </div>
              </div>
            ) : (
              <div className="relative h-full">
                {connections.map((conn, index) => (
                  <ConnectionLine key={index} connection={conn} />
                ))}
                {nodes.map(node => (
                  <NodeComponent key={node.id} node={node} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 执行日志 */}
        <div className="col-span-3">
          <div className="bg-gray-800/50 backdrop-blur-sm rounded-xl p-5 h-[600px] overflow-y-auto border border-gray-700">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              📜 执行日志
            </h2>
            
            <div className="font-mono text-sm space-y-1">
              {executionLog.length === 0 ? (
                <div className="text-gray-500 italic">等待执行...</div>
              ) : (
                executionLog.map((log, index) => (
                  <div 
                    key={index} 
                    className={`${
                      log.includes('❌') ? 'text-red-400' : 
                      log.includes('✅') ? 'text-green-400' :
                      log.includes('🚀') ? 'text-blue-400' :
                      log.includes('🤖') ? 'text-purple-400' :
                      log.includes('📦') ? 'text-cyan-400' :
                      'text-gray-300'
                    } ${log.startsWith('  ') ? 'pl-4 text-xs' : ''}`}
                  >
                    {log}
                  </div>
                ))
              )}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>
      </div>

      {/* 使用说明 */}
      <div className="max-w-6xl mx-auto mt-8 bg-gray-800/30 backdrop-blur-sm rounded-xl p-6 border border-gray-700">
        <h3 className="text-2xl font-bold mb-6 text-center bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent">
          💡 使用指南
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-sm">
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h4 className="font-bold mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center text-xs">1</span>
              选择模板
            </h4>
            <p className="text-gray-300">从下拉菜单选择预设的工作流模板，每个模板展示不同的 AI + NPM 功能组合。</p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h4 className="font-bold mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center text-xs">2</span>
              输入数据
            </h4>
            <p className="text-gray-300">在输入框中提供初始数据，或使用模板的默认值进行快速体验。</p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h4 className="font-bold mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-purple-500 rounded-full flex items-center justify-center text-xs">3</span>
              执行工作流
            </h4>
            <p className="text-gray-300">点击执行按钮，观察数据如何在 LLM 模型和 NPM 包之间流转和处理。</p>
          </div>
          <div className="bg-gray-700/50 rounded-lg p-4">
            <h4 className="font-bold mb-3 flex items-center gap-2">
              <span className="w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center text-xs">4</span>
              查看结果
            </h4>
            <p className="text-gray-300">在日志面板查看详细的执行过程，在节点上查看实时处理结果。</p>
          </div>
        </div>
      </div>
    </div>
  );
}