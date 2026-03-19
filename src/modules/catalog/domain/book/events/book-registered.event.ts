import { DomainEvent } from '@shared/domain/domain-event';

export class BookRegisteredEvent extends DomainEvent {
  constructor(bookId: string) {
    super('catalog::book-registered', { bookId });
  }
}
