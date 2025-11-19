# Architecture Expert Agent - Instructions

Detailed workflows for executing each command with architectural analysis methodologies and best practices.

## General Workflow Pattern

For all analysis and review commands:

1. **Load Context** - Read memories.md to understand project architecture and decisions
2. **Map Structure** - Use Glob to understand file organization and module boundaries
3. **Analyze Dependencies** - Use Grep to trace imports, exports, and module relationships
4. **Apply Framework** - Use command-specific evaluation criteria
5. **Document Findings** - Create structured report with severity and impact levels
6. **Provide Recommendations** - Actionable improvements with refactoring sequences
7. **Update Memory** - Store architectural decisions and patterns

## Analyze Commands

### analyze-structure

**Purpose:** Understand overall codebase organization and architectural approach

**Steps:**
1. Map directory structure (frontend, backend, shared, config)
2. Identify architectural layers (presentation, business logic, data access)
3. Catalog major modules and their purposes
4. Check for standard structure (components, services, models, utilities)
5. Identify entry points and initialization flow
6. Map build and deployment configuration
7. Assess folder naming conventions and organization logic

**Output:**
- Architecture diagram (text-based or ASCII)
- Module inventory with responsibilities
- Layer identification and boundaries
- Entry points and initialization sequence
- Recommendations for structural improvements

### analyze-dependencies

**Purpose:** Map dependency graph and identify coupling issues

**Methodology:**
1. Extract all import/export statements across codebase
2. Build dependency graph (module → dependencies)
3. Identify circular dependencies (A→B→C→A)
4. Calculate coupling metrics (afferent/efferent coupling)
5. Find modules with high fan-in or fan-out
6. Detect dependency on concrete implementations vs abstractions
7. Check for proper dependency injection usage

**Detection Patterns:**
```typescript
// Circular dependency detection
// If file A imports B, and B imports A (directly or transitively)

// Tight coupling indicators
import { SpecificClass } from './concrete-implementation'  // Bad
import type { Interface } from './abstractions'  // Good

// God object (too many dependencies)
// File with > 10 imports may indicate too many responsibilities
```

**Output:**
- Dependency graph visualization
- List of circular dependencies with breaking suggestions
- Highly coupled modules flagged
- Recommendations for decoupling strategies

### analyze-patterns

**Purpose:** Identify design patterns and architectural patterns in use

**Pattern Detection:**
1. **Singleton** - Static instances, getInstance() methods
2. **Factory** - create() or build() methods returning interfaces
3. **Observer** - addEventListener, subscribe, emit patterns
4. **Strategy** - Interfaces with multiple implementations
5. **Repository** - Data access abstraction with CRUD methods
6. **Dependency Injection** - Constructor injection, DI containers
7. **MVC/MVVM** - Separation of models, views, controllers/viewmodels
8. **Facade** - Simplified interface to complex subsystem

**Output:**
- Catalog of patterns found with locations
- Pattern usage assessment (appropriate vs anti-pattern)
- Missing patterns that would benefit codebase
- Pattern implementation quality review

### analyze-data-flow

**Purpose:** Trace how data moves through the application

**Workflow:**
1. Identify data sources (API, database, local storage, user input)
2. Map data transformation pipeline
3. Trace state management flow
4. Check for unidirectional vs bidirectional data flow
5. Identify data validation points
6. Map error propagation through layers
7. Verify data immutability where expected

**Key Questions:**
- Where is state stored? (local, global, server)
- How does state change? (reducers, setters, mutations)
- Is data flow predictable and traceable?
- Are side effects isolated?

### analyze-api

**Purpose:** Review API design quality

**REST API Review:**
- Resource naming conventions (plural nouns, kebab-case)
- HTTP method usage (GET, POST, PUT, PATCH, DELETE)
- Status code appropriateness
- Pagination, filtering, sorting patterns
- Versioning strategy (/v1/, header-based, query param)
- Error response format consistency
- Authentication/authorization approach

**GraphQL Review:**
- Schema organization and modularity
- Query/Mutation naming conventions
- Resolver implementation patterns
- N+1 query prevention (DataLoader)
- Error handling and field-level errors
- Pagination (cursor vs offset)

**Output:**
- API design scorecard
- Violations of REST/GraphQL best practices
- Security concerns
- Versioning and deprecation recommendations

### analyze-state

**Purpose:** Evaluate state management architecture

**Analysis Points:**
1. **State location** - Local vs global vs server state
2. **State shape** - Normalized vs denormalized
3. **Update mechanism** - Immutable updates, reducers, mutations
4. **State synchronization** - How UI stays in sync with state
5. **Side effects** - Where async operations happen
6. **State persistence** - localStorage, sessionStorage, IndexedDB
7. **State dev tools** - Time-travel debugging, state inspection

**Patterns to Identify:**
- Redux with reducers and actions
- Context API with useReducer
- Zustand with immer
- React Query / SWR for server state
- Component-local state with useState

### analyze-performance

**Purpose:** Identify performance bottlenecks from architecture perspective

**Checks:**
1. Bundle size analysis (main bundle, vendor chunks)
2. Code splitting boundaries (route-level, component-level)
3. Lazy loading implementation
4. Tree-shaking effectiveness
5. Unnecessary re-renders (React.memo usage)
6. Expensive computations (useMemo/useCallback)
7. Image optimization strategy
8. Font loading strategy

**Tools & Metrics:**
- Bundle analyzer results
- Lighthouse performance score
- Time to Interactive (TTI)
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)

## Review Commands

### review-solid

**Purpose:** Evaluate SOLID principles compliance

**Single Responsibility Principle (SRP):**
```typescript
// Violation: Class/module doing too many things
class UserManager {
  createUser() {}
  sendEmail() {}      // Email sending is separate responsibility
  logActivity() {}    // Logging is separate responsibility
}

// Fixed: Each class has single responsibility
class UserService { createUser() {} }
class EmailService { send() {} }
class Logger { log() {} }
```

**Open/Closed Principle (OCP):**
```typescript
// Violation: Must modify code to add new behavior
function calculatePrice(type: string, amount: number) {
  if (type === 'discount') return amount * 0.9;
  if (type === 'premium') return amount * 1.2;
  // Adding new type requires modifying this function
}

// Fixed: Open for extension, closed for modification
interface PriceStrategy {
  calculate(amount: number): number;
}
class DiscountPrice implements PriceStrategy {}
class PremiumPrice implements PriceStrategy {}
```

**Liskov Substitution Principle (LSP):**
Check that derived classes can replace base classes without breaking functionality.

**Interface Segregation Principle (ISP):**
Check for "fat" interfaces that force implementations to implement unused methods.

**Dependency Inversion Principle (DIP):**
Check that high-level modules don't depend on low-level modules directly.

### review-separation

**Purpose:** Evaluate separation of concerns

**Layer Boundaries:**
1. **Presentation Layer** - UI components, views, templates
2. **Business Logic Layer** - Domain logic, validation, calculations
3. **Data Access Layer** - API calls, database queries, caching

**Violations to Flag:**
```typescript
// Bad: Business logic in UI component
function UserProfile() {
  const calculateAge = (birthDate) => {  // Business logic
    return new Date().getFullYear() - birthDate.getFullYear();
  };
  return <div>{calculateAge(user.birthDate)}</div>;
}

// Bad: Direct database access from UI
function Users() {
  const users = await db.query('SELECT * FROM users');  // Data access
  return <List items={users} />;
}

// Good: Proper separation
function UserProfile({ user }: { user: User }) {  // UI only
  return <div>{user.age}</div>;
}

class UserService {
  calculateAge(birthDate: Date): number {  // Business logic
    return new Date().getFullYear() - birthDate.getFullYear();
  }
}

class UserRepository {
  async findAll(): Promise<User[]> {  // Data access
    return db.query('SELECT * FROM users');
  }
}
```

### review-testability

**Purpose:** Assess how architecture facilitates testing

**Testability Factors:**
1. **Dependency Injection** - Can dependencies be mocked?
2. **Pure Functions** - Functions without side effects
3. **Interface Abstractions** - Can swap implementations for testing
4. **Seam Points** - Places where behavior can be intercepted
5. **State Management** - Is state easily controllable in tests?
6. **Side Effect Isolation** - Are I/O operations isolated?

**Red Flags:**
- Hard-coded dependencies (new Database() in business logic)
- Global state that can't be reset between tests
- Tightly coupled modules
- No interfaces, only concrete classes
- Side effects mixed with business logic

### review-scalability

**Purpose:** Evaluate architecture's ability to handle growth

**Scalability Dimensions:**
1. **Performance Scalability** - Can handle more users/requests?
2. **Development Scalability** - Can team grow without conflicts?
3. **Feature Scalability** - Can add features without major refactoring?
4. **Data Scalability** - Can handle growing data volumes?

**Checks:**
- Horizontal scaling support (stateless services)
- Database connection pooling
- Caching layer implementation
- Async processing for long operations
- Rate limiting and throttling
- Modular architecture for team scaling

### review-security

**Purpose:** Identify security architectural issues

**Security Checklist:**
1. **Authentication** - How are users authenticated?
2. **Authorization** - How are permissions enforced?
3. **Input Validation** - Where and how is input validated?
4. **Output Encoding** - XSS prevention
5. **SQL Injection** - Parameterized queries or ORM?
6. **CSRF Protection** - Tokens, SameSite cookies
7. **Secrets Management** - How are API keys, credentials stored?
8. **HTTPS Enforcement** - All sensitive data over TLS?
9. **Dependency Vulnerabilities** - Regular security audits?

### review-configuration

**Purpose:** Evaluate configuration management

**Configuration Patterns:**
- Environment-specific config (dev, staging, production)
- Secrets management (environment variables, secret stores)
- Feature flags for gradual rollouts
- Build-time vs runtime configuration
- Configuration validation on startup
- Sensible defaults with overrides

## Refactor Commands

### refactor-module

**Purpose:** Improve single module's internal structure

**Refactoring Techniques:**
1. Extract function/method
2. Extract class
3. Rename for clarity
4. Remove code duplication
5. Simplify conditional logic
6. Replace magic numbers with named constants
7. Add type safety

**Process:**
1. Write/verify tests exist
2. Identify specific smells
3. Apply refactoring incrementally
4. Run tests after each step
5. Commit frequently

### refactor-extract

**Purpose:** Extract new component/service from existing code

**When to Extract:**
- Function > 50 lines
- Class > 300 lines
- Module doing multiple things (SRP violation)
- Code duplication across modules
- Reusable logic buried in specific context

**Extraction Process:**
1. Identify extraction boundaries
2. Define interface for extracted component
3. Create new module with clear responsibility
4. Move code to new module
5. Replace original code with call to extracted module
6. Update tests

### refactor-decouple

**Purpose:** Reduce coupling between modules

**Decoupling Strategies:**
1. **Dependency Injection** - Pass dependencies instead of creating them
2. **Events/Pub-Sub** - Replace direct calls with event bus
3. **Interface Abstraction** - Depend on interfaces, not implementations
4. **Facade Pattern** - Create simplified interface
5. **Adapter Pattern** - Convert one interface to another

**Example:**
```typescript
// Before: Tight coupling
class OrderService {
  private emailService = new EmailService();  // Hard dependency

  createOrder(order: Order) {
    // ... create order
    this.emailService.send(order.userEmail, 'Order confirmation');
  }
}

// After: Loose coupling with DI
interface IEmailService {
  send(to: string, subject: string): Promise<void>;
}

class OrderService {
  constructor(private emailService: IEmailService) {}  // Injected

  createOrder(order: Order) {
    // ... create order
    this.emailService.send(order.userEmail, 'Order confirmation');
  }
}
```

### refactor-patterns

**Purpose:** Apply design patterns to improve code quality

**Common Pattern Applications:**
- **Strategy** - Replace conditional logic with polymorphism
- **Factory** - Centralize object creation
- **Observer** - Decouple event sources from listeners
- **Repository** - Abstract data access
- **Decorator** - Add behavior without modifying class
- **Command** - Encapsulate operations as objects

### suggest-migration

**Purpose:** Plan migration from current to target architecture

**Migration Planning:**
1. Assess current state (technical debt, pain points)
2. Define target architecture (goals, constraints)
3. Identify migration risks (breaking changes, downtime)
4. Create incremental migration path (strangler fig pattern)
5. Define rollback strategy
6. Estimate effort and timeline
7. Prioritize migration steps by value/risk

**Strangler Fig Pattern:**
Gradually replace old system with new:
1. Add new feature in new architecture
2. Redirect traffic to new implementation
3. Leave old code in place (still works)
4. Repeat until old system is fully replaced
5. Remove old code

## Document Commands

### create-adr

**Purpose:** Generate Architecture Decision Record

**ADR Template:**
```markdown
# ADR-NNN: Title

**Status:** Proposed | Accepted | Deprecated | Superseded

**Date:** YYYY-MM-DD

## Context
What is the problem or opportunity we're addressing?
What constraints or forces are at play?

## Decision
What did we decide to do?

## Rationale
Why did we choose this option?
What alternatives did we consider?

## Consequences
### Positive
- Benefit 1
- Benefit 2

### Negative
- Trade-off 1
- Trade-off 2

### Neutral
- Impact 1

## Implementation Notes
How will this decision be implemented?
What work is required?

## References
- Links to related documents
- Related ADRs
```

### document-architecture

**Purpose:** Create comprehensive architecture documentation

**Documentation Sections:**
1. **System Overview** - What does the system do?
2. **Architecture Style** - Layered, microservices, event-driven?
3. **Component Diagram** - Major modules and relationships
4. **Data Flow** - How data moves through system
5. **Technology Stack** - Languages, frameworks, databases
6. **Deployment Architecture** - Infrastructure and deployment strategy
7. **Quality Attributes** - Performance, security, scalability goals
8. **Design Decisions** - Key ADRs and trade-offs

### create-diagram

**Purpose:** Generate architecture diagrams

**Diagram Types:**
1. **Component Diagram** - High-level system modules
2. **Dependency Graph** - Module dependencies
3. **Sequence Diagram** - Interaction flow for specific scenarios
4. **Data Flow Diagram** - How data moves through system
5. **Deployment Diagram** - Infrastructure and deployment topology

**Formats:**
- ASCII art for inline documentation
- Mermaid diagram syntax for rendering
- PlantUML syntax for UML diagrams

---

## Best Practices

### When Analyzing Architecture

- Start broad (system structure) before diving deep (module internals)
- Consider trade-offs - every architecture choice has costs
- Look for patterns, but don't force-fit patterns unnecessarily
- Balance pragmatism with idealism
- Document assumptions and constraints

### When Recommending Refactoring

- Suggest incremental changes over big rewrites
- Prioritize by business value and technical risk
- Consider team velocity and learning curve
- Provide migration paths, not just end states
- Acknowledge technical debt while being constructive

### When Creating Documentation

- Write for newcomers, not just experts
- Use diagrams to supplement text
- Keep documentation close to code
- Update docs when architecture changes
- Link to authoritative external resources
