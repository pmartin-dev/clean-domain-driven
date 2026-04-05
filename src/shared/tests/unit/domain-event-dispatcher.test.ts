import { describe, it, expect } from 'vitest';
import { DomainEventDispatcher } from '@shared/infrastructure/domain-event-dispatcher';
import { DomainEvent } from '@shared/domain/domain-event';

class FakeEvent extends DomainEvent {
  constructor(name: string, payload: Record<string, unknown> = {}) {
    super(name, payload);
  }
}

describe('DomainEventDispatcher', () => {
  it('dispatches an event to its subscribed handler', async () => {
    const dispatcher = new DomainEventDispatcher();
    const received: DomainEvent[] = [];

    dispatcher.subscribe('test::happened', async (event) => {
      received.push(event);
    });

    await dispatcher.dispatch([new FakeEvent('test::happened', { id: '1' })]);

    expect(received).toHaveLength(1);
    expect(received[0].payload).toEqual({ id: '1' });
  });

  it('dispatches to multiple handlers for the same event', async () => {
    const dispatcher = new DomainEventDispatcher();
    let callCount = 0;

    dispatcher.subscribe('test::happened', async () => { callCount++; });
    dispatcher.subscribe('test::happened', async () => { callCount++; });

    await dispatcher.dispatch([new FakeEvent('test::happened')]);

    expect(callCount).toBe(2);
  });

  it('does not call handlers for unrelated events', async () => {
    const dispatcher = new DomainEventDispatcher();
    let called = false;

    dispatcher.subscribe('test::other', async () => { called = true; });

    await dispatcher.dispatch([new FakeEvent('test::happened')]);

    expect(called).toBe(false);
  });

  it('dispatches multiple events in order', async () => {
    const dispatcher = new DomainEventDispatcher();
    const order: string[] = [];

    dispatcher.subscribe('a', async () => { order.push('a'); });
    dispatcher.subscribe('b', async () => { order.push('b'); });

    await dispatcher.dispatch([new FakeEvent('a'), new FakeEvent('b')]);

    expect(order).toEqual(['a', 'b']);
  });

  it('does nothing when no handlers are registered', async () => {
    const dispatcher = new DomainEventDispatcher();

    await expect(
      dispatcher.dispatch([new FakeEvent('test::happened')]),
    ).resolves.toBeUndefined();
  });

  it('rejects with AggregateError when a handler throws', async () => {
    const dispatcher = new DomainEventDispatcher();
    dispatcher.subscribe('test::happened', async () => { throw new Error('handler failed'); });

    await expect(
      dispatcher.dispatch([new FakeEvent('test::happened')]),
    ).rejects.toThrow('One or more event handlers failed');
  });

  it('executes all handlers even when one throws', async () => {
    const dispatcher = new DomainEventDispatcher();
    let secondHandlerCalled = false;

    dispatcher.subscribe('test::happened', async () => { throw new Error('first fails'); });
    dispatcher.subscribe('test::happened', async () => { secondHandlerCalled = true; });

    try {
      await dispatcher.dispatch([new FakeEvent('test::happened')]);
    } catch {
      // expected
    }

    expect(secondHandlerCalled).toBe(true);
  });
});
