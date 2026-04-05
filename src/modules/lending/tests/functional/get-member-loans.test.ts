import { describe, it, expect } from 'vitest';
import { MemberLoanDto } from '@lending/application/use-cases/get-member-loans.use-case';
import { GetMemberLoans } from '@lending/application/use-cases/get-member-loans.use-case';
import { GetMemberLoansQuery } from '@lending/application/queries/get-member-loans/get-member-loans.query';
import { LoansInMemoryRepository } from '@lending/infrastructure/loans.in-memory.repository';
import { MembersInMemoryRepository } from '@lending/infrastructure/members.in-memory.repository';
import { DomainException } from '@shared/domain/domain.exception';
import { StubClock } from '@shared/tests/stubs/stub-clock';
import { GetMemberLoansTestBuilder } from './get-member-loans.builder';

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
