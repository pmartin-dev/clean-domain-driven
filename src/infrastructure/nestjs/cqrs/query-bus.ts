export interface QueryBus {
  execute<TResult>(query: object): Promise<TResult>;
}

export class SimpleQueryBus implements QueryBus {
  private readonly handlers = new Map<string, (query: object) => Promise<unknown>>();

  register(queryName: string, handler: (query: object) => Promise<unknown>): void {
    this.handlers.set(queryName, handler);
  }

  async execute<TResult>(query: object): Promise<TResult> {
    const name = query.constructor.name;
    const handler = this.handlers.get(name);
    if (!handler) {
      throw new Error(`No handler registered for query: ${name}`);
    }
    return handler(query) as Promise<TResult>;
  }
}
