import { describe, it, expect } from 'vitest';
import { BookReference } from '@lending/domain/book-reference/book-reference.vo';
import { DomainEventDispatcher } from '@shared/domain/domain-event-dispatcher';
import { DomainException } from '@shared/domain/domain.exception';
import { OnBookRegisteredHandler } from '@lending/application/event-handlers/on-book-registered.handler';
import { IdGeneratorInterface } from '@shared/domain/id-generator';
import { AddBookToCatalog } from '@catalog/application/use-cases/commands/add-book-to-catalog/add-book-to-catalog.use-case';
import { AddBookToCatalogCommand } from '@catalog/application/use-cases/commands/add-book-to-catalog/add-book-to-catalog.command';
import { BooksInMemoryRepository } from '@catalog/infrastructure/books.in-memory.repository';
import { BookReferencesInMemoryRepository } from '@lending/infrastructure/book-references.in-memory.repository';

class StubIdGenerator implements IdGeneratorInterface {
  constructor(private readonly id: string) {}
  generate(): string {
    return this.id;
  }
}

class InterBcTestBuilder {
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

  build() {
    const booksRepository = new BooksInMemoryRepository();
    const bookReferencesRepository = new BookReferencesInMemoryRepository();
    const eventDispatcher = new DomainEventDispatcher();

    const handler = new OnBookRegisteredHandler(bookReferencesRepository);
    eventDispatcher.subscribe('catalog::book-registered', (event) => handler.handle(event));

    const useCase = new AddBookToCatalog(
      booksRepository,
      new StubIdGenerator(this.generatedId),
      eventDispatcher,
    );

    return {
      execute: () =>
        useCase.execute(
          new AddBookToCatalogCommand(this.isbn, this.title, this.author),
        ),
      bookReferencesRepository,
    };
  }
}

describe('Inter-BC: Catalog → Lending', () => {
  it('creates a BookReference in Lending when a book is registered in Catalog', async () => {
    const { execute, bookReferencesRepository } = new InterBcTestBuilder()
      .withGeneratedId('book-42')
      .build();

    await execute();

    const bookRef = await bookReferencesRepository.findById(BookReference.create('book-42'));
    expect(bookRef).not.toBeNull();
  });

  it('does not create a BookReference when book registration fails', async () => {
    const { execute, bookReferencesRepository } = new InterBcTestBuilder()
      .withGeneratedId('book-1')
      .withIsbn('invalid-isbn')
      .build();

    await expect(execute()).rejects.toThrow(DomainException);

    const bookRef = await bookReferencesRepository.findById(BookReference.create('book-1'));
    expect(bookRef).toBeNull();
  });
});
