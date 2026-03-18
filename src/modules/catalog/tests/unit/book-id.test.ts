import { describe, it, expect } from 'vitest';
import { BookId } from '@catalog/domain/book/book-id.vo';
import { BookIdCannotBeEmpty } from '@catalog/domain/book/exceptions/book-id-cannot-be-empty.exception';
import { BookIdCannotContainWhitespace } from '@catalog/domain/book/exceptions/book-id-cannot-contain-whitespace.exception';

describe('BookId', () => {
  it('creates a BookId from a string', () => {
    const id = BookId.create('abc-123');
    expect(id.value).toBe('abc-123');
  });

  it('two BookIds with the same value are equal', () => {
    const id1 = BookId.create('abc-123');
    const id2 = BookId.create('abc-123');
    expect(id1.equals(id2)).toBe(true);
  });

  it('two BookIds with different values are not equal', () => {
    const id1 = BookId.create('abc-123');
    const id2 = BookId.create('def-456');
    expect(id1.equals(id2)).toBe(false);
  });

  it('rejects an empty BookId', () => {
    expect(() => BookId.create('')).toThrow(BookIdCannotBeEmpty);
    expect(() => BookId.create('   ')).toThrow(BookIdCannotBeEmpty);
  });

  it('rejects a BookId with leading or trailing whitespace', () => {
    expect(() => BookId.create(' book-1 ')).toThrow(BookIdCannotContainWhitespace);
  });

  it('rejects a BookId with internal whitespace', () => {
    expect(() => BookId.create('book 1')).toThrow(BookIdCannotContainWhitespace);
  });
});
