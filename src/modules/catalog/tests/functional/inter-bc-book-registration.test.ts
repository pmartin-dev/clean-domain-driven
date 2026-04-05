import { describe, it, expect } from 'vitest';
import { BookReference } from '@lending/domain/book-reference/book-reference.vo';
import { DomainException } from '@shared/domain/domain.exception';
import { InterBcTestBuilder } from './inter-bc-book-registration.builder';

describe('Inter-BC: Catalog → Lending', () => {
  it('creates a BookReference in Lending when a book is registered in Catalog', async () => {
    const { execute, bookReferencesRepository } = new InterBcTestBuilder()
      .withGeneratedId('book-42')
      .build();

    await execute();

    const bookRef = await bookReferencesRepository.findById(BookReference.create('book-42'));
    expect(bookRef).not.toBeNull();
  });

  it('does not create a BookReference when book registration fails', async () => {
    const { execute, bookReferencesRepository } = new InterBcTestBuilder()
      .withGeneratedId('book-1')
      .withIsbn('invalid-isbn')
      .build();

    await expect(execute()).rejects.toThrow(DomainException);

    const bookRef = await bookReferencesRepository.findById(BookReference.create('book-1'));
    expect(bookRef).toBeNull();
  });
});
