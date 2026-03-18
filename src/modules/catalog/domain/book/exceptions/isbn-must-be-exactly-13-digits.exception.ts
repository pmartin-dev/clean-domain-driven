import { DomainException } from '@shared/domain/domain.exception';

export class ISBNMustBeExactly13Digits extends DomainException {
  constructor() {
    super('ISBN must be exactly 13 digits');
  }
}
