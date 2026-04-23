import { describe, it, expect } from 'vitest';
import { ZodError } from 'zod';
import { addBookBodySchema } from '@catalog/infrastructure/nestjs/catalog.schemas';

describe('addBookBodySchema', () => {
  it('accepts a valid body', () => {
    const result = addBookBodySchema.parse({
      isbn: '9780134685991',
      title: 'Clean Code',
      author: 'Robert C. Martin',
    });

    expect(result).toEqual({
      isbn: '9780134685991',
      title: 'Clean Code',
      author: 'Robert C. Martin',
    });
  });

  it('rejects a body with missing fields', () => {
    expect(() => addBookBodySchema.parse({ isbn: '9780134685991' })).toThrow(ZodError);
  });

  it('rejects a body with a non-string field', () => {
    expect(() =>
      addBookBodySchema.parse({ isbn: 123, title: 'Clean Code', author: 'Robert C. Martin' }),
    ).toThrow(ZodError);
  });

  it('rejects empty string fields', () => {
    expect(() =>
      addBookBodySchema.parse({ isbn: '', title: 'Clean Code', author: 'Robert C. Martin' }),
    ).toThrow(ZodError);
  });

  it('rejects an empty body', () => {
    expect(() => addBookBodySchema.parse({})).toThrow(ZodError);
  });

  it('rejects null', () => {
    expect(() => addBookBodySchema.parse(null)).toThrow(ZodError);
  });

  it('strips unknown fields', () => {
    const result = addBookBodySchema.parse({
      isbn: '9780134685991',
      title: 'Clean Code',
      author: 'Robert C. Martin',
      extra: 'should be stripped',
    });

    expect(result).not.toHaveProperty('extra');
  });
});
