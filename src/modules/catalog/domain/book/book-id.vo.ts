import { BookIdCannotBeEmpty } from './exceptions/book-id-cannot-be-empty.exception';
import { BookIdCannotContainWhitespace } from './exceptions/book-id-cannot-contain-whitespace.exception';

export class BookId {
  private constructor(private readonly _value: string) {}

  static create(value: string): BookId {
    if (!value || value.trim().length === 0) {
      throw new BookIdCannotBeEmpty();
    }
    if (/\s/.test(value)) {
      throw new BookIdCannotContainWhitespace();
    }
    return new BookId(value);
  }

  get value(): string {
    return this._value;
  }

  equals(other: BookId): boolean {
    return this._value === other._value;
  }
}
