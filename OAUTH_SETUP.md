# OAuth 配置指南 / OAuth Setup Guide

## 概述 / Overview

本指南将帮助您为 JubitLLM NPM Playground (https://chathogs.com) 配置OAuth身份验证。

This guide will help you configure OAuth authentication for JubitLLM NPM Playground (https://chathogs.com).

## Supabase OAuth 配置 / Supabase OAuth Configuration

### 步骤 1: 进入 Supabase 项目设置
1. 访问 [Supabase Dashboard](https://supabase.com/dashboard/project/kiztaihzanqnrcrqaxsv)
2. 进入 Authentication > Settings
3. 向下滚动到 "External OAuth Providers" 部分

## GitHub OAuth 设置

### 在 GitHub 创建应用
1. 访问 [GitHub Developer Settings](https://github.com/settings/developers)
2. 点击 "New OAuth App"
3. 填写信息：
   - **Application name**: `JubitLLM NPM Playground`
   - **Homepage URL**: `https://chathogs.com`
   - **Authorization callback URL**: `https://kiztaihzanqnrcrqaxsv.supabase.co/auth/v1/callback`
4. 点击 "Register application"
5. 复制 Client ID 和 Client Secret

### 在 Supabase 配置 GitHub
1. 在 Supabase Dashboard 中找到 GitHub 提供商
2. 启用 GitHub provider
3. 输入：
   - **Client ID**: [从GitHub获取]
   - **Client Secret**: [从GitHub获取]
4. 点击 Save

## Google OAuth 设置

### 在 Google Cloud Console 创建应用
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建新项目或选择现有项目
3. 启用 Google+ API
4. 进入 "Credentials" > "Create Credentials" > "OAuth client ID"
5. 选择 "Web application"
6. 填写信息：
   - **Name**: `JubitLLM NPM Playground`
   - **Authorized JavaScript origins**: `https://chathogs.com`
   - **Authorized redirect URIs**: `https://kiztaihzanqnrcrqaxsv.supabase.co/auth/v1/callback`
7. 复制 Client ID 和 Client Secret

### 在 Supabase 配置 Google
1. 在 Supabase Dashboard 中找到 Google 提供商
2. 启用 Google provider
3. 输入：
   - **Client ID**: [从Google获取]
   - **Client Secret**: [从Google获取]
4. 点击 Save

## Discord OAuth 设置

### 在 Discord Developer Portal 创建应用
1. 访问 [Discord Developer Portal](https://discord.com/developers/applications)
2. 点击 "New Application"
3. 输入应用名称: `JubitLLM NPM Playground`
4. 进入 "OAuth2" 标签
5. 添加重定向URL: `https://kiztaihzanqnrcrqaxsv.supabase.co/auth/v1/callback`
6. 复制 Client ID 和 Client Secret

### 在 Supabase 配置 Discord
1. 在 Supabase Dashboard 中找到 Discord 提供商
2. 启用 Discord provider
3. 输入：
   - **Client ID**: [从Discord获取]
   - **Client Secret**: [从Discord获取]
4. 点击 Save

## 环境变量配置 / Environment Variables

### Netlify 环境变量设置
在 Netlify Dashboard 中设置以下环境变量：

```bash
# Supabase
VITE_SUPABASE_URL=https://kiztaihzanqnrcrqaxsv.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtpenRhaWh6YW5xbnJjcnFheHN2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE2MjgxNzcsImV4cCI6MjA2NzIwNDE3N30.a9ZXqVSmFOH2fBbrMeELPainodMGTAkbyiUVwjmFTK8

# Application
VITE_APP_DOMAIN=https://chathogs.com
VITE_ENABLE_MULTI_MODEL_CHAT=true
```

## 验证设置 / Verification

### 测试 OAuth 流程
1. 访问 https://chathogs.com
2. 点击登录按钮
3. 选择任一OAuth提供商
4. 完成授权流程
5. 确认成功重定向到应用

### 检查用户数据
在 Supabase Dashboard 中：
1. 进入 Authentication > Users
2. 验证用户是否成功创建
3. 检查用户元数据是否正确

## 故障排除 / Troubleshooting

### 常见问题
1. **重定向URL不匹配**: 确保所有提供商的回调URL为 `https://kiztaihzanqnrcrqaxsv.supabase.co/auth/v1/callback`
2. **域名配置错误**: 确保应用URL设置为 `https://chathogs.com`
3. **权限问题**: 确保所有必要的API权限已启用

### 调试步骤
1. 检查浏览器控制台错误
2. 查看 Supabase 认证日志
3. 验证环境变量是否正确设置
4. 确认DNS和SSL证书配置正确

## 安全注意事项 / Security Notes

- 永远不要在前端代码中暴露 Client Secret
- 定期轮换 API 密钥
- 使用 HTTPS 进行所有认证流程
- 实施适当的用户权限控制

## 多模型聊天准备 / Multi-Model Chat Preparation

数据库表已创建完成，包括：
- `chat_sessions`: 聊天会话管理
- `chat_models`: 模型配置
- `chat_messages`: 消息存储
- `model_responses`: 模型响应追踪
- `chat_analytics`: 使用分析

准备接收您的 edge functions 代码！ 