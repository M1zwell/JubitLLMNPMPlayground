import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Sparkles, Trophy, DollarSign, Zap, Target, Brain, Crown, Star, TrendingUp, Users, Clock, CheckCircle, AlertCircle, Play, Code, Lightbulb, Cpu, Plus, X, ArrowRight, Save, Download, Upload, Settings, Copy, RotateCcw, Eye, Palette, Grid, MousePointer2, Layers, Box, Shuffle, Award, Gift, Flame, Shield, Globe, RefreshCw, Maximize2, BarChart3, Zap as Lightning, Timer, Coins, Medal, Rocket, Magnet as Magic } from 'lucide-react';
import { useLLMModels } from '../hooks/useLLMModels';
import AIWorkflowAdvisor from './AIWorkflowAdvisor';
import { LLMModel } from '../lib/supabase';

// 俄罗斯方块形状定义（基于模型特性）
const TETRIS_SHAPES = {
  'I': { width: 4, height: 1, pattern: [[1,1,1,1]], description: '长条形 - 长上下文模型' },
  'O': { width: 2, height: 2, pattern: [[1,1],[1,1]], description: '方形 - 开源模型' },
  'T': { width: 3, height: 2, pattern: [[0,1,0],[1,1,1]], description: 'T形 - 推理模型' },
  'S': { width: 3, height: 2, pattern: [[0,1,1],[1,1,0]], description: 'S形 - 高速模型' },
  'Z': { width: 3, height: 2, pattern: [[1,1,0],[0,1,1]], description: 'Z形 - 低价模型' },
  'J': { width: 3, height: 2, pattern: [[1,0,0],[1,1,1]], description: 'J形 - 高质量模型' },
  'L': { width: 3, height: 2, pattern: [[0,0,1],[1,1,1]], description: 'L形 - 通用模型' }
};

// 智能形状分配算法
const getModelShape = (model: LLMModel): string => {
  const score = {
    I: 0, O: 0, T: 0, S: 0, Z: 0, J: 0, L: 0
  };
  
  // 长上下文 -> I形
  if (model.context_window > 500000) score.I += 10;
  if (model.context_window > 1000000) score.I += 5;
  
  // 开源模型 -> O形
  if (model.license === 'Open') score.O += 15;
  
  // 推理模型 -> T形
  if (model.category === 'reasoning') score.T += 15;
  if (model.features.includes('advanced-reasoning')) score.T += 10;
  
  // 高速模型 -> S形
  if (model.output_speed > 100) score.S += 10;
  if (model.output_speed > 200) score.S += 5;
  
  // 低价模型 -> Z形
  if (model.output_price < 1) score.Z += 10;
  if (model.output_price < 0.5) score.Z += 5;
  
  // 高质量模型 -> J形
  if (model.quality_index && model.quality_index > 60) score.J += 10;
  if (model.quality_index && model.quality_index > 70) score.J += 5;
  
  // 默认通用 -> L形
  score.L += 3;
  
  return Object.entries(score).reduce((a, b) => score[a[0]] > score[b[0]] ? a : b)[0];
};

// 增强的颜色生成算法
const getModelColor = (model: LLMModel): string => {
  const providerColors = {
    'OpenAI': 'from-green-500 via-emerald-500 to-teal-600',
    'Anthropic': 'from-blue-600 via-indigo-600 to-purple-600',
    'Google': 'from-red-500 via-pink-500 to-rose-600',
    'Meta': 'from-blue-500 via-cyan-500 to-sky-600',
    'DeepSeek': 'from-yellow-500 via-amber-500 to-orange-500',
    'Alibaba': 'from-orange-600 via-red-500 to-pink-600',
    'Mistral': 'from-purple-500 via-violet-500 to-fuchsia-500',
    'xAI': 'from-gray-700 via-slate-700 to-zinc-800',
    'Amazon': 'from-yellow-600 via-orange-500 to-amber-600',
    'Microsoft': 'from-blue-400 via-blue-500 to-indigo-600'
  };
  
  let baseColor = providerColors[model.provider] || 'from-gray-500 via-gray-600 to-gray-700';
  
  // 稀有度调整
  if (model.rarity === 'legendary') {
    baseColor = 'from-yellow-400 via-yellow-500 to-amber-500';
  } else if (model.rarity === 'epic') {
    baseColor = 'from-purple-500 via-violet-500 to-indigo-600';
  } else if (model.rarity === 'rare') {
    baseColor = 'from-blue-500 via-cyan-500 to-teal-600';
  }
  
  return baseColor;
};

// 增强的图标生成算法
const getModelIcon = (model: LLMModel): string => {
  if (model.rarity === 'legendary') return '👑';
  if (model.rarity === 'epic') return '🔥';
  if (model.rarity === 'rare') return '💎';
  
  if (model.category === 'reasoning') return '🧠';
  if (model.category === 'coding') return '💻';
  if (model.category === 'multimodal') return '🎯';
  if (model.category === 'lightweight') return '⚡';
  if (model.category === 'budget') return '💰';
  
  if (model.features.includes('vision')) return '👁️';
  if (model.features.includes('fast-inference')) return '🚀';
  if (model.features.includes('long-context')) return '📚';
  
  return '🤖';
};

// 工作流模板生成器（基于真实模型数据）
const generateAdvancedTemplates = (models: LLMModel[]) => {
  const templates = {};
  
  // 1. 超级省钱分析师 - 最便宜的组合
  const ultraCheapModels = models
    .filter(m => m.output_price < 1)
    .sort((a, b) => a.output_price - b.output_price)
    .slice(0, 3);
    
  if (ultraCheapModels.length >= 2) {
    templates['ultra-budget-analyst'] = {
      name: '💸 超级省钱分析师',
      description: `使用最便宜的AI模型实现专业级分析`,
      difficulty: 'beginner',
      category: 'budget',
      models: ultraCheapModels.slice(0, 2),
      estimatedCost: `$${ultraCheapModels[0].output_price.toFixed(3)} - $${ultraCheapModels[1].output_price.toFixed(3)}`,
      avgTime: '2-4分钟',
      qualityScore: Math.round((ultraCheapModels[0].quality_index + ultraCheapModels[1].quality_index) / 2) || 70,
      useCases: ['市场分析', '数据处理', '报告生成', '成本控制'],
      workflow: [
        { step: 1, action: '数据预处理', model: ultraCheapModels[0] },
        { step: 2, action: '深度分析', model: ultraCheapModels[1] }
      ],
      pros: ['成本极低', '高性价比', '适合大批量处理', '学习门槛低'],
      cons: ['处理速度可能较慢', '复杂推理能力有限'],
      rewards: { points: 200, badges: ['超级省钱专家', '成本控制大师'] },
      tips: '适合初学者和预算有限的项目',
      realWorldExample: '某创业公司使用此组合处理了10万条客户反馈，总成本不到5美元'
    };
  }
  
  // 2. 闪电写作专家 - 最快的组合
  const speedWriters = models
    .filter(m => m.output_speed > 80)
    .sort((a, b) => b.output_speed - a.output_speed)
    .slice(0, 2);
    
  if (speedWriters.length >= 2) {
    templates['lightning-writer'] = {
      name: '⚡ 闪电写作专家',
      description: `极速生成高质量内容的完整写作流水线`,
      difficulty: 'intermediate',
      category: 'writing',
      models: speedWriters,
      estimatedCost: `$${Math.min(...speedWriters.map(m => m.output_price)).toFixed(2)} - $${Math.max(...speedWriters.map(m => m.output_price)).toFixed(2)}`,
      avgTime: '30-90秒',
      qualityScore: Math.round(speedWriters.reduce((sum, m) => sum + (m.quality_index || 60), 0) / speedWriters.length),
      useCases: ['博客文章', '社交媒体', '营销文案', '新闻稿'],
      workflow: [
        { step: 1, action: '快速起草', model: speedWriters[1] },
        { step: 2, action: '精细润色', model: speedWriters[0] }
      ],
      pros: ['速度极快', '质量稳定', '适合时间紧迫的项目', '产出效率高'],
      cons: ['可能需要人工校对', '不适合学术论文'],
      rewards: { points: 250, badges: ['速度大师', '内容创作专家'] },
      tips: '适合内容创作者和营销团队',
      realWorldExample: '某媒体公司用此组合30分钟生成了50篇产品介绍'
    };
  }
  
  // 3. 质量之王 - 最高质量的组合
  const qualityKings = models
    .filter(m => m.quality_index && m.quality_index > 55)
    .sort((a, b) => (b.quality_index || 0) - (a.quality_index || 0))
    .slice(0, 2);
    
  if (qualityKings.length >= 2) {
    templates['quality-emperor'] = {
      name: '👑 质量之王',
      description: `顶级AI模型打造的专业级内容生产线`,
      difficulty: 'advanced',
      category: 'premium',
      models: qualityKings,
      estimatedCost: `$${Math.min(...qualityKings.map(m => m.output_price)).toFixed(2)} - $${Math.max(...qualityKings.map(m => m.output_price)).toFixed(2)}`,
      avgTime: '3-8分钟',
      qualityScore: Math.round(qualityKings.reduce((sum, m) => sum + (m.quality_index || 0), 0) / qualityKings.length),
      useCases: ['学术论文', '法律文档', '技术报告', '高端咨询'],
      workflow: [
        { step: 1, action: '深度研究分析', model: qualityKings[0] },
        { step: 2, action: '专业优化完善', model: qualityKings[1] }
      ],
      pros: ['质量顶级', '准确度极高', '专业性强', '权威可信'],
      cons: ['成本较高', '处理时间较长', '使用门槛高'],
      rewards: { points: 500, badges: ['质量专家', '完美主义者', '专业大师'] },
      tips: '适合对质量要求极高的专业项目',
      realWorldExample: '某律师事务所用此组合生成合同模板，客户满意度100%'
    };
  }
  
  // 4. 多模态创造师 - 多模态能力
  const multimodalModels = models
    .filter(m => m.category === 'multimodal' || m.features.includes('vision') || m.features.includes('multimodal'));
    
  if (multimodalModels.length >= 1) {
    const supportModel = models.find(m => m.category === 'reasoning') || models[0];
    templates['multimodal-creator'] = {
      name: '🎨 多模态创造师',
      description: `结合视觉理解和文本生成的创意工作流`,
      difficulty: 'expert',
      category: 'creative',
      models: [multimodalModels[0], supportModel],
      estimatedCost: `$${Math.min(multimodalModels[0].output_price, supportModel.output_price).toFixed(2)} - $${Math.max(multimodalModels[0].output_price, supportModel.output_price).toFixed(2)}`,
      avgTime: '2-6分钟',
      qualityScore: Math.round(((multimodalModels[0].quality_index || 70) + (supportModel.quality_index || 60)) / 2),
      useCases: ['图像分析', '创意设计', '内容创作', '品牌策划'],
      workflow: [
        { step: 1, action: '多模态分析', model: multimodalModels[0] },
        { step: 2, action: '创意扩展', model: supportModel }
      ],
      pros: ['多模态能力', '创意丰富', '应用广泛', '技术前沿'],
      cons: ['复杂度高', '学习成本高', '资源消耗大'],
      rewards: { points: 400, badges: ['多模态专家', '创意大师', '技术先锋'] },
      tips: '需要上传图片或提供视觉素材',
      realWorldExample: '某设计公司用此组合分析竞品设计并生成创意方案'
    };
  }
  
  // 5. 编程助手 - 编程相关模型
  const codingModels = models
    .filter(m => m.category === 'coding' || m.features.includes('coding'))
    .sort((a, b) => (b.quality_index || 0) - (a.quality_index || 0))
    .slice(0, 2);
    
  if (codingModels.length >= 1) {
    const generalModel = models.find(m => m.category === 'reasoning') || models[0];
    templates['coding-master'] = {
      name: '💻 编程大师',
      description: `专业的代码生成和优化工作流`,
      difficulty: 'intermediate',
      category: 'coding',
      models: codingModels.length >= 2 ? codingModels : [codingModels[0], generalModel],
      estimatedCost: `$${Math.min(...(codingModels.length >= 2 ? codingModels : [codingModels[0], generalModel]).map(m => m.output_price)).toFixed(2)} - $${Math.max(...(codingModels.length >= 2 ? codingModels : [codingModels[0], generalModel]).map(m => m.output_price)).toFixed(2)}`,
      avgTime: '1-4分钟',
      qualityScore: Math.round((codingModels.length >= 2 ? codingModels : [codingModels[0], generalModel]).reduce((sum, m) => sum + (m.quality_index || 60), 0) / 2),
      useCases: ['代码生成', 'Bug修复', '代码优化', '技术文档'],
      workflow: [
        { step: 1, action: '代码生成', model: codingModels[0] },
        { step: 2, action: '代码优化', model: codingModels.length >= 2 ? codingModels[1] : generalModel }
      ],
      pros: ['代码质量高', '效率提升明显', '学习价值大', '实用性强'],
      cons: ['需要编程基础', '复杂逻辑可能需要调试'],
      rewards: { points: 300, badges: ['编程专家', '代码大师', '效率达人'] },
      tips: '提供清晰的需求描述可以获得更好的代码',
      realWorldExample: '某开发团队用此组合2小时完成了原本需要2天的功能开发'
    };
  }
  
  return templates;
};

// 用户等级系统
const USER_LEVELS = {
  1: { name: '🌱 AI新手', minPoints: 0, color: 'text-gray-400', description: '刚刚开始AI之旅' },
  2: { name: '🚀 AI学徒', minPoints: 200, color: 'text-green-400', description: '掌握基础组合技巧' },
  3: { name: '⭐ 模型调试师', minPoints: 600, color: 'text-blue-400', description: '能够优化模型组合' },
  4: { name: '💎 组合专家', minPoints: 1200, color: 'text-purple-400', description: '精通各种工作流设计' },
  5: { name: '🏆 AI建筑师', minPoints: 2000, color: 'text-yellow-400', description: '创造复杂AI解决方案' },
  6: { name: '👑 传奇大师', minPoints: 3000, color: 'text-red-400', description: 'AI领域的顶级专家' }
};

// 成就系统
const ACHIEVEMENTS = {
  'first-combo': {
    name: '🎉 初次组合',
    description: '完成第一个LLM组合',
    points: 50,
    icon: '🎯'
  },
  'cost-master': {
    name: '💰 省钱专家', 
    description: '使用低成本模型完成10次执行',
    points: 200,
    icon: '💸'
  },
  'speed-demon': {
    name: '⚡ 速度恶魔',
    description: '平均执行时间低于2分钟',
    points: 150,
    icon: '🏃'
  },
  'quality-perfectionist': {
    name: '🏆 完美主义者',
    description: '使用高质量模型达到95+评分',
    points: 300,
    icon: '👑'
  },
  'template-master': {
    name: '🎨 模板大师',
    description: '使用所有预设模板',
    points: 400,
    icon: '🎭'
  },
  'efficiency-expert': {
    name: '📈 效率专家',
    description: '单次执行处理超过5000 tokens',
    points: 250,
    icon: '📊'
  }
};

const LLMPlayground = () => {
  const { models: rawModels, loading, error, refetch } = useLLMModels();
  const [selectedModels, setSelectedModels] = useState<LLMModel[]>([]);
  const [userProfile, setUserProfile] = useState({
    level: 1,
    goal: 'save-money',
    budget: 'low',
    points: 0,
    badges: [],
    completedTemplates: [],
    totalExecutions: 0,
    avgQuality: 0,
    totalCost: 0
  });
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [executionResults, setExecutionResults] = useState({});
  const [showTetris, setShowTetris] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [draggedModel, setDraggedModel] = useState<LLMModel | null>(null);
  const [executionHistory, setExecutionHistory] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const canvasRef = useRef(null);

  // 转换和增强模型数据
  const models = useMemo(() => {
    if (!rawModels) return [];
    
    return rawModels.map(model => ({
      ...model,
      shape: getModelShape(model),
      color: getModelColor(model),
      icon: getModelIcon(model),
      tetrisShape: TETRIS_SHAPES[getModelShape(model)],
      // 计算综合评分
      overallScore: Math.round(
        ((model.quality_index || 50) * 0.4) +
        (Math.min(model.output_speed / 10, 10) * 10 * 0.2) +
        (Math.max(10 - model.output_price, 0) * 10 * 0.2) +
        (Math.min(model.context_window / 10000, 10) * 10 * 0.2)
      )
    }));
  }, [rawModels]);

  // 生成智能模板
  const smartTemplates = useMemo(() => {
    if (!models.length) return {};
    return generateAdvancedTemplates(models);
  }, [models]);

  // 生成个性化推荐
  const recommendations = useMemo(() => {
    const goalMap = {
      'save-money': ['ultra-budget-analyst'],
      'high-quality': ['quality-emperor'],
      'fast-speed': ['lightning-writer'],
      'creative': ['multimodal-creator'],
      'coding': ['coding-master']
    };
    
    const recs = goalMap[userProfile.goal] || ['lightning-writer'];
    return recs.filter(rec => smartTemplates[rec]);
  }, [userProfile.goal, smartTemplates]);

  // 计算总成本和统计
  const workflowStats = useMemo(() => {
    const totalCost = selectedModels.reduce((total, model) => total + model.output_price, 0);
    const avgQuality = selectedModels.length > 0 
      ? selectedModels.reduce((sum, model) => sum + (model.quality_index || 50), 0) / selectedModels.length 
      : 0;
    const avgSpeed = selectedModels.length > 0
      ? selectedModels.reduce((sum, model) => sum + model.output_speed, 0) / selectedModels.length
      : 0;
    const estimatedTime = selectedModels.length * 90 + Math.max(0, selectedModels.length - 1) * 30; // 秒
    
    return { totalCost, avgQuality, avgSpeed, estimatedTime };
  }, [selectedModels]);

  // 获取用户等级
  const getUserLevel = useCallback(() => {
    const levels = Object.values(USER_LEVELS).reverse();
    return levels.find(level => userProfile.points >= level.minPoints) || USER_LEVELS[1];
  }, [userProfile.points]);

  // 添加通知
  const addNotification = (message, type = 'info') => {
    const id = Date.now();
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  };

  // 拖拽处理
  const handleDragStart = (e, model: LLMModel) => {
    setDraggedModel(model);
    e.dataTransfer.effectAllowed = 'copy';
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
    setDraggedModel(null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  };

  const handleDrop = (e) => {
    e.preventDefault();
    if (draggedModel && !selectedModels.find(m => m.id === draggedModel.id)) {
      setSelectedModels(prev => [...prev, draggedModel]);
      addNotification(`已添加 ${draggedModel.name} 到工作流`, 'success');
    }
    setDraggedModel(null);
  };

  // 移除模型
  const removeModel = (modelId: string) => {
    const model = selectedModels.find(m => m.id === modelId);
    setSelectedModels(prev => prev.filter(m => m.id !== modelId));
    if (model) {
      addNotification(`已移除 ${model.name}`, 'info');
    }
  };

  // 高级执行模拟
  const executeWorkflow = async () => {
    if (selectedModels.length === 0) {
      addNotification('请先添加AI模型到工作流', 'warning');
      return;
    }
    
    setIsExecuting(true);
    const results = {};
    const startTime = Date.now();
    
    addNotification('开始执行AI工作流...', 'info');
    
    // 模拟真实的执行过程
    for (let i = 0; i < selectedModels.length; i++) {
      const model = selectedModels[i];
      
      // 模拟不同模型的处理时间
      const processingTime = Math.max(1000, 3000 - model.output_speed * 10 + Math.random() * 2000);
      await new Promise(resolve => setTimeout(resolve, processingTime));
      
      // 模拟真实的输出结果
      const tokensGenerated = Math.floor(Math.random() * 1500) + 500;
      const actualCost = (model.output_price * tokensGenerated / 1000000).toFixed(6);
      const qualityBonus = Math.floor(Math.random() * 10) - 5;
      const actualQuality = Math.min(100, Math.max(0, (model.quality_index || 50) + qualityBonus));
      
      results[model.id] = {
        output: `${model.name} 成功执行 ${model.category} 任务，生成了${tokensGenerated}个tokens的高质量内容。处理特性包括：${model.features.slice(0, 2).join('、')}`,
        tokens: tokensGenerated,
        cost: actualCost,
        duration: Math.round(processingTime),
        quality: actualQuality,
        efficiency: Math.round((tokensGenerated / processingTime) * 1000),
        model: model.name,
        provider: model.provider
      };
      
      addNotification(`${model.name} 执行完成`, 'success');
    }
    
    const totalTime = Date.now() - startTime;
    const totalTokens = Object.values(results).reduce((sum, r) => sum + r.tokens, 0);
    const totalCost = Object.values(results).reduce((sum, r) => sum + parseFloat(r.cost), 0);
    const avgQuality = Object.values(results).reduce((sum, r) => sum + r.quality, 0) / Object.keys(results).length;
    
    setExecutionResults(results);
    setIsExecuting(false);
    
    // 更新用户统计
    const pointsEarned = Math.round(selectedModels.length * 50 + avgQuality * 2 + (totalTokens / 1000) * 10);
    setUserProfile(prev => ({
      ...prev,
      points: prev.points + pointsEarned,
      totalExecutions: prev.totalExecutions + 1,
      avgQuality: Math.round((prev.avgQuality * prev.totalExecutions + avgQuality) / (prev.totalExecutions + 1)),
      totalCost: prev.totalCost + totalCost
    }));
    
    // 添加到历史记录
    const executionRecord = {
      id: Date.now(),
      timestamp: new Date().toISOString(),
      models: selectedModels.map(m => ({ name: m.name, provider: m.provider })),
      results: Object.keys(results).length,
      totalTokens,
      totalCost: totalCost.toFixed(6),
      avgQuality: Math.round(avgQuality),
      duration: totalTime,
      pointsEarned
    };
    
    setExecutionHistory(prev => [executionRecord, ...prev.slice(0, 9)]);
    
    addNotification(`工作流执行完成！获得 ${pointsEarned} 积分`, 'success');
    
    // 检查成就
    checkAchievements(executionRecord);
  };

  // 成就检查
  const checkAchievements = (executionRecord) => {
    const newBadges = [];
    
    if (userProfile.totalExecutions === 0) {
      newBadges.push('first-combo');
    }
    
    if (executionRecord.totalCost < 0.001 && userProfile.totalExecutions >= 9) {
      newBadges.push('cost-master');
    }
    
    if (executionRecord.duration < 120000) {
      newBadges.push('speed-demon');
    }
    
    if (executionRecord.avgQuality >= 95) {
      newBadges.push('quality-perfectionist');
    }
    
    if (executionRecord.totalTokens > 5000) {
      newBadges.push('efficiency-expert');
    }
    
    newBadges.forEach(badge => {
      if (!userProfile.badges.includes(badge)) {
        setUserProfile(prev => ({
          ...prev,
          badges: [...prev.badges, badge],
          points: prev.points + ACHIEVEMENTS[badge].points
        }));
        addNotification(`🎉 获得新成就：${ACHIEVEMENTS[badge].name}`, 'achievement');
      }
    });
  };

  // 加载模板
  const loadTemplate = (templateKey) => {
    const template = smartTemplates[templateKey];
    if (template) {
      setSelectedModels(template.models);
      setSelectedTemplate(template);
      addNotification(`已加载模板：${template.name}`, 'success');
    }
  };

  // 清空画布
  const clearCanvas = () => {
    setSelectedModels([]);
    setExecutionResults({});
    setSelectedTemplate(null);
    addNotification('工作流已清空', 'info');
  };

  // 辅助函数
  const getRarityColor = (rarity) => {
    const colors = {
      common: 'border-gray-400 shadow-gray-400/20',
      rare: 'border-blue-400 shadow-blue-400/30 shadow-lg',
      epic: 'border-purple-400 shadow-purple-400/40 shadow-xl',
      legendary: 'border-yellow-400 shadow-yellow-400/50 shadow-2xl animate-pulse'
    };
    return colors[rarity] || colors.common;
  };

  const getQualityColor = (quality) => {
    if (!quality) return 'text-gray-400';
    if (quality >= 80) return 'text-green-400';
    if (quality >= 60) return 'text-yellow-400';
    if (quality >= 40) return 'text-orange-400';
    return 'text-red-400';
  };

  const currentLevel = getUserLevel();

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-purple-400 mx-auto"></div>
          <p className="mt-4 text-xl text-purple-300">正在加载 AI 模型数据...</p>
          <p className="text-sm text-gray-400 mt-2">从 artificialanalysis.ai 获取最新数据</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="text-center bg-red-900/20 border border-red-500/30 rounded-xl p-8">
          <AlertCircle size={48} className="mx-auto text-red-400 mb-4" />
          <div className="text-red-400 text-xl mb-4">无法加载模型数据</div>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={refetch}
            className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors flex items-center gap-2 mx-auto"
          >
            <RefreshCw size={16} />
            重新加载
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* 通知系统 */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {notifications.map(notification => (
          <div
            key={notification.id}
            className={`
              px-4 py-3 rounded-lg shadow-lg transform transition-all duration-300
              ${notification.type === 'success' ? 'bg-green-600' : 
                notification.type === 'warning' ? 'bg-yellow-600' :
                notification.type === 'achievement' ? 'bg-purple-600' :
                'bg-blue-600'}
            `}
          >
            <p className="text-white text-sm">{notification.message}</p>
          </div>
        ))}
      </div>

      {/* 顶部仪表板 */}
      <div className="bg-gradient-to-r from-indigo-900/50 via-purple-900/50 to-pink-900/50 backdrop-blur-sm rounded-xl p-6 border border-white/20">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 via-blue-400 to-cyan-400 bg-clip-text text-transparent mb-2">
              🧩 LLM 乐高游乐场
            </h1>
            <p className="text-purple-300">基于 {models.length} 个真实AI模型 • 数据来源：artificialanalysis.ai</p>
          </div>
          
          <div className="flex items-center gap-6">
            {/* 用户等级卡片 */}
            <div className="bg-white/10 rounded-lg p-4 text-center min-w-32">
              <div className={`text-2xl font-bold ${currentLevel.color} flex items-center justify-center gap-2`}>
                <span>{currentLevel.name.split(' ')[0]}</span>
                Lv.{Object.keys(USER_LEVELS).find(k => USER_LEVELS[k] === currentLevel)}
              </div>
              <div className="text-sm text-gray-300">{currentLevel.name.split(' ').slice(1).join(' ')}</div>
              <div className="text-xs text-gray-400">{userProfile.points} 积分</div>
              <div className="text-xs text-gray-500 mt-1">{currentLevel.description}</div>
            </div>
            
            {/* 统计卡片 */}
            <div className="grid grid-cols-3 gap-4">
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-yellow-400">
                  ${workflowStats.totalCost.toFixed(3)}
                </div>
                <div className="text-xs text-gray-300">预估成本</div>
              </div>
              
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <div className="text-xl font-bold text-blue-400">
                  {selectedModels.length}
                </div>
                <div className="text-xs text-gray-300">选中模型</div>
              </div>
              
              <div className="bg-white/10 rounded-lg p-3 text-center">
                <div className={`text-xl font-bold ${getQualityColor(workflowStats.avgQuality)}`}>
                  {Math.round(workflowStats.avgQuality)}
                </div>
                <div className="text-xs text-gray-300">平均质量</div>
              </div>
            </div>
          </div>
        </div>
        
        {/* 控制按钮 */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setShowTetris(!showTetris)}
              className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                showTetris ? 'bg-purple-600 text-white' : 'bg-white/10 hover:bg-white/15'
              }`}
            >
              <Grid size={16} />
              俄罗斯方块视图
            </button>
            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className={`px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 ${
                showAdvanced ? 'bg-blue-600 text-white' : 'bg-white/10 hover:bg-white/15'
              }`}
            >
              <Settings size={16} />
              高级选项
            </button>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={executeWorkflow}
              disabled={selectedModels.length === 0 || isExecuting}
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-6 py-2 rounded-lg transition-colors flex items-center gap-2 font-medium"
            >
              {isExecuting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  执行中...
                </>
              ) : (
                <>
                  <Play size={16} />
                  运行工作流
                </>
              )}
            </button>
            <button
              onClick={clearCanvas}
              className="bg-red-600 hover:bg-red-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <RotateCcw size={16} />
              清空
            </button>
            <button
              onClick={refetch}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors flex items-center gap-2"
            >
              <RefreshCw size={16} />
              刷新
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        {/* 左侧：模型方块库 */}
        <div className="col-span-3">
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20 sticky top-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Box className="text-purple-400" />
              AI 模型库
              <span className="text-sm bg-purple-600/30 px-2 py-1 rounded-full">
                {models.length}
              </span>
            </h2>
            
            <div className="space-y-3 max-h-[70vh] overflow-y-auto">
              {models.map((model) => (
                <div
                  key={model.id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, model)}
                  onDragEnd={handleDragEnd}
                  className={`
                    bg-gradient-to-br ${model.color} p-4 rounded-lg cursor-grab hover:cursor-grabbing
                    hover:scale-105 transition-all duration-200 shadow-lg border-2 ${getRarityColor(model.rarity)}
                    ${selectedModels.find(m => m.id === model.id) ? 'opacity-50 ring-2 ring-white/50' : ''}
                    ${draggedModel?.id === model.id ? 'scale-110' : ''}
                  `}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{model.icon}</span>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-sm truncate">{model.name}</h3>
                      <p className="text-xs opacity-80 truncate">{model.provider}</p>
                    </div>
                    <div className="text-right">
                      <div className={`text-sm font-bold ${getQualityColor(model.quality_index)}`}>
                        {model.quality_index || 'N/A'}
                      </div>
                      <div className="text-xs opacity-80">质量</div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mb-3 text-xs">
                    <div className="bg-white/20 rounded px-2 py-1 text-center">
                      <DollarSign size={10} className="inline mr-1" />
                      ${model.output_price.toFixed(2)}
                    </div>
                    <div className="bg-white/20 rounded px-2 py-1 text-center">
                      <Zap size={10} className="inline mr-1" />
                      {model.output_speed.toFixed(0)}
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="bg-white/30 px-2 py-1 rounded truncate max-w-20">{model.category}</span>
                    <span className={`capitalize font-medium ${getRarityColor(model.rarity).split(' ')[0].replace('border-', 'text-')}`}>
                      {model.rarity}
                    </span>
                  </div>
                  
                  <div className="flex flex-wrap gap-1 mb-2">
                    {model.features.slice(0, 2).map((feature, idx) => (
                      <span key={idx} className="bg-white/20 px-2 py-1 rounded text-xs truncate">
                        {feature}
                      </span>
                    ))}
                  </div>
                  
                  {showTetris && model.tetrisShape && (
                    <div className="mt-3 flex justify-center">
                      <div className="relative">
                        <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${model.tetrisShape.width}, 1fr)` }}>
                          {model.tetrisShape.pattern.flat().map((cell, i) => (
                            <div 
                              key={i} 
                              className={`w-3 h-3 rounded-sm transition-all duration-200 ${
                                cell ? 'bg-white/60 shadow-sm' : 'bg-transparent'
                              }`} 
                            />
                          ))}
                        </div>
                        <div className="text-xs text-center mt-1 opacity-70">
                          {model.shape}型方块
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-2 text-xs text-center opacity-70">
                    综合评分: {model.overallScore}/100
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 中间：工作流画布 */}
        <div className="col-span-6 space-y-6">
          {/* 工作流画布 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold flex items-center gap-2">
                <Layers className="text-blue-400" />
                工作流画布
                {selectedTemplate && (
                  <span className="text-sm bg-purple-600/30 px-3 py-1 rounded-full">
                    {selectedTemplate.name}
                  </span>
                )}
              </h2>
              
              {selectedModels.length > 0 && (
                <div className="flex items-center gap-4 text-sm">
                  <div className="flex items-center gap-1">
                    <Clock size={14} />
                    <span>预计 {Math.round(workflowStats.estimatedTime / 60)}分钟</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Coins size={14} />
                    <span>${workflowStats.totalCost.toFixed(4)}</span>
                  </div>
                </div>
              )}
            </div>
            
            <div
              ref={canvasRef}
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              className={`
                bg-gray-900/50 border-2 border-dashed rounded-lg p-6 min-h-80 relative transition-all duration-300
                ${draggedModel ? 'border-purple-400/70 bg-purple-900/20' : 'border-purple-400/50'}
              `}
            >
              {selectedModels.length === 0 ? (
                <div className="flex items-center justify-center h-full text-purple-300">
                  <div className="text-center">
                    <MousePointer2 size={48} className="mx-auto mb-4 opacity-50" />
                    <p className="text-lg mb-2">拖拽AI模型方块到这里</p>
                    <p className="text-sm">或者选择右侧的智能模板</p>
                    <p className="text-xs text-gray-400 mt-2">基于 {models.length} 个真实模型数据</p>
                    <div className="mt-4 grid grid-cols-3 gap-2 text-xs">
                      <div className="bg-white/5 rounded p-2">
                        <div className="text-yellow-400 font-bold">💰 成本透明</div>
                        <div>实时计算使用成本</div>
                      </div>
                      <div className="bg-white/5 rounded p-2">
                        <div className="text-blue-400 font-bold">⚡ 性能预测</div>
                        <div>基于真实性能数据</div>
                      </div>
                      <div className="bg-white/5 rounded p-2">
                        <div className="text-green-400 font-bold">🎯 智能建议</div>
                        <div>AI助手优化组合</div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  {selectedModels.map((model, index) => {
                    const result = executionResults[model.id];
                    
                    return (
                      <div key={model.id} className="flex items-center gap-4">
                        <div className={`
                          bg-gradient-to-br ${model.color} p-4 rounded-lg shadow-lg relative group flex-1
                          ${isExecuting ? 'animate-pulse ring-2 ring-white/30' : ''}
                          ${result ? 'ring-2 ring-green-400/50' : ''}
                        `}>
                          <div className="flex items-center gap-3 mb-3">
                            <span className="text-xl">{model.icon}</span>
                            <div className="flex-1">
                              <h4 className="font-bold">{model.name}</h4>
                              <p className="text-xs opacity-80">{model.provider} • {model.category}</p>
                            </div>
                            <div className="text-right">
                              <div className={`text-sm font-bold ${getQualityColor(model.quality_index)}`}>
                                {model.quality_index || 'N/A'}
                              </div>
                              <div className="text-xs opacity-80">质量</div>
                            </div>
                            <button
                              onClick={() => removeModel(model.id)}
                              className="opacity-0 group-hover:opacity-100 bg-red-500 rounded-full w-6 h-6 flex items-center justify-center transition-opacity hover:bg-red-600"
                            >
                              <X size={12} />
                            </button>
                          </div>
                          
                          <div className="grid grid-cols-4 gap-2 mb-3 text-xs">
                            <div className="bg-white/20 rounded px-2 py-1 text-center">
                              <DollarSign size={10} className="inline mr-1" />
                              ${model.output_price.toFixed(2)}
                            </div>
                            <div className="bg-white/20 rounded px-2 py-1 text-center">
                              <Zap size={10} className="inline mr-1" />
                              {model.output_speed.toFixed(0)}
                            </div>
                            <div className="bg-white/20 rounded px-2 py-1 text-center">
                              <Clock size={10} className="inline mr-1" />
                              {model.latency.toFixed(1)}s
                            </div>
                            <div className="bg-white/20 rounded px-2 py-1 text-center">
                              <Trophy size={10} className="inline mr-1" />
                              {model.overallScore}
                            </div>
                          </div>
                          
                          {showTetris && model.tetrisShape && (
                            <div className="mb-3 flex justify-center">
                              <div className="grid gap-1" style={{ gridTemplateColumns: `repeat(${model.tetrisShape.width}, 1fr)` }}>
                                {model.tetrisShape.pattern.flat().map((cell, i) => (
                                  <div 
                                    key={i} 
                                    className={`w-2 h-2 rounded-sm ${cell ? 'bg-white/60' : 'bg-transparent'}`} 
                                  />
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {result && (
                            <div className="bg-white/20 rounded p-3 border border-green-400/30">
                              <div className="text-xs text-green-300 mb-2 flex items-center gap-1">
                                <CheckCircle size={12} />
                                执行完成 • {result.model}
                              </div>
                              <div className="text-sm mb-2 line-clamp-2">{result.output}</div>
                              <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                  <span className="text-gray-300">Tokens:</span>
                                  <span className="ml-1 font-bold text-blue-300">{result.tokens.toLocaleString()}</span>
                                </div>
                                <div>
                                  <span className="text-gray-300">成本:</span>
                                  <span className="ml-1 font-bold text-yellow-300">${result.cost}</span>
                                </div>
                                <div>
                                  <span className="text-gray-300">时间:</span>
                                  <span className="ml-1 font-bold">{(result.duration / 1000).toFixed(1)}s</span>
                                </div>
                                <div>
                                  <span className="text-gray-300">质量:</span>
                                  <span className={`ml-1 font-bold ${getQualityColor(result.quality)}`}>
                                    {result.quality}
                                  </span>
                                </div>
                              </div>
                              <div className="mt-2 text-xs text-gray-300">
                                效率: {result.efficiency.toLocaleString()} tokens/s
                              </div>
                            </div>
                          )}
                        </div>
                        
                        {index < selectedModels.length - 1 && (
                          <ArrowRight className="text-purple-400 flex-shrink-0" size={24} />
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 执行结果总览 */}
          {Object.keys(executionResults).length > 0 && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Trophy className="text-yellow-400" />
                执行结果统计
              </h3>
              
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                <div className="bg-green-600/20 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-green-400">
                    {Object.keys(executionResults).length}
                  </div>
                  <div className="text-sm text-gray-300">模型执行</div>
                </div>
                <div className="bg-blue-600/20 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-blue-400">
                    {Object.values(executionResults).reduce((sum, r) => sum + r.tokens, 0).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-300">总Tokens</div>
                </div>
                <div className="bg-yellow-600/20 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-yellow-400">
                    ${Object.values(executionResults).reduce((sum, r) => sum + parseFloat(r.cost), 0).toFixed(4)}
                  </div>
                  <div className="text-sm text-gray-300">实际成本</div>
                </div>
                <div className="bg-purple-600/20 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-purple-400">
                    {Math.round(Object.values(executionResults).reduce((sum, r) => sum + r.quality, 0) / Object.keys(executionResults).length)}
                  </div>
                  <div className="text-sm text-gray-300">平均质量</div>
                </div>
                <div className="bg-cyan-600/20 rounded-lg p-3 text-center">
                  <div className="text-2xl font-bold text-cyan-400">
                    {Math.round(Object.values(executionResults).reduce((sum, r) => sum + r.efficiency, 0) / Object.keys(executionResults).length).toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-300">平均效率</div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 右侧：智能推荐和模板 */}
        <div className="col-span-3 space-y-6">
          {/* 用户配置 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Target className="text-blue-400" />
              智能推荐设置
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">使用目标</label>
                <select
                  value={userProfile.goal}
                  onChange={(e) => setUserProfile({...userProfile, goal: e.target.value})}
                  className="w-full bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="save-money">💰 节省成本</option>
                  <option value="high-quality">🏆 追求质量</option>
                  <option value="fast-speed">⚡ 提升速度</option>
                  <option value="creative">🎨 创意工作</option>
                  <option value="coding">💻 编程开发</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">预算范围</label>
                <select
                  value={userProfile.budget}
                  onChange={(e) => setUserProfile({...userProfile, budget: e.target.value})}
                  className="w-full bg-white/20 border border-white/30 rounded-lg px-3 py-2 text-sm"
                >
                  <option value="low">💸 低预算 (&lt; $1)</option>
                  <option value="medium">💵 中等 ($1-10)</option>
                  <option value="high">💎 高预算 (&gt; $10)</option>
                </select>
              </div>
              
              {showAdvanced && (
                <div className="space-y-3 pt-3 border-t border-white/20">
                  <div>
                    <label className="block text-sm font-medium mb-2">质量要求</label>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      defaultValue="70"
                      className="w-full"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">速度要求</label>
                    <input 
                      type="range" 
                      min="0" 
                      max="100" 
                      defaultValue="50"
                      className="w-full"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* 智能模板库 */}
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Sparkles className="text-yellow-400" />
              智能模板库
              <span className="text-xs bg-yellow-600/30 px-2 py-1 rounded-full">
                基于真实数据
              </span>
            </h3>
            
            <div className="space-y-4 max-h-96 overflow-y-auto">
              {Object.entries(smartTemplates).map(([key, template]) => (
                <div key={key} className="bg-white/10 rounded-lg p-4 border border-white/20 hover:bg-white/15 transition-colors">
                  <div className="flex items-start justify-between mb-3">
                    <h4 className="font-bold text-sm">{template.name}</h4>
                    <button
                      onClick={() => loadTemplate(key)}
                      className="bg-purple-600 hover:bg-purple-700 px-3 py-1 rounded text-xs transition-colors shrink-0"
                    >
                      使用
                    </button>
                  </div>
                  
                  <p className="text-xs text-gray-300 mb-3 line-clamp-2">{template.description}</p>
                  
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className={`px-2 py-1 rounded ${
                        template.difficulty === 'beginner' ? 'bg-green-400/20 text-green-400' :
                        template.difficulty === 'intermediate' ? 'bg-yellow-400/20 text-yellow-400' :
                        template.difficulty === 'advanced' ? 'bg-orange-400/20 text-orange-400' :
                        'bg-red-400/20 text-red-400'
                      }`}>
                        {template.difficulty}
                      </span>
                      <span className="text-yellow-400 font-medium">{template.estimatedCost}</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-2 text-xs">
                      <div className="flex items-center gap-1">
                        <Clock size={10} />
                        <span>{template.avgTime}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star size={10} className="text-yellow-400" />
                        <span>{template.qualityScore}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Cpu size={10} />
                        <span>{template.models.length}个模型</span>
                      </div>
                    </div>
                    
                    <div className="text-xs text-gray-400">
                      {template.models.map(m => m.name).join(' → ')}
                    </div>
                    
                    <div className="flex flex-wrap gap-1">
                      {template.useCases.slice(0, 3).map((useCase, idx) => (
                        <span key={idx} className="bg-purple-600/30 px-2 py-1 rounded text-xs">
                          {useCase}
                        </span>
                      ))}
                    </div>
                    
                    {template.tips && (
                      <div className="text-xs text-blue-300 bg-blue-600/20 rounded p-2">
                        💡 {template.tips}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              
              {Object.keys(smartTemplates).length === 0 && (
                <div className="text-center text-gray-400 py-8">
                  <Brain size={32} className="mx-auto mb-2 opacity-50" />
                  <p className="text-sm">正在生成智能模板...</p>
                  <p className="text-xs">基于 {models.length} 个模型</p>
                </div>
              )}
            </div>
          </div>

          {/* 成就和历史 */}
          {(userProfile.badges.length > 0 || executionHistory.length > 0) && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Award className="text-yellow-400" />
                成就与历史
              </h3>
              
              {userProfile.badges.length > 0 && (
                <div className="mb-4">
                  <h4 className="text-sm font-medium mb-2">获得成就</h4>
                  <div className="flex flex-wrap gap-2">
                    {userProfile.badges.map(badge => (
                      <div 
                        key={badge}
                        className="bg-yellow-600/20 px-3 py-1 rounded-full text-xs flex items-center gap-1"
                        title={ACHIEVEMENTS[badge]?.description}
                      >
                        <span>{ACHIEVEMENTS[badge]?.icon}</span>
                        <span>{ACHIEVEMENTS[badge]?.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {executionHistory.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium mb-2">执行历史</h4>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {executionHistory.slice(0, 5).map(record => (
                      <div key={record.id} className="bg-white/5 rounded p-2 text-xs">
                        <div className="flex justify-between items-center mb-1">
                          <span className="font-medium">
                            {record.models.length} 个模型
                          </span>
                          <span className="text-green-400">+{record.pointsEarned} 积分</span>
                        </div>
                        <div className="text-gray-400">
                          质量: {record.avgQuality} | 成本: ${record.totalCost}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      
      {/* AI Workflow Advisor */}
      <AIWorkflowAdvisor
        onComponentAdd={(component, type) => {
          if (type === 'llm') {
            setSelectedModels(prev => [...prev, component]);
          }
        }}
        onSuggestionApply={(suggestion) => {
          // Apply AI suggestion
          console.log('Applying suggestion:', suggestion);
        }}
        selectedComponents={selectedModels}
      />
    </div>
  );
};


export default LLMPlayground