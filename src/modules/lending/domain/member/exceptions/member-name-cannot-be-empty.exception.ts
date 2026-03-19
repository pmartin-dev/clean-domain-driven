import { DomainException } from '@shared/domain/domain.exception';

export class MemberNameCannotBeEmpty extends DomainException {
  constructor() {
    super('Member name cannot be empty');
  }
}
