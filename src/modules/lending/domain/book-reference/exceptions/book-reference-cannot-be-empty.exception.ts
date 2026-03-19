import { DomainException } from '@shared/domain/domain.exception';

export class BookReferenceCannotBeEmpty extends DomainException {
  constructor() {
    super('Book reference cannot be empty');
  }
}
