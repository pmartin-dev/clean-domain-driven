import { DomainException } from '@shared/domain/domain.exception';

export class MemberIdCannotBeEmpty extends DomainException {
  constructor() {
    super('MemberId cannot be empty');
  }
}
