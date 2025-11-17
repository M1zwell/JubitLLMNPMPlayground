# JubitLLMNPMPlayground Design System

**Reference Source**: `src/components/AdvancedPlaygroundDemo.tsx`
**Last Extracted**: 2025-11-12
**Status**: Active Golden Standard

---

## Context-Aware Design System Architecture

**IMPORTANT**: This design system now supports **context-specific pattern variants** to accommodate different interface types while maintaining overall consistency.

### Design Contexts

The application uses **three design contexts**, each with appropriate pattern sets:

#### 1. **Core Context** (Default)
- **Applies to**: Most application components (authentication, navigation, features, utilities)
- **Pattern Source**: This document (design-system.md) + patterns.md
- **Characteristics**: Standard design system from AdvancedPlaygroundDemo.tsx
- **Examples**: App.tsx, AuthModal.tsx, LLMPlayground.tsx, MultiModelChat.tsx

#### 2. **Data Hub Context**
- **Applies to**: Financial data management interfaces (scrapers, importers, data viewers)
- **Pattern Source**: data-hub-patterns.md
- **Characteristics**:
  - 4-column colored stats dashboards
  - Gray filter panels (functional, not decorative)
  - Enhanced data cards with tags/badges/metadata
  - Export functionality (JSON, CSV)
  - Compact spacing for information density
- **Examples**: HKScraperProduction.tsx, WebbDataImporter.tsx
- **Why Different**: Data-intensive interfaces require higher information density and functional color coding

#### 3. **Offshore Hub Context**
- **Applies to**: Premium offshore financial regulatory platforms
- **Pattern Source**: offshore-hub-patterns.md
- **Characteristics**:
  - Page background gradients (cyan/teal)
  - Text gradient headings
  - Gradient tab buttons
  - Large rounded corners (rounded-2xl)
  - Gradient stat cards
  - Dual-color jurisdiction scheme
- **Examples**: OffshoreDataHub.tsx, CIMAViewer.tsx, BVIViewer.tsx
- **Why Different**: Premium interfaces require enhanced visual treatment to convey quality and brand differentiation

#### 4. **Reference Context** (Read-Only)
- **Applies to**: Design reference files
- **Pattern Source**: AdvancedPlaygroundDemo.tsx (NEVER MODIFIED)
- **Examples**: AdvancedPlaygroundDemo.tsx
- **Why Special**: This is the golden standard that defines the core design system

### Context Detection

Morgan uses **component-context-map.md** to automatically detect which context a component belongs to based on:
- Filename patterns (e.g., "Scraper", "Offshore", "CIMA")
- Content patterns (e.g., page gradients, 4-column stats grids)
- Feature indicators (e.g., export buttons, filter panels)

See **component-context-map.md** for full detection rules and decision tree.

### Harmonization Strategy

When harmonizing components, Morgan:
1. **Detects context** using component-context-map.md
2. **Applies appropriate patterns**:
   - Core → design-system.md + patterns.md
   - Data Hub → data-hub-patterns.md
   - Offshore Hub → offshore-hub-patterns.md
   - Reference → SKIP (never modify)
3. **Preserves context-specific patterns** while fixing genuine inconsistencies
4. **Always adds dark mode** variants regardless of context
5. **Always fixes spacing** to Tailwind scale regardless of context
6. **Always fixes typography** to design system regardless of context

### What This Means

✅ **Safe to Harmonize Everywhere**:
- Typography sizes (text-xs/sm/base/lg/xl/2xl)
- Font weights (font-normal/medium/semibold/bold)
- Missing dark mode variants
- Arbitrary spacing values → Tailwind scale
- Icon sizes

⚠️ **Context-Specific (Preserve in Data Hub)**:
- 4-column stats dashboards
- Gray filter panel backgrounds
- Compact padding (p-3 instead of p-4)
- Purple tag badges
- Highlighted filter sections

⚠️ **Context-Specific (Preserve in Offshore Hub)**:
- Page background gradients
- Text gradient headings
- Gradient tab buttons
- Large rounded corners (rounded-2xl)
- Gradient stat cards
- Dual-color jurisdiction schemes

### Pattern Document Index

| Document | Context | Purpose |
|----------|---------|---------|
| **design-system.md** | Core | This document - design tokens for standard components |
| **patterns.md** | Core | Reusable component patterns from AdvancedPlaygroundDemo.tsx |
| **data-hub-patterns.md** | Data Hub | Financial data interface patterns (stats, filters, exports) |
| **offshore-hub-patterns.md** | Offshore Hub | Premium offshore regulatory platform patterns (gradients) |
| **component-context-map.md** | All | Context detection rules and harmonization strategy |

---

## Core Design System

The following sections define the **Core** design system extracted from AdvancedPlaygroundDemo.tsx. These tokens apply to all contexts unless specifically overridden in context-specific pattern documents.

---

## Color Palette

### Base Colors (Light/Dark Mode)

**Backgrounds**:
- Light: `bg-white`, `bg-gray-50`, `bg-gray-100`
- Dark: `dark:bg-gray-900`, `dark:bg-gray-800`, `dark:bg-gray-700`

**Text Colors**:
- Primary Light: `text-gray-800`, `text-gray-700`, `text-gray-600`
- Primary Dark: `dark:text-gray-200`, `dark:text-gray-300`, `dark:text-gray-400`
- Muted: `text-gray-500`, `dark:text-gray-400`, `dark:text-gray-500`

**Borders**:
- Light: `border-gray-200`, `border-gray-100`
- Dark: `dark:border-gray-700`, `dark:border-gray-600`

### Semantic Color System

**Purple (AI/Intelligence)**:
- Background: `bg-purple-50 dark:bg-purple-900/20`
- Border: `border-purple-100 dark:border-purple-800`
- Text: `text-purple-600`, `text-purple-700 dark:text-purple-300`
- Button: `bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300`
- Accent: `text-purple-600 hover:text-purple-700 dark:hover:text-purple-400`

**Indigo (Secondary)**:
- Background: `bg-indigo-50 dark:bg-indigo-900/20`
- Border: `border-indigo-100 dark:border-indigo-800`
- Text: `text-indigo-600`, `text-indigo-800 dark:text-indigo-300`

**Blue (Primary/Info)**:
- Background: `bg-blue-50 dark:bg-blue-900/20`
- Border: `border-blue-100 dark:border-blue-800`
- Text: `text-blue-600`, `text-blue-700 dark:text-blue-300`, `text-blue-800 dark:text-blue-300`
- Tab Active: `border-blue-600 text-blue-600 dark:text-blue-400`
- Button: `bg-blue-600 hover:bg-blue-700`

**Red (Error/Security)**:
- Background: `bg-red-50 dark:bg-red-900/20`
- Border: `border-red-100 dark:border-red-800`, `border-l-red-400`
- Text: `text-red-600`, `text-red-700 dark:text-red-300`, `text-red-800 dark:text-red-300`
- Button: `bg-red-600 hover:bg-red-700`
- Badge: `bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300`

**Green (Success/Performance)**:
- Background: `bg-green-50 dark:bg-green-900/20`
- Border: `border-green-100 dark:border-green-800`
- Text: `text-green-600`, `text-green-500`, `text-green-600 dark:text-green-400`
- Progress: `bg-green-500`
- Badge: `bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300`

**Yellow (Warning)**:
- Background: `bg-yellow-50 dark:bg-yellow-900/20`
- Border: `border-yellow-100 dark:border-yellow-800`, `border-l-yellow-400`
- Text: `text-yellow-600`, `text-yellow-700 dark:text-yellow-300`, `text-yellow-800 dark:text-yellow-300`
- Badge: `bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-300`

**Orange (Optimization)**:
- Background: `bg-orange-50 dark:bg-orange-900/20`
- Border: `border-orange-100 dark:border-orange-800`
- Text: `text-orange-600`, `text-orange-800 dark:text-orange-300`
- Button: `bg-orange-600 hover:bg-orange-700`

**Teal (Workflow)**:
- Background: `bg-teal-50 dark:bg-teal-900/20`
- Border: `border-teal-100 dark:border-teal-800`
- Text: `text-teal-600`

---

## Typography

### Font Families
- **Default**: System font stack (Tailwind default)
- **Code**: `font-mono` for code snippets

### Font Sizes
- **2xl**: `text-2xl` (Headers, major titles)
- **lg**: `text-lg` (Section headings)
- **base**: `text-base` / default (Body text)
- **sm**: `text-sm` (Supporting text, descriptions)
- **xs**: `text-xs` (Metadata, labels, captions)

### Font Weights
- **bold**: `font-bold` (Headings, emphasis)
- **semibold**: `font-semibold` (Sub-headings, labels)
- **medium**: `font-medium` (Slightly emphasized text)
- **normal**: Default (Body text)

### Line Heights
- Heading: Leading is tighter (implicit)
- Body: Default Tailwind leading

---

## Spacing Scale

**Padding**:
- Small: `p-2`, `p-3`
- Medium: `p-4`
- Large: `p-6`
- Responsive: `px-3 py-2`, `px-4 py-3`

**Margins/Gaps**:
- Vertical: `space-y-1`, `space-y-2`, `space-y-3`, `space-y-4`
- Horizontal: `space-x-1`, `space-x-2`, `space-x-3`, `space-x-4`
- Gap: `gap-2`, `gap-3`, `gap-6`

**Height/Width**:
- Icons Small: `w-4 h-4`
- Icons Medium: `w-5 h-5`
- Icons Large: `w-8 h-8`
- Avatar: `w-10 h-10`
- Progress bars: `h-2`, `h-20`

---

## Component Patterns

### Cards / Containers

**Standard Card**:
```tsx
className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700"
```

**Colored Info Card** (semantic):
```tsx
// Purple (AI)
className="bg-purple-50 dark:bg-purple-900/20 p-4 rounded-lg border border-purple-100 dark:border-purple-800"

// Blue (Info)
className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-100 dark:border-blue-800"

// Red (Error/Alert)
className="bg-red-50 dark:bg-red-900/20 p-4 rounded-lg border border-red-100 dark:border-red-800"

// Green (Success)
className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg border border-green-100 dark:border-green-800"
```

**Card with Left Border Accent**:
```tsx
className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700 border-l-4 border-l-red-400"
```

### Buttons

**Primary Button**:
```tsx
className="btn-minimal btn-primary"
// With custom color:
className="btn-minimal btn-primary bg-blue-600 hover:bg-blue-700"
```

**Secondary/Ghost Button**:
```tsx
className="btn-minimal btn-ghost text-xs bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300"
```

**Gradient Button**:
```tsx
className="btn-minimal btn-primary bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
```

**Disabled State**:
```tsx
disabled={isLoading}
className="... disabled:opacity-50"
```

### Inputs

**Text Input**:
```tsx
className="flex-1 px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
```

**Select/Dropdown**:
```tsx
className="px-2 py-1 text-xs border border-gray-300 rounded"
```

### Badges / Tags

**Status Badge**:
```tsx
// Success
className="bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 px-2 py-1 rounded text-xs"

// Warning
className="bg-yellow-100 dark:bg-yellow-800 text-yellow-700 dark:text-yellow-300 px-2 py-1 rounded text-xs"

// Error
className="bg-red-100 dark:bg-red-800 text-red-700 dark:text-red-300 px-2 py-1 rounded text-xs"
```

**Inline Code Badge**:
```tsx
className="bg-gray-200 dark:bg-gray-700 px-1 rounded"
```

### Tabs

**Tab Container**:
```tsx
className="flex space-x-1 overflow-x-auto"
```

**Tab Button**:
```tsx
// Active
className="flex items-center px-4 py-3 border-b-2 border-blue-600 text-blue-600 dark:text-blue-400 transition-colors whitespace-nowrap"

// Inactive
className="flex items-center px-4 py-3 border-b-2 border-transparent text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-300 transition-colors whitespace-nowrap"
```

### Icons

**Icon with Text**:
```tsx
<Icon className="w-5 h-5 mr-2 text-blue-600" />
// Sizes: w-4 h-4 (small), w-5 h-5 (medium), w-8 h-8 (large)
```

### Grid Layouts

**3-Column Grid**:
```tsx
className="grid grid-cols-3 gap-3"
```

**Responsive Grid**:
```tsx
className="grid grid-cols-1 lg:grid-cols-3 gap-6"
```

### Lists

**Vertical List with Spacing**:
```tsx
className="space-y-2"  // or space-y-3, space-y-4
```

**Bullet Points**:
```tsx
<li className="flex items-start">
  <CheckCircle2 className="w-4 h-4 text-green-600 mr-2 mt-0.5" />
  <span>Text content</span>
</li>
```

---

## Effects & Interactions

### Shadows
- Card: Default `shadow-sm` on some containers
- Hover: `hover:shadow-md` for interactive cards

### Transitions
- Standard: `transition-colors`
- Hover states on buttons and tabs

### Rounded Corners
- Standard: `rounded-md`, `rounded-lg`
- Pills/Badges: `rounded`, `rounded-full`

### Hover States
- Text links: `hover:underline`, `hover:text-purple-700 dark:hover:text-purple-400`
- Buttons: `hover:bg-blue-700`
- Cards: `hover:bg-gray-50`, `hover:shadow-md`

---

## Dark Mode Strategy

**Pattern**: All components must support dark mode using Tailwind's `dark:` prefix

**Key Rules**:
1. Backgrounds: Light uses white/gray-50/100, Dark uses gray-900/800/700
2. Text: Light uses gray-800/700/600, Dark uses gray-200/300/400
3. Borders: Light uses gray-200/100, Dark uses gray-700/600
4. Semantic colors: Use `/20` opacity for dark mode backgrounds (e.g., `dark:bg-purple-900/20`)
5. Colored text: Lighter shades for dark mode (e.g., `text-purple-700 dark:text-purple-300`)

---

## Accessibility Patterns

1. **Icons with Text**: Always pair icons with descriptive text
2. **Semantic HTML**: Use proper heading hierarchy (h1, h2, h3, h4)
3. **Interactive Elements**: Buttons use `<button>`, links use `<a>`
4. **Focus States**: Implicit via Tailwind defaults
5. **Color Contrast**: Semantic colors maintain WCAG AA contrast ratios

---

## Code Block Patterns

**Syntax Highlighted Code**:
```tsx
<div className="bg-gray-900 text-gray-100 p-4 rounded-md overflow-x-auto">
  <pre className="text-sm">
    <code>{generatedCode}</code>
  </pre>
</div>
```

---

## Common Anti-Patterns to Avoid

❌ **Arbitrary values**: `p-[13px]` - Use Tailwind scale instead
❌ **Inconsistent colors**: Using `bg-purple-200` when `bg-purple-50` is standard
❌ **Missing dark mode**: Not including `dark:` variants
❌ **Hard-coded colors**: `#FF6B6B` - Use Tailwind color palette
❌ **Non-semantic class names**: Generic `container` without context

---

## Notes

- This design system emphasizes **consistency over customization**
- When in doubt, reference AdvancedPlaygroundDemo.tsx patterns
- All new components should follow these exact token values
- Updates to this file should only occur when AdvancedPlaygroundDemo.tsx changes

_Maintained by Morgan, Design System Guardian_
