import { describe, it, expect } from 'vitest';
import { MemberId } from '@lending/domain/member/member-id.vo';
import { LoanId } from '@lending/domain/loan/loan-id.vo';
import { LoanPeriod } from '@lending/domain/loan/loan-period.vo';
import { Loan } from '@lending/domain/loan/loan.entity';
import { BookReference } from '@lending/domain/book-reference/book-reference.vo';
import { DomainException } from '@shared/domain/domain.exception';
import { BorrowBookTestBuilder } from './borrow-book.builder';

describe('BorrowBook', () => {
  it('creates a loan and returns its id', async () => {
    const { execute, loansRepo } = await new BorrowBookTestBuilder()
      .withGeneratedLoanId('loan-42')
      .build();

    const loanId = await execute();

    expect(loanId).toBe('loan-42');
    const loan = await loansRepo.findById(LoanId.create('loan-42'));
    expect(loan).not.toBeNull();
    expect(loan!.isActive()).toBe(true);
  });

  it('increments member active loan count', async () => {
    const { execute, membersRepo } = await new BorrowBookTestBuilder().build();

    await execute();

    const member = await membersRepo.findById(MemberId.create('mem-1'));
    expect(member!.activeLoanCount).toBe(1);
  });

  it('rejects when member has reached borrowing limit', async () => {
    const { execute } = await new BorrowBookTestBuilder()
      .withBorrowingLimit(2)
      .withMemberAlreadyBorrowed('loan-a')
      .withMemberAlreadyBorrowed('loan-b')
      .build();

    await expect(execute()).rejects.toThrow(DomainException);
  });

  it('rejects when the book is already borrowed', async () => {
    const now = new Date('2026-03-18');
    const existingLoan = Loan.create(
      LoanId.create('loan-existing'),
      MemberId.create('mem-other'),
      BookReference.create('book-1'),
      LoanPeriod.createFromNow(now),
    );

    const { execute } = await new BorrowBookTestBuilder()
      .withExistingActiveLoan(existingLoan)
      .build();

    await expect(execute()).rejects.toThrow('Book is already borrowed');
  });

  it('rejects when member has overdue loans', async () => {
    const pastDate = new Date('2026-02-01');
    const overdueLoan = Loan.create(
      LoanId.create('loan-overdue'),
      MemberId.create('mem-1'),
      BookReference.create('book-old'),
      LoanPeriod.createFromNow(pastDate, 14),
    );

    const { execute } = await new BorrowBookTestBuilder()
      .withMemberAlreadyBorrowed('loan-overdue')
      .withExistingActiveLoan(overdueLoan)
      .build();

    await expect(execute()).rejects.toThrow('Member has overdue loans and cannot borrow');
  });

  it('rejects when member does not exist', async () => {
    const { execute } = await new BorrowBookTestBuilder()
      .withoutMember()
      .build();

    await expect(execute()).rejects.toThrow('Member not found');
  });

  it('rejects when book reference does not exist', async () => {
    const { execute } = await new BorrowBookTestBuilder()
      .withoutBookReference()
      .build();

    await expect(execute()).rejects.toThrow('Book not found in catalog');
  });
});
