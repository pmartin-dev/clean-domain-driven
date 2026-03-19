import { DomainException } from '@shared/domain/domain.exception';

export class LoanIsNotActiveForMember extends DomainException {
  constructor() {
    super('Loan is not active for this member');
  }
}
