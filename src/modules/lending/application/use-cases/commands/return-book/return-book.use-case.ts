import { DomainException } from '@shared/domain/domain.exception';
import { EventDispatcherInterface } from '@shared/domain/event-dispatcher.interface';
import { MembersRepository } from '@lending/domain/member/members-repository.interface';
import { LoansRepository } from '@lending/domain/loan/loans-repository.interface';
import { LoanId } from '@lending/domain/loan/loan-id.vo';
import { ReturnBookCommand } from './return-book.command';

export class ReturnBook {
  constructor(
    private readonly loansRepository: LoansRepository,
    private readonly membersRepository: MembersRepository,
    private readonly eventDispatcher: EventDispatcherInterface,
  ) {}

  async execute(command: ReturnBookCommand): Promise<void> {
    const loanId = LoanId.create(command.loanId);

    const loan = await this.loansRepository.findById(loanId);
    if (!loan) {
      throw new DomainException('Loan not found');
    }

    const member = await this.membersRepository.findById(loan.memberId);
    if (!member) {
      throw new DomainException('Member not found');
    }

    loan.markReturned();
    member.returnBook(loanId);

    const events = [...loan.pullDomainEvents(), ...member.pullDomainEvents()];

    await this.loansRepository.save(loan);
    await this.membersRepository.save(member);
    await this.eventDispatcher.dispatch(events);
  }
}
