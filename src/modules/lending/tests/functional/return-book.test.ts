import { describe, it, expect } from 'vitest';
import { ReturnBook } from '@lending/application/use-cases/return-book.use-case';
import { ReturnBookCommand } from '@lending/application/commands/return-book/return-book.command';
import { MembersInMemoryRepository } from '@lending/infrastructure/members.in-memory.repository';
import { LoansInMemoryRepository } from '@lending/infrastructure/loans.in-memory.repository';
import { MemberId } from '@lending/domain/member/member-id.vo';
import { Loan } from '@lending/domain/loan/loan.entity';
import { LoanId } from '@lending/domain/loan/loan-id.vo';
import { LoanPeriod } from '@lending/domain/loan/loan-period.vo';
import { BookReference } from '@lending/domain/book-reference/book-reference.vo';
import { DomainException } from '@shared/domain/domain.exception';
import { DomainEventDispatcher } from '@shared/infrastructure/domain-event-dispatcher';
import { ReturnBookTestBuilder } from './return-book.builder';

const now = new Date('2026-03-18');

describe('ReturnBook', () => {
  it('marks the loan as returned', async () => {
    const { execute, loansRepo } = await new ReturnBookTestBuilder().build();

    await execute();

    const loan = await loansRepo.findById(LoanId.create('loan-1'));
    expect(loan!.isActive()).toBe(false);
  });

  it('removes the loan from member active loans', async () => {
    const { execute, membersRepo } = await new ReturnBookTestBuilder().build();

    await execute();

    const member = await membersRepo.findById(MemberId.create('mem-1'));
    expect(member!.hasActiveLoan(LoanId.create('loan-1'))).toBe(false);
  });

  it('rejects when loan does not exist', async () => {
    const loansRepo = new LoansInMemoryRepository();
    const membersRepo = new MembersInMemoryRepository();
    const useCase = new ReturnBook(loansRepo, membersRepo, new DomainEventDispatcher());

    await expect(
      useCase.execute(new ReturnBookCommand('loan-unknown')),
    ).rejects.toThrow('Loan not found');
  });

  it('rejects returning an already returned loan', async () => {
    const { execute } = await new ReturnBookTestBuilder().build();

    await execute();
    await expect(execute()).rejects.toThrow(DomainException);
  });

  it('rejects when member does not exist for the loan', async () => {
    const loansRepo = new LoansInMemoryRepository();
    const membersRepo = new MembersInMemoryRepository();
    const loan = Loan.create(
      LoanId.create('loan-orphan'),
      MemberId.create('mem-deleted'),
      BookReference.create('book-1'),
      LoanPeriod.createFromNow(now),
    );
    await loansRepo.save(loan);

    const useCase = new ReturnBook(loansRepo, membersRepo, new DomainEventDispatcher());

    await expect(
      useCase.execute(new ReturnBookCommand('loan-orphan')),
    ).rejects.toThrow('Member not found');
  });
});
