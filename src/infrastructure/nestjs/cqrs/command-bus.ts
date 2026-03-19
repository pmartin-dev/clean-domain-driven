export interface CommandBus {
  execute<TResult>(command: object): Promise<TResult>;
}

export class SimpleCommandBus implements CommandBus {
  private readonly handlers = new Map<string, (command: object) => Promise<unknown>>();

  register(commandName: string, handler: (command: object) => Promise<unknown>): void {
    this.handlers.set(commandName, handler);
  }

  async execute<TResult>(command: object): Promise<TResult> {
    const name = command.constructor.name;
    const handler = this.handlers.get(name);
    if (!handler) {
      throw new Error(`No handler registered for command: ${name}`);
    }
    return handler(command) as Promise<TResult>;
  }
}
