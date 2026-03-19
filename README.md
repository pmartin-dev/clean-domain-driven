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

### Context Map

Catalog is **upstream** (publishes events), Lending is **downstream** (consumes them). An **Anti-Corruption Layer** in Lending translates Catalog's model into its own language.

See the [PRD.md — Strategic Design](./PRD.md#solution-space--strategic-design) section for the ubiquitous language and context map diagram.

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

Events follow the naming convention `module::action` and carry minimal payload (IDs only). The `DomainEventDispatcher` is a synchronous in-process pub/sub — handlers are registered with `subscribe(eventName, handler)` and called sequentially on `dispatch()`.

See: [`domain-event.ts`](src/shared/domain/domain-event.ts), [`aggregate-root.ts`](src/shared/domain/aggregate-root.ts), [`domain-event-dispatcher.ts`](src/shared/domain/domain-event-dispatcher.ts), [`book-registered.event.ts`](src/modules/catalog/domain/book/events/book-registered.event.ts)

### Anti-Corruption Layer

Bounded Contexts communicate exclusively through domain events — no direct cross-module imports. The ACL in Lending listens to Catalog events and translates them into Lending's own model.

```typescript
// When Catalog publishes catalog::book-registered,
// Lending's handler creates a BookReference from the bookId
dispatcher.subscribe('catalog::book-registered', (event) => handler.handle(event));
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
Infrastructure (repos, adapters)              ← implements domain ports
    ↑
Interface (controllers — later)               ← calls application layer
```

**Domain First:** the domain is developed in isolation — pure TypeScript, zero framework imports. This means you can ship a working API quickly and defer infrastructure choices (database, framework, deployment) to later.

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
├── shared/domain/                          # Base classes & ports shared across BCs
│   ├── domain-event.ts                     # Abstract DomainEvent (immutable)
│   ├── aggregate-root.ts                   # AggregateRoot (raise/pull events)
│   ├── domain-event-dispatcher.ts          # In-process pub/sub for domain events
│   ├── rule.ts                             # Abstract Rule (business rules pattern)
│   ├── domain.exception.ts                 # Base DomainException
│   ├── id-generator.ts                     # Port: ID generation
│   └── clock.ts                            # Port: time access
│
└── modules/
    ├── catalog/                            # Bounded Context: Catalog (Supporting)
    │   ├── domain/book/                    # Aggregate: Book (extends AggregateRoot)
    │   │   ├── book.entity.ts
    │   │   ├── book-id.vo.ts, isbn.vo.ts, book-title.vo.ts, author.vo.ts
    │   │   ├── books-repository.interface.ts
    │   │   ├── events/                     # Domain events raised by Book
    │   │   │   └── book-registered.event.ts
    │   │   └── exceptions/
    │   ├── application/use-cases/commands/
    │   │   └── add-book-to-catalog/
    │   ├── infrastructure/
    │   └── tests/ (unit/ + functional/)
    │
    └── lending/                            # Bounded Context: Lending (Core Domain)
        ├── domain/
        │   ├── member/                     # Aggregate: Member (extends AggregateRoot)
        │   │   ├── member.entity.ts        # Tracks active loans, enforces limit
        │   │   ├── member-id.vo.ts, member-name.vo.ts, borrowing-limit.vo.ts
        │   │   ├── members-repository.interface.ts
        │   │   ├── rules/                  # Business rules as first-class objects
        │   │   └── exceptions/
        │   ├── loan/                       # Aggregate: Loan (extends AggregateRoot)
        │   │   ├── loan.entity.ts          # Period, status, overdue detection
        │   │   ├── loan-id.vo.ts, loan-period.vo.ts
        │   │   ├── loans-repository.interface.ts
        │   │   ├── events/                 # Domain events raised by Loan
        │   │   │   ├── book-borrowed.event.ts
        │   │   │   └── book-returned.event.ts
        │   │   ├── rules/
        │   │   └── exceptions/
        │   └── book-reference/             # ACL — Catalog's Book seen from Lending
        │       ├── book-reference.vo.ts
        │       └── book-references-repository.interface.ts
        ├── application/
        │   ├── event-handlers/             # ACL: reacts to cross-BC events
        │   │   └── on-book-registered.handler.ts
        │   └── use-cases/commands/
        │       ├── borrow-book/
        │       └── return-book/
        ├── infrastructure/
        └── tests/ (unit/ + functional/)
```
