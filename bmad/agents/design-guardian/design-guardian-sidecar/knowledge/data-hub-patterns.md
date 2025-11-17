# Financial Data Hub Design Patterns

**Context**: These patterns are specific to financial data management interfaces like HK scraper pages and should be treated as acceptable design variants alongside the core design system from AdvancedPlaygroundDemo.tsx.

**When to Use**: Components that display financial/regulatory data, perform data scraping, show large datasets with filtering, or manage data import/export operations.

**Compatibility**: ✅ All patterns use core design tokens (colors, spacing, typography) but apply them in domain-specific ways for data-intensive interfaces.

---

## Pattern Library

### 1. Stats Dashboard Cards (4-Column Grid)

**Purpose**: Display key metrics and statistics at a glance with color-coded categories.

**Pattern Status**: ⚠️ **Domain-Specific Variant** - Not in Advanced page, unique to data hubs.

**Characteristics**:
- 4-column grid on desktop, 2-column on mobile
- Each card has unique semantic color (blue, green, purple, orange)
- Light background with matching border
- Small label text + large bold number
- Compact spacing (p-3, gap-3)

**Code Example**:
```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
    <p className="text-xs text-blue-600 font-medium">Total Records</p>
    <p className="text-2xl font-bold text-blue-900">{count}</p>
  </div>
  <div className="p-3 bg-green-50 border border-green-200 rounded-md">
    <p className="text-xs text-green-600 font-medium">Filtered</p>
    <p className="text-2xl font-bold text-green-900">{filteredCount}</p>
  </div>
  <div className="p-3 bg-purple-50 border border-purple-200 rounded-md">
    <p className="text-xs text-purple-600 font-medium">Categories</p>
    <p className="text-2xl font-bold text-purple-900">{categories}</p>
  </div>
  <div className="p-3 bg-orange-50 border border-orange-200 rounded-md">
    <p className="text-xs text-orange-600 font-medium">Tags</p>
    <p className="text-2xl font-bold text-orange-900">{tags}</p>
  </div>
</div>
```

**Dark Mode Variant**:
```tsx
<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
    <p className="text-xs text-blue-600 dark:text-blue-400 font-medium">Total Records</p>
    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{count}</p>
  </div>
  {/* Repeat pattern for green, purple, orange */}
</div>
```

**When NOT to Use**: Simple pages without metrics, components that don't need stats overview.

---

### 2. Gray Filter Panels

**Purpose**: Provide comprehensive filtering interface without competing visually with data results.

**Pattern Status**: ⚠️ **Domain-Specific Variant** - Uses gray instead of Advanced page's colored panels.

**Characteristics**:
- Gray background (bg-gray-50) instead of colored backgrounds
- Gray border (border-gray-200) for subtle separation
- Compact padding (p-4)
- "Clear all" button in header (text-xs text-blue-600)
- Multi-column grid for filter inputs (md:grid-cols-2 lg:grid-cols-3)
- Sort controls and export buttons in footer (border-t)

**Code Example**:
```tsx
<div className="p-4 bg-gray-50 border border-gray-200 rounded-md space-y-3">
  {/* Header */}
  <div className="flex items-center justify-between">
    <h4 className="font-medium text-sm">Filters</h4>
    <button
      onClick={handleClearFilters}
      className="text-xs text-blue-600 hover:underline"
    >
      Clear all
    </button>
  </div>

  {/* Filter Grid */}
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
    {/* Search Input */}
    <div>
      <label className="block text-xs font-medium mb-1">Search</label>
      <input
        type="text"
        placeholder="Search title, summary..."
        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
      />
    </div>

    {/* Select Filter */}
    <div>
      <label className="block text-xs font-medium mb-1">Category</label>
      <select className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded">
        <option value="all">All Types</option>
        {/* Options */}
      </select>
    </div>

    {/* Date Input */}
    <div>
      <label className="block text-xs font-medium mb-1">Date From</label>
      <input
        type="date"
        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded"
      />
    </div>
  </div>

  {/* Sort and Export Footer */}
  <div className="flex items-center justify-between pt-2 border-t border-gray-300">
    <div className="flex items-center gap-2">
      <label className="text-xs font-medium">Sort by:</label>
      <select className="px-2 py-1 text-xs border border-gray-300 rounded">
        <option value="date-desc">Date (Newest)</option>
        <option value="date-asc">Date (Oldest)</option>
      </select>
    </div>
    <div className="flex gap-2">
      <button className="btn-minimal btn-secondary text-xs flex items-center gap-1">
        <FileJson size={14} />
        Export JSON
      </button>
      <button className="btn-minimal btn-secondary text-xs flex items-center gap-1">
        <FileSpreadsheet size={14} />
        Export CSV
      </button>
    </div>
  </div>
</div>
```

**Dark Mode Variant**:
```tsx
<div className="p-4 bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700 rounded-md space-y-3">
  <div className="flex items-center justify-between">
    <h4 className="font-medium text-sm dark:text-gray-100">Filters</h4>
    <button className="text-xs text-blue-600 dark:text-blue-400 hover:underline">
      Clear all
    </button>
  </div>
  {/* Rest of the pattern with dark: variants */}
</div>
```

---

### 3. Enhanced Data Cards (With Tags & Metadata)

**Purpose**: Display rich data records with multiple metadata fields, tags, and action buttons.

**Pattern Status**: ✅ **Compatible with Advanced** - Uses core design tokens with enhanced content layout.

**Characteristics**:
- White background with border (border-gray-200)
- Hover shadow effect (hover:shadow-md transition-shadow)
- Company/stock code badges (bg-blue-100 text-blue-700)
- Purple tag badges (bg-purple-100 text-purple-700)
- Metadata row with icons (text-xs text-gray-500)
- Action links (text-blue-600, text-green-600)
- Compact padding (p-4)

**Code Example**:
```tsx
<div className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow bg-white">
  {/* Header with Title and Code */}
  <div className="flex items-start justify-between gap-3 mb-2">
    <h4 className="font-semibold text-sm flex-1 leading-snug">{title}</h4>
    {companyCode && (
      <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-mono rounded">
        {companyCode}
      </span>
    )}
  </div>

  {/* Summary */}
  {summary && (
    <p className="text-xs text-gray-600 mb-2 leading-relaxed">
      {summary}
    </p>
  )}

  {/* Tags */}
  {tags && tags.length > 0 && (
    <div className="flex flex-wrap gap-1 mb-2">
      {tags.map((tag, idx) => (
        <span
          key={idx}
          className="px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded"
        >
          {tag}
        </span>
      ))}
    </div>
  )}

  {/* Metadata Row with Icons */}
  <div className="flex items-center gap-3 text-xs text-gray-500 mb-2">
    <span className="flex items-center gap-1">
      <Building2 size={12} />
      {type}
    </span>
    {date && (
      <span className="flex items-center gap-1">
        <Calendar size={12} />
        {new Date(date).toLocaleDateString()}
      </span>
    )}
    {companyName && (
      <span className="truncate">{companyName}</span>
    )}
  </div>

  {/* Action Links */}
  <div className="flex items-center gap-2">
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-xs text-blue-600 hover:underline flex items-center gap-1"
    >
      <Eye size={12} />
      View source
    </a>
    {pdfUrl && (
      <a
        href={pdfUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-xs text-green-600 hover:underline flex items-center gap-1"
      >
        <Download size={12} />
        Download PDF
      </a>
    )}
  </div>
</div>
```

**Dark Mode Variant**:
```tsx
<div className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow bg-white dark:bg-gray-800">
  <div className="flex items-start justify-between gap-3 mb-2">
    <h4 className="font-semibold text-sm flex-1 leading-snug dark:text-gray-100">{title}</h4>
    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-xs font-mono rounded">
      {companyCode}
    </span>
  </div>
  {/* Rest with dark: variants */}
</div>
```

---

### 4. Highlighted Filter Section (Blue Accent)

**Purpose**: Emphasize primary filters (stock code, date range) above secondary filters.

**Pattern Status**: ⚠️ **Domain-Specific Variant** - Adds visual hierarchy not present in Advanced page.

**Characteristics**:
- White background with blue border (border-blue-200)
- Blue accent labels (text-blue-700 font-semibold)
- Emoji icons for visual emphasis (📊, 📅)
- Thicker border on inputs (border-2 border-blue-300)
- Focus states (focus:border-blue-500)

**Code Example**:
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-white rounded border border-blue-200">
  {/* Stock Code Filter */}
  <div>
    <label className="block text-sm font-semibold mb-1.5 text-blue-700">
      📊 Stock Code
    </label>
    <select className="w-full px-3 py-2 text-sm font-medium border-2 border-blue-300 rounded focus:border-blue-500 focus:outline-none">
      <option value="">All Stocks ({count})</option>
      {/* Options */}
    </select>
  </div>

  {/* Date From */}
  <div>
    <label className="block text-sm font-semibold mb-1.5 text-blue-700">
      📅 Date From
    </label>
    <input
      type="date"
      className="w-full px-3 py-2 text-sm font-medium border-2 border-blue-300 rounded focus:border-blue-500 focus:outline-none"
    />
  </div>

  {/* Date To */}
  <div>
    <label className="block text-sm font-semibold mb-1.5 text-blue-700">
      📅 Date To
    </label>
    <input
      type="date"
      className="w-full px-3 py-2 text-sm font-medium border-2 border-blue-300 rounded focus:border-blue-500 focus:outline-none"
    />
  </div>
</div>
```

**Dark Mode Variant**:
```tsx
<div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-3 bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-blue-800">
  <div>
    <label className="block text-sm font-semibold mb-1.5 text-blue-700 dark:text-blue-400">
      📊 Stock Code
    </label>
    <select className="w-full px-3 py-2 text-sm font-medium border-2 border-blue-300 dark:border-blue-700 dark:bg-gray-700 dark:text-gray-100 rounded focus:border-blue-500 dark:focus:border-blue-500 focus:outline-none">
      {/* Options */}
    </select>
  </div>
  {/* Rest with dark: variants */}
</div>
```

---

### 5. Export Action Buttons

**Purpose**: Provide data export functionality in compact, icon-labeled buttons.

**Pattern Status**: ✅ **Compatible with Advanced** - Uses btn-minimal classes from core system.

**Characteristics**:
- Small size (text-xs)
- Secondary button style (btn-minimal btn-secondary)
- Icon + text combo (gap-1)
- Grouped in flex container (flex gap-2)

**Code Example**:
```tsx
<div className="flex gap-2">
  <button className="btn-minimal btn-secondary text-xs flex items-center gap-1">
    <FileJson size={14} />
    Export JSON
  </button>
  <button className="btn-minimal btn-secondary text-xs flex items-center gap-1">
    <FileSpreadsheet size={14} />
    Export CSV
  </button>
  <button className="btn-minimal btn-primary text-xs flex items-center gap-1">
    <Database size={14} />
    Analyze
  </button>
</div>
```

**Dark Mode**: Automatically handled by btn-minimal classes.

---

### 6. Info/Status Boxes

**Purpose**: Display informational messages or scraping status with color-coded feedback.

**Pattern Status**: ✅ **Compatible with Advanced** - Uses semantic color system.

**Characteristics**:
- Colored backgrounds (bg-blue-50, bg-green-50, bg-red-50)
- Matching borders (border-blue-200, etc.)
- Icon + content layout (flex items-start gap-2)
- Compact text (text-sm, text-xs)

**Code Examples**:

**Info Box (Blue)**:
```tsx
<div className="p-4 bg-blue-50 border border-blue-200 rounded-md">
  <div className="flex items-start gap-2">
    <Database className="text-blue-600 mt-0.5" size={16} />
    <div className="text-sm">
      <p className="font-medium text-blue-900 mb-1">Backend-Only Scraping</p>
      <ul className="text-blue-700 space-y-1 text-xs">
        <li>✅ Scraping performed by Edge Function</li>
        <li>✅ Database writes handled server-side</li>
      </ul>
    </div>
  </div>
</div>
```

**Success Box (Green)**:
```tsx
<div className="p-4 bg-green-50 border border-green-200 rounded-md">
  <div className="flex items-center gap-2 mb-2">
    <CheckCircle className="text-green-600" size={20} />
    <h3 className="font-medium">Scraping Completed</h3>
  </div>
  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
    <div>
      <span className="text-gray-600">Inserted:</span>
      <span className="ml-2 font-semibold text-green-600">{count}</span>
    </div>
    {/* More stats */}
  </div>
</div>
```

**Error Box (Red)**:
```tsx
<div className="p-4 bg-red-50 border border-red-200 rounded-md">
  <div className="flex items-center gap-2 mb-2">
    <AlertCircle className="text-red-600" size={20} />
    <h3 className="font-medium">Scraping Failed</h3>
  </div>
  <p className="text-red-700 text-sm">{errorMessage}</p>
</div>
```

**Dark Mode Variants**:
```tsx
{/* Info - Blue */}
<div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
  <Database className="text-blue-600 dark:text-blue-400 mt-0.5" size={16} />
  <p className="font-medium text-blue-900 dark:text-blue-100">Backend-Only Scraping</p>
  <ul className="text-blue-700 dark:text-blue-300 space-y-1 text-xs">...</ul>
</div>

{/* Success - Green */}
<div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
  <CheckCircle className="text-green-600 dark:text-green-400" size={20} />
  <span className="text-green-600 dark:text-green-400">{count}</span>
</div>

{/* Error - Red */}
<div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
  <AlertCircle className="text-red-600 dark:text-red-400" size={20} />
  <p className="text-red-700 dark:text-red-300 text-sm">{errorMessage}</p>
</div>
```

---

### 7. Scrollable Results Container

**Purpose**: Display large datasets in a constrained viewport with smooth scrolling.

**Pattern Status**: ✅ **Compatible with Advanced** - Standard utility classes.

**Characteristics**:
- Fixed max height (max-h-96 = 384px)
- Vertical overflow scrolling (overflow-y-auto)
- Spaced items (space-y-3)

**Code Example**:
```tsx
<div className="space-y-3 max-h-96 overflow-y-auto">
  {data.map(item => (
    <div key={item.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow bg-white">
      {/* Card content */}
    </div>
  ))}
</div>
```

**Dark Mode**:
```tsx
<div className="space-y-3 max-h-96 overflow-y-auto">
  {data.map(item => (
    <div key={item.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md transition-shadow bg-white dark:bg-gray-800">
      {/* Card content */}
    </div>
  ))}
</div>
```

---

## Design Principles for Data Hubs

1. **Information Density**: Data hubs prioritize showing more information in less space (compact padding, smaller text).

2. **Functional Colors**: Use semantic colors (blue, green, purple, orange) to categorize different types of data or metrics, not just for visual variety.

3. **Gray for Chrome**: Filters and controls use gray backgrounds to avoid competing with colorful data content.

4. **Quick Scanning**: Tags, badges, and icons help users quickly scan and identify relevant information.

5. **Export-First**: Data management interfaces always provide export options (JSON, CSV) prominently.

6. **Filtering Hierarchy**: Primary filters (stock code, date range) get visual emphasis; secondary filters use standard inputs.

7. **Responsive Grids**: Stats and filters adapt from multi-column on desktop to stacked on mobile.

---

## Color Usage Summary

| Color | Usage | Example |
|-------|-------|---------|
| **Blue** | Total/primary metrics, stock codes, primary filters | Total records, company codes |
| **Green** | Filtered/active counts, success states, download actions | Filtered results, scraping success |
| **Purple** | Categories/tags, type counts | Filing types, tags |
| **Orange** | Additional metrics, warnings | Tag counts, minor alerts |
| **Gray** | Filter panels, chrome, neutral backgrounds | Filter containers, disabled states |
| **Red** | Errors, failures, critical alerts | Scraping failures, failed records |

---

## When to Harmonize vs. Preserve

**✅ Safe to Harmonize**:
- Typography inconsistencies (font sizes not matching design system)
- Missing dark mode variants
- Arbitrary spacing values not on Tailwind scale
- Inconsistent button styles (should use btn-minimal)
- Missing hover/focus states

**⚠️ Preserve These Patterns**:
- 4-column stats dashboard grids (unique to data hubs)
- Gray filter panel backgrounds (intentional, not a bug)
- Highlighted blue filter sections (functional hierarchy)
- Compact spacing (p-3 instead of p-4 for stats cards)
- Tags with purple backgrounds (semantic meaning)
- Export button placement in filter footers

---

## Component Detection

**How to identify a data hub component**:
1. File name contains: "Scraper", "Data", "Hub", "Import", "Export"
2. Contains filter panels with 3+ filter inputs
3. Has stats dashboard (4-column grid with metrics)
4. Includes export buttons (JSON, CSV)
5. Displays tabular or list data with pagination/scrolling
6. Shows tags, badges, or metadata fields

**Examples**:
- ✅ HKScraperProduction.tsx
- ✅ OffshoreDataHub.tsx
- ✅ WebbDataImporter.tsx (if exists)
- ❌ AdvancedPlaygroundDemo.tsx (reference, not data hub)
- ❌ AuthModal.tsx (UI component, not data hub)
- ❌ MultiModelChat.tsx (chat interface, not data hub)
