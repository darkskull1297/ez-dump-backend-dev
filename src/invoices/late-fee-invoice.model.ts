import {
  Entity,
  Column,
  JoinColumn,
  ManyToOne,
  UpdateDateColumn,
  CreateDateColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { BaseModel } from '../common/base.model';
import { Contractor } from '../user/contractor.model';
import { JobInvoiceStatus } from './job-invoice-status';
import { JobInvoice } from './job-invoice.model';
import { PaymentMethod } from './payment-method';

@Entity()
export class LateFeeInvoice extends BaseModel {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('boolean', { default: false, nullable: true })
  isAccepted? = false;

  @Column({ type: 'timestamptz' })
  dueDate: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @Column({ nullable: true, type: 'timestamptz' })
  paidAt?: Date;

  @Column('jsonb', { nullable: true, default: [] })
  eventsHistory?: Array<{
    type: string;
    amount: number;
    by?: string;
    date: Date;
    data?: any;
    method?: string;
  }>;

  @Column({ type: 'real', nullable: true, default: null })
  hasDiscount: number;

  @Column({ nullable: true })
  paymentIntentId?: string;

  @Column({ nullable: true })
  stripeInvoiceId?: string;

  @Column({ nullable: true })
  chargePaymentId?: string;

  @Column({ nullable: false, default: '' })
  orderNumber: string;

  @Column({ type: 'real' })
  amount: number;

  @Column({ nullable: true, enum: PaymentMethod })
  paidWith?: PaymentMethod;

  @Column('boolean', { default: false })
  isPaid? = false;

  @Column({
    type: 'enum',
    enum: JobInvoiceStatus,
    nullable: true,
  })
  status? = JobInvoiceStatus.CREATED;

  @ManyToOne(type => JobInvoice, { eager: true })
  @JoinColumn()
  jobInvoice: JobInvoice;

  @ManyToOne(type => Contractor, { eager: true })
  @JoinColumn()
  contractor: Contractor;
}
