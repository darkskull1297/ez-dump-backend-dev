import { Injectable } from '@nestjs/common';
import { InjectEventEmitter } from 'nest-emitter';
import { ManualPaymentUpdateDto } from './dto/manual-payment-update.dto';
import { JobInvoiceStatus } from './job-invoice-status';
import { JobInvoiceRepo } from './job-invoice.repository';
import { ManualPayment } from './manual-payment.model';
import { ManualPaymentRepo } from './manual-payment.repository';
import {
  PaymentApprovedByAdmin as PaymentApprovedByAdminSMS,
  PaymentRejectedByAdmin as PaymentRejectedByAdminSMS,
} from '../notification/notifications/messages';
import {
  PaymentApprovedByAdmin,
  PaymentRejectedByAdmin,
} from '../notification/notifications/notifications';
import { NotificationService } from '../notification/notification.service';
import { NotificationEventEmitter } from '../notification/notification.events';

@Injectable()
export class ManualPaymentService {
  constructor(
    private manualPaymentRepo: ManualPaymentRepo,
    private invoicesRepo: JobInvoiceRepo,
    @InjectEventEmitter()
    private readonly eventEmitter: NotificationEventEmitter,
    private readonly notificationService: NotificationService,
  ) {}

  async getManualPaymentsByInvoice(
    invoiceId: string,
  ): Promise<ManualPayment[]> {
    return this.manualPaymentRepo.getManualPaymentsByInvoice(invoiceId);
  }

  async confirm(paymentId: string): Promise<ManualPayment> {
    const manualPayment = await this.manualPaymentRepo.findById(paymentId);
    manualPayment.paymentDate = new Date();
    await this.manualPaymentRepo.save(manualPayment);

    const invoice = await this.invoicesRepo.findInvoiceById(
      manualPayment.jobInvoice.id,
    );
    invoice.isPaid = true;
    invoice.status = JobInvoiceStatus.PAID;
    invoice.approvedAt = new Date();
    let eventsHistory = [];

    if (invoice?.eventsHistory?.length) {
      eventsHistory = invoice.eventsHistory;
    }
    invoice.eventsHistory = [
      ...eventsHistory,
      {
        type: 'ACCEPTED',
        date: new Date(),
        amount: invoice.amount,
        by: 'Admin',
      },
    ];
    await this.invoicesRepo.save(invoice);

    const notification = await this.notificationService.createNotification({
      ...PaymentApprovedByAdmin(invoice.orderNumber),
      userId: invoice.contractor.id,
    });

    this.eventEmitter.emit(
      'sendSocketNotification',
      notification,
      invoice.contractor.id,
    );

    this.eventEmitter.emit('sendTextMessage', {
      to: invoice.contractor.phoneNumber,
      ...PaymentApprovedByAdminSMS(invoice.orderNumber),
    });

    return manualPayment;
  }

  async reject(invoiceId: string, reason: string): Promise<ManualPayment> {
    const manualPayment = await this.manualPaymentRepo.getManualPaymentByInvoice(
      invoiceId,
    );
    const actualDate = new Date();
    const invoice = await this.invoicesRepo.findInvoiceById(invoiceId);
    invoice.status = JobInvoiceStatus.REJECTED;
    invoice.rejectedAt = actualDate;
    let eventsHistory = [];

    if (invoice?.eventsHistory?.length) {
      eventsHistory = invoice.eventsHistory;
    }
    invoice.eventsHistory = [
      ...eventsHistory,
      {
        type: 'REJECTED',
        date: actualDate,
        amount: invoice.amount,
        by: 'Admin',
        data: {
          reason,
        },
      },
    ];
    await this.invoicesRepo.save(invoice);

    manualPayment.rejected = true;
    manualPayment.rejectReason = reason;
    manualPayment.rejectedAt = actualDate;
    await this.manualPaymentRepo.save(manualPayment);

    const notification = await this.notificationService.createNotification({
      ...PaymentRejectedByAdmin(invoice.orderNumber),
      userId: invoice.contractor.id,
    });

    this.eventEmitter.emit(
      'sendSocketNotification',
      notification,
      invoice.contractor.id,
    );

    this.eventEmitter.emit('sendTextMessage', {
      to: invoice.contractor.phoneNumber,
      ...PaymentRejectedByAdminSMS(invoice.orderNumber),
    });

    return manualPayment;
  }

  async update(
    paymentId: string,
    updateObj: ManualPaymentUpdateDto,
    by?: string,
  ): Promise<string> {
    const manualPayment = await this.manualPaymentRepo.findById(paymentId);
    manualPayment.accountNumber = updateObj.accountNumber;
    manualPayment.orderNumber = updateObj.orderNumber;
    manualPayment.attachments = updateObj.attachments;
    manualPayment.memo = updateObj.memo;
    await this.manualPaymentRepo.save(manualPayment);

    const invoice = await this.invoicesRepo.findInvoiceById(
      manualPayment.jobInvoice.id,
    );
    invoice.amount = updateObj.amount;
    let eventsHistory = [];

    if (invoice?.eventsHistory?.length) {
      eventsHistory = invoice.eventsHistory;
    }
    invoice.eventsHistory = [
      ...eventsHistory,
      {
        type: 'UPDATED',
        date: new Date(),
        amount: updateObj.amount,
        by,
        data: {
          orderNumber: updateObj.orderNumber,
        },
      },
    ];
    await this.invoicesRepo.save(invoice);

    return paymentId;
  }
}
