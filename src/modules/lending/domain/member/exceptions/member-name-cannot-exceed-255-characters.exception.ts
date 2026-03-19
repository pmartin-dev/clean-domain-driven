import { DomainException } from '@shared/domain/domain.exception';

export class MemberNameCannotExceed255Characters extends DomainException {
  constructor() {
    super('Member name cannot exceed 255 characters');
  }
}
