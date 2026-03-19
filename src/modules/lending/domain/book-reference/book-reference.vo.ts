import { BookReferenceCannotBeEmpty } from './exceptions/book-reference-cannot-be-empty.exception';
import { BookReferenceCannotContainWhitespace } from './exceptions/book-reference-cannot-contain-whitespace.exception';

export class BookReference {
  private constructor(private readonly _value: string) {}

  static create(value: string): BookReference {
    if (!value || value.trim().length === 0) {
      throw new BookReferenceCannotBeEmpty();
    }
    if (/\s/.test(value)) {
      throw new BookReferenceCannotContainWhitespace();
    }
    return new BookReference(value);
  }

  get value(): string {
    return this._value;
  }

  equals(other: BookReference): boolean {
    return this._value === other._value;
  }
}
