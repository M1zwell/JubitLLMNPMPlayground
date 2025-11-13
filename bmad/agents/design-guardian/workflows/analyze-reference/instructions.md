# Analyze Reference - Extract Design Tokens

<critical>The workflow execution engine is governed by: {project-root}/bmad/core/tasks/workflow.xml</critical>
<critical>You MUST have already loaded and processed: {agent_folder}/workflows/analyze-reference/workflow.yaml</critical>
<critical>Communicate in {communication_language} throughout the workflow process</critical>

<workflow>

<step n="1" goal="Load current design system documentation">
<action>Read the existing design system documentation from: {design_system_doc}</action>
<action>Read the existing patterns documentation from: {patterns_doc}</action>
<action>Note the last update date and current token counts</action>
<action>Store current state for comparison after extraction</action>
</step>

<step n="2" goal="Read Advanced page reference completely">
<action>Read the COMPLETE file from: {design_reference}</action>
<critical>This is the golden design standard - read every line, do not use offset/limit</critical>
<action>Note the file size and component structure for analysis</action>
</step>

<step n="3" goal="Extract design tokens systematically">
<action>Extract and categorize all design tokens following these patterns:

**Color Palette Extraction:**
- Scan for all Tailwind color classes (bg-*, text-*, border-*)
- Group by semantic meaning (purple for AI, blue for primary, red for security, etc.)
- Identify light mode variants (e.g., bg-purple-50, text-purple-600)
- Identify dark mode variants (e.g., dark:bg-purple-900/20, dark:text-purple-300)
- Note the opacity patterns for dark backgrounds (*/20 pattern)

**Typography Extraction:**
- Find all font size classes (text-xs, text-sm, text-base, text-lg, text-xl, text-2xl)
- Find all font weight classes (font-normal, font-medium, font-semibold, font-bold)
- Identify heading hierarchy and usage patterns
- Note font family usage (default, mono for code)

**Spacing Extraction:**
- Extract padding patterns (p-*, px-*, py-*)
- Extract margin/gap patterns (space-y-*, space-x-*, gap-*)
- Extract icon sizing (w-4 h-4, w-5 h-5, w-8 h-8)
- Note the Tailwind scale compliance (2, 3, 4, 6, 8, 12, etc.)

**Component Patterns Extraction:**
- Card components (backgrounds, borders, padding, rounded corners)
- Button variants (primary, secondary, ghost, gradient)
- Badge/Tag patterns (status colors, sizing)
- Input field patterns (borders, focus states, padding)
- Tab navigation patterns (active/inactive states, borders)
- Icon usage patterns (sizing, colors, positioning)

**Effects & Interactions:**
- Shadow patterns (shadow-sm, shadow-md)
- Transition patterns (transition-colors, hover states)
- Rounded corner standards (rounded-md, rounded-lg, rounded-full)
- Hover state patterns for different element types

</action>

<action>Count total occurrences of each pattern to identify the most common standards</action>
<action>Flag any arbitrary values (e.g., p-[13px]) as anti-patterns to avoid</action>
</step>

<step n="4" goal="Compare with existing documentation">
<action>Compare extracted tokens against the current design-system.md:
- Which colors are new?
- Which components have changed?
- Which patterns have been added or removed?
- Are there any inconsistencies within the reference itself?
</action>

<action>Identify updates needed:
- New semantic colors added
- Typography changes (new sizes, weights)
- Spacing updates
- New component patterns
- Modified hover/focus states
- Updated dark mode patterns
</action>

<action>Calculate change summary:
- Number of new tokens added
- Number of tokens modified
- Number of tokens deprecated
- Percentage of documentation needing updates
</action>
</step>

<step n="5" goal="Update design system documentation">
<action>Update {design_system_doc} with the latest extracted tokens:

Structure the update to match the existing format:
1. **Color Palette** section - Update all color variants
2. **Typography** section - Update font sizes, weights, families
3. **Spacing Scale** section - Update padding, margins, gaps
4. **Component Patterns** section - Update or add component examples
5. **Effects & Interactions** section - Update shadows, transitions
6. **Dark Mode Strategy** section - Ensure rules are current
7. **Accessibility Patterns** section - Verify standards
8. **Code Block Patterns** section - Update if changed
9. **Common Anti-Patterns** section - Add any new anti-patterns found

For each section:
- Preserve existing content that's still accurate
- Add new tokens/patterns discovered
- Update changed patterns with new values
- Remove deprecated tokens (mark as deprecated, don't delete history)
- Include code examples for new patterns

</action>

<action>Update the metadata at the top of design-system.md:
- **Last Extracted**: {date}
- **Status**: Active Golden Standard
- Add note about what changed in this update
</action>

<action if="new patterns found">Also update {patterns_doc} if new reusable component snippets were found</action>
</step>

<step n="6" goal="Display update summary">
<action>Generate and display a comprehensive summary:

**Design System Update Summary**

**Date**: {date}
**Reference Source**: {design_reference}
**Updated By**: {user_name}

**Changes Made**:
- Colors Added: [count] (list new semantic colors)
- Colors Modified: [count] (list changes)
- Typography Updates: [count] (new sizes/weights)
- Spacing Changes: [count]
- New Component Patterns: [count] (list patterns)
- Modified Patterns: [count]
- Deprecated Items: [count]

**Documentation Stats**:
- Total Tokens Documented: [count]
- Total Component Patterns: [count]
- Anti-Patterns Identified: [count]
- Lines Updated in design-system.md: [count]

**Key Updates**:
- [Highlight 3-5 most significant changes]

**Next Steps**:
- Run *check-consistency to audit current components against updated system
- Run *harmonize-all to apply updated design system to all pages

</action>

<ask>Would you like to see the detailed diff of changes to design-system.md? (y/n)</ask>

<action if="user says yes">Display the key sections that changed with before/after comparison</action>
</step>

</workflow>
