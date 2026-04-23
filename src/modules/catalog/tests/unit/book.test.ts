import { describe, it, expect } from 'vitest';
import { Book } from '@catalog/domain/book/book.entity';
import { BookId } from '@catalog/domain/book/book-id.vo';
import { ISBN } from '@catalog/domain/book/isbn.vo';
import { BookTitle } from '@catalog/domain/book/book-title.vo';
import { Author } from '@catalog/domain/book/author.vo';

describe('Book', () => {
  it('registers a book with valid properties', () => {
    const book = Book.register(
      BookId.create('book-1'),
      ISBN.create('9780134685991'),
      BookTitle.create('Clean Code'),
      Author.create('Robert C. Martin'),
    );

    expect(book.toSnapshot()).toEqual({
      id: 'book-1',
      isbn: '9780134685991',
      title: 'Clean Code',
      author: 'Robert C. Martin',
    });
  });
});
