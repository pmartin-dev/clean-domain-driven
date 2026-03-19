import { ClockInterface } from '@shared/domain/clock';

export class SystemClock implements ClockInterface {
  now(): Date {
    return new Date();
  }
}
