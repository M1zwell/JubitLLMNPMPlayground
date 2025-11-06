# Development & Production Guide
# 开发和生产环境指南

This guide explains how to run the project in both development (localhost:8080) and production (Netlify) environments.

本指南说明如何在开发环境（localhost:8080）和生产环境（Netlify）中运行项目。

---

## 🚀 Quick Start / 快速开始

### Development Environment / 开发环境

```bash
# Install dependencies / 安装依赖
npm install

# Start development server on http://localhost:8080
# 在 http://localhost:8080 启动开发服务器
npm run dev

# Start with network access (accessible from other devices)
# 启动并允许网络访问（可从其他设备访问）
npm run dev:host
```

### Production Build & Preview / 生产构建和预览

```bash
# Build for production / 生产构建
npm run build

# Preview production build locally on http://localhost:8080
# 在本地预览生产构建 http://localhost:8080
npm run preview:prod

# Test full build process / 测试完整构建流程
npm run test:build
```

---

## 📁 Environment Configuration / 环境配置

### 1. Create `.env` file / 创建 `.env` 文件

Copy from the example and configure your values:
从示例复制并配置你的值：

```bash
cp env.example .env
```

### 2. Required Environment Variables / 必需的环境变量

**Development (.env file):**
```env
# Supabase Configuration
VITE_SUPABASE_URL=https://kiztaihzanqnrcrqaxsv.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here

# Application Configuration
VITE_APP_NAME="JubitLLM NPM Playground"
VITE_APP_DOMAIN=http://localhost:8080
VITE_ENABLE_MULTI_MODEL_CHAT=true

# Debug Mode (optional)
VITE_DEBUG_MODE=true
```

**Production (Netlify Environment Variables):**

Set these in Netlify Dashboard → Site Settings → Environment Variables:

在 Netlify 仪表板中设置 → 站点设置 → 环境变量：

```
VITE_SUPABASE_URL=https://kiztaihzanqnrcrqaxsv.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key_here
VITE_APP_DOMAIN=https://chathogs.com
VITE_ENABLE_MULTI_MODEL_CHAT=true
VITE_DEBUG_MODE=false
```

---

## 🔧 Configuration Files / 配置文件

### 1. `vite.config.ts` - Vite Configuration

```typescript
export default defineConfig({
  server: {
    port: 8080,              // Development port
    host: true,              // Allow network access
    open: true,              // Auto-open browser
    cors: true,              // Enable CORS
    proxy: {
      '/api': {              // Proxy API requests in dev
        target: 'https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    outDir: 'dist',          // Output directory
    sourcemap: false,        // Disable sourcemaps in production
    chunkSizeWarningLimit: 1000,
  },
  preview: {
    port: 8080,              // Preview port matches dev
    host: true,
    open: true,
  },
});
```

### 2. `netlify.toml` - Netlify Configuration

Key features:
- ✅ SPA routing (all routes → index.html)
- ✅ API proxy to Supabase Edge Functions
- ✅ Security headers
- ✅ Cache optimization
- ✅ Domain redirects

```toml
[build]
  publish = "dist"
  command = "npm run build"

# API Proxy
[[redirects]]
  from = "/api/*"
  to = "https://kiztaihzanqnrcrqaxsv.supabase.co/functions/v1/:splat"
  status = 200
```

### 3. `src/lib/env.ts` - Environment Utility

Centralized environment configuration:

```typescript
export const ENV = {
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  
  app: {
    baseUrl: import.meta.env.DEV 
      ? 'http://localhost:8080' 
      : 'https://chathogs.com',
  },
  
  api: {
    baseUrl: import.meta.env.DEV 
      ? 'http://localhost:8080/api' 
      : 'https://chathogs.com/api',
  },
};
```

---

## 🌐 Deployment / 部署

### Deploy to Netlify / 部署到 Netlify

#### Option 1: Netlify CLI / 选项 1：Netlify CLI

```bash
# Install Netlify CLI globally
npm install -g netlify-cli

# Login to Netlify
netlify login

# Deploy to production
npm run netlify:deploy

# Or use direct command
netlify deploy --prod
```

#### Option 2: Git Integration / 选项 2：Git 集成

1. Push your code to GitHub
2. Connect repository in Netlify Dashboard
3. Configure build settings:
   - **Build command**: `npm run build`
   - **Publish directory**: `dist`
4. Add environment variables in Netlify Dashboard
5. Deploy automatically on push

推送代码到 GitHub 后，在 Netlify 仪表板中连接仓库并配置构建设置。

#### Option 3: Manual Deploy / 选项 3：手动部署

```bash
# Build locally
npm run build

# Deploy the dist folder
netlify deploy --prod --dir=dist
```

---

## 🔍 Testing / 测试

### Test Development Build / 测试开发构建

```bash
npm run dev
# Open http://localhost:8080
# Check console for environment logs
```

### Test Production Build Locally / 本地测试生产构建

```bash
npm run build
npm run preview:prod
# Open http://localhost:8080
# Verify production behavior
```

### Test on Network Devices / 在网络设备上测试

```bash
npm run dev:host
# Access from mobile/tablet using your computer's IP
# Example: http://192.168.1.100:8080
```

---

## 🐛 Troubleshooting / 故障排除

### Issue: Port 8080 already in use / 端口 8080 已被占用

**Solution:**

```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F

# Or change port in vite.config.ts
server: { port: 3000 }
```

### Issue: Environment variables not loading / 环境变量未加载

**Solution:**

1. Ensure `.env` file exists in project root
2. Restart dev server after changing `.env`
3. Check variable names start with `VITE_`
4. Verify in browser console: `import.meta.env`

```bash
# Restart dev server
# Ctrl+C to stop, then:
npm run dev
```

### Issue: API requests failing / API 请求失败

**Development:**
- Check proxy configuration in `vite.config.ts`
- Verify Supabase URL in `.env`
- Check browser console for CORS errors

**Production:**
- Verify Netlify environment variables
- Check `netlify.toml` redirects
- Test API endpoints directly

### Issue: Build fails / 构建失败

```bash
# Clear cache and rebuild
rm -rf node_modules dist
npm install
npm run build
```

### Issue: Netlify deployment fails / Netlify 部署失败

1. Check build logs in Netlify Dashboard
2. Verify all environment variables are set
3. Ensure `netlify.toml` is in project root
4. Test build locally: `npm run build`

---

## 📊 Performance Optimization / 性能优化

### Code Splitting / 代码分割

Configured in `vite.config.ts`:

```typescript
build: {
  rollupOptions: {
    output: {
      manualChunks: {
        vendor: ['react', 'react-dom'],
        supabase: ['@supabase/supabase-js'],
        monaco: ['@monaco-editor/react'],
      },
    },
  },
}
```

### Caching Strategy / 缓存策略

Configured in `netlify.toml`:

- **Static assets**: 1 year cache
- **HTML files**: 1 hour cache
- **API responses**: No cache

---

## 🔐 Security / 安全

### Environment Variables / 环境变量

- ✅ Never commit `.env` file
- ✅ Use `VITE_` prefix for client-side variables
- ✅ Store sensitive keys in Netlify environment
- ✅ Use different keys for dev/prod

### Security Headers / 安全头

Configured in `netlify.toml`:

- X-Frame-Options
- X-XSS-Protection
- X-Content-Type-Options
- Content-Security-Policy
- Referrer-Policy

---

## 📝 Available Scripts / 可用脚本

| Script | Description | 描述 |
|--------|-------------|------|
| `npm run dev` | Start dev server on :8080 | 启动开发服务器 |
| `npm run dev:host` | Dev server with network access | 开发服务器（网络访问） |
| `npm run build` | Build for production | 生产构建 |
| `npm run build:prod` | Build with production mode | 生产模式构建 |
| `npm run preview` | Preview production build | 预览生产构建 |
| `npm run preview:prod` | Preview on :8080 | 在 8080 预览 |
| `npm run test:build` | Build and preview | 构建并预览 |
| `npm run netlify:deploy` | Deploy to Netlify | 部署到 Netlify |
| `npm run lint` | Run ESLint | 运行代码检查 |

---

## 🎯 Best Practices / 最佳实践

### Development / 开发

1. ✅ Use `.env` for local configuration
2. ✅ Test on multiple browsers
3. ✅ Check console for errors/warnings
4. ✅ Use React DevTools for debugging
5. ✅ Test responsive design on different devices

### Production / 生产

1. ✅ Test production build locally before deploying
2. ✅ Monitor Netlify deploy logs
3. ✅ Use environment variables for all secrets
4. ✅ Enable error tracking (Sentry, etc.)
5. ✅ Set up monitoring and analytics

### Code Quality / 代码质量

1. ✅ Run linter before committing: `npm run lint`
2. ✅ Keep dependencies updated
3. ✅ Use TypeScript for type safety
4. ✅ Write meaningful commit messages
5. ✅ Review build size warnings

---

## 🔗 Useful Links / 有用链接

- **Development**: http://localhost:8080
- **Production**: https://chathogs.com
- **Netlify Dashboard**: https://app.netlify.com
- **Supabase Dashboard**: https://app.supabase.com
- **Vite Documentation**: https://vitejs.dev
- **Netlify Documentation**: https://docs.netlify.com

---

## 📞 Support / 支持

If you encounter any issues:

1. Check this guide first
2. Review console errors
3. Check Netlify/Supabase status pages
4. Review deployment logs

遇到问题时，请先查看本指南，检查控制台错误，并查看部署日志。

---

**Last Updated**: November 6, 2025
**Version**: 1.0.0

