# Component Context Map

**Purpose**: This document provides detection rules for identifying component contexts so Morgan can apply the appropriate design patterns during harmonization.

**Context Types**:
1. **Core** - Standard application components following AdvancedPlaygroundDemo.tsx
2. **Data Hub** - Financial data management interfaces (HK scrapers, data imports)
3. **Offshore Hub** - Premium offshore financial regulatory platforms (CIMA, BVI)
4. **Reference** - Design reference files that should NEVER be modified

---

## Context Detection Algorithm

### Step 1: Check for Reference Files (NEVER MODIFY)

**Reference files** are the golden standards and must never be harmonized.

**Detection Rules**:
- Exact filename match: `AdvancedPlaygroundDemo.tsx`
- File path contains: `/reference/`, `/templates/`, `/examples/`

**Action**: SKIP harmonization entirely. Log: "Skipped {filename} - Design reference file"

**Example**:
```typescript
if (fileName === 'AdvancedPlaygroundDemo.tsx') {
  return 'REFERENCE'; // NEVER MODIFY
}
```

---

### Step 2: Detect Offshore Hub Components

**Offshore Hub** components use premium gradient patterns and jurisdiction-specific color schemes.

**Detection Rules** (ANY of these conditions = Offshore Hub):

**By Filename**:
- Contains: `Offshore`, `CIMA`, `BVI`, `Cayman`, `Jurisdiction`
- Exact matches: `OffshoreDataHub.tsx`, `CIMAViewer.tsx`, `BVIViewer.tsx`

**By Content Patterns** (requires reading file):
- Has page background gradient: `bg-gradient-to-br from-gray-50 via-cyan-50 to-teal-50`
- Has text gradient: `bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent`
- Uses `rounded-2xl` for main containers (3+ occurrences)
- Has jurisdiction switching logic: `activeSource === 'cima'` or `activeSource === 'bvi'`
- Uses dual-color scheme: Both cyan (cyan-500/600) and teal (teal-500/600) colors
- Has gradient stat cards: `bg-gradient-to-br from-cyan-50 to-cyan-100`

**By Imports** (optional check):
- Imports `CIMAViewer` or `BVIViewer`
- Imports components with "Offshore" or "Jurisdiction" in name

**Pattern Set**: Apply **offshore-hub-patterns.md**

**Example**:
```typescript
if (
  fileName.includes('Offshore') ||
  fileName.includes('CIMA') ||
  fileName.includes('BVI') ||
  content.includes('bg-gradient-to-br from-gray-50 via-cyan-50 to-teal-50') ||
  content.includes('bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent') ||
  (content.match(/rounded-2xl/g) || []).length >= 3
) {
  return 'OFFSHORE_HUB';
}
```

---

### Step 3: Detect Data Hub Components

**Data Hub** components focus on data management, filtering, and export with functional color coding.

**Detection Rules** (2+ of these conditions = Data Hub):

**By Filename**:
- Contains: `Scraper`, `Data`, `Import`, `Export`, `Hub`, `Viewer`
- Contains jurisdiction codes: `HK`, `HKSFC`, `HKEX`, `CCASS`, `Webb`
- Exact matches: `HKScraperProduction.tsx`, `WebbDataImporter.tsx`, `NPMImporter.tsx`

**By Content Patterns** (requires reading file):
- Has 4-column stats grid: `grid grid-cols-2 md:grid-cols-4 gap-3` with colored stat cards
- Has gray filter panel: `bg-gray-50 border border-gray-200` with "Clear all" button
- Has export buttons: `FileJson` AND `FileSpreadsheet` imports from lucide-react
- Has enhanced data cards with tags: `bg-purple-100 text-purple-700` tag badges
- Has highlighted filter section: `border-blue-200` with emoji labels (📊, 📅)
- Has scrollable results: `max-h-96 overflow-y-auto` with data mapping

**By Component Features** (strong indicators):
- Has filter state management (3+ filter fields)
- Has sort functionality with dropdown
- Has data export functions (JSON/CSV)
- Has scraping/import functionality
- Displays tabular/list data from database
- Uses stock codes, company codes, or filing types

**Pattern Set**: Apply **data-hub-patterns.md**

**Example**:
```typescript
const dataHubIndicators = [
  fileName.includes('Scraper'),
  fileName.includes('Data'),
  fileName.includes('Import'),
  fileName.includes('HK'),
  content.includes('grid grid-cols-2 md:grid-cols-4'),
  content.includes('bg-gray-50 border border-gray-200') && content.includes('Clear all'),
  content.includes('FileJson') && content.includes('FileSpreadsheet'),
  content.includes('max-h-96 overflow-y-auto'),
  (content.match(/filter/gi) || []).length >= 5
].filter(Boolean).length;

if (dataHubIndicators >= 2) {
  return 'DATA_HUB';
}
```

---

### Step 4: Default to Core Patterns

**Core** components follow the standard design system from AdvancedPlaygroundDemo.tsx.

**Detection Rules**:
- Does NOT match Reference, Offshore Hub, or Data Hub criteria
- All other components default to Core

**Pattern Set**: Apply **design-system.md** and **patterns.md**

**Example**:
```typescript
// If no other context matched
return 'CORE';
```

---

## Component Registry

### Reference Components (NEVER MODIFY)

| File | Context | Action |
|------|---------|--------|
| `AdvancedPlaygroundDemo.tsx` | REFERENCE | SKIP - Design golden standard |

---

### Offshore Hub Components

| File | Confidence | Key Indicators |
|------|-----------|----------------|
| `OffshoreDataHub.tsx` | 100% | Filename + page gradient + text gradient + rounded-2xl |
| `CIMAViewer.tsx` | 100% | Filename + CIMA-specific content |
| `BVIViewer.tsx` | 100% | Filename + BVI-specific content |
| `*Jurisdiction*.tsx` | 90% | Filename pattern |
| `*Cayman*.tsx` | 90% | Filename pattern |

**Pattern Characteristics**:
- ✅ Page background gradients (cyan/teal)
- ✅ Text gradient headings
- ✅ Gradient tab buttons
- ✅ Large rounded cards (rounded-2xl)
- ✅ Gradient stat cards
- ✅ Live status indicators
- ✅ Dual-color jurisdiction scheme

---

### Data Hub Components

| File | Confidence | Key Indicators |
|------|-----------|----------------|
| `HKScraperProduction.tsx` | 100% | Filename + 4-col stats + gray filters + export buttons |
| `HKSFCDataViewer.tsx` | 95% | Filename + data viewing patterns |
| `HKEXDataViewer.tsx` | 95% | Filename + data viewing patterns |
| `CCASSScraper.tsx` | 95% | Filename + scraping functionality |
| `WebbDataImporter.tsx` | 90% | Filename + import functionality |
| `NPMImporter.tsx` | 85% | Filename + import functionality |
| `*Scraper*.tsx` | 80% | Filename pattern |
| `*Import*.tsx` | 75% | Filename pattern |
| `*Export*.tsx` | 75% | Filename pattern |

**Pattern Characteristics**:
- ✅ 4-column stats dashboards (colored)
- ✅ Gray filter panels
- ✅ Enhanced data cards with tags/badges
- ✅ Export buttons (JSON/CSV)
- ✅ Highlighted filter sections (blue borders)
- ✅ Scrollable results containers
- ✅ Company/stock code badges

---

### Core Components

| File | Confidence | Patterns |
|------|-----------|----------|
| `App.tsx` | 100% | Main application shell |
| `AuthModal.tsx` | 100% | Authentication UI |
| `UserProfile.tsx` | 100% | User management |
| `LLMPlayground.tsx` | 100% | Standard feature page |
| `NPMMarketplace.tsx` | 100% | Standard feature page |
| `MultiModelChat.tsx` | 100% | Chat interface |
| `IntegratedPlaygroundHub.tsx` | 100% | Main dashboard |
| `EnhancedLLMMarket.tsx` | 100% | Standard market page |
| All UI components (`ui/*.tsx`) | 100% | Reusable components |

**Pattern Characteristics**:
- ✅ Solid color backgrounds (no gradients)
- ✅ Standard rounded corners (rounded-lg, rounded-md)
- ✅ Semantic colored cards (purple, blue, red, green, yellow, orange, teal)
- ✅ Standard button styles (btn-minimal, btn-primary, btn-secondary)
- ✅ Typography following design system
- ✅ Consistent spacing (Tailwind scale)

---

## Context Detection Implementation

### Quick Detection (Filename Only)

Use this for initial triage during batch processing:

```typescript
function detectContextQuick(fileName: string): ComponentContext {
  // 1. Check reference files
  if (fileName === 'AdvancedPlaygroundDemo.tsx') {
    return 'REFERENCE';
  }

  // 2. Check offshore hub by filename
  if (
    fileName.includes('Offshore') ||
    fileName.includes('CIMA') ||
    fileName.includes('BVI') ||
    fileName.includes('Cayman') ||
    fileName.includes('Jurisdiction')
  ) {
    return 'OFFSHORE_HUB';
  }

  // 3. Check data hub by filename
  if (
    fileName.includes('Scraper') ||
    fileName.includes('Import') ||
    fileName.includes('Export') ||
    fileName.includes('Data') ||
    /HK(SFC|EX|)/.test(fileName) ||
    fileName.includes('CCASS') ||
    fileName.includes('Webb')
  ) {
    return 'DATA_HUB';
  }

  // 4. Default to core
  return 'CORE';
}
```

### Deep Detection (Content Analysis)

Use this for accurate detection when harmonizing:

```typescript
function detectContextDeep(fileName: string, content: string): ComponentContext {
  // 1. Check reference files
  if (fileName === 'AdvancedPlaygroundDemo.tsx' || content.includes('DESIGN REFERENCE - DO NOT MODIFY')) {
    return 'REFERENCE';
  }

  // 2. Check offshore hub by content patterns
  const offshoreIndicators = [
    content.includes('bg-gradient-to-br from-gray-50 via-cyan-50 to-teal-50'),
    content.includes('bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent'),
    (content.match(/rounded-2xl/g) || []).length >= 3,
    content.includes("activeSource === 'cima'") || content.includes("activeSource === 'bvi'"),
    content.includes('from-cyan-50 to-cyan-100') && content.includes('from-teal-50 to-teal-100'),
    fileName.includes('Offshore') || fileName.includes('CIMA') || fileName.includes('BVI')
  ].filter(Boolean).length;

  if (offshoreIndicators >= 2) {
    return 'OFFSHORE_HUB';
  }

  // 3. Check data hub by content patterns
  const dataHubIndicators = [
    content.includes('grid grid-cols-2 md:grid-cols-4 gap-3'),
    content.includes('bg-gray-50 border border-gray-200') && content.includes('Clear all'),
    content.includes('FileJson') && content.includes('FileSpreadsheet'),
    content.includes('max-h-96 overflow-y-auto'),
    content.includes('bg-purple-100 text-purple-700') && content.includes('tag'),
    (content.match(/filter/gi) || []).length >= 5,
    fileName.includes('Scraper') || fileName.includes('Data') || fileName.includes('Import')
  ].filter(Boolean).length;

  if (dataHubIndicators >= 3) {
    return 'DATA_HUB';
  }

  // 4. Default to core
  return 'CORE';
}
```

---

## Harmonization Rules by Context

### REFERENCE Context

**Rules**:
- ❌ NEVER modify
- ❌ NEVER harmonize
- ❌ NEVER suggest changes
- ✅ Log and skip immediately

**Workflow Behavior**:
```
Detected REFERENCE context for AdvancedPlaygroundDemo.tsx
Action: SKIP (Design reference - never modify)
Reason: This file defines the design system standard
```

---

### OFFSHORE_HUB Context

**Rules**:
- ✅ Harmonize typography to design system
- ✅ Add missing dark mode variants
- ✅ Fix spacing to Tailwind scale
- ⚠️ PRESERVE page background gradients
- ⚠️ PRESERVE text gradient headings
- ⚠️ PRESERVE gradient tab buttons
- ⚠️ PRESERVE rounded-2xl (do NOT change to rounded-lg)
- ⚠️ PRESERVE gradient stat card backgrounds
- ⚠️ PRESERVE dual-color jurisdiction scheme
- ⚠️ PRESERVE live status pulse animations

**Pattern Reference**: `offshore-hub-patterns.md`

**Example Harmonization**:
```diff
// ✅ FIX: Typography
- <p className="text-base">Description</p>
+ <p className="text-lg">Description</p>

// ✅ ADD: Dark mode
- <div className="bg-white rounded-2xl shadow-xl p-8">
+ <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8">

// ⚠️ PRESERVE: Gradient and rounded-2xl
<div className="bg-white rounded-2xl shadow-xl p-8">
  <h1 className="bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
    {/* Do NOT change gradient or rounded-2xl */}
  </h1>
</div>
```

---

### DATA_HUB Context

**Rules**:
- ✅ Harmonize typography to design system
- ✅ Add missing dark mode variants
- ✅ Fix spacing to Tailwind scale
- ✅ Standardize button styles (use btn-minimal)
- ⚠️ PRESERVE 4-column stats grids (unique to data hubs)
- ⚠️ PRESERVE gray filter panel backgrounds (intentional, not a bug)
- ⚠️ PRESERVE highlighted blue filter sections
- ⚠️ PRESERVE compact padding (p-3 for stats cards)
- ⚠️ PRESERVE purple tag backgrounds
- ⚠️ PRESERVE export button placement

**Pattern Reference**: `data-hub-patterns.md`

**Example Harmonization**:
```diff
// ✅ ADD: Dark mode to stats dashboard
<div className="grid grid-cols-2 md:grid-cols-4 gap-3">
-  <div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
+  <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-md">
    <p className="text-xs text-blue-600 font-medium">Total Records</p>
-    <p className="text-2xl font-bold text-blue-900">{count}</p>
+    <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{count}</p>
  </div>
</div>

// ⚠️ PRESERVE: Gray filter panel (do NOT change to colored)
<div className="p-4 bg-gray-50 border border-gray-200 rounded-md">
  {/* Gray is intentional for data hub filters */}
</div>

// ⚠️ PRESERVE: Compact padding (do NOT change p-3 to p-4)
<div className="p-3 bg-blue-50 border border-blue-200 rounded-md">
  {/* p-3 is intentional for stats cards */}
</div>
```

---

### CORE Context

**Rules**:
- ✅ Harmonize ALL inconsistencies
- ✅ Apply design system strictly
- ✅ Add missing dark mode variants
- ✅ Fix spacing to Tailwind scale
- ✅ Standardize colors to semantic palette
- ✅ Align component patterns with AdvancedPlaygroundDemo.tsx
- ✅ Replace arbitrary values with design tokens

**Pattern Reference**: `design-system.md`, `patterns.md`

**Example Harmonization**:
```diff
// ✅ FIX: Wrong primary color
- <button className="bg-indigo-600 hover:bg-indigo-700">
+ <button className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700">

// ✅ FIX: Arbitrary spacing
- <div className="p-[13px] mb-[20px]">
+ <div className="p-3 mb-5">

// ✅ FIX: Typography
- <p className="text-[15px] font-[500]">
+ <p className="text-sm font-medium">
```

---

## Summary Decision Tree

```
┌─────────────────────────────────────┐
│ Component: {filename}               │
└─────────────────────────────────────┘
              │
              ▼
┌─────────────────────────────────────┐
│ Is AdvancedPlaygroundDemo.tsx?      │
│ OR has "DESIGN REFERENCE" comment?  │
└─────────────────────────────────────┘
       YES │         │ NO
           ▼         ▼
    ┌─────────┐   ┌─────────────────────────────────────┐
    │ SKIP    │   │ Has page gradient + text gradient   │
    │ (Ref)   │   │ + rounded-2xl (3+) + dual-color?    │
    └─────────┘   └─────────────────────────────────────┘
                       YES │         │ NO
                           ▼         ▼
                    ┌────────────┐ ┌─────────────────────────────────┐
                    │ OFFSHORE   │ │ Has 4-col stats + gray filters  │
                    │ HUB        │ │ + export buttons + tags (3+)?   │
                    └────────────┘ └─────────────────────────────────┘
                                       YES │         │ NO
                                           ▼         ▼
                                    ┌────────────┐ ┌──────┐
                                    │ DATA HUB   │ │ CORE │
                                    └────────────┘ └──────┘
```

---

## Context Application Examples

### Example 1: HKScraperProduction.tsx

**Detection**:
- Filename contains "Scraper" ✅
- Has 4-column stats grid ✅
- Has gray filter panel ✅
- Has export buttons (JSON, CSV) ✅
- Has purple tag badges ✅

**Result**: DATA_HUB context

**Applied Patterns**: data-hub-patterns.md

**Preserved Elements**:
- 4-column colored stats grid
- Gray filter panel backgrounds
- Compact padding (p-3)
- Purple tag badges
- Export button placement

---

### Example 2: OffshoreDataHub.tsx

**Detection**:
- Filename contains "Offshore" ✅
- Has page gradient (from-gray-50 via-cyan-50 to-teal-50) ✅
- Has text gradient (from-cyan-600 to-teal-600) ✅
- Uses rounded-2xl (4 occurrences) ✅
- Has dual-color scheme (cyan + teal) ✅

**Result**: OFFSHORE_HUB context

**Applied Patterns**: offshore-hub-patterns.md

**Preserved Elements**:
- Page background gradient
- Text gradient headings
- Gradient tab buttons
- Large rounded corners (rounded-2xl)
- Gradient stat cards
- Dual-color jurisdiction scheme

---

### Example 3: MultiModelChat.tsx

**Detection**:
- Filename does NOT contain special keywords
- No page gradients
- No 4-column stats grid
- No gray filter panels
- Uses standard patterns

**Result**: CORE context

**Applied Patterns**: design-system.md, patterns.md

**Harmonized Elements**:
- All color inconsistencies
- All typography issues
- All spacing violations
- All missing dark mode variants

---

## Workflow Integration

When Morgan's workflows execute:

1. **check-consistency**: Detects context and reports issues WITH context label
2. **harmonize-all**: Groups components by context, harmonizes in batches by context
3. **apply-to-page**: Detects context of target page, applies appropriate patterns
4. **analyze-reference**: Updates design-system.md (core patterns only)

**Batch Processing Strategy**:
```
Batch 1 (CORE - 20 components)
Batch 2 (DATA_HUB - 5 components)
Batch 3 (OFFSHORE_HUB - 2 components)
(REFERENCE - 1 component - SKIPPED)
```

This ensures context-appropriate harmonization across all components.
