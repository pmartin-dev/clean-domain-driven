# Clean Domain-Driven

[![CI](https://github.com/pmartin-dev/clean-domain-driven/actions/workflows/ci.yml/badge.svg)](https://github.com/pmartin-dev/clean-domain-driven/actions/workflows/ci.yml)

A production-ready reference implementation of Domain-Driven Design with Clean Architecture and CQS in TypeScript, using a library lending system as a concrete domain.

**Target audience:** developers who can code but want to understand DDD in practice.

**Note:** This project is opinionated by design. The patterns and conventions shown here are one way to implement DDD, not the only way. Treat them as a starting point to adapt and evolve, not as rigid principles set in stone.

> *"The alternative to good design is bad design, not no design at all."*
> - Douglas Martin, cited i

## Table of Contents

- [Problem Space](#problem-space)
- [Solution Space](#solution-space)
  - [From User Stories to Code](#from-user-stories-to-code)
  - [Strategic Design](#strategic-design)
  - [Tactical Design - Building Blocks](#tactical-design--building-blocks)
- [Clean Architecture](#clean-architecture)
- [CQS - Living with Clean Architecture](#cqrs--living-with-clean-architecture)
- [NestJS - Infrastructure Framework](#nestjs--infrastructure-framework)
- [Testing](#testing)
- [Conventions](#conventions)
- [Project Structure](#project-structure)
- [Non-Goals](#non-goals)
- [References](#references)

---

## Problem Space

Before writing any code, DDD starts by understanding the **business domain**.

Our domain is a **municipal library** that manages its book catalog and loans to members.

| Subdomain | Type | Description |
|---|---|---|
| **Lending** | Core Domain | Book loans, the reason the library exists. Richest business rules. |
| **Catalog** | Supporting | Book catalog, necessary but simpler. Manages available books and metadata. |

### Business Problems

- A member wants to **borrow** a book: is it possible? (book availability, borrowing limit, overdue loans)
- A member **returns** a book, update the loan, make the book available again
- The library **adds** a book to the catalog, it becomes available for borrowing

---

## Solution Space

The Solution Space answers the Problem Space: how do we structure and implement the domain? DDD splits this into **Strategic Design** (how to divide the domain) and **Tactical Design** (how to build each piece).

### From User Stories to Code

Each **User Story** maps to exactly one **Use Case**. The US defines the business need, the acceptance criteria express expected behavior (BDD), and the use case orchestrates the domain to fulfill it.

This project implements 5 user stories, 3 commands (writes) and 2 queries (reads):

| User Story | Use Case | Type | Bounded Context |
|---|---|---|---|
| [Add a Book to the Catalog](docs/user-stories/us-add-book-to-catalog.md) | `AddBookToCatalog` | Command | Catalog |
| [Borrow a Book](docs/user-stories/us-borrow-book.md) | `BorrowBook` | Command | Lending |
| [Return a Book](docs/user-stories/us-return-book.md) | `ReturnBook` | Command | Lending |
| [View Available Books](docs/user-stories/us-get-available-books.md) | `GetAvailableBooks` | Query | Catalog |
| [View My Active Loans](docs/user-stories/us-get-member-loans.md) | `GetMemberLoans` | Query | Lending |

Each US file contains the story, BDD acceptance criteria (Given/When/Then), and links to every implementation artifact, from the aggregate down to the functional test.

### Strategic Design

Strategic Design structures the domain into **Bounded Contexts** with their own language and models.

> *"A Bounded Context is a semantic contextual boundary. This means that within the boundary each component of the software model has a specific meaning and does specific things. The components inside a Bounded Context are context specific and semantically motivated."*
> - Vaughn Vernon

#### Bounded Contexts

- **Catalog**: manages the book registry (adding, consulting)
- **Lending**: manages members, loans and returns

The concept of "Book" has a **different meaning** in each context. In Catalog, it's a rich object with ISBN, title, author. In Lending, it's a simple reference (just an identifier). This is precisely why they are separate Bounded Contexts.

#### Ubiquitous Language

The shared vocabulary between domain experts and developers. Each term has a precise, unambiguous meaning within its context.

**Catalog:**

| Term | Definition |
|---|---|
| Book | A publication referenced in the library catalog |
| ISBN | International Standard Book Number, unique identifier for a publication |
| Title | The title of a book |
| Author | The author of a book |

**Lending:**

| Term | Definition |
|---|---|
| Member | A registered library patron, authorized to borrow |
| Loan | An active borrowing, the link between a member and a borrowed book |
| Borrow | The act of borrowing a book |
| Return | The act of returning a borrowed book |
| DueDate | The return deadline for a loan |
| Overdue | A loan past its due date |
| BorrowingLimit | The maximum number of books a member can borrow simultaneously |
| BookReference | A book as seen from Lending, not the full Catalog model, just an identifier |

#### Context Map

Catalog is **upstream** (publishes events), Lending is **downstream** (consumes them). An **Anti-Corruption Layer** in Lending translates Catalog's model into its own language.

> *"Whenever possible, you should try to create an Anticorruption Layer between your downstream model and an upstream integration model, so that you can produce model concepts on your side of the integration that specifically fit your business needs."*
> - Vaughn Vernon

This is why "Book" has a different representation in each context, as Vernon puts it: *"The name of the Bounded Context takes care of that scoping."* In Catalog it's a rich `Book` aggregate, in Lending it's a lightweight `BookReference` [Value Object](#value-objects).

```
┌──────────────┐       domain event        ┌──────────────┐
│              │   catalog::book-registered │              │
│   Catalog    │ ─────────────────────────> │   Lending    │
│  (upstream)  │                            │ (downstream) │
│              │   Customer-Supplier (U/D)  │              │
└──────────────┘                            └──────────────┘
                                                   │
                                              Anti-Corruption
                                                  Layer
                                                   │
                                              Translates Book
                                              → BookReference
```

### Tactical Design - Building Blocks

Tactical Design translates the strategic model into concrete building blocks.

#### Value Objects

Immutable objects defined by their value, not their identity. They validate their own invariants at construction time through a private constructor and a `create()` factory method.

```typescript
const isbn = ISBN.create('9780134685991'),  // valid, object created
const bad  = ISBN.create('invalid'),         // throws ISBNMustBeExactly13Digits
```

Each Value Object provides `equals()` for comparison, no primitive comparisons leaking out.

Some Value Objects carry behavior beyond simple validation. `BorrowingLimit` exposes `allows(currentCount)` and `LoanPeriod` exposes `isOverdue(now)`, so domain logic lives in the Value Objects, not in services.

See: [`isbn.vo.ts`](src/modules/catalog/domain/book/isbn.vo.ts), [`borrowing-limit.vo.ts`](src/modules/lending/domain/member/borrowing-limit.vo.ts), [`loan-period.vo.ts`](src/modules/lending/domain/loan/loan-period.vo.ts)

#### Aggregates

> Vernon's four rules of Aggregate design: *(1)* Protect business invariants inside Aggregate boundaries. *(2)* Design small Aggregates. *(3)* Reference other Aggregates by identity only. *(4)* Update other Aggregates using eventual consistency.

Consistency boundaries. The constructor is private, the only way in is through a domain verb (factory method). State changes go through named behavior methods, not setters.

```typescript
// Catalog: simple aggregate, no mutations
const book = Book.register(id, isbn, title, author),

// Lending: rich aggregate with behavior and internal state
const member = Member.register(id, name, BorrowingLimit.create(3)),
member.borrow(loanId),    // validates limit, adds to internal Set
member.returnBook(loanId), // removes from internal Set
```

`Member` maintains a `Set<LoanId>` internally, it's its own consistency boundary. The borrowing limit rule is checked **inside** the aggregate, not in the use case.

See: [`book.entity.ts`](src/modules/catalog/domain/book/book.entity.ts), [`member.entity.ts`](src/modules/lending/domain/member/member.entity.ts), [`loan.entity.ts`](src/modules/lending/domain/loan/loan.entity.ts)

#### Domain Exceptions

One class per violation, named after the business constraint. Each extends `DomainException`. No generic error messages, the exception type **is** the documentation.

```
exceptions/
  ├── isbn-must-be-exactly-13-digits.exception.ts
  ├── isbn-checksum-is-invalid.exception.ts
  ├── book-title-cannot-be-empty.exception.ts
  └── ...
```

See: [`exceptions/`](src/modules/catalog/domain/book/exceptions/)

#### Business Rules as First-Class Objects (Specification Pattern)

Cross-cutting business constraints are modeled as `Rule` objects , an assertion-based variant of the [Specification Pattern](https://en.wikipedia.org/wiki/Specification_pattern). Each rule encapsulates a single business constraint, is named after it, testable in isolation, and composable via `Rule.checkAll()`.

Unlike the classic Specification pattern (which returns a boolean for querying/filtering), these rules **throw a typed domain exception** when violated, making them guard clauses rather than predicates. This is closer to what Vernon calls "assertion-based validation" in *Implementing Domain-Driven Design*.

```typescript
Rule.checkAll([
  new BookMustBeAvailable(existingLoan !== null),
  new MemberMustNotHaveOverdueLoans(hasOverdue),
]),
```

Each rule implements `isRespected()` and `createError()`. They live in the aggregate they protect: `MemberCannotExceedBorrowingLimit` is checked inside `Member.borrow()`, while `BookMustBeAvailable` is checked in the `BorrowBook` use case (it requires a repository query).

See: [`member-cannot-exceed-borrowing-limit.rule.ts`](src/modules/lending/domain/member/rules/member-cannot-exceed-borrowing-limit.rule.ts), [`book-must-be-available.rule.ts`](src/modules/lending/domain/loan/rules/book-must-be-available.rule.ts)

#### Ports (Repository Interfaces)

Defined in the **domain layer**, the domain dictates what it needs, not the infrastructure. The repository interface is a contract that any adapter (InMemory, SQL, API) can implement.

See: [`books-repository.interface.ts`](src/modules/catalog/domain/book/books-repository.interface.ts)

#### Domain Events

> *"A Domain Event is a record of some business-significant occurrence in a Bounded Context. [...] Your Domain Event type names should be a statement of a past occurrence, that is, a verb in the past tense."*
> - Vaughn Vernon

Immutable events raised by aggregates after state changes. Each aggregate extends `AggregateRoot`, which provides `raise()` to accumulate events and `pullDomainEvents()` to drain them.

```typescript
// Inside Book.register()
book.raise(new BookRegisteredEvent(id.value)),

// In the use case, after persistence
await this.eventDispatcher.dispatch(book.pullDomainEvents()),
```

When a use case involves multiple aggregates, events are collected from all of them before dispatch, the **"collect then dispatch"** pattern. Aggregates never publish events themselves, they accumulate them via `raise()`, and the use case drains them with `pullDomainEvents()` after persistence succeeds. This guarantees that the rest of the system is only notified if the state changes were actually persisted.

```typescript
// BorrowBook use case: two aggregates mutated, events collected then dispatched
const events = [...loan.pullDomainEvents(), ...member.pullDomainEvents()],

await this.loansRepository.save(loan),
await this.membersRepository.save(member),
await this.eventDispatcher.dispatch(events),
```

Events follow the naming convention `module::action` and carry minimal payload (IDs only). Event names are defined as shared constants in [`domain-events.ts`](src/shared/domain/domain-events.ts) to prevent silent drift between publishers and subscribers.

The `DomainEventDispatcher` is a synchronous in-process pub/sub where handlers are registered with `subscribe(eventName, handler)` and called sequentially on `dispatch()`.

See: [`domain-event.ts`](src/shared/domain/domain-event.ts), [`aggregate-root.ts`](src/shared/domain/aggregate-root.ts), [`domain-event-dispatcher.ts`](src/shared/infrastructure/domain-event-dispatcher.ts), [`domain-events.ts`](src/shared/domain/domain-events.ts), [`book-registered.event.ts`](src/modules/catalog/domain/book/events/book-registered.event.ts)

#### Anti-Corruption Layer (ACL)

Bounded Contexts communicate exclusively through domain events, no direct cross-module imports. The ACL in Lending listens to Catalog events and translates them into Lending's own model.

```typescript
// When Catalog publishes catalog::book-registered,
// Lending's handler creates a BookReference from the bookId
dispatcher.subscribe(BOOK_REGISTERED, (event) => handler.handle(event)),
```

This means adding a book to the Catalog automatically creates a `BookReference` in Lending, the two contexts stay in sync without coupling.

See: [`on-book-registered.handler.ts`](src/modules/lending/application/event-handlers/on-book-registered.handler.ts)

---

## Clean Architecture

> *"Source code dependencies must point only inward, toward higher-level policies."*
> - Robert C. Martin

```
Domain (entities, Value Objects, exceptions, ports)  ← depends on NOTHING
    ↑
Application (use cases, commands)             ← depends on domain only
    ↑
Infrastructure (repos, adapters, NestJS)      ← implements domain ports
    ↑
Interface (NestJS controllers)                ← calls application layer
```

**Domain First:** the domain was developed in isolation: pure TypeScript, zero framework imports. NestJS was added **after** the domain was stabilized and tested. This means you can change the framework, database or deployment without touching a single line of domain code.

**Why no Presenter?** Domain-to-response mappings are trivial, so use cases return DTOs directly, a Presenter layer would add indirection without value.

See: [`domain/`](src/modules/catalog/domain/), [`application/`](src/modules/catalog/application/), [`infrastructure/`](src/modules/catalog/infrastructure/)

---

## CQS - Living with Clean Architecture

Clean Architecture and CQS operate at different levels:
- **Clean Architecture** structures **layers**, the use case is the central concept
- **CQS** structures **intent**, separating writes (commands) from reads (queries)

The separation is **structural**, expressed through folder organization and naming conventions, not runtime. There is no command bus or query bus: controllers inject use cases directly via NestJS dependency injection.

```
application/
  ├── commands/                              ← input DTOs for writes
  │   └── add-book-to-catalog/
  │       └── add-book-to-catalog.command.ts
  ├── queries/                               ← input DTOs for reads
  │   └── get-available-books/
  │       └── get-available-books.query.ts
  ├── use-cases/                             ← orchestration
  │   ├── add-book-to-catalog.use-case.ts       (command: goes through domain)
  │   └── get-available-books.use-case.ts       (query: reads directly from repos)
  └── event-handlers/                        ← reacts to cross-BC events
```

- **Command use case:** creates Value Objects, calls the aggregate, persists via repository port
- **Query use case:** reads directly from repository, returns a DTO, never touches the domain

See: [`commands/`](src/modules/catalog/application/commands/), [`queries/`](src/modules/catalog/application/queries/), [`use-cases/`](src/modules/catalog/application/use-cases/)

---

## NestJS - Infrastructure Framework

> *"Your architecture should tell readers about the system, not about the frameworks you used in your system."*
> - Robert C. Martin

NestJS serves as a **pure infrastructure adapter**. The domain and application layers have zero NestJS imports, no `@Injectable()` decorators on use cases or domain classes.

### Dependency Injection via Factory Providers

Use cases are constructed through `useFactory` providers that inject domain port interfaces by token. This keeps the domain framework-agnostic while letting NestJS manage the object graph:

```typescript
{
  provide: BORROW_BOOK,
  useFactory: (membersRepo: MembersRepository, loansRepo: LoansRepository, ...) =>
    new BorrowBook(membersRepo, loansRepo, ...),
  inject: [MEMBERS_REPOSITORY, LOANS_REPOSITORY, ...],
}
```

Controllers inject use cases directly via injection tokens, no intermediary bus or dispatcher:

```typescript
@Controller('catalog/books')
export class CatalogController {
  constructor(
    @Inject(ADD_BOOK_TO_CATALOG) private readonly addBookToCatalog: AddBookToCatalog,
    @Inject(GET_AVAILABLE_BOOKS) private readonly getAvailableBooksUseCase: GetAvailableBooks,
  ) {}
}
```

### Cross-BC Event Wiring

Each NestJS module subscribes its event handlers to the shared `DomainEventDispatcher` during `OnModuleInit`. No cross-module imports, modules only share the dispatcher singleton via the global `SharedModule`.

### REST API

| Method | Endpoint | Action |
|--------|----------|--------|
| POST | `/catalog/books` | Add a book to the catalog |
| GET | `/catalog/books` | List available books |
| POST | `/lending/loans` | Borrow a book |
| POST | `/lending/loans/:loanId/return` | Return a book |
| GET | `/lending/members/:memberId/loans` | List a member's active loans |

### Input Validation

Validation is split into two layers, each with a distinct responsibility:

| Layer | Tool | Responsibility | HTTP Status |
|-------|------|----------------|-------------|
| **HTTP boundary** | Zod schemas | Structural validation: "Is this request well-formed?" (missing fields, wrong types) | **422** |
| **Domain** | Value Objects, Rules | Business invariant validation: "Can this object exist in this state?" (ISBN checksum, borrowing limit) | **400** |

Zod schemas live in `infrastructure/nestjs/` alongside controllers. They validate **structure only** and never duplicate domain rules. Commands and Queries remain pure POJOs with no library coupling.

A reusable `ZodValidationPipe` applies schemas declaratively via NestJS decorators (`@Body(new ZodValidationPipe(schema))`). The pipe catches `ZodError` and throws a NestJS `UnprocessableEntityException` with per-field error details.

Zod implements the [Standard Schema](https://github.com/standard-schema/standard-schema) interface, which NestJS v12 will support natively — migration will be a matter of replacing `@Body(new ZodValidationPipe(schema))` with NestJS's built-in `@Body(schema)` decorator.

See: [`catalog.schemas.ts`](src/modules/catalog/infrastructure/nestjs/catalog.schemas.ts), [`lending.schemas.ts`](src/modules/lending/infrastructure/nestjs/lending.schemas.ts), [`zod-validation.pipe.ts`](src/shared/infrastructure/nestjs/pipes/zod-validation.pipe.ts)

### Error Handling

Domain exceptions are caught by a global `DomainExceptionFilter` and returned as HTTP 400 responses. Structural validation errors are caught by the `ZodValidationPipe` and returned as HTTP 422 responses with per-field details.

See: [`catalog.controller.ts`](src/modules/catalog/infrastructure/nestjs/catalog.controller.ts), [`lending.controller.ts`](src/modules/lending/infrastructure/nestjs/lending.controller.ts), [`catalog.module.ts`](src/modules/catalog/infrastructure/nestjs/catalog.module.ts), [`lending.module.ts`](src/modules/lending/infrastructure/nestjs/lending.module.ts), [`shared.module.ts`](src/shared/infrastructure/nestjs/shared.module.ts)

---

## Testing

Two levels, each in its own directory:

### `unit/` - Unit Tests (TDD)

Test domain building blocks in isolation: Value Objects, aggregates, rules. Written before production code. One file per concept.

See: [`catalog/tests/unit/`](src/modules/catalog/tests/unit/), [`lending/tests/unit/`](src/modules/lending/tests/unit/)

### `functional/` - Functional Tests

Behavior-oriented tests wired at the **use case** level. They use InMemory repositories and a **Builder Pattern** to encapsulate setup with sensible defaults:

```typescript
const { execute, repository } = new AddBookToCatalogTestBuilder()
  .withGeneratedId('book-42')
  .withIsbn('9780134685991')
  .build(),

const id = await execute(),
```

Each `.withXxx()` overrides only what matters for the test scenario.

See: [`add-book-to-catalog.test.ts`](src/modules/catalog/tests/functional/add-book-to-catalog.test.ts), [`borrow-book.test.ts`](src/modules/lending/tests/functional/borrow-book.test.ts), [`return-book.test.ts`](src/modules/lending/tests/functional/return-book.test.ts)

---

## Conventions

Quick reference for the patterns and naming used throughout the codebase.

### File Naming

`kebab-case` with semantic suffixes: `.entity.ts`, `.vo.ts`, `.rule.ts`, `.interface.ts`, `.use-case.ts`, `.command.ts`, `.query.ts`, `.event.ts`, `.exception.ts`

### Module Isolation

One module = one Bounded Context. **No direct imports between modules.** `catalog/` doesn't know `lending/` exists and vice versa. Cross-BC communication goes exclusively through domain events via the shared `DomainEventDispatcher`.

### Value Object Pattern

```typescript
export class ISBN {
  private constructor(private readonly _value: string) {}  // private constructor
  static create(value: string): ISBN { /* validate, then */ return new ISBN(value), }
  get value(): string { return this._value, }
  equals(other: ISBN): boolean { return this._value === other._value, }
}
```

### Aggregate Pattern

```typescript
export class Book extends AggregateRoot {
  private constructor(/* ... */) { super(), }            // private constructor
  static register(/* ... */): Book { /* factory */ }     // domain verb as factory
  // State changes via named behavior methods, not setters
}
```

### Port Pattern (Repository Interfaces)

Defined in the **domain layer**, parameters and returns typed with domain Value Objects, not primitives:

```typescript
export interface BooksRepository {
  save(book: Book): Promise<void>,
  findById(id: BookId): Promise<Book | null>,
  findAll(): Promise<Book[]>,
}
```

---

## Project Structure

```
src/
├── shared/
│   ├── domain/                             # Base classes & ports shared across BCs
│   │   ├── domain-event.ts                 # Abstract DomainEvent (immutable)
│   │   ├── aggregate-root.ts               # AggregateRoot (raise/pull events)
│   │   ├── domain-events.ts               # Event name constants (BOOK_REGISTERED, ...)
│   │   ├── event-dispatcher.interface.ts   # EventDispatcherInterface, SubscribableEventDispatcher
│   │   ├── rule.ts                         # Abstract Rule (business rules pattern)
│   │   ├── domain.exception.ts             # Base DomainException
│   │   ├── id-generator.ts                 # Port: ID generation
│   │   └── clock.ts                        # Port: time access
│   └── infrastructure/
│       ├── domain-event-dispatcher.ts      # SubscribableEventDispatcher implementation
│       ├── system-clock.ts                 # ClockInterface implementation
│       ├── id-generator.ts                 # IdGeneratorInterface implementation (UUID v7)
│       └── nestjs/
│           ├── main.ts                     # Application entry point
│           ├── app.module.ts               # Root module
│           ├── shared.module.ts            # @Global module (Clock, IdGenerator, EventDispatcher)
│           ├── injection-tokens.ts
│           ├── pipes/
│           │   └── zod-validation.pipe.ts      # Zod schema → 422 on invalid input
│           └── filters/
│               └── domain-exception.filter.ts  # DomainException → HTTP 400
│
└── modules/
    ├── catalog/                            # Bounded Context: Catalog (Supporting)
    │   ├── domain/book/                    # Aggregate: Book
    │   │   ├── book.entity.ts
    │   │   ├── book-id.vo.ts, isbn.vo.ts, book-title.vo.ts, author.vo.ts
    │   │   ├── books-repository.interface.ts
    │   │   ├── borrowed-book-registry.interface.ts
    │   │   ├── events/book-registered.event.ts
    │   │   └── exceptions/
    │   ├── application/
    │   │   ├── commands/add-book-to-catalog/    # Input DTO (CQS write)
    │   │   ├── queries/get-available-books/     # Input DTO (CQS read)
    │   │   ├── use-cases/                       # Orchestration
    │   │   │   ├── add-book-to-catalog.use-case.ts
    │   │   │   └── get-available-books.use-case.ts
    │   │   └── event-handlers/             # Reacts to lending::book-borrowed/returned
    │   ├── infrastructure/
    │   │   ├── books.in-memory.repository.ts
    │   │   ├── borrowed-book-registry.in-memory.ts
    │   │   └── nestjs/                     # NestJS wiring
    │   │       ├── catalog.module.ts       # Providers, event subscriptions
    │   │       ├── catalog.controller.ts   # REST endpoints (injects use cases directly)
    │   │       ├── catalog.schemas.ts      # Zod input validation schemas
    │   │       └── injection-tokens.ts
    │   └── tests/ (unit/ + functional/)
    │
    └── lending/                            # Bounded Context: Lending (Core Domain)
        ├── domain/
        │   ├── member/                     # Aggregate: Member
        │   │   ├── member.entity.ts        # Tracks active loans, enforces limit
        │   │   ├── member-id.vo.ts, member-name.vo.ts, borrowing-limit.vo.ts
        │   │   ├── members-repository.interface.ts
        │   │   ├── rules/
        │   │   └── exceptions/
        │   ├── loan/                       # Aggregate: Loan
        │   │   ├── loan.entity.ts          # Period, status, overdue detection
        │   │   ├── loan-id.vo.ts, loan-period.vo.ts
        │   │   ├── loans-repository.interface.ts
        │   │   ├── events/book-borrowed.event.ts, book-returned.event.ts
        │   │   ├── rules/
        │   │   └── exceptions/
        │   └── book-reference/             # ACL: Catalog's Book seen from Lending
        │       ├── book-reference.vo.ts
        │       └── book-references-repository.interface.ts
        ├── application/
        │   ├── commands/borrow-book/, return-book/  # Input DTOs (CQS writes)
        │   ├── queries/get-member-loans/            # Input DTO (CQS read)
        │   ├── use-cases/                           # Orchestration
        │   │   ├── borrow-book.use-case.ts
        │   │   ├── return-book.use-case.ts
        │   │   └── get-member-loans.use-case.ts
        │   └── event-handlers/on-book-registered.handler.ts  # ACL handler
        ├── infrastructure/
        │   ├── members.in-memory.repository.ts
        │   ├── loans.in-memory.repository.ts
        │   ├── book-references.in-memory.repository.ts
        │   └── nestjs/                     # NestJS wiring
        │       ├── lending.module.ts       # Providers, event subscriptions
        │       ├── lending.controller.ts   # REST endpoints (injects use cases directly)
        │       ├── lending.schemas.ts      # Zod input validation schemas
        │       └── injection-tokens.ts
        └── tests/ (unit/ + functional/)
```

---

## Non-Goals

This project is a **learning tool**, not a production application. Intentionally out of scope:

- Real database (InMemory repositories only, focus is on the domain, not persistence)
- Exhaustive HTTP error handling
- Event Sourcing
- Microservices
- Authentication / Authorization

---

## References

- Evans, E. (2003). *Domain-Driven Design: Tackling Complexity in the Heart of Software*. Addison-Wesley.
- Martin, R. C. (2017). *Clean Architecture: A Craftsman's Guide to Software Structure and Design*. Prentice Hall.
- Vernon, V. (2013). *Implementing Domain-Driven Design*. Addison-Wesley.
- Vernon, V. (2016). *Domain-Driven Design Distilled*. Addison-Wesley.
