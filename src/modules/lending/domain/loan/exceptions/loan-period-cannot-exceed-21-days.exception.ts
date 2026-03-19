import { DomainException } from '@shared/domain/domain.exception';

export class LoanPeriodCannotExceed21Days extends DomainException {
  constructor() {
    super('Loan period cannot exceed 21 days');
  }
}
