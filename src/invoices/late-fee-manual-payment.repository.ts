import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from '../common/base.repository';
import { LateFeeManualPayment } from './late-fee-manual-payment.model';

@Injectable()
export class LateFeeManualPaymentRepo extends BaseRepository<
LateFeeManualPayment
>(LateFeeManualPayment) {
  constructor(
    @InjectRepository(LateFeeManualPayment)
    private readonly lateFeeManualPaymentRepo: Repository<LateFeeManualPayment>,
  ) {
    super(lateFeeManualPaymentRepo);
  }

  async getManualPaymentsByInvoice(
    invoiceId: string,
  ): Promise<LateFeeManualPayment[]> {
    return this.lateFeeManualPaymentRepo
      .createQueryBuilder('lateFeeManualPayment')
      .leftJoinAndSelect(
        'lateFeeManualPayment.lateFeeInvoice',
        'lateFeeInvoice',
      )
      .andWhere('lateFeeManualPayment.lateFeeInvoice = :invoiceId', {
        invoiceId,
      })
      .getMany();
  }

  async getManualPaymentById(id: string): Promise<LateFeeManualPayment> {
    return this.lateFeeManualPaymentRepo
      .createQueryBuilder('lateFeeManualPayment')
      .leftJoinAndSelect(
        'lateFeeManualPayment.lateFeeInvoice',
        'lateFeeInvoice',
      )
      .andWhere('lateFeeManualPayment.id = :id', { id })
      .getOne();
  }

  async getManualPaymentByIdWithoutInvoice(
    id: string,
  ): Promise<LateFeeManualPayment> {
    return this.lateFeeManualPaymentRepo
      .createQueryBuilder('lateFeeManualPayment')
      .andWhere('lateFeeManualPayment.id = :id', { id })
      .getOne();
  }

  getRepository(): Repository<LateFeeManualPayment> {
    return this.lateFeeManualPaymentRepo;
  }

  async getManualPaymentByInvoice(invoiceId: string): Promise<any> {
    return this.lateFeeManualPaymentRepo
      .createQueryBuilder('lateFeeManualPayment')
      .leftJoinAndSelect(
        'lateFeeManualPayment.lateFeeInvoice',
        'lateFeeInvoice',
      )
      .andWhere('lateFeeManualPayment.lateFeeInvoice = :invoiceId', {
        invoiceId,
      })
      .getOne();
  }
}
