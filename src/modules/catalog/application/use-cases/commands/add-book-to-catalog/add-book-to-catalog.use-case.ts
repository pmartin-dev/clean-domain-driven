import { BooksRepository } from '@catalog/domain/book/books-repository.interface';
import { IdGeneratorInterface } from '@shared/domain/id-generator';
import { Book } from '@catalog/domain/book/book.entity';
import { BookId } from '@catalog/domain/book/book-id.vo';
import { ISBN } from '@catalog/domain/book/isbn.vo';
import { BookTitle } from '@catalog/domain/book/book-title.vo';
import { Author } from '@catalog/domain/book/author.vo';
import { AddBookToCatalogCommand } from './add-book-to-catalog.command';

export class AddBookToCatalog {
  constructor(
    private readonly booksRepository: BooksRepository,
    private readonly idGenerator: IdGeneratorInterface,
  ) {}

  async execute(command: AddBookToCatalogCommand): Promise<string> {
    const bookId = BookId.create(this.idGenerator.generate());
    const book = Book.register(
      bookId,
      ISBN.create(command.isbn),
      BookTitle.create(command.title),
      Author.create(command.author),
    );

    await this.booksRepository.save(book);

    return bookId.value;
  }
}
