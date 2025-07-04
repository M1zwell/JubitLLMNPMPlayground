export type Language = 'en' | 'zh';

// Define all possible translation keys
export type TranslationKey = 
  | 'appName'
  | 'integratedHub'
  | 'llmMarket'
  | 'llmPlayground'
  | 'npmMarket'
  | 'npmPlayground'
  | 'enhancedPlayground'
  | 'liveDemo'
  | 'signIn'
  | 'signUp'
  | 'signOut'
  | 'email'
  | 'password'
  | 'confirmPassword'
  | 'username'
  | 'fullName'
  | 'welcomeBack'
  | 'joinNow'
  | 'search'
  | 'filter'
  | 'sort'
  | 'add'
  | 'execute'
  | 'running'
  | 'clear'
  | 'total'
  | 'downloads'
  | 'quality'
  | 'stars'
  | 'refresh'
  | 'performance'
  | 'cost'
  | 'complexity'
  | 'time'
  | 'light'
  | 'dark'
  | 'systemDefault'
  | 'language'
  | 'settings'
  | 'profile'
  | 'browseAll'
  | 'quickStart'
  | 'templates'
  | 'suggestions'
  | 'workflowBuilder'
  | 'recentComponents'
  | 'quickActions'
  | 'allModels'
  | 'allPackages'
  | 'reasoning'
  | 'coding'
  | 'multimodal'
  | 'lightweight'
  | 'budget';

// English translations
const en = {
  appName: 'LLM & NPM Playground',
  integratedHub: 'Integrated Hub',
  llmMarket: 'LLM Market',
  llmPlayground: 'LLM Playground',
  npmMarket: 'NPM Market',
  npmPlayground: 'NPM Playground',
  enhancedPlayground: 'Enhanced Playground',
  liveDemo: 'Live Demo',
  signIn: 'Sign In',
  signUp: 'Sign Up',
  signOut: 'Sign Out',
  email: 'Email Address',
  password: 'Password',
  confirmPassword: 'Confirm Password',
  username: 'Username',
  fullName: 'Full Name',
  welcomeBack: 'Welcome Back!',
  joinNow: 'Join LLM Playground',
  search: 'Search',
  filter: 'Filters & Search',
  sort: 'Sort',
  add: 'Add',
  execute: 'Execute',
  running: 'Running...',
  clear: 'Clear',
  total: 'Total',
  downloads: 'Downloads',
  quality: 'Quality',
  stars: 'Stars',
  refresh: 'Refresh',
  performance: 'Performance',
  cost: 'Cost',
  complexity: 'Complexity',
  time: 'Time',
  light: 'Light',
  dark: 'Dark',
  systemDefault: 'System Default',
  language: 'Language',
  settings: 'Settings',
  profile: 'Profile',
  browseAll: 'Browse All',
  quickStart: 'Quick Start',
  templates: 'Templates',
  suggestions: 'Suggestions',
  workflowBuilder: 'Workflow Builder',
  recentComponents: 'Recent Components',
  quickActions: 'Quick Actions',
  allModels: 'All Models',
  allPackages: 'All Packages',
  reasoning: 'Reasoning',
  coding: 'Coding',
  multimodal: 'Multimodal',
  lightweight: 'Lightweight',
  budget: 'Budget'
};

// Chinese translations
const zh = {
  appName: 'LLM & NPM 开发平台',
  integratedHub: '集成中心',
  llmMarket: 'LLM 市场',
  llmPlayground: 'LLM 测试场',
  npmMarket: 'NPM 市场',
  npmPlayground: 'NPM 测试场',
  enhancedPlayground: '增强测试场',
  liveDemo: '在线演示',
  signIn: '登录',
  signUp: '注册',
  signOut: '退出登录',
  email: '电子邮箱',
  password: '密码',
  confirmPassword: '确认密码',
  username: '用户名',
  fullName: '全名',
  welcomeBack: '欢迎回来！',
  joinNow: '加入LLM测试平台',
  search: '搜索',
  filter: '筛选和搜索',
  sort: '排序',
  add: '添加',
  execute: '执行',
  running: '执行中...',
  clear: '清除',
  total: '总计',
  downloads: '下载量',
  quality: '质量',
  stars: '星标',
  refresh: '刷新',
  performance: '性能',
  cost: '成本',
  complexity: '复杂度',
  time: '时间',
  light: '浅色',
  dark: '深色',
  systemDefault: '系统默认',
  language: '语言',
  settings: '设置',
  profile: '个人资料',
  browseAll: '浏览全部',
  quickStart: '快速开始',
  templates: '模板',
  suggestions: '建议',
  workflowBuilder: '工作流构建器',
  recentComponents: '最近组件',
  quickActions: '快速操作',
  allModels: '所有模型',
  allPackages: '所有包',
  reasoning: '推理',
  coding: '编程',
  multimodal: '多模态',
  lightweight: '轻量级',
  budget: '经济型'
};

// Export all translations
export const translations = {
  en,
  zh
};