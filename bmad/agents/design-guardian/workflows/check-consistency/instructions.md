# Check Consistency - Design System Audit

<critical>The workflow execution engine is governed by: {project-root}/bmad/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {agent_folder}/workflows/check-consistency/workflow.yaml</critical>
<critical>Communicate in {communication_language} throughout the workflow process</critical>
<critical>This is a READ-ONLY audit workflow - NO files will be modified</critical>

<workflow>

<step n="1" goal="Load design system standards">
<action>Load ALL design system documentation:
- Read {design_system_doc} (complete file - includes context-aware architecture)
- Read {patterns_doc} (complete file)
- Read {knowledge_folder}/data-hub-patterns.md (complete file)
- Read {knowledge_folder}/offshore-hub-patterns.md (complete file)
- Read {knowledge_folder}/component-context-map.md (complete file - context detection rules)
- Extract all design standards for comparison
</action>

<action>Create design system checklists BY CONTEXT:

**Core Context Standards** (design-system.md):
- Color Standards: Semantic colors (purple, blue, red, green, yellow, orange, teal)
- Typography Standards: text-xs/sm/base/lg/xl/2xl
- Spacing Standards: Tailwind scale (no arbitrary values)
- Component Patterns: Standard buttons, cards, inputs from AdvancedPlaygroundDemo.tsx
- Dark Mode Requirements: All visible elements must have dark: variants

**Data Hub Context Standards** (data-hub-patterns.md):
- 4-Column Stats Dashboards: PRESERVE (not a bug)
- Gray Filter Panels: PRESERVE (intentional, not colored)
- Compact Padding (p-3): PRESERVE for stats cards
- Purple Tag Badges: PRESERVE (semantic meaning)
- Export Buttons: Check placement and style

**Offshore Hub Context Standards** (offshore-hub-patterns.md):
- Page Gradients: PRESERVE (premium treatment)
- Text Gradients: PRESERVE (headings only)
- Gradient Tabs: PRESERVE (active state)
- rounded-2xl: PRESERVE (not a bug, should NOT be rounded-lg)
- Gradient Stat Cards: PRESERVE (premium pattern)
- Dual-Color Scheme: PRESERVE (jurisdiction-based)

**Reference Context** (AdvancedPlaygroundDemo.tsx):
- NEVER AUDIT: Skip entirely
</action>
</step>

<step n="2" goal="Discover and context-classify all components">
<action>Scan {components_path} for all .tsx files:
- Use recursive file search
- Exclude node_modules and build directories
- Count total components found
- Store complete file list as {{component_files}}
</action>

<action>Detect context for EACH component using component-context-map.md rules:

**For Each Component**:
1. Check if filename is "AdvancedPlaygroundDemo.tsx" → REFERENCE (SKIP)
2. Check offshore hub indicators:
   - Filename contains: Offshore, CIMA, BVI, Cayman, Jurisdiction
   - If match → OFFSHORE_HUB
3. Check data hub indicators:
   - Filename contains: Scraper, Data, Import, Export, Hub, HK, HKSFC, HKEX, CCASS, Webb
   - If match → DATA_HUB
4. Otherwise → CORE

Store component with detected context: {{component_name}}: {{context}}
</action>

<action>Categorize components BY CONTEXT:

**Reference Context** (SKIP audit):
- [List components to skip, e.g., AdvancedPlaygroundDemo.tsx]

**Offshore Hub Context**:
- [List offshore hub components]

**Data Hub Context**:
- [List data hub components]

**Core Context**:
- [List core components]

</action>

<action>Display discovery summary:
**Components Discovered**: {{total_components}}

**Context Distribution**:
- Reference (Skip): [count] components
- Offshore Hub: [count] components
- Data Hub: [count] components
- Core: [count] components

Starting context-aware comprehensive audit...
</action>

<template-output>total_components</template-output>
</step>

<step n="3" goal="Audit each component for inconsistencies (context-aware)">
<action>For each component in {{component_files}}, perform CONTEXT-AWARE analysis:

**For Each Component File**:

0. **Check Context** (from Step 2):
   - If context = REFERENCE → SKIP entirely, log "Skipped {filename} - Design reference (never audit)"
   - If context = OFFSHORE_HUB → Apply offshore hub audit rules
   - If context = DATA_HUB → Apply data hub audit rules
   - If context = CORE → Apply core audit rules

1. **Read Complete File** (if not skipped)

2. **Analyze Color Usage** (CONTEXT-AWARE):
   - Find all color classes (bg-*, text-*, border-*)
   - Check against CONTEXT-SPECIFIC standards:
     - **CORE**: Flag indigo (should be blue), check semantic colors
     - **DATA_HUB**:
       - ALLOW gray filter panels (bg-gray-50 is correct)
       - ALLOW 4-column colored stats (blue, green, purple, orange)
       - ALLOW purple tag badges (semantic)
     - **OFFSHORE_HUB**:
       - ALLOW page gradients (from-gray-50 via-cyan-50 to-teal-50)
       - ALLOW text gradients (from-cyan-600 to-teal-600)
       - ALLOW gradient backgrounds on tabs/cards
       - ALLOW dual-color scheme (cyan + teal)
   - Check for missing dark: variants (ALL CONTEXTS)
   - Count semantic color mismatches (only non-allowed patterns)

3. **Analyze Typography** (SAME FOR ALL CONTEXTS):
   - Find all font size classes (text-*)
   - Find all font weight classes (font-*)
   - Check against design system typography scale
   - Flag arbitrary font sizes
   - Check heading hierarchy

4. **Analyze Spacing** (CONTEXT-AWARE):
   - Find all padding classes (p-*, px-*, py-*)
   - Find all margin/gap classes (m-*, space-*, gap-*)
   - Check against Tailwind spacing scale
   - **DATA_HUB**: ALLOW p-3 for stats cards (intentional compact spacing)
   - **CORE/OFFSHORE**: Flag arbitrary values (e.g., p-[13px])
   - Count spacing violations (excluding allowed context-specific values)

5. **Analyze Component Patterns** (CONTEXT-AWARE):
   - Identify buttons, cards, inputs, badges, tabs
   - Compare against CONTEXT-SPECIFIC patterns:
     - **CORE**: design-system.md + patterns.md
     - **DATA_HUB**: data-hub-patterns.md (allow gray filters, export buttons)
     - **OFFSHORE_HUB**: offshore-hub-patterns.md (allow gradient tabs, live indicators)
   - Check border radius:
     - **CORE/DATA_HUB**: Flag if not rounded-lg or rounded-md
     - **OFFSHORE_HUB**: ALLOW rounded-2xl (intentional premium treatment)
   - Check shadow usage
   - Flag pattern mismatches (context-specific)

6. **Analyze Dark Mode Coverage** (SAME FOR ALL CONTEXTS):
   - Count total elements with colors
   - Count elements with dark: variants
   - Calculate dark mode coverage percentage
   - List missing dark mode support

7. **Analyze Context-Specific Patterns** (NEW):
   - **DATA_HUB**: Check for proper export button placement, filter panel structure
   - **OFFSHORE_HUB**: Check gradient consistency, live status indicators
   - **CORE**: Check alignment with AdvancedPlaygroundDemo.tsx patterns

8. **Calculate Component Metrics**:
   - Context: {{component_context}}
   - Total issues found: [count] (excluding preserved context-specific patterns)
   - Critical issues: [count]
   - High priority issues: [count]
   - Medium priority issues: [count]
   - Low priority issues: [count]
   - Consistency score: 0-100
   - Dark mode coverage: 0-100%

8. **Categorize Component**:
   - Fully Consistent (95-100%): No or minimal issues
   - Minor Fixes Needed (75-94%): Some improvements
   - Major Fixes Needed (<75%): Significant work required

</action>

<action>Store results for each component:
- Component name
- File path
- Category (page, UI, tool, etc.)
- Total issues by type
- Consistency score
- Dark mode coverage
- Critical issues list
- Recommended fixes
</action>

<action>Display progress every 10 components:
"Audited [count]/{{total_components}} components..."
</action>

<template-output>component_findings</template-output>
</step>

<step n="4" goal="Aggregate and analyze findings">
<action>Calculate overall metrics:

**Overall Consistency Score**:
- Weighted average of all component scores
- Weight by component importance (pages > utilities)

**Issue Totals by Category**:
- Color issues: Sum across all components
- Typography issues: Sum across all components
- Spacing issues: Sum across all components
- Component pattern issues: Sum across all components
- Dark mode missing: Count components without full coverage

**Component Distribution**:
- Fully consistent: Count and percentage
- Minor fixes needed: Count and percentage
- Major fixes needed: Count and percentage

**Dark Mode Analysis**:
- Overall coverage percentage
- List of components with < 50% coverage
- List of components with 0% coverage

</action>

<action>Identify common issues:

**Most Common Color Issues** (top 5):
- List issues that appear in most components
- E.g., "Using indigo instead of blue: 15 components"

**Most Common Typography Issues** (top 5):
- List frequent typography problems
- E.g., "Arbitrary font sizes: 8 components"

**Most Common Spacing Issues** (top 5):
- List spacing violations
- E.g., "Non-scale padding values: 12 components"

**Most Common Component Pattern Issues** (top 5):
- List pattern mismatches
- E.g., "Non-standard button variants: 10 components"

</action>

<action>Create priority rankings:

**Top 10 Files Needing Attention**:
- Rank by consistency score (lowest first)
- Include score, issue count, category
- Provide file path for each

</action>

<template-output>executive_summary</template-output>
<template-output>consistency_score</template-output>
<template-output>fully_consistent_count</template-output>
<template-output>fully_consistent_percentage</template-output>
<template-output>minor_fixes_count</template-output>
<template-output>minor_fixes_percentage</template-output>
<template-output>major_fixes_count</template-output>
<template-output>major_fixes_percentage</template-output>
<template-output>total_issues</template-output>
<template-output>color_issues_count</template-output>
<template-output>color_affected_components</template-output>
<template-output>color_issues_summary</template-output>
<template-output>color_common_issues</template-output>
<template-output>typography_issues_count</template-output>
<template-output>typography_affected_components</template-output>
<template-output>typography_issues_summary</template-output>
<template-output>typography_common_issues</template-output>
<template-output>spacing_issues_count</template-output>
<template-output>spacing_affected_components</template-output>
<template-output>spacing_issues_summary</template-output>
<template-output>spacing_common_issues</template-output>
<template-output>component_issues_count</template-output>
<template-output>component_affected_components</template-output>
<template-output>component_issues_summary</template-output>
<template-output>component_common_issues</template-output>
<template-output>dark_mode_coverage</template-output>
<template-output>dark_mode_analysis</template-output>
<template-output>components_missing_dark_mode</template-output>
<template-output>top_files_needing_fixes</template-output>
</step>

<step n="5" goal="Generate recommendations">
<action>Create prioritized recommendations based on impact and effort:

**Priority 1: Critical Fixes (Do First)**:
- Primary color mismatches (high visibility, low effort)
- Missing dark mode on main pages (high visibility, medium effort)
- UI component base patterns (affects all pages, medium effort)

Examples:
- "Fix ui/Button.tsx primary color from indigo to blue (affects ALL pages)"
- "Add dark mode to IntegratedPlaygroundHub.tsx (high-traffic page)"
- "Update card patterns in EnhancedLLMMarket.tsx"

**Priority 2: High-Impact Improvements**:
- Semantic color mismatches
- Spacing standardization on main pages
- Component pattern alignment

**Priority 3: Medium-Impact Improvements**:
- Typography standardization
- Border consistency
- Shadow usage alignment

**Priority 4: Nice-to-Have Optimizations**:
- Minor spacing adjustments
- Hover state consistency
- Transition standardization

For each recommendation:
- Describe the issue clearly
- Explain the impact
- Estimate effort (low/medium/high)
- Provide code example of fix
- Link to design system standard

</action>

<template-output>priority_critical_recommendations</template-output>
<template-output>priority_high_recommendations</template-output>
<template-output>priority_medium_recommendations</template-output>
<template-output>priority_low_recommendations</template-output>
</step>

<step n="6" goal="Create implementation roadmap">
<action>Generate phased implementation plan:

**Phase 1: Foundation (1-2 hours)**
- Fix UI component library (ui/ directory)
- This fixes the base patterns used everywhere
- Components: Button.tsx, Card.tsx, Input.tsx
- Impact: Ripple effect across all pages

**Phase 2: High-Traffic Pages (2-3 hours)**
- Harmonize main user-facing pages
- Components: IntegratedPlaygroundHub, EnhancedLLMMarket, MultiModelChat, etc.
- Impact: Most visible to users

**Phase 3: Feature Pages (3-4 hours)**
- Harmonize specialized pages
- Components: HK scrapers, NPM tools, workflow playground
- Impact: Feature-specific improvements

**Phase 4: Polish (1-2 hours)**
- Fix utilities and remaining components
- Add missing dark mode coverage
- Final consistency sweep

**Total Estimated Time**: 7-11 hours
**Expected Consistency Score After**: 95%+

</action>

<template-output>implementation_roadmap</template-output>
</step>

<step n="7" goal="Generate detailed issue list">
<action>Create comprehensive appendix with all findings:

For each component with issues:
```
## ComponentName.tsx
**Path**: src/components/ComponentName.tsx
**Consistency Score**: XX/100
**Dark Mode Coverage**: XX%

### Issues Found:
1. **Color**: [Line XX] Using `bg-indigo-600`, should be `bg-blue-600`
2. **Dark Mode**: [Line XX] Missing `dark:bg-gray-800` on div element
3. **Spacing**: [Line XX] Using `p-[13px]`, should use Tailwind scale (p-3 or p-4)
...

### Recommended Fixes:
- Update primary button color to blue
- Add dark mode variants to all colored elements
- Replace arbitrary spacing with p-3
...
```

</action>

<template-output>detailed_issue_list</template-output>
</step>

<step n="8" goal="Save audit report">
<action>Write complete audit report to {default_output_file}</action>

<action>Display completion summary:

**✅ Design System Audit Complete**

**Report Saved**: {default_output_file}

**Summary**:
- Components Audited: {{total_components}}
- Overall Consistency: {{consistency_score}}/100
- Total Issues: {{total_issues}}
- Dark Mode Coverage: {{dark_mode_coverage}}%

**Next Steps**:
1. Review full audit report at {default_output_file}
2. Start with Priority 1 recommendations
3. Use *apply-to-page to fix individual components
4. Use *harmonize-all to fix all components at once

Run *harmonize-all to automatically apply fixes with approval checkpoints.

</action>
</step>

</workflow>
