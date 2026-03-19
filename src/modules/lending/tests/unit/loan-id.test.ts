import { describe, it, expect } from 'vitest';
import { LoanId } from '@lending/domain/loan/loan-id.vo';
import { LoanIdCannotBeEmpty } from '@lending/domain/loan/exceptions/loan-id-cannot-be-empty.exception';
import { LoanIdCannotContainWhitespace } from '@lending/domain/loan/exceptions/loan-id-cannot-contain-whitespace.exception';

describe('LoanId', () => {
  it('creates a valid LoanId', () => {
    expect(LoanId.create('loan-123').value).toBe('loan-123');
  });

  it('two LoanIds with the same value are equal', () => {
    expect(LoanId.create('loan-1').equals(LoanId.create('loan-1'))).toBe(true);
  });

  it('rejects an empty LoanId', () => {
    expect(() => LoanId.create('')).toThrow(LoanIdCannotBeEmpty);
  });

  it('rejects a LoanId with whitespace', () => {
    expect(() => LoanId.create('loan 1')).toThrow(LoanIdCannotContainWhitespace);
  });
});
