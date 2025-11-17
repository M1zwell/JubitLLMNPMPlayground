# Offshore Financial Hub Design Patterns

**Context**: These patterns are specific to offshore financial regulatory data hubs (Cayman Islands CIMA, BVI FSC) and represent a premium, modern design variant with gradient accents and enhanced visual hierarchy.

**When to Use**: Components that display offshore jurisdiction data, multi-jurisdiction interfaces, financial regulatory information, or premium data platform experiences.

**Color Scheme**:
- **Cyan** (`cyan-500`, `cyan-600`): Cayman Islands (CIMA)
- **Teal** (`teal-500`, `teal-600`): British Virgin Islands (BVI FSC)
- **Purple**: Entity types and categories
- **Orange**: Activity and real-time status
- **Green**: Live status indicators

**Compatibility**: ⚠️ **Premium Variant** - Uses gradients and enhanced visual effects not present in core design system. Compatible with design tokens but represents a higher-tier visual treatment.

---

## Pattern Library

### 1. Background Page Gradient

**Purpose**: Create a premium, modern feel for offshore financial data platforms with a subtle cyan-teal gradient.

**Pattern Status**: ⚠️ **Domain-Specific Variant** - Not in core design system.

**Characteristics**:
- Multi-point gradient (from-via-to)
- Light tones that don't interfere with content
- Cyan and teal color stops
- Applied to full page wrapper (min-h-screen)

**Code Example**:
```tsx
<div className="min-h-screen bg-gradient-to-br from-gray-50 via-cyan-50 to-teal-50 p-6">
  <div className="max-w-7xl mx-auto space-y-6">
    {/* Page content */}
  </div>
</div>
```

**Dark Mode Variant**:
```tsx
<div className="min-h-screen bg-gradient-to-br from-gray-900 via-cyan-950 to-teal-950 dark:from-gray-900 dark:via-cyan-950/50 dark:to-teal-950/50 p-6">
  <div className="max-w-7xl mx-auto space-y-6">
    {/* Page content */}
  </div>
</div>
```

**When to Use**: Full-page offshore data hubs, premium dashboards, multi-jurisdiction platforms.

**When NOT to Use**: Simple data tables, utility pages, general components.

---

### 2. Text Gradient Headings

**Purpose**: Create eye-catching, premium headings with gradient text effects.

**Pattern Status**: ⚠️ **Domain-Specific Variant** - Gradient text not used in core design system.

**Characteristics**:
- Gradient applied to text only (bg-clip-text)
- Transparent text color (text-transparent)
- Cyan-to-teal color progression
- Large font sizes (text-4xl, text-3xl, text-2xl)

**Code Examples**:

**Main Heading**:
```tsx
<h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent flex items-center gap-3">
  <Shield className="text-cyan-500" size={40} />
  Offshore Financial Data Hub
</h1>
```

**Subheading**:
```tsx
<h2 className="text-2xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
  Regulatory Data Platform
</h2>
```

**Small Gradient Text**:
```tsx
<span className="text-lg font-semibold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
  Premium Feature
</span>
```

**Dark Mode Variant**:
```tsx
<h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-400 to-teal-400 dark:from-cyan-300 dark:to-teal-300 bg-clip-text text-transparent">
  Offshore Financial Data Hub
</h1>
```

**Important**: Icon next to gradient text should have solid color (`text-cyan-500`), not gradient.

---

### 3. Gradient Tab Buttons (Active State)

**Purpose**: Create premium, visually prominent active tab indicators with gradient backgrounds.

**Pattern Status**: ⚠️ **Domain-Specific Variant** - Gradient buttons not in core system (uses solid colors).

**Characteristics**:
- Gradient background on active state (bg-gradient-to-r)
- White text on active (text-white)
- Shadow and scale effects (shadow-lg scale-105)
- Gray background on inactive (bg-gray-100)
- Large rounded corners (rounded-xl)
- Different gradient per jurisdiction (cyan for CIMA, teal for BVI)

**Code Examples**:

**Jurisdiction Tabs (Large)**:
```tsx
{/* CIMA Tab - Cyan Gradient */}
<button
  onClick={() => setActiveSource('cima')}
  className={`flex-1 px-6 py-4 rounded-xl font-semibold text-lg transition-all ${
    activeSource === 'cima'
      ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 text-white shadow-lg scale-105'
      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
  }`}
>
  <div className="flex items-center justify-center gap-2">
    <Shield size={20} />
    <span>🇰🇾 CIMA</span>
  </div>
  <div className="text-xs mt-1 opacity-90">Cayman Islands</div>
</button>

{/* BVI Tab - Teal Gradient */}
<button
  onClick={() => setActiveSource('bvi')}
  className={`flex-1 px-6 py-4 rounded-xl font-semibold text-lg transition-all ${
    activeSource === 'bvi'
      ? 'bg-gradient-to-r from-teal-500 to-teal-600 text-white shadow-lg scale-105'
      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
  }`}
>
  <div className="flex items-center justify-center gap-2">
    <Shield size={20} />
    <span>🇻🇬 BVI FSC</span>
  </div>
  <div className="text-xs mt-1 opacity-90">British Virgin Islands</div>
</button>
```

**View Mode Tabs (Small)**:
```tsx
{/* Dynamic gradient based on active jurisdiction */}
<button
  onClick={() => setViewMode('view')}
  className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
    viewMode === 'view'
      ? activeSource === 'cima'
        ? 'bg-cyan-500 text-white shadow-md'
        : 'bg-teal-500 text-white shadow-md'
      : 'text-gray-600 hover:text-gray-900'
  }`}
>
  📊 View Data
</button>
```

**Dark Mode Variant**:
```tsx
<button
  className={`flex-1 px-6 py-4 rounded-xl font-semibold text-lg transition-all ${
    isActive
      ? 'bg-gradient-to-r from-cyan-500 to-cyan-600 dark:from-cyan-600 dark:to-cyan-700 text-white shadow-lg scale-105'
      : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
  }`}
>
  {/* Content */}
</button>
```

---

### 4. Large Rounded Cards (rounded-2xl)

**Purpose**: Create premium, soft-edged containers with enhanced visual presence.

**Pattern Status**: ⚠️ **Domain-Specific Variant** - Uses `rounded-2xl` (16px) instead of core system's `rounded-lg` (8px).

**Characteristics**:
- Extra-large border radius (rounded-2xl = 1rem / 16px)
- White background with shadow
- Border for definition
- Generous padding (p-8)

**Code Example**:
```tsx
<div className="bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
  <h2 className="text-2xl font-bold mb-4">Premium Card Content</h2>
  {/* Card content */}
</div>
```

**With Overflow Hidden** (for nested content):
```tsx
<div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
  {/* Content that extends to edges */}
</div>
```

**Dark Mode Variant**:
```tsx
<div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8 border border-gray-200 dark:border-gray-700">
  <h2 className="text-2xl font-bold dark:text-gray-100 mb-4">Premium Card Content</h2>
  {/* Card content */}
</div>
```

**When to Use**: Main content containers, header sections, feature showcases in premium interfaces.

**When NOT to Use**: List items, small components, utility cards (use standard `rounded-lg`).

---

### 5. Gradient Stat Cards

**Purpose**: Display statistics with subtle gradient backgrounds for visual hierarchy.

**Pattern Status**: ⚠️ **Domain-Specific Variant** - Gradient backgrounds not used in core stat cards.

**Characteristics**:
- Gradient background (bg-gradient-to-br)
- Color-coded per category (cyan, teal, purple, orange)
- Large value text (text-3xl font-bold)
- Icon in header
- Hover shadow effect (hover:shadow-xl)
- Extra-large rounded corners (rounded-xl)

**Code Example**:
```tsx
function StatCard({
  icon,
  title,
  value,
  subtitle,
  color
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
  subtitle: string;
  color: 'cyan' | 'teal' | 'purple' | 'orange';
}) {
  const colorClasses = {
    cyan: 'from-cyan-50 to-cyan-100 border-cyan-200',
    teal: 'from-teal-50 to-teal-100 border-teal-200',
    purple: 'from-purple-50 to-purple-100 border-purple-200',
    orange: 'from-orange-50 to-orange-100 border-orange-200'
  };

  return (
    <div
      className={`bg-gradient-to-br ${colorClasses[color]} border rounded-xl p-6 shadow-lg hover:shadow-xl transition-all`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="text-sm font-medium text-gray-600">{title}</div>
        {icon}
      </div>
      <div className="text-3xl font-bold text-gray-900 mb-1">{value}</div>
      <div className="text-xs text-gray-500">{subtitle}</div>
    </div>
  );
}

// Usage
<div className="grid grid-cols-1 md:grid-cols-4 gap-4">
  <StatCard
    icon={<Shield className="text-cyan-500" />}
    title="Jurisdictions"
    value="2"
    subtitle="Cayman & BVI"
    color="cyan"
  />
  <StatCard
    icon={<Database className="text-teal-500" />}
    title="Data Sources"
    value="2"
    subtitle="Active Regulators"
    color="teal"
  />
  <StatCard
    icon={<Building2 className="text-purple-500" />}
    title="Entity Types"
    value="15+"
    subtitle="Categories"
    color="purple"
  />
  <StatCard
    icon={<Activity className="text-orange-500" />}
    title="Last Update"
    value="Real-time"
    subtitle="Live Sync"
    color="orange"
  />
</div>
```

**Dark Mode Variant**:
```tsx
const colorClasses = {
  cyan: 'from-cyan-50 to-cyan-100 dark:from-cyan-900/20 dark:to-cyan-800/20 border-cyan-200 dark:border-cyan-800',
  teal: 'from-teal-50 to-teal-100 dark:from-teal-900/20 dark:to-teal-800/20 border-teal-200 dark:border-teal-800',
  purple: 'from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800',
  orange: 'from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800'
};

<div className="text-sm font-medium text-gray-600 dark:text-gray-400">{title}</div>
<div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-1">{value}</div>
<div className="text-xs text-gray-500 dark:text-gray-400">{subtitle}</div>
```

---

### 6. Live Status Indicator

**Purpose**: Show real-time data connectivity with animated pulse effect.

**Pattern Status**: ✅ **Compatible with Advanced** - Uses standard animation utilities.

**Characteristics**:
- Small circular indicator (w-3 h-3)
- Green color for live status (bg-green-500)
- Pulse animation (animate-pulse)
- Usually paired with "Live Data" or "Real-time" text
- Often in gradient container

**Code Examples**:

**In Gradient Container**:
```tsx
<div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-100 to-teal-100 rounded-lg">
  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
  <span className="text-sm font-medium text-gray-700">Live Data</span>
</div>
```

**Standalone**:
```tsx
<div className="flex items-center gap-2">
  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
  <span className="text-sm text-gray-600">Real-time Sync</span>
</div>
```

**Coming Soon Variant** (Cyan pulse):
```tsx
<div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-100 to-teal-100 rounded-lg">
  <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
  <span className="text-sm font-medium text-gray-700">Coming Soon</span>
</div>
```

**Dark Mode Variant**:
```tsx
<div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-cyan-100 to-teal-100 dark:from-cyan-900/30 dark:to-teal-900/30 rounded-lg">
  <div className="w-3 h-3 bg-green-500 dark:bg-green-400 rounded-full animate-pulse"></div>
  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Live Data</span>
</div>
```

---

### 7. Dual-Color Scheme (Jurisdiction-Based)

**Purpose**: Differentiate between multiple jurisdictions with consistent color coding.

**Pattern Status**: ⚠️ **Domain-Specific Variant** - Jurisdiction-specific color switching not in core system.

**Color Mapping**:
- **CIMA (Cayman Islands)**: Cyan (`cyan-500`, `cyan-600`)
- **BVI FSC (British Virgin Islands)**: Teal (`teal-500`, `teal-600`)

**Implementation Pattern**:
```tsx
const [activeSource, setActiveSource] = useState<'cima' | 'bvi'>('cima');

// Dynamic color selection
const accentColor = activeSource === 'cima' ? 'cyan' : 'teal';

// In className
className={`${
  activeSource === 'cima'
    ? 'bg-cyan-500 text-white'
    : 'bg-teal-500 text-white'
}`}

// Or with gradient
className={`${
  activeSource === 'cima'
    ? 'bg-gradient-to-r from-cyan-500 to-cyan-600'
    : 'bg-gradient-to-r from-teal-500 to-teal-600'
} text-white`}
```

**Full Example** (Dynamic View Tabs):
```tsx
{/* View mode tabs that change color based on jurisdiction */}
<div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
  <button
    onClick={() => setViewMode('view')}
    className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
      viewMode === 'view'
        ? activeSource === 'cima'
          ? 'bg-cyan-500 text-white shadow-md'
          : 'bg-teal-500 text-white shadow-md'
        : 'text-gray-600 hover:text-gray-900'
    }`}
  >
    📊 View Data
  </button>
  <button
    onClick={() => setViewMode('analyze')}
    className={`flex-1 px-4 py-2 rounded-md font-medium transition-all ${
      viewMode === 'analyze'
        ? activeSource === 'cima'
          ? 'bg-cyan-500 text-white shadow-md'
          : 'bg-teal-500 text-white shadow-md'
        : 'text-gray-600 hover:text-gray-900'
    }`}
  >
    📈 Analyze
  </button>
</div>
```

---

### 8. Coming Soon Placeholder

**Purpose**: Professional placeholder for features under development.

**Pattern Status**: ✅ **Compatible with Advanced** - Uses standard utilities with gradient accent.

**Characteristics**:
- Large emoji icon (text-6xl)
- Centered layout (text-center)
- Gradient status badge (cyan-to-teal)
- Pulse animation on status dot

**Code Example**:
```tsx
function ComingSoonPlaceholder({
  title,
  description,
  icon
}: {
  title: string;
  description: string;
  icon: string;
}) {
  return (
    <div className="text-center py-16">
      <div className="text-6xl mb-4">{icon}</div>
      <h3 className="text-2xl font-bold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-md mx-auto">{description}</p>
      <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-100 to-teal-100 rounded-lg">
        <div className="w-2 h-2 bg-cyan-500 rounded-full animate-pulse"></div>
        <span className="text-sm font-medium text-gray-700">Coming Soon</span>
      </div>
    </div>
  );
}

// Usage
<ComingSoonPlaceholder
  title="CIMA Analytics"
  description="Advanced analytics for Cayman Islands regulated entities"
  icon="📊"
/>
```

**Dark Mode Variant**:
```tsx
<div className="text-center py-16">
  <div className="text-6xl mb-4">{icon}</div>
  <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
  <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">{description}</p>
  <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-100 to-teal-100 dark:from-cyan-900/30 dark:to-teal-900/30 rounded-lg">
    <div className="w-2 h-2 bg-cyan-500 dark:bg-cyan-400 rounded-full animate-pulse"></div>
    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Coming Soon</span>
  </div>
</div>
```

---

## Design Principles for Offshore Hubs

1. **Premium Visual Treatment**: Use gradients sparingly to create a premium feel without overwhelming users.

2. **Jurisdiction Color Coding**: Maintain consistent color associations (cyan = CIMA, teal = BVI) throughout the interface.

3. **Large, Soft Shapes**: Use `rounded-2xl` for main containers to create a modern, approachable aesthetic.

4. **Gradient Text for Impact**: Apply text gradients only to main headings, not body text or labels.

5. **Live Status Visibility**: Always show connection status prominently with animated indicators.

6. **Unified Gradient Direction**: All gradients flow left-to-right (`from-cyan to-teal`) or bottom-right (`to-br`) for consistency.

7. **Shadow Hierarchy**: Use `shadow-lg` for main cards, `shadow-xl` for emphasis, `shadow-md` for interactive states.

---

## Gradient Color Combinations

### Background Gradients
```css
/* Page Background - Subtle */
bg-gradient-to-br from-gray-50 via-cyan-50 to-teal-50

/* Stat Card - Cyan */
bg-gradient-to-br from-cyan-50 to-cyan-100

/* Stat Card - Teal */
bg-gradient-to-br from-teal-50 to-teal-100

/* Stat Card - Purple */
bg-gradient-to-br from-purple-50 to-purple-100

/* Stat Card - Orange */
bg-gradient-to-br from-orange-50 to-orange-100
```

### Button/Tab Gradients
```css
/* CIMA Active Tab */
bg-gradient-to-r from-cyan-500 to-cyan-600

/* BVI Active Tab */
bg-gradient-to-r from-teal-500 to-teal-600
```

### Text Gradients
```css
/* Main Heading */
bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent
```

### Status Badge Gradients
```css
/* Live/Coming Soon Badge */
bg-gradient-to-r from-cyan-100 to-teal-100
```

---

## When to Harmonize vs. Preserve

**✅ Safe to Harmonize**:
- Typography sizes not matching design system
- Missing dark mode variants
- Inconsistent spacing values
- Icon sizes not following 16/20/24 pattern
- Missing hover/focus states

**⚠️ Preserve These Patterns**:
- Page background gradient (`from-gray-50 via-cyan-50 to-teal-50`)
- Text gradient headings (`bg-gradient-to-r from-cyan-600 to-teal-600`)
- Gradient tab buttons (active state)
- Large rounded corners (`rounded-2xl`)
- Gradient stat card backgrounds
- Dual-color jurisdiction scheme (cyan vs teal)
- Live status pulse animations

---

## Component Detection

**How to identify an offshore hub component**:
1. File name contains: "Offshore", "CIMA", "BVI", "Jurisdiction"
2. Has page background gradient with cyan/teal
3. Uses `rounded-2xl` for main containers
4. Has text gradient headings
5. Includes jurisdiction-based color switching
6. Shows live status indicators
7. Has dual-tab system (CIMA/BVI or similar)

**Examples**:
- ✅ OffshoreDataHub.tsx
- ✅ CIMAViewer.tsx
- ✅ BVIViewer.tsx
- ❌ HKScraperProduction.tsx (data hub, but not offshore - uses different patterns)
- ❌ AdvancedPlaygroundDemo.tsx (reference, not offshore hub)

---

## Migration from Core to Offshore Patterns

If converting a standard component to offshore hub style:

1. **Add page gradient**: Wrap in `bg-gradient-to-br from-gray-50 via-cyan-50 to-teal-50`
2. **Upgrade card borders**: Change `rounded-lg` → `rounded-2xl`
3. **Apply text gradient to h1**: Add `bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent`
4. **Add live indicator**: Include pulse animation status
5. **Use gradient stat cards**: Replace flat cards with gradient backgrounds
6. **Implement dual-color scheme**: Add jurisdiction-based color switching if applicable

**Before** (Standard):
```tsx
<div className="p-6">
  <div className="bg-white rounded-lg shadow p-8">
    <h1 className="text-4xl font-bold text-gray-900">Financial Data Hub</h1>
  </div>
</div>
```

**After** (Offshore):
```tsx
<div className="min-h-screen bg-gradient-to-br from-gray-50 via-cyan-50 to-teal-50 p-6">
  <div className="bg-white rounded-2xl shadow-xl p-8">
    <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-teal-600 bg-clip-text text-transparent">
      Offshore Financial Data Hub
    </h1>
  </div>
</div>
```
