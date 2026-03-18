import { AuthorNameCannotBeEmpty } from './exceptions/author-name-cannot-be-empty.exception';
import { AuthorNameCannotExceed255Characters } from './exceptions/author-name-cannot-exceed-255-characters.exception';

export class Author {
  private constructor(private readonly _value: string) {}

  static create(value: string): Author {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      throw new AuthorNameCannotBeEmpty();
    }
    if (trimmed.length > 255) {
      throw new AuthorNameCannotExceed255Characters();
    }
    return new Author(trimmed);
  }

  get value(): string {
    return this._value;
  }

  equals(other: Author): boolean {
    return this._value === other._value;
  }
}
