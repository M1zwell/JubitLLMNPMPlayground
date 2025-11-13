# Harmonization Validation Checklist

Use this checklist to validate the harmonization process and results.

## Pre-Harmonization

- [ ] Design system documentation is up-to-date (run *analyze-reference if needed)
- [ ] AdvancedPlaygroundDemo.tsx is the confirmed design reference
- [ ] All components to harmonize have been identified
- [ ] Priority categorization is complete
- [ ] Batch plan is approved by user

## During Harmonization

### For Each Batch
- [ ] Component analysis complete (all inconsistencies identified)
- [ ] Fixes generated with before/after diffs
- [ ] User reviewed and approved changes
- [ ] Fixes applied without breaking functionality
- [ ] Modified files are valid .tsx syntax
- [ ] Progress tracked and reported

### Code Quality
- [ ] Only CSS classes modified (no logic changes)
- [ ] All dark mode variants follow design system patterns (*/20 opacity for backgrounds)
- [ ] No arbitrary values introduced (p-[13px], etc.)
- [ ] Spacing follows Tailwind scale (2, 3, 4, 6, 8, 12, etc.)
- [ ] Colors match design system palette exactly
- [ ] Typography uses design system font sizes and weights
- [ ] Component patterns align with AdvancedPlaygroundDemo.tsx

## Post-Harmonization

### Verification
- [ ] All modified files compile without errors
- [ ] No imports or exports were modified
- [ ] No component logic was changed
- [ ] All functionality preserved (no regressions)
- [ ] Dark mode support added where missing
- [ ] Consistency score improved significantly

### Metrics
- [ ] Overall consistency score: ___ → ___ (+___%)
- [ ] Dark mode coverage: ___% → ___% (+___%)
- [ ] Total issues resolved: ___
- [ ] Total components harmonized: ___
- [ ] Consistency improvement target met (90%+ recommended)

### Documentation
- [ ] Harmonization report generated
- [ ] Report includes all changes and metrics
- [ ] Report saved to output folder
- [ ] Modified files list is complete and accurate

### Testing (Recommended)
- [ ] Visual QA: Main pages display correctly
- [ ] Visual QA: Dark mode works on all harmonized components
- [ ] Functional testing: No broken features
- [ ] Automated tests pass (if available)
- [ ] No console errors introduced

### Git Integration
- [ ] Changes staged in git
- [ ] Commit message is descriptive and includes metrics
- [ ] Commit includes co-author attribution
- [ ] Changes pushed to remote (if approved)

## Final Validation

### Design System Compliance
- [ ] Primary color is blue (not indigo) everywhere
- [ ] Semantic colors match design system (purple for AI, red for security, etc.)
- [ ] All visible elements have dark mode support
- [ ] Spacing follows Tailwind scale consistently
- [ ] Typography matches design system scale
- [ ] Component patterns match AdvancedPlaygroundDemo.tsx

### Completeness
- [ ] All planned components were processed
- [ ] Skipped components are documented with reasons
- [ ] No components were missed accidentally
- [ ] Remaining work is clearly identified

### Success Criteria
- [ ] Consistency score ≥ 90%
- [ ] Dark mode coverage ≥ 95%
- [ ] Zero functionality regressions
- [ ] User is satisfied with results
- [ ] Design system is now the source of truth for all components

## Issues Found

_Use this section to track any issues discovered during validation:_

**Issue 1**: [Description]
- **Severity**: Critical/High/Medium/Low
- **Component**: [file path]
- **Resolution**: [action taken]

**Issue 2**: [Description]
- **Severity**: Critical/High/Medium/Low
- **Component**: [file path]
- **Resolution**: [action taken]

## Notes

_Additional observations, learnings, or recommendations:_

---

**Validation Completed By**: ___________
**Date**: ___________
**Approval**: ☐ Approved ☐ Needs Revision
