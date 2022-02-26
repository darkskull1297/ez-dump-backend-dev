import {
  Entity,
  JoinColumn,
  ManyToOne,
  Column,
  OneToOne,
  Generated,
  OneToMany,
} from 'typeorm';
import { BaseModel } from '../common/base.model';
import { DriverJobInvoice } from './driver-job-invoice.model';
import { User } from '../user/user.model';
import { OwnerJobInvoice } from './owner-job-invoice.model';
import { DisputeInvoiceStatus } from './dispute-invoice-status';
import {DisputeLoads} from './dispute-loads.model';

@Entity()
export class DisputeInvoice extends BaseModel {
  @OneToOne(() => DriverJobInvoice, {
    eager: true,
    cascade: true,
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn()
  driverJobInvoice?: DriverJobInvoice;

  @OneToOne(() => DriverJobInvoice, {
    eager: true,
    cascade: true,
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn()
  resultDriverJobInvoice?: DriverJobInvoice;

  @OneToOne(() => DriverJobInvoice, {
    eager: true,
    cascade: true,
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn()
  previousDriverInvoice?: DriverJobInvoice;

  @Column({
    type: 'enum',
    enum: DisputeInvoiceStatus,
    nullable: true,
  })
  status? = DisputeInvoiceStatus.PENDING;

  @OneToOne(() => OwnerJobInvoice, {
    eager: true,
    cascade: true,
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn()
  ownerJobInvoice?: OwnerJobInvoice;

  @Column({ type: 'timestamptz', nullable: true })
  canceledAt?: Date;

  @Column({ nullable: true })
  result?: string;

  @Column({ nullable: true })
  resolution?: string;

  @Column({ nullable: true })
  reasons?: string;

  @Column({ nullable: true })
  requirements?: string;

  @Column({ unique: true })
  @Generated('increment')
  disputeNumber?: number;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn()
  requestBy: User;

  @Column({ nullable: true })
  requestByRole?: string;

  @Column('text', { array: true, default: {} })
  resultResume?: string[];

  @Column('text', { array: true, default: {} })
  evidences?: string[];

  @OneToMany(
    () => DisputeLoads,
    disputeLoads => disputeLoads.disputeInvoice,
    { eager: true, cascade: true }
  )
  disputeLoads: DisputeLoads[]
}
