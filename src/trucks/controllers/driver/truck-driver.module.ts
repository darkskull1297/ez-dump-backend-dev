import { Module } from '@nestjs/common';
import { TruckDriverController } from './truck-driver.controller';
import { TrucksCommonModule } from '../../trucks-common.module';

@Module({
  imports: [TrucksCommonModule],
  controllers: [TruckDriverController],
})
export class TruckDriverModule {}
