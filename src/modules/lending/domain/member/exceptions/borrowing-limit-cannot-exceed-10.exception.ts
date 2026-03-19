import { DomainException } from '@shared/domain/domain.exception';

export class BorrowingLimitCannotExceed10 extends DomainException {
  constructor() {
    super('Borrowing limit cannot exceed 10');
  }
}
