import { AddBookToCatalog } from '@catalog/application/use-cases/add-book-to-catalog.use-case';
import { AddBookToCatalogCommand } from '@catalog/application/commands/add-book-to-catalog/add-book-to-catalog.command';
import { BooksInMemoryRepository } from '@catalog/infrastructure/books.in-memory.repository';
import { BookReferencesInMemoryRepository } from '@lending/infrastructure/book-references.in-memory.repository';
import { DomainEventDispatcher } from '@shared/infrastructure/domain-event-dispatcher';
import { BOOK_REGISTERED } from '@shared/domain/domain-events';
import { OnBookRegisteredHandler } from '@lending/application/event-handlers/on-book-registered.handler';
import { StubIdGenerator } from '@shared/tests/stubs/stub-id-generator';

export class InterBcTestBuilder {
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
    eventDispatcher.subscribe(BOOK_REGISTERED, (event) => handler.handle(event));

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
