import {
  Column,
  Entity,
  Generated,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { BaseModel } from '../common/base.model';
import { Job } from '../jobs/job.model';
import { ScheduledJob } from '../jobs/scheduled-job.model';
import { Owner } from '../user/owner.model';
import { DisputeInvoice } from './dispute-invoice.model';
import { DriverJobInvoice } from './driver-job-invoice.model';
import { JobInvoiceStatus } from './job-invoice-status';
import { JobInvoice } from './job-invoice.model';
import { PaymentMethod } from './payment-method';

@Entity()
export class OwnerJobInvoice extends BaseModel {
  @Column('boolean', { default: false, nullable: true })
  isAcceptedByOwner? = false;

  @Column('boolean', { default: false, nullable: true })
  isAcceptedByContractor? = false;

  @Column('boolean', { default: false })
  isPaid? = false;

  @Column({ type: 'real' })
  amount: number;

  @Column('jsonb', { nullable: true, default: [] })
  eventsHistory?: Array<{
    type: string;
    amount?: number;
    by?: string;
    date: Date;
    data?: any;
    method?: string;
  }>;

  @Column({ type: 'real' })
  netAmount: number;

  @Column({ type: 'timestamptz' })
  dueDate: Date;

  @Column()
  jobOrderNumber: number;

  @Column({ nullable: true })
  ownerOrderNumber: number;

  @Column({ unique: true })
  @Generated('increment')
  invoiceNumber?: number;

  @Column({ nullable: true })
  transferId?: string;

  @Column({ default: 0, type: 'int' })
  currDispute?: number;

  @ManyToOne(
    () => Owner,
    owner => owner.ownerJobInvoice,
    { eager: true },
  )
  @JoinColumn()
  owner: Owner;

  @Column({ nullable: true, type: 'timestamptz' })
  paidAt?: Date;

  @Column({ nullable: true, type: 'timestamptz' })
  rejectedAt?: Date;

  @Column({ nullable: true, type: 'timestamptz' })
  approvedAt?: Date;

  @ManyToOne(
    () => Job,
    job => job.ownerJobInvoice,
  )
  @JoinColumn()
  job: Job;

  @ManyToOne(
    () => ScheduledJob,
    schJob => schJob.ownerJobInvoice,
    { eager: true },
  )
  @JoinColumn()
  scheduledJob: ScheduledJob;

  @ManyToOne(
    type => JobInvoice,
    jobInvoice => jobInvoice.ownerInvoices,
  )
  @JoinColumn()
  jobInvoice?: JobInvoice;

  @Column({ default: false })
  cashAdvanceRequest?: boolean = false;

  @Column({ default: false })
  cashAdvanceConfirmed?: boolean = false;

  @Column({ default: false })
  cashAdvanceAccepted?: boolean = false;

  @OneToMany(
    type => DriverJobInvoice,
    invoice => invoice.ownerInvoice,
    { cascade: true },
  )
  driverInvoices: DriverJobInvoice[];

  @OneToOne(
    () => DisputeInvoice,
    disputeInvoice => disputeInvoice.ownerJobInvoice,
    { onDelete: 'CASCADE', nullable: true },
  )
  disputeInvoice?: DisputeInvoice;

  @Column({ nullable: true, default: null })
  hasDiscount: number;

  @Column({ nullable: false, default: false })
  isAssociatedInvoice: boolean;

  @Column({ nullable: true, enum: PaymentMethod })
  paidWith?: PaymentMethod;

  @Column({
    type: 'enum',
    enum: JobInvoiceStatus,
    nullable: true,
  })
  status? = JobInvoiceStatus.CREATED;

  @Column({ nullable: true })
  orderNumber: number;

  @Column({ nullable: true })
  accountNumber: number;
}
