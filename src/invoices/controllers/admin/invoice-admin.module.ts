import { Module } from '@nestjs/common';
import { EmailModule } from '../../../email/email.module';
import { InvoicesCommonModule } from '../../invoices-common.module';
import { InvoiceAdminController } from './invoice-admin.controller';
import { LateFeeInvoiceAdminController } from './late-fee-invoice-admin.controller';
import { DisputeLoadsRepo } from '../../dispute-loads.repository';

@Module({
  imports: [InvoicesCommonModule, EmailModule],
  providers: [DisputeLoadsRepo],
  controllers: [InvoiceAdminController, LateFeeInvoiceAdminController],
})
export class InvoiceAdminModule {}
