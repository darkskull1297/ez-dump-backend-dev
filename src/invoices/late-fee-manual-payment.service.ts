import { Injectable } from '@nestjs/common';
import { InjectEventEmitter } from 'nest-emitter';
import { ManualPaymentUpdateDto } from './dto/manual-payment-update.dto';
import { JobInvoiceStatus } from './job-invoice-status';
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
import { LateFeeManualPayment } from './late-fee-manual-payment.model';
import { LateFeeManualPaymentRepo } from './late-fee-manual-payment.repository';
import { LateFeeInvoiceRepo } from './late-fee-invoice.repository';

@Injectable()
export class LateFeeManualPaymentService {
  constructor(
    private manualPaymentRepo: LateFeeManualPaymentRepo,
    private invoicesRepo: LateFeeInvoiceRepo,
    @InjectEventEmitter()
    private readonly eventEmitter: NotificationEventEmitter,
    private readonly notificationService: NotificationService,
  ) {}

  async getManualPaymentsByInvoice(
    invoiceId: string,
  ): Promise<LateFeeManualPayment[]> {
    return this.manualPaymentRepo.getManualPaymentsByInvoice(invoiceId);
  }

  async confirm(paymentId: string): Promise<LateFeeManualPayment> {
    const manualPayment = await this.manualPaymentRepo.getManualPaymentById(
      paymentId,
    );
    manualPayment.paymentDate = new Date();
    await this.manualPaymentRepo.save(manualPayment);

    const invoice = await this.invoicesRepo.findInvoiceById(
      manualPayment.lateFeeInvoice.id,
    );
    invoice.isPaid = true;
    invoice.status = JobInvoiceStatus.PAID;
    invoice.paidAt = new Date();
    let eventsHistory = [];

    if (invoice?.eventsHistory?.length) {
      eventsHistory = invoice.eventsHistory;
    }
    invoice.eventsHistory = [
      ...eventsHistory,
      {
        type: 'PAID',
        date: new Date(),
        amount: invoice.amount,
      },
    ];
    await this.invoicesRepo.save(invoice);

    const notification = await this.notificationService.createNotification({
      ...PaymentApprovedByAdmin(
        parseInt(invoice.orderNumber.split('-')[1], 10),
      ),
      userId: invoice.contractor.id,
    });

    this.eventEmitter.emit(
      'sendSocketNotification',
      notification,
      invoice.contractor.id,
    );

    this.eventEmitter.emit('sendTextMessage', {
      to: invoice.contractor.phoneNumber,
      ...PaymentApprovedByAdminSMS(
        parseInt(invoice.orderNumber.split('-')[1], 10),
      ),
    });

    return manualPayment;
  }

  async reject(
    invoiceId: string,
    reason: string,
  ): Promise<LateFeeManualPayment> {
    const manualPayment = await this.manualPaymentRepo.getManualPaymentByInvoice(
      invoiceId,
    );

    const invoice = await this.invoicesRepo.findInvoiceById(invoiceId);
    invoice.status = JobInvoiceStatus.REJECTED;
    let eventsHistory = [];

    if (invoice?.eventsHistory?.length) {
      eventsHistory = invoice.eventsHistory;
    }
    invoice.eventsHistory = [
      ...eventsHistory,
      {
        type: 'REJECTED',
        date: new Date(),
        amount: invoice.amount,
      },
    ];
    await this.invoicesRepo.save(invoice);
    manualPayment.rejectReason = reason;
    manualPayment.rejectedAt = new Date();
    manualPayment.rejected = true;

    await this.manualPaymentRepo.save(manualPayment);

    const notification = await this.notificationService.createNotification({
      ...PaymentRejectedByAdmin(
        parseInt(invoice.orderNumber.split('-')[1], 10),
      ),
      userId: invoice.contractor.id,
    });

    this.eventEmitter.emit(
      'sendSocketNotification',
      notification,
      invoice.contractor.id,
    );

    this.eventEmitter.emit('sendTextMessage', {
      to: invoice.contractor.phoneNumber,
      ...PaymentRejectedByAdminSMS(
        parseInt(invoice.orderNumber.split('-')[1], 10),
      ),
    });

    return manualPayment;
  }

  async update(
    paymentId: string,
    updateObj: ManualPaymentUpdateDto,
  ): Promise<string> {
    const manualPayment = await this.manualPaymentRepo.getManualPaymentById(
      paymentId,
    );
    manualPayment.accountNumber = updateObj.accountNumber;
    manualPayment.orderNumber = updateObj.orderNumber;
    manualPayment.attachments = updateObj.attachments;
    manualPayment.memo = updateObj.memo;

    await this.manualPaymentRepo.save(manualPayment);

    const invoice = await this.invoicesRepo.findInvoiceById(
      manualPayment.lateFeeInvoice.id,
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
        amount: invoice.amount,
      },
    ];
    await this.invoicesRepo.save(invoice);

    return paymentId;
  }
}
