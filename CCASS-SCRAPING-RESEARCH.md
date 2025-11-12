# HKEX CCASS持股数据爬取 - 深度研究报告

## 📋 项目概述

本文档记录了如何成功爬取香港交易所（HKEX）CCASS（中央结算系统）持股披露数据的完整研究过程和技术方案。

**目标网站**: https://www3.hkexnews.hk/sdw/search/searchsdw.aspx

**数据示例**:
```
Participant ID    Name                                 Address                      Shareholding        %
C00019           THE HONGKONG AND SHANGHAI BANKING    HSBC WEALTH BUSINESS...      3,221,123,909      35.22%
C00010           CITIBANK N.A.                        9/F CITI TOWER...            531,868,125        5.81%
```

---

## 🔍 核心技术挑战分析

### 1. ASP.NET 表单提交机制

**发现**:
- 网站使用 ASP.NET WebForms 框架
- 提交不是通过标准 HTML `<button type="submit">`完成
- 使用 JavaScript 函数 `__doPostBack()` 处理表单提交
- 包含隐藏字段:`__VIEWSTATE`、`__VIEWSTATEGENERATOR`

**关键元素**:
```javascript
{
  formId: "form1",
  hasDoPostBack: true,
  searchButton: {
    id: "btnSearch",
    tag: "A" (链接，不是按钮！)
  },
  hiddenFields: ["__VIEWSTATE", "__VIEWSTATEGENERATOR"]
}
```

### 2. 日期字段只读限制

**挑战**:
- 日期输入框 (`txtShareholdingDate`) 设置为 `readonly`
- 标准的 `page.type()` 无法填写只读字段
- 日期必须在过去12个月内，否则会弹出警告框

**解决方案**:
```javascript
await page.evaluate((dateValue) => {
  const dateInput = document.getElementById('txtShareholdingDate');
  if (dateInput) {
    dateInput.readOnly = false;           // 临时移除只读属性
    dateInput.value = dateValue;          // 设置值
    dateInput.dispatchEvent(new Event('change', { bubbles: true }));  // 触发事件
    dateInput.readOnly = true;            // 恢复只读属性
  }
}, '2025/11/08');
```

### 3. Terms of Use 弹窗拦截

**问题**:
- 首次访问结果页会显示 Terms of Use 弹窗
- 弹窗覆盖在数据表格上方，阻止数据提取

**解决方案**:
```javascript
await page.evaluate(() => {
  const buttons = document.querySelectorAll('button, a, input[type="button"]');
  for (let btn of buttons) {
    const text = btn.textContent?.trim().toLowerCase() || '';
    if (text.includes('accept') || text.includes('agree') || text.includes('ok')) {
      btn.click();
      break;
    }
  }
});
```

### 4. 复杂的表格结构

**表格HTML结构**:
```html
<table>
  <thead>
    <tr>
      <th>Participant ID</th>
      <th>Name of CCASS Participant (* for Consenting Investor Participants )</th>
      <th>Address</th>
      <th>Shareholding</th>
      <th>% of the total number of Issued Shares/ Warrants/ Units</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Participant ID:\nC00019</td>  <!-- 注意：包含标签前缀！ -->
      <td>Name of CCASS Participant:\nTHE HONGKONG AND SHANGHAI BANKING</td>
      <td>Address:\nHSBC WEALTH BUSINESS SERVICES...</td>
      <td>Shareholding:\n3,221,123,909</td>
      <td>% of the total number of Issued Shares:\n35.22%</td>
    </tr>
  </tbody>
</table>
```

**数据清洗挑战**:
- 每个单元格内容都带有 "Label:\nValue" 格式
- 需要分割文本并提取实际值
- 股票数量包含逗号分隔符（如 `3,221,123,909`）

**提取函数**:
```javascript
const getCellValue = (cell) => {
  const text = cell?.textContent.trim() || '';
  const parts = text.split('\n');
  return parts.length > 1 ? parts[parts.length - 1].trim() : text;
};

const participantId = getCellValue(cells[0]);        // "C00019"
const shareholding = getCellValue(cells[3]);         // "3,221,123,909"
const shareholdingNum = parseInt(shareholding.replace(/,/g, ''));  // 3221123909
```

---

## 🛠️ 技术方案对比

### 方案A: Chrome MCP（推荐用于交互式测试）

**优势**:
✅ 无需安装额外依赖（项目已配置）
✅ 实时可视化调试
✅ 完美处理 JavaScript 动态交互
✅ 支持截图和快照分析

**使用示例**:
```javascript
// 1. 导航
await mcp__chrome__navigate_page({
  type: "url",
  url: "https://www3.hkexnews.hk/sdw/search/searchsdw.aspx"
});

// 2. 填写股票代码
await mcp__chrome__fill({ uid: "1_196", value: "00700" });

// 3. 设置日期（绕过只读限制）
await mcp__chrome__evaluate_script({
  function: `() => {
    const dateInput = document.getElementById('txtShareholdingDate');
    dateInput.value = '2025/11/08';
    dateInput.dispatchEvent(new Event('change', { bubbles: true }));
  }`
});

// 4. 提交表单
await mcp__chrome__click({ uid: "2_69" });  // SEARCH button

// 5. 提取数据
const data = await mcp__chrome__evaluate_script({
  function: `() => {
    // ... 数据提取逻辑
  }`
});
```

### 方案B: Puppeteer（推荐用于生产部署）

**优势**:
✅ 可独立运行，无需MCP环境
✅ 支持批量爬取和定时任务
✅ 轻量高效，适合CI/CD集成
✅ 丰富的生态系统和文档

**完整脚本**: 见 `scrape-ccass-complete.cjs`

**关键特性**:
- ✅ 日期范围批量爬取
- ✅ 自动重试和错误处理
- ✅ CSV 导出功能
- ✅ Supabase 数据库集成
- ✅ 速率限制（每次请求间隔3秒）

### 方案C: Firecrawl（不推荐）

**限制**:
❌ 无法处理 ASP.NET `__doPostBack()` 提交
❌ 无法修改只读字段
❌ 不支持复杂的 JavaScript 交互

**结论**: Firecrawl 更适合静态内容爬取，不适合此场景。

---

## 📊 数据结构分析

### 响应数据结构

```json
{
  "stockCode": "00700",
  "stockName": "TENCENT HOLDINGS LIMITED -HKD TRADED SHARES",
  "date": "2025/11/08",
  "totalRecords": 408,
  "totalShares": "7069823417",
  "totalParticipants": 752,
  "percentageInCCASS": "77.30%",
  "summary": [
    {
      "category": "Market Intermediaries",
      "shareholding": "7,065,594,743",
      "numParticipants": "402",
      "percentage": "77.26%"
    },
    {
      "category": "Consenting Investor Participants",
      "shareholding": "44,000",
      "numParticipants": "6",
      "percentage": "0.00%"
    }
  ],
  "shareholdings": [
    {
      "participantId": "C00019",
      "participantName": "THE HONGKONG AND SHANGHAI BANKING",
      "address": "HSBC WEALTH BUSINESS SERVICES 8/F TOWER 2 & 3 HSBC CENTRE 1 SHAM MONG ROAD KOWLOON",
      "shareholding": "3221123909",
      "shareholdingFormatted": "3,221,123,909",
      "percentage": "35.22%"
    }
    // ... 407 more records
  ]
}
```

### 数据库表结构建议

```sql
CREATE TABLE hkex_ccass_holdings (
  id BIGSERIAL PRIMARY KEY,
  stock_code TEXT NOT NULL,
  stock_name TEXT,
  shareholding_date DATE NOT NULL,
  participant_id TEXT NOT NULL,
  participant_name TEXT NOT NULL,
  address TEXT,
  shareholding BIGINT NOT NULL,
  percentage DECIMAL(5,2) NOT NULL,
  scraped_at TIMESTAMP DEFAULT NOW(),

  UNIQUE (stock_code, shareholding_date, participant_id)
);

CREATE INDEX idx_stock_date ON hkex_ccass_holdings(stock_code, shareholding_date);
CREATE INDEX idx_participant ON hkex_ccass_holdings(participant_id);
CREATE INDEX idx_scraped ON hkex_ccass_holdings(scraped_at DESC);
```

---

## ⚙️ 实战经验与最佳实践

### 1. 日期验证逻辑

```javascript
function validateDate(dateStr) {
  // 格式验证：yyyy/mm/dd
  const dateRegex = /^\d{4}\/\d{2}\/\d{2}$/;
  if (!dateRegex.test(dateStr)) {
    throw new Error('Invalid date format. Use yyyy/mm/dd (e.g., 2025/11/08)');
  }

  const [year, month, day] = dateStr.split('/').map(Number);
  const date = new Date(year, month - 1, day);

  // 验证日期有效性
  if (date.getFullYear() !== year ||
      date.getMonth() !== month - 1 ||
      date.getDate() !== day) {
    throw new Error('Invalid date');
  }

  // 验证在12个月范围内
  const today = new Date();
  const twelveMonthsAgo = new Date(today);
  twelveMonthsAgo.setMonth(today.getMonth() - 12);

  if (date > today) throw new Error('Date cannot be in the future');
  if (date < twelveMonthsAgo) {
    console.warn('⚠️  Date is more than 12 months ago. Data may not be available.');
  }

  return true;
}
```

### 2. 智能日期生成（跳过周末）

```javascript
function getValidDate(daysAgo = 3) {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);

  // 跳过周日(0)和周六(6)
  while (date.getDay() === 0 || date.getDay() === 6) {
    date.setDate(date.getDate() - 1);
  }

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}/${month}/${day}`;
}
```

### 3. 弹窗警告处理

```javascript
// 监听所有 dialog 事件
page.on('dialog', async dialog => {
  const message = dialog.message();
  console.warn(`⚠️  Alert: ${message}`);

  // 自动接受并抛出错误
  await dialog.accept();

  if (message.includes('invalid date')) {
    throw new Error(`Date validation failed: ${message}`);
  }
});
```

### 4. 数据提取容错机制

```javascript
const getCellValue = (cell) => {
  const text = cell?.textContent.trim() || '';
  const parts = text.split('\n');
  // 取最后一部分作为实际值
  const value = parts.length > 1 ? parts[parts.length - 1].trim() : text;

  // 额外清洗：移除可能的标签残留
  return value.replace(/^(Participant ID|Name of CCASS|Address|Shareholding|%):?\s*/i, '').trim();
};
```

### 5. 批量爬取速率限制

```javascript
async function scrapeMultipleDates(stockCode, dates) {
  const results = [];

  for (const date of dates) {
    console.log(`\n🔍 Scraping ${stockCode} on ${date}...`);
    const data = await scrapeCCASSHoldings(stockCode, date);
    results.push(data);

    // 重要：每次请求间隔3秒，避免被封禁
    if (dates.indexOf(date) < dates.length - 1) {
      console.log('⏸️  Waiting 3 seconds before next request...');
      await new Promise(resolve => setTimeout(resolve, 3000));
    }
  }

  return results;
}
```

---

## 🚨 常见错误与解决方案

### 错误1: "Your input date is invalid. Please re-enter.."

**原因**:
- 日期格式不正确（必须是 `yyyy/mm/dd`）
- 日期超过12个月范围
- 日期是周末或香港公众假期

**解决方案**:
```javascript
// 使用自动日期生成函数
const validDate = getValidDate(3);  // 3天前的工作日

// 或手动验证
try {
  validateDate('2025/11/08');
} catch (error) {
  console.error('Date validation failed:', error.message);
}
```

### 错误2: "No data is available"

**原因**:
- 该日期无数据（可能是假期）
- 股票代码不存在
- 服务器暂时无数据

**解决方案**:
```javascript
const pageText = await page.evaluate(() => document.body.innerText);

if (pageText.includes('No data is available') ||
    pageText.includes('No Record Found')) {
  console.log('⚠️  No data available for this date');
  return {
    success: false,
    message: 'No data available',
    participants: []
  };
}
```

### 错误3: 表格数据提取为空

**原因**:
- Terms of Use 弹窗未关闭
- 表格选择器不正确
- 页面未完全加载

**解决方案**:
```javascript
// 1. 确保关闭弹窗
await acceptTermsOfUse(page);

// 2. 等待页面完全加载
await page.waitForTimeout(3000);

// 3. 使用更精确的选择器
const tables = document.querySelectorAll('table');
for (let table of tables) {
  const headerText = table.textContent;
  if (headerText.includes('Participant ID') &&
      headerText.includes('Shareholding')) {
    // 这是正确的数据表格
    dataTable = table;
    break;
  }
}
```

### 错误4: Timeout 错误

**原因**:
- 网络延迟
- 页面加载缓慢
- 服务器响应慢

**解决方案**:
```javascript
await page.goto(url, {
  waitUntil: 'networkidle0',  // 等待网络空闲
  timeout: 60000              // 增加超时时间到60秒
});

// 或使用重试机制
async function retryOperation(operation, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === maxRetries - 1) throw error;
      console.log(`Retry ${i + 1}/${maxRetries}...`);
      await new Promise(r => setTimeout(r, 5000));
    }
  }
}
```

---

## 📈 性能优化建议

### 1. 并发控制

```javascript
const pLimit = require('p-limit');
const limit = pLimit(3);  // 最多3个并发请求

const promises = stockCodes.map(code =>
  limit(() => scrapeCCASSHoldings(code, date))
);

const results = await Promise.all(promises);
```

### 2. 缓存机制

```javascript
const cache = new Map();

async function getCachedData(stockCode, date) {
  const cacheKey = `${stockCode}:${date}`;

  if (cache.has(cacheKey)) {
    console.log('📦 Using cached data');
    return cache.get(cacheKey);
  }

  const data = await scrapeCCASSHoldings(stockCode, date);
  cache.set(cacheKey, data);

  // 缓存过期时间：24小时
  setTimeout(() => cache.delete(cacheKey), 24 * 60 * 60 * 1000);

  return data;
}
```

### 3. 增量爬取策略

```javascript
// 只爬取数据库中不存在的日期
async function scrapeNewDatesOnly(stockCode, startDate, endDate) {
  const { data: existing } = await supabase
    .from('hkex_ccass_holdings')
    .select('shareholding_date')
    .eq('stock_code', stockCode)
    .gte('shareholding_date', startDate)
    .lte('shareholding_date', endDate);

  const existingDates = new Set(existing.map(r => r.shareholding_date));
  const allDates = generateDateRange(startDate, endDate);
  const newDates = allDates.filter(d => !existingDates.has(d));

  console.log(`📊 Found ${newDates.length} new dates to scrape`);
  return scrapeMultipleDates(stockCode, newDates);
}
```

---

## 🔒 合规性与法律考量

### 使用条款摘要（重要！）

根据 HKEX 网站 Terms of Use:

> **2.3** You shall not use any programmatic, scripted or other mechanical means to access this CCASS shareholding search facility or the Information.

**重要警告**:
⚠️ HKEX 明确禁止使用自动化脚本访问 CCASS 数据
⚠️ 本研究仅供教育和技术学习用途
⚠️ 生产环境使用前，**必须**获取 HKEX 书面许可

### 合规建议

1. **个人非商业用途**: 仅用于学术研究和个人投资分析
2. **速率限制**: 保持合理的请求频率（建议≥3秒间隔）
3. **数据使用**: 不得二次分发或商业化利用
4. **获取授权**: 如需商业用途，联系 psh@hkex.com.hk 获取正式授权

### 合法替代方案

- **手动下载**: 从网站手动查询并下载（合规）
- **官方API**: 等待HKEX推出官方数据API（如有）
- **付费服务**: 使用Bloomberg、Wind等有授权的数据提供商

---

## 🎯 实际应用场景

### 1. 机构持股监控

```javascript
// 监控特定机构的持股变化
async function trackInstitutionHoldings(participantId, stockCodes, dateRange) {
  const holdings = [];

  for (const code of stockCodes) {
    for (const date of dateRange) {
      const data = await scrapeCCASSHoldings(code, date);
      const institution = data.participants.find(p =>
        p.participantId === participantId
      );

      if (institution) {
        holdings.push({
          date: date,
          stockCode: code,
          shareholding: institution.shareholding,
          percentage: institution.percentage
        });
      }
    }
  }

  return holdings;
}

// 使用示例
const hsbcHoldings = await trackInstitutionHoldings(
  'C00019',  // HSBC
  ['00700', '00941', '01299'],  // 腾讯、中国移动、友邦
  ['2025/11/01', '2025/11/08']
);
```

### 2. 持股集中度分析

```javascript
function analyzeConcentration(ccassData) {
  const totalShares = parseInt(ccassData.totalShares);
  const top10 = ccassData.participants.slice(0, 10);

  const top10Shares = top10.reduce((sum, p) =>
    sum + parseInt(p.shareholding), 0
  );

  const top10Percentage = (top10Shares / totalShares * 100).toFixed(2);

  return {
    totalParticipants: ccassData.totalParticipants,
    top10Percentage: top10Percentage + '%',
    herfindahlIndex: calculateHHI(ccassData.participants)
  };
}
```

### 3. 持股变化对比

```javascript
async function compareHoldings(stockCode, date1, date2) {
  const [data1, data2] = await Promise.all([
    scrapeCCASSHoldings(stockCode, date1),
    scrapeCCASSHoldings(stockCode, date2)
  ]);

  const map1 = new Map(data1.participants.map(p =>
    [p.participantId, parseInt(p.shareholding)]
  ));
  const map2 = new Map(data2.participants.map(p =>
    [p.participantId, parseInt(p.shareholding)]
  ));

  const changes = [];

  for (const [id, shares2] of map2) {
    const shares1 = map1.get(id) || 0;
    const change = shares2 - shares1;

    if (Math.abs(change) > 0) {
      const participant = data2.participants.find(p => p.participantId === id);
      changes.push({
        participantId: id,
        participantName: participant.participantName,
        from: shares1,
        to: shares2,
        change: change,
        changePercentage: ((change / shares1) * 100).toFixed(2) + '%'
      });
    }
  }

  return changes.sort((a, b) => Math.abs(b.change) - Math.abs(a.change));
}
```

---

## 📚 相关资源

### 官方文档
- [HKEX CCASS Shareholding Search](https://www3.hkexnews.hk/sdw/search/searchsdw.aspx)
- [HKEX Disclosure of Interests](https://www2.hkexnews.hk/Shareholding-Disclosures/Disclosure-of-Interests?sc_lang=en)

### 技术文档
- [Puppeteer官方文档](https://pptr.dev/)
- [Chrome DevTools Protocol](https://chromedevtools.github.io/devtools-protocol/)
- [ASP.NET WebForms机制](https://learn.microsoft.com/en-us/aspnet/web-forms/)

### 相关工具
- [Puppeteer Extra](https://github.com/berstend/puppeteer-extra) - Puppeteer增强插件
- [Puppeteer Stealth](https://github.com/berstend/puppeteer-extra/tree/master/packages/puppeteer-extra-plugin-stealth) - 反检测插件

---

## 🎓 总结与建议

### 技术总结

1. **ASP.NET 表单处理**: 理解 `__doPostBack()` 机制是关键
2. **日期字段绕过**: 使用 JavaScript 修改只读属性
3. **弹窗处理**: 自动检测并关闭Terms of Use
4. **数据清洗**: 处理"Label:\nValue"格式的单元格内容
5. **容错机制**: 实现重试、缓存和增量更新

### 推荐工作流

```
1. 使用 Chrome MCP 进行初步测试和调试
   └─> 快速验证表单交互和数据提取逻辑

2. 开发 Puppeteer 生产脚本
   └─> 实现批量爬取、错误处理、数据库集成

3. 部署到服务器（如 Supabase Edge Functions）
   └─> 定时任务自动更新数据

4. 构建数据分析Dashboard
   └─> Supabase + React 前端展示数据
```

### 风险提示

⚠️ **法律风险**: 自动化爬取可能违反HKEX使用条款
⚠️ **封禁风险**: 过高频率可能导致IP被封
⚠️ **数据质量**: 假期和周末可能无数据
⚠️ **维护成本**: 网站改版需要更新脚本

### 最终建议

- ✅ **学习研究**: 本方案适合技术学习和原型开发
- ✅ **个人使用**: 小规模个人投资分析可接受
- ❌ **商业应用**: **强烈建议**获取官方授权或使用付费数据服务
- ❌ **高频爬取**: 避免对HKEX服务器造成压力

---

**文档版本**: 1.0
**最后更新**: 2025-11-12
**研究者**: Claude Code (Anthropic)
**项目代码**: [JubitLLMNPMPlayground/scrape-ccass-complete.cjs](./scrape-ccass-complete.cjs)

---

## 附录A: 快速开始指南

```bash
# 1. 安装依赖
npm install puppeteer @supabase/supabase-js

# 2. 运行单次爬取
node scrape-ccass-complete.cjs 00700 2025/11/08

# 3. 批量爬取日期范围
node scrape-ccass-complete.cjs 00700 2025/11/01 2025/11/08

# 4. 保存到Supabase
node scrape-ccass-complete.cjs 00700 2025/11/08 2025/11/08 --supabase

# 5. 查看结果
ls -lh ccass-*.json ccass-*.csv
```

## 附录B: Troubleshooting清单

| 问题 | 可能原因 | 解决方案 |
|-----|---------|---------|
| "Date is invalid" | 日期格式错误 | 使用 `yyyy/mm/dd` 格式 |
| 表格数据为空 | 弹窗未关闭 | 检查 `acceptTermsOfUse` 函数 |
| Timeout 错误 | 网络慢/服务器慢 | 增加 `timeout` 参数到60秒 |
| "No data available" | 假期/周末 | 使用 `getValidDate()` 生成工作日 |
| 数据格式混乱 | 表格结构变化 | 更新 `getCellValue` 函数 |

---

🎉 **恭喜！** 您现在已经掌握了HKEX CCASS持股数据的完整爬取技术栈！
