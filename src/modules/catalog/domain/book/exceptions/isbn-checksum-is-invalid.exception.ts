import { DomainException } from '@shared/domain/domain.exception';

export class ISBNChecksumIsInvalid extends DomainException {
  constructor() {
    super('ISBN checksum is invalid');
  }
}
