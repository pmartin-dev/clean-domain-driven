import { DomainException } from '@shared/domain/domain.exception';
import { MembersRepository } from '@lending/domain/member/members-repository.interface';
import { LoansRepository } from '@lending/domain/loan/loans-repository.interface';
import { LoanId } from '@lending/domain/loan/loan-id.vo';
import { ReturnBookCommand } from './return-book.command';

export class ReturnBook {
  constructor(
    private readonly loansRepository: LoansRepository,
    private readonly membersRepository: MembersRepository,
  ) {}

  async execute(command: ReturnBookCommand): Promise<void> {
    const loanId = LoanId.create(command.loanId);

    const loan = await this.loansRepository.findById(loanId);
    if (!loan) {
      throw new DomainException('Loan not found');
    }

    loan.markReturned();

    const member = await this.membersRepository.findById(loan.memberId);
    if (!member) {
      throw new DomainException('Member not found');
    }

    member.returnBook(loanId);

    await this.loansRepository.save(loan);
    await this.membersRepository.save(member);
  }
}
