import { Module } from '@nestjs/common';
import { InvoicesCommonModule } from '../../invoices-common.module';
import { InvoiceContractorController } from './invoice-contractor.controller';
import { LateFeeInvoiceContractorController } from './late-fee-invoice-contractor.controller';

@Module({
  imports: [InvoicesCommonModule],
  controllers: [
    InvoiceContractorController,
    LateFeeInvoiceContractorController,
  ],
})
export class InvoiceContractorModule {}
