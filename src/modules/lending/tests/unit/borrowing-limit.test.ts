import { describe, it, expect } from 'vitest';
import { BorrowingLimit } from '@lending/domain/member/borrowing-limit.vo';
import { BorrowingLimitMustBePositive } from '@lending/domain/member/exceptions/borrowing-limit-must-be-positive.exception';
import { BorrowingLimitCannotExceed10 } from '@lending/domain/member/exceptions/borrowing-limit-cannot-exceed-10.exception';

describe('BorrowingLimit', () => {
  it('creates a valid borrowing limit', () => {
    expect(BorrowingLimit.create(3).value).toBe(3);
  });

  it('rejects zero', () => {
    expect(() => BorrowingLimit.create(0)).toThrow(BorrowingLimitMustBePositive);
  });

  it('rejects negative values', () => {
    expect(() => BorrowingLimit.create(-1)).toThrow(BorrowingLimitMustBePositive);
  });

  it('rejects non-integer values', () => {
    expect(() => BorrowingLimit.create(2.5)).toThrow(BorrowingLimitMustBePositive);
  });

  it('rejects values exceeding 10', () => {
    expect(() => BorrowingLimit.create(11)).toThrow(BorrowingLimitCannotExceed10);
  });

  it('accepts a limit of exactly 10', () => {
    expect(BorrowingLimit.create(10).value).toBe(10);
  });

  it('allows borrowing when under the limit', () => {
    expect(BorrowingLimit.create(3).allows(2)).toBe(true);
  });

  it('does not allow borrowing when at the limit', () => {
    expect(BorrowingLimit.create(3).allows(3)).toBe(false);
  });

  it('two limits with the same value are equal', () => {
    expect(BorrowingLimit.create(3).equals(BorrowingLimit.create(3))).toBe(true);
  });
});
