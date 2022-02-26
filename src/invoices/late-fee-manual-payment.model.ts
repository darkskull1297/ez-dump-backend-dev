import { Entity, Column, JoinColumn, ManyToOne } from 'typeorm';

import { BaseModel } from '../common/base.model';
import { LateFeeInvoice } from './late-fee-invoice.model';

@Entity()
export class LateFeeManualPayment extends BaseModel {
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

  @ManyToOne(() => LateFeeInvoice, { eager: true })
  @JoinColumn()
  lateFeeInvoice: LateFeeInvoice;

  @Column({ nullable: true })
  rejectReason?: string;

  @Column({ default: false, type: 'boolean' })
  rejected?: boolean;

  @Column({ type: 'timestamptz', nullable: true })
  rejectedAt?: Date;
}
