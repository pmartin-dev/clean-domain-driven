import { BookId } from './book-id.vo';

export interface BorrowedBookRegistry {
  markAsBorrowed(bookId: BookId): Promise<void>;
  markAsReturned(bookId: BookId): Promise<void>;
  getBorrowedBookIds(): Promise<Set<string>>;
}
