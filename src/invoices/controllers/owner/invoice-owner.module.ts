import { Module } from '@nestjs/common';
import { InvoicesCommonModule } from '../../invoices-common.module';
import { InvoiceOwnerController } from './invoice-owner.controller';

@Module({
  imports: [InvoicesCommonModule],
  controllers: [InvoiceOwnerController],
})
export class InvoiceOwnerModule {}
