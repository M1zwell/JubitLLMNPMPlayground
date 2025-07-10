# JubitLLMNPMPlayground

## 项目概述 / Project Overview

JubitLLMNPMPlayground 是一个统一的 LLM 模型和 NPM 包管理平台，提供了一个集成的开发环境，让用户可以探索、测试和管理各种 AI 模型和 JavaScript 包。

JubitLLMNPMPlayground is a unified platform for LLM models and NPM package management, providing an integrated development environment for users to explore, test, and manage various AI models and JavaScript packages.

## 主要功能 / Key Features

### 🤖 LLM 模型管理 / LLM Model Management
- **模型浏览器**: 浏览和搜索来自不同提供商的 LLM 模型
- **实时数据**: 从 artificialanalysis.ai 获取最新的模型性能和定价数据
- **模型分类**: 按类型、价格、性能等多维度分类
- **交互式测试**: 直接在平台上测试模型性能

### 📦 NPM 包管理 / NPM Package Management
- **包探索**: 搜索和发现 NPM 生态系统中的包
- **智能分类**: 自动分类包（前端、后端、CLI 工具等）
- **详细信息**: 显示下载量、GitHub 统计、依赖关系等
- **沙盒环境**: 安全的包测试环境

### 🔄 工作流系统 / Workflow System
- **可视化编辑器**: 拖拽式工作流创建
- **组件库**: 丰富的预制组件
- **执行引擎**: 实时工作流执行和监控
- **分析报告**: 性能分析和成本优化建议

### 👤 用户管理 / User Management
- **身份验证**: 基于 Supabase Auth 的安全登录
- **个人资料**: 用户偏好和设置管理
- **活动追踪**: 用户行为分析和历史记录

## 技术栈 / Tech Stack

### 前端 / Frontend
- **React 18** with TypeScript
- **Vite** - 快速的构建工具
- **Tailwind CSS** - 实用优先的 CSS 框架
- **Lucide React** - 现代图标库
- **Monaco Editor** - 代码编辑器

### 后端 / Backend
- **Supabase** - 后端即服务平台
  - PostgreSQL 数据库
  - 实时订阅
  - 身份验证
  - Edge Functions
- **Edge Functions** - 服务端逻辑
  - LLM 数据更新
  - NPM 包导入
  - 网页爬虫

### 数据库架构 / Database Schema
- `llm_models` - LLM 模型信息
- `npm_packages` - NPM 包数据
- `user_profiles` - 用户资料
- `user_workflows` - 用户工作流
- `workflow_analyses` - 工作流分析
- `npm_categories` - 包分类
- `message_interactions` - 用户交互记录

## 环境配置 / Environment Setup

### 必需的环境变量 / Required Environment Variables

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://kiztaihzanqnrcrqaxsv.supabase.co
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

### 本地开发 / Local Development

1. **克隆仓库 / Clone Repository**
   ```bash
   git clone <repository_url>
   cd JubitLLMNPMPlayground
   ```

2. **安装依赖 / Install Dependencies**
   ```bash
   npm install
   ```

3. **配置环境变量 / Configure Environment**
   ```bash
   # 复制环境变量模板
   cp .env.example .env
   
   # 编辑 .env 文件，填入正确的 Supabase 配置
   ```

4. **启动开发服务器 / Start Development Server**
   ```bash
   npm run dev
   ```

5. **构建生产版本 / Build for Production**
   ```bash
   npm run build
   ```

## Netlify 部署 / Netlify Deployment

### 自动部署 / Automatic Deployment

1. **连接 GitHub 仓库 / Connect GitHub Repository**
   - 在 Netlify 控制台中导入项目
   - 选择 GitHub 仓库

2. **配置构建设置 / Configure Build Settings**
   - Build command: `npm run build`
   - Publish directory: `dist`
   - Node version: `18`

3. **设置环境变量 / Set Environment Variables**
   在 Netlify 控制台的 Site settings > Environment variables 中添加：
   ```
   VITE_SUPABASE_URL=https://kiztaihzanqnrcrqaxsv.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8
   ```

### 手动部署 / Manual Deployment

```bash
# 构建项目
npm run build

# 安装 Netlify CLI
npm install -g netlify-cli

# 登录 Netlify
netlify login

# 部署
netlify deploy --prod --dir=dist
```

## Supabase 配置 / Supabase Configuration

### 项目信息 / Project Information
- **Project ID**: `kiztaihzanqnrcrqaxsv`
- **URL**: `https://kiztaihzanqnrcrqaxsv.supabase.co`
- **Region**: `ap-southeast-2` (Sydney)

### Edge Functions / 边缘函数
1. **llm-update** - LLM 模型数据更新
2. **npm-import** - NPM 包导入功能
3. **npm-spider** - NPM 网站爬虫
4. **message-interactions** - 用户交互记录

### 数据库状态 / Database Status
- ✅ **143 个 LLM 模型** - 来自主要提供商的最新模型数据
- ✅ **100 个 NPM 包** - 涵盖各种分类的热门包
- ✅ **13 个包分类** - 前端、后端、CLI 工具等
- ✅ **完整的用户管理系统** - 认证、资料、偏好设置

## 安全考虑 / Security Considerations

### 已识别的问题 / Identified Issues
- ⚠️ **函数搜索路径可变**: 9 个数据库函数需要设置固定搜索路径
- ⚠️ **OTP 过期时间较长**: 建议将 OTP 过期时间设置为 1 小时以内

### 推荐的安全措施 / Recommended Security Measures
1. 定期更新依赖包
2. 使用 HTTPS 协议
3. 配置适当的 CORS 策略
4. 实施内容安全策略 (CSP)
5. 定期审查用户权限

## 性能优化 / Performance Optimization

### 已实施的优化 / Implemented Optimizations
- ✅ **代码分割**: 使用动态导入减少初始包大小
- ✅ **缓存策略**: 静态资源长期缓存
- ✅ **图像优化**: 压缩和格式优化
- ✅ **懒加载**: 组件按需加载

### 需要改进的领域 / Areas for Improvement
- ⚠️ **包大小**: 主包大小 1.27MB，建议进一步分割
- 📝 **建议**: 使用 `build.rollupOptions.output.manualChunks` 优化分块

## API 文档 / API Documentation

### LLM 模型 API / LLM Models API
```typescript
// 获取所有模型
GET /rest/v1/llm_models

// 按提供商筛选
GET /rest/v1/llm_models?provider=eq.OpenAI

// 按类别筛选
GET /rest/v1/llm_models?category=eq.reasoning
```

### NPM 包 API / NPM Packages API
```typescript
// 获取所有包
GET /rest/v1/npm_packages

// 按分类筛选
GET /rest/v1/npm_packages?categories=cs.{front-end}

// 搜索包
GET /rest/v1/npm_packages?name=ilike.*react*
```

## 开发指南 / Development Guide

### 添加新功能 / Adding New Features
1. 在 `src/components/` 中创建组件
2. 更新路由配置
3. 添加必要的类型定义
4. 编写测试用例
5. 更新文档

### 代码规范 / Code Standards
- 使用 TypeScript 进行类型安全
- 遵循 ESLint 规则
- 使用 Prettier 格式化代码
- 编写有意义的提交信息

## 故障排除 / Troubleshooting

### 常见问题 / Common Issues

1. **Supabase 连接问题**
   ```bash
   # 检查环境变量
   echo $VITE_SUPABASE_URL
   echo $VITE_SUPABASE_ANON_KEY
   ```

2. **构建失败**
   ```bash
   # 清理并重新安装依赖
   rm -rf node_modules package-lock.json
   npm install
   npm run build
   ```

3. **部署问题**
   ```bash
   # 检查 Netlify 构建日志
   netlify open --site
   ```

## 许可证 / License

本项目采用 MIT 许可证。详见 [LICENSE](LICENSE) 文件。

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.

## 贡献 / Contributing

欢迎贡献！请阅读 [CONTRIBUTING.md](CONTRIBUTING.md) 了解如何参与项目开发。

Contributions are welcome! Please read [CONTRIBUTING.md](CONTRIBUTING.md) for details on how to contribute to the project.

## 联系方式 / Contact

如有问题或建议，请通过以下方式联系：
- 创建 GitHub Issue
- 发送邮件至项目维护者

For questions or suggestions, please contact us through:
- Create a GitHub Issue
- Email the project maintainers
