import { Module } from '@nestjs/common';
import { SharedModule } from '@shared/infrastructure/nestjs/shared.module.js';
import { CatalogModule } from '@catalog/infrastructure/nestjs/catalog.module';
import { LendingModule } from '@lending/infrastructure/nestjs/lending.module';

@Module({
  imports: [SharedModule, CatalogModule, LendingModule],
})
export class AppModule {}
