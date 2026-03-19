import { describe, it, expect } from 'vitest';
import { BookRegisteredEvent } from '@catalog/domain/book/events/book-registered.event';

describe('BookRegisteredEvent', () => {
  it('has the correct event name', () => {
    const event = new BookRegisteredEvent('book-1');

    expect(event.name).toBe('catalog::book-registered');
  });

  it('carries the bookId in payload', () => {
    const event = new BookRegisteredEvent('book-42');

    expect(event.payload).toEqual({ bookId: 'book-42' });
  });

  it('records the occurrence date', () => {
    const before = new Date();
    const event = new BookRegisteredEvent('book-1');
    const after = new Date();

    expect(event.occurredOn.getTime()).toBeGreaterThanOrEqual(before.getTime());
    expect(event.occurredOn.getTime()).toBeLessThanOrEqual(after.getTime());
  });
});
