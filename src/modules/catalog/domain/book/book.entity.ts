import { BookId } from './book-id.vo';
import { ISBN } from './isbn.vo';
import { BookTitle } from './book-title.vo';
import { Author } from './author.vo';

export class Book {
  private constructor(
    private readonly _id: BookId,
    private readonly _isbn: ISBN,
    private readonly _title: BookTitle,
    private readonly _author: Author,
  ) {}

  static register(id: BookId, isbn: ISBN, title: BookTitle, author: Author): Book {
    return new Book(id, isbn, title, author);
  }

  get id(): BookId {
    return this._id;
  }

  get isbn(): ISBN {
    return this._isbn;
  }

  get title(): BookTitle {
    return this._title;
  }

  get author(): Author {
    return this._author;
  }
}
