# BMAD Custom Agents

Custom expert agents created for the JubitLLMNPMPlayground project.

## Available Agents

### 1. UI/UX Expert Agent
**Location:** `bmad/agents/ui-ux-expert/`
**Invoke:** `/bmad:agents:ui-ux-expert [command]`
**Version:** 1.0.0

UI/UX Design Consultant and Accessibility Specialist providing comprehensive interface reviews and improvements.

**Key Capabilities:**
- WCAG 2.1 accessibility audits (A, AA, AAA compliance)
- Component and page design reviews
- Responsive design analysis
- Color contrast validation
- Form UX optimization
- Design system guidance
- User flow mapping

**20+ Commands organized in 4 menus:**
- **Review**: accessibility, component, page, responsive
- **Analyze**: contrast, flow, consistency, system, forms
- **Improve**: accessibility, contrast, responsive, component, semantics
- **Guide**: create guidelines, document patterns, explain WCAG, design tokens

**Knowledge Base:**
- WCAG 2.1 quick reference with code examples
- Common UI/UX design patterns
- Accessibility testing methodologies

---

### 2. Architecture Expert Agent
**Location:** `bmad/agents/architecture-expert/`
**Invoke:** `/bmad:agents:architecture-expert [command]`
**Version:** 1.0.0

Software Architecture Consultant and System Design Specialist for comprehensive system analysis and architectural improvements.

**Key Capabilities:**
- System structure and dependency analysis
- SOLID principles compliance review
- Design pattern identification and evaluation
- API design review (REST/GraphQL)
- Refactoring guidance with migration paths
- Architecture Decision Records (ADRs)
- Performance and scalability assessment

**20+ Commands organized in 4 menus:**
- **Analyze**: structure, dependencies, patterns, data-flow, API, state, performance
- **Review**: SOLID, separation, testability, scalability, security, configuration
- **Refactor**: module, extract, decouple, patterns, migration
- **Document**: create ADR, document architecture, create diagrams

**Knowledge Base:**
- SOLID principles with detailed examples
- Architectural patterns (Layered, Clean, Microservices, Event-Driven, etc.)
- Design patterns (Creational, Structural, Behavioral)

---

## Quick Start

### Using the Agents

Both agents are **Expert** type agents with sidecar resources:

```bash
# Quick review (uses default action)
/bmad:agents:ui-ux-expert
/bmad:agents:architecture-expert

# Specific command
/bmad:agents:ui-ux-expert review-accessibility src/components/LoginForm.tsx
/bmad:agents:architecture-expert analyze-dependencies src/services/

# With menu navigation
/bmad:agents:ui-ux-expert analyze-contrast src/index.css
/bmad:agents:architecture-expert review-solid src/
```

### Agent Structure

Each agent includes:

```
bmad/agents/{agent-name}/
├── agent.yaml              # Agent configuration (YAML source)
├── memories.md             # Project-specific context and decisions
├── instructions.md         # Detailed command workflows
├── knowledge/              # Domain expertise reference files
│   ├── *.md               # Topic-specific knowledge
│   └── ...
└── README.md              # Agent documentation
```

### Sidecar Resources

**memories.md** - Automatically updated during agent usage:
- Project-specific decisions and context
- Discovered patterns and conventions
- Known issues and technical debt
- Historical changes and rationale

**instructions.md** - Detailed command workflows:
- Step-by-step command execution methodology
- Best practices and checklists
- Code examples and anti-patterns
- Tool usage patterns

**knowledge/** - Static reference materials:
- Standards and specifications
- Pattern libraries
- Best practices guides
- Quick reference sheets

---

## Agent Workflows

### UI/UX Review Workflow

1. **Quick Review** - Fast triage of major issues
   ```bash
   /bmad:agents:ui-ux-expert quick-review src/components/Dashboard.tsx
   ```

2. **Comprehensive Accessibility Audit**
   ```bash
   /bmad:agents:ui-ux-expert review-accessibility src/components/
   ```

3. **Fix Issues**
   ```bash
   /bmad:agents:ui-ux-expert improve-accessibility src/components/Form.tsx
   ```

4. **Verify Improvements**
   ```bash
   /bmad:agents:ui-ux-expert review-accessibility src/components/Form.tsx
   ```

### Architecture Review Workflow

1. **Map System Structure**
   ```bash
   /bmad:agents:architecture-expert analyze-structure
   ```

2. **Check SOLID Compliance**
   ```bash
   /bmad:agents:architecture-expert review-solid src/services/
   ```

3. **Analyze Dependencies**
   ```bash
   /bmad:agents:architecture-expert analyze-dependencies
   ```

4. **Get Refactoring Recommendations**
   ```bash
   /bmad:agents:architecture-expert refactor-decouple src/services/UserService.ts
   ```

5. **Document Decision**
   ```bash
   /bmad:agents:architecture-expert create-adr "Extract EmailService from UserService"
   ```

### Combined Workflow (Full Stack Review)

For comprehensive codebase review, use both agents:

```bash
# 1. Architecture review
/bmad:agents:architecture-expert analyze-structure src/

# 2. SOLID compliance
/bmad:agents:architecture-expert review-solid src/

# 3. UI/UX review
/bmad:agents:ui-ux-expert review-component src/components/

# 4. Accessibility audit
/bmad:agents:ui-ux-expert review-accessibility src/components/

# 5. Get improvement roadmap
/bmad:agents:architecture-expert suggest-migration
/bmad:agents:ui-ux-expert suggest-improvements
```

---

## Development

### Creating New Agents

Use the BMAD create-agent workflow:

```bash
/bmad:bmb:workflows:create-agent
```

Follow the interactive 10-step process to build new expert agents.

### Modifying Existing Agents

1. **Update YAML source**: Edit `agent.yaml`
2. **Update knowledge**: Add/modify files in `knowledge/`
3. **Update instructions**: Refine workflows in `instructions.md`
4. **Test changes**: Use the agent and verify behavior
5. **Compile** (if using BMAD build tools): `npx bmad-method install`

---

## Agent Principles

Both agents follow these core principles:

### UI/UX Expert
1. User needs are paramount
2. Accessibility is mandatory
3. Consistency creates trust
4. Form follows function
5. Intentional design
6. Simplicity over complexity
7. Test and validate

### Architecture Expert
1. Simplicity first
2. Separation of concerns
3. Explicit over implicit
4. Future-proof through modularity
5. Optimize for readability
6. Test-driven design
7. Incremental improvement

---

## Benefits

### Why Use These Agents?

**Consistency**: Agents apply the same standards every time
**Knowledge Base**: Built-in expertise from industry best practices
**Learning**: Agents remember project-specific patterns and decisions
**Documentation**: Automatic capture of design decisions
**Efficiency**: Faster reviews with comprehensive checklists
**Quality**: Catch issues early in development

### Integration with Development Workflow

- **Code Reviews**: Run agents on PRs before merging
- **Refactoring**: Get guided refactoring with safety nets
- **Onboarding**: Explain architecture to new team members
- **Documentation**: Generate ADRs and architecture docs
- **Accessibility**: Ensure WCAG compliance throughout development
- **Technical Debt**: Track and prioritize improvements

---

## Version History

### v1.0.0 (2025-01-XX)
- Initial release of UI/UX Expert Agent
- Initial release of Architecture Expert Agent
- Complete knowledge bases for both agents
- Full command sets with 20+ commands each
- Sidecar resources (memories, instructions, knowledge)

---

## Support

For issues, enhancements, or questions:
- Review agent README files in respective directories
- Consult BMAD documentation
- Create issues in project repository

---

## Future Agents (Planned)

Potential future agents for this project:
- **Security Expert Agent** - Security audits and vulnerability analysis
- **Performance Expert Agent** - Performance profiling and optimization
- **Testing Expert Agent** - Test strategy and coverage analysis
- **DevOps Expert Agent** - CI/CD pipeline and deployment optimization
- **Database Expert Agent** - Query optimization and schema design

---

## License

These agents are part of the JubitLLMNPMPlayground project and follow the same license.
