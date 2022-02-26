import { Module } from '@nestjs/common';
import { InvoicesCommonModule } from '../../invoices-common.module';
import { InvoiceDriverController } from './invoice-driver.controller';

@Module({
  imports: [InvoicesCommonModule],
  controllers: [InvoiceDriverController],
})
export class InvoiceDriverModule {}
