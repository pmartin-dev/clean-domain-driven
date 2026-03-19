export class BorrowBookCommand {
  constructor(
    readonly memberId: string,
    readonly bookId: string,
  ) {}
}
