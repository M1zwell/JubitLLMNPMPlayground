# Component Pattern Library

Reusable code snippets and patterns extracted from AdvancedPlaygroundDemo.tsx for rapid implementation.

---

## Feature Cards (Semantic Colored)

### AI/Intelligence Card (Purple)
```tsx
<div className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800">
  <h3 className="font-semibold mb-2 flex items-center">
    <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
    AI Feature Title
  </h3>
  {/* Content */}
</div>
```

### Security/Alert Card (Red)
```tsx
<div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-800">
  <h3 className="font-semibold mb-2 flex items-center">
    <Shield className="w-5 h-5 mr-2 text-red-600" />
    Security Feature
  </h3>
  {/* Content */}
</div>
```

### Performance Card (Green)
```tsx
<div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800">
  <h3 className="font-semibold mb-2 flex items-center">
    <Zap className="w-5 h-5 mr-2 text-green-600" />
    Performance Feature
  </h3>
  {/* Content */}
</div>
```

---

## Metric Display Grids

### 3-Column Metrics
```tsx
<div className="grid grid-cols-3 gap-3">
  <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 text-center">
    <div className="text-2xl font-bold text-green-600">234ms</div>
    <div className="text-sm text-gray-600 dark:text-gray-400">执行时间</div>
  </div>
  {/* More metric cards */}
</div>
```

### Stats Summary (4-Column)
```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
    <p className="text-xs text-blue-600 font-medium">Total Records</p>
    <p className="text-2xl font-bold text-blue-900">{count}</p>
  </div>
  {/* More stat cards */}
</div>
```

---

## Issue/Alert Lists

### Alert Item with Left Border
```tsx
<div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 border-l-4 border-l-red-400">
  <div className="flex items-start justify-between">
    <div className="flex-1">
      <div className="flex items-center mb-1">
        <AlertTriangle className="w-4 h-4 mr-2 text-red-600" />
        <span className="font-medium text-sm">Issue Title</span>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Description</p>
      <p className="text-sm text-green-600 dark:text-green-400">
        <strong>修复建议:</strong> Solution
      </p>
    </div>
  </div>
</div>
```

---

## Buttons

### Primary Action Button
```tsx
<button
  onClick={handleAction}
  disabled={isLoading}
  className="btn-minimal btn-primary bg-blue-600 hover:bg-blue-700 text-sm disabled:opacity-50"
>
  {isLoading ? 'Processing...' : 'Take Action'}
</button>
```

### Quick Action Buttons (Pill Style)
```tsx
<button
  onClick={() => setQuery('Example')}
  className="btn-minimal btn-ghost text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300"
>
  Example Action
</button>
```

---

## Tabs Navigation

### Horizontal Tabs
```tsx
<div className="flex space-x-1 overflow-x-auto">
  {features.map((feature, key) => (
    <button
      key={key}
      onClick={() => setActive(key)}
      className={`
        flex items-center px-4 py-3 border-b-2 transition-colors whitespace-nowrap
        ${active === key
          ? 'border-blue-600 text-blue-600 dark:text-blue-400'
          : 'border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300'}
      `}
    >
      <Icon className="w-4 h-4 mr-2" />
      <span className="font-medium">{feature.title}</span>
    </button>
  ))}
</div>
```

---

## Progress Bars

### Horizontal Progress Bar
```tsx
<div className="flex items-center">
  <div className="w-32 bg-gray-200 dark:bg-gray-700 rounded-full h-2 mr-2">
    <div
      className="bg-green-500 h-2 rounded-full"
      style={{ width: `${percentage}%` }}
    />
  </div>
  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
    {value}ms
  </span>
</div>
```

---

## Code Display

### Syntax Highlighted Code Block
```tsx
<div className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
  <pre className="text-sm">
    <code>{generatedCode}</code>
  </pre>
</div>
```

### Inline Code
```tsx
<code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">
  codeSnippet
</code>
```

---

## Info Boxes

### Success/Info Box
```tsx
<div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-md border border-blue-100 dark:border-blue-800">
  <p className="text-sm text-blue-800 dark:text-blue-300">
    <strong>Explanation:</strong> Information text here
  </p>
</div>
```

### Best Practices Box
```tsx
<div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg border border-blue-100 dark:border-blue-800">
  <h4 className="font-medium text-sm mb-2 text-blue-800 dark:text-blue-300">
    Best Practices
  </h4>
  <ul className="text-sm space-y-1 text-gray-700 dark:text-gray-300">
    {recommendations.map((rec, index) => (
      <li key={index} className="flex items-start">
        <span className="text-blue-600 mr-2">•</span>
        {rec}
      </li>
    ))}
  </ul>
</div>
```

---

## Checklist Items

### Success Checklist
```tsx
<div className="flex items-start space-x-2">
  <CheckCircle2 className="w-4 h-4 text-green-600 mt-0.5" />
  <div className="text-sm">
    <strong>Label:</strong> Description or instruction
  </div>
</div>
```

---

## User Avatars / Collaboration

### Avatar Stack (Overlapping)
```tsx
<div className="flex -space-x-2">
  {users.map(user => (
    <div
      key={user.id}
      className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center border-2 border-white dark:border-gray-600"
      style={{ backgroundColor: user.color + '20', borderColor: user.color }}
      title={user.name}
    >
      <span className="text-lg">{user.avatar}</span>
    </div>
  ))}
</div>
```

---

## Visual Pipeline / Flow

### Pipeline Node
```tsx
<div className={`
  flex flex-col items-center p-3 rounded-lg border-2
  ${type === 'input' ? 'border-green-400 bg-green-50 dark:bg-green-900/30 text-green-800 dark:text-green-300' :
    type === 'process' ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' :
    'border-purple-400 bg-purple-50 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300'}
`}>
  <span className="text-2xl mb-1">{icon}</span>
  <span className="text-xs font-medium">{name}</span>
</div>
```

---

## Loading States

### Spinner Button
```tsx
<button disabled={isLoading} className="...">
  {isLoading ? (
    <>
      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      Processing...
    </>
  ) : (
    <>
      <Icon className="w-4 h-4 mr-2" />
      Action
    </>
  )}
</button>
```

---

## Responsive Layouts

### Sidebar + Main Content
```tsx
<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
  <div className="lg:col-span-1">
    {/* Sidebar content */}
  </div>
  <div className="lg:col-span-2">
    {/* Main content */}
  </div>
</div>
```

---

## Context-Specific Pattern Extensions

The patterns above represent the **Core** design system. For components with specialized requirements, refer to the following context-specific pattern documents:

### Data Hub Patterns
**Document**: `data-hub-patterns.md`
**Use for**: Financial data management interfaces, scrapers, data importers

**Unique Patterns**:
- **4-Column Stats Dashboard** - Colored metric cards for quick data overview
- **Gray Filter Panels** - Functional filtering interfaces with export buttons
- **Enhanced Data Cards** - Rich data display with tags, badges, and metadata
- **Highlighted Filter Sections** - Blue-bordered primary filters for emphasis
- **Export Action Buttons** - Compact JSON/CSV export controls

**Example Components**: HKScraperProduction.tsx, WebbDataImporter.tsx

---

### Offshore Hub Patterns
**Document**: `offshore-hub-patterns.md`
**Use for**: Premium offshore financial regulatory platforms

**Unique Patterns**:
- **Page Background Gradients** - Subtle cyan-teal gradients for premium feel
- **Text Gradient Headings** - Eye-catching gradient text effects
- **Gradient Tab Buttons** - Premium tab styling with gradient backgrounds
- **Large Rounded Cards** - Extra-soft rounded-2xl containers
- **Gradient Stat Cards** - Color-coded metrics with gradient backgrounds
- **Live Status Indicators** - Animated pulse indicators for real-time data
- **Dual-Color Jurisdiction Scheme** - Cyan for CIMA, Teal for BVI

**Example Components**: OffshoreDataHub.tsx, CIMAViewer.tsx, BVIViewer.tsx

---

### Quick Pattern Lookup

| Pattern Type | Context | Document |
|--------------|---------|----------|
| Semantic Feature Cards | Core | This document |
| Button Styles | Core | This document |
| Input Fields | Core | This document |
| Tabs | Core | This document |
| 4-Column Stats Dashboard | Data Hub | data-hub-patterns.md |
| Gray Filter Panels | Data Hub | data-hub-patterns.md |
| Page Gradients | Offshore Hub | offshore-hub-patterns.md |
| Text Gradient Headings | Offshore Hub | offshore-hub-patterns.md |
| Gradient Tab Buttons | Offshore Hub | offshore-hub-patterns.md |

---

### Pattern Selection Guide

**When implementing a component**, ask:

1. **Is it a financial data management interface?**
   - Has filtering, sorting, export?
   - Displays large datasets?
   - Shows stats dashboards?
   - → Use **data-hub-patterns.md**

2. **Is it a premium offshore regulatory platform?**
   - Has jurisdiction switching?
   - Needs premium visual treatment?
   - Shows offshore financial data?
   - → Use **offshore-hub-patterns.md**

3. **Otherwise**:
   - → Use **this document (patterns.md)**

---

_Last updated: 2025-11-17_
_Core Source: AdvancedPlaygroundDemo.tsx_
_Extended with context-specific patterns from HKScraperProduction.tsx and OffshoreDataHub.tsx_
