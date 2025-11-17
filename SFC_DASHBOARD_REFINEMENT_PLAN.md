# SFC Financial Statistics Dashboard - Refinement Plan

## 📊 Data Analysis: Most Important Metrics

Based on 1,046 real records, here are the KEY INSIGHTS to display:

### Priority 1: CRITICAL METRICS (Top Dashboard KPIs)

#### 1. Market Overview (Table A1 - 29 years)
**Most Important Fields:**
- ✅ **Total Market Cap** (market_cap) - Primary market health indicator
- ✅ **Daily Turnover** (turnover) - Market liquidity
- ✅ **Total Listings** (total_listings) - Market breadth
- ⚠️ Skip: new_listings (often null), funds_raised (often null)

**Best Chart:** Dual-axis line chart
- Left Y-axis: Market Cap (HK$ billion)
- Right Y-axis: Turnover (HK$ billion)
- X-axis: Year (1997-2025)
- **Why:** Shows market growth AND liquidity trends together

#### 2. Market Composition (Table A2 - 141 records)
**Most Important Fields:**
- ✅ **Main Board Total** - Core market
- ✅ **H-shares** - Mainland China exposure
- ✅ **HSI Constituents** - Blue chip concentration
- ⚠️ Skip: GEM (small cap, less significant)

**Best Chart:** Stacked area chart (latest 10 years)
- Shows market composition evolution
- Highlights H-share dominance trend
- Color-coded by stock type
- **Why:** Reveals structural changes in HK market

#### 3. Fund Industry Health (Table D3 - 200 quarterly records)
**Most Important Fields:**
- ✅ **Bond funds NAV** - Safe haven indicator
- ✅ **Equity funds NAV** - Risk appetite
- ✅ **Index funds NAV** - Passive investing growth
- ✅ **Total NAV** - Overall fund industry size
- ⚠️ Skip: Guaranteed (tiny), Hedge (n.a.), Feeder (tiny)

**Best Chart:** Stacked bar chart (latest 8 quarters)
- Shows quarterly fund flow patterns
- 4 major categories: Bond, Equity, Index, Money Market
- **Why:** Most recent trends matter for fund industry

### Priority 2: REGULATORY INSIGHTS

#### 4. Licensed Professionals Growth (Tables C4+C5)
**Most Important Activities:**
- ✅ **RA1 (Dealing in securities)** - Core activity, largest count
- ✅ **RA4 (Advising on securities)** - Advisory services
- ✅ **RA9 (Asset management)** - Growing segment
- ✅ **Total** - Industry size
- ⚠️ Skip: RA8, RA10, RA11, RA12, RA13 (very small counts)

**Best Chart:** Multi-line chart (latest 10 years)
- 4 lines: RA1, RA4, RA9, Total
- Shows regulatory activity growth
- **Why:** Tracks industry professionalization

### Priority 3: TREND ANALYSIS

#### 5. Fund Flows (Table D4 - 7 years)
**Most Important Field:**
- ✅ **Net Flows** - Only meaningful metric available
- Shows whether money is entering or leaving funds

**Best Chart:** Bar chart with color coding
- Green bars: Positive net flows (money in)
- Red bars: Negative net flows (money out)
- 2019-2025 annual data
- **Why:** Clear visual of investor sentiment

#### 6. Market Velocity (Table A3 - 141 records)
**Most Important Insight:**
- ✅ **Main Board turnover** - Core market activity
- ✅ **H-shares turnover** - Cross-border trading
- Calculate: **Turnover Velocity** = Daily Turnover / Market Cap
- **Why:** Shows market efficiency, not just size

---

## 🎨 Refined Dashboard Layout

### Top Section: KPI Cards (4 cards)

```
┌─────────────────────┬─────────────────────┬─────────────────────┬─────────────────────┐
│  Market Cap (2025)  │  Daily Turnover     │  Total Listings     │  Fund Industry NAV  │
│  HK$ 37.2T ▲ 5.2%  │  HK$ 148B ▲ 2.1%   │  2,665 ▲ 15        │  HK$ 291B ▲ 9.4%  │
│  vs Last Year       │  vs Last Year       │  vs Last Year       │  vs Last Quarter    │
└─────────────────────┴─────────────────────┴─────────────────────┴─────────────────────┘
```

### Main Charts Section

#### Row 1: Market Overview (50% width each)

**Chart 1: Market Cap & Turnover Trend (1997-2025)**
- Type: Dual-axis line chart
- Data: Table A1, all 29 years
- Left axis: Market cap (billions)
- Right axis: Daily turnover (billions)
- Smoothing: Yes
- **Key Insight:** Long-term growth trajectory

**Chart 2: Market Composition Evolution (2015-2025)**
- Type: Stacked area chart (100%)
- Data: Table A2, latest 10 years
- Categories: Main Board HK, H-shares, HSI Constituents
- **Key Insight:** H-share dominance trend

#### Row 2: Fund Industry (Full width)

**Chart 3: Quarterly Fund NAV by Category (Latest 8 Quarters)**
- Type: Stacked bar chart
- Data: Table D3, latest 2 years quarterly
- Categories: Bond (blue), Equity (green), Index (purple), Money Market (orange)
- Show totals on top of bars
- **Key Insight:** Fund category performance

#### Row 3: Regulatory & Flows (50% width each)

**Chart 4: Licensed Professionals Growth (2015-2025)**
- Type: Multi-line chart
- Data: Tables C4+C5, latest 10 years
- Lines: RA1 (blue), RA4 (green), RA9 (orange), Total (gray dashed)
- **Key Insight:** Industry professionalization

**Chart 5: Annual Fund Flows (2019-2025)**
- Type: Bar chart with conditional colors
- Data: Table D4, all 7 years
- Green: Positive flows, Red: Negative flows
- Show values in billions
- **Key Insight:** Investor sentiment

---

## 📐 Chart Specifications

### Chart 1: Market Cap & Turnover (Recharts)
```tsx
<LineChart data={marketHighlightsData}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="period" />
  <YAxis yAxisId="left" label={{ value: 'Market Cap (HK$ B)', angle: -90 }} />
  <YAxis yAxisId="right" orientation="right" label={{ value: 'Turnover (HK$ B)', angle: 90 }} />
  <Tooltip />
  <Legend />
  <Line yAxisId="left" type="monotone" dataKey="market_cap" stroke="#3b82f6" strokeWidth={2} name="Market Cap" />
  <Line yAxisId="right" type="monotone" dataKey="turnover" stroke="#10b981" strokeWidth={2} name="Daily Turnover" />
</LineChart>
```

### Chart 2: Market Composition (Recharts)
```tsx
<AreaChart data={marketCompositionData}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="year" />
  <YAxis label={{ value: 'Market Cap (HK$ B)', angle: -90 }} />
  <Tooltip />
  <Legend />
  <Area type="monotone" dataKey="mainBoard" stackId="1" stroke="#3b82f6" fill="#3b82f6" name="Main Board HK" />
  <Area type="monotone" dataKey="hShares" stackId="1" stroke="#ef4444" fill="#ef4444" name="H-shares" />
  <Area type="monotone" dataKey="hsiConstituents" stackId="1" stroke="#f59e0b" fill="#f59e0b" name="HSI Constituents" />
</AreaChart>
```

### Chart 3: Fund NAV by Category (Recharts)
```tsx
<BarChart data={fundNAVData}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="period" />
  <YAxis label={{ value: 'NAV (HK$ B)', angle: -90 }} />
  <Tooltip />
  <Legend />
  <Bar dataKey="bond" stackId="a" fill="#3b82f6" name="Bond" />
  <Bar dataKey="equity" stackId="a" fill="#10b981" name="Equity" />
  <Bar dataKey="index" stackId="a" fill="#8b5cf6" name="Index" />
  <Bar dataKey="moneyMarket" stackId="a" fill="#f59e0b" name="Money Market" />
</BarChart>
```

### Chart 4: Licensed Professionals (Recharts)
```tsx
<LineChart data={licensedRepData}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="year" />
  <YAxis label={{ value: 'Number of Representatives', angle: -90 }} />
  <Tooltip />
  <Legend />
  <Line type="monotone" dataKey="ra1" stroke="#3b82f6" strokeWidth={2} name="RA1 - Dealing" />
  <Line type="monotone" dataKey="ra4" stroke="#10b981" strokeWidth={2} name="RA4 - Advising" />
  <Line type="monotone" dataKey="ra9" stroke="#f59e0b" strokeWidth={2} name="RA9 - Asset Mgmt" />
  <Line type="monotone" dataKey="total" stroke="#6b7280" strokeWidth={2} strokeDasharray="5 5" name="Total" />
</LineChart>
```

### Chart 5: Fund Flows (Recharts)
```tsx
<BarChart data={fundFlowsData}>
  <CartesianGrid strokeDasharray="3 3" />
  <XAxis dataKey="year" />
  <YAxis label={{ value: 'Net Flows (HK$ B)', angle: -90 }} />
  <Tooltip />
  <Legend />
  <Bar dataKey="netFlows" fill={(entry) => entry.netFlows >= 0 ? '#10b981' : '#ef4444'} name="Net Fund Flows" />
</BarChart>
```

---

## 🔢 Data Transformations Needed

### 1. Market Highlights (Table A1)
```typescript
const marketHighlightsData = marketHighlights?.map(record => ({
  period: record.period,
  market_cap: Number(record.market_cap),
  turnover: Number(record.turnover),
  total_listings: record.total_listings
})) || [];

// Calculate YoY change for KPI card
const latest = marketHighlightsData[0];
const lastYear = marketHighlightsData.find(r => r.period === (parseInt(latest.period) - 1).toString());
const marketCapChange = ((latest.market_cap - lastYear.market_cap) / lastYear.market_cap * 100).toFixed(1);
```

### 2. Market Composition (Table A2)
```typescript
// Filter to latest 10 years, pivot by stock_type
const last10Years = ['2015', '2016', ..., '2025'];
const marketCompositionData = last10Years.map(year => {
  const yearData = marketCapByType?.filter(r => r.period === year);
  return {
    year,
    mainBoard: yearData.find(r => r.stock_type === 'Main Board')?.market_cap || 0,
    hShares: yearData.find(r => r.stock_type === 'H-shares')?.market_cap || 0,
    hsiConstituents: yearData.find(r => r.stock_type === 'HSI Constituents')?.market_cap || 0
  };
});
```

### 3. Fund NAV (Table D3)
```typescript
// Get latest 8 quarters, pivot by fund_category
const fundNAVData = getLatestQuarters(mutualFundNAV, 8).map(period => {
  const periodData = mutualFundNAV?.filter(r => r.period === period);
  return {
    period,
    bond: periodData.find(r => r.fund_category === 'Bond')?.nav || 0,
    equity: periodData.find(r => r.fund_category === 'Equity')?.nav || 0,
    index: periodData.find(r => r.fund_category === 'Index')?.nav || 0,
    moneyMarket: periodData.find(r => r.fund_category === 'Money Market')?.nav || 0
  };
});
```

### 4. Licensed Professionals (Tables C4+C5)
```typescript
// Combine C4 representatives data for RA1, RA4, RA9, Total
const licensedRepData = getLatestYears(licensedReps, 10).map(year => ({
  year,
  ra1: licensedReps.find(r => r.period === year && r.activity_type === 'RA1')?.representative_count || 0,
  ra4: licensedReps.find(r => r.period === year && r.activity_type === 'RA4')?.representative_count || 0,
  ra9: licensedReps.find(r => r.period === year && r.activity_type === 'RA9')?.representative_count || 0,
  total: licensedReps.find(r => r.period === year && r.activity_type === 'Total')?.representative_count || 0
}));
```

### 5. Fund Flows (Table D4)
```typescript
// Already in good shape, just map
const fundFlowsData = fundFlows?.map(record => ({
  year: record.period,
  netFlows: Number(record.net_flows)
})) || [];
```

---

## 🎯 Implementation Priority

### Phase 1: Core Metrics (Week 1)
1. ✅ Set up data hooks (already done)
2. ✅ Implement KPI cards with real data
3. ✅ Chart 1: Market Cap & Turnover
4. ✅ Chart 2: Market Composition

### Phase 2: Fund Industry (Week 2)
5. ✅ Chart 3: Fund NAV by Category
6. ✅ Chart 5: Fund Flows

### Phase 3: Regulatory (Week 3)
7. ✅ Chart 4: Licensed Professionals
8. ✅ Add data export functionality

### Phase 4: Enhancement (Week 4)
9. ✅ Add filters (year range, categories)
10. ✅ Add tooltips with insights
11. ✅ Mobile responsive design

---

## 📱 Mobile Optimization

- Stack charts vertically on mobile
- Simplify to 3 charts on mobile:
  1. Market Cap trend only
  2. Latest Fund NAV (pie chart instead of stacked bar)
  3. Fund Flows (last 3 years only)
- KPI cards: 2x2 grid on mobile

---

## 🎨 Color Palette (Consistent)

- **Blue (#3b82f6)**: Main Board, Primary metrics, RA1
- **Green (#10b981)**: Positive growth, Equity, RA4
- **Orange (#f59e0b)**: Secondary metrics, Money Market, RA9
- **Red (#ef4444)**: H-shares, Negative flows
- **Purple (#8b5cf6)**: Index funds
- **Gray (#6b7280)**: Totals, aggregates

---

## 💡 Key Insights to Highlight

1. **Market Growth**: "HK market cap grew from HK$3.2T (1997) to HK$37.2T (2025) - 11.6x increase"
2. **H-share Dominance**: "H-shares now represent 33% of market cap, up from 1.5% in 1999"
3. **Fund Industry**: "Mutual fund NAV reached HK$291B in Q3 2025, with Index funds growing fastest"
4. **Professionalization**: "Licensed representatives increased 4.2% YoY, with Asset Management (+8.1%) leading growth"
5. **Capital Flows**: "Positive fund flows of HK$41B in 2025 YTD, highest since 2021"

---

## 🔄 Data Update Frequency

- **Market Highlights (A1)**: Annual (update once per year)
- **Market Cap/Turnover (A2/A3)**: Annual (update once per year)
- **Fund NAV (D3)**: Quarterly (update 4x per year)
- **Fund Flows (D4)**: Annual (update once per year)
- **Licensed Reps (C4/C5)**: Annual (update once per year)

**Recommendation**: Set up quarterly refresh schedule to catch D3 updates, run full import annually.

---

## ✅ Success Metrics

Dashboard is successful if it shows:
1. ✅ Market health at a glance (KPI cards)
2. ✅ Long-term growth trends (29 years data)
3. ✅ Recent performance (latest quarters/years)
4. ✅ Structural changes (composition shifts)
5. ✅ Industry professionalization (regulatory data)
6. ✅ Investor sentiment (fund flows)

**Current Status**: Have 1,046 real records ready for all 6 metrics! 🎉
