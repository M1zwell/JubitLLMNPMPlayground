import React, { useState, useEffect, useRef } from 'react';
import { 
  Send, Copy, Zap, Brain, Settings, Save, Search,
  RefreshCw, MessageCircle, Check, Clock,
  ChevronDown, ChevronUp, Edit, BarChart2, 
  AlertCircle, Clipboard, Share2
} from 'lucide-react';
import { useLLMModels } from '../hooks/useLLMModels';
import { LLMModel } from '../lib/supabase';
import { usePlayground } from '../context/PlaygroundContext';
import AIWorkflowAdvisor from './AIWorkflowAdvisor';

// 默认提示词模板
const PROMPT_TEMPLATES = {
  'basic': {
    name: "基础对话",
    template: "你是一个有用的AI助手。请回答以下问题：\n\n{{input}}",
    description: "简单直接的请求，适合一般性问题"
  },
  'coding': {
    name: "代码生成",
    template: "你是一个专业的软件开发者。请帮我编写以下功能的代码：\n\n{{input}}\n\n使用清晰的注释并解释你的思路。",
    description: "获取高质量代码和详细解释"
  },
  'analysis': {
    name: "深度分析",
    template: "你是一个分析专家。请对以下内容进行深入分析：\n\n{{input}}\n\n请提供多个视角、潜在影响以及详细的论证。",
    description: "适合需要深入思考的复杂问题"
  },
  'creative': {
    name: "创意写作",
    template: "你是一个富有创造力的作家。基于以下提示，创作内容：\n\n{{input}}\n\n注重原创性、表现力和吸引力。",
    description: "故事创作、内容创意和想法生成"
  }
};

// 模型预设
const MODEL_PRESETS = {
  'balanced': {
    name: "平衡模式",
    temperature: 0.7,
    maxLength: 2000,
    topP: 0.9,
    description: "平衡创造力与准确性"
  },
  'creative': {
    name: "创意模式",
    temperature: 0.9,
    maxLength: 3000,
    topP: 1.0,
    description: "更多样化和创造性的输出"
  },
  'precise': {
    name: "精确模式",
    temperature: 0.2,
    maxLength: 1500,
    topP: 0.5,
    description: "更确定和一致的回答"
  },
  'efficient': {
    name: "高效模式",
    temperature: 0.5,
    maxLength: 800,
    topP: 0.7,
    description: "简洁回答，节省token"
  }
};

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

const LLMPlayground: React.FC = () => {
  const { models, loading, error } = useLLMModels();
  const { state, actions } = usePlayground();
  const [selectedModel, setSelectedModel] = useState<LLMModel | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('basic');
  const [selectedPreset, setSelectedPreset] = useState<string>('balanced');
  const [customSettings, setCustomSettings] = useState({
    temperature: 0.7,
    maxLength: 2000,
    topP: 0.9,
    systemPrompt: ''
  });
  const [showTemplatePanel, setShowTemplatePanel] = useState(false);
  const [savedConversations, setSavedConversations] = useState<{id: string, title: string, date: Date}[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // 初始化选定模型
  useEffect(() => {
    if (!selectedModel && models.length > 0) {
      // 尝试找到一个高质量的模型
      const quality = models.find(m => m.quality_index && m.quality_index >= 60);
      if (quality) {
        setSelectedModel(quality);
      } else {
        setSelectedModel(models[0]);
      }
    }
  }, [models, selectedModel]);

  // 滚动到最新消息
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 发送消息
  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;
    if (!selectedModel) return;

    // 获取当前使用的提示词模板
    const template = PROMPT_TEMPLATES[selectedTemplate];
    const prompt = template.template.replace('{{input}}', inputValue.trim());
    
    // 创建用户消息
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      timestamp: new Date()
    };
    
    // 添加系统提示词（如果有）
    if (messages.length === 0 && customSettings.systemPrompt) {
      const systemMessage: Message = {
        id: 'system-' + Date.now().toString(),
        role: 'system',
        content: customSettings.systemPrompt,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, systemMessage]);
    }
    
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);

    try {
      // 在实际应用中，这里会调用LLM API
      // 现在我们模拟API调用和响应
      
      const presetConfig = MODEL_PRESETS[selectedPreset];
      const config = {
        temperature: customSettings.temperature || presetConfig.temperature,
        maxTokens: customSettings.maxLength || presetConfig.maxLength,
        topP: customSettings.topP || presetConfig.topP,
        model: selectedModel.name
      };
      
      console.log('Sending to LLM with config:', config);
      
      // 模拟API延迟
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 生成模拟响应
      const response = generateMockResponse(prompt, selectedModel, config);
      
      // 创建助手消息
      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: response,
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      
      // 如果是第一条消息，将LLM模型添加到工作流
      if (messages.length <= 1) {
        actions.addComponentToWorkflow(selectedModel, 'llm');
      }
    } catch (error) {
      console.error('Error calling LLM:', error);
      
      const errorMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: '❌ 发生错误。请稍后再试或选择其他模型。',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  // 模拟LLM响应生成
  const generateMockResponse = (prompt: string, model: LLMModel, config: any): string => {
    // 根据提示词类型生成不同风格的响应
    const isCodeRequest = prompt.toLowerCase().includes('代码') || 
                         prompt.toLowerCase().includes('编程') || 
                         prompt.toLowerCase().includes('函数') ||
                         prompt.toLowerCase().includes('开发');
                         
    const isCreative = prompt.toLowerCase().includes('创意') || 
                      prompt.toLowerCase().includes('故事') || 
                      prompt.toLowerCase().includes('写作');
                      
    const isAnalysis = prompt.toLowerCase().includes('分析') || 
                      prompt.toLowerCase().includes('比较') || 
                      prompt.toLowerCase().includes('评估');
    
    // 根据温度参数调整响应的确定性和创造性
    const deterministic = config.temperature < 0.4;
    const creative = config.temperature > 0.8;
    
    // 根据模型类型调整响应风格
    const modelStyle = model.category === 'coding' ? 'coding' : 
                      model.category === 'reasoning' ? 'analytical' : 
                      model.category === 'multimodal' ? 'comprehensive' : 'standard';
    
    let response = '';
    
    if (isCodeRequest) {
      response = `以下是您请求的代码实现：

\`\`\`javascript
// 根据您的需求实现的函数
function processData(input) {
  // 验证输入
  if (!input || typeof input !== 'object') {
    throw new Error('Invalid input: expected an object');
  }
  
  // 处理数据
  const result = {
    processed: true,
    timestamp: new Date().toISOString(),
    data: input
  };
  
  // 应用转换
  if (input.transform) {
    result.data = applyTransformation(input.data);
  }
  
  return result;
}

// 辅助函数
function applyTransformation(data) {
  // 实现数据转换逻辑
  return {
    ...data,
    transformed: true
  };
}
\`\`\`

该实现提供了：
1. 输入验证以确保数据完整性
2. 标准化的结果格式
3. 可选的数据转换功能

您可以根据具体需求进一步定制此代码。需要我进一步解释任何部分吗？`;
    } else if (isCreative) {
      response = creative ? 
        `在银河系边缘的一颗蓝色行星上，科学家们发现了一种奇特的现象 - 数字蝴蝶。这些虚拟生物在全球网络中随意飞舞，偶尔停留在某个数据包上休息，然后继续它们神秘的旅程。

没人知道它们从何而来。有人说是量子涨落的偶然产物，也有人坚信是外星文明留下的信使。不管真相如何，这些数字蝴蝶已经开始改变互联网的基本运作方式。

当它们飞过某个网站，那里的算法会变得更有创意；当它们掠过某个数据中心，系统效率会突然提升。最令人惊讶的是，它们似乎在学习和进化，变得越来越复杂...

科学家莎拉·陈决心解开这个谜题。她设计了一个特殊的"数字花园"来吸引这些生物，希望能够捕捉并分析它们的本质。然而，当第一只数字蝴蝶落入她的陷阱时，她的电脑屏幕上出现了一个简单的问题：

"你们为什么想捕捉自由？"` :
        
        `关于创意写作，我可以提供以下思路：

1. 确定核心主题或中心思想
2. 创建独特而生动的角色
3. 设计引人入胜的情节线索
4. 使用丰富的描述性语言
5. 巧妙运用对话推动故事发展

建议从简单的场景描写开始，逐步扩展故事世界。重要的是保持连贯性，同时留下一些悬念和未解之谜来吸引读者继续阅读。

希望这些建议对您有所帮助！如果需要更具体的指导，请告诉我您想要创作的具体类型或主题。`;
    } else if (isAnalysis) {
      response = deterministic ?
        `## 分析结果

基于提供的信息，我的分析如下：

1. **主要发现**:
   - 数据显示明确的趋势变化
   - 关键指标呈现稳定增长
   - 边缘案例需要特别关注

2. **比较评估**:
   - 方案A: 效率高，成本适中，实施复杂度中等
   - 方案B: 效率中等，成本低，实施简单
   - 方案C: 效率最高，成本高，实施复杂

3. **建议行动**:
   - 短期: 实施方案B以快速取得进展
   - 中期: 逐步过渡到方案A
   - 长期: 评估方案C的可行性

4. **潜在风险**:
   - 市场波动可能影响预期结果
   - 技术变革可能需要调整方案
   - 资源限制可能影响实施时间表

此分析基于当前可用信息。如需更深入的评估，请提供更多具体数据。` :

        `对于您提出的分析请求，我有以下看法：

首先，这是一个多层面的问题，没有简单的答案。从表面来看，似乎有明显的模式，但深入探究后会发现更多细微差别。

一方面，传统观点认为A比B更优越，但最近的研究表明情况可能更为复杂。考虑到当前的发展趋势，我们应该更加关注C的潜在影响。

值得注意的是，不同背景下的表现各异，这使得一般性结论变得困难。环境因素、人为变量和系统限制都在发挥作用。

总体而言，我建议采取综合方法，并在更多数据可用时重新评估。这个领域正在不断发展，保持开放心态至关重要。`;
    } else {
      // 默认响应
      if (modelStyle === 'coding') {
        response = `我理解您的请求。从编程角度来看，这个问题可以这样解决：

1. 首先，我们需要定义明确的问题边界
2. 确定最佳的数据结构来处理信息
3. 设计一个高效算法以优化性能

基于这些原则，以下是我的建议：
- 使用哈希表来存储和检索关键数据点
- 实现缓存机制以提高重复操作的效率
- 考虑边缘情况以确保解决方案的健壮性

这种方法既保证了代码质量，又确保了解决方案的可扩展性。需要我详细解释任何部分吗？`;
      } else if (modelStyle === 'analytical') {
        response = `基于您的问题，我进行了如下分析：

分析要点：
1. 关键因素识别与评估
2. 模式和趋势的识别
3. 潜在影响的预测
4. 行动建议的制定

根据可用信息，我的初步结论是问题存在多个交织的层面，需要综合考虑各种因素。值得注意的是，虽然表面现象可能指向特定方向，但潜在原因通常更为复杂。

建议采取系统性方法，从多个角度评估情况，并在获取更多信息后迭代更新分析结果。

希望这个分析框架对您有所帮助。如需更深入的探讨，请提供更多具体细节。`;
      } else if (modelStyle === 'comprehensive') {
        response = `感谢您的问题。我可以从多个维度为您提供见解：

**文本分析**：
您的问题涉及到几个关键概念，包括[相关概念]和[潜在关联]。从语言学角度看，这些元素形成了一个复杂的语义网络。

**视觉角度**：
如果将您的问题视觉化，我们会看到一个由多个节点组成的网络，其中核心要素位于中心，辅助概念围绕其周围。

**数据视角**：
从数据分析角度看，我们需要考虑：
1. 定量因素：可测量的指标和统计数据
2. 定性因素：主观体验和质量评估
3. 时间序列：变化趋势和发展模式

**综合观点**：
综合以上分析，我建议[具体建议]作为最优方案，同时保持对[替代方案]的开放态度。

我希望这个多模态分析对您有所帮助。您是否需要我从某个特定角度进一步深入？`;
      } else {
        response = `感谢您的问题！

根据您提供的信息，我认为最关键的点是理解核心问题和潜在解决方案。

首先，让我们明确几个基本概念：
1. 问题的本质是什么？
2. 有哪些可能的解决方案？
3. 每种方案的优缺点是什么？

基于这些考虑，我的建议是：
- 先从最简单的方法开始尝试
- 收集反馈并进行必要的调整
- 逐步优化以达到最佳结果

这种渐进式的方法通常能在保持灵活性的同时取得良好效果。

您对这个方向有什么想法？或者您需要我在某些特定方面提供更多细节？`;
      }
    }
    
    // 根据模型质量调整响应
    if (model.quality_index && model.quality_index < 30) {
      // 低质量模型可能有错误或不完整的回答
      response = response.substring(0, Math.floor(response.length * 0.7)) + 
        "\n\n[注意：由于模型限制，回答可能不完整或存在误导。]";
    }
    
    // 添加模型署名
    response += `\n\n[${model.name} by ${model.provider}]`;
    
    return response;
  };

  // 清空对话
  const clearConversation = () => {
    setMessages([]);
  };

  // 复制对话到剪贴板
  const copyConversation = () => {
    const text = messages
      .map(msg => `${msg.role === 'user' ? '用户' : '助手'}: ${msg.content}`)
      .join('\n\n');
    
    navigator.clipboard.writeText(text);
  };
  
  // 应用模板到输入
  const applyTemplate = (templateKey: string) => {
    setSelectedTemplate(templateKey);
    setShowTemplatePanel(false);
  };
  
  // 应用预设到设置
  const applyPreset = (presetKey: string) => {
    setSelectedPreset(presetKey);
    const preset = MODEL_PRESETS[presetKey];
    setCustomSettings(prev => ({
      ...prev,
      temperature: preset.temperature,
      maxLength: preset.maxLength,
      topP: preset.topP
    }));
  };
  
  // 保存当前对话
  const saveConversation = () => {
    const id = Date.now().toString();
    const title = messages.length > 0 ? messages[0].content.substring(0, 30) + '...' : '新对话';
    
    setSavedConversations(prev => [...prev, {
      id,
      title,
      date: new Date()
    }]);
    
    // 实际应用中，这里会保存到本地存储或数据库
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">加载LLM模型中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="mx-auto mb-4 text-red-600" size={48} />
          <p className="text-lg text-red-600 mb-2">加载模型时出错</p>
          <p className="text-gray-500">{error}</p>
          <button className="btn-minimal btn-primary mt-4" onClick={() => window.location.reload()}>
            <RefreshCw size={16} />
            重试
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* 头部 */}
      <div className="text-center">
        <h1 className="text-heading-lg mb-2">
          LLM Playground
        </h1>
        <p className="text-body-sm mb-1">
          测试不同的LLM模型并比较结果
        </p>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* 左侧控制面板 */}
        <div className="lg:col-span-1 space-y-4">
          {/* 模型选择 */}
          <div className="card-minimal">
            <h3 className="text-subheading mb-4 flex items-center gap-2">
              <Brain className="text-purple-600" size={16} />
              模型选择
            </h3>
            
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={14} />
              <input
                type="text"
                placeholder="搜索模型..."
                className="w-full pl-9 pr-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm"
              />
            </div>
            
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {models.slice(0, 10).map(model => (
                <div
                  key={model.id}
                  onClick={() => setSelectedModel(model)}
                  className={`p-3 rounded-md cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-800 border ${
                    selectedModel?.id === model.id 
                      ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/20' 
                      : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-sm">{model.name}</h4>
                      <div className="flex items-center gap-1">
                        <p className="text-caption">{model.provider}</p>
                        {model.quality_index && model.quality_index >= 60 && (
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
                            高质量
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs text-green-600">${model.output_price}</div>
                      <div className="text-caption">{model.output_speed.toFixed(0)} tok/s</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          {/* 提示词模板 */}
          <div className="card-minimal">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-subheading flex items-center gap-2">
                <MessageCircle className="text-blue-600" size={16} />
                提示词模板
              </h3>
              <button
                onClick={() => setShowTemplatePanel(!showTemplatePanel)}
                className="btn-minimal btn-ghost"
              >
                {showTemplatePanel ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
            
            {showTemplatePanel ? (
              <div className="space-y-2">
                {Object.entries(PROMPT_TEMPLATES).map(([key, template]) => (
                  <div
                    key={key}
                    onClick={() => applyTemplate(key)}
                    className={`p-3 rounded-md cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-800 border ${
                      selectedTemplate === key 
                        ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20' 
                        : 'border-gray-200 dark:border-gray-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium text-sm">{template.name}</h4>
                        <p className="text-caption">{template.description}</p>
                      </div>
                      {selectedTemplate === key && (
                        <Check className="text-blue-600" size={16} />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-3 rounded-md border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">当前模板: {PROMPT_TEMPLATES[selectedTemplate].name}</h4>
                    <p className="text-caption">{PROMPT_TEMPLATES[selectedTemplate].description}</p>
                  </div>
                  <Edit className="text-gray-500" size={16} />
                </div>
              </div>
            )}
          </div>
          
          {/* 模型设置 */}
          <div className="card-minimal">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-subheading flex items-center gap-2">
                <Settings className="text-gray-600" size={16} />
                模型设置
              </h3>
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="btn-minimal btn-ghost"
              >
                {showSettings ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
            </div>
            
            {showSettings ? (
              <div className="space-y-4">
                <div className="space-y-2">
                  {Object.entries(MODEL_PRESETS).map(([key, preset]) => (
                    <div
                      key={key}
                      onClick={() => applyPreset(key)}
                      className={`p-3 rounded-md cursor-pointer transition-all hover:bg-gray-50 dark:hover:bg-gray-800 border ${
                        selectedPreset === key 
                          ? 'border-gray-600 bg-gray-50 dark:bg-gray-800' 
                          : 'border-gray-200 dark:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium text-sm">{preset.name}</h4>
                          <p className="text-caption">{preset.description}</p>
                        </div>
                        {selectedPreset === key && (
                          <Check className="text-gray-600" size={16} />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="space-y-3 pt-2">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-medium">Temperature: {customSettings.temperature}</label>
                      <span className="text-caption">创造性 vs 确定性</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="1" 
                      step="0.1" 
                      value={customSettings.temperature}
                      onChange={(e) => setCustomSettings(prev => ({...prev, temperature: parseFloat(e.target.value)}))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-medium">最大长度: {customSettings.maxLength}</label>
                      <span className="text-caption">tokens</span>
                    </div>
                    <input 
                      type="range" 
                      min="100" 
                      max="4000" 
                      step="100" 
                      value={customSettings.maxLength}
                      onChange={(e) => setCustomSettings(prev => ({...prev, maxLength: parseInt(e.target.value)}))}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-sm font-medium">Top P: {customSettings.topP}</label>
                      <span className="text-caption">多样性</span>
                    </div>
                    <input 
                      type="range" 
                      min="0.1" 
                      max="1" 
                      step="0.1" 
                      value={customSettings.topP}
                      onChange={(e) => setCustomSettings(prev => ({...prev, topP: parseFloat(e.target.value)}))}
                      className="w-full"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-1">系统提示词</label>
                  <textarea
                    value={customSettings.systemPrompt}
                    onChange={(e) => setCustomSettings(prev => ({...prev, systemPrompt: e.target.value}))}
                    placeholder="设置系统提示词以控制模型行为..."
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm"
                  />
                </div>
              </div>
            ) : (
              <div className="p-3 rounded-md border border-gray-200 dark:border-gray-700">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-sm">当前预设: {MODEL_PRESETS[selectedPreset].name}</h4>
                    <p className="text-caption">{MODEL_PRESETS[selectedPreset].description}</p>
                  </div>
                  <Edit className="text-gray-500" size={16} />
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* 对话区域 */}
        <div className="lg:col-span-3">
          <div className="card-minimal">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-subheading flex items-center gap-2">
                <MessageCircle className="text-green-600" size={16} />
                对话
              </h3>
              
              <div className="flex gap-2">
                <button
                  onClick={clearConversation}
                  className="btn-minimal btn-ghost text-sm"
                >
                  清空
                </button>
                <button
                  onClick={copyConversation}
                  className="btn-minimal btn-ghost text-sm"
                >
                  <Copy size={14} />
                  复制
                </button>
                <button
                  onClick={saveConversation}
                  className="btn-minimal btn-secondary text-sm"
                >
                  <Save size={14} />
                  保存
                </button>
                <button
                  onClick={() => actions.navigateToPlaygroundWithComponent(selectedModel, 'llm')}
                  className="btn-minimal btn-primary text-sm"
                >
                  <Zap size={14} />
                  添加到工作流
                </button>
              </div>
            </div>
            
            <div className="bg-gray-50 dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 p-4 h-[500px] flex flex-col">
              {/* 消息区域 */}
              <div className="flex-1 overflow-y-auto mb-4 space-y-4">
                {messages.length === 0 ? (
                  <div className="h-full flex items-center justify-center text-center">
                    <div>
                      <Brain className="mx-auto mb-2 text-gray-400" size={32} />
                      <p className="text-gray-500">选择模型并发送消息开始对话</p>
                      <p className="text-caption mt-2">当前模型: {selectedModel ? selectedModel.name : '未选择'}</p>
                    </div>
                  </div>
                ) : (
                  messages.map(message => (
                    <div 
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : message.role === 'system' ? 'justify-center' : 'justify-start'}`}
                    >
                      <div 
                        className={`max-w-[80%] p-3 rounded-md ${
                          message.role === 'user' 
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-800 dark:text-blue-200' 
                            : message.role === 'system'
                            ? 'bg-purple-50 dark:bg-purple-900/20 text-purple-800 dark:text-purple-200 text-xs'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                        }`}
                      >
                        {message.role === 'system' ? (
                          <div className="flex items-center gap-2">
                            <Settings size={12} />
                            <span>系统提示: {message.content}</span>
                          </div>
                        ) : (
                          <div>
                            <div className="whitespace-pre-wrap text-sm">{message.content}</div>
                            <div className="flex justify-end mt-1">
                              <p className="text-caption">{message.timestamp.toLocaleTimeString()}</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
                
                {/* 打字指示器 */}
                {isTyping && (
                  <div className="flex justify-start">
                    <div className="bg-gray-200 dark:bg-gray-700 p-3 rounded-md max-w-[80%]">
                      <div className="flex gap-2">
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce"></div>
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{animationDelay: '0.2s'}}></div>
                        <div className="w-2 h-2 rounded-full bg-gray-400 animate-bounce" style={{animationDelay: '0.4s'}}></div>
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 滚动到底部的引用 */}
                <div ref={messagesEndRef} />
              </div>
              
              {/* 输入区域 */}
              <div className="flex gap-2">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="输入您的消息..."
                  rows={3}
                  className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 text-sm resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                />
                <button
                  onClick={handleSendMessage}
                  disabled={!inputValue.trim() || !selectedModel || isTyping}
                  className="btn-minimal btn-primary self-end"
                >
                  {isTyping ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </div>
            </div>
            
            {/* 模型信息 */}
            {selectedModel && (
              <div className="mt-4 grid grid-cols-4 gap-3 text-center">
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <div className="text-caption">价格</div>
                  <div className="text-sm font-semibold text-blue-600">${selectedModel.output_price}/1M tokens</div>
                </div>
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <div className="text-caption">质量</div>
                  <div className="text-sm font-semibold text-green-600">{selectedModel.quality_index || 'N/A'}</div>
                </div>
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <div className="text-caption">速度</div>
                  <div className="text-sm font-semibold text-yellow-600">{selectedModel.output_speed.toFixed(0)} tok/s</div>
                </div>
                <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-md">
                  <div className="text-caption">上下文</div>
                  <div className="text-sm font-semibold text-purple-600">{Math.round(selectedModel.context_window/1000)}K</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 使用工具提示 */}
      <div className="card-minimal bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
        <h3 className="text-subheading mb-2 text-blue-800 dark:text-blue-300">提示与技巧</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div>
            <h4 className="font-semibold mb-1 text-blue-700 dark:text-blue-400">写出好提示词</h4>
            <p className="text-blue-800 dark:text-blue-300 text-body-sm">明确目标，提供背景，使用具体的例子，分步骤引导模型</p>
          </div>
          <div>
            <h4 className="font-semibold mb-1 text-blue-700 dark:text-blue-400">选择合适的模型</h4>
            <p className="text-blue-800 dark:text-blue-300 text-body-sm">编程任务选择coding类模型，创意内容选择高温度参数</p>
          </div>
          <div>
            <h4 className="font-semibold mb-1 text-blue-700 dark:text-blue-400">优化成本</h4>
            <p className="text-blue-800 dark:text-blue-300 text-body-sm">精简输入，选择合适规模的模型，对频繁任务创建模板</p>
          </div>
        </div>
      </div>

      {/* AI Workflow Advisor */}
      <AIWorkflowAdvisor
        onComponentAdd={(component, type) => {
          if (type === 'llm') {
            setSelectedModel(component as LLMModel);
          }
        }}
      />
    </div>
  );
};

export default LLMPlayground;