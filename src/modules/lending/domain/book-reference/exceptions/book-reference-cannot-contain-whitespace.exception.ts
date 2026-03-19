import { DomainException } from '@shared/domain/domain.exception';

export class BookReferenceCannotContainWhitespace extends DomainException {
  constructor() {
    super('Book reference cannot contain whitespace');
  }
}
