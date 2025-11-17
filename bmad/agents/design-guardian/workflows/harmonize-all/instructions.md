# Harmonize All - Complete Design System Implementation

<critical>The workflow execution engine is governed by: {project-root}/bmad/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {agent_folder}/workflows/harmonize-all/workflow.yaml</critical>
<critical>Communicate in {communication_language} throughout the workflow process</critical>
<critical>This workflow makes SIGNIFICANT changes - user approval required at key checkpoints</critical>

<workflow>

<step n="1" goal="Load design system knowledge and refresh from reference">
<action>Load ALL design system documentation (context-aware):
- Read {design_system_doc} (complete file - includes context-aware architecture)
- Read {patterns_doc} (complete file - core component patterns)
- Read {knowledge_folder}/data-hub-patterns.md (complete file - data hub patterns)
- Read {knowledge_folder}/offshore-hub-patterns.md (complete file - offshore hub patterns)
- Read {knowledge_folder}/component-context-map.md (complete file - context detection rules)
- Store as context for harmonization
</action>

<action>Optional: Refresh design system from reference:
"The design system was last updated on [extract date from design-system.md].
Would you like to refresh it from AdvancedPlaygroundDemo.tsx before harmonizing? (y/n)"

If yes: Invoke {agent_folder}/workflows/analyze-reference/workflow.yaml to update CORE design system documentation
NOTE: This only updates core patterns, NOT context-specific patterns (data hub, offshore hub)
</action>

<action>Create design standards checklist BY CONTEXT:

**CORE Context Standards**:
- Primary Color: Blue (bg-blue-600, not indigo)
- Semantic Colors: Purple (AI), Red (security), Green (success), Yellow (warning), Orange (optimization), Teal (workflow)
- Dark Mode: All colored elements must have dark: variants
- Spacing: Follow Tailwind scale (p-2, p-3, p-4, p-6, not arbitrary values)
- Typography: Use design system font sizes (text-xs/sm/base/lg/xl/2xl)
- Component Patterns: Match AdvancedPlaygroundDemo.tsx patterns
- Border Radius: rounded-lg or rounded-md (standard)

**DATA HUB Context Preservations** (do NOT "fix" these):
- 4-column stats dashboards (colored) - PRESERVE
- Gray filter panels (bg-gray-50) - PRESERVE (not a bug)
- Compact padding (p-3 for stats) - PRESERVE
- Purple tag badges - PRESERVE (semantic)
- Highlighted blue filter sections - PRESERVE
- Export button placement - CHECK style but PRESERVE placement

**OFFSHORE HUB Context Preservations** (do NOT "fix" these):
- Page background gradients (from-gray-50 via-cyan-50 to-teal-50) - PRESERVE
- Text gradient headings (from-cyan-600 to-teal-600) - PRESERVE
- Gradient tab buttons - PRESERVE
- Large rounded corners (rounded-2xl) - PRESERVE (not a bug, should NOT change to rounded-lg)
- Gradient stat cards - PRESERVE
- Dual-color jurisdiction scheme (cyan/teal) - PRESERVE
- Live status pulse animations - PRESERVE

**REFERENCE Context**:
- NEVER harmonize AdvancedPlaygroundDemo.tsx - it's the golden standard

</action>
</step>

<step n="2" goal="Scan, context-classify, and prioritize all components">
<action>Discover all .tsx files in {components_path}:
- Use recursive file search
- Exclude node_modules, build, dist directories
- Count total components found
</action>

<action>Detect context for EACH component using component-context-map.md rules:

**For Each Component**:
1. Check if filename is "AdvancedPlaygroundDemo.tsx" → REFERENCE (SKIP harmonization)
2. Check offshore hub indicators:
   - Filename contains: Offshore, CIMA, BVI, Cayman, Jurisdiction
   - If match → OFFSHORE_HUB
3. Check data hub indicators:
   - Filename contains: Scraper, Data, Import, Export, Hub, HK, HKSFC, HKEX, CCASS, Webb
   - If match → DATA_HUB
4. Otherwise → CORE

Store component with detected context: {{component_name}}: {{context}}
</action>

<action>For each component (except REFERENCE), perform quick scan to calculate priority:

**Priority Calculation** (CONTEXT-AWARE):
1. Count total GENUINE issues (excluding context-specific preserved patterns):
   - CORE: All inconsistencies count
   - DATA_HUB: Exclude gray filters, 4-col stats, p-3 padding, purple tags, highlighted filters
   - OFFSHORE_HUB: Exclude page gradients, text gradients, gradient tabs, rounded-2xl, gradient cards
2. Assess component importance:
   - **Critical**: Main pages (Hub, Markets, Chat) = 3x weight
   - **High**: UI components (affects all pages) = 2.5x weight
   - **Medium**: Feature pages (HK scrapers, offshore hubs, tools) = 1.5x weight
   - **Low**: Utilities and helpers = 1x weight
3. Calculate severity score: (genuine issues × importance weight)

**Categorize by Priority**:
- Priority 1: Severity > 15 (fix first)
- Priority 2: Severity 8-14 (fix second)
- Priority 3: Severity < 8 (fix last)

</action>

<action>Group components into batches for approval (BY CONTEXT):
- Batch size: 5 components per batch
- Group by CONTEXT first, then by priority
- Batching strategy:
  - CORE components together
  - DATA_HUB components together
  - OFFSHORE_HUB components together
- Estimate total batches needed
</action>

<action>Display harmonization plan:

**Harmonization Plan**

**Total Components Found**: [count]
**Excluded from Harmonization**:
- AdvancedPlaygroundDemo.tsx (design reference - never modify)

**Context Distribution**:
- CORE: [count] components ([batches] batches)
- DATA_HUB: [count] components ([batches] batches)
- OFFSHORE_HUB: [count] components ([batches] batches)
- REFERENCE: 1 component (skipped)

**Priority Breakdown**:
- Priority 1 (Critical): [count] components
- Priority 2 (High): [count] components
- Priority 3 (Medium): [count] components

**Batch Plan** (context-grouped):
- Total Batches: [count]
- Components per Batch: 5
- Estimated Time: [hours]

**Will Harmonize by Context**:
- **CORE** ([count] components): [list top 5]
- **DATA_HUB** ([count] components): [list all]
- **OFFSHORE_HUB** ([count] components): [list all]

**Context-Specific Harmonization Rules**:
- CORE → Apply core design system strictly
- DATA_HUB → Preserve stats dashboards, gray filters, compact spacing, tags
- OFFSHORE_HUB → Preserve gradients, rounded-2xl, dual-color scheme

</action>

<ask>Review the plan above. Proceed with harmonization? (yes/no/adjust)

- yes: Start harmonization with this plan
- no: Cancel workflow
- adjust: Modify batch size or priority order
</ask>

<action if="user says adjust">
<ask>What would you like to adjust?
1. Batch size (currently 5 components)
2. Priority order (reorder categories)
3. Exclude specific components
4. Other</ask>

<action>Apply user adjustments to the plan</action>
</action>

<action if="user says no">
<critical>User canceled harmonization workflow</critical>
<goto step="8">Skip to summary without making changes</goto>
</action>
</step>

<step n="3" goal="Process each batch with approval (context-aware)" repeat="for-each-batch">
<action>Select next batch of 5 components (or remaining if < 5)
- Note the CONTEXT of this batch (CORE, DATA_HUB, or OFFSHORE_HUB)
- Display batch context label prominently
</action>

<action>For each component in current batch:

**Component Analysis** (CONTEXT-AWARE):

0. **Detect Component Context** (from Step 2):
   - Context: {{component_context}}
   - Apply appropriate pattern set:
     - CORE → design-system.md + patterns.md
     - DATA_HUB → data-hub-patterns.md
     - OFFSHORE_HUB → offshore-hub-patterns.md

1. **Read complete component file**

2. **Identify GENUINE inconsistencies** (context-aware):

   **CORE Components**:
   - Colors not matching design system (flag indigo, check semantic colors)
   - Missing dark mode variants
   - Spacing violations (arbitrary values)
   - Typography issues (non-standard sizes/weights)
   - Component pattern mismatches with AdvancedPlaygroundDemo.tsx

   **DATA_HUB Components**:
   - Colors: PRESERVE gray filters, PRESERVE 4-col stats colors, PRESERVE purple tags
   - Missing dark mode variants (still check!)
   - Spacing: PRESERVE p-3 for stats cards, flag other arbitrary values
   - Typography issues (same as CORE)
   - Component patterns: PRESERVE export buttons, PRESERVE filter panels

   **OFFSHORE_HUB Components**:
   - Colors: PRESERVE page gradients, PRESERVE text gradients, PRESERVE gradient tabs, PRESERVE dual-color scheme
   - Missing dark mode variants (still check!)
   - Spacing violations (same as CORE)
   - Typography issues (same as CORE)
   - Border radius: PRESERVE rounded-2xl (do NOT change to rounded-lg!)
   - Component patterns: PRESERVE gradient stat cards, PRESERVE live indicators

3. **Generate fixes** (context-aware):

   **Always Fix (All Contexts)**:
   - Add missing dark: variants
   - Fix typography to match design system
   - Replace arbitrary spacing (except context-allowed values)
   - Fix icon sizes

   **Context-Specific Fixes**:
   - **CORE**:
     - Map incorrect colors to semantic palette
     - Align all patterns with AdvancedPlaygroundDemo.tsx
     - Standardize border radius to rounded-lg/rounded-md

   - **DATA_HUB**:
     - DO NOT change gray filter panels to colored
     - DO NOT remove 4-column stats grids
     - DO NOT change p-3 to p-4 on stats cards
     - DO NOT change purple tag backgrounds
     - DO fix missing dark mode on allowed patterns

   - **OFFSHORE_HUB**:
     - DO NOT remove page gradients
     - DO NOT remove text gradients
     - DO NOT change rounded-2xl to rounded-lg
     - DO NOT remove gradient tabs
     - DO NOT remove gradient stat cards
     - DO fix missing dark mode on gradient elements

4. **Create before/after code snippets**:
   - Show most impactful changes (top 5-10 per file)
   - Include line numbers
   - Explain WHY each change improves consistency
   - **Mark context-preserved patterns**: Label changes that PRESERVE context-specific patterns
   - Example: "✅ PRESERVED: Gray filter panel (data hub pattern)"
   - Example: "✅ ADDED: Dark mode to gradient heading (offshore hub + dark mode)"

5. **Calculate improvement metrics**:
   - Context: {{component_context}}
   - Consistency score before: XX%
   - Consistency score after: XX%
   - Dark mode coverage before: XX%
   - Dark mode coverage after: XX%
   - Context-specific patterns preserved: [count]

</action>

<action>Display batch summary:

**Batch [current]/[total]**

**Components in This Batch**:
1. [ComponentA.tsx] - [Critical/High/Medium] priority
   - Issues: [count] (Colors: X, Dark Mode: X, Spacing: X, etc.)
   - Estimated changes: [lines]
   - Score improvement: XX% → XX%

2. [ComponentB.tsx] - [Priority]
   - Issues: [count]
   - Estimated changes: [lines]
   - Score improvement: XX% → XX%

[... up to 5 components ...]

**Batch Totals**:
- Total Issues: [count]
- Total Lines to Modify: [count]
- Average Score Improvement: +XX%

</action>

<ask>Show detailed diffs for this batch? (yes/no/specific)

- yes: Show all changes for all 5 components
- no: Skip to approval
- specific: Choose which components to review
</ask>

<action if="user says yes or specific">
Display before/after code diffs for requested components:

```diff
// ComponentA.tsx - Line 42
- className="bg-indigo-600 hover:bg-indigo-700"
+ className="bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
```

[Show top 10 most impactful changes per component]
</action>

<ask>Apply fixes to this batch of components? (yes/no/skip/quit)

- yes: Apply all fixes to these 5 components
- no: Skip this batch, move to next
- skip: Skip specific components within batch
- quit: Stop harmonization workflow now
</ask>

<action if="user says quit">
<goto step="7">Generate report and exit</goto>
</action>

<action if="user says skip">
<ask>Which components should be skipped? (1,2,3,4,5)</ask>
<action>Remove selected components from batch</action>
</action>

<action if="user says yes or after skip selection">
Apply fixes to approved components:

For each component in batch:
1. Read current content
2. Apply all color fixes
3. Apply all dark mode additions
4. Apply all spacing fixes
5. Apply all typography fixes
6. Apply all component pattern fixes
7. Verify no functionality broken (preserve all logic)
8. Write updated file

Track changes:
- Components harmonized: increment count
- Total lines modified: accumulate
- Issues resolved: accumulate by category

Display progress:
"✅ ComponentA.tsx harmonized ([issues] issues resolved)"
"✅ ComponentB.tsx harmonized ([issues] issues resolved)"
...

</action>

<action>After batch complete, display batch summary:

**Batch [current] Complete**
- ✅ Components Harmonized: [count]/5
- Issues Resolved: [count]
- Lines Modified: [count]

Progress: [XX]% of all components harmonized

</action>
</step>

<step n="4" goal="Generate harmonization metrics">
<action>Calculate final metrics:

**Overall Metrics**:
- Total Components Harmonized: [count]
- Total Components Skipped: [count]
- Total Issues Resolved: [count]
- Total Lines Modified: [count]

**Issue Breakdown**:
- Color issues fixed: [count]
- Dark mode variants added: [count]
- Spacing standardized: [count]
- Typography standardized: [count]
- Component patterns aligned: [count]

**Consistency Improvement**:
- Overall Consistency Before: XX%
- Overall Consistency After: XX%
- Improvement: +XX%

**Dark Mode Coverage**:
- Coverage Before: XX%
- Coverage After: XX%
- Improvement: +XX%

**Top Improvements**:
- [List 5-10 most significant improvements]

</action>

<action>Identify any remaining work:

**Components Not Harmonized** ([count]):
- [List components that were skipped or excluded]
- Recommended action for each

</action>
</step>

<step n="5" goal="Verify no regressions">
<action>Perform quick verification:

**Verification Checks**:
1. All modified files are valid .tsx files (no syntax errors)
2. No imports or logic were modified (only styling classes)
3. All dark: variants follow design system patterns
4. No arbitrary values introduced
5. All changes align with design system standards

</action>

<action>Display verification summary:

**Verification Complete**
- ✅ All files valid
- ✅ No logic modified
- ✅ Dark mode patterns correct
- ✅ No arbitrary values
- ✅ Design system compliance

Ready to commit changes.

</action>
</step>

<step n="6" goal="Generate harmonization report">
<action>Create comprehensive markdown report:

# Design System Harmonization Report

**Date**: {date}
**Harmonized By**: {user_name}
**Design Reference**: AdvancedPlaygroundDemo.tsx

## Executive Summary

[Summary paragraph about the harmonization effort]

## Metrics

**Components Processed**: [count]/[total]
**Total Issues Resolved**: [count]
**Total Lines Modified**: [count]

**Consistency Improvement**:
- Before: XX%
- After: XX%
- Improvement: +XX%

**Dark Mode Coverage**:
- Before: XX%
- After: XX%
- Improvement: +XX%

## Changes by Category

### Colors ([count] fixes)
- Primary color standardization: [count] components
- Semantic color corrections: [count] components
- Dark mode variants added: [count] components

[Detailed breakdown]

### Typography ([count] fixes)
[Detailed breakdown]

### Spacing ([count] fixes)
[Detailed breakdown]

### Component Patterns ([count] fixes)
[Detailed breakdown]

## Files Modified

[List all modified files with change counts]

## Remaining Work

[List any components not harmonized and why]

## Next Steps

1. Review modified components visually
2. Test functionality (no regressions expected)
3. Commit changes with descriptive message
4. Run *check-consistency to verify improvements

---
_Generated by Morgan, Design System Guardian_

</action>

<action>Save report to {harmonization_report}</action>

<action>Display report location:
"📊 Harmonization report saved: {harmonization_report}"
</action>
</step>

<step n="7" goal="Commit changes to git" optional="true">
<ask>Would you like to commit the harmonized components to git? (yes/no)</ask>

<action if="user says yes">
Stage all modified components:
- Use git add for each modified file
- Create descriptive commit message

Commit message format:
```
feat: Harmonize [count] components with design system

Applied design system standards from AdvancedPlaygroundDemo.tsx to [count] components.

Changes:
- Colors: Standardized to blue primary, added dark mode variants
- Typography: Aligned font sizes and weights with design system
- Spacing: Replaced arbitrary values with Tailwind scale
- Component patterns: Updated to match design system

Metrics:
- Consistency: XX% → XX% (+XX%)
- Dark mode coverage: XX% → XX% (+XX%)
- Issues resolved: [count]
- Lines modified: [count]

Components harmonized:
- [list top 10 components]
- [and XX more...]

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

</action>

<action if="user says yes">
Create commit and display result:
- Commit hash
- Files changed count
- Insertions/deletions

Ask: "Push to remote? (yes/no)"
If yes: git push
</action>

<action if="user says no">
"Changes are staged but not committed. You can commit manually when ready."
</action>
</step>

<step n="8" goal="Display completion summary">
<action>Display comprehensive completion summary:

**✅ Design System Harmonization Complete**

**Harmonization Results**:
- Components Harmonized: [count]/[total] ([percentage]%)
- Total Issues Resolved: [count]
- Lines Modified: [count]
- Time Taken: [duration]

**Consistency Metrics**:
- Overall Consistency: XX% → XX% (+XX%)
- Dark Mode Coverage: XX% → XX% (+XX%)

**What Changed**:
- 🎨 Colors: [count] fixes (primary color unified, dark mode added)
- 📝 Typography: [count] fixes (font sizes/weights standardized)
- 📏 Spacing: [count] fixes (Tailwind scale compliance)
- 🧩 Components: [count] fixes (patterns aligned with reference)

**Files**:
- 📊 Report: {harmonization_report}
- 🎨 Reference: {design_reference}
- 📚 Design System: {design_system_doc}

**Next Steps**:
1. Review modified components visually in the app
2. Test functionality to ensure no regressions
3. Run *check-consistency to verify improvements
4. Celebrate! Your design system is now highly consistent! 🎉

**Recommended Actions**:
- Run automated tests (if available)
- Do visual QA of main pages
- Update design system documentation if new patterns emerged

Thank you for harmonizing your design system, {user_name}!

</action>
</step>

</workflow>
