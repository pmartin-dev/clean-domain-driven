import { Rule } from '@shared/domain/rule';
import { MemberHasReachedBorrowingLimit } from '../exceptions/member-has-reached-borrowing-limit.exception';
import { BorrowingLimit } from '../borrowing-limit.vo';

export class MemberCannotExceedBorrowingLimit extends Rule {
  constructor(
    private readonly currentLoanCount: number,
    private readonly limit: BorrowingLimit,
  ) {
    super();
  }

  isRespected(): boolean {
    return this.limit.allows(this.currentLoanCount);
  }

  protected createError(): MemberHasReachedBorrowingLimit {
    return new MemberHasReachedBorrowingLimit();
  }
}
