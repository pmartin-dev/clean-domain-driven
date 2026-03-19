import { Book } from './book.entity';
import { BookId } from './book-id.vo';

export interface BooksRepository {
  save(book: Book): Promise<void>;
  findById(id: BookId): Promise<Book | null>;
  findAll(): Promise<Book[]>;
}
