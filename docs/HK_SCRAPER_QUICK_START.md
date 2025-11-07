# HK Financial Scraper - Quick Start Guide
# HK金融爬虫 - 快速入门指南

⚡ **Get started in 2 minutes!** / **2分钟快速上手！**

---

## 🚀 Quick Access / 快速访问

1. Click **"HK Scraper"** in the navigation bar
2. Or navigate to: `http://localhost:8080` → Click "HK Scraper"

---

## 📖 Basic Usage / 基本使用

### 1️⃣ Select Data Source / 选择数据源

```
Click any card to select it:
☑️ HKEX CCASS Shareholding
☐ HKSFC News
☐ NPM Search
```

**Quick Selection / 快速选择**:
- **"Select All HKEX"** → All 3 HKEX sources
- **"Select All HKSFC"** → All 3 HKSFC sources
- **"Select All NPM"** → All 2 NPM sources

### 2️⃣ Configure (Optional) / 配置（可选）

**Minimal Configuration / 最小配置**:
- Leave defaults (works for most cases)

**Custom Configuration / 自定义配置**:
- **Date Range**: `2025-01-01` to `2025-01-31`
- **Stock Codes**: `00700,00005,00388`
- **NPM Query**: `react`

### 3️⃣ Start Scraping / 开始抓取

```
Click: [ Start Scraping (3) ]
        ↓
Watch progress bar
        ↓
Results appear on the right
        ↓
✅ Done!
```

### 4️⃣ Export Results / 导出结果

```
Individual:    [ JSON ] [ CSV ]
All Results:   [ Export All ] (top-right)
```

---

## 💡 Common Tasks / 常见任务

### Task 1: Get CCASS Data for Tencent (00700) / 获取腾讯CCASS数据

```
1. Select: "CCASS Shareholding"
2. Stock Codes: 00700
3. Date: Today's date
4. Click "Start Scraping"
5. Download JSON
```

### Task 2: Search NPM Packages / 搜索NPM包

```
1. Select: "NPM Package Search"
2. NPM Query: react
3. Click "Start Scraping"
4. Download CSV
```

### Task 3: Get HKSFC News / 获取证监会新闻

```
1. Select: "HKSFC News"
2. Date Range: Last 7 days
3. Click "Start Scraping"
4. Review results
```

### Task 4: Batch Scrape All HKEX Sources / 批量抓取所有HKEX数据

```
1. Click "Select All HKEX"
2. Stock Codes: 00700,00005,00388
3. Click "Start Scraping"
4. Wait for all 3 sources
5. Click "Export All"
```

---

## ⚙️ Advanced Options / 高级选项

Click **"Advanced Options"** to expand:

### Scraping Strategy / 抓取策略
```
Auto (Recommended)     → Try Firecrawl, fallback to Puppeteer
Firecrawl Only         → Fast, cloud-based
Puppeteer Only         → Browser automation, reliable
```

### Max Retries / 最大重试
```
1-5 attempts
Default: 3
Recommended: 3 (normal), 5 (unreliable sources)
```

### Rate Limit / 速率限制
```
0-5000ms delay
Default: 1000ms (1 second)
Recommended: 1000ms (normal), 2000ms (large batches)
```

### Cache Settings / 缓存设置
```
Use Cache: ✅ Enabled
TTL: 3600 seconds (1 hour)
```

---

## 🎯 Tips & Tricks / 技巧

### 💰 Reduce API Costs / 降低API成本
```
✅ Enable caching
✅ Increase cache TTL to 3600s+
✅ Batch similar queries
```

### ⚡ Speed Up Scraping / 加快抓取速度
```
✅ Use "Firecrawl Only" for simple pages
✅ Reduce rate limit to 500ms (if safe)
✅ Enable cache for repeated queries
```

### 🛡️ Avoid Being Blocked / 避免被封禁
```
✅ Use "Auto" strategy
✅ Set rate limit to 1000ms+
✅ Don't scrape too frequently
✅ Respect robots.txt
```

### 📊 Get Clean Data / 获取干净数据
```
✅ Use CSV export for tabular data
✅ Use JSON export for complex data
✅ Filter by date range
✅ Specify exact stock codes
```

---

## 🔧 Troubleshooting / 故障排除

### ❌ "Scraping Failed"
```
1. Check internet connection
2. Verify input data (stock codes, dates)
3. Try different scraping strategy
4. Increase max retries to 5
```

### ⏰ "Too Slow"
```
1. Reduce number of sources
2. Lower rate limit (carefully)
3. Use "Firecrawl Only" strategy
4. Enable caching
```

### 📥 "No Data Returned"
```
1. Expand date range
2. Check stock code exists
3. Use broader search terms
4. Try different data source
```

---

## 📚 Data Sources Quick Reference / 数据源快速参考

| Source | Input Needed | Output | Use Case |
|--------|--------------|--------|----------|
| **CCASS Shareholding** | Stock codes, Date | Participant shareholding | Track institutional investors |
| **Company Announcements** | None | Announcements list | Monitor company news |
| **Market Statistics** | None | Daily turnover | Analyze market trends |
| **HKSFC News** | Date range | Regulatory news | Stay updated on regulations |
| **Enforcement News** | Date range | Penalty actions | Monitor compliance |
| **NPM Search** | Search query | Package list | Find NPM packages |
| **NPM Package** | Package name | Package details | Research package info |

---

## 🎬 Example Workflows / 示例工作流

### Workflow 1: Daily Market Monitoring / 日常市场监控
```
Morning Routine:
1. Select "HKEX Market Statistics"
2. Select "HKSFC News"
3. Date: Yesterday to Today
4. Click "Start Scraping"
5. Review results
6. Export to JSON for records
```

### Workflow 2: Stock Research / 股票研究
```
Research Process:
1. Select "CCASS Shareholding"
2. Stock Codes: [Target stocks]
3. Date Range: Last 30 days
4. Click "Start Scraping"
5. Download CSV
6. Analyze in Excel/Google Sheets
```

### Workflow 3: Package Discovery / 包发现
```
Developer Workflow:
1. Select "NPM Search"
2. Query: "state management"
3. Click "Start Scraping"
4. Review results
5. Click individual packages for details
```

---

## 📞 Need Help? / 需要帮助？

- 📖 **Full Guide**: `docs/HK_FINANCIAL_SCRAPER_GUIDE.md`
- 🔧 **API Reference**: See code comments in `hk-financial-scraper.ts`
- 💬 **Support**: Check troubleshooting section above

---

## ✅ Checklist / 检查清单

Before starting your first scrape:

- [ ] Navigation button visible and clickable
- [ ] Can select data sources (cards change color)
- [ ] Can configure options (dates, stock codes, etc.)
- [ ] "Start Scraping" button enabled when sources selected
- [ ] Advanced options panel toggles correctly
- [ ] Cache buttons work (Stats, Clear)

If any checkbox fails, refresh the page and try again.

---

**🎉 You're Ready to Go! / 准备就绪！**

**Start scraping in 3 steps**:
1. Select source
2. Click "Start Scraping"
3. Download results

Happy scraping! / 抓取愉快！

---

**Last Updated**: 2025-01-06
**Version**: 1.0.0
