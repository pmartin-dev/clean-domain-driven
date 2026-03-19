import { describe, it, expect } from 'vitest';
import { GetAvailableBooks, AvailableBookDto } from '@catalog/application/use-cases/queries/get-available-books/get-available-books.use-case';
import { GetAvailableBooksQuery } from '@catalog/application/use-cases/queries/get-available-books/get-available-books.query';
import { BooksInMemoryRepository } from '@catalog/infrastructure/books.in-memory.repository';
import { BorrowedBookRegistryInMemory } from '@catalog/infrastructure/borrowed-book-registry.in-memory';
import { Book } from '@catalog/domain/book/book.entity';
import { BookId } from '@catalog/domain/book/book-id.vo';
import { ISBN } from '@catalog/domain/book/isbn.vo';
import { BookTitle } from '@catalog/domain/book/book-title.vo';
import { Author } from '@catalog/domain/book/author.vo';
import { DomainEventDispatcher } from '@shared/domain/domain-event-dispatcher';
import { OnBookBorrowedHandler } from '@catalog/application/event-handlers/on-book-borrowed.handler';
import { OnBookReturnedHandler } from '@catalog/application/event-handlers/on-book-returned.handler';
import { BookBorrowedEvent } from '@lending/domain/loan/events/book-borrowed.event';
import { BookReturnedEvent } from '@lending/domain/loan/events/book-returned.event';
import { DomainEvent } from '@shared/domain/domain-event';

class FakeEvent extends DomainEvent {
  constructor(name: string, payload: Record<string, unknown>) {
    super(name, payload);
  }
}

interface BookSeed {
  id: string;
  isbn: string;
  title: string;
  author: string;
}

class GetAvailableBooksTestBuilder {
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

describe('GetAvailableBooks', () => {
  it('returns all books when none are borrowed', async () => {
    const { execute } = await new GetAvailableBooksTestBuilder()
      .withBook('book-1', '9780134685991', 'Clean Code', 'Robert C. Martin')
      .withBook('book-2', '9780201633610', 'Design Patterns', 'Gang of Four')
      .build();

    const result = await execute();

    expect(result).toHaveLength(2);
  });

  it('excludes borrowed books', async () => {
    const { execute } = await new GetAvailableBooksTestBuilder()
      .withBook('book-1', '9780134685991', 'Clean Code', 'Robert C. Martin')
      .withBook('book-2', '9780201633610', 'Design Patterns', 'Gang of Four')
      .withBorrowedBook('book-1')
      .build();

    const result = await execute();

    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('book-2');
  });

  it('returns an empty list when all books are borrowed', async () => {
    const { execute } = await new GetAvailableBooksTestBuilder()
      .withBook('book-1', '9780134685991', 'Clean Code', 'Robert C. Martin')
      .withBorrowedBook('book-1')
      .build();

    const result = await execute();

    expect(result).toEqual([]);
  });

  it('returns an empty list when the catalog is empty', async () => {
    const { execute } = await new GetAvailableBooksTestBuilder().build();

    const result = await execute();

    expect(result).toEqual([]);
  });

  it('returns DTOs with all expected fields', async () => {
    const { execute } = await new GetAvailableBooksTestBuilder()
      .withBook('book-1', '9780134685991', 'Clean Code', 'Robert C. Martin')
      .build();

    const result = await execute();

    expect(result).toHaveLength(1);
    const dto: AvailableBookDto = result[0];
    expect(dto).toEqual({
      id: 'book-1',
      isbn: '9780134685991',
      title: 'Clean Code',
      author: 'Robert C. Martin',
    });
  });

  describe('Event-driven availability', () => {
    it('removes a book from available list when lending::book-borrowed is dispatched', async () => {
      const booksRepo = new BooksInMemoryRepository();
      const registry = new BorrowedBookRegistryInMemory();
      const eventDispatcher = new DomainEventDispatcher();

      const book = Book.register(
        BookId.create('book-1'),
        ISBN.create('9780134685991'),
        BookTitle.create('Clean Code'),
        Author.create('Robert C. Martin'),
      );
      await booksRepo.save(book);

      const borrowedHandler = new OnBookBorrowedHandler(registry);
      eventDispatcher.subscribe('lending::book-borrowed', (e) => borrowedHandler.handle(e));

      const useCase = new GetAvailableBooks(booksRepo, registry);

      await eventDispatcher.dispatch([new BookBorrowedEvent('loan-1', 'mem-1', 'book-1')]);

      const result = await useCase.execute(new GetAvailableBooksQuery());
      expect(result).toEqual([]);
    });

    it('restores a book to available list when lending::book-returned is dispatched', async () => {
      const booksRepo = new BooksInMemoryRepository();
      const registry = new BorrowedBookRegistryInMemory();
      const eventDispatcher = new DomainEventDispatcher();

      const book = Book.register(
        BookId.create('book-1'),
        ISBN.create('9780134685991'),
        BookTitle.create('Clean Code'),
        Author.create('Robert C. Martin'),
      );
      await booksRepo.save(book);

      const borrowedHandler = new OnBookBorrowedHandler(registry);
      const returnedHandler = new OnBookReturnedHandler(registry);
      eventDispatcher.subscribe('lending::book-borrowed', (e) => borrowedHandler.handle(e));
      eventDispatcher.subscribe('lending::book-returned', (e) => returnedHandler.handle(e));

      const useCase = new GetAvailableBooks(booksRepo, registry);

      await eventDispatcher.dispatch([new BookBorrowedEvent('loan-1', 'mem-1', 'book-1')]);
      const afterBorrow = await useCase.execute(new GetAvailableBooksQuery());
      expect(afterBorrow).toEqual([]);

      await eventDispatcher.dispatch([new BookReturnedEvent('loan-1', 'mem-1', 'book-1')]);
      const afterReturn = await useCase.execute(new GetAvailableBooksQuery());
      expect(afterReturn).toHaveLength(1);
      expect(afterReturn[0].id).toBe('book-1');
    });
  });

  describe('Event handler error paths', () => {
    it('rejects when lending::book-borrowed payload has no bookReference', async () => {
      const registry = new BorrowedBookRegistryInMemory();
      const handler = new OnBookBorrowedHandler(registry);

      const event = new FakeEvent('lending::book-borrowed', { loanId: 'loan-1', memberId: 'mem-1' });

      await expect(handler.handle(event)).rejects.toThrow('Invalid bookReference');
    });

    it('rejects when lending::book-borrowed payload has empty bookReference', async () => {
      const registry = new BorrowedBookRegistryInMemory();
      const handler = new OnBookBorrowedHandler(registry);

      const event = new FakeEvent('lending::book-borrowed', { loanId: 'loan-1', memberId: 'mem-1', bookReference: '' });

      await expect(handler.handle(event)).rejects.toThrow('BookId cannot be empty');
    });

    it('rejects when lending::book-borrowed payload has non-string bookReference', async () => {
      const registry = new BorrowedBookRegistryInMemory();
      const handler = new OnBookBorrowedHandler(registry);

      const event = new FakeEvent('lending::book-borrowed', { loanId: 'loan-1', memberId: 'mem-1', bookReference: 42 });

      await expect(handler.handle(event)).rejects.toThrow('Invalid bookReference');
    });

    it('rejects when lending::book-returned payload has no bookReference', async () => {
      const registry = new BorrowedBookRegistryInMemory();
      const handler = new OnBookReturnedHandler(registry);

      const event = new FakeEvent('lending::book-returned', { loanId: 'loan-1', memberId: 'mem-1' });

      await expect(handler.handle(event)).rejects.toThrow('Invalid bookReference');
    });

    it('rejects when lending::book-returned payload has empty bookReference', async () => {
      const registry = new BorrowedBookRegistryInMemory();
      const handler = new OnBookReturnedHandler(registry);

      const event = new FakeEvent('lending::book-returned', { loanId: 'loan-1', memberId: 'mem-1', bookReference: '' });

      await expect(handler.handle(event)).rejects.toThrow('BookId cannot be empty');
    });
  });
});
