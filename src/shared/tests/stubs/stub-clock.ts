import { ClockInterface } from '@shared/domain/clock';

export class StubClock implements ClockInterface {
  constructor(private readonly date: Date) {}

  now(): Date {
    return this.date;
  }
}
