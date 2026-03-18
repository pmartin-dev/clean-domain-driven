import { describe, it, expect } from 'vitest';
import { BookTitle } from '@catalog/domain/book/book-title.vo';
import { BookTitleCannotBeEmpty } from '@catalog/domain/book/exceptions/book-title-cannot-be-empty.exception';
import { BookTitleCannotExceed255Characters } from '@catalog/domain/book/exceptions/book-title-cannot-exceed-255-characters.exception';

describe('BookTitle', () => {
  it('creates a valid book title', () => {
    const title = BookTitle.create('Clean Code');
    expect(title.value).toBe('Clean Code');
  });

  it('rejects an empty title', () => {
    expect(() => BookTitle.create('')).toThrow(BookTitleCannotBeEmpty);
    expect(() => BookTitle.create('   ')).toThrow(BookTitleCannotBeEmpty);
  });

  it('rejects a title exceeding 255 characters', () => {
    const longTitle = 'A'.repeat(256);
    expect(() => BookTitle.create(longTitle)).toThrow(BookTitleCannotExceed255Characters);
  });

  it('accepts a title of exactly 255 characters', () => {
    const title = BookTitle.create('A'.repeat(255));
    expect(title.value).toHaveLength(255);
  });

  it('trims whitespace from the title', () => {
    const title = BookTitle.create('  Clean Code  ');
    expect(title.value).toBe('Clean Code');
  });

  it('two titles with the same value are equal', () => {
    const title1 = BookTitle.create('Clean Code');
    const title2 = BookTitle.create('Clean Code');
    expect(title1.equals(title2)).toBe(true);
  });
});
