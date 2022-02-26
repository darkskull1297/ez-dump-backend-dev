import { Injectable } from '@nestjs/common';
import { Bill } from './bill.model';
import { BillRepo } from './bill.repository';
import { User } from '../user/user.model';
import { PaginationDTO } from '../common/pagination.dto';
import { DocumentNotFoundException } from '../common/exceptions/document-not-found.exception';
import { DriverJobInvoiceRepo } from '../invoices/driver-job-invoice.repository';

@Injectable()
export class BillService {
  constructor(
    private readonly billRepo: BillRepo,
    private readonly driverInvoice: DriverJobInvoiceRepo,
  ) {}

  async findBills(user: User, { skip, count }: PaginationDTO): Promise<Bill[]> {
    const bills = await this.billRepo.findBills(user, {
      skip,
      count,
    });
    return bills;
  }

  async findBill(billId: string, user: User): Promise<Bill> {
    return this.billRepo.findBill(billId, user);
  }

  async createBill(
    bill: Omit<
    Bill,
    'id' | 'createdAt' | 'updatedAt' | 'user' | 'driverInvoices'
    >,
    invoices: string[],
    user: User,
  ): Promise<Bill> {
    const driverInvoices = await Promise.all(
      invoices.map(async val => {
        const ticket = await this.driverInvoice.findById(val);
        return ticket;
      }),
    );

    return this.billRepo.create({
      ...bill,
      driverInvoices,
      user,
    });
  }

  async editBill(
    bill: Partial<Bill>,
    invoices: string[],
    Id: string,
  ): Promise<Bill> {
    const newBill = await this.billRepo.findOne({ id: Id });

    const driverInvoices = await Promise.all(
      invoices.map(async val => {
        const ticket = await this.driverInvoice.findById(val);
        return ticket;
      }),
    );

    if (!newBill) {
      throw new DocumentNotFoundException('Not found');
    }

    newBill.driverInvoices = driverInvoices;
    newBill.status = bill.status;

    return this.billRepo.save(newBill);
  }

  async deleteBill(billId: string): Promise<boolean> {
    try {
      console.info(billId);
      await this.billRepo.remove(billId);
      return true;
    } catch (err) {
      throw new Error(err);
    }
  }
}
