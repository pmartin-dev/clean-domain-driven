import { AggregateRoot } from '@shared/domain/aggregate-root';
import { LoanId } from './loan-id.vo';
import { LoanPeriod } from './loan-period.vo';
import { BookReference } from '../book-reference/book-reference.vo';
import { MemberId } from '../member/member-id.vo';
import { LoanIsAlreadyReturned } from './exceptions/loan-is-already-returned.exception';
import { BookBorrowedEvent } from './events/book-borrowed.event';
import { BookReturnedEvent } from './events/book-returned.event';

export class Loan extends AggregateRoot {
  private constructor(
    private readonly _id: LoanId,
    private readonly _memberId: MemberId,
    private readonly _bookReference: BookReference,
    private readonly _period: LoanPeriod,
    private _active: boolean,
  ) {
    super();
  }

  static create(id: LoanId, memberId: MemberId, bookReference: BookReference, period: LoanPeriod): Loan {
    const loan = new Loan(id, memberId, bookReference, period, true);
    loan.raise(new BookBorrowedEvent(id.value, memberId.value, bookReference.value));
    return loan;
  }

  markReturned(): void {
    if (!this._active) {
      throw new LoanIsAlreadyReturned();
    }
    this._active = false;
    this.raise(new BookReturnedEvent(this._id.value, this._memberId.value, this._bookReference.value));
  }

  isOverdue(now: Date): boolean {
    return this._active && this._period.isOverdue(now);
  }

  isActive(): boolean {
    return this._active;
  }

  get id(): LoanId {
    return this._id;
  }

  get memberId(): MemberId {
    return this._memberId;
  }

  get bookReference(): BookReference {
    return this._bookReference;
  }

  get period(): LoanPeriod {
    return this._period;
  }
}
