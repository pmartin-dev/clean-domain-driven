import { describe, it, expect } from 'vitest';
import { BookReference } from '@lending/domain/book-reference/book-reference.vo';
import { BookReferenceCannotBeEmpty } from '@lending/domain/book-reference/exceptions/book-reference-cannot-be-empty.exception';
import { BookReferenceCannotContainWhitespace } from '@lending/domain/book-reference/exceptions/book-reference-cannot-contain-whitespace.exception';

describe('BookReference', () => {
  it('creates a valid book reference', () => {
    expect(BookReference.create('book-123').value).toBe('book-123');
  });

  it('two references with the same value are equal', () => {
    expect(BookReference.create('book-1').equals(BookReference.create('book-1'))).toBe(true);
  });

  it('rejects an empty reference', () => {
    expect(() => BookReference.create('')).toThrow(BookReferenceCannotBeEmpty);
  });

  it('rejects a reference with whitespace', () => {
    expect(() => BookReference.create('book 1')).toThrow(BookReferenceCannotContainWhitespace);
  });
});
