import { Controller, Post, Get, Body, Param, Inject, HttpCode, HttpStatus } from '@nestjs/common';
import { BORROW_BOOK, RETURN_BOOK, GET_MEMBER_LOANS } from './injection-tokens.js';
import { BorrowBook } from '@lending/application/use-cases/borrow-book.use-case';
import { BorrowBookCommand } from '@lending/application/commands/borrow-book/borrow-book.command';
import { ReturnBook } from '@lending/application/use-cases/return-book.use-case';
import { ReturnBookCommand } from '@lending/application/commands/return-book/return-book.command';
import { GetMemberLoans, MemberLoanDto } from '@lending/application/use-cases/get-member-loans.use-case';
import { GetMemberLoansQuery } from '@lending/application/queries/get-member-loans/get-member-loans.query';
import { ZodValidationPipe } from '@shared/infrastructure/nestjs/pipes/zod-validation.pipe';
import {
  borrowBookBodySchema, loanIdParamSchema, memberIdParamSchema,
  type BorrowBookBody, type LoanIdParam, type MemberIdParam,
} from './lending.schemas.js';

@Controller('lending')
export class LendingController {
  constructor(
    @Inject(BORROW_BOOK) private readonly borrowBookUseCase: BorrowBook,
    @Inject(RETURN_BOOK) private readonly returnBookUseCase: ReturnBook,
    @Inject(GET_MEMBER_LOANS) private readonly getMemberLoansUseCase: GetMemberLoans,
  ) {}

  @Post('loans')
  async borrowBook(@Body(new ZodValidationPipe(borrowBookBodySchema)) body: BorrowBookBody): Promise<{ loanId: string }> {
    const command = new BorrowBookCommand(body.memberId, body.bookId);
    const loanId = await this.borrowBookUseCase.execute(command);
    return { loanId };
  }

  @Post('loans/:loanId/return')
  @HttpCode(HttpStatus.NO_CONTENT)
  async returnBook(@Param(new ZodValidationPipe(loanIdParamSchema)) params: LoanIdParam): Promise<void> {
    const command = new ReturnBookCommand(params.loanId);
    await this.returnBookUseCase.execute(command);
  }

  @Get('members/:memberId/loans')
  async getMemberLoans(@Param(new ZodValidationPipe(memberIdParamSchema)) params: MemberIdParam): Promise<MemberLoanDto[]> {
    const query = new GetMemberLoansQuery(params.memberId);
    return this.getMemberLoansUseCase.execute(query);
  }
}
