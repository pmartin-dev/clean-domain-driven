import { describe, it, expect } from 'vitest';
import { ZodError } from 'zod';
import {
  borrowBookBodySchema,
  loanIdParamSchema,
  memberIdParamSchema,
} from '@lending/infrastructure/nestjs/lending.schemas';

describe('borrowBookBodySchema', () => {
  it('accepts a valid body', () => {
    const result = borrowBookBodySchema.parse({ memberId: 'mem-1', bookId: 'book-1' });

    expect(result).toEqual({ memberId: 'mem-1', bookId: 'book-1' });
  });

  it('rejects a body with missing memberId', () => {
    expect(() => borrowBookBodySchema.parse({ bookId: 'book-1' })).toThrow(ZodError);
  });

  it('rejects a body with missing bookId', () => {
    expect(() => borrowBookBodySchema.parse({ memberId: 'mem-1' })).toThrow(ZodError);
  });

  it('rejects a non-string memberId', () => {
    expect(() => borrowBookBodySchema.parse({ memberId: 42, bookId: 'book-1' })).toThrow(ZodError);
  });

  it('rejects empty string fields', () => {
    expect(() => borrowBookBodySchema.parse({ memberId: '', bookId: 'book-1' })).toThrow(ZodError);
  });

  it('rejects null', () => {
    expect(() => borrowBookBodySchema.parse(null)).toThrow(ZodError);
  });
});

describe('loanIdParamSchema', () => {
  it('accepts a valid loanId', () => {
    const result = loanIdParamSchema.parse({ loanId: 'loan-1' });

    expect(result).toEqual({ loanId: 'loan-1' });
  });

  it('rejects an empty loanId', () => {
    expect(() => loanIdParamSchema.parse({ loanId: '' })).toThrow(ZodError);
  });

  it('rejects a missing loanId', () => {
    expect(() => loanIdParamSchema.parse({})).toThrow(ZodError);
  });
});

describe('memberIdParamSchema', () => {
  it('accepts a valid memberId', () => {
    const result = memberIdParamSchema.parse({ memberId: 'mem-1' });

    expect(result).toEqual({ memberId: 'mem-1' });
  });

  it('rejects an empty memberId', () => {
    expect(() => memberIdParamSchema.parse({ memberId: '' })).toThrow(ZodError);
  });

  it('rejects a missing memberId', () => {
    expect(() => memberIdParamSchema.parse({})).toThrow(ZodError);
  });
});
