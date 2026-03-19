import { DomainEvent } from '@shared/domain/domain-event';

export class BookReturnedEvent extends DomainEvent {
  constructor(loanId: string, memberId: string, bookReference: string) {
    super('lending::book-returned', { loanId, memberId, bookReference });
  }
}
