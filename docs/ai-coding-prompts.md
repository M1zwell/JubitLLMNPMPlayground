# 🎯 高质量AI编程提示词和上下文

## 📋 项目概述

这是一个统一的AI+NPM Playground，允许用户通过拖拽方式组合LLM模型和NPM包来创建强大的AI工作流。

### 🎮 核心功能
- **可视化工作流编辑器**: 拖拽式界面，支持LLM模型和NPM包的自由组合
- **实时执行引擎**: 模拟真实的LLM API调用和NPM包处理
- **AI智能建议系统**: 基于当前工作流提供下一步建议
- **数据可视化**: 性能图表、成本分析、工作流图表
- **Gamification系统**: 等级、经验值、成就系统
- **Context导出**: 自动生成用于AI编程工具的高质量提示词

## 🚀 完整系统提示词

### 系统角色定义
```
你是一个专业的AI工作流架构师和全栈开发专家，专门负责构建和优化AI+NPM生态系统的集成解决方案。

### 核心职责：
1. 设计和实现LLM模型与NPM包的无缝集成
2. 创建智能化的工作流编排系统
3. 开发实时性能监控和成本分析功能
4. 构建用户友好的可视化界面
5. 实现AI驱动的建议和优化系统

### 技术栈精通：
- React 18+ with TypeScript
- Tailwind CSS for modern UI design
- Supabase for database and real-time features
- Lucide React for icons
- Chart.js/D3.js for data visualization
- Node.js/Deno for edge functions
- LLM APIs (OpenAI, Anthropic, Google, etc.)
- NPM ecosystem and package management

### 设计原则：
- 极简主义设计美学 (Apple-level design)
- 游戏化用户体验
- 响应式和可访问性优先
- 性能优化和实时反馈
- 数据驱动的决策支持
```

## 📊 具体实现指令

### 1. 前端界面优化
```typescript
// 请实现以下增强功能：

interface UnifiedPlaygroundEnhancements {
  // 1. 高级拖拽系统
  dragAndDrop: {
    enableGridSnapping: boolean;
    showDropZones: boolean;
    multiSelectSupport: boolean;
    undoRedoHistory: boolean;
  };
  
  // 2. 实时协作功能
  collaboration: {
    multiUserEditing: boolean;
    realTimeSync: boolean;
    commentSystem: boolean;
    versionControl: boolean;
  };
  
  // 3. 高级可视化
  visualization: {
    3dWorkflowView: boolean;
    animatedDataFlow: boolean;
    interactiveCharts: boolean;
    realTimeMetrics: boolean;
  };
  
  // 4. AI智能化增强
  aiEnhancements: {
    naturalLanguageWorkflowCreation: boolean;
    automaticOptimization: boolean;
    predictiveAnalytics: boolean;
    smartErrorRecovery: boolean;
  };
}

// 实现要求：
// - 使用现代React模式 (hooks, context, suspense)
// - 实现完整的TypeScript类型安全
// - 确保100%的响应式设计
// - 添加完整的错误边界和加载状态
// - 包含丰富的微交互和动画效果
```

### 2. 后端API集成
```typescript
// Edge Functions实现指令

interface WorkflowExecutionAPI {
  // 1. LLM模型集成
  llmIntegration: {
    supportedProviders: ['OpenAI', 'Anthropic', 'Google', 'Cohere'];
    adaptivePrompting: boolean;
    responseStreaming: boolean;
    costOptimization: boolean;
  };
  
  // 2. NPM包执行引擎
  npmExecution: {
    sandboxEnvironment: boolean;
    resourceLimitation: boolean;
    securityScanning: boolean;
    performanceMonitoring: boolean;
  };
  
  // 3. 实时分析系统
  analytics: {
    executionMetrics: boolean;
    costTracking: boolean;
    performanceProfiling: boolean;
    errorAnalysis: boolean;
  };
}

// Supabase Edge Functions实现：
export default async function handler(req: Request) {
  // 1. 解析工作流配置
  // 2. 验证组件兼容性
  // 3. 执行工作流步骤
  // 4. 收集性能指标
  // 5. 返回结构化结果
  
  // 要求：
  // - 完整的错误处理和重试逻辑
  // - 实时进度更新通过WebSocket
  // - 详细的日志记录和监控
  // - 安全的代码执行环境
}
```

### 3. 数据库架构优化
```sql
-- 数据库架构增强
-- 1. 工作流存储和版本控制
CREATE TABLE workflow_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  components jsonb NOT NULL,
  metadata jsonb DEFAULT '{}',
  performance_metrics jsonb DEFAULT '{}',
  creator_id uuid,
  is_public boolean DEFAULT false,
  usage_count integer DEFAULT 0,
  rating numeric(3,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. 执行历史和分析
CREATE TABLE workflow_executions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id uuid REFERENCES workflow_templates(id),
  execution_config jsonb NOT NULL,
  results jsonb,
  performance_data jsonb,
  cost_analysis jsonb,
  status text CHECK (status IN ('pending', 'running', 'completed', 'failed')),
  started_at timestamptz DEFAULT now(),
  completed_at timestamptz,
  error_details jsonb
);

-- 3. 用户行为分析
CREATE TABLE user_interactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  action_type text NOT NULL,
  component_data jsonb,
  context_data jsonb,
  timestamp timestamptz DEFAULT now()
);

-- 优化要求：
-- - 添加适当的索引提升查询性能
-- - 实现行级安全策略
-- - 设置自动数据清理作业
-- - 添加全文搜索功能
```

## 🎯 特定AI编程工具指令

### Cursor IDE 集成
```javascript
// .cursorrules 配置
{
  "rules": [
    "专注于React+TypeScript最佳实践",
    "使用Tailwind CSS进行样式设计",
    "实现完整的类型安全",
    "添加丰富的用户交互和动画",
    "确保代码可维护性和扩展性",
    "集成Supabase进行数据管理",
    "实现实时功能和WebSocket集成"
  ],
  "context": {
    "project_type": "React SPA with Supabase backend",
    "ui_framework": "Tailwind CSS",
    "state_management": "React hooks + Context",
    "backend": "Supabase Edge Functions",
    "deployment": "Vercel/Netlify"
  }
}
```

### Claude Code 提示词
```
作为AI工作流平台的首席开发工程师，请帮我：

1. **优化组件架构**：
   - 重构UnifiedPlayground为更小的可复用组件
   - 实现高效的状态管理和数据流
   - 添加完整的错误处理和加载状态

2. **增强用户体验**：
   - 实现拖拽式工作流编辑器
   - 添加实时预览和即时反馈
   - 设计游戏化的用户互动系统

3. **集成AI功能**：
   - 实现智能工作流建议系统
   - 添加自然语言工作流创建
   - 集成多个LLM提供商API

4. **性能优化**：
   - 实现代码分割和懒加载
   - 优化数据获取和缓存策略
   - 添加实时性能监控

请确保代码符合现代React最佳实践，具有完整的TypeScript类型定义，并且具有企业级的代码质量。
```

### Windsurf Editor 配置
```yaml
# windsurf.config.yaml
project:
  name: "AI-NPM-Unified-Playground"
  type: "react-typescript"
  
ai_assistant:
  model: "claude-3.5-sonnet"
  context: |
    这是一个创新的AI+NPM生态系统集成平台，结合了：
    - LLM模型的强大分析能力
    - NPM包的丰富功能生态
    - 可视化的工作流编排
    - 实时的性能监控
    - 游戏化的用户体验
    
    请专注于创建高质量、可维护的代码，确保良好的用户体验和性能表现。

preferences:
  coding_style: "modern-react"
  ui_framework: "tailwind"
  architecture: "component-based"
  testing: "jest-rtl"
  deployment: "edge-optimized"
```

### V0.dev 生成指令
```
创建一个现代化的AI工作流平台界面，包含：

🎨 设计要求：
- 深色主题，渐变背景 (slate-900 → purple-900)
- 玻璃态设计风格 (glassmorphism)
- 微妙的动画和过渡效果
- 响应式设计，适配所有设备

🔧 功能组件：
1. 左侧：LLM模型选择面板
2. 中央：可视化工作流画布
3. 右侧：NPM包库和工具
4. 顶部：控制栏和状态显示
5. 底部：执行结果和分析

🎮 交互特性：
- 拖拽式组件添加
- 实时连接线绘制
- 悬停状态和工具提示
- 成功/错误状态指示
- 加载动画和进度条

📊 数据可视化：
- 性能指标图表
- 成本分析饼图
- 执行流程图
- 实时状态仪表盘

请生成完整的React组件代码，包含TypeScript类型定义和Tailwind CSS样式。
```

## 🔧 技术实现细节

### 关键组件结构
```typescript
// 组件层次结构
UnifiedPlayground/
├── Header/
│   ├── Logo
│   ├── NavigationTabs
│   └── UserProfile
├── Sidebar/
│   ├── LLMModelsPanel
│   ├── NPMPackagesPanel
│   └── TemplatesPanel
├── WorkflowCanvas/
│   ├── DragDropArea
│   ├── ComponentNodes
│   ├── ConnectionLines
│   └── ExecutionOverlay
├── RightPanel/
│   ├── PropertiesEditor
│   ├── CodePreview
│   └── DocumentationViewer
├── BottomPanel/
│   ├── ExecutionResults
│   ├── PerformanceMetrics
│   ├── CostAnalysis
│   └── ErrorLogs
└── Modals/
    ├── SettingsModal
    ├── ExportModal
    └── HelpModal
```

### 核心数据流
```typescript
// 状态管理架构
interface AppState {
  workflow: {
    components: WorkflowComponent[];
    connections: Connection[];
    executionState: ExecutionState;
  };
  ui: {
    selectedComponent: string | null;
    showPanel: PanelType;
    dragState: DragState;
  };
  data: {
    llmModels: LLMModel[];
    npmPackages: NPMPackage[];
    executionResults: ExecutionResult[];
  };
  user: {
    profile: UserProfile;
    preferences: UserPreferences;
    achievements: Achievement[];
  };
}

// 实时更新机制
useEffect(() => {
  const subscription = supabase
    .channel('workflow-updates')
    .on('postgres_changes', 
      { event: '*', schema: 'public', table: 'workflow_executions' },
      (payload) => handleWorkflowUpdate(payload)
    )
    .subscribe();
    
  return () => subscription.unsubscribe();
}, []);
```

## 📈 性能优化指南

### 1. 代码分割策略
```typescript
// 懒加载关键组件
const UnifiedPlayground = lazy(() => import('./components/UnifiedPlayground'));
const AnalyticsDashboard = lazy(() => import('./components/AnalyticsDashboard'));
const WorkflowEditor = lazy(() => import('./components/WorkflowEditor'));

// 路由级别的代码分割
const AppRouter = () => (
  <Router>
    <Suspense fallback={<LoadingSpinner />}>
      <Routes>
        <Route path="/playground" element={<UnifiedPlayground />} />
        <Route path="/analytics" element={<AnalyticsDashboard />} />
        <Route path="/editor" element={<WorkflowEditor />} />
      </Routes>
    </Suspense>
  </Router>
);
```

### 2. 数据获取优化
```typescript
// 使用SWR进行数据缓存和同步
const { data: llmModels, error, mutate } = useSWR(
  'llm-models',
  () => supabase.from('llm_models').select('*'),
  {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    refreshInterval: 30000 // 30秒
  }
);

// 虚拟化长列表
import { FixedSizeList as List } from 'react-window';

const VirtualizedPackageList = ({ packages }) => (
  <List
    height={600}
    itemCount={packages.length}
    itemSize={80}
    itemData={packages}
  >
    {PackageListItem}
  </List>
);
```

## 🎯 下一步开发计划

### Phase 1: 核心功能完善 (1-2周)
- [ ] 完善拖拽式工作流编辑器
- [ ] 实现真实的LLM API集成
- [ ] 添加更多NPM包支持
- [ ] 优化执行引擎性能

### Phase 2: 高级功能开发 (2-3周)
- [ ] 实现实时协作功能
- [ ] 添加自然语言工作流创建
- [ ] 集成更多数据可视化组件
- [ ] 实现工作流模板市场

### Phase 3: 企业级功能 (3-4周)
- [ ] 添加用户权限管理
- [ ] 实现私有部署选项
- [ ] 集成CI/CD工作流
- [ ] 添加API接口和SDK

### Phase 4: 生态系统扩展 (4-6周)
- [ ] 开发移动端应用
- [ ] 集成第三方服务
- [ ] 实现插件系统
- [ ] 构建开发者社区

## 💡 创新想法和扩展方向

1. **AI驱动的代码生成**：基于工作流自动生成可部署的应用代码
2. **智能成本优化**：AI推荐最经济的模型和包组合
3. **实时性能监控**：集成APM工具进行生产环境监控
4. **多云部署支持**：支持AWS、GCP、Azure等多个云平台
5. **区块链集成**：支持智能合约和DeFi协议集成
6. **IoT设备支持**：扩展到物联网设备的AI工作流

## 📚 学习资源和文档

- [React 18 官方文档](https://react.dev/)
- [TypeScript 深度指南](https://www.typescriptlang.org/docs/)
- [Tailwind CSS 设计系统](https://tailwindcss.com/docs)
- [Supabase 开发指南](https://supabase.com/docs)
- [AI API 集成最佳实践](https://platform.openai.com/docs/best-practices)

---

🎉 **这份文档为你在任何AI编程工具中继续开发提供了完整的上下文和指导。复制相关部分到你的AI助手中，享受高效的AI辅助编程体验！**