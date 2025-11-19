# SOLID Principles Reference

Detailed guide to SOLID principles with examples and violation patterns.

## S - Single Responsibility Principle (SRP)

**Principle:** A class should have one, and only one, reason to change.

**Definition:** Each module or class should have responsibility over a single part of functionality, and that responsibility should be entirely encapsulated by the class.

### Good Example
```typescript
// Each class has single, well-defined responsibility
class UserRepository {
  async save(user: User): Promise<void> {
    await db.insert('users', user);
  }

  async findById(id: string): Promise<User> {
    return db.query('SELECT * FROM users WHERE id = ?', [id]);
  }
}

class EmailService {
  async send(to: string, subject: string, body: string): Promise<void> {
    await emailProvider.send({ to, subject, body });
  }
}

class UserService {
  constructor(
    private userRepo: UserRepository,
    private emailService: EmailService
  ) {}

  async registerUser(userData: UserData): Promise<User> {
    const user = new User(userData);
    await this.userRepo.save(user);
    await this.emailService.send(user.email, 'Welcome!', 'Welcome to our app');
    return user;
  }
}
```

### Violation Example
```typescript
// BAD: Class has multiple responsibilities
class UserManager {
  // Database access
  async saveToDatabase(user: User): Promise<void> {
    await db.insert('users', user);
  }

  // Email sending
  async sendWelcomeEmail(email: string): Promise<void> {
    await emailProvider.send(email, 'Welcome!');
  }

  // Logging
  log(message: string): void {
    fs.appendFileSync('log.txt', message);
  }

  // Business logic
  async registerUser(userData: UserData): Promise<User> {
    const user = new User(userData);
    await this.saveToDatabase(user);
    await this.sendWelcomeEmail(user.email);
    this.log(`User ${user.id} registered`);
    return user;
  }
}
```

**Why SRP Matters:**
- Easier to understand and maintain
- Changes to one responsibility don't affect others
- Easier to test in isolation
- Better reusability

---

## O - Open/Closed Principle (OCP)

**Principle:** Software entities should be open for extension, but closed for modification.

**Definition:** You should be able to add new functionality without changing existing code.

### Good Example
```typescript
// Strategy pattern implements OCP
interface PaymentMethod {
  process(amount: number): Promise<void>;
}

class CreditCardPayment implements PaymentMethod {
  async process(amount: number): Promise<void> {
    // Credit card processing logic
  }
}

class PayPalPayment implements PaymentMethod {
  async process(amount: number): Promise<void> {
    // PayPal processing logic
  }
}

class CryptoPayment implements PaymentMethod {
  async process(amount: number): Promise<void> {
    // Cryptocurrency processing logic
  }
}

class PaymentProcessor {
  constructor(private method: PaymentMethod) {}

  async pay(amount: number): Promise<void> {
    await this.method.process(amount);
  }
}

// Adding new payment method doesn't require modifying existing code
// Just create new class implementing PaymentMethod
```

### Violation Example
```typescript
// BAD: Must modify function to add new payment types
class PaymentProcessor {
  async process(type: string, amount: number): Promise<void> {
    if (type === 'credit_card') {
      // Credit card logic
    } else if (type === 'paypal') {
      // PayPal logic
    } else if (type === 'crypto') {  // Modification required
      // Crypto logic
    }
    // Every new payment type requires modifying this function
  }
}
```

**How to Achieve OCP:**
- Use interfaces and abstract classes
- Apply strategy pattern
- Use dependency injection
- Plugin architectures

---

## L - Liskov Substitution Principle (LSP)

**Principle:** Derived classes must be substitutable for their base classes.

**Definition:** If S is a subtype of T, then objects of type T may be replaced with objects of type S without breaking the program.

### Good Example
```typescript
interface Bird {
  eat(): void;
}

interface FlyingBird extends Bird {
  fly(): void;
}

class Sparrow implements FlyingBird {
  eat(): void { console.log('Eating seeds'); }
  fly(): void { console.log('Flying'); }
}

class Penguin implements Bird {
  eat(): void { console.log('Eating fish'); }
  // Doesn't implement fly() - Penguin is not a FlyingBird
}

function feedBird(bird: Bird): void {
  bird.eat();  // Works for all Birds
}

function letBirdFly(bird: FlyingBird): void {
  bird.fly();  // Only accepts FlyingBird
}
```

### Violation Example
```typescript
// BAD: Derived class violates base class contract
class Bird {
  fly(): void {
    console.log('Flying');
  }
}

class Penguin extends Bird {
  fly(): void {
    throw new Error('Penguins cannot fly!');  // Violation!
  }
}

function makeBirdFly(bird: Bird): void {
  bird.fly();  // This will throw for Penguin!
}

const penguin = new Penguin();
makeBirdFly(penguin);  // Breaks!
```

**LSP Guidelines:**
- Derived class should not strengthen preconditions
- Derived class should not weaken postconditions
- Invariants must be preserved
- History rule: Derived class shouldn't introduce new behaviors unexpected by clients

---

## I - Interface Segregation Principle (ISP)

**Principle:** Clients should not be forced to depend on interfaces they do not use.

**Definition:** Many specific interfaces are better than one general-purpose interface.

### Good Example
```typescript
// Segregated interfaces
interface Printable {
  print(): void;
}

interface Scannable {
  scan(): void;
}

interface Faxable {
  fax(): void;
}

// All-in-one printer implements all interfaces
class MultiFunctionPrinter implements Printable, Scannable, Faxable {
  print(): void { console.log('Printing'); }
  scan(): void { console.log('Scanning'); }
  fax(): void { console.log('Faxing'); }
}

// Simple printer only implements what it needs
class SimplePrinter implements Printable {
  print(): void { console.log('Printing'); }
}

// Scanner only implements what it needs
class Scanner implements Scannable {
  scan(): void { console.log('Scanning'); }
}
```

### Violation Example
```typescript
// BAD: Fat interface forces unnecessary implementations
interface Machine {
  print(): void;
  scan(): void;
  fax(): void;
}

class SimplePrinter implements Machine {
  print(): void { console.log('Printing'); }
  scan(): void { throw new Error('Not supported'); }  // Forced to implement
  fax(): void { throw new Error('Not supported'); }   // Forced to implement
}
```

**ISP Benefits:**
- Prevents bloated interfaces
- Reduces coupling
- Easier to understand and implement
- Better flexibility and reusability

---

## D - Dependency Inversion Principle (DIP)

**Principle:** High-level modules should not depend on low-level modules. Both should depend on abstractions.

**Definition:**
1. High-level modules should not import anything from low-level modules
2. Abstractions should not depend on details; details should depend on abstractions

### Good Example
```typescript
// Abstraction
interface IDatabase {
  save(data: any): Promise<void>;
  find(id: string): Promise<any>;
}

// Low-level module depends on abstraction
class MySQLDatabase implements IDatabase {
  async save(data: any): Promise<void> {
    // MySQL-specific implementation
  }

  async find(id: string): Promise<any> {
    // MySQL-specific implementation
  }
}

class MongoDatabase implements IDatabase {
  async save(data: any): Promise<void> {
    // MongoDB-specific implementation
  }

  async find(id: string): Promise<any> {
    // MongoDB-specific implementation
  }
}

// High-level module depends on abstraction, not concrete implementation
class UserService {
  constructor(private database: IDatabase) {}  // Depends on interface

  async createUser(userData: any): Promise<void> {
    await this.database.save(userData);
  }

  async getUser(id: string): Promise<any> {
    return this.database.find(id);
  }
}

// Dependency injection - can swap database implementations
const userService = new UserService(new MySQLDatabase());
// or
const userService2 = new UserService(new MongoDatabase());
```

### Violation Example
```typescript
// BAD: High-level module directly depends on low-level module
class MySQLDatabase {
  save(data: any): void {
    // MySQL-specific code
  }
}

class UserService {
  private database: MySQLDatabase;  // Direct dependency on concrete class

  constructor() {
    this.database = new MySQLDatabase();  // Tight coupling
  }

  createUser(userData: any): void {
    this.database.save(userData);
  }
}

// Cannot easily swap to different database
// UserService is tightly coupled to MySQL
```

**DIP Benefits:**
- Loose coupling
- Easy to test (can inject mocks)
- Easy to swap implementations
- Protects from changes in low-level details

---

## Applying SOLID Together

### Example: User Registration System

```typescript
// Abstractions (DIP)
interface IUserRepository {
  save(user: User): Promise<void>;
  findByEmail(email: string): Promise<User | null>;
}

interface IEmailService {
  send(to: string, subject: string, body: string): Promise<void>;
}

interface IPasswordHasher {
  hash(password: string): Promise<string>;
}

// Low-level implementations
class UserRepository implements IUserRepository {
  // SRP: Only handles data persistence
  async save(user: User): Promise<void> { /* ... */ }
  async findByEmail(email: string): Promise<User | null> { /* ... */ }
}

class EmailService implements IEmailService {
  // SRP: Only handles email sending
  async send(to: string, subject: string, body: string): Promise<void> { /* ... */ }
}

class BcryptHasher implements IPasswordHasher {
  // SRP: Only handles password hashing
  async hash(password: string): Promise<string> { /* ... */ }
}

// High-level business logic
class UserRegistrationService {
  // DIP: Depends on abstractions, not concretions
  constructor(
    private userRepo: IUserRepository,
    private emailService: IEmailService,
    private hasher: IPasswordHasher
  ) {}

  // SRP: Single responsibility - user registration
  async register(email: string, password: string): Promise<User> {
    // Check if user exists
    const existing = await this.userRepo.findByEmail(email);
    if (existing) {
      throw new Error('User already exists');
    }

    // Create user
    const hashedPassword = await this.hasher.hash(password);
    const user = new User(email, hashedPassword);

    // Save and notify
    await this.userRepo.save(user);
    await this.emailService.send(email, 'Welcome!', 'Welcome to our app');

    return user;
  }
}

// Easy to extend with new notification methods (OCP)
interface INotificationService {
  notify(user: User, message: string): Promise<void>;
}

class EmailNotification implements INotificationService {
  async notify(user: User, message: string): Promise<void> { /* ... */ }
}

class SMSNotification implements INotificationService {
  async notify(user: User, message: string): Promise<void> { /* ... */ }
}

// ISP: Separate interfaces for different concerns
interface IUserReader {
  findByEmail(email: string): Promise<User | null>;
}

interface IUserWriter {
  save(user: User): Promise<void>;
}

// Repository can implement both
class UserRepository implements IUserReader, IUserWriter {
  async findByEmail(email: string): Promise<User | null> { /* ... */ }
  async save(user: User): Promise<void> { /* ... */ }
}

// But read-only service only depends on IUserReader (ISP)
class UserQueryService {
  constructor(private userReader: IUserReader) {}
}
```

## Common Violations and Fixes

### God Class (SRP Violation)
**Problem:** One class doing everything
**Fix:** Extract responsibilities into separate classes

### Switch Statements on Type (OCP Violation)
**Problem:** Adding new types requires modifying switch
**Fix:** Use polymorphism with strategy pattern

### Rectangle-Square Problem (LSP Violation)
**Problem:** Square violates Rectangle's behavior expectations
**Fix:** Don't use inheritance where substitution doesn't work

### Monolithic Interface (ISP Violation)
**Problem:** Interface has too many methods
**Fix:** Break into smaller, focused interfaces

### Direct Instantiation (DIP Violation)
**Problem:** Creating dependencies with `new` keyword
**Fix:** Use dependency injection
