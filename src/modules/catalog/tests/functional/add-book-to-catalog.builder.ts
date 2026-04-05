import { AddBookToCatalog } from '@catalog/application/use-cases/add-book-to-catalog.use-case';
import { AddBookToCatalogCommand } from '@catalog/application/commands/add-book-to-catalog/add-book-to-catalog.command';
import { BooksInMemoryRepository } from '@catalog/infrastructure/books.in-memory.repository';
import { DomainEventDispatcher } from '@shared/infrastructure/domain-event-dispatcher';
import { StubIdGenerator } from '@shared/tests/stubs/stub-id-generator';

export class AddBookToCatalogTestBuilder {
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
