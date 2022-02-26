import { compareDesc } from 'date-fns';
import {
  Entity,
  Column,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';

import { TrunkInstance } from 'twilio/lib/rest/trunking/v1/trunk';
import { BaseModel } from '../common/base.model';
import { Job } from '../jobs/job.model';
import { Contractor } from '../user/contractor.model';
import { LateFeeInvoice } from './late-fee-invoice.model';
import { OwnerJobInvoice } from './owner-job-invoice.model';
import { PaymentMethod } from './payment-method';
import { JobInvoiceStatus } from './job-invoice-status';
import { ManualPayment } from './manual-payment.model';

@Entity()
export class JobInvoice extends BaseModel {
  @Column('boolean', { default: false, nullable: true })
  isAccepted? = false;

  @Column('boolean', { default: false })
  isPaid? = false;

  @Column('jsonb', { nullable: true, default: [] })
  eventsHistory?: Array<{
    type: string;
    amount: number;
    by?: string;
    date: Date;
    data?: any;
    method?: string;
  }>;

  @Column({ type: 'real' })
  amount: number;

  @Column()
  orderNumber: number;

  @Column({ type: 'timestamptz' })
  dueDate: Date;

  @ManyToOne(type => Contractor, { eager: true })
  @JoinColumn()
  contractor: Contractor;

  @ManyToOne(type => Job, { eager: true })
  @JoinColumn()
  job: Job;

  @OneToOne(
    type => ManualPayment,
    manualPayment => manualPayment.jobInvoice,
    { nullable: true },
  )
  manualPayment?: ManualPayment;

  @Column({ nullable: true })
  paymentIntentId?: string;

  @Column({ nullable: true })
  stripeInvoiceId?: string;

  @Column({ nullable: true })
  chargePaymentId?: string;

  @Column({ nullable: true, enum: PaymentMethod })
  paidWith?: PaymentMethod;

  @Column({ nullable: true, type: 'timestamptz' })
  paidAt?: Date;

  @Column({ nullable: true, type: 'timestamptz' })
  rejectedAt?: Date;

  @Column({ nullable: true, type: 'timestamptz' })
  approvedAt?: Date;

  @Column({ default: 0, type: 'int' })
  currDispute?: number;

  @Column({
    type: 'enum',
    enum: JobInvoiceStatus,
    nullable: true,
  })
  status? = JobInvoiceStatus.CREATED;

  @OneToMany(
    type => OwnerJobInvoice,
    invoice => invoice.jobInvoice,
    { cascade: true },
  )
  ownerInvoices?: OwnerJobInvoice[];

  @Column({ nullable: true })
  contractorOrderNumber: number;

  @Column({ nullable: true, default: null })
  hasDiscount: number;

  getCurrentAmount?(): number {
    return this.amount;
  }

  getCurrentDueDate?(): Date {
    return this.dueDate;
  }
}
