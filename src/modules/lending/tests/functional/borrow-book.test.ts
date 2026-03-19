import { describe, it, expect } from 'vitest';
import { BorrowBook } from '@lending/application/use-cases/commands/borrow-book/borrow-book.use-case';
import { BorrowBookCommand } from '@lending/application/use-cases/commands/borrow-book/borrow-book.command';
import { MembersInMemoryRepository } from '@lending/infrastructure/members.in-memory.repository';
import { LoansInMemoryRepository } from '@lending/infrastructure/loans.in-memory.repository';
import { BookReferencesInMemoryRepository } from '@lending/infrastructure/book-references.in-memory.repository';
import { Member } from '@lending/domain/member/member.entity';
import { MemberId } from '@lending/domain/member/member-id.vo';
import { MemberName } from '@lending/domain/member/member-name.vo';
import { BorrowingLimit } from '@lending/domain/member/borrowing-limit.vo';
import { BookReference } from '@lending/domain/book-reference/book-reference.vo';
import { LoanId } from '@lending/domain/loan/loan-id.vo';
import { LoanPeriod } from '@lending/domain/loan/loan-period.vo';
import { Loan } from '@lending/domain/loan/loan.entity';
import { DomainException } from '@shared/domain/domain.exception';
import { DomainEventDispatcher } from '@shared/domain/domain-event-dispatcher';
import { IdGeneratorInterface } from '@shared/domain/id-generator';
import { ClockInterface } from '@shared/domain/clock';

class StubIdGenerator implements IdGeneratorInterface {
  private readonly ids: string[];
  private index = 0;
  constructor(...ids: string[]) {
    this.ids = ids;
  }
  generate(): string {
    if (this.index >= this.ids.length) {
      throw new Error(`StubIdGenerator exhausted after ${this.ids.length} id(s)`);
    }
    return this.ids[this.index++];
  }
}

class StubClock implements ClockInterface {
  constructor(private readonly date: Date) {}
  now(): Date {
    return this.date;
  }
}

class BorrowBookTestBuilder {
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
