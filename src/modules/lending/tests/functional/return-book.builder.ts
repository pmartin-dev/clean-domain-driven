import { ReturnBook } from '@lending/application/use-cases/return-book.use-case';
import { ReturnBookCommand } from '@lending/application/commands/return-book/return-book.command';
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
import { DomainEventDispatcher } from '@shared/infrastructure/domain-event-dispatcher';

export class ReturnBookTestBuilder {
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
      LoanPeriod.createFromNow(new Date('2026-03-18')),
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
