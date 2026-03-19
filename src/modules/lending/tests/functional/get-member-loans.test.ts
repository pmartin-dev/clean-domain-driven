import { describe, it, expect } from 'vitest';
import { GetMemberLoans, MemberLoanDto } from '@lending/application/use-cases/queries/get-member-loans/get-member-loans.use-case';
import { GetMemberLoansQuery } from '@lending/application/use-cases/queries/get-member-loans/get-member-loans.query';
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
import { ClockInterface } from '@shared/domain/clock';
import { DomainException } from '@shared/domain/domain.exception';

class StubClock implements ClockInterface {
  constructor(private readonly date: Date) {}
  now(): Date {
    return this.date;
  }
}

class GetMemberLoansTestBuilder {
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

describe('GetMemberLoans', () => {
  it('returns active loans of a member', async () => {
    const start = new Date('2026-03-10');
    const due = new Date('2026-03-31');

    const { execute } = await new GetMemberLoansTestBuilder()
      .withActiveLoan('loan-1', 'book-1', start, due)
      .build();

    const result = await execute();

    expect(result).toHaveLength(1);
    expect(result[0].loanId).toBe('loan-1');
    expect(result[0].bookReference).toBe('book-1');
  });

  it('returns an empty list when member has no loans', async () => {
    const { execute } = await new GetMemberLoansTestBuilder().build();

    const result = await execute();

    expect(result).toEqual([]);
  });

  it('marks overdue loans as isOverdue true', async () => {
    const start = new Date('2026-02-01');
    const due = new Date('2026-02-22');

    const { execute } = await new GetMemberLoansTestBuilder()
      .withNow(new Date('2026-03-19'))
      .withActiveLoan('loan-overdue', 'book-1', start, due)
      .build();

    const result = await execute();

    expect(result).toHaveLength(1);
    expect(result[0].isOverdue).toBe(true);
  });

  it('does not include returned loans', async () => {
    const { execute } = await new GetMemberLoansTestBuilder()
      .withReturnedLoan('loan-returned', 'book-1', new Date('2026-03-01'), new Date('2026-03-22'))
      .build();

    const result = await execute();

    expect(result).toEqual([]);
  });

  it('returns DTOs with all expected fields', async () => {
    const start = new Date('2026-03-10');
    const due = new Date('2026-03-31');

    const { execute } = await new GetMemberLoansTestBuilder()
      .withNow(new Date('2026-03-19'))
      .withActiveLoan('loan-1', 'book-abc', start, due)
      .build();

    const result = await execute();

    expect(result).toHaveLength(1);
    const dto: MemberLoanDto = result[0];
    expect(dto).toEqual({
      loanId: 'loan-1',
      bookReference: 'book-abc',
      startDate: start,
      dueDate: due,
      isOverdue: false,
    });
  });

  it('rejects when memberId is empty', async () => {
    const loansRepo = new LoansInMemoryRepository();
    const membersRepo = new MembersInMemoryRepository();
    const useCase = new GetMemberLoans(loansRepo, membersRepo, new StubClock(new Date('2026-03-19')));

    await expect(
      useCase.execute(new GetMemberLoansQuery('')),
    ).rejects.toThrow();
  });

  it('rejects when member does not exist', async () => {
    const { execute } = await new GetMemberLoansTestBuilder()
      .withoutMember()
      .build();

    await expect(execute()).rejects.toThrow(DomainException);
    await expect(execute()).rejects.toThrow('Member not found');
  });
});
