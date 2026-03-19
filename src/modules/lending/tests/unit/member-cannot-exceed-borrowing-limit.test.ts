import { describe, it, expect } from 'vitest';
import { MemberCannotExceedBorrowingLimit } from '@lending/domain/member/rules/member-cannot-exceed-borrowing-limit.rule';
import { BorrowingLimit } from '@lending/domain/member/borrowing-limit.vo';
import { MemberHasReachedBorrowingLimit } from '@lending/domain/member/exceptions/member-has-reached-borrowing-limit.exception';

describe('MemberCannotExceedBorrowingLimit', () => {
  it('is respected when under the limit', () => {
    const rule = new MemberCannotExceedBorrowingLimit(2, BorrowingLimit.create(3));
    expect(rule.isRespected()).toBe(true);
  });

  it('is not respected when at the limit', () => {
    const rule = new MemberCannotExceedBorrowingLimit(3, BorrowingLimit.create(3));
    expect(rule.isRespected()).toBe(false);
  });

  it('is not respected when over the limit', () => {
    const rule = new MemberCannotExceedBorrowingLimit(4, BorrowingLimit.create(3));
    expect(rule.isRespected()).toBe(false);
  });

  it('throws MemberHasReachedBorrowingLimit when checked and not respected', () => {
    const rule = new MemberCannotExceedBorrowingLimit(3, BorrowingLimit.create(3));
    expect(() => rule.check()).toThrow(MemberHasReachedBorrowingLimit);
  });
});
