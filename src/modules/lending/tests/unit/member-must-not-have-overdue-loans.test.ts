import { describe, it, expect } from 'vitest';
import { MemberMustNotHaveOverdueLoans } from '@lending/domain/member/rules/member-must-not-have-overdue-loans.rule';
import { MemberHasOverdueLoans } from '@lending/domain/member/exceptions/member-has-overdue-loans.exception';

describe('MemberMustNotHaveOverdueLoans', () => {
  it('is respected when member has no overdue loans', () => {
    const rule = new MemberMustNotHaveOverdueLoans(false);
    expect(rule.isRespected()).toBe(true);
  });

  it('is not respected when member has overdue loans', () => {
    const rule = new MemberMustNotHaveOverdueLoans(true);
    expect(rule.isRespected()).toBe(false);
  });

  it('throws MemberHasOverdueLoans when checked and not respected', () => {
    const rule = new MemberMustNotHaveOverdueLoans(true);
    expect(() => rule.check()).toThrow(MemberHasOverdueLoans);
  });
});
