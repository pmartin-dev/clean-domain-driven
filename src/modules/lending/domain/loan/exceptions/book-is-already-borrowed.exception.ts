import { DomainException } from '@shared/domain/domain.exception';

export class BookIsAlreadyBorrowed extends DomainException {
  constructor() {
    super('Book is already borrowed');
  }
}
