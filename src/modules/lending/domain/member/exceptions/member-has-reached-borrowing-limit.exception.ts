import { DomainException } from '@shared/domain/domain.exception';

export class MemberHasReachedBorrowingLimit extends DomainException {
  constructor() {
    super('Member has reached the borrowing limit');
  }
}
