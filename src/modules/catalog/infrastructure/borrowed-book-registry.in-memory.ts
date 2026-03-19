import { BorrowedBookRegistry } from '@catalog/domain/book/borrowed-book-registry.interface';
import { BookId } from '@catalog/domain/book/book-id.vo';

export class BorrowedBookRegistryInMemory implements BorrowedBookRegistry {
  private readonly borrowedBookIds = new Set<string>();

  async markAsBorrowed(bookId: BookId): Promise<void> {
    this.borrowedBookIds.add(bookId.value);
  }

  async markAsReturned(bookId: BookId): Promise<void> {
    this.borrowedBookIds.delete(bookId.value);
  }

  async getBorrowedBookIds(): Promise<Set<string>> {
    return new Set(this.borrowedBookIds);
  }
}
