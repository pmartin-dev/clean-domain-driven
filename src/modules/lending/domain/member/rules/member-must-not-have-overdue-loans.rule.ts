import { Rule } from '@shared/domain/rule';
import { MemberHasOverdueLoans } from '../exceptions/member-has-overdue-loans.exception';

export class MemberMustNotHaveOverdueLoans extends Rule {
  constructor(
    private readonly hasOverdueLoans: boolean,
  ) {
    super();
  }

  isRespected(): boolean {
    return !this.hasOverdueLoans;
  }

  protected createError(): MemberHasOverdueLoans {
    return new MemberHasOverdueLoans();
  }
}
