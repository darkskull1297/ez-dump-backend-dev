import {
  Entity,
  Column,
  JoinColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
} from 'typeorm';
import { BaseModel } from '../common/base.model';
import { Location } from '../location/location.model';
import { User } from '../user/user.model';
import { Job } from '../jobs/job.model';
import { JobInvoice } from '../invoices/job-invoice.model';
import { RequestTruck } from '../jobs/request-truck.model';
import { Material } from './material.model';
import { Customer } from '../customer/customer.model';
import { GeneralJobStatus } from './general-job-status';
import { Foreman } from '../user/foreman.model';

@Entity()
export class GeneralJob extends BaseModel {
  @Column()
  name: string;

  @ManyToOne(type => User, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @Column(type => Location)
  address?: Location;

  @Column({ type: 'real' })
  budget: number;

  @OneToMany(
    type => Job,
    job => job.generalJob,
    { cascade: true },
  )
  jobs?: Job;

  @Column({
    nullable: true,
  })
  terms?: number;

  @Column({
    type: 'enum',
    enum: GeneralJobStatus,
    nullable: true,
  })
  status? = GeneralJobStatus.ACTIVE;

  @Column({ type: 'timestamptz', nullable: true })
  startDate?: Date;

  @OneToMany(
    type => RequestTruck,
    requestTruck => requestTruck.generalJob,
    { cascade: true },
  )
  requestedTrucks?: RequestTruck;

  @OneToMany(
    type => Job,
    job => job.weeklyInvoice,
    { cascade: true },
  )
  invoices?: JobInvoice[];

  @OneToMany(
    type => Material,
    material => material.generalJob,
    { eager: true, nullable: true },
  )
  materials?: Material[];

  @ManyToOne(
    () => Customer,
    customer => customer,
    { eager: true, nullable: true },
  )
  @JoinColumn()
  customer: Customer;

  @ManyToMany(
    () => Foreman,
    foreman => foreman.generalJobs,
    { nullable: true },
  )
  foremans?: Foreman[];
}
