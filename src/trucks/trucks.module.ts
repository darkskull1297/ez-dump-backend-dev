import { Module } from '@nestjs/common';
import { TrucksCommonModule } from './trucks-common.module';
import { TruckAdminModule } from './controllers/admin/truck-admin.module';
import { TruckOwnerModule } from './controllers/owner/truck-owner.module';
import { TruckDriverModule } from './controllers/driver/truck-driver.module';
import { TruckContractorModule } from './controllers/contractor/truck-contractor.module';
import { TruckDispatcherModule } from './controllers/dispatcher/truck-dispatcher.module';

@Module({
  imports: [
    TrucksCommonModule,
    TruckAdminModule,
    TruckOwnerModule,
    TruckDriverModule,
    TruckContractorModule,
    TruckDispatcherModule,
  ],
  exports: [TrucksCommonModule],
})
export class TrucksModule {}
