import { Rule } from '@shared/domain/rule';
import { IdGeneratorInterface } from '@shared/domain/id-generator';
import { ClockInterface } from '@shared/domain/clock';
import { EventDispatcherInterface } from '@shared/domain/event-dispatcher.interface';
import { DomainException } from '@shared/domain/domain.exception';
import { MembersRepository } from '@lending/domain/member/members-repository.interface';
import { LoansRepository } from '@lending/domain/loan/loans-repository.interface';
import { BookReferencesRepository } from '@lending/domain/book-reference/book-references-repository.interface';
import { MemberId } from '@lending/domain/member/member-id.vo';
import { LoanId } from '@lending/domain/loan/loan-id.vo';
import { LoanPeriod } from '@lending/domain/loan/loan-period.vo';
import { BookReference } from '@lending/domain/book-reference/book-reference.vo';
import { Loan } from '@lending/domain/loan/loan.entity';
import { BookMustBeAvailable } from '@lending/domain/loan/rules/book-must-be-available.rule';
import { BorrowBookCommand } from '@lending/application/commands/borrow-book/borrow-book.command';

export class BorrowBook {
  constructor(
    private readonly membersRepository: MembersRepository,
    private readonly loansRepository: LoansRepository,
    private readonly bookReferencesRepository: BookReferencesRepository,
    private readonly idGenerator: IdGeneratorInterface,
    private readonly clock: ClockInterface,
    private readonly eventDispatcher: EventDispatcherInterface,
  ) {}

  async execute(command: BorrowBookCommand): Promise<string> {
    const memberId = MemberId.create(command.memberId);
    const bookRef = BookReference.create(command.bookId);

    const member = await this.membersRepository.findById(memberId);
    if (!member) {
      throw new DomainException('Member not found');
    }

    const bookReference = await this.bookReferencesRepository.findById(bookRef);
    if (!bookReference) {
      throw new DomainException('Book not found in catalog');
    }

    const existingLoan = await this.loansRepository.findActiveByBookReference(bookReference);
    const activeLoans = await this.loansRepository.findActiveByMemberId(memberId);
    const now = this.clock.now();
    const hasOverdue = activeLoans.some((loan) => loan.isOverdue(now));

    Rule.checkAll([
      new BookMustBeAvailable(existingLoan !== null),
    ]);

    const loanId = LoanId.create(this.idGenerator.generate());
    const period = LoanPeriod.createFromNow(now);
    const loan = Loan.create(loanId, memberId, bookReference, period);

    member.borrow(loanId, hasOverdue);

    const events = [...loan.pullDomainEvents(), ...member.pullDomainEvents()];

    await this.loansRepository.save(loan);
    await this.membersRepository.save(member);
    await this.eventDispatcher.dispatch(events);

    return loanId.value;
  }
}
