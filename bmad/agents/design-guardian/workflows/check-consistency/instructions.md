# Check Consistency - Design System Audit

<critical>The workflow execution engine is governed by: {project-root}/bmad/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {agent_folder}/workflows/check-consistency/workflow.yaml</critical>
<critical>Communicate in {communication_language} throughout the workflow process</critical>
<critical>This is a READ-ONLY audit workflow - NO files will be modified</critical>

<workflow>

<step n="1" goal="Load design system standards">
<action>Load design system documentation:
- Read {design_system_doc} (complete file)
- Read {patterns_doc} (complete file)
- Extract all design standards for comparison
</action>

<action>Create design system checklist:
- **Color Standards**: List all approved colors with light/dark variants
- **Typography Standards**: List approved font sizes, weights, families
- **Spacing Standards**: List Tailwind spacing scale values (no arbitrary values)
- **Component Patterns**: List approved button, card, input, badge patterns
- **Dark Mode Requirements**: All visible elements must have dark: variants
</action>
</step>

<step n="2" goal="Discover all components to audit">
<action>Scan {components_path} for all .tsx files:
- Use recursive file search
- Exclude node_modules and build directories
- Count total components found
- Store complete file list as {{component_files}}
</action>

<action>Categorize components by type:
- **Main Pages**: Hub, markets, playgrounds, chat (user-facing)
- **HK Scrapers**: All Hong Kong scraper components
- **Auth Components**: Authentication and user management
- **UI Components**: Reusable UI elements (buttons, cards, inputs)
- **Tools**: Import tools, sandboxes, visualizers
- **Utilities**: Helpers, managers, advisors
</action>

<action>Display discovery summary:
**Components Discovered**:
- Total files: {{total_components}}
- Main Pages: [count]
- HK Scrapers: [count]
- Auth Components: [count]
- UI Components: [count]
- Tools: [count]
- Utilities: [count]

Starting comprehensive audit...
</action>

<template-output>total_components</template-output>
</step>

<step n="3" goal="Audit each component for inconsistencies">
<action>For each component in {{component_files}}, perform comprehensive analysis:

**For Each Component File**:

1. **Read Complete File**
2. **Analyze Color Usage**:
   - Find all color classes (bg-*, text-*, border-*)
   - Check if colors match design system
   - Flag non-standard colors (e.g., indigo when should be blue)
   - Check for missing dark: variants
   - Count semantic color mismatches

3. **Analyze Typography**:
   - Find all font size classes (text-*)
   - Find all font weight classes (font-*)
   - Check against design system typography scale
   - Flag arbitrary font sizes
   - Check heading hierarchy

4. **Analyze Spacing**:
   - Find all padding classes (p-*, px-*, py-*)
   - Find all margin/gap classes (m-*, space-*, gap-*)
   - Check against Tailwind spacing scale
   - Flag arbitrary values (e.g., p-[13px])
   - Count spacing violations

5. **Analyze Component Patterns**:
   - Identify buttons, cards, inputs, badges, tabs
   - Compare against design system patterns
   - Flag pattern mismatches
   - Check border radius consistency
   - Check shadow usage

6. **Analyze Dark Mode Coverage**:
   - Count total elements with colors
   - Count elements with dark: variants
   - Calculate dark mode coverage percentage
   - List missing dark mode support

7. **Calculate Component Metrics**:
   - Total issues found: [count]
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
