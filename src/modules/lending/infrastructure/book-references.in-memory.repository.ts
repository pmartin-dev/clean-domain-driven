import { BookReferencesRepository } from '@lending/domain/book-reference/book-references-repository.interface';
import { BookReference } from '@lending/domain/book-reference/book-reference.vo';

export class BookReferencesInMemoryRepository implements BookReferencesRepository {
  private readonly refs = new Map<string, BookReference>();

  async save(bookReference: BookReference): Promise<void> {
    this.refs.set(bookReference.value, bookReference);
  }

  async findById(bookReference: BookReference): Promise<BookReference | null> {
    return this.refs.get(bookReference.value) ?? null;
  }
}
