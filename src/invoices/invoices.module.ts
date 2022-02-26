import { Module } from '@nestjs/common';
import { InvoiceAdminModule } from './controllers/admin/invoice-admin.module';
import { InvoiceContractorModule } from './controllers/contractor/invoice-contractor.module';
import { InvoiceDispatcherModule } from './controllers/dispatcher/invoice-dispatcher.module';
import { InvoiceDriverModule } from './controllers/driver/invoice-driver.module';
import { InvoiceOwnerModule } from './controllers/owner/invoice-owner.module';
import { InvoicesCommonModule } from './invoices-common.module';

@Module({
  imports: [
    InvoicesCommonModule,
    InvoiceContractorModule,
    InvoiceDispatcherModule,
    InvoiceOwnerModule,
    InvoiceAdminModule,
    InvoiceDriverModule,
  ],
  exports: [InvoicesCommonModule],
})
export class InvoicesModule {}
