import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from '../common/base.repository';
import { Bill } from './bill.model';
import { User } from '../user/user.model';
import { Admin } from '../user/admin.model';

@Injectable()
export class BillRepo extends BaseRepository<Bill>(Bill) {
  constructor(
    @InjectRepository(Bill)
    private readonly billRepository: Repository<Bill>,
  ) {
    super(billRepository);
  }

  findBill(billId: string, user: User): Promise<Bill> {
    return this.billRepository
      .createQueryBuilder('bill')
      .leftJoinAndSelect('bill.user', 'user')
      .leftJoinAndSelect('user.company', 'company')
      .leftJoinAndSelect('bill.driverInvoices', 'driverInvoice')
      .leftJoinAndSelect('driverInvoice.category', 'category')
      .leftJoinAndSelect('bill.customer', 'customer')
      .leftJoinAndSelect('bill.generalJob', 'generalJob')
      .leftJoinAndSelect('driverInvoice.job', 'job')
      .leftJoinAndSelect('driverInvoice.truck', 'truck')
      .where('bill.id = :billId', { billId })
      .andWhere('user.id = :id', { id: user.id })
      .getOne();
  }

  findBills(
    user: User,
    { skip, count }: { skip: number; count: number },
  ): Promise<Bill[]> {
    return this.billRepository
      .createQueryBuilder('bill')
      .leftJoinAndSelect('bill.user', 'user')
      .leftJoinAndSelect('bill.driverInvoices', 'driverInvoices')
      .leftJoinAndSelect('driverInvoices.category', 'category')
      .leftJoinAndSelect('bill.customer', 'customer')
      .leftJoinAndSelect('bill.generalJob', 'job')
      .where('user.id = :id', { id: user.id })
      .orderBy('bill.createdAt', 'ASC')
      .skip(skip)
      .take(count)
      .getMany();
  }

  findAdminBills(
    user: Admin,
    { skip, count }: { skip: number; count: number },
  ): Promise<Bill[]> {
    return this.billRepository
      .createQueryBuilder('bill')
      .leftJoinAndSelect('bill.user', 'contractor')
      .leftJoinAndSelect('bill.driverInvoices', 'driverInvoices')
      .leftJoinAndSelect('driverInvoices.category', 'category')
      .leftJoinAndSelect('bill.customer', 'customer')
      .leftJoinAndSelect('contractor.company', 'company')
      .orderBy('bill.createdAt', 'ASC')
      .skip(skip)
      .take(count)
      .getMany();
  }
}
