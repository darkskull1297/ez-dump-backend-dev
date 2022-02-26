import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectEventEmitter } from 'nest-emitter';
import { JobInvoiceService } from './job-invoice.service';
import { InvoicesEventEmitter } from './invoices.events';
import { PaymentMethod } from './payment-method';

@Injectable()
export class InvoicesEventsService implements OnModuleInit {
  constructor(
    @InjectEventEmitter()
    private readonly eventEmitter: InvoicesEventEmitter,
    private readonly invoiceService: JobInvoiceService,
  ) {}

  onModuleInit(): void {
    this.eventEmitter.on('jobFinished', data => this.onJobFinished(data));
    this.eventEmitter.on('intentPaid', data => this.onIntentPaid(data));
    this.eventEmitter.on('transferPaid', data => this.onTransferPaid(data));
    this.eventEmitter.on('chargePaid', data => this.onChargePaid(data));
    this.eventEmitter.on('chargePending', data => this.onChargePending(data));
    this.eventEmitter.on('invoicePaid', data => this.onInvoicePaid(data));
    // this.eventEmitter.on('invoicePaidByCheck', data =>
    //   this.onInvoicePaidByCheck(data),
    // );
    // this.eventEmitter.on('invoicePaidByACH', data =>
    //   this.onInvoicePaidByACH(data),
    // );
  }

  onJobFinished(jobId: string): void {
    this.invoiceService.createInvoice(jobId);
  }

  onIntentPaid(intentId: string): void {
    this.invoiceService.markInvoicePaidFromIntent(intentId);
  }

  onChargePaid(chargeId: string): void {
    this.invoiceService.markInvoicePaidFromCharge(chargeId);
  }

  onChargePending(chargeId: string): void {
    this.invoiceService.markInvoiceProcessingFromCharge(chargeId);
  }

  onTransferPaid(transferId: string): void {
    this.invoiceService.markOwnerPaidFromTransfer(transferId);
  }

  onInvoicePaid(invoiceId: string): void {
    this.invoiceService.markContractorInvoicePaid(invoiceId);
  }
}
