# Morgan's Memory Bank

## User Preferences

**User Name**: BMad
**Communication Language**: English
**Project Type**: React + Vite web application (JubitLLMNPMPlayground)
**Design Reference**: AdvancedPlaygroundDemo.tsx

### User's Design Goals
- Maintain consistency across all pages and components
- Use Advanced page as the golden design standard
- Apply unified design system (tokens, colors, spacing)
- Ensure great UX for web app and browsing experience

## Session History

### Initial Agent Creation - 2025-11-12
- Created Design Guardian agent "Morgan"
- Established AdvancedPlaygroundDemo.tsx as reference source
- User wants: "analyze Advanced and apply to all pages and the whole web app"
- Agent type: Expert (standalone with sidecar resources)
- Communication style: Direct consultant with coding expertise

## Design System Evolution

### Current Design System (Extracted from Advanced)
Last analyzed: 2025-11-12

**Reference File**: `src/components/AdvancedPlaygroundDemo.tsx`

**Core Characteristics**:
- Modern, clean interface with light/dark mode support
- Tailwind CSS-based design tokens
- Semantic color system (purple, blue, red, green, orange, yellow, teal)
- Consistent component patterns (cards, badges, buttons, tabs)
- Professional enterprise-grade aesthetics

---

### Context-Aware Design System Architecture - 2025-11-17

**Major Update**: Evolved from single-context to multi-context design system.

**Rationale**: The user requested that HK Data Scraper and Offshore Data Hub pages be recognized as acceptable design variants, preserving their unique patterns while maintaining overall consistency.

**Implementation**:
- Created three design contexts: CORE, DATA_HUB, OFFSHORE_HUB
- Documented context-specific patterns in separate knowledge files
- Updated all workflows to detect and respect component context
- Added context detection rules to prevent over-harmonization

**New Knowledge Base Files Created**:
1. **data-hub-patterns.md** (~20 KB) - Financial data management interface patterns
   - 4-column stats dashboards (colored metrics)
   - Gray filter panels (functional, not decorative)
   - Enhanced data cards with tags/badges
   - Export buttons (JSON, CSV)
   - Highlighted filter sections

2. **offshore-hub-patterns.md** (~15 KB) - Premium offshore regulatory platform patterns
   - Page background gradients (cyan/teal)
   - Text gradient headings
   - Gradient tab buttons
   - Large rounded corners (rounded-2xl)
   - Gradient stat cards
   - Live status pulse indicators
   - Dual-color jurisdiction scheme

3. **component-context-map.md** (~15 KB) - Context detection rules and harmonization strategy
   - Automated context detection algorithm
   - Component registry by context
   - Preservation rules by context
   - Decision tree for context classification

**Design System Documents Updated**:
- **design-system.md**: Added context-aware architecture section
- **patterns.md**: Added context-specific pattern references

**Workflows Updated with Context Awareness**:
- **check-consistency**: Now audits components based on detected context
- **harmonize-all**: Batches components by context, applies context-specific rules
- **apply-to-page**: Detects component context before harmonization

**Key Principles Established**:
1. **Always Fix** (All Contexts):
   - Typography issues
   - Missing dark mode variants
   - Arbitrary spacing (except context-allowed values)
   - Icon sizes

2. **Context-Specific Preservation**:
   - DATA_HUB: Gray filters, 4-col stats, compact padding (p-3), purple tags
   - OFFSHORE_HUB: Gradients, rounded-2xl, dual-color scheme, live indicators

3. **Reference Protection**:
   - AdvancedPlaygroundDemo.tsx is NEVER modified (workflow cancels if selected)

**Impact**:
- Prevents "over-harmonization" that would destroy domain-specific visual identity
- Maintains consistency where it matters (typography, dark mode, spacing scale)
- Preserves functional color coding and premium visual treatments
- Enables context-aware quality auditing

**Example Components by Context**:
- **CORE**: App.tsx, AuthModal.tsx, LLMPlayground.tsx, MultiModelChat.tsx
- **DATA_HUB**: HKScraperProduction.tsx, WebbDataImporter.tsx
- **OFFSHORE_HUB**: OffshoreDataHub.tsx, CIMAViewer.tsx, BVIViewer.tsx
- **REFERENCE**: AdvancedPlaygroundDemo.tsx (never harmonize)

**Status**: Context-aware architecture fully implemented and ready for use.

## Personal Notes

### Observations
- The Advanced page demonstrates excellent design consistency
- Uses proper semantic HTML and accessibility patterns
- Component structure is well-organized and reusable
- Dark mode implementation is comprehensive

### Areas to Monitor
- Ensure all new pages follow the Advanced page patterns
- Watch for arbitrary Tailwind values (should use scale)
- Maintain dark mode consistency across all components
- Preserve accessibility standards during harmonization

## Pages Harmonized
<!-- Will be populated as harmonization work progresses -->

_Last updated: 2025-11-12_
