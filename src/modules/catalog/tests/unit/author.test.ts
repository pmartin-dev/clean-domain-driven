import { describe, it, expect } from 'vitest';
import { Author } from '@catalog/domain/book/author.vo';
import { AuthorNameCannotBeEmpty } from '@catalog/domain/book/exceptions/author-name-cannot-be-empty.exception';
import { AuthorNameCannotExceed255Characters } from '@catalog/domain/book/exceptions/author-name-cannot-exceed-255-characters.exception';

describe('Author', () => {
  it('creates a valid author', () => {
    const author = Author.create('Robert C. Martin');
    expect(author.value).toBe('Robert C. Martin');
  });

  it('rejects an empty author name', () => {
    expect(() => Author.create('')).toThrow(AuthorNameCannotBeEmpty);
    expect(() => Author.create('   ')).toThrow(AuthorNameCannotBeEmpty);
  });

  it('rejects an author name exceeding 255 characters', () => {
    expect(() => Author.create('A'.repeat(256))).toThrow(AuthorNameCannotExceed255Characters);
  });

  it('accepts an author name of exactly 255 characters', () => {
    const author = Author.create('A'.repeat(255));
    expect(author.value).toHaveLength(255);
  });

  it('trims whitespace from the author name', () => {
    const author = Author.create('  Robert C. Martin  ');
    expect(author.value).toBe('Robert C. Martin');
  });

  it('two authors with the same name are equal', () => {
    const author1 = Author.create('Robert C. Martin');
    const author2 = Author.create('Robert C. Martin');
    expect(author1.equals(author2)).toBe(true);
  });
});
