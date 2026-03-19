import { DomainEvent } from '@shared/domain/domain-event';
import { BOOK_REGISTERED } from '@shared/domain/domain-events';

export class BookRegisteredEvent extends DomainEvent {
  constructor(bookId: string) {
    super(BOOK_REGISTERED, { bookId });
  }
}
