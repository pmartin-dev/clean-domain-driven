import { LoansRepository } from '@lending/domain/loan/loans-repository.interface';
import { MembersRepository } from '@lending/domain/member/members-repository.interface';
import { ClockInterface } from '@shared/domain/clock';
import { DomainException } from '@shared/domain/domain.exception';
import { MemberId } from '@lending/domain/member/member-id.vo';
import { GetMemberLoansQuery } from '@lending/application/queries/get-member-loans/get-member-loans.query';

export interface MemberLoanDto {
  loanId: string;
  bookReference: string;
  startDate: Date;
  dueDate: Date;
  isOverdue: boolean;
}

export class GetMemberLoans {
  constructor(
    private readonly loansRepository: LoansRepository,
    private readonly membersRepository: MembersRepository,
    private readonly clock: ClockInterface,
  ) {}

  async execute(query: GetMemberLoansQuery): Promise<MemberLoanDto[]> {
    const memberId = MemberId.create(query.memberId);

    const member = await this.membersRepository.findById(memberId);
    if (!member) {
      throw new DomainException('Member not found');
    }

    const loans = await this.loansRepository.findActiveByMemberId(memberId);
    const now = this.clock.now();

    return loans.map((loan) => ({
      loanId: loan.id.value,
      bookReference: loan.bookReference.value,
      startDate: loan.period.start,
      dueDate: loan.period.dueDate,
      isOverdue: loan.isOverdue(now),
    }));
  }
}
