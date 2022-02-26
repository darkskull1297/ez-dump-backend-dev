import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { DriverJobInvoiceService } from './driver-job-invoice.service';
import { JobInvoiceService } from './job-invoice.service';

@Injectable()
export class InvoicingTasksService {
  constructor(
    private readonly driverInvoiceService: DriverJobInvoiceService,
    private readonly jobInvoiceService: JobInvoiceService,
  ) {}

  @Cron('0 0 0 * * 1')
  createWeeklyInvoices(): void {
    this.driverInvoiceService.createWeeklyInvoices();
  }

  @Cron('0 0 * * *')
  handleUnpaidInvoices(): void {
    this.jobInvoiceService.handleUnpaidInvoices();
  }

  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  handleUnpaidInvoicesNotifySurcharge(): void {
    this.jobInvoiceService.notifyFutureSurcharge();
  }

  @Cron('0 0 0 * * *')
  createTransfers(): void {
    this.jobInvoiceService.transferPendingInvoices();
  }

  @Cron(CronExpression.EVERY_4_HOURS)
  acceptInvoices(): void {
    this.jobInvoiceService.acceptInvoicesAutomatically();
  }
}
