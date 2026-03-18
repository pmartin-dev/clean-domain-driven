import { DomainException } from '@shared/domain/domain.exception';

export class BookTitleCannotBeEmpty extends DomainException {
  constructor() {
    super('Book title cannot be empty');
  }
}
