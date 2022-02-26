import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { BillService } from './bill.service';
import { BillRepo } from './bill.repository';
import { Bill } from './bill.model';
import { GeneralJob } from '../general-jobs/general-job.model';
import { DriverJobInvoiceRepo } from '../invoices/driver-job-invoice.repository';
import { InvoicesModule } from '../invoices/invoices.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([GeneralJob, Bill]),
    PassportModule.register({ defaultStrategy: 'jwt' }),
    InvoicesModule,
  ],
  providers: [BillRepo, BillService, DriverJobInvoiceRepo],
  exports: [BillRepo, BillService],
})
export class BillCommonModule {}
