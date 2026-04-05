import { BorrowBook } from '@lending/application/use-cases/borrow-book.use-case';
import { BorrowBookCommand } from '@lending/application/commands/borrow-book/borrow-book.command';
import { MembersInMemoryRepository } from '@lending/infrastructure/members.in-memory.repository';
import { LoansInMemoryRepository } from '@lending/infrastructure/loans.in-memory.repository';
import { BookReferencesInMemoryRepository } from '@lending/infrastructure/book-references.in-memory.repository';
import { Member } from '@lending/domain/member/member.entity';
import { MemberId } from '@lending/domain/member/member-id.vo';
import { MemberName } from '@lending/domain/member/member-name.vo';
import { BorrowingLimit } from '@lending/domain/member/borrowing-limit.vo';
import { BookReference } from '@lending/domain/book-reference/book-reference.vo';
import { LoanId } from '@lending/domain/loan/loan-id.vo';
import { Loan } from '@lending/domain/loan/loan.entity';
import { DomainEventDispatcher } from '@shared/infrastructure/domain-event-dispatcher';
import { StubIdGenerator } from '@shared/tests/stubs/stub-id-generator';
import { StubClock } from '@shared/tests/stubs/stub-clock';

export class BorrowBookTestBuilder {
  private memberId = 'mem-1';
  private memberName = 'Alice Dupont';
  private borrowingLimit = 3;
  private bookId = 'book-1';
  private generatedLoanId = 'loan-1';
  private now = new Date('2026-03-18');
  private existingLoans: Loan[] = [];
  private memberActiveLoans: LoanId[] = [];
  private seedMember = true;
  private seedBookReference = true;

  withMemberId(id: string): this { this.memberId = id; return this; }
  withBorrowingLimit(limit: number): this { this.borrowingLimit = limit; return this; }
  withBookId(id: string): this { this.bookId = id; return this; }
  withGeneratedLoanId(id: string): this { this.generatedLoanId = id; return this; }
  withNow(date: Date): this { this.now = date; return this; }
  withExistingActiveLoan(loan: Loan): this { this.existingLoans.push(loan); return this; }
  withMemberAlreadyBorrowed(loanId: string): this {
    this.memberActiveLoans.push(LoanId.create(loanId));
    return this;
  }
  withoutMember(): this { this.seedMember = false; return this; }
  withoutBookReference(): this { this.seedBookReference = false; return this; }

  async build() {
    const membersRepo = new MembersInMemoryRepository();
    const loansRepo = new LoansInMemoryRepository();
    const bookRefsRepo = new BookReferencesInMemoryRepository();

    if (this.seedMember) {
      const member = Member.register(
        MemberId.create(this.memberId),
        MemberName.create(this.memberName),
        BorrowingLimit.create(this.borrowingLimit),
      );
      for (const loanId of this.memberActiveLoans) {
        member.borrow(loanId, false);
      }
      await membersRepo.save(member);
    }

    if (this.seedBookReference) {
      await bookRefsRepo.save(BookReference.create(this.bookId));
    }

    for (const loan of this.existingLoans) {
      await loansRepo.save(loan);
    }

    const eventDispatcher = new DomainEventDispatcher();
    const useCase = new BorrowBook(
      membersRepo,
      loansRepo,
      bookRefsRepo,
      new StubIdGenerator(this.generatedLoanId),
      new StubClock(this.now),
      eventDispatcher,
    );

    return {
      execute: () => useCase.execute(new BorrowBookCommand(this.memberId, this.bookId)),
      membersRepo,
      loansRepo,
      eventDispatcher,
    };
  }
}
