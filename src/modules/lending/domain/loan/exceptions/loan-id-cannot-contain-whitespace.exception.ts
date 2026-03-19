import { DomainException } from '@shared/domain/domain.exception';

export class LoanIdCannotContainWhitespace extends DomainException {
  constructor() {
    super('LoanId cannot contain whitespace');
  }
}
