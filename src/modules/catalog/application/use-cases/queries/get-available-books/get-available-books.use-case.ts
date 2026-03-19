import { BooksRepository } from '@catalog/domain/book/books-repository.interface';
import { BorrowedBookRegistry } from '@catalog/domain/book/borrowed-book-registry.interface';
import { GetAvailableBooksQuery } from './get-available-books.query';

export interface AvailableBookDto {
  id: string;
  isbn: string;
  title: string;
  author: string;
}

export class GetAvailableBooks {
  constructor(
    private readonly booksRepository: BooksRepository,
    private readonly borrowedBookRegistry: BorrowedBookRegistry,
  ) {}

  async execute(_query: GetAvailableBooksQuery): Promise<AvailableBookDto[]> {
    const books = await this.booksRepository.findAll();
    const borrowedIds = await this.borrowedBookRegistry.getBorrowedBookIds();

    return books
      .filter((book) => !borrowedIds.has(book.id.value))
      .map((book) => ({
        id: book.id.value,
        isbn: book.isbn.value,
        title: book.title.value,
        author: book.author.value,
      }));
  }
}
