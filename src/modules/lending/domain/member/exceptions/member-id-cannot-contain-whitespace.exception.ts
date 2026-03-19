import { DomainException } from '@shared/domain/domain.exception';

export class MemberIdCannotContainWhitespace extends DomainException {
  constructor() {
    super('MemberId cannot contain whitespace');
  }
}
