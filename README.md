# Clean Domain-Driven

A practical guide to **Domain-Driven Design** with **Clean Architecture** and **CQRS** in TypeScript.

This repository walks through the DDD methodology — from understanding the business domain to implementing it in code — using a library book lending system as a concrete example.

**Target audience:** developers who can code but want to understand DDD in practice.

---

## Problem Space

Before writing any code, DDD starts by understanding the **business domain**.

Our domain is a **municipal library** that manages its book catalog and loans to members.

| Subdomain | Type | Description |
|---|---|---|
| **Lending** | Core Domain | Book loans — the reason the library exists. Richest business rules. |
| **Catalog** | Supporting | Book catalog — necessary but simpler. Manages available books and metadata. |

See [PRD.md](./PRD.md) for the full problem space analysis.

---

## Strategic Design

Strategic Design structures the domain into **Bounded Contexts** with their own language and models.

### Bounded Contexts

- **Catalog** — manages the book registry (adding, consulting)
- **Lending** — manages members, loans and returns

The concept of "Book" has a **different meaning** in each context. In Catalog, it's a rich object with ISBN, title, author. In Lending, it's a simple reference (just an identifier). This is precisely why they are separate Bounded Contexts.

### Ubiquitous Language

The shared vocabulary between domain experts and developers. Each term has a precise, unambiguous meaning within its context.

**Catalog:**

| Term | Definition |
|---|---|
| Book | A publication referenced in the library catalog |
| ISBN | International Standard Book Number — unique identifier for a publication |
| Title | The title of a book |
| Author | The author of a book |

**Lending:**

| Term | Definition |
|---|---|
| Member | A registered library patron, authorized to borrow |
| Loan | An active borrowing — the link between a member and a borrowed book |
| Borrow | The act of borrowing a book |
| Return | The act of returning a borrowed book |
| DueDate | The return deadline for a loan |
| Overdue | A loan past its due date |
| BorrowingLimit | The maximum number of books a member can borrow simultaneously |
| BookReference | A book as seen from Lending — not the full Catalog model, just an identifier |

### Context Map

Catalog is **upstream** (publishes events), Lending is **downstream** (consumes them). An **Anti-Corruption Layer** in Lending translates Catalog's model into its own language.

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

---

## Tactical Design — Building Blocks

Tactical Design translates the strategic model into concrete building blocks.

### Value Objects

Immutable objects defined by their value, not their identity. They validate their own invariants at construction time through a private constructor and a `create()` factory method.

```typescript
const isbn = ISBN.create('9780134685991');  // valid — object created
const bad  = ISBN.create('invalid');         // throws ISBNMustBeExactly13Digits
```

Each VO provides `equals()` for comparison — no primitive comparisons leaking out.

Some VOs carry behavior beyond simple validation. `BorrowingLimit` exposes `allows(currentCount)` and `LoanPeriod` exposes `isOverdue(now)` — domain logic lives in the value objects, not in services.

See: [`isbn.vo.ts`](src/modules/catalog/domain/book/isbn.vo.ts), [`borrowing-limit.vo.ts`](src/modules/lending/domain/member/borrowing-limit.vo.ts), [`loan-period.vo.ts`](src/modules/lending/domain/loan/loan-period.vo.ts)

### Aggregates

Consistency boundaries. The constructor is private — the only way in is through a domain verb (factory method). State changes go through named behavior methods, not setters.

```typescript
// Catalog — simple aggregate, no mutations
const book = Book.register(id, isbn, title, author);

// Lending — rich aggregate with behavior and internal state
const member = Member.register(id, name, BorrowingLimit.create(3));
member.borrow(loanId);    // validates limit, adds to internal Set
member.returnBook(loanId); // removes from internal Set
```

`Member` maintains a `Set<LoanId>` internally — it's its own consistency boundary. The borrowing limit rule is checked **inside** the aggregate, not in the use case.

See: [`book.entity.ts`](src/modules/catalog/domain/book/book.entity.ts), [`member.entity.ts`](src/modules/lending/domain/member/member.entity.ts), [`loan.entity.ts`](src/modules/lending/domain/loan/loan.entity.ts)

### Domain Exceptions

One class per violation, named after the business constraint. Each extends `DomainException`. No generic error messages — the exception type **is** the documentation.

```
exceptions/
  ├── isbn-must-be-exactly-13-digits.exception.ts
  ├── isbn-checksum-is-invalid.exception.ts
  ├── book-title-cannot-be-empty.exception.ts
  └── ...
```

See: [`exceptions/`](src/modules/catalog/domain/book/exceptions/)

### Business Rules as First-Class Objects

Cross-cutting business constraints are modeled as `Rule` objects — named after the constraint, testable in isolation, composable via `Rule.checkAll()`.

```typescript
Rule.checkAll([
  new BookMustBeAvailable(existingLoan !== null),
  new MemberMustNotHaveOverdueLoans(hasOverdue),
]);
```

Each rule implements `isRespected()` and `createError()`. They live in the aggregate they protect: `MemberCannotExceedBorrowingLimit` is checked inside `Member.borrow()`, while `BookMustBeAvailable` is checked in the `BorrowBook` use case (it requires a repository query).

See: [`member-cannot-exceed-borrowing-limit.rule.ts`](src/modules/lending/domain/member/rules/member-cannot-exceed-borrowing-limit.rule.ts), [`book-must-be-available.rule.ts`](src/modules/lending/domain/loan/rules/book-must-be-available.rule.ts)

### Ports (Repository Interfaces)

Defined in the **domain layer** — the domain dictates what it needs, not the infrastructure. The repository interface is a contract that any adapter (InMemory, SQL, API) can implement.

See: [`books-repository.interface.ts`](src/modules/catalog/domain/book/books-repository.interface.ts)

### Domain Events

Immutable events raised by aggregates after state changes. Each aggregate extends `AggregateRoot`, which provides `raise()` to accumulate events and `pullDomainEvents()` to drain them.

```typescript
// Inside Book.register()
book.raise(new BookRegisteredEvent(id.value));

// In the use case, after persistence
await this.eventDispatcher.dispatch(book.pullDomainEvents());
```

Events follow the naming convention `module::action` and carry minimal payload (IDs only). Event names are defined as shared constants in [`domain-events.ts`](src/shared/domain/domain-events.ts) to prevent silent drift between publishers and subscribers.

The `DomainEventDispatcher` is a synchronous in-process pub/sub — handlers are registered with `subscribe(eventName, handler)` and called sequentially on `dispatch()`.

See: [`domain-event.ts`](src/shared/domain/domain-event.ts), [`aggregate-root.ts`](src/shared/domain/aggregate-root.ts), [`domain-event-dispatcher.ts`](src/shared/domain/domain-event-dispatcher.ts), [`domain-events.ts`](src/shared/domain/domain-events.ts), [`book-registered.event.ts`](src/modules/catalog/domain/book/events/book-registered.event.ts)

### Anti-Corruption Layer

Bounded Contexts communicate exclusively through domain events — no direct cross-module imports. The ACL in Lending listens to Catalog events and translates them into Lending's own model.

```typescript
// When Catalog publishes catalog::book-registered,
// Lending's handler creates a BookReference from the bookId
dispatcher.subscribe(BOOK_REGISTERED, (event) => handler.handle(event));
```

This means adding a book to the Catalog automatically creates a `BookReference` in Lending — the two contexts stay in sync without coupling.

See: [`on-book-registered.handler.ts`](src/modules/lending/application/event-handlers/on-book-registered.handler.ts)

---

## Clean Architecture

Dependencies point **inward**. The domain depends on nothing. The framework arrives last.

```
Domain (entities, VOs, exceptions, ports)     ← depends on NOTHING
    ↑
Application (use cases, commands)             ← depends on domain only
    ↑
Infrastructure (repos, adapters, NestJS)      ← implements domain ports
    ↑
Interface (NestJS controllers)                ← calls application layer
```

**Domain First:** the domain was developed in isolation — pure TypeScript, zero framework imports. NestJS was added **after** the domain was stabilized and tested. This means you can change the framework, database or deployment without touching a single line of domain code.

See: [`domain/`](src/modules/catalog/domain/), [`application/`](src/modules/catalog/application/), [`infrastructure/`](src/modules/catalog/infrastructure/)

---

## CQRS — Living with Clean Architecture

Clean Architecture and CQRS operate at different levels:
- **Clean Architecture** structures **layers** — the use case is the central concept
- **CQRS** structures **intent** — separating writes (commands) from reads (queries)

They coexist: `use-cases/` is the parent directory (Clean Architecture), `commands/` and `queries/` organize by intent inside it (CQRS).

```
application/use-cases/
  ├── commands/                              ← writes (go through the domain)
  │   └── add-book-to-catalog/
  │       ├── add-book-to-catalog.command.ts    (input DTO)
  │       └── add-book-to-catalog.use-case.ts   (orchestration)
  └── queries/                               ← reads (direct, no domain)
      └── ...
```

- **Command use case:** creates VOs, calls the aggregate, persists via repository port
- **Query use case:** reads directly from repository, returns a DTO, never touches the domain

See: [`add-book-to-catalog/`](src/modules/catalog/application/use-cases/commands/add-book-to-catalog/), [`borrow-book/`](src/modules/lending/application/use-cases/commands/borrow-book/), [`return-book/`](src/modules/lending/application/use-cases/commands/return-book/)

---

## NestJS — Infrastructure Framework

NestJS serves as a **pure infrastructure adapter**. The domain and application layers have zero NestJS imports — no `@Injectable()` decorators on use cases or domain classes.

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

### Custom CQRS Buses

A simple `CommandBus` and `QueryBus` dispatch commands/queries to the appropriate use case by class name. Controllers depend on the bus interfaces — they don't know which use case handles which command.

See: [`command-bus.ts`](src/infrastructure/nestjs/cqrs/command-bus.ts), [`query-bus.ts`](src/infrastructure/nestjs/cqrs/query-bus.ts)

### Cross-BC Event Wiring

Each NestJS module subscribes its event handlers to the shared `DomainEventDispatcher` during `OnModuleInit`. No cross-module imports — modules only share the dispatcher singleton via the global `SharedModule`.

### REST API

| Method | Endpoint | Action |
|--------|----------|--------|
| POST | `/catalog/books` | Add a book to the catalog |
| GET | `/catalog/books` | List available books |
| POST | `/lending/loans` | Borrow a book |
| POST | `/lending/loans/:loanId/return` | Return a book |
| GET | `/lending/members/:memberId/loans` | List a member's active loans |

Domain exceptions are caught by a global `DomainExceptionFilter` and returned as HTTP 400 responses.

See: [`catalog.controller.ts`](src/modules/catalog/infrastructure/nestjs/catalog.controller.ts), [`lending.controller.ts`](src/modules/lending/infrastructure/nestjs/lending.controller.ts), [`catalog.module.ts`](src/modules/catalog/infrastructure/nestjs/catalog.module.ts), [`lending.module.ts`](src/modules/lending/infrastructure/nestjs/lending.module.ts)

---

## Testing

Two levels, each in its own directory:

### `unit/` — Unit Tests (TDD)

Test domain building blocks in isolation: VOs, aggregates, rules. Written before production code. One file per concept.

See: [`catalog/tests/unit/`](src/modules/catalog/tests/unit/), [`lending/tests/unit/`](src/modules/lending/tests/unit/)

### `functional/` — Functional Tests

Behavior-oriented tests wired at the **use case** level. They use InMemory repositories and a **Builder Pattern** to encapsulate setup with sensible defaults:

```typescript
const { execute, repository } = new AddBookToCatalogTestBuilder()
  .withGeneratedId('book-42')
  .withIsbn('9780134685991')
  .build();

const id = await execute();
```

Each `.withXxx()` overrides only what matters for the test scenario.

See: [`add-book-to-catalog.test.ts`](src/modules/catalog/tests/functional/add-book-to-catalog.test.ts), [`borrow-book.test.ts`](src/modules/lending/tests/functional/borrow-book.test.ts), [`return-book.test.ts`](src/modules/lending/tests/functional/return-book.test.ts)

---

## Project Structure

```
src/
├── shared/
│   ├── domain/                             # Base classes & ports shared across BCs
│   │   ├── domain-event.ts                 # Abstract DomainEvent (immutable)
│   │   ├── aggregate-root.ts               # AggregateRoot (raise/pull events)
│   │   ├── domain-event-dispatcher.ts      # In-process pub/sub for domain events
│   │   ├── domain-events.ts               # Event name constants (BOOK_REGISTERED, ...)
│   │   ├── event-dispatcher.interface.ts   # EventDispatcherInterface, SubscribableEventDispatcher
│   │   ├── rule.ts                         # Abstract Rule (business rules pattern)
│   │   ├── domain.exception.ts             # Base DomainException
│   │   ├── id-generator.ts                 # Port: ID generation
│   │   └── clock.ts                        # Port: time access
│   └── infrastructure/
│       ├── system-clock.ts                 # ClockInterface implementation
│       ├── id-generator.ts                 # IdGeneratorInterface implementation (UUID v7)
│       └── nestjs/
│           ├── shared.module.ts            # @Global module (Clock, IdGenerator, EventDispatcher)
│           └── injection-tokens.ts
│
├── infrastructure/nestjs/                  # NestJS bootstrap & cross-cutting
│   ├── main.ts                             # Application entry point
│   ├── app.module.ts                       # Root module
│   ├── cqrs/
│   │   ├── command-bus.ts                  # CommandBus interface + SimpleCommandBus
│   │   ├── query-bus.ts                    # QueryBus interface + SimpleQueryBus
│   │   ├── cqrs.module.ts                 # @Global CQRS module
│   │   └── injection-tokens.ts
│   └── filters/
│       └── domain-exception.filter.ts      # DomainException → HTTP 400
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
    │   │   ├── use-cases/commands/add-book-to-catalog/
    │   │   ├── use-cases/queries/get-available-books/
    │   │   └── event-handlers/             # Reacts to lending::book-borrowed/returned
    │   ├── infrastructure/
    │   │   ├── books.in-memory.repository.ts
    │   │   ├── borrowed-book-registry.in-memory.ts
    │   │   └── nestjs/                     # NestJS wiring
    │   │       ├── catalog.module.ts       # Providers, event subscriptions, bus registration
    │   │       ├── catalog.controller.ts   # REST endpoints
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
        │   └── book-reference/             # ACL — Catalog's Book seen from Lending
        │       ├── book-reference.vo.ts
        │       └── book-references-repository.interface.ts
        ├── application/
        │   ├── event-handlers/on-book-registered.handler.ts  # ACL handler
        │   └── use-cases/
        │       ├── commands/borrow-book/, return-book/
        │       └── queries/get-member-loans/
        ├── infrastructure/
        │   ├── members.in-memory.repository.ts
        │   ├── loans.in-memory.repository.ts
        │   ├── book-references.in-memory.repository.ts
        │   └── nestjs/                     # NestJS wiring
        │       ├── lending.module.ts
        │       ├── lending.controller.ts
        │       └── injection-tokens.ts
        └── tests/ (unit/ + functional/)
```
