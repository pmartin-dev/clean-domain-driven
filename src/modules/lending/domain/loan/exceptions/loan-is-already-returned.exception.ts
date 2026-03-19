import { DomainException } from '@shared/domain/domain.exception';

export class LoanIsAlreadyReturned extends DomainException {
  constructor() {
    super('Loan is already returned');
  }
}
