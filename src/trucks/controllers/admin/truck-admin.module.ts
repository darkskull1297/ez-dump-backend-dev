import { Module } from '@nestjs/common';
import { TruckAdminController } from './truck-admin.controller';
import { TrucksCommonModule } from '../../trucks-common.module';

@Module({
  imports: [TrucksCommonModule],
  controllers: [TruckAdminController],
})
export class TruckAdminModule {}
