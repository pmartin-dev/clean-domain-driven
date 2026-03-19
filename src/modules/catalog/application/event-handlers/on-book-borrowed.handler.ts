import { DomainEvent } from '@shared/domain/domain-event';
import { BorrowedBookRegistry } from '@catalog/domain/book/borrowed-book-registry.interface';
import { BookId } from '@catalog/domain/book/book-id.vo';

export class OnBookBorrowedHandler {
  constructor(private readonly borrowedBookRegistry: BorrowedBookRegistry) {}

  async handle(event: DomainEvent): Promise<void> {
    const rawBookReference = event.payload.bookReference;
    if (typeof rawBookReference !== 'string') {
      throw new Error(`Invalid bookReference in lending::book-borrowed payload: ${String(rawBookReference)}`);
    }
    const bookId = BookId.create(rawBookReference);
    await this.borrowedBookRegistry.markAsBorrowed(bookId);
  }
}
