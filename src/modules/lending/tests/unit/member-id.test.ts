import { describe, it, expect } from 'vitest';
import { MemberId } from '@lending/domain/member/member-id.vo';
import { MemberIdCannotBeEmpty } from '@lending/domain/member/exceptions/member-id-cannot-be-empty.exception';
import { MemberIdCannotContainWhitespace } from '@lending/domain/member/exceptions/member-id-cannot-contain-whitespace.exception';

describe('MemberId', () => {
  it('creates a valid MemberId', () => {
    const id = MemberId.create('mem-123');
    expect(id.value).toBe('mem-123');
  });

  it('two MemberIds with the same value are equal', () => {
    expect(MemberId.create('mem-1').equals(MemberId.create('mem-1'))).toBe(true);
  });

  it('two MemberIds with different values are not equal', () => {
    expect(MemberId.create('mem-1').equals(MemberId.create('mem-2'))).toBe(false);
  });

  it('rejects an empty MemberId', () => {
    expect(() => MemberId.create('')).toThrow(MemberIdCannotBeEmpty);
    expect(() => MemberId.create('   ')).toThrow(MemberIdCannotBeEmpty);
  });

  it('rejects a MemberId with whitespace', () => {
    expect(() => MemberId.create(' mem-1 ')).toThrow(MemberIdCannotContainWhitespace);
    expect(() => MemberId.create('mem 1')).toThrow(MemberIdCannotContainWhitespace);
  });
});
