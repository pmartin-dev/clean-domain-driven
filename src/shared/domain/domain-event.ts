export abstract class DomainEvent {
  private readonly _occurredOn: Date;

  protected constructor(
    readonly name: string,
    readonly payload: Readonly<Record<string, unknown>>,
  ) {
    this._occurredOn = new Date();
    Object.freeze(this.payload);
  }

  get occurredOn(): Date {
    return new Date(this._occurredOn);
  }
}
