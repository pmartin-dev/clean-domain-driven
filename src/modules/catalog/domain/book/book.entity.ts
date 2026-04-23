import { AggregateRoot } from '@shared/domain/aggregate-root';
import { BookId } from './book-id.vo';
import { ISBN } from './isbn.vo';
import { BookTitle } from './book-title.vo';
import { Author } from './author.vo';
import { BookRegisteredEvent } from './events/book-registered.event';

export class Book extends AggregateRoot {
  private constructor(
    private readonly _id: BookId,
    private readonly _isbn: ISBN,
    private readonly _title: BookTitle,
    private readonly _author: Author,
  ) {
    super();
  }

  static register(id: BookId, isbn: ISBN, title: BookTitle, author: Author): Book {
    const book = new Book(id, isbn, title, author);
    book.raise(new BookRegisteredEvent(id.value));
    return book;
  }

  get id(): BookId {
    return this._id;
  }

  toSnapshot(): { id: string; isbn: string; title: string; author: string } {
    return {
      id: this._id.value,
      isbn: this._isbn.value,
      title: this._title.value,
      author: this._author.value,
    };
  }
}
