import { LoanIdCannotBeEmpty } from './exceptions/loan-id-cannot-be-empty.exception';
import { LoanIdCannotContainWhitespace } from './exceptions/loan-id-cannot-contain-whitespace.exception';

export class LoanId {
  private constructor(private readonly _value: string) {}

  static create(value: string): LoanId {
    if (!value || value.trim().length === 0) {
      throw new LoanIdCannotBeEmpty();
    }
    if (/\s/.test(value)) {
      throw new LoanIdCannotContainWhitespace();
    }
    return new LoanId(value);
  }

  get value(): string {
    return this._value;
  }

  equals(other: LoanId): boolean {
    return this._value === other._value;
  }
}
