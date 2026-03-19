import { DomainEvent } from './domain-event';

export type EventHandler = (event: DomainEvent) => Promise<void>;

export interface EventDispatcherInterface {
  dispatch(events: DomainEvent[]): Promise<void>;
}

export interface SubscribableEventDispatcher extends EventDispatcherInterface {
  subscribe(eventName: string, handler: EventHandler): void;
}
