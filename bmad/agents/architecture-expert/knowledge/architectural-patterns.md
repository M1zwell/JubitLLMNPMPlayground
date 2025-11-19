# Architectural Patterns Reference

Common software architecture patterns with use cases and trade-offs.

## Layered (N-Tier) Architecture

**Structure:** Application divided into horizontal layers, each with specific responsibility.

**Common Layers:**
1. **Presentation Layer** - UI, views, controllers
2. **Business Logic Layer** - Domain logic, validation, business rules
3. **Data Access Layer** - Database queries, repositories
4. **Database Layer** - Actual data storage

**Rules:**
- Each layer can only communicate with layer directly below
- Higher layers depend on lower layers
- Lower layers have no knowledge of higher layers

**When to Use:**
- Traditional web applications
- Enterprise applications with clear separation
- Teams organized by technical specialty

**Pros:**
- Clear separation of concerns
- Easy to understand and implement
- Good for traditional CRUD applications
- Familiar to most developers

**Cons:**
- Can become monolithic
- Changes may ripple through all layers
- Potential for tight coupling between layers
- May be overkill for simple applications

---

## Clean Architecture (Hexagonal/Ports & Adapters)

**Structure:** Business logic at center, surrounded by interface adapters and external interfaces.

**Layers (Inside-out):**
1. **Entities** - Core business objects
2. **Use Cases** - Application business rules
3. **Interface Adapters** - Controllers, presenters, gateways
4. **Frameworks & Drivers** - UI, database, web framework

**Key Rules:**
- Dependency rule: Dependencies point inward
- Inner layers don't know about outer layers
- Interfaces define contracts between layers

**When to Use:**
- Complex business logic applications
- Need for testability and maintainability
- Long-term projects with changing requirements
- Projects requiring multiple UIs or data sources

**Pros:**
- Highly testable
- Framework-independent core
- Database-independent core
- UI-independent core
- Easy to change external dependencies

**Cons:**
- More complex than layered architecture
- More files and abstraction layers
- Steeper learning curve
- May be over-engineering for simple apps

---

## Microservices Architecture

**Structure:** Application as suite of small, independently deployable services.

**Characteristics:**
- Each service runs in its own process
- Services communicate via lightweight protocols (HTTP, messaging)
- Services can be deployed independently
- Services can use different technologies
- Organized around business capabilities

**When to Use:**
- Large, complex applications
- Need for independent scaling
- Different teams working on different features
- Need to use different technologies for different services

**Pros:**
- Independent deployment and scaling
- Technology diversity
- Fault isolation
- Team autonomy

**Cons:**
- Distributed system complexity
- Network latency
- Data consistency challenges
- More difficult to test
- Operational overhead

---

## Event-Driven Architecture

**Structure:** Components communicate through events (state changes).

**Components:**
- **Event Producers** - Publish events when state changes
- **Event Consumers** - Subscribe to and react to events
- **Event Bus/Broker** - Routes events from producers to consumers

**Patterns:**
- **Event Notification** - Simple notification of state change
- **Event-Carried State Transfer** - Event contains all data needed
- **Event Sourcing** - Store all changes as sequence of events

**When to Use:**
- Loose coupling required
- Real-time processing
- Complex event flows
- Need for system scalability

**Pros:**
- Loose coupling between components
- Easy to add new consumers
- Good for real-time systems
- Natural fit for async operations

**Cons:**
- Harder to understand flow
- Debugging can be challenging
- Eventual consistency
- Potential for event storms

---

## MVC (Model-View-Controller)

**Structure:** Separates application into three interconnected components.

**Components:**
- **Model** - Data and business logic
- **View** - UI representation of data
- **Controller** - Handles user input, updates model

**Flow:**
1. User interacts with View
2. Controller receives input, updates Model
3. Model notifies View of changes
4. View queries Model and updates display

**When to Use:**
- Web applications
- Desktop applications
- Clear separation of UI and logic needed

**Pros:**
- Clear separation of concerns
- Multiple views for same model
- Easy to test business logic

**Cons:**
- Can lead to bloated controllers
- View and Model can become tightly coupled
- Not ideal for complex UIs

---

## MVVM (Model-View-ViewModel)

**Structure:** Evolution of MVC for modern UI frameworks.

**Components:**
- **Model** - Data and business logic
- **View** - UI definition (declarative)
- **ViewModel** - Abstraction of View, handles presentation logic

**Data Binding:**
- Two-way binding between View and ViewModel
- View automatically updates when ViewModel changes
- ViewModel updates when View changes

**When to Use:**
- Modern frontend frameworks (React, Vue, Angular)
- Rich, interactive UIs
- Data-driven applications

**Pros:**
- Clear separation of UI and logic
- Testable ViewModels without UI
- Declarative UI definition
- Automatic UI updates via binding

**Cons:**
- Complexity of data binding
- Can be overkill for simple UIs
- Debugging binding issues

---

## Repository Pattern

**Purpose:** Abstraction layer between business logic and data access.

**Structure:**
```typescript
interface IUserRepository {
  findById(id: string): Promise<User>;
  findAll(): Promise<User[]>;
  save(user: User): Promise<void>;
  delete(id: string): Promise<void>;
}

class UserRepository implements IUserRepository {
  async findById(id: string): Promise<User> {
    // Database-specific code hidden here
  }
  // ... other methods
}

class UserService {
  constructor(private userRepo: IUserRepository) {}

  async getUser(id: string): Promise<User> {
    return this.userRepo.findById(id);
  }
}
```

**When to Use:**
- Separate data access from business logic
- Need to swap data sources easily
- Want to test business logic without database

**Pros:**
- Testability (mock repository)
- Centralized data access logic
- Easy to switch data sources

**Cons:**
- Additional abstraction layer
- Can be overkill for simple CRUD

---

## CQRS (Command Query Responsibility Segregation)

**Principle:** Separate read and write operations into different models.

**Structure:**
- **Commands** - Mutate state (create, update, delete)
- **Queries** - Read state (no mutations)
- Separate models for reading and writing

**When to Use:**
- Complex domains
- Different scaling needs for reads vs writes
- Event sourcing
- CQRS with separate databases for optimization

**Pros:**
- Optimized read and write models
- Scalability (scale reads and writes independently)
- Simpler queries
- Better security (separate permissions)

**Cons:**
- Complexity
- Eventual consistency between read and write models
- More code to maintain

---

## Monolithic Architecture

**Structure:** Single unified codebase and deployment unit.

**Characteristics:**
- All features in one application
- Shared database
- Single deployment
- Tight coupling between components

**Types:**
- **Modular Monolith** - Well-organized modules with clear boundaries
- **Big Ball of Mud** - Poorly organized monolith (anti-pattern)

**When to Use:**
- Small to medium applications
- Startups (MVP, quick iteration)
- Simple deployment requirements
- Limited team size

**Pros:**
- Simple to develop initially
- Easy to deploy
- Easy to test
- No network latency between components

**Cons:**
- Difficult to scale
- Limited technology choices
- Long build/deploy times
- Team conflicts in large codebases

---

## Service-Oriented Architecture (SOA)

**Structure:** Application as collection of services communicating via enterprise service bus.

**Characteristics:**
- Services expose functionality via standard protocols
- Enterprise Service Bus (ESB) for communication
- Service registry and discovery
- Typically SOAP-based

**When to Use:**
- Enterprise integration
- Legacy system integration
- Need for service reusability

**Pros:**
- Service reusability
- Interoperability
- Standards-based

**Cons:**
- Complex ESB
- Can become monolithic
- SOAP overhead
- Slower than modern alternatives

---

## Serverless Architecture

**Structure:** Application built using cloud functions and managed services.

**Characteristics:**
- No server management
- Functions triggered by events
- Pay-per-execution
- Auto-scaling

**When to Use:**
- Variable workload
- Event-driven processing
- Microservices on cloud
- Low-maintenance applications

**Pros:**
- No server management
- Auto-scaling
- Pay only for execution
- Fast deployment

**Cons:**
- Vendor lock-in
- Cold start latency
- Limited execution time
- Debugging complexity

---

## Pipe and Filter Architecture

**Structure:** Processing divided into sequence of processing components (filters) connected by pipes.

**Characteristics:**
- Data flows through pipeline
- Each filter transforms data
- Filters are independent and reusable
- Can be combined in different ways

**When to Use:**
- Data processing workflows
- ETL (Extract, Transform, Load)
- Compilers
- Unix philosophy applications

**Pros:**
- Reusable filters
- Easy to add new processing steps
- Parallel processing possible
- Simple to understand

**Cons:**
- Overhead of data passing
- Not suitable for interactive systems
- Complex error handling

---

## Client-Server Architecture

**Structure:** Client requests services from server.

**Components:**
- **Client** - Requests resources/services
- **Server** - Provides resources/services
- **Network** - Communication channel

**Variations:**
- Two-tier (client directly to database)
- Three-tier (client, application server, database)
- N-tier (multiple application layers)

**When to Use:**
- Web applications
- Mobile apps
- Distributed applications

**Pros:**
- Centralized control
- Scalability (add more servers)
- Security (centralized)

**Cons:**
- Network dependency
- Server can be bottleneck
- Single point of failure

---

## Peer-to-Peer Architecture

**Structure:** Each node acts as both client and server.

**Characteristics:**
- Decentralized
- No central server
- Nodes communicate directly
- Self-organizing

**When to Use:**
- File sharing
- Blockchain applications
- Distributed computing

**Pros:**
- No single point of failure
- Scalability
- Resource sharing

**Cons:**
- Complex to implement
- Security challenges
- Difficult to manage

---

## Choosing an Architecture

### Decision Factors

1. **Application Complexity**
   - Simple: Layered or Monolithic
   - Complex: Clean Architecture, Microservices

2. **Team Size**
   - Small: Monolithic, Layered
   - Large: Microservices, Modular Monolith

3. **Scalability Needs**
   - Low: Monolithic
   - High: Microservices, Serverless

4. **Deployment Frequency**
   - Infrequent: Monolithic
   - Frequent: Microservices

5. **Technology Diversity**
   - Single stack: Monolithic
   - Multiple stacks: Microservices

6. **Time to Market**
   - Fast MVP: Monolithic
   - Long-term: Clean Architecture

### Common Combinations

- **Modular Monolith + Clean Architecture** - Good starting point for most applications
- **Microservices + Event-Driven** - Scalable, loosely coupled systems
- **Clean Architecture + CQRS** - Complex business logic with optimized reads
- **Serverless + Event-Driven** - Cloud-native, auto-scaling applications

### Migration Paths

**Monolith → Microservices:**
1. Identify bounded contexts
2. Extract service by service (strangler fig pattern)
3. Implement API gateway
4. Migrate data gradually

**Layered → Clean Architecture:**
1. Identify core business logic
2. Extract entities and use cases
3. Create interface adapters
4. Invert dependencies
5. Move framework code to outer layer
