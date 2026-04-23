import { describe, it, expect } from 'vitest';
import { z } from 'zod';
import { UnprocessableEntityException } from '@nestjs/common';
import { ZodValidationPipe } from '@shared/infrastructure/nestjs/pipes/zod-validation.pipe';

describe('ZodValidationPipe', () => {
  const schema = z.object({ isbn: z.string(), title: z.string() });
  const pipe = new ZodValidationPipe(schema);

  it('returns parsed value for valid input', () => {
    const result = pipe.transform({ isbn: '9780134685991', title: 'Clean Code' });

    expect(result).toEqual({ isbn: '9780134685991', title: 'Clean Code' });
  });

  it('strips unknown fields', () => {
    const result = pipe.transform({ isbn: '9780134685991', title: 'Clean Code', extra: 'ignored' });

    expect(result).not.toHaveProperty('extra');
  });

  it('throws UnprocessableEntityException with field-level errors for invalid input', () => {
    try {
      pipe.transform({ isbn: 42 });
      expect.unreachable('Should have thrown');
    } catch (error) {
      expect(error).toBeInstanceOf(UnprocessableEntityException);
      const response = (error as UnprocessableEntityException).getResponse() as {
        message: string;
        errors: Array<{ field: string; message: string }>;
      };
      expect(response.message).toBe('Validation failed');
      expect(response.errors.map((e) => e.field)).toContain('isbn');
      expect(response.errors.map((e) => e.field)).toContain('title');
    }
  });

  it('joins nested field paths with dots', () => {
    const nestedSchema = z.object({ address: z.object({ street: z.string() }) });
    const nestedPipe = new ZodValidationPipe(nestedSchema);

    try {
      nestedPipe.transform({ address: {} });
      expect.unreachable('Should have thrown');
    } catch (error) {
      const response = (error as UnprocessableEntityException).getResponse() as {
        errors: Array<{ field: string; message: string }>;
      };
      expect(response.errors[0].field).toBe('address.street');
    }
  });
});
