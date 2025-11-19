# UI/UX Expert Agent

UI/UX Design Consultant and Accessibility Specialist for comprehensive interface reviews and improvements.

## Overview

The UI/UX Expert Agent provides professional design guidance, accessibility audits, and actionable recommendations to ensure user-centered, accessible, and high-quality interfaces.

## Features

- **Comprehensive Accessibility Audits**: WCAG 2.1 compliance checking (A, AA, AAA levels)
- **Design Reviews**: Component, page, and system-level evaluations
- **Responsive Design Analysis**: Mobile-first, breakpoint, and cross-device testing
- **Form UX Optimization**: Validation, error handling, and user flow improvements
- **Design System Guidance**: Token implementation, consistency checks, pattern documentation
- **Contrast Analysis**: Automated color contrast ratio validation
- **User Flow Mapping**: Task analysis and journey optimization

## Agent Type

**Expert Agent** with sidecar resources:
- `memories.md` - Project-specific design decisions and context
- `instructions.md` - Detailed command workflows and methodologies
- `knowledge/` - Domain expertise (WCAG standards, design patterns)

## Commands

### Review Menu
- `/bmad:agents:ui-ux-expert review-accessibility` - Full WCAG accessibility audit
- `/bmad:agents:ui-ux-expert review-component` - Single component UX review
- `/bmad:agents:ui-ux-expert review-page` - Complete page design review
- `/bmad:agents:ui-ux-expert review-responsive` - Responsive design audit
- `/bmad:agents:ui-ux-expert quick-review` - Fast triage of major issues

### Analyze Menu
- `/bmad:agents:ui-ux-expert analyze-contrast` - Color contrast analysis
- `/bmad:agents:ui-ux-expert analyze-flow` - User journey analysis
- `/bmad:agents:ui-ux-expert analyze-consistency` - Design pattern consistency
- `/bmad:agents:ui-ux-expert analyze-system` - Design system audit
- `/bmad:agents:ui-ux-expert analyze-forms` - Form UX evaluation

### Improve Menu
- `/bmad:agents:ui-ux-expert improve-accessibility` - Fix accessibility violations
- `/bmad:agents:ui-ux-expert improve-contrast` - Adjust colors for WCAG compliance
- `/bmad:agents:ui-ux-expert improve-responsive` - Enhance responsive behavior
- `/bmad:agents:ui-ux-expert improve-component` - Refactor component for better UX
- `/bmad:agents:ui-ux-expert improve-semantics` - Fix HTML semantic structure

### Guide Menu
- `/bmad:agents:ui-ux-expert create-guidelines` - Generate UI/UX guidelines document
- `/bmad:agents:ui-ux-expert document-patterns` - Document design patterns
- `/bmad:agents:ui-ux-expert suggest-improvements` - Prioritized improvement roadmap
- `/bmad:agents:ui-ux-expert explain-wcag` - Explain WCAG success criteria
- `/bmad:agents:ui-ux-expert design-tokens` - Design token implementation strategy

### Default Action
When invoked without a command, runs `quick-review` on current context.

## Usage Examples

### Quick Review
```bash
# Review current file
/bmad:agents:ui-ux-expert

# Review specific component
/bmad:agents:ui-ux-expert quick-review src/components/Button.tsx
```

### Accessibility Audit
```bash
# Full WCAG audit of a page
/bmad:agents:ui-ux-expert review-accessibility src/pages/Dashboard.tsx

# Check color contrast
/bmad:agents:ui-ux-expert analyze-contrast src/index.css
```

### Improvement Workflow
```bash
# 1. Identify issues
/bmad:agents:ui-ux-expert review-component src/components/LoginForm.tsx

# 2. Fix accessibility problems
/bmad:agents:ui-ux-expert improve-accessibility src/components/LoginForm.tsx

# 3. Verify improvements
/bmad:agents:ui-ux-expert review-accessibility src/components/LoginForm.tsx
```

## Key Principles

1. **User needs are paramount** - Every design decision serves the end user
2. **Accessibility is mandatory** - Inclusive design benefits everyone
3. **Consistency creates trust** - Design patterns should be predictable
4. **Form follows function** - Aesthetics should support usability
5. **Intentional design** - Every element should have a purpose
6. **Simplicity over complexity** - Reduce cognitive load
7. **Test and validate** - Design decisions should be validated with users

## Knowledge Base

### WCAG 2.1 Standards
- Comprehensive quick reference for all success criteria
- Common violation patterns and fixes
- Testing methodologies and tools

### Design Patterns
- Navigation patterns (tabs, menus, breadcrumbs)
- Form patterns (validation, progressive disclosure)
- Loading states and skeleton screens
- Error handling and empty states
- Modal dialogs and focus management
- Responsive patterns and mobile considerations

## Tools Utilized

- **Read**: Analyze component code and styles
- **Write**: Create guidelines and documentation
- **Edit**: Make UI/UX improvements to code
- **Glob**: Find components and style files
- **Grep**: Search for accessibility issues and pattern inconsistencies
- **WebFetch**: Reference official WCAG documentation and standards
- **Task**: Launch comprehensive audits and reviews

## Output Quality

All reviews and analyses include:
- **Severity categorization**: Critical, High, Medium, Low
- **WCAG references**: Specific Success Criterion citations
- **Code examples**: Before/after comparisons
- **Actionable recommendations**: Step-by-step implementation guidance
- **Priority rankings**: Impact vs effort assessment

## Continuous Learning

The agent maintains project context through `memories.md`:
- Design system tokens and conventions
- Project-specific accessibility requirements
- User personas and key workflows
- Design decision rationale and history
- Recurring patterns and known issues

## Version

**v1.0.0** - Initial release

## Maintenance

To update the agent's knowledge base:
1. Edit files in `knowledge/` directory
2. Update `memories.md` with project-specific learnings
3. Modify `instructions.md` for workflow improvements

## Support

For issues or enhancements, refer to BMAD documentation or create an issue in the project repository.
