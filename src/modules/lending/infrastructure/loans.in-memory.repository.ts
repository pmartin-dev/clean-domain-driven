import { LoansRepository } from '@lending/domain/loan/loans-repository.interface';
import { Loan } from '@lending/domain/loan/loan.entity';
import { LoanId } from '@lending/domain/loan/loan-id.vo';
import { BookReference } from '@lending/domain/book-reference/book-reference.vo';
import { MemberId } from '@lending/domain/member/member-id.vo';

export class LoansInMemoryRepository implements LoansRepository {
  private readonly loans = new Map<string, Loan>();

  async save(loan: Loan): Promise<void> {
    this.loans.set(loan.id.value, loan);
  }

  async findById(id: LoanId): Promise<Loan | null> {
    return this.loans.get(id.value) ?? null;
  }

  async findActiveByBookReference(bookReference: BookReference): Promise<Loan | null> {
    for (const loan of this.loans.values()) {
      if (loan.isActive() && loan.bookReference.equals(bookReference)) {
        return loan;
      }
    }
    return null;
  }

  async findActiveByMemberId(memberId: MemberId): Promise<Loan[]> {
    const result: Loan[] = [];
    for (const loan of this.loans.values()) {
      if (loan.isActive() && loan.memberId.equals(memberId)) {
        result.push(loan);
      }
    }
    return result;
  }
}
