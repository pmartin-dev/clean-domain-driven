import { DomainEvent } from './domain-event';
import { EventHandler, SubscribableEventDispatcher } from './event-dispatcher.interface';

export class DomainEventDispatcher implements SubscribableEventDispatcher {
  private readonly handlers = new Map<string, EventHandler[]>();

  subscribe(eventName: string, handler: EventHandler): void {
    const existing = this.handlers.get(eventName) ?? [];
    existing.push(handler);
    this.handlers.set(eventName, existing);
  }

  async dispatch(events: DomainEvent[]): Promise<void> {
    const errors: unknown[] = [];
    for (const event of events) {
      const handlers = this.handlers.get(event.name) ?? [];
      for (const handler of handlers) {
        try {
          await handler(event);
        } catch (error) {
          errors.push(error);
        }
      }
    }
    if (errors.length > 0) {
      throw new AggregateError(errors, 'One or more event handlers failed');
    }
  }
}
