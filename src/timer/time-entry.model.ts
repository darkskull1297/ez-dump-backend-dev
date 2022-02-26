import { Entity, JoinColumn, ManyToOne, Column } from 'typeorm';
import { BaseModel } from '../common/base.model';
import { User } from '../user/user.model';
import { Job } from '../jobs/job.model';
import { Truck } from '../trucks/truck.model';
import { DriverJobInvoice } from '../invoices/driver-job-invoice.model';
import { DriverWeeklyInvoice } from '../invoices/driver-weekly-invoice.model';
import { JobAssignation } from '../jobs/job-assignation.model';

@Entity()
export class TimeEntry extends BaseModel {
  @Column({ type: 'timestamptz' })
  startDate: Date;

  @Column({ nullable: true, type: 'timestamptz' })
  endDate?: Date;

  @ManyToOne(type => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @ManyToOne(type => Truck, { onDelete: 'CASCADE' })
  @JoinColumn()
  truck: Truck;

  @ManyToOne(type => Job, { onDelete: 'CASCADE' })
  @JoinColumn()
  job: Job;

  @ManyToOne(type => DriverWeeklyInvoice, { nullable: true })
  @JoinColumn()
  weeklyInvoice?: DriverWeeklyInvoice;

  @ManyToOne(type => DriverJobInvoice, { nullable: true })
  @JoinColumn()
  driverJobInvoice?: DriverJobInvoice;

  @ManyToOne(
    () => JobAssignation,
    assignation => assignation.timeEntries,
  )
  @JoinColumn()
  driverAssignation: JobAssignation;
}
