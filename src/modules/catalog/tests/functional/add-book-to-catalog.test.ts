import { describe, it, expect } from 'vitest';
import { AddBookToCatalog } from '@catalog/application/use-cases/commands/add-book-to-catalog/add-book-to-catalog.use-case';
import { AddBookToCatalogCommand } from '@catalog/application/use-cases/commands/add-book-to-catalog/add-book-to-catalog.command';
import { BooksInMemoryRepository } from '@catalog/infrastructure/books.in-memory.repository';
import { BookId } from '@catalog/domain/book/book-id.vo';
import { BookTitle } from '@catalog/domain/book/book-title.vo';
import { DomainException } from '@shared/domain/domain.exception';
import { DomainEvent } from '@shared/domain/domain-event';
import { DomainEventDispatcher } from '@shared/domain/domain-event-dispatcher';
import { IdGeneratorInterface } from '@shared/domain/id-generator';

class StubIdGenerator implements IdGeneratorInterface {
  constructor(private readonly id: string) {}
  generate(): string {
    return this.id;
  }
}

class AddBookToCatalogTestBuilder {
  private generatedId = 'book-1';
  private isbn = '9780134685991';
  private title = 'Clean Code';
  private author = 'Robert C. Martin';

  withGeneratedId(id: string): this {
    this.generatedId = id;
    return this;
  }

  withIsbn(isbn: string): this {
    this.isbn = isbn;
    return this;
  }

  withTitle(title: string): this {
    this.title = title;
    return this;
  }

  withAuthor(author: string): this {
    this.author = author;
    return this;
  }

  build() {
    const repository = new BooksInMemoryRepository();
    const idGenerator = new StubIdGenerator(this.generatedId);
    const eventDispatcher = new DomainEventDispatcher();
    const useCase = new AddBookToCatalog(repository, idGenerator, eventDispatcher);

    return {
      execute: () =>
        useCase.execute(
          new AddBookToCatalogCommand(this.isbn, this.title, this.author),
        ),
      repository,
      eventDispatcher,
    };
  }
}

describe('AddBookToCatalog', () => {
  it('adds a book to the catalog and returns its id', async () => {
    const { execute, repository } = new AddBookToCatalogTestBuilder()
      .withGeneratedId('book-42')
      .build();

    const result = await execute();

    expect(result).toBe('book-42');
    const persisted = await repository.findById(BookId.create('book-42'));
    expect(persisted).not.toBeNull();
    expect(persisted!.title.equals(BookTitle.create('Clean Code'))).toBe(true);
  });

  it('rejects a book with an invalid ISBN', async () => {
    const { execute } = new AddBookToCatalogTestBuilder()
      .withIsbn('invalid')
      .build();

    await expect(execute()).rejects.toThrow(DomainException);
  });

  it('dispatches a BookRegisteredEvent after registering', async () => {
    const { execute, eventDispatcher } = new AddBookToCatalogTestBuilder()
      .withGeneratedId('book-42')
      .build();
    const captured: DomainEvent[] = [];
    eventDispatcher.subscribe('catalog::book-registered', async (e) => { captured.push(e); });

    await execute();

    expect(captured).toHaveLength(1);
    expect(captured[0].payload).toEqual({ bookId: 'book-42' });
  });

  it('does not persist the book when validation fails', async () => {
    const { execute, repository } = new AddBookToCatalogTestBuilder()
      .withGeneratedId('book-1')
      .withIsbn('invalid')
      .build();

    await expect(execute()).rejects.toThrow(DomainException);

    const persisted = await repository.findById(BookId.create('book-1'));
    expect(persisted).toBeNull();
  });
});
