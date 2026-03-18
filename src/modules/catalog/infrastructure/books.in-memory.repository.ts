import { BooksRepository } from '@catalog/domain/book/books-repository.interface';
import { Book } from '@catalog/domain/book/book.entity';
import { BookId } from '@catalog/domain/book/book-id.vo';

export class BooksInMemoryRepository implements BooksRepository {
  private readonly books = new Map<string, Book>();

  async save(book: Book): Promise<void> {
    this.books.set(book.id.value, book);
  }

  async findById(id: BookId): Promise<Book | null> {
    return this.books.get(id.value) ?? null;
  }
}
