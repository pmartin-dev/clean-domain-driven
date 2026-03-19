import { DomainEvent } from '@shared/domain/domain-event';
import { BOOK_BORROWED } from '@shared/domain/domain-events';

export class BookBorrowedEvent extends DomainEvent {
  constructor(loanId: string, memberId: string, bookReference: string) {
    super(BOOK_BORROWED, { loanId, memberId, bookReference });
  }
}
