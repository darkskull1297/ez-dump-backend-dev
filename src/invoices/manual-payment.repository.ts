import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from '../common/base.repository';
import { ManualPayment } from './manual-payment.model';

@Injectable()
export class ManualPaymentRepo extends BaseRepository<ManualPayment>(
  ManualPayment,
) {
  constructor(
    @InjectRepository(ManualPayment)
    private readonly manualPaymentRepo: Repository<ManualPayment>,
  ) {
    super(manualPaymentRepo);
  }

  getRepository(): Repository<ManualPayment> {
    return this.manualPaymentRepo;
  }

  async getManualPaymentsByInvoice(
    invoiceId: string,
  ): Promise<ManualPayment[]> {
    return this.manualPaymentRepo
      .createQueryBuilder('manualPayment')
      .leftJoinAndSelect('manualPayment.jobInvoice', 'jobInvoice')
      .where('jobInvoice.id = :invoiceId', { invoiceId })
      .getMany();
  }

  async getManualPaymentByInvoice(invoiceId: string): Promise<ManualPayment> {
    return this.manualPaymentRepo
      .createQueryBuilder('manualPayment')
      .leftJoinAndSelect('manualPayment.jobInvoice', 'jobInvoice')
      .where('jobInvoice.id = :invoiceId', { invoiceId })
      .getOne();
  }
}
