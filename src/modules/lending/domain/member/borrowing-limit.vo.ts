import { BorrowingLimitMustBePositive } from './exceptions/borrowing-limit-must-be-positive.exception';
import { BorrowingLimitCannotExceed10 } from './exceptions/borrowing-limit-cannot-exceed-10.exception';

export class BorrowingLimit {
  private constructor(private readonly _value: number) {}

  static create(value: number): BorrowingLimit {
    if (!Number.isInteger(value) || value <= 0) {
      throw new BorrowingLimitMustBePositive();
    }
    if (value > 10) {
      throw new BorrowingLimitCannotExceed10();
    }
    return new BorrowingLimit(value);
  }

  get value(): number {
    return this._value;
  }

  allows(currentLoanCount: number): boolean {
    return currentLoanCount < this._value;
  }

  equals(other: BorrowingLimit): boolean {
    return this._value === other._value;
  }
}
