import { DomainEvent } from './domain-event';

export interface EventDispatcherInterface {
  dispatch(events: DomainEvent[]): Promise<void>;
}
