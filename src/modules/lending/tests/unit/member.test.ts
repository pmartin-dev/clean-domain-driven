import { describe, it, expect } from 'vitest';
import { Member } from '@lending/domain/member/member.entity';
import { MemberId } from '@lending/domain/member/member-id.vo';
import { MemberName } from '@lending/domain/member/member-name.vo';
import { BorrowingLimit } from '@lending/domain/member/borrowing-limit.vo';
import { LoanId } from '@lending/domain/loan/loan-id.vo';
import { MemberHasReachedBorrowingLimit } from '@lending/domain/member/exceptions/member-has-reached-borrowing-limit.exception';
import { MemberHasOverdueLoans } from '@lending/domain/member/exceptions/member-has-overdue-loans.exception';
import { LoanIsNotActiveForMember } from '@lending/domain/member/exceptions/loan-is-not-active-for-member.exception';

function createMember(limit = 3) {
  return Member.register(
    MemberId.create('mem-1'),
    MemberName.create('Alice Dupont'),
    BorrowingLimit.create(limit),
  );
}

describe('Member', () => {
  it('registers a member with no active loans', () => {
    const member = createMember();
    expect(member.id.equals(MemberId.create('mem-1'))).toBe(true);
    expect(member.name.equals(MemberName.create('Alice Dupont'))).toBe(true);
    expect(member.activeLoanCount).toBe(0);
  });

  it('allows borrowing when under the limit and no overdue loans', () => {
    const member = createMember(3);
    member.borrow(LoanId.create('loan-1'), false);
    expect(member.activeLoanCount).toBe(1);
    expect(member.hasActiveLoan(LoanId.create('loan-1'))).toBe(true);
  });

  it('rejects borrowing when at the limit', () => {
    const member = createMember(2);
    member.borrow(LoanId.create('loan-1'), false);
    member.borrow(LoanId.create('loan-2'), false);

    expect(() => member.borrow(LoanId.create('loan-3'), false)).toThrow(MemberHasReachedBorrowingLimit);
    expect(member.activeLoanCount).toBe(2);
  });

  it('rejects borrowing when member has overdue loans', () => {
    const member = createMember(3);
    expect(() => member.borrow(LoanId.create('loan-1'), true)).toThrow(MemberHasOverdueLoans);
    expect(member.activeLoanCount).toBe(0);
  });

  it('returns a book and decreases active loan count', () => {
    const member = createMember();
    member.borrow(LoanId.create('loan-1'), false);
    member.returnBook(LoanId.create('loan-1'));

    expect(member.activeLoanCount).toBe(0);
    expect(member.hasActiveLoan(LoanId.create('loan-1'))).toBe(false);
  });

  it('rejects returning a loan that is not active', () => {
    const member = createMember();
    expect(() => member.returnBook(LoanId.create('unknown'))).toThrow(LoanIsNotActiveForMember);
  });

  it('can borrow again after returning a book', () => {
    const member = createMember(1);
    member.borrow(LoanId.create('loan-1'), false);
    member.returnBook(LoanId.create('loan-1'));
    member.borrow(LoanId.create('loan-2'), false);

    expect(member.activeLoanCount).toBe(1);
  });
});
