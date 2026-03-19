import { AggregateRoot } from '@shared/domain/aggregate-root';
import { Rule } from '@shared/domain/rule';
import { MemberId } from './member-id.vo';
import { MemberName } from './member-name.vo';
import { BorrowingLimit } from './borrowing-limit.vo';
import { LoanId } from '../loan/loan-id.vo';
import { MemberCannotExceedBorrowingLimit } from './rules/member-cannot-exceed-borrowing-limit.rule';
import { MemberMustNotHaveOverdueLoans } from './rules/member-must-not-have-overdue-loans.rule';
import { LoanIsNotActiveForMember } from './exceptions/loan-is-not-active-for-member.exception';

export class Member extends AggregateRoot {
  private constructor(
    private readonly _id: MemberId,
    private readonly _name: MemberName,
    private readonly _borrowingLimit: BorrowingLimit,
    private readonly _activeLoans: Set<string>,
  ) {
    super();
  }

  static register(id: MemberId, name: MemberName, borrowingLimit: BorrowingLimit): Member {
    return new Member(id, name, borrowingLimit, new Set());
  }

  borrow(loanId: LoanId, hasOverdueLoans: boolean): void {
    Rule.checkAll([
      new MemberCannotExceedBorrowingLimit(this._activeLoans.size, this._borrowingLimit),
      new MemberMustNotHaveOverdueLoans(hasOverdueLoans),
    ]);
    this._activeLoans.add(loanId.value);
  }

  returnBook(loanId: LoanId): void {
    if (!this._activeLoans.has(loanId.value)) {
      throw new LoanIsNotActiveForMember();
    }
    this._activeLoans.delete(loanId.value);
  }

  hasActiveLoan(loanId: LoanId): boolean {
    return this._activeLoans.has(loanId.value);
  }

  get activeLoanCount(): number {
    return this._activeLoans.size;
  }

  get id(): MemberId {
    return this._id;
  }

  get name(): MemberName {
    return this._name;
  }

  get borrowingLimit(): BorrowingLimit {
    return this._borrowingLimit;
  }
}
