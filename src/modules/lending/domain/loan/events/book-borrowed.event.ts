import { DomainEvent } from '@shared/domain/domain-event';

export class BookBorrowedEvent extends DomainEvent {
  constructor(loanId: string, memberId: string, bookReference: string) {
    super('lending::book-borrowed', { loanId, memberId, bookReference });
  }
}
