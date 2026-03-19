import { DomainException } from '@shared/domain/domain.exception';

export class LoanPeriodEndMustBeAfterStart extends DomainException {
  constructor() {
    super('Loan period end date must be after start date');
  }
}
