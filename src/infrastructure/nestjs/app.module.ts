import { Module } from '@nestjs/common';
import { SharedModule } from '@shared/infrastructure/nestjs/shared.module';
import { CqrsModule } from './cqrs/cqrs.module.js';
import { CatalogModule } from '@catalog/infrastructure/nestjs/catalog.module';
import { LendingModule } from '@lending/infrastructure/nestjs/lending.module';

@Module({
  imports: [SharedModule, CqrsModule, CatalogModule, LendingModule],
})
export class AppModule {}
