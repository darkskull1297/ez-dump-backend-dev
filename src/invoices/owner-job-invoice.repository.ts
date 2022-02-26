import { Injectable } from '@nestjs/common';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from '../common/base.repository';
import { OwnerJobInvoice } from './owner-job-invoice.model';
import { Contractor } from '../user/contractor.model';
import { Owner } from '../user/owner.model';

@Injectable()
export class OwnerJobInvoiceRepo extends BaseRepository<OwnerJobInvoice>(
  OwnerJobInvoice,
) {
  constructor(
    @InjectRepository(OwnerJobInvoice)
    private readonly ownerJobInvoiceRepo: Repository<OwnerJobInvoice>,
  ) {
    super(ownerJobInvoiceRepo);
  }

  private findOwnerJobInvoiceQuery(): SelectQueryBuilder<OwnerJobInvoice> {
    return this.ownerJobInvoiceRepo
      .createQueryBuilder('ownerInvoice')
      .leftJoinAndSelect('ownerInvoice.job', 'job')
      .leftJoinAndSelect('ownerInvoice.owner', 'owner')
      .leftJoinAndSelect('ownerInvoice.scheduledJob', 'scheduledJob')
      .leftJoinAndSelect('ownerInvoice.jobInvoice', 'jobInvoice')
      .leftJoinAndSelect('ownerInvoice.driverInvoices', 'driverInvoices')
      .leftJoinAndSelect('driverInvoices.driver', 'driver')
      .leftJoinAndSelect('driverInvoices.timeEntries', 'timeEntries')
      .leftJoinAndSelect('driverInvoices.truck', 'truck')
      .leftJoinAndSelect('driverInvoices.category', 'category')
      .leftJoinAndSelect('job.user', 'user');
  }

  findOwnerInvoiceById(ownerInvoiceId: string): Promise<OwnerJobInvoice> {
    return this.findOwnerJobInvoiceQuery()
      .where('ownerInvoice.id = :ownerInvoiceId', { ownerInvoiceId })
      .getOne();
  }

  findAll(): Promise<OwnerJobInvoice[]> {
    return this.findOwnerJobInvoiceQuery().getMany();
  }

  getRepository(): Repository<OwnerJobInvoice> {
    return this.ownerJobInvoiceRepo;
  }

  findOwnerJobInvoiceForContractor(
    contractor: Contractor,
    invoiceId: string,
  ): Promise<OwnerJobInvoice> {
    return this.findOwnerJobInvoiceQuery()
      .where('ownerInvoice.id = :invoiceId', { invoiceId })
      .andWhere('user.id = :id', { id: contractor.id })
      .getOne();
  }

  findOwnerJobInvoice(jobId: string): Promise<OwnerJobInvoice> {
    return this.findOwnerJobInvoiceQuery()
      .where('job.id = :id', { id: jobId })
      .getOne();
  }

  findOwnerJobInvoiceForOwner(
    owner: Owner,
    invoiceId: string,
  ): Promise<OwnerJobInvoice> {
    return this.findOwnerJobInvoiceQuery()
      .where('ownerInvoice.id = :invoiceId', { invoiceId })
      .andWhere('owner.id = :id', { id: owner.id })
      .getOne();
  }

  findOwnerJobInvoiceForAdmin(invoiceId: string): Promise<OwnerJobInvoice> {
    return this.findOwnerJobInvoiceQuery()
      .leftJoinAndSelect('jobInvoice.job', 'jobInvoiceJob')
      .leftJoinAndSelect('jobInvoiceJob.user', 'contractor')
      .where('ownerInvoice.id = :invoiceId', { invoiceId })
      .getOne();
  }

  async setOwnerInvoiceDiscount(invoiceId, discountValue): Promise<boolean> {
    const invoice = await this.ownerJobInvoiceRepo.findOne({ id: invoiceId });
    invoice.hasDiscount = invoice.hasDiscount === null ? discountValue : null;
    await this.ownerJobInvoiceRepo.save(invoice);
    return true;
  }
}
