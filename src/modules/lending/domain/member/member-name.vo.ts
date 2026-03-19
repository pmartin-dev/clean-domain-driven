import { MemberNameCannotBeEmpty } from './exceptions/member-name-cannot-be-empty.exception';
import { MemberNameCannotExceed255Characters } from './exceptions/member-name-cannot-exceed-255-characters.exception';

export class MemberName {
  private constructor(private readonly _value: string) {}

  static create(value: string): MemberName {
    const trimmed = value.trim();
    if (trimmed.length === 0) {
      throw new MemberNameCannotBeEmpty();
    }
    if (trimmed.length > 255) {
      throw new MemberNameCannotExceed255Characters();
    }
    return new MemberName(trimmed);
  }

  get value(): string {
    return this._value;
  }

  equals(other: MemberName): boolean {
    return this._value === other._value;
  }
}
