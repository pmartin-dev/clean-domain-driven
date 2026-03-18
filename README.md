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

See: [`isbn.vo.ts`](src/modules/catalog/domain/book/isbn.vo.ts), [`book-title.vo.ts`](src/modules/catalog/domain/book/book-title.vo.ts), [`author.vo.ts`](src/modules/catalog/domain/book/author.vo.ts), [`book-id.vo.ts`](src/modules/catalog/domain/book/book-id.vo.ts)

### Aggregates

Consistency boundaries. All state changes go through named factory methods. The constructor is private — the only way in is through a domain verb.

```typescript
const book = Book.register(id, isbn, title, author);
```

See: [`book.entity.ts`](src/modules/catalog/domain/book/book.entity.ts)

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

### Ports (Repository Interfaces)

Defined in the **domain layer** — the domain dictates what it needs, not the infrastructure. The repository interface is a contract that any adapter (InMemory, SQL, API) can implement.

See: [`books-repository.interface.ts`](src/modules/catalog/domain/book/books-repository.interface.ts)

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

See: [`add-book-to-catalog.command.ts`](src/modules/catalog/application/use-cases/commands/add-book-to-catalog/add-book-to-catalog.command.ts), [`add-book-to-catalog.use-case.ts`](src/modules/catalog/application/use-cases/commands/add-book-to-catalog/add-book-to-catalog.use-case.ts)

---

## Testing

Two levels, each in its own directory:

### `unit/` — Unit Tests (TDD)

Test domain building blocks in isolation: VOs, aggregates, rules. Written before production code. One file per concept.

See: [`tests/unit/`](src/modules/catalog/tests/unit/)

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

See: [`tests/functional/add-book-to-catalog.test.ts`](src/modules/catalog/tests/functional/add-book-to-catalog.test.ts)

---

## Project Structure

```
src/
├── shared/domain/                          # Base classes & ports shared across BCs
│   ├── rule.ts                             # Abstract Rule (business rules pattern)
│   ├── domain.exception.ts                 # Base DomainException
│   ├── id-generator.ts                     # Port: ID generation
│   └── clock.ts                            # Port: time access
│
└── modules/catalog/                        # Bounded Context: Catalog
    ├── domain/book/                        # Aggregate: Book
    │   ├── book.entity.ts                  # Aggregate root
    │   ├── book-id.vo.ts                   # Value Objects
    │   ├── isbn.vo.ts
    │   ├── book-title.vo.ts
    │   ├── author.vo.ts
    │   ├── books-repository.interface.ts   # Port (in domain, not infra)
    │   └── exceptions/                     # Typed domain exceptions
    ├── application/use-cases/
    │   └── commands/                       # CQRS: write use cases
    │       └── add-book-to-catalog/
    │           ├── add-book-to-catalog.command.ts
    │           └── add-book-to-catalog.use-case.ts
    ├── infrastructure/                     # Adapters
    │   ├── books.in-memory.repository.ts
    │   └── id-generator.ts
    └── tests/
        ├── unit/                           # TDD — domain in isolation
        └── functional/                     # Behavior — use case level
```
