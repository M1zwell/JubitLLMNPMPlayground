# UI/UX Expert Agent - Instructions

Detailed workflows for executing each command with best practices and methodologies.

## General Workflow Pattern

For all review and analysis commands:

1. **Load Context** - Read memories.md and gather project-specific knowledge
2. **Examine Target** - Use Read/Glob to inspect relevant files
3. **Apply Checklist** - Follow command-specific evaluation criteria
4. **Document Findings** - Create structured report with severity levels
5. **Provide Recommendations** - Actionable improvements with code examples
6. **Update Memory** - Store new patterns and decisions

## Review Commands

### review-accessibility

**Purpose:** Comprehensive accessibility audit against WCAG 2.1 standards

**Steps:**
1. Scan for semantic HTML structure (header, nav, main, article, section, footer)
2. Check ARIA roles, states, and properties for correctness
3. Verify keyboard navigation (tab order, focus management, skip links)
4. Test color contrast ratios (4.5:1 for text, 3:1 for UI components)
5. Evaluate form accessibility (labels, error messages, help text, validation)
6. Check image alternative text and decorative image handling
7. Verify heading hierarchy (h1-h6 structure)
8. Test focus indicators visibility
9. Check for keyboard traps and proper focus restoration
10. Evaluate screen reader compatibility

**Output Format:**
- Summary with compliance level (A, AA, AAA)
- Issues categorized by severity (Critical, High, Medium, Low)
- WCAG Success Criterion references for each issue
- Specific code examples for fixes
- Prioritized remediation roadmap

### review-component

**Purpose:** Evaluate single component for usability and design quality

**Checklist:**
- **Purpose & Intent:** Does the component clearly communicate its function?
- **Visual Hierarchy:** Proper use of size, weight, color to guide attention
- **Consistency:** Alignment with design system patterns
- **States:** All interactive states defined (default, hover, active, focus, disabled, loading, error)
- **Responsiveness:** Behavior across breakpoints
- **Accessibility:** Semantic markup, keyboard support, ARIA
- **Performance:** Unnecessary re-renders, optimization opportunities
- **Maintainability:** Code organization, naming conventions

**Output:** Component scorecard with specific improvement recommendations

### review-page

**Purpose:** Holistic page-level design review

**Evaluation Areas:**
1. **Layout Structure:** Grid usage, spacing consistency, alignment
2. **Visual Hierarchy:** F-pattern/Z-pattern compliance, emphasis distribution
3. **Content Strategy:** Headings, paragraph length, scannability
4. **User Flow:** Primary actions, secondary actions, escape hatches
5. **Navigation:** Wayfinding, breadcrumbs, contextual navigation
6. **Mobile Experience:** Touch targets, thumb zones, progressive enhancement
7. **Performance:** Loading experience, skeleton screens, lazy loading
8. **Empty States:** Handling of no-data scenarios
9. **Error Handling:** Error messaging, recovery paths
10. **Call-to-Actions:** Visibility, clarity, prioritization

### review-responsive

**Purpose:** Audit responsive design implementation

**Test Points:**
- Breakpoint strategy (mobile-first vs desktop-first)
- Fluid typography implementation
- Image responsiveness (srcset, sizes, aspect-ratio)
- Touch target sizing (minimum 44x44px)
- Navigation patterns for mobile (hamburger, drawer, bottom nav)
- Form factor considerations (thumb zones, reachability)
- Orientation handling (portrait/landscape)
- Container query usage for component-level responsiveness

### quick-review

**Purpose:** Fast triage of major issues for rapid feedback

**Priority Checks (5 minutes max):**
1. Critical accessibility violations (missing alt text, poor contrast)
2. Broken responsive behavior (overflow, hidden content)
3. Missing interactive states (no hover/focus styles)
4. Inconsistent spacing/typography
5. Semantic HTML issues

## Analyze Commands

### analyze-contrast

**Methodology:**
1. Extract all color combinations (text on background)
2. Calculate contrast ratios using WCAG formula
3. Evaluate against standards:
   - Normal text: 4.5:1 (AA), 7:1 (AAA)
   - Large text (18pt+): 3:1 (AA), 4.5:1 (AAA)
   - UI components: 3:1 (AA)
4. Flag violations with specific color codes and recommendations
5. Suggest accessible color palette alternatives

### analyze-flow

**User Journey Analysis:**
1. Identify primary user goals
2. Map task completion paths
3. Count steps to conversion
4. Identify friction points (unnecessary steps, unclear CTAs)
5. Evaluate information scent (breadcrumbs, progress indicators)
6. Test error recovery paths
7. Recommend flow optimizations

### analyze-consistency

**Pattern Matching:**
1. Extract design tokens (colors, spacing, typography)
2. Identify hardcoded values
3. Compare component implementations for similar functionality
4. Check naming conventions
5. Flag inconsistencies with examples
6. Recommend design token adoption

### analyze-system

**Design System Audit:**
1. Inventory all components
2. Check design token usage coverage
3. Evaluate component composition patterns
4. Test component variants and props API
5. Review documentation completeness
6. Assess design-dev handoff quality

### analyze-forms

**Form UX Evaluation:**
1. Label association (explicit/implicit)
2. Input types and HTML5 validation
3. Error message clarity and timing
4. Help text availability
5. Required field indicators
6. Success feedback
7. Autofocus and autocomplete usage
8. Multi-step form progress indication

## Improve Commands

### improve-accessibility

**Remediation Process:**
1. Prioritize critical violations first
2. Fix semantic HTML structure
3. Add proper ARIA labels where needed
4. Implement keyboard navigation
5. Adjust colors for contrast compliance
6. Add focus indicators
7. Test with keyboard only
8. Verify with screen reader

### improve-contrast

**Color Adjustment:**
1. Calculate required adjustments using WCAG formula
2. Propose alternative colors from palette
3. Generate color variants if needed
4. Update CSS/Tailwind classes
5. Verify against multiple color blindness types

### improve-responsive

**Responsive Enhancement:**
1. Implement mobile-first breakpoints
2. Add fluid typography scale
3. Optimize touch targets for mobile
4. Refactor layout with modern CSS (Grid/Flexbox)
5. Add container queries where appropriate
6. Test across device spectrum

### improve-component

**Component Refactoring:**
1. Extract hardcoded values to props/tokens
2. Add missing interactive states
3. Improve semantic HTML structure
4. Enhance accessibility features
5. Optimize performance (memo, lazy loading)
6. Add proper TypeScript types

### improve-semantics

**Semantic HTML Fixes:**
1. Replace divs with semantic elements
2. Fix heading hierarchy
3. Add landmark roles
4. Implement ARIA where HTML is insufficient
5. Ensure logical tab order
6. Add skip links for navigation

## Guide Commands

### create-guidelines

**Output:** Comprehensive UI/UX guideline document containing:
- Design principles specific to project
- Component usage patterns
- Accessibility requirements
- Responsive design standards
- Typography guidelines
- Color usage rules
- Spacing and layout conventions
- Code examples and anti-patterns

### document-patterns

**Pattern Documentation:**
1. Identify recurring patterns in codebase
2. Extract reusable component examples
3. Document when to use each pattern
4. Provide code examples
5. Note accessibility considerations
6. Link to design system tokens

### suggest-improvements

**Roadmap Creation:**
1. Prioritize by impact vs effort
2. Group by category (accessibility, UX, performance)
3. Provide time estimates
4. Sequence for minimal disruption
5. Include success metrics

### explain-wcag

**Educational Response:**
1. Cite specific Success Criterion (e.g., 1.4.3 Contrast)
2. Explain intent in plain language
3. Provide conformance level (A, AA, AAA)
4. Give practical examples
5. Show how to test compliance
6. Link to official WCAG documentation

### design-tokens

**Token Strategy:**
1. Analyze current color/spacing/typography usage
2. Propose token structure (semantic vs primitive)
3. Show implementation approach (CSS vars, Tailwind, styled-system)
4. Demonstrate component migration
5. Provide naming conventions

---

## Best Practices

### When Reviewing Code

- Read files completely before judging
- Consider context (user goals, technical constraints)
- Provide specific, actionable feedback
- Show code examples for fixes
- Balance idealism with pragmatism
- Acknowledge good patterns when found

### When Making Improvements

- Make minimal necessary changes
- Maintain existing code style
- Add comments explaining accessibility features
- Test keyboard navigation after changes
- Verify no regressions introduced

### When Documenting

- Use clear, jargon-free language
- Provide visual examples (pseudo-code, ASCII diagrams)
- Link to authoritative sources (WCAG, MDN, W3C)
- Update memories.md with new learnings
