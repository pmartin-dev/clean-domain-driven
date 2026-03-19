import { describe, it, expect } from 'vitest';
import { AggregateRoot } from '@shared/domain/aggregate-root';
import { DomainEvent } from '@shared/domain/domain-event';

class TestEvent extends DomainEvent {
  constructor(payload: Record<string, unknown> = {}) {
    super('test::event', payload);
  }
}

class TestAggregate extends AggregateRoot {
  doSomething(): void {
    this.raise(new TestEvent({ action: 'done' }));
  }
}

describe('AggregateRoot', () => {
  it('accumulates raised domain events', () => {
    const aggregate = new TestAggregate();

    aggregate.doSomething();
    aggregate.doSomething();

    const events = aggregate.pullDomainEvents();
    expect(events).toHaveLength(2);
    expect(events[0].name).toBe('test::event');
    expect(events[1].payload).toEqual({ action: 'done' });
  });

  it('drains events on pull', () => {
    const aggregate = new TestAggregate();
    aggregate.doSomething();

    aggregate.pullDomainEvents();
    const secondPull = aggregate.pullDomainEvents();

    expect(secondPull).toHaveLength(0);
  });

  it('returns an independent copy that cannot affect internal state', () => {
    const aggregate = new TestAggregate();
    aggregate.doSomething();

    const events = aggregate.pullDomainEvents();
    events.push(new TestEvent({ injected: true }));

    aggregate.doSomething();
    const freshPull = aggregate.pullDomainEvents();

    expect(freshPull).toHaveLength(1);
    expect(freshPull[0].payload).toEqual({ action: 'done' });
  });
});
