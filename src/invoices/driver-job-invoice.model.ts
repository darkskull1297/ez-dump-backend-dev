import {
  Entity,
  Column,
  JoinColumn,
  ManyToOne,
  OneToMany,
  OneToOne,
} from 'typeorm';
import { BaseModel } from '../common/base.model';
import { Job } from '../jobs/job.model';
import { TimeEntry } from '../timer/time-entry.model';
import { Truck } from '../trucks/truck.model';
import { Driver } from '../user/driver.model';
import { OwnerJobInvoice } from './owner-job-invoice.model';
import { TruckCategory } from '../trucks/truck-category.model';
import { DisputeInvoice } from './dispute-invoice.model';
import { Bill } from '../bill/bill.model';
import { PaymentMethod } from './payment-method';
import {Loads} from '../geolocation/loads.model';

@Entity()
export class DriverJobInvoice extends BaseModel {
  @Column('boolean', { default: false, nullable: true })
  isAcceptedByOwner? = false;

  @Column('boolean', { default: false, nullable: true })
  isAcceptedByContractor? = false;

  @Column({ type: 'real' })
  amount: number;

  @Column({ nullable: true })
  travelTime?: string;

  @Column({ type: 'real' })
  hours: number;

  @Column({ type: 'real', nullable: true, scale: 2 })
  sumTons?: number;

  @Column({ type: 'real', nullable: true })
  sumLoad?: number;

  @Column({ nullable: true })
  ticketNumber: number;

  @ManyToOne(() => Driver)
  @JoinColumn()
  driver: Driver;

  @ManyToOne(() => TruckCategory, {
    eager: true,
    cascade: true,
    onDelete: 'CASCADE',
    nullable: true,
  })
  @JoinColumn()
  category?: TruckCategory;

  @ManyToOne(() => Truck)
  @JoinColumn()
  truck: Truck;

  @ManyToOne(
    () => Job,
    job => job.driverInvoices,
  )
  @JoinColumn()
  job: Job;

  @ManyToOne(() => OwnerJobInvoice, {
    nullable: true,
  })
  @JoinColumn()
  ownerInvoice?: OwnerJobInvoice;

  @OneToMany(
    () => TimeEntry,
    timeEntry => timeEntry.driverJobInvoice,
  )
  timeEntries: TimeEntry[];

  @OneToMany(
    () => Loads, 
    loads => loads.driverInvoice,
    { cascade: true }
  )
  loads: Loads[];

  @OneToOne(
    () => DisputeInvoice,
    disputeInvoice => disputeInvoice.driverJobInvoice,
    { onDelete: 'CASCADE', nullable: true },
  )
  disputeInvoice?: DisputeInvoice;

  @OneToOne(
    () => DisputeInvoice,
    disputeInvoice => disputeInvoice.resultDriverJobInvoice,
    { onDelete: 'CASCADE', nullable: true },
  )
  resultDisputeInvoice?: DisputeInvoice;

  @OneToOne(
    () => DisputeInvoice,
    disputeInvoice => disputeInvoice.previousDriverInvoice,
    { onDelete: 'CASCADE', nullable: true },
  )
  previousDisputeInvoice?: DisputeInvoice;

  @Column('boolean', { default: false })
  isPaid?: boolean;

  @Column({ nullable: true, type: 'enum', enum: PaymentMethod })
  paidWith?: PaymentMethod;

  @Column({ nullable: true })
  signatureImg?: string;

  @Column('text', { array: true, nullable: true })
  evidenceImgs: string[];

  @Column({ type: 'real', nullable: true })
  totalTravels?: number;

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @Column({ nullable: true })
  jobOrderNumber: number;

  ticketEntries: any[];

  @Column('text', { nullable: true })
  supervisorName?: string;

  @Column('text', { nullable: true })
  supervisorComment?: string;

  @Column('real', { nullable: true })
  travelTimeSupervisor?: number;

  @ManyToOne(
    () => Bill,
    bill => bill.driverInvoices,
    { nullable: true },
  )
  @JoinColumn()
  bill?: Bill;

  @Column({ nullable: true })
  orderNumber: string;

  @Column({ nullable: true })
  accountNumber: string;

  @Column({ nullable: true, type: 'timestamptz' })
  paidAt: string;
}
