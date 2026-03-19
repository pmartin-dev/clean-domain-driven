import { Controller, Post, Get, Body, Inject } from '@nestjs/common';
import { COMMAND_BUS, QUERY_BUS } from '@infrastructure/nestjs/cqrs/injection-tokens';
import { CommandBus } from '@infrastructure/nestjs/cqrs/command-bus';
import { QueryBus } from '@infrastructure/nestjs/cqrs/query-bus';
import { AddBookToCatalogCommand } from '@catalog/application/use-cases/commands/add-book-to-catalog/add-book-to-catalog.command';
import { GetAvailableBooksQuery } from '@catalog/application/use-cases/queries/get-available-books/get-available-books.query';
import { AvailableBookDto } from '@catalog/application/use-cases/queries/get-available-books/get-available-books.use-case';

@Controller('catalog/books')
export class CatalogController {
  constructor(
    @Inject(COMMAND_BUS) private readonly commandBus: CommandBus,
    @Inject(QUERY_BUS) private readonly queryBus: QueryBus,
  ) {}

  @Post()
  async addBook(@Body() body: { isbn: string; title: string; author: string }): Promise<{ id: string }> {
    const command = new AddBookToCatalogCommand(body.isbn, body.title, body.author);
    const id = await this.commandBus.execute<string>(command);
    return { id };
  }

  @Get()
  async getAvailableBooks(): Promise<AvailableBookDto[]> {
    return this.queryBus.execute<AvailableBookDto[]>(new GetAvailableBooksQuery());
  }
}
