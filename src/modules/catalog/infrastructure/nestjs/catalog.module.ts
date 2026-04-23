import { Module, OnModuleInit, Inject } from '@nestjs/common';
import {
  BOOKS_REPOSITORY,
  BORROWED_BOOK_REGISTRY,
  ADD_BOOK_TO_CATALOG,
  GET_AVAILABLE_BOOKS,
} from './injection-tokens.js';
import { ID_GENERATOR, EVENT_DISPATCHER } from '@shared/infrastructure/nestjs/injection-tokens';
import { BooksInMemoryRepository } from '../books.in-memory.repository.js';
import { BorrowedBookRegistryInMemory } from '../borrowed-book-registry.in-memory.js';
import { AddBookToCatalog } from '@catalog/application/use-cases/add-book-to-catalog.use-case';
import { GetAvailableBooks } from '@catalog/application/use-cases/get-available-books.use-case';
import { OnBookBorrowedHandler } from '@catalog/application/event-handlers/on-book-borrowed.handler';
import { OnBookReturnedHandler } from '@catalog/application/event-handlers/on-book-returned.handler';
import { BooksRepository } from '@catalog/domain/book/books-repository.interface';
import { BorrowedBookRegistry } from '@catalog/domain/book/borrowed-book-registry.interface';
import { SubscribableEventDispatcher, EventDispatcherInterface } from '@shared/domain/event-dispatcher.interface';
import { IdGeneratorInterface } from '@shared/domain/id-generator';
import { BOOK_BORROWED, BOOK_RETURNED } from '@shared/domain/domain-events';
import { CatalogController } from './catalog.controller.js';

@Module({
  controllers: [CatalogController],
  providers: [
    {
      provide: BOOKS_REPOSITORY,
      useFactory: () => new BooksInMemoryRepository(),
    },
    {
      provide: BORROWED_BOOK_REGISTRY,
      useFactory: () => new BorrowedBookRegistryInMemory(),
    },
    {
      provide: ADD_BOOK_TO_CATALOG,
      useFactory: (booksRepository: BooksRepository, idGenerator: IdGeneratorInterface, eventDispatcher: EventDispatcherInterface) =>
        new AddBookToCatalog(booksRepository, idGenerator, eventDispatcher),
      inject: [BOOKS_REPOSITORY, ID_GENERATOR, EVENT_DISPATCHER],
    },
    {
      provide: GET_AVAILABLE_BOOKS,
      useFactory: (booksRepository: BooksRepository, borrowedBookRegistry: BorrowedBookRegistry) =>
        new GetAvailableBooks(booksRepository, borrowedBookRegistry),
      inject: [BOOKS_REPOSITORY, BORROWED_BOOK_REGISTRY],
    },
  ],
})
export class CatalogModule implements OnModuleInit {
  constructor(
    @Inject(EVENT_DISPATCHER) private readonly eventDispatcher: SubscribableEventDispatcher,
    @Inject(BORROWED_BOOK_REGISTRY) private readonly borrowedBookRegistry: BorrowedBookRegistry,
  ) {}

  onModuleInit(): void {
    const onBookBorrowed = new OnBookBorrowedHandler(this.borrowedBookRegistry);
    this.eventDispatcher.subscribe(BOOK_BORROWED, (event) => onBookBorrowed.handle(event));

    const onBookReturned = new OnBookReturnedHandler(this.borrowedBookRegistry);
    this.eventDispatcher.subscribe(BOOK_RETURNED, (event) => onBookReturned.handle(event));
  }
}
