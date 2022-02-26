import {
  Entity,
  Column,
  JoinColumn,
  ManyToOne,
  OneToMany,
  Generated,
} from 'typeorm';

import { BaseModel } from '../common/base.model';
import { Location } from '../location/location.model';
import { User } from '../user/user.model';
import { TruckCategory } from '../trucks/truck-category.model';
import { ScheduledJob } from './scheduled-job.model';
import { JobStatus } from './job-status';
import { DriverWeeklyInvoice } from '../invoices/driver-weekly-invoice.model';
import { GeneralJob } from '../general-jobs/general-job.model';
import { Loads } from '../geolocation/loads.model';
import { DriverJobInvoice } from '../invoices/driver-job-invoice.model';
import { OwnerJobInvoice } from '../invoices/owner-job-invoice.model';

@Entity()
export class Job extends BaseModel {
  @Column({ nullable: true })
  name?: string;

  @Column({ unique: true })
  @Generated('increment')
  orderNumber?: number;

  @Column({ type: 'timestamptz' })
  startDate: Date;

  @Column({ type: 'timestamptz' })
  endDate: Date;

  @Column({ type: 'timestamptz' })
  paymentDue: Date;

  @Column({ type: 'timestamptz', nullable: true })
  finishedAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  canceledAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt?: Date;

  @Column({
    type: 'enum',
    enum: JobStatus,
  })
  status? = JobStatus.PENDING;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @OneToMany(
    () => DriverJobInvoice,
    invoice => invoice.job,
  )
  driverInvoices?: DriverJobInvoice[];

  @Column(() => Location)
  loadSite: Location;

  @Column(() => Location)
  dumpSite: Location;

  @Column()
  material: string;

  @Column()
  directions: string;

  @OneToMany(
    () => TruckCategory,
    truckCat => truckCat.job,
    { eager: true, cascade: true },
  )
  // @JoinColumn()
  truckCategories?: TruckCategory[];

  @ManyToOne(
    () => GeneralJob,
    job => job.jobs,
    { nullable: true },
  )
  @JoinColumn()
  generalJob?: GeneralJob;

  @OneToMany(
    () => ScheduledJob,
    scheduled => scheduled.job,
  )
  scheduledJobs?: ScheduledJob[];

  @OneToMany(
    () => OwnerJobInvoice,
    ownInvoice => ownInvoice.job,
  )
  ownerJobInvoice?: OwnerJobInvoice;

  @ManyToOne(() => DriverWeeklyInvoice, { nullable: true })
  @JoinColumn()
  weeklyInvoice?: DriverWeeklyInvoice;

  @Column('boolean', { default: false })
  sentNotFilledEmail? = false;

  isScheduled?(): boolean {
    return this.truckCategories.reduce(
      (acc, category) => acc && category.isScheduled,
      true,
    );
  }

  @Column('boolean', { default: false })
  onSite: boolean;

  @Column('boolean', { default: false, nullable: true })
  onHold?: boolean;

  @OneToMany(
    () => Loads,
    loads => loads.job,
  )
  loads?: Loads[];
}
