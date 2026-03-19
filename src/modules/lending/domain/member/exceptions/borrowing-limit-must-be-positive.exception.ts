import { DomainException } from '@shared/domain/domain.exception';

export class BorrowingLimitMustBePositive extends DomainException {
  constructor() {
    super('Borrowing limit must be a positive integer');
  }
}
