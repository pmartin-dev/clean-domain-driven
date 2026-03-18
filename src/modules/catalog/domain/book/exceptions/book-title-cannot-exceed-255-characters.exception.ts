import { DomainException } from '@shared/domain/domain.exception';

export class BookTitleCannotExceed255Characters extends DomainException {
  constructor() {
    super('Book title cannot exceed 255 characters');
  }
}
