import { Entity, Column, JoinColumn, ManyToOne, OneToMany } from 'typeorm';
import { BaseModel } from '../common/base.model';
import { Job } from '../jobs/job.model';
import { TimeEntry } from '../timer/time-entry.model';
import { TruckPunch } from '../trucks/truck-punch.model';
import { Driver } from '../user/driver.model';

@Entity()
export class DriverWeeklyInvoice extends BaseModel {
  @Column('boolean', { default: false })
  isPaid? = false;

  @Column({ type: 'real' })
  amount: number;

  @Column({ type: 'real' })
  hours: number;

  @Column({ type: 'timestamptz' })
  startDate: Date;

  @Column({ type: 'timestamptz' })
  endDate: Date;

  @ManyToOne(type => Driver)
  @JoinColumn()
  driver: Driver;

  @OneToMany(
    type => Job,
    job => job.weeklyInvoice,
  )
  jobs: Job[];

  @OneToMany(
    type => TimeEntry,
    timeEntry => timeEntry.weeklyInvoice,
  )
  timeEntries: TimeEntry[];

  @OneToMany(
    type => TruckPunch,
    truckPunch => truckPunch.driverWeeklyInvoice,
  )
  truckPunchs: TruckPunch[];
}
