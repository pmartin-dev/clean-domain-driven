import { Module, OnModuleInit, Inject } from '@nestjs/common';
import {
  MEMBERS_REPOSITORY,
  LOANS_REPOSITORY,
  BOOK_REFERENCES_REPOSITORY,
  BORROW_BOOK,
  RETURN_BOOK,
  GET_MEMBER_LOANS,
} from './injection-tokens.js';
import { CLOCK, ID_GENERATOR, EVENT_DISPATCHER } from '@shared/infrastructure/nestjs/injection-tokens';
import { MembersInMemoryRepository } from '../members.in-memory.repository.js';
import { LoansInMemoryRepository } from '../loans.in-memory.repository.js';
import { BookReferencesInMemoryRepository } from '../book-references.in-memory.repository.js';
import { BorrowBook } from '@lending/application/use-cases/borrow-book.use-case';
import { ReturnBook } from '@lending/application/use-cases/return-book.use-case';
import { GetMemberLoans } from '@lending/application/use-cases/get-member-loans.use-case';
import { OnBookRegisteredHandler } from '@lending/application/event-handlers/on-book-registered.handler';
import { MembersRepository } from '@lending/domain/member/members-repository.interface';
import { LoansRepository } from '@lending/domain/loan/loans-repository.interface';
import { BookReferencesRepository } from '@lending/domain/book-reference/book-references-repository.interface';
import { EventDispatcherInterface, SubscribableEventDispatcher } from '@shared/domain/event-dispatcher.interface';
import { IdGeneratorInterface } from '@shared/domain/id-generator';
import { ClockInterface } from '@shared/domain/clock';
import { BOOK_REGISTERED } from '@shared/domain/domain-events';
import { LendingController } from './lending.controller.js';

@Module({
  controllers: [LendingController],
  providers: [
    {
      provide: MEMBERS_REPOSITORY,
      useFactory: () => new MembersInMemoryRepository(),
    },
    {
      provide: LOANS_REPOSITORY,
      useFactory: () => new LoansInMemoryRepository(),
    },
    {
      provide: BOOK_REFERENCES_REPOSITORY,
      useFactory: () => new BookReferencesInMemoryRepository(),
    },
    {
      provide: BORROW_BOOK,
      useFactory: (membersRepo: MembersRepository, loansRepo: LoansRepository, bookRefsRepo: BookReferencesRepository, idGenerator: IdGeneratorInterface, clock: ClockInterface, eventDispatcher: EventDispatcherInterface) =>
        new BorrowBook(membersRepo, loansRepo, bookRefsRepo, idGenerator, clock, eventDispatcher),
      inject: [MEMBERS_REPOSITORY, LOANS_REPOSITORY, BOOK_REFERENCES_REPOSITORY, ID_GENERATOR, CLOCK, EVENT_DISPATCHER],
    },
    {
      provide: RETURN_BOOK,
      useFactory: (loansRepo: LoansRepository, membersRepo: MembersRepository, eventDispatcher: EventDispatcherInterface) =>
        new ReturnBook(loansRepo, membersRepo, eventDispatcher),
      inject: [LOANS_REPOSITORY, MEMBERS_REPOSITORY, EVENT_DISPATCHER],
    },
    {
      provide: GET_MEMBER_LOANS,
      useFactory: (loansRepo: LoansRepository, membersRepo: MembersRepository, clock: ClockInterface) =>
        new GetMemberLoans(loansRepo, membersRepo, clock),
      inject: [LOANS_REPOSITORY, MEMBERS_REPOSITORY, CLOCK],
    },
  ],
})
export class LendingModule implements OnModuleInit {
  constructor(
    @Inject(EVENT_DISPATCHER) private readonly eventDispatcher: SubscribableEventDispatcher,
    @Inject(BOOK_REFERENCES_REPOSITORY) private readonly bookReferencesRepository: BookReferencesRepository,
  ) {}

  onModuleInit(): void {
    const onBookRegistered = new OnBookRegisteredHandler(this.bookReferencesRepository);
    this.eventDispatcher.subscribe(BOOK_REGISTERED, (event) => onBookRegistered.handle(event));
  }
}
