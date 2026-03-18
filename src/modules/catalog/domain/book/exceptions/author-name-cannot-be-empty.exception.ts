import { DomainException } from '@shared/domain/domain.exception';

export class AuthorNameCannotBeEmpty extends DomainException {
  constructor() {
    super('Author name cannot be empty');
  }
}
