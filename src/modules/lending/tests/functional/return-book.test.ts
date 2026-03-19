import { describe, it, expect } from 'vitest';
import { ReturnBook } from '@lending/application/use-cases/commands/return-book/return-book.use-case';
import { ReturnBookCommand } from '@lending/application/use-cases/commands/return-book/return-book.command';
import { MembersInMemoryRepository } from '@lending/infrastructure/members.in-memory.repository';
import { LoansInMemoryRepository } from '@lending/infrastructure/loans.in-memory.repository';
import { Member } from '@lending/domain/member/member.entity';
import { MemberId } from '@lending/domain/member/member-id.vo';
import { MemberName } from '@lending/domain/member/member-name.vo';
import { BorrowingLimit } from '@lending/domain/member/borrowing-limit.vo';
import { Loan } from '@lending/domain/loan/loan.entity';
import { LoanId } from '@lending/domain/loan/loan-id.vo';
import { LoanPeriod } from '@lending/domain/loan/loan-period.vo';
import { BookReference } from '@lending/domain/book-reference/book-reference.vo';
import { DomainException } from '@shared/domain/domain.exception';
import { DomainEventDispatcher } from '@shared/domain/domain-event-dispatcher';

const now = new Date('2026-03-18');

class ReturnBookTestBuilder {
  private loanId = 'loan-1';
  private memberId = 'mem-1';
  private bookId = 'book-1';

  withLoanId(id: string): this { this.loanId = id; return this; }

  async build() {
    const membersRepo = new MembersInMemoryRepository();
    const loansRepo = new LoansInMemoryRepository();

    const member = Member.register(
      MemberId.create(this.memberId),
      MemberName.create('Alice Dupont'),
      BorrowingLimit.create(3),
    );
    member.borrow(LoanId.create(this.loanId), false);
    await membersRepo.save(member);

    const loan = Loan.create(
      LoanId.create(this.loanId),
      MemberId.create(this.memberId),
      BookReference.create(this.bookId),
      LoanPeriod.createFromNow(now),
    );
    await loansRepo.save(loan);

    const eventDispatcher = new DomainEventDispatcher();
    const useCase = new ReturnBook(loansRepo, membersRepo, eventDispatcher);

    return {
      execute: () => useCase.execute(new ReturnBookCommand(this.loanId)),
      membersRepo,
      loansRepo,
      eventDispatcher,
    };
  }
}

describe('ReturnBook', () => {
  it('marks the loan as returned', async () => {
    const { execute, loansRepo } = await new ReturnBookTestBuilder().build();

    await execute();

    const loan = await loansRepo.findById(LoanId.create('loan-1'));
    expect(loan!.isActive()).toBe(false);
  });

  it('decreases the member active loan count', async () => {
    const { execute, membersRepo } = await new ReturnBookTestBuilder().build();

    await execute();

    const member = await membersRepo.findById(MemberId.create('mem-1'));
    expect(member!.activeLoanCount).toBe(0);
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
