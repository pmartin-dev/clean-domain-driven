import { Controller, Post, Get, Body, Param, Inject, HttpCode, HttpStatus } from '@nestjs/common';
import { COMMAND_BUS, QUERY_BUS } from '@infrastructure/nestjs/cqrs/injection-tokens';
import { CommandBus } from '@infrastructure/nestjs/cqrs/command-bus';
import { QueryBus } from '@infrastructure/nestjs/cqrs/query-bus';
import { BorrowBookCommand } from '@lending/application/use-cases/commands/borrow-book/borrow-book.command';
import { ReturnBookCommand } from '@lending/application/use-cases/commands/return-book/return-book.command';
import { GetMemberLoansQuery } from '@lending/application/use-cases/queries/get-member-loans/get-member-loans.query';
import { MemberLoanDto } from '@lending/application/use-cases/queries/get-member-loans/get-member-loans.use-case';

@Controller('lending')
export class LendingController {
  constructor(
    @Inject(COMMAND_BUS) private readonly commandBus: CommandBus,
    @Inject(QUERY_BUS) private readonly queryBus: QueryBus,
  ) {}

  @Post('loans')
  async borrowBook(@Body() body: { memberId: string; bookId: string }): Promise<{ loanId: string }> {
    const command = new BorrowBookCommand(body.memberId, body.bookId);
    const loanId = await this.commandBus.execute<string>(command);
    return { loanId };
  }

  @Post('loans/:loanId/return')
  @HttpCode(HttpStatus.NO_CONTENT)
  async returnBook(@Param('loanId') loanId: string): Promise<void> {
    const command = new ReturnBookCommand(loanId);
    await this.commandBus.execute<void>(command);
  }

  @Get('members/:memberId/loans')
  async getMemberLoans(@Param('memberId') memberId: string): Promise<MemberLoanDto[]> {
    const query = new GetMemberLoansQuery(memberId);
    return this.queryBus.execute<MemberLoanDto[]>(query);
  }
}
