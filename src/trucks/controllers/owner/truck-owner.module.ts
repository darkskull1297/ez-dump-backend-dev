import { Module } from '@nestjs/common';
import { TruckOwnerController } from './truck-owner.controller';
import { TrucksCommonModule } from '../../trucks-common.module';

@Module({
  imports: [TrucksCommonModule],
  controllers: [TruckOwnerController],
})
export class TruckOwnerModule {}
