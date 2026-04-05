import { GetAvailableBooks } from '@catalog/application/use-cases/get-available-books.use-case';
import { GetAvailableBooksQuery } from '@catalog/application/queries/get-available-books/get-available-books.query';
import { BooksInMemoryRepository } from '@catalog/infrastructure/books.in-memory.repository';
import { BorrowedBookRegistryInMemory } from '@catalog/infrastructure/borrowed-book-registry.in-memory';
import { Book } from '@catalog/domain/book/book.entity';
import { BookId } from '@catalog/domain/book/book-id.vo';
import { ISBN } from '@catalog/domain/book/isbn.vo';
import { BookTitle } from '@catalog/domain/book/book-title.vo';
import { Author } from '@catalog/domain/book/author.vo';
import { DomainEventDispatcher } from '@shared/infrastructure/domain-event-dispatcher';

interface BookSeed {
  id: string;
  isbn: string;
  title: string;
  author: string;
}

export class GetAvailableBooksTestBuilder {
  private books: BookSeed[] = [];
  private borrowedBookIds: string[] = [];

  withBook(id: string, isbn: string, title: string, author: string): this {
    this.books.push({ id, isbn, title, author });
    return this;
  }

  withBorrowedBook(bookId: string): this {
    this.borrowedBookIds.push(bookId);
    return this;
  }

  async build() {
    const booksRepo = new BooksInMemoryRepository();
    const registry = new BorrowedBookRegistryInMemory();
    const eventDispatcher = new DomainEventDispatcher();

    for (const seed of this.books) {
      const book = Book.register(
        BookId.create(seed.id),
        ISBN.create(seed.isbn),
        BookTitle.create(seed.title),
        Author.create(seed.author),
      );
      await booksRepo.save(book);
    }

    for (const bookId of this.borrowedBookIds) {
      await registry.markAsBorrowed(BookId.create(bookId));
    }

    const useCase = new GetAvailableBooks(booksRepo, registry);

    return {
      execute: () => useCase.execute(new GetAvailableBooksQuery()),
      booksRepo,
      registry,
      eventDispatcher,
    };
  }
}
