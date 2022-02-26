/* eslint-disable prefer-const */
import { Injectable } from '@nestjs/common';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { BaseRepository } from '../common/base.repository';
import { LateFeeInvoice } from './late-fee-invoice.model';
import { Contractor } from '../user/contractor.model';

@Injectable()
export class LateFeeInvoiceRepo extends BaseRepository<LateFeeInvoice>(
  LateFeeInvoice,
) {
  constructor(
    @InjectRepository(LateFeeInvoice)
    private readonly lateFeeInvoiceRepo: Repository<LateFeeInvoice>,
  ) {
    super(lateFeeInvoiceRepo);
  }

  findContractorLateFeeInvoices(
    contractor: Contractor,
    { skip, count },
  ): Promise<LateFeeInvoice[]> {
    let query = this.findLateFeeInvoicesQuery().where('contractor.id = :id', {
      id: contractor.id,
    });
    return query
      .skip(skip)
      .take(count)
      .getMany();
  }

  findContractorInvoicesAdmin({
    skip,
    count,
    isPaid,
  }): Promise<LateFeeInvoice[]> {
    let query = this.findLateFeeInvoicesQuery();
    if (isPaid) {
      query = query.andWhere('lateFeeInvoice.isPaid = :isPaid', { isPaid });
    }
    return query
      .leftJoinAndSelect('contractor.company', 'companyContractor')
      .skip(skip)
      .take(count)
      .orderBy('lateFeeInvoice.isPaid', 'DESC')
      .addOrderBy('lateFeeInvoice.dueDate', 'ASC')
      .getMany();
  }

  findAdminContractorInvoiceById(invoiceId: string): Promise<LateFeeInvoice> {
    return this.findLateFeeInvoicesQuery()
      .leftJoinAndSelect('contractor.company', 'companyContractor')
      .andWhere('lateFeeInvoice.id = :invoiceId', { invoiceId })
      .getOne();
  }

  async setContractorInvoiceDiscount(
    invoiceId,
    discountValue,
  ): Promise<boolean> {
    const invoice = await this.lateFeeInvoiceRepo.findOne({ id: invoiceId });
    invoice.hasDiscount = discountValue;
    await this.lateFeeInvoiceRepo.save(invoice);
    return true;
  }

  async findInvoiceForContractor(
    contractor: Contractor,
    invoiceId: string,
  ): Promise<LateFeeInvoice> {
    const data = await this.findLateFeeInvoicesQuery()
      .leftJoinAndSelect('contractor.company', 'companyContractor')
      .where('contractor.id = :id', { id: contractor.id })
      .andWhere('lateFeeInvoice.id = :invoiceId', { invoiceId })
      .getOne();

    return data;
  }

  countLateFeeInvoicesByJobInvoiceId(jobInvoiceId: string): Promise<number> {
    let count = this.findLateFeeInvoicesQuery()
      .where('jobInvoice.id = :id', {
        id: jobInvoiceId,
      })
      .getCount();

    return count;
  }

  async getLastDateByJobInvoiceId(jobInvoiceId: string): Promise<string> {
    let count = await this.findLateFeeInvoicesQuery()
      .where('jobInvoice.id = :id', {
        id: jobInvoiceId,
      })
      .select('MAX(lateFeeInvoice.createdAt)', 'max')
      .getRawOne();

    return count?.max;
  }

  findInvoiceById(invoiceId: string): Promise<LateFeeInvoice> {
    return this.findLateFeeInvoicesQuery()
      .leftJoinAndSelect('contractor.company', 'companyContractor')
      .where('lateFeeInvoice.id = :invoiceId', { invoiceId })
      .getOne();
  }

  private findLateFeeInvoicesQuery(): SelectQueryBuilder<LateFeeInvoice> {
    return this.lateFeeInvoiceRepo
      .createQueryBuilder('lateFeeInvoice')
      .leftJoinAndSelect('lateFeeInvoice.jobInvoice', 'jobInvoice')
      .leftJoinAndSelect('jobInvoice.job', 'job')
      .leftJoinAndSelect('lateFeeInvoice.contractor', 'contractor');
  }
}
