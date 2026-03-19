import { DomainException } from '@shared/domain/domain.exception';

export class MemberHasOverdueLoans extends DomainException {
  constructor() {
    super('Member has overdue loans and cannot borrow');
  }
}
