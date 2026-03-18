import { describe, it, expect } from 'vitest';
import { ISBN } from '@catalog/domain/book/isbn.vo';
import { ISBNMustBeExactly13Digits } from '@catalog/domain/book/exceptions/isbn-must-be-exactly-13-digits.exception';
import { ISBNChecksumIsInvalid } from '@catalog/domain/book/exceptions/isbn-checksum-is-invalid.exception';

describe('ISBN', () => {
  it('creates a valid ISBN-13', () => {
    const isbn = ISBN.create('9780134685991');
    expect(isbn.value).toBe('9780134685991');
  });

  it('rejects an ISBN that is too short', () => {
    expect(() => ISBN.create('978013468')).toThrow(ISBNMustBeExactly13Digits);
  });

  it('rejects an ISBN that is too long', () => {
    expect(() => ISBN.create('97801346859910')).toThrow(ISBNMustBeExactly13Digits);
  });

  it('rejects an ISBN with non-digit characters', () => {
    expect(() => ISBN.create('978-0-13468599')).toThrow(ISBNMustBeExactly13Digits);
  });

  it('rejects an ISBN with an invalid checksum', () => {
    expect(() => ISBN.create('9780134685992')).toThrow(ISBNChecksumIsInvalid);
  });

  it('two ISBNs with the same value are equal', () => {
    const isbn1 = ISBN.create('9780134685991');
    const isbn2 = ISBN.create('9780134685991');
    expect(isbn1.equals(isbn2)).toBe(true);
  });

  it('two ISBNs with different values are not equal', () => {
    const isbn1 = ISBN.create('9780134685991');
    const isbn2 = ISBN.create('9780201633610');
    expect(isbn1.equals(isbn2)).toBe(false);
  });
});
