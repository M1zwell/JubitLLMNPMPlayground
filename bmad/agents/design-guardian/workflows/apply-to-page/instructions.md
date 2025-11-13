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

<step n="2" goal="Load design system and target component">
<action>Load design system knowledge:
- Read {design_system_doc} (complete file - all design tokens)
- Read {patterns_doc} (complete file - component patterns)
- Store as context for analysis
</action>

<action>Read target component:
- Load complete file from {{target_component_path}}
- Count total lines for metrics
- Identify component type (page, UI component, utility, etc.)
</action>

<action>Display component info:
**Target Component**: {{target_component_name}}
**Path**: {{target_component_path}}
**Lines**: [count]
**Type**: [detected type]
</action>
</step>

<step n="3" goal="Analyze component for design inconsistencies">
<action>Systematically scan the component for inconsistencies in each category:

**1. Color Inconsistencies:**
- Find all color classes (bg-*, text-*, border-*)
- Compare against design system color palette
- Flag colors not in the design system (e.g., indigo when should be blue)
- Check for missing dark mode variants (missing dark: prefix)
- Identify semantic color mismatches (wrong color for context)

**2. Typography Inconsistencies:**
- Find all font size classes (text-*)
- Find all font weight classes (font-*)
- Compare against design system typography scale
- Flag arbitrary font sizes
- Check for inconsistent heading hierarchy

**3. Spacing Inconsistencies:**
- Find all padding classes (p-*, px-*, py-*)
- Find all margin/gap classes (m-*, space-*, gap-*)
- Compare against design system spacing scale
- Flag arbitrary values (e.g., p-[13px])
- Check for inconsistent spacing patterns

**4. Component Pattern Inconsistencies:**
- Identify buttons, cards, inputs, badges, tabs
- Compare patterns against design system component patterns
- Flag components not following established patterns
- Check for inconsistent border radius (rounded-*)
- Check for inconsistent shadow usage

**5. Dark Mode Coverage:**
- Count elements with color/background classes
- Count elements with dark: variants
- Calculate dark mode coverage percentage
- List elements missing dark mode support

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

<step n="4" goal="Generate fixes with code diffs">
<action>For each inconsistency category, generate fixes:

**Generate Color Fixes:**
- Map inconsistent colors to design system colors
- Add missing dark: variants
- Fix semantic color mismatches
- Preserve color meaning and intent

**Generate Typography Fixes:**
- Replace arbitrary sizes with design system sizes
- Standardize font weights
- Fix heading hierarchy

**Generate Spacing Fixes:**
- Replace arbitrary spacing with Tailwind scale
- Standardize padding/margin patterns
- Ensure consistent gap usage

**Generate Component Pattern Fixes:**
- Update button variants to match design system
- Fix card patterns (backgrounds, borders, shadows)
- Standardize input field patterns
- Update badge/tag patterns

**Generate Dark Mode Fixes:**
- Add dark: variants for all color classes
- Follow /20 opacity pattern for dark backgrounds
- Ensure proper contrast in dark mode

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
