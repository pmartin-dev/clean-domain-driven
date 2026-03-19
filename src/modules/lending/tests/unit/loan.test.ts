import { describe, it, expect } from 'vitest';
import { Loan } from '@lending/domain/loan/loan.entity';
import { LoanId } from '@lending/domain/loan/loan-id.vo';
import { LoanPeriod } from '@lending/domain/loan/loan-period.vo';
import { MemberId } from '@lending/domain/member/member-id.vo';
import { BookReference } from '@lending/domain/book-reference/book-reference.vo';
import { LoanIsAlreadyReturned } from '@lending/domain/loan/exceptions/loan-is-already-returned.exception';

const now = new Date('2026-03-18');

function createLoan() {
  return Loan.create(
    LoanId.create('loan-1'),
    MemberId.create('mem-1'),
    BookReference.create('book-1'),
    LoanPeriod.createFromNow(now),
  );
}

describe('Loan', () => {
  it('creates an active loan', () => {
    const loan = createLoan();
    expect(loan.isActive()).toBe(true);
    expect(loan.id.equals(LoanId.create('loan-1'))).toBe(true);
    expect(loan.memberId.equals(MemberId.create('mem-1'))).toBe(true);
    expect(loan.bookReference.equals(BookReference.create('book-1'))).toBe(true);
  });

  it('marks a loan as returned', () => {
    const loan = createLoan();
    loan.markReturned();
    expect(loan.isActive()).toBe(false);
  });

  it('rejects marking an already returned loan', () => {
    const loan = createLoan();
    loan.markReturned();
    expect(() => loan.markReturned()).toThrow(LoanIsAlreadyReturned);
  });

  it('detects an overdue loan', () => {
    const loan = createLoan();
    const afterDueDate = new Date('2026-04-10');
    expect(loan.isOverdue(afterDueDate)).toBe(true);
  });

  it('does not detect overdue before due date', () => {
    const loan = createLoan();
    const beforeDueDate = new Date('2026-03-25');
    expect(loan.isOverdue(beforeDueDate)).toBe(false);
  });

  it('returned loan is not overdue', () => {
    const loan = createLoan();
    loan.markReturned();
    const afterDueDate = new Date('2026-04-10');
    expect(loan.isOverdue(afterDueDate)).toBe(false);
  });
});
