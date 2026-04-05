import { GetMemberLoans } from '@lending/application/use-cases/get-member-loans.use-case';
import { GetMemberLoansQuery } from '@lending/application/queries/get-member-loans/get-member-loans.query';
import { LoansInMemoryRepository } from '@lending/infrastructure/loans.in-memory.repository';
import { MembersInMemoryRepository } from '@lending/infrastructure/members.in-memory.repository';
import { Loan } from '@lending/domain/loan/loan.entity';
import { LoanId } from '@lending/domain/loan/loan-id.vo';
import { LoanPeriod } from '@lending/domain/loan/loan-period.vo';
import { BookReference } from '@lending/domain/book-reference/book-reference.vo';
import { Member } from '@lending/domain/member/member.entity';
import { MemberId } from '@lending/domain/member/member-id.vo';
import { MemberName } from '@lending/domain/member/member-name.vo';
import { BorrowingLimit } from '@lending/domain/member/borrowing-limit.vo';
import { StubClock } from '@shared/tests/stubs/stub-clock';

export class GetMemberLoansTestBuilder {
  private memberId = 'mem-1';
  private loans: Loan[] = [];
  private now = new Date('2026-03-19');
  private seedMember = true;

  withMemberId(id: string): this {
    this.memberId = id;
    return this;
  }

  withActiveLoan(loanId: string, bookRef: string, start: Date, dueDate: Date): this {
    const loan = Loan.create(
      LoanId.create(loanId),
      MemberId.create(this.memberId),
      BookReference.create(bookRef),
      LoanPeriod.create(start, dueDate),
    );
    this.loans.push(loan);
    return this;
  }

  withReturnedLoan(loanId: string, bookRef: string, start: Date, dueDate: Date): this {
    const loan = Loan.create(
      LoanId.create(loanId),
      MemberId.create(this.memberId),
      BookReference.create(bookRef),
      LoanPeriod.create(start, dueDate),
    );
    loan.markReturned();
    this.loans.push(loan);
    return this;
  }

  withNow(date: Date): this {
    this.now = date;
    return this;
  }

  withoutMember(): this {
    this.seedMember = false;
    return this;
  }

  async build() {
    const loansRepo = new LoansInMemoryRepository();
    const membersRepo = new MembersInMemoryRepository();

    if (this.seedMember) {
      const member = Member.register(
        MemberId.create(this.memberId),
        MemberName.create('Alice Dupont'),
        BorrowingLimit.create(3),
      );
      await membersRepo.save(member);
    }

    for (const loan of this.loans) {
      await loansRepo.save(loan);
    }

    const useCase = new GetMemberLoans(loansRepo, membersRepo, new StubClock(this.now));

    return {
      execute: () => useCase.execute(new GetMemberLoansQuery(this.memberId)),
      loansRepo,
      membersRepo,
    };
  }
}
