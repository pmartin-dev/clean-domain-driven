import { describe, it, expect } from 'vitest';
import { LoanPeriod } from '@lending/domain/loan/loan-period.vo';
import { LoanPeriodEndMustBeAfterStart } from '@lending/domain/loan/exceptions/loan-period-end-must-be-after-start.exception';
import { LoanPeriodCannotExceed21Days } from '@lending/domain/loan/exceptions/loan-period-cannot-exceed-21-days.exception';

describe('LoanPeriod', () => {
  const now = new Date('2026-03-18');

  it('creates a valid loan period', () => {
    const end = new Date('2026-04-01');
    const period = LoanPeriod.create(now, end);
    expect(period.start).toEqual(now);
    expect(period.dueDate).toEqual(end);
  });

  it('rejects a period where end is before start', () => {
    const before = new Date('2026-03-10');
    expect(() => LoanPeriod.create(now, before)).toThrow(LoanPeriodEndMustBeAfterStart);
  });

  it('rejects a period where end equals start', () => {
    expect(() => LoanPeriod.create(now, now)).toThrow(LoanPeriodEndMustBeAfterStart);
  });

  it('rejects a period exceeding 21 days', () => {
    const tooFar = new Date('2026-04-09'); // 22 days
    expect(() => LoanPeriod.create(now, tooFar)).toThrow(LoanPeriodCannotExceed21Days);
  });

  it('accepts a period of exactly 21 days', () => {
    const end = new Date('2026-04-08'); // exactly 21 days
    const period = LoanPeriod.create(now, end);
    expect(period.dueDate).toEqual(end);
  });

  it('creates a period from now with default 21 days', () => {
    const period = LoanPeriod.createFromNow(now);
    expect(period.start).toEqual(now);
    expect(period.dueDate).toEqual(new Date('2026-04-08'));
  });

  it('creates a period from now with custom days', () => {
    const period = LoanPeriod.createFromNow(now, 14);
    expect(period.dueDate).toEqual(new Date('2026-04-01'));
  });

  it('detects an overdue loan', () => {
    const period = LoanPeriod.create(now, new Date('2026-04-01'));
    expect(period.isOverdue(new Date('2026-04-02'))).toBe(true);
  });

  it('detects a non-overdue loan', () => {
    const period = LoanPeriod.create(now, new Date('2026-04-01'));
    expect(period.isOverdue(new Date('2026-03-30'))).toBe(false);
  });

  it('two periods with the same dates are equal', () => {
    const end = new Date('2026-04-01');
    expect(LoanPeriod.create(now, end).equals(LoanPeriod.create(now, end))).toBe(true);
  });
});
