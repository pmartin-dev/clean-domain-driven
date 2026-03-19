import { MemberIdCannotBeEmpty } from './exceptions/member-id-cannot-be-empty.exception';
import { MemberIdCannotContainWhitespace } from './exceptions/member-id-cannot-contain-whitespace.exception';

export class MemberId {
  private constructor(private readonly _value: string) {}

  static create(value: string): MemberId {
    if (!value || value.trim().length === 0) {
      throw new MemberIdCannotBeEmpty();
    }
    if (/\s/.test(value)) {
      throw new MemberIdCannotContainWhitespace();
    }
    return new MemberId(value);
  }

  get value(): string {
    return this._value;
  }

  equals(other: MemberId): boolean {
    return this._value === other._value;
  }
}
