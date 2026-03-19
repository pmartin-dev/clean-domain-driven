import { Loan } from './loan.entity';
import { LoanId } from './loan-id.vo';
import { BookReference } from '../book-reference/book-reference.vo';
import { MemberId } from '../member/member-id.vo';

export interface LoansRepository {
  save(loan: Loan): Promise<void>;
  findById(id: LoanId): Promise<Loan | null>;
  findActiveByBookReference(bookReference: BookReference): Promise<Loan | null>;
  findActiveByMemberId(memberId: MemberId): Promise<Loan[]>;
}
