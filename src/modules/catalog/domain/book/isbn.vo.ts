import { ISBNMustBeExactly13Digits } from './exceptions/isbn-must-be-exactly-13-digits.exception';
import { ISBNChecksumIsInvalid } from './exceptions/isbn-checksum-is-invalid.exception';

export class ISBN {
  private constructor(private readonly _value: string) {}

  static create(value: string): ISBN {
    if (!/^\d{13}$/.test(value)) {
      throw new ISBNMustBeExactly13Digits();
    }
    if (!ISBN.isChecksumValid(value)) {
      throw new ISBNChecksumIsInvalid();
    }
    return new ISBN(value);
  }

  get value(): string {
    return this._value;
  }

  equals(other: ISBN): boolean {
    return this._value === other._value;
  }

  private static isChecksumValid(digits: string): boolean {
    const sum = digits
      .split('')
      .map(Number)
      .reduce((acc, digit, index) => acc + digit * (index % 2 === 0 ? 1 : 3), 0);
    return sum % 10 === 0;
  }
}
