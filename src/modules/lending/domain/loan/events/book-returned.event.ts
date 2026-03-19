import { DomainEvent } from '@shared/domain/domain-event';
import { BOOK_RETURNED } from '@shared/domain/domain-events';

export class BookReturnedEvent extends DomainEvent {
  constructor(loanId: string, memberId: string, bookReference: string) {
    super(BOOK_RETURNED, { loanId, memberId, bookReference });
  }
}
