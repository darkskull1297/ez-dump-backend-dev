import { Entity, Column, JoinColumn, ManyToOne } from 'typeorm';

import { BaseModel } from '../common/base.model';
import { JobInvoice } from './job-invoice.model';

@Entity()
export class ManualPayment extends BaseModel {
  @Column({ nullable: true })
  orderNumber: string;

  @Column({ nullable: true })
  accountNumber: string;

  @Column({ type: 'timestamptz', nullable: true })
  paymentDate?: Date;

  @Column({ nullable: true })
  attachments?: string;

  @Column({ nullable: true })
  memo?: string;

  @ManyToOne(() => JobInvoice, { eager: true })
  @JoinColumn()
  jobInvoice: JobInvoice;

  @Column({ nullable: true })
  rejectReason?: string;

  @Column({ default: false, type: 'boolean' })
  rejected?: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  rejectedAt?: Date;
}
