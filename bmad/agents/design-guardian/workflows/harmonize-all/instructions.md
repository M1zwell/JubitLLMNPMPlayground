# Harmonize All - Complete Design System Implementation

<critical>The workflow execution engine is governed by: {project-root}/bmad/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {agent_folder}/workflows/harmonize-all/workflow.yaml</critical>
<critical>Communicate in {communication_language} throughout the workflow process</critical>
<critical>This workflow makes SIGNIFICANT changes - user approval required at key checkpoints</critical>

<workflow>

<step n="1" goal="Load design system knowledge and refresh from reference">
<action>Load design system documentation:
- Read {design_system_doc} (complete file - all design tokens)
- Read {patterns_doc} (complete file - component patterns)
- Store as context for harmonization
</action>

<action>Optional: Refresh design system from reference:
"The design system was last updated on [extract date from design-system.md].
Would you like to refresh it from AdvancedPlaygroundDemo.tsx before harmonizing? (y/n)"

If yes: Invoke {agent_folder}/workflows/analyze-reference/workflow.yaml to update design system documentation
</action>

<action>Create design standards checklist:
- **Primary Color**: Blue (bg-blue-600, not indigo)
- **Semantic Colors**: Purple (AI), Red (security), Green (success), Yellow (warning), Orange (optimization), Teal (workflow)
- **Dark Mode**: All colored elements must have dark: variants
- **Spacing**: Follow Tailwind scale (p-2, p-3, p-4, p-6, not arbitrary values)
- **Typography**: Use design system font sizes (text-xs/sm/base/lg/xl/2xl)
- **Component Patterns**: Match Advanced page patterns for buttons, cards, inputs, badges, tabs
</action>
</step>

<step n="2" goal="Scan and prioritize all components">
<action>Discover all .tsx files in {components_path}:
- Use recursive file search
- Exclude node_modules, build, dist directories
- Exclude AdvancedPlaygroundDemo.tsx (it's the reference!)
- Count total components to harmonize
</action>

<action>For each component, perform quick scan to calculate priority:

**Priority Calculation**:
1. Count total issues (colors, typography, spacing, components, dark mode)
2. Assess component importance:
   - **Critical**: Main pages (Hub, Markets, Chat) = 3x weight
   - **High**: UI components (affects all pages) = 2.5x weight
   - **Medium**: Feature pages (HK scrapers, tools) = 1.5x weight
   - **Low**: Utilities and helpers = 1x weight
3. Calculate severity score: (issues × importance weight)

**Categorize by Priority**:
- Priority 1: Severity > 15 (fix first)
- Priority 2: Severity 8-14 (fix second)
- Priority 3: Severity < 8 (fix last)

</action>

<action>Group components into batches for approval:
- Batch size: 5 components per batch
- Group by similar priority and category
- Estimate total batches needed
</action>

<action>Display harmonization plan:

**Harmonization Plan**

**Total Components to Harmonize**: [count]
**Excluded from Harmonization**: AdvancedPlaygroundDemo.tsx (design reference)

**Priority Breakdown**:
- Priority 1 (Critical): [count] components
- Priority 2 (High): [count] components
- Priority 3 (Medium): [count] components

**Batch Plan**:
- Total Batches: [count]
- Components per Batch: 5
- Estimated Time: [hours]

**Will Harmonize**:
- UI Components: [list]
- Main Pages: [list]
- Feature Pages: [list]
- Utilities: [list]

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

<step n="3" goal="Process each batch with approval" repeat="for-each-batch">
<action>Select next batch of 5 components (or remaining if < 5)</action>

<action>For each component in current batch:

**Component Analysis**:
1. Read complete component file
2. Identify all inconsistencies:
   - Colors not matching design system
   - Missing dark mode variants
   - Spacing violations (arbitrary values)
   - Typography issues
   - Component pattern mismatches

3. Generate fixes:
   - Map incorrect colors to design system colors
   - Add missing dark: variants
   - Replace arbitrary spacing with Tailwind scale
   - Update typography to match design system
   - Align component patterns with reference

4. Create before/after code snippets:
   - Show most impactful changes (top 5-10 per file)
   - Include line numbers
   - Explain why each change improves consistency

5. Calculate improvement metrics:
   - Consistency score before: XX%
   - Consistency score after: XX%
   - Dark mode coverage before: XX%
   - Dark mode coverage after: XX%

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
