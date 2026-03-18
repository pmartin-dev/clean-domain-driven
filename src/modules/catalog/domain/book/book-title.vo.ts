import { BookTitleCannotBeEmpty } from './exceptions/book-title-cannot-be-empty.exception';
import { BookTitleCannotExceed255Characters } from './exceptions/book-title-cannot-exceed-255-characters.exception';

export class BookTitle {
  private constructor(private readonly _value: string) {}

  static create(value: string): BookTitle {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      throw new BookTitleCannotBeEmpty();
    }
    if (trimmed.length > 255) {
      throw new BookTitleCannotExceed255Characters();
    }
    return new BookTitle(trimmed);
  }

  get value(): string {
    return this._value;
  }

  equals(other: BookTitle): boolean {
    return this._value === other._value;
  }
}
