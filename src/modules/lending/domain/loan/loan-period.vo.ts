import { LoanPeriodEndMustBeAfterStart } from './exceptions/loan-period-end-must-be-after-start.exception';
import { LoanPeriodCannotExceed21Days } from './exceptions/loan-period-cannot-exceed-21-days.exception';

const MAX_LOAN_DAYS = 21;
const MS_PER_DAY = 1000 * 60 * 60 * 24;

export class LoanPeriod {
  private constructor(
    private readonly _start: Date,
    private readonly _end: Date,
  ) {}

  static create(start: Date, end: Date): LoanPeriod {
    const s = new Date(start.getTime());
    const e = new Date(end.getTime());
    if (e.getTime() <= s.getTime()) {
      throw new LoanPeriodEndMustBeAfterStart();
    }
    const diffDays = (e.getTime() - s.getTime()) / MS_PER_DAY;
    if (diffDays > MAX_LOAN_DAYS) {
      throw new LoanPeriodCannotExceed21Days();
    }
    return new LoanPeriod(s, e);
  }

  static createFromNow(now: Date, days: number = MAX_LOAN_DAYS): LoanPeriod {
    const end = new Date(now.getTime() + days * MS_PER_DAY);
    return LoanPeriod.create(now, end);
  }

  get dueDate(): Date {
    return new Date(this._end.getTime());
  }

  get start(): Date {
    return new Date(this._start.getTime());
  }

  isOverdue(now: Date): boolean {
    return now.getTime() > this._end.getTime();
  }

  equals(other: LoanPeriod): boolean {
    return (
      this._start.getTime() === other._start.getTime() &&
      this._end.getTime() === other._end.getTime()
    );
  }
}
