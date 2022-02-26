/* eslint-disable no-unused-expressions */
import { Injectable } from '@nestjs/common';
import { InjectEventEmitter } from 'nest-emitter';

import { Contractor } from '../user/contractor.model';
import { UserRole } from '../user/user.model';
import { UserRepo } from '../user/user.repository';
import { JobInvoiceStatus } from './job-invoice-status';
import { LateFeeInvoice } from './late-fee-invoice.model';
import { LateFeeInvoiceRepo } from './late-fee-invoice.repository';
import { LateFeeManualPaymentRepo } from './late-fee-manual-payment.repository';
import { PaymentMethod } from './payment-method';

import {
  NewContractorManualPayment as NewContractorManualPaymentSMS,
  NewAdminManualPayment as NewAdminManualPaymentSMS,
} from '../notification/notifications/messages';
import { NotificationService } from '../notification/notification.service';
import { NotificationEventEmitter } from '../notification/notification.events';
import { NewContractorManualPayment } from '../notification/notifications/notifications';
import { ContractorDTO } from '../user/dto/contractor-dto';

@Injectable()
export class LateFeeInvoiceService {
  constructor(
    private readonly lateFeeInvoiceRepository: LateFeeInvoiceRepo,
    private readonly lateFeeInvoiceRepo: LateFeeInvoiceRepo,
    private readonly lateFeeManualPaymentRepo: LateFeeManualPaymentRepo,
    private readonly userRepository: UserRepo,
    private readonly notificationService: NotificationService,
    @InjectEventEmitter()
    private readonly eventEmitter: NotificationEventEmitter,
  ) {}

  async getInvoiceForContractor(
    contractor: Contractor,
    invoiceId: string,
  ): Promise<any> {
    const data = await this.lateFeeInvoiceRepository.findInvoiceForContractor(
      contractor,
      invoiceId,
    );

    return data;
  }

  getContractorLateFeeInvoices(
    contractor: Contractor,
    { skip, count },
  ): Promise<LateFeeInvoice[]> {
    return this.lateFeeInvoiceRepo.findContractorLateFeeInvoices(contractor, {
      skip,
      count,
    });
  }

  getContractorInvoicesForAdmin({
    skip,
    count,
    isPaid,
  }): Promise<LateFeeInvoice[]> {
    return this.lateFeeInvoiceRepo.findContractorInvoicesAdmin({
      skip,
      count,
      isPaid,
    });
  }

  async getContractorInvoiceForAdmin(invoiceId: string): Promise<any> {
    const data = await this.lateFeeInvoiceRepo.findAdminContractorInvoiceById(
      invoiceId,
    );

    return data;
  }

  setContractorInvoiceDiscount({ invoiceId, discountValue }): Promise<boolean> {
    return this.lateFeeInvoiceRepo.setContractorInvoiceDiscount(
      invoiceId,
      discountValue,
    );
  }

  async markContractorInvoicePaidManually(
    invoiceId: string,
    paymentMethod: string,
    orderNumber: string,
    accountNumber: string,
  ): Promise<void> {
    const invoice = await this.lateFeeInvoiceRepository.findInvoiceById(
      invoiceId,
    );
    await this.lateFeeManualPaymentRepo.create({
      lateFeeInvoice: invoice,
      orderNumber,
      accountNumber,
    });
    await this.lateFeeInvoiceRepository.update(invoice.id, {
      paidWith: paymentMethod as PaymentMethod,
      status: JobInvoiceStatus.PENDING,
    });

    const admins = await this.userRepository.find({ role: UserRole.ADMIN });
    for (const admin of admins) {
      const notification = await this.notificationService.createNotification({
        ...NewContractorManualPayment(
          parseInt(invoice.orderNumber, 10),
          invoice.contractor.name,
        ),
        userId: admin.id,
      });

      this.eventEmitter.emit('sendSocketNotification', notification, admin.id);

      this.eventEmitter.emit('sendTextMessage', {
        to: admin.phoneNumber,
        ...NewContractorManualPaymentSMS(
          parseInt(invoice.orderNumber, 10),
          invoice.contractor.name,
        ),
      });
    }
  }
}
