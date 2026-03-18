import { DomainException } from '@shared/domain/domain.exception';

export class AuthorNameCannotExceed255Characters extends DomainException {
  constructor() {
    super('Author name cannot exceed 255 characters');
  }
}
