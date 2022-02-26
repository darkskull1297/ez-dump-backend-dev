import { Module } from '@nestjs/common';
import { TruckContractorController } from './truck-contractor.controller';
import { TrucksCommonModule } from '../../trucks-common.module';

@Module({
  imports: [TrucksCommonModule],
  controllers: [TruckContractorController],
})
export class TruckContractorModule {}
