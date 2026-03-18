import { DomainException } from '@shared/domain/domain.exception';

export class BookIdCannotContainWhitespace extends DomainException {
  constructor() {
    super('BookId cannot contain whitespace');
  }
}
