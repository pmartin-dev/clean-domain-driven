import { describe, it, expect } from 'vitest';
import { BookId } from '@catalog/domain/book/book-id.vo';
import { BookTitle } from '@catalog/domain/book/book-title.vo';
import { DomainException } from '@shared/domain/domain.exception';
import { DomainEvent } from '@shared/domain/domain-event';
import { BOOK_REGISTERED } from '@shared/domain/domain-events';
import { AddBookToCatalogTestBuilder } from './add-book-to-catalog.builder';

describe('AddBookToCatalog', () => {
  it('adds a book to the catalog and returns its id', async () => {
    const { execute, repository } = new AddBookToCatalogTestBuilder()
      .withGeneratedId('book-42')
      .build();

    const result = await execute();

    expect(result).toBe('book-42');
    const persisted = await repository.findById(BookId.create('book-42'));
    expect(persisted).not.toBeNull();
    expect(persisted!.title.equals(BookTitle.create('Clean Code'))).toBe(true);
  });

  it('rejects a book with an invalid ISBN', async () => {
    const { execute } = new AddBookToCatalogTestBuilder()
      .withIsbn('invalid')
      .build();

    await expect(execute()).rejects.toThrow(DomainException);
  });

  it('dispatches a BookRegisteredEvent after registering', async () => {
    const { execute, eventDispatcher } = new AddBookToCatalogTestBuilder()
      .withGeneratedId('book-42')
      .build();
    const captured: DomainEvent[] = [];
    eventDispatcher.subscribe(BOOK_REGISTERED, async (e) => { captured.push(e); });

    await execute();

    expect(captured).toHaveLength(1);
    expect(captured[0].payload).toEqual({ bookId: 'book-42' });
  });

  it('does not persist the book when validation fails', async () => {
    const { execute, repository } = new AddBookToCatalogTestBuilder()
      .withGeneratedId('book-1')
      .withIsbn('invalid')
      .build();

    await expect(execute()).rejects.toThrow(DomainException);

    const persisted = await repository.findById(BookId.create('book-1'));
    expect(persisted).toBeNull();
  });
});
