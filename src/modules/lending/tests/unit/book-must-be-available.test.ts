import { describe, it, expect } from 'vitest';
import { BookMustBeAvailable } from '@lending/domain/loan/rules/book-must-be-available.rule';
import { BookIsAlreadyBorrowed } from '@lending/domain/loan/exceptions/book-is-already-borrowed.exception';

describe('BookMustBeAvailable', () => {
  it('is respected when the book is not borrowed', () => {
    const rule = new BookMustBeAvailable(false);
    expect(rule.isRespected()).toBe(true);
  });

  it('is not respected when the book is already borrowed', () => {
    const rule = new BookMustBeAvailable(true);
    expect(rule.isRespected()).toBe(false);
  });

  it('throws BookIsAlreadyBorrowed when checked and not respected', () => {
    const rule = new BookMustBeAvailable(true);
    expect(() => rule.check()).toThrow(BookIsAlreadyBorrowed);
  });
});
