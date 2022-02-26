import { Module } from '@nestjs/common';
import { BillCommonModule } from './bill-common.module';
import { BillContractorModule } from './controllers/contractor/bill-contractor.module';
import { BillDispatcherModule } from './controllers/dispatcher/bill-dispatcher.module';

@Module({
  imports: [BillCommonModule, BillContractorModule, BillDispatcherModule],
  exports: [BillCommonModule],
})
export class BillModule {}
