# Apply to Page - Targeted Design Harmonization

<critical>The workflow execution engine is governed by: {project-root}/bmad/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {agent_folder}/workflows/apply-to-page/workflow.yaml</critical>
<critical>Communicate in {communication_language} throughout the workflow process</critical>

<workflow>

<step n="1" goal="Identify target component">
<ask>Which component would you like to harmonize?

You can provide:
1. Exact file path (e.g., "src/components/EnhancedLLMMarket.tsx")
2. Component name (e.g., "EnhancedLLMMarket" or "LLM Market")
3. Partial name for fuzzy matching (e.g., "llm market")

Enter component identifier:</ask>

<action>Search for matching component files in {components_path}:
- If exact path provided, use it directly
- If component name provided, find matching .tsx file
- If partial name, perform fuzzy search and show matches
</action>

<action if="multiple matches found">
Display list of matches and ask user to select:
1. [ComponentA.tsx] - Main page component
2. [ComponentB.tsx] - UI component
etc.
</action>

<action>Store selected component path as {{target_component_path}}</action>
<action>Store component name as {{target_component_name}}</action>
</step>

<step n="2" goal="Load design system and detect component context">
<action>Load ALL design system knowledge (context-aware):
- Read {design_system_doc} (complete file - includes context-aware architecture)
- Read {patterns_doc} (complete file - core component patterns)
- Read {knowledge_folder}/data-hub-patterns.md (complete file - data hub patterns)
- Read {knowledge_folder}/offshore-hub-patterns.md (complete file - offshore hub patterns)
- Read {knowledge_folder}/component-context-map.md (complete file - context detection rules)
- Store as context for analysis
</action>

<action>Read target component:
- Load complete file from {{target_component_path}}
- Count total lines for metrics
</action>

<action>Detect component context using component-context-map.md rules:

**Context Detection**:
1. Check if filename is "AdvancedPlaygroundDemo.tsx" → REFERENCE (CANCEL workflow - never modify)
2. Check offshore hub indicators:
   - Filename contains: Offshore, CIMA, BVI, Cayman, Jurisdiction
   - Content has page gradients or text gradients
   - If match → OFFSHORE_HUB
3. Check data hub indicators:
   - Filename contains: Scraper, Data, Import, Export, Hub, HK, HKSFC, HKEX, CCASS, Webb
   - Content has 4-column stats grids or gray filter panels
   - If match → DATA_HUB
4. Otherwise → CORE

Store detected context: {{component_context}}
</action>

<action if="context = REFERENCE">
<critical>CANNOT harmonize {{target_component_name}} - it's the design reference file!</critical>
Display error: "AdvancedPlaygroundDemo.tsx is the golden design standard and must never be modified. Please select a different component."
<goto step="1">Return to component selection</goto>
</action>

<action>Display component info with context:
**Target Component**: {{target_component_name}}
**Path**: {{target_component_path}}
**Lines**: [count]
**Context**: {{component_context}}
**Pattern Source**:
- CORE → design-system.md + patterns.md
- DATA_HUB → data-hub-patterns.md
- OFFSHORE_HUB → offshore-hub-patterns.md

**Context-Specific Rules**:
- [Display relevant preservation rules for detected context]
</action>
</step>

<step n="3" goal="Analyze component for design inconsistencies (context-aware)">
<action>Systematically scan the component for GENUINE inconsistencies based on {{component_context}}:

**1. Color Inconsistencies** (context-aware):
- Find all color classes (bg-*, text-*, border-*)
- Compare against CONTEXT-SPECIFIC standards:
  - **CORE**: Flag indigo (should be blue), check semantic colors
  - **DATA_HUB**: ALLOW gray filters, ALLOW 4-col stats colors, ALLOW purple tags
  - **OFFSHORE_HUB**: ALLOW page gradients, ALLOW text gradients, ALLOW gradient tabs, ALLOW dual-color scheme
- Check for missing dark mode variants (ALL CONTEXTS)
- Identify semantic color mismatches (only genuine issues)

**2. Typography Inconsistencies** (SAME FOR ALL CONTEXTS):
- Find all font size classes (text-*)
- Find all font weight classes (font-*)
- Compare against design system typography scale
- Flag arbitrary font sizes
- Check for inconsistent heading hierarchy

**3. Spacing Inconsistencies** (context-aware):
- Find all padding classes (p-*, px-*, py-*)
- Find all margin/gap classes (m-*, space-*, gap-*)
- Compare against Tailwind spacing scale
- **DATA_HUB**: ALLOW p-3 for stats cards
- **CORE/OFFSHORE**: Flag arbitrary values (e.g., p-[13px])
- Check for inconsistent spacing patterns (excluding allowed context-specific values)

**4. Component Pattern Inconsistencies** (context-aware):
- Identify buttons, cards, inputs, badges, tabs
- Compare against CONTEXT-SPECIFIC patterns:
  - **CORE**: design-system.md + patterns.md
  - **DATA_HUB**: data-hub-patterns.md (allow gray filters, export buttons)
  - **OFFSHORE_HUB**: offshore-hub-patterns.md (allow gradient tabs, live indicators)
- Check border radius:
  - **CORE/DATA_HUB**: Flag if not rounded-lg or rounded-md
  - **OFFSHORE_HUB**: ALLOW rounded-2xl (intentional)
- Check for inconsistent shadow usage

**5. Dark Mode Coverage** (SAME FOR ALL CONTEXTS):
- Count elements with color/background classes
- Count elements with dark: variants
- Calculate dark mode coverage percentage
- List elements missing dark mode support

**6. Context-Specific Pattern Validation** (NEW):
- **DATA_HUB**: Verify proper export button placement, filter panel structure
- **OFFSHORE_HUB**: Check gradient consistency, live status indicators
- **CORE**: Check alignment with AdvancedPlaygroundDemo.tsx patterns

</action>

<action>Categorize findings by severity:
- **Critical**: Primary color mismatches, missing dark mode on visible elements
- **High**: Wrong semantic colors, spacing outside scale
- **Medium**: Minor typography issues, border inconsistencies
- **Low**: Optimization opportunities, minor improvements
</action>

<action>Count total issues found:
- Colors: [count]
- Typography: [count]
- Spacing: [count]
- Components: [count]
- Dark Mode: [count missing variants]
</action>
</step>

<step n="4" goal="Generate fixes with code diffs (context-aware)">
<action>For each inconsistency category, generate CONTEXT-AWARE fixes:

**Generate Color Fixes** (context-aware):
- **CORE**: Map incorrect colors to semantic palette, fix indigo to blue
- **DATA_HUB**: PRESERVE gray filters, PRESERVE 4-col stats, PRESERVE purple tags
- **OFFSHORE_HUB**: PRESERVE page gradients, PRESERVE text gradients, PRESERVE gradient tabs
- **ALL CONTEXTS**: Add missing dark: variants
- Preserve color meaning and intent

**Generate Typography Fixes** (SAME FOR ALL CONTEXTS):
- Replace arbitrary sizes with design system sizes
- Standardize font weights
- Fix heading hierarchy

**Generate Spacing Fixes** (context-aware):
- **CORE/OFFSHORE**: Replace arbitrary spacing with Tailwind scale
- **DATA_HUB**: PRESERVE p-3 for stats cards, replace other arbitrary values
- Standardize padding/margin patterns (excluding preserved values)
- Ensure consistent gap usage

**Generate Component Pattern Fixes** (context-aware):
- **CORE**:
  - Update button variants to match AdvancedPlaygroundDemo.tsx
  - Fix card patterns to rounded-lg
  - Standardize input field patterns
- **DATA_HUB**:
  - PRESERVE gray filter panels
  - PRESERVE export button placement (check style only)
  - PRESERVE 4-column stats grids
- **OFFSHORE_HUB**:
  - PRESERVE gradient tab buttons
  - PRESERVE rounded-2xl (do NOT change to rounded-lg)
  - PRESERVE live status indicators
  - PRESERVE gradient stat cards

**Generate Dark Mode Fixes** (SAME FOR ALL CONTEXTS):
- Add dark: variants for all color classes
- Follow /20 opacity pattern for dark backgrounds
- Ensure proper contrast in dark mode
- Apply to gradients (offshore hub) and solid colors (all contexts)

**Mark Preserved Patterns**:
- Label fixes that preserve context-specific patterns
- Example: "✅ PRESERVED: Gray filter panel (data hub pattern)"
- Example: "✅ PRESERVED + ADDED DARK MODE: Gradient heading (offshore hub)"

</action>

<action>For each fix, prepare before/after code snippets:
- Show original code (with line numbers)
- Show proposed fix
- Explain WHY the change improves consistency
- Estimate visual impact (minor/moderate/major)
</action>
</step>

<step n="5" goal="Get user approval by category">
<action>Display comprehensive analysis summary:

**Design Harmonization Analysis**
**Component**: {{target_component_name}}
**Total Issues Found**: [count]

**Breakdown**:
- 🎨 Colors: [count] issues ([critical], [high], [medium], [low])
- 📝 Typography: [count] issues
- 📏 Spacing: [count] issues
- 🧩 Components: [count] issues
- 🌓 Dark Mode: [count] missing variants

**Estimated Changes**: [total lines to modify]

</action>

<ask>Review category by category:

**1. Color Fixes** ([count] changes)
[Show top 3-5 most impactful color changes with before/after]

Apply all color fixes? (yes/no/show all)</ask>

<action if="user says show all">Display all color fixes with line numbers and diffs</action>
<action>Store user decision as {{apply_colors}}</action>

<ask>**2. Typography Fixes** ([count] changes)
[Show sample typography changes]

Apply all typography fixes? (yes/no/show all)</ask>

<action>Store user decision as {{apply_typography}}</action>

<ask>**3. Spacing Fixes** ([count] changes)
[Show sample spacing changes]

Apply all spacing fixes? (yes/no/show all)</ask>

<action>Store user decision as {{apply_spacing}}</action>

<ask>**4. Component Pattern Fixes** ([count] changes)
[Show sample component pattern changes]

Apply all component pattern fixes? (yes/no/show all)</ask>

<action>Store user decision as {{apply_components}}</action>

<ask>**5. Dark Mode Additions** ([count] missing variants)
[Show elements that will get dark mode support]

Add all dark mode variants? (yes/no/show all)</ask>

<action>Store user decision as {{apply_dark_mode}}</action>
</step>

<step n="6" goal="Apply approved changes">
<action>Apply changes based on user approvals:

**Processing Order** (important for clean diffs):
1. Color fixes (if {{apply_colors}} == yes)
2. Typography fixes (if {{apply_typography}} == yes)
3. Spacing fixes (if {{apply_spacing}} == yes)
4. Component pattern fixes (if {{apply_components}} == yes)
5. Dark mode additions (if {{apply_dark_mode}} == yes)

For each category:
- Apply all fixes in that category
- Use Edit tool to make precise replacements
- Preserve all functionality (only modify styling classes)
- Maintain proper indentation and formatting

</action>

<action>After all edits complete, read the modified file to verify changes</action>

<critical>NEVER remove functionality, ALWAYS preserve component logic</critical>
<critical>ONLY modify Tailwind CSS classes, NOT JavaScript/TypeScript code</critical>
</step>

<step n="7" goal="Display harmonization summary">
<action>Generate completion summary:

**✅ Design Harmonization Complete**

**Component**: {{target_component_name}}
**Path**: {{target_component_path}}
**Date**: {date}
**Harmonized By**: {user_name}

**Changes Applied**:
- 🎨 Colors: [count] fixes applied
  - Primary colors unified: [count]
  - Semantic colors corrected: [count]
  - Dark mode variants added: [count]

- 📝 Typography: [count] fixes applied
  - Font sizes standardized: [count]
  - Font weights updated: [count]

- 📏 Spacing: [count] fixes applied
  - Padding standardized: [count]
  - Margins/gaps standardized: [count]

- 🧩 Component Patterns: [count] fixes applied
  - Buttons updated: [count]
  - Cards harmonized: [count]
  - Other components: [count]

- 🌓 Dark Mode: [count] variants added
  - Coverage before: [percentage]%
  - Coverage after: [new percentage]%

**Total Lines Modified**: [count]
**Design Consistency Score**: [before]% → [after]%

**Before/After Metrics**:
- Colors aligned with design system: [before]% → [after]%
- Dark mode coverage: [before]% → [after]%
- Spacing following Tailwind scale: [before]% → [after]%
- Component patterns matching reference: [before]% → [after]%

**Next Steps**:
- ✅ Component is now harmonized with design system
- Test component functionality to ensure no regressions
- Consider running *check-consistency to verify improvements
- Ready to commit changes with descriptive message

</action>

<ask>Would you like to see a detailed diff of all changes made? (y/n)</ask>

<action if="user says yes">Display comprehensive before/after comparison organized by category</action>

<ask>Would you like to harmonize another component? (y/n)</ask>

<action if="user says yes">
<goto step="1">Restart workflow for another component</goto>
</action>
</step>

</workflow>
