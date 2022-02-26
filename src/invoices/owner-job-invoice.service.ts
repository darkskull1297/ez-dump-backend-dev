import { Injectable } from '@nestjs/common';
import { EmailService } from '../email/email.service';
import { Contractor } from '../user/contractor.model';
import { Owner } from '../user/owner.model';
import { OwnerJobInvoice } from './owner-job-invoice.model';
import { OwnerJobInvoiceRepo } from './owner-job-invoice.repository';

@Injectable()
export class OwnerJobInvoiceService {
  constructor(
    private readonly ownerInvoiceRepo: OwnerJobInvoiceRepo,
    private readonly emailService: EmailService,
  ) {}

  async acceptOwnerInvoiceForContractor(
    contractor: Contractor,
    invoiceId: string,
  ): Promise<OwnerJobInvoice> {
    const jobInvoiceContractor = await this.ownerInvoiceRepo.findOwnerJobInvoiceForContractor(
      contractor,
      invoiceId,
    );
    jobInvoiceContractor.isAcceptedByContractor = true;
    let eventsHistory = [];

    if (jobInvoiceContractor?.eventsHistory?.length) {
      eventsHistory = jobInvoiceContractor.eventsHistory;
    }
    jobInvoiceContractor.eventsHistory = [
      ...eventsHistory,
      {
        type: 'ACCEPTED',
        date: new Date(),
        amount: jobInvoiceContractor.amount,
        by: 'Owner',
      },
    ];
    return this.ownerInvoiceRepo.save(jobInvoiceContractor);
  }

  async acceptOwnerInvoiceForOwner(
    owner: Owner,
    invoiceId: string,
  ): Promise<OwnerJobInvoice> {
    const ownerJobInvoice = await this.ownerInvoiceRepo.findOwnerJobInvoiceForOwner(
      owner,
      invoiceId,
    );
    ownerJobInvoice.isAcceptedByOwner = true;
    let eventsHistory = [];

    if (ownerJobInvoice?.eventsHistory?.length) {
      eventsHistory = ownerJobInvoice.eventsHistory;
    }
    ownerJobInvoice.eventsHistory = [
      ...eventsHistory,
      {
        type: 'ACCEPTED',
        date: new Date(),
        amount: ownerJobInvoice.amount,
        by: 'Owner',
      },
    ];
    return this.ownerInvoiceRepo.save(ownerJobInvoice);
  }
}
