import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseModel } from '../common/base.model';
import { GeneralJob } from '../general-jobs/general-job.model';
import { DriverJobInvoice } from '../invoices/driver-job-invoice.model';
import { Customer } from '../customer/customer.model';
import { User } from '../user/user.model';
import { BillStatus } from './bill-status';

@Entity()
export class Bill extends BaseModel {
  @ManyToOne(
    () => Customer,
    customer => customer,
    { eager: true },
  )
  @JoinColumn()
  customer: Customer;

  @PrimaryGeneratedColumn('increment')
  billNumber?: number;

  @ManyToOne(
    () => User,
    user => user,
    { eager: true },
  )
  @JoinColumn()
  user: User;

  @ManyToOne(
    () => GeneralJob,
    generalJob => generalJob,
    { eager: true },
  )
  @JoinColumn()
  generalJob: GeneralJob;

  @OneToMany(
    () => DriverJobInvoice,
    driverJobInvoice => driverJobInvoice.bill,
    { cascade: true, nullable: true, onDelete: 'CASCADE' },
  )
  driverInvoices: DriverJobInvoice[];

  @Column({
    type: 'enum',
    enum: BillStatus,
  })
  status: BillStatus;

  @Column('timestamptz')
  dueDate: string;
}
