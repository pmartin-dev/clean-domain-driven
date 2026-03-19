import { Rule } from '@shared/domain/rule';
import { BookIsAlreadyBorrowed } from '../exceptions/book-is-already-borrowed.exception';

export class BookMustBeAvailable extends Rule {
  constructor(
    private readonly isCurrentlyBorrowed: boolean,
  ) {
    super();
  }

  isRespected(): boolean {
    return !this.isCurrentlyBorrowed;
  }

  protected createError(): BookIsAlreadyBorrowed {
    return new BookIsAlreadyBorrowed();
  }
}
