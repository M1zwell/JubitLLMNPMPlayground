# Quick Reference Card / 快速参考卡
**JubitLLM NPM Playground - Development & Production**

---

## 🚀 Quick Start Commands / 快速启动命令

```bash
# Development / 开发
npm run dev                    # Start on http://localhost:8080
npm run dev:host              # Start with network access

# Production Build / 生产构建
npm run build                 # Build for production
npm run preview:prod          # Preview build on :8080
npm run test:build           # Build + Preview

# Deployment / 部署
npm run netlify:deploy       # Deploy to Netlify
```

---

## 🌐 URLs / 访问地址

| Environment | URL |
|------------|-----|
| **Development** | http://localhost:8080 |
| **Network Access** | http://[your-ip]:8080 |
| **Production** | https://chathogs.com |
| **Netlify Dashboard** | https://app.netlify.com |

---

## 📁 Key Files / 关键文件

| File | Purpose |
|------|---------|
| `vite.config.ts` | Vite configuration (port, proxy, build) |
| `netlify.toml` | Netlify deployment config |
| `.env` | Local environment variables |
| `src/lib/env.ts` | Environment utility |
| `src/lib/supabase.ts` | Supabase client |

---

## 🔧 Environment Variables / 环境变量

### Required / 必需

```env
VITE_SUPABASE_URL=https://kiztaihzanqnrcrqaxsv.supabase.co
VITE_SUPABASE_ANON_KEY=your_key_here
```

### Optional / 可选

```env
VITE_APP_DOMAIN=http://localhost:8080
VITE_ENABLE_MULTI_MODEL_CHAT=true
VITE_DEBUG_MODE=true
VITE_FIRECRAWL_API_KEY=your_key_here
```

---

## 🔍 Environment Checker / 环境检查器

**In Development Mode:**
- Look for floating panel in bottom-right corner
- Shows current environment configuration
- Validates required variables
- Click to expand/collapse

**Features:**
- ✅ Environment detection (Dev/Prod)
- ✅ Configuration validation
- ✅ Missing variable alerts
- ✅ Quick console logging

---

## 🐛 Common Issues / 常见问题

### Port 8080 in use / 端口占用

```bash
# Windows
netstat -ano | findstr :8080
taskkill /PID <PID> /F
```

### Environment not loading / 环境变量未加载

```bash
# Restart dev server
Ctrl+C
npm run dev
```

### Build fails / 构建失败

```bash
rm -rf node_modules dist
npm install
npm run build
```

---

## 📊 Configuration Overview / 配置概览

### Development (localhost:8080)
- ✅ Hot Module Replacement
- ✅ API proxy to Supabase
- ✅ CORS enabled
- ✅ Source maps
- ✅ Debug mode
- ✅ Environment checker visible

### Production (Netlify)
- ✅ Optimized build
- ✅ Code splitting
- ✅ Minification
- ✅ Security headers
- ✅ Asset caching
- ✅ SPA routing
- ✅ API redirects

---

## 🎯 Deployment Checklist / 部署检查清单

### Before Deploying / 部署前

- [ ] Test locally: `npm run build && npm run preview:prod`
- [ ] Check console for errors
- [ ] Verify all features work
- [ ] Test on multiple browsers
- [ ] Check responsive design

### Netlify Setup / Netlify 设置

- [ ] Connect Git repository
- [ ] Set build command: `npm run build`
- [ ] Set publish directory: `dist`
- [ ] Add environment variables
- [ ] Configure custom domain (optional)

### After Deploying / 部署后

- [ ] Check deployment logs
- [ ] Test production URL
- [ ] Verify API connections
- [ ] Check browser console
- [ ] Monitor performance

---

## 🔐 Security Checklist / 安全检查清单

- [ ] Never commit `.env` file
- [ ] Use environment variables for secrets
- [ ] Different keys for dev/prod
- [ ] Enable security headers
- [ ] Use HTTPS in production
- [ ] Validate user inputs
- [ ] Sanitize API responses

---

## 📞 Quick Help / 快速帮助

**Environment Issues:**
1. Check `.env` file exists
2. Verify variable names start with `VITE_`
3. Restart dev server
4. Check Environment Checker panel

**Build Issues:**
1. Clear cache: `rm -rf node_modules dist`
2. Reinstall: `npm install`
3. Try build: `npm run build`
4. Check error messages

**Deployment Issues:**
1. Check Netlify logs
2. Verify environment variables in Netlify
3. Test build locally first
4. Check `netlify.toml` configuration

---

## 📚 Documentation / 文档

- **Full Guide**: `DEVELOPMENT_PRODUCTION_GUIDE.md`
- **Setup**: `QUICK_START.md`
- **Deployment**: `DEPLOYMENT.md`
- **Vite Docs**: https://vitejs.dev
- **Netlify Docs**: https://docs.netlify.com

---

## 🎨 Features / 功能

- ✅ React + TypeScript + Vite
- ✅ Tailwind CSS styling
- ✅ Supabase backend
- ✅ Multi-model chat
- ✅ NPM package playground
- ✅ LLM marketplace
- ✅ Webb financial integration
- ✅ User authentication
- ✅ Real-time updates

---

**Version**: 1.0.0
**Last Updated**: November 6, 2025
**Port**: 8080 (Development & Preview)
**Production**: https://chathogs.com

