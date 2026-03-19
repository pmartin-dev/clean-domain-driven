import { Module, Global } from '@nestjs/common';
import { SimpleCommandBus } from './command-bus.js';
import { SimpleQueryBus } from './query-bus.js';
import { COMMAND_BUS, QUERY_BUS } from './injection-tokens.js';

@Global()
@Module({
  providers: [
    { provide: COMMAND_BUS, useFactory: () => new SimpleCommandBus() },
    { provide: QUERY_BUS, useFactory: () => new SimpleQueryBus() },
  ],
  exports: [COMMAND_BUS, QUERY_BUS],
})
export class CqrsModule {}
