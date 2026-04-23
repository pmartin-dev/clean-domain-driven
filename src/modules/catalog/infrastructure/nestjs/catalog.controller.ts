import { Controller, Post, Get, Body, Inject } from '@nestjs/common';
import { ADD_BOOK_TO_CATALOG, GET_AVAILABLE_BOOKS } from './injection-tokens.js';
import { AddBookToCatalog } from '@catalog/application/use-cases/add-book-to-catalog.use-case';
import { AddBookToCatalogCommand } from '@catalog/application/commands/add-book-to-catalog/add-book-to-catalog.command';
import { GetAvailableBooks, AvailableBookDto } from '@catalog/application/use-cases/get-available-books.use-case';
import { GetAvailableBooksQuery } from '@catalog/application/queries/get-available-books/get-available-books.query';
import { ZodValidationPipe } from '@shared/infrastructure/nestjs/pipes/zod-validation.pipe';
import { addBookBodySchema, type AddBookBody } from './catalog.schemas.js';

@Controller('catalog/books')
export class CatalogController {
  constructor(
    @Inject(ADD_BOOK_TO_CATALOG) private readonly addBookToCatalog: AddBookToCatalog,
    @Inject(GET_AVAILABLE_BOOKS) private readonly getAvailableBooksUseCase: GetAvailableBooks,
  ) {}

  @Post()
  async addBook(@Body(new ZodValidationPipe(addBookBodySchema)) body: AddBookBody): Promise<{ id: string }> {
    const command = new AddBookToCatalogCommand(body.isbn, body.title, body.author);
    const id = await this.addBookToCatalog.execute(command);
    return { id };
  }

  @Get()
  async getAvailableBooks(): Promise<AvailableBookDto[]> {
    return this.getAvailableBooksUseCase.execute(new GetAvailableBooksQuery());
  }
}
