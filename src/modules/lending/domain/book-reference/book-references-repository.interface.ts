import { BookReference } from './book-reference.vo';

export interface BookReferencesRepository {
  save(bookReference: BookReference): Promise<void>;
  findById(bookReference: BookReference): Promise<BookReference | null>;
}
