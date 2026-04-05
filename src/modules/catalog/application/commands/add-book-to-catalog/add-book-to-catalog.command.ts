export class AddBookToCatalogCommand {
  constructor(
    readonly isbn: string,
    readonly title: string,
    readonly author: string,
  ) {}
}
