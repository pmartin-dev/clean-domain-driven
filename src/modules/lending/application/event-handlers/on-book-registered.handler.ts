import { DomainEvent } from '@shared/domain/domain-event';
import { BookReferencesRepository } from '@lending/domain/book-reference/book-references-repository.interface';
import { BookReference } from '@lending/domain/book-reference/book-reference.vo';

export class OnBookRegisteredHandler {
  constructor(private readonly bookReferencesRepository: BookReferencesRepository) {}

  async handle(event: DomainEvent): Promise<void> {
    const rawId = event.payload.bookId;
    if (typeof rawId !== 'string') {
      throw new Error(`Invalid bookId in catalog::book-registered payload: ${String(rawId)}`);
    }
    const bookReference = BookReference.create(rawId);
    await this.bookReferencesRepository.save(bookReference);
  }
}
