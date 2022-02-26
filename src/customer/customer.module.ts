import { Module } from '@nestjs/common';
import { CustomerCommonModule } from './customer-common.module';
import { CustomerContractorModule } from './controllers/contractor/customer-contractor.module';
import { CustomerDispatcherModule } from './controllers/dispatcher/customer-dispatcher.module';
import { CustomerForemanModule } from './controllers/foreman/customer.foreman.module';

@Module({
  imports: [
    CustomerCommonModule,
    CustomerContractorModule,
    CustomerDispatcherModule,
    CustomerForemanModule,
  ],
  exports: [CustomerCommonModule],
})
export class CustomerModule {}
