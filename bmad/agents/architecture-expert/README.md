# Architecture Expert Agent

Software Architecture Consultant and System Design Specialist for comprehensive system analysis, design reviews, and architectural improvements.

## Overview

The Architecture Expert Agent provides professional software architecture guidance, identifies design patterns, evaluates SOLID principles compliance, and recommends refactoring strategies for scalable, maintainable systems.

## Features

- **Architectural Analysis**: System structure mapping, dependency graphs, pattern identification
- **SOLID Principles Review**: Comprehensive evaluation of Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, and Dependency Inversion principles
- **Design Pattern Detection**: Identify and evaluate usage of architectural and design patterns
- **Dependency Analysis**: Circular dependency detection, coupling metrics, module relationships
- **API Design Review**: RESTful, GraphQL, RPC endpoint design evaluation
- **Refactoring Guidance**: Strategic refactoring recommendations with migration paths
- **Architecture Documentation**: Generate ADRs, diagrams, and comprehensive documentation

## Agent Type

**Expert Agent** with sidecar resources:
- `memories.md` - Project-specific architectural decisions and technical debt tracking
- `instructions.md` - Detailed analysis and refactoring methodologies
- `knowledge/` - Domain expertise (SOLID principles, architectural patterns, design patterns)

## Commands

### Analyze Menu
- `/bmad:agents:architecture-expert analyze-structure` - Map codebase architecture and module organization
- `/bmad:agents:architecture-expert analyze-dependencies` - Dependency graph and coupling analysis
- `/bmad:agents:architecture-expert analyze-patterns` - Identify architectural and design patterns
- `/bmad:agents:architecture-expert analyze-data-flow` - Trace data flow through application layers
- `/bmad:agents:architecture-expert analyze-api` - API design review (REST/GraphQL)
- `/bmad:agents:architecture-expert analyze-state` - State management architecture evaluation
- `/bmad:agents:architecture-expert analyze-performance` - Bundle size and optimization opportunities

### Review Menu
- `/bmad:agents:architecture-expert review-solid` - SOLID principles compliance check
- `/bmad:agents:architecture-expert review-separation` - Separation of concerns evaluation
- `/bmad:agents:architecture-expert review-testability` - Architecture testability assessment
- `/bmad:agents:architecture-expert review-scalability` - Scalability and growth readiness review
- `/bmad:agents:architecture-expert review-security` - Security architecture patterns analysis
- `/bmad:agents:architecture-expert review-configuration` - Configuration management review

### Refactor Menu
- `/bmad:agents:architecture-expert refactor-module` - Refactor module to improve structure
- `/bmad:agents:architecture-expert refactor-extract` - Extract components/services for better separation
- `/bmad:agents:architecture-expert refactor-decouple` - Reduce coupling with dependency injection
- `/bmad:agents:architecture-expert refactor-patterns` - Apply design patterns to improve quality
- `/bmad:agents:architecture-expert suggest-migration` - Propose migration path to target architecture

### Document Menu
- `/bmad:agents:architecture-expert create-adr` - Generate Architecture Decision Record
- `/bmad:agents:architecture-expert document-architecture` - Create comprehensive architecture docs
- `/bmad:agents:architecture-expert document-patterns` - Document design patterns and conventions
- `/bmad:agents:architecture-expert create-diagram` - Generate architecture diagram (component/dependency/flow)
- `/bmad:agents:architecture-expert explain-architecture` - Explain current architecture to new developers

### Default Action
When invoked without a command, runs `analyze-structure` to provide architectural overview and quick recommendations.

## Usage Examples

### Quick Architecture Overview
```bash
# Analyze current directory structure
/bmad:agents:architecture-expert

# Analyze specific module
/bmad:agents:architecture-expert analyze-structure src/services/
```

### Dependency Analysis
```bash
# Find circular dependencies
/bmad:agents:architecture-expert analyze-dependencies

# Check coupling for specific module
/bmad:agents:architecture-expert analyze-dependencies src/components/
```

### SOLID Principles Review
```bash
# Review entire codebase for SOLID violations
/bmad:agents:architecture-expert review-solid

# Review specific service
/bmad:agents:architecture-expert review-solid src/services/UserService.ts
```

### Refactoring Workflow
```bash
# 1. Identify architecture issues
/bmad:agents:architecture-expert analyze-structure

# 2. Review SOLID compliance
/bmad:agents:architecture-expert review-solid

# 3. Get refactoring recommendations
/bmad:agents:architecture-expert refactor-module src/services/UserManager.ts

# 4. Document the refactoring decision
/bmad:agents:architecture-expert create-adr "Extract email service from UserManager"
```

### Migration Planning
```bash
# Plan migration from monolith to microservices
/bmad:agents:architecture-expert suggest-migration

# Analyze API for microservice boundaries
/bmad:agents:architecture-expert analyze-api
```

## Key Principles

1. **Simplicity first** - Avoid over-engineering, choose the simplest solution that works
2. **Separation of concerns** - Each module has a single, well-defined responsibility
3. **Explicit over implicit** - Clear, explicit code is easier to maintain
4. **Future-proof through modularity** - Loosely coupled components adapt to change
5. **Optimize for readability** - Code is read far more than it's written
6. **Test-driven design** - Architecture should facilitate testing
7. **Incremental improvement** - Perfect is the enemy of good; iterate

## Knowledge Base

### SOLID Principles
- Complete reference for all five principles
- Code examples demonstrating violations and fixes
- Common patterns for applying each principle
- Real-world examples combining multiple principles

### Architectural Patterns
- Layered (N-Tier) Architecture
- Clean Architecture (Hexagonal/Ports & Adapters)
- Microservices vs Monolithic
- Event-Driven Architecture
- MVC and MVVM patterns
- Repository Pattern
- CQRS (Command Query Responsibility Segregation)
- And many more with trade-offs and use cases

### Design Patterns
- **Creational**: Singleton, Factory, Builder, Prototype
- **Structural**: Adapter, Bridge, Decorator, Facade, Proxy
- **Behavioral**: Observer, Strategy, Command, State, Template Method

## Tools Utilized

- **Read**: Analyze code structure and implementation
- **Write**: Create documentation, ADRs, architecture diagrams
- **Edit**: Implement architectural improvements and refactoring
- **Glob**: Map file structure and module organization
- **Grep**: Search for dependencies, imports, coupling issues, patterns
- **Task**: Launch comprehensive architecture audits
- **WebFetch**: Reference design patterns and architectural best practices

## Output Quality

All analyses and reviews include:
- **Severity classification**: Critical, High, Medium, Low
- **Impact assessment**: How issues affect maintainability, scalability, testability
- **Code examples**: Before/after comparisons
- **Actionable recommendations**: Step-by-step refactoring guidance
- **Trade-off analysis**: Benefits and costs of recommendations
- **Migration paths**: Incremental improvement strategies

## Continuous Learning

The agent maintains project context through `memories.md`:
- Architectural decisions and their rationale (ADRs)
- Design patterns identified in the codebase
- Dependency maps and coupling hotspots
- Technical debt inventory and prioritization
- Refactoring history and lessons learned
- Performance considerations and bottlenecks

## Common Use Cases

### New Project Setup
- Review proposed architecture
- Suggest appropriate patterns for requirements
- Set up architectural boundaries
- Define module structure

### Code Review
- Check SOLID principles compliance
- Identify architectural anti-patterns
- Suggest design pattern applications
- Review testability

### Refactoring
- Identify refactoring opportunities
- Plan refactoring sequence
- Minimize risk during changes
- Document decisions

### Technical Debt Management
- Identify architectural debt
- Prioritize improvements
- Plan incremental fixes
- Track progress

### Team Onboarding
- Explain current architecture
- Document design decisions
- Create architecture diagrams
- Capture architectural knowledge

## Version

**v1.0.0** - Initial release

## Maintenance

To update the agent's knowledge base:
1. Edit files in `knowledge/` directory for updated patterns and principles
2. Update `memories.md` with project-specific architectural decisions
3. Modify `instructions.md` for improved analysis methodologies

## Support

For issues or enhancements, refer to BMAD documentation or create an issue in the project repository.

## Related Agents

Works well in combination with:
- **UI/UX Expert Agent** (`/bmad:agents:ui-ux-expert`) - For frontend architecture and component design
- Other domain-specific agents for comprehensive system review

## Best Practices

### When to Use This Agent

- Planning new features or systems
- Reviewing pull requests for architectural impact
- Refactoring existing code
- Debugging complex coupling issues
- Documenting system architecture
- Onboarding new team members

### Getting the Most Value

1. **Start broad, then narrow**: Run `analyze-structure` before diving into specific modules
2. **Regular reviews**: Periodically check SOLID compliance to catch issues early
3. **Document decisions**: Use `create-adr` to capture important architectural choices
4. **Incremental improvements**: Use refactoring commands for step-by-step guidance
5. **Maintain memory**: Keep `memories.md` updated with project-specific patterns and decisions
