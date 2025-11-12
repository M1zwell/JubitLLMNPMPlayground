# Morgan's Knowledge Base

This directory contains the authoritative design system documentation for the JubitLLMNPMPlayground web application.

## Contents

### `design-system.md` ⭐
**The Golden Reference** - Complete design token documentation extracted from AdvancedPlaygroundDemo.tsx

Includes:
- Color palette (light/dark mode)
- Typography scale
- Spacing system
- Component patterns
- Dark mode strategy
- Accessibility guidelines

**Status**: Active | **Last Updated**: 2025-11-12

### `patterns.md`
Common component patterns and reusable code snippets for rapid implementation.

## Usage

When performing design harmonization:

1. **Always read `design-system.md` first** to load current standards
2. Compare target files against documented tokens
3. Apply only patterns documented in this knowledge base
4. Update documentation when AdvancedPlaygroundDemo.tsx changes

## Updating the Knowledge Base

To refresh the design system documentation:

1. Analyze AdvancedPlaygroundDemo.tsx
2. Extract current color palette, typography, spacing
3. Update design-system.md with new tokens
4. Document any new component patterns

**Note**: This knowledge base is append-only for patterns. The core design-system.md should be regenerated from the reference source to stay accurate.

---

_Maintained by Morgan, Design System Guardian_
_Reference Source: src/components/AdvancedPlaygroundDemo.tsx_
