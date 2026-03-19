import { DomainException } from '@shared/domain/domain.exception';

export class LoanIdCannotBeEmpty extends DomainException {
  constructor() {
    super('LoanId cannot be empty');
  }
}
