import { DomainException } from '@shared/domain/domain.exception';

export class BookIdCannotBeEmpty extends DomainException {
  constructor() {
    super('BookId cannot be empty');
  }
}
