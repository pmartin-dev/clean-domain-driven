import { Module, Global } from '@nestjs/common';
import { CLOCK, ID_GENERATOR, EVENT_DISPATCHER } from './injection-tokens.js';
import { SystemClock } from '../system-clock.js';
import { IdGenerator } from '../id-generator.js';
import { DomainEventDispatcher } from '@shared/domain/domain-event-dispatcher';

@Global()
@Module({
  providers: [
    { provide: CLOCK, useFactory: () => new SystemClock() },
    { provide: ID_GENERATOR, useFactory: () => new IdGenerator() },
    { provide: EVENT_DISPATCHER, useFactory: () => new DomainEventDispatcher() },
  ],
  exports: [CLOCK, ID_GENERATOR, EVENT_DISPATCHER],
})
export class SharedModule {}
