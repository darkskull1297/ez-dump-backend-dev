import { Entity, JoinColumn, ManyToOne, Column, OneToMany } from 'typeorm';
import { BaseModel } from '../common/base.model';
import { Truck } from '../trucks/truck.model';
import { ScheduledJob } from './scheduled-job.model';
import { TruckCategory } from '../trucks/truck-category.model';
import { Driver } from '../user/driver.model';

import { SwitchStatus } from './dto/switch-request-dto';
import { User } from '../user/user.model';
import { JobCommodity } from './job-commodity';
import { TimeEntry } from '../timer/time-entry.model';
import { Loads } from '../geolocation/loads.model';

@Entity()
export class JobAssignation extends BaseModel {
  @Column({ type: 'real', nullable: true, scale: 2 })
  tons?: number;

  @Column({ type: 'real', nullable: true })
  load?: number;

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @OneToMany(
    () => TimeEntry,
    entry => entry.driverAssignation,
    { cascade: true },
  )
  timeEntries: TimeEntry[];

  @OneToMany(
    () => Loads,
    loads => loads.assignation,
  )
  loads: Loads[];

  @ManyToOne(() => Truck, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn()
  truck: Truck;

  @ManyToOne(() => Driver, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn()
  driver: Driver;

  @ManyToOne(() => ScheduledJob, { onDelete: 'CASCADE' })
  @JoinColumn()
  scheduledJob: ScheduledJob;

  @ManyToOne(() => TruckCategory, {
    eager: true,
    cascade: true,
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  category: TruckCategory;

  @ManyToOne(() => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn()
  finishedBy: User;

  @Column({ nullable: true, type: 'timestamptz' })
  startedAt?: Date;

  @Column({ nullable: true, type: 'timestamptz' })
  finishedAt?: Date;

  @Column({ nullable: true })
  signatureImg?: string;

  @Column('text', { array: true, nullable: true })
  evidenceImgs: string[];

  @Column({ type: 'real', nullable: true })
  totalTravels?: number;

  @Column('boolean', { default: false })
  sentNeverStartedJobEmail? = false;

  @Column('boolean', { default: null, nullable: true })
  finishByUser? = false;

  @Column('boolean', { default: false, nullable: false })
  isInSite: boolean;

  @Column('int', { default: 0, nullable: false })
  notifications: number;

  @Column('text', { default: SwitchStatus.NOT_REQUESTED })
  switchStatus: string;

  @Column('text', { nullable: true })
  supervisorName?: string;

  @Column('text', { nullable: true })
  supervisorComment?: string;

  @Column('real', { nullable: true })
  travelTimeSupervisor?: number;

  @Column('real', { nullable: true })
  price: number;

  @Column('real', { nullable: true })
  customerRate: number;

  @Column('real', { nullable: true })
  partnerRate: number;

  @Column({
    type: 'enum',
    enum: JobCommodity,
    nullable: true,
  })
  payBy: JobCommodity;

  @Column('real', { nullable: true })
  hours: number;
}
