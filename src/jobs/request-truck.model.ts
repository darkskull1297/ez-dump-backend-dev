import { Entity, Column, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

import { BaseModel } from '../common/base.model';
import { Location } from '../location/location.model';
import { Contractor } from '../user/contractor.model';
import { Foreman } from '../user/foreman.model';
import { TruckCategoryRequestTruck } from '../trucks/truck-category-request-truck.model';
import { JobStatus } from './job-status';
import { GeneralJob } from '../general-jobs/general-job.model';

@Entity()
export class RequestTruck extends BaseModel {
  @Column({ type: 'timestamptz' })
  startDate: Date;

  @Column({ type: 'timestamptz' })
  endDate: Date;

  @Column({
    type: 'enum',
    enum: JobStatus,
  })
  status? = JobStatus.REQUESTED;

  @ManyToOne(type => Contractor, { eager: true, nullable: true })
  @JoinColumn()
  contractor: Contractor;

  @ManyToOne(type => Foreman, { eager: true, nullable: true })
  @JoinColumn()
  foreman: Foreman;

  @Column(type => Location)
  loadSite: Location;

  @Column(type => Location)
  dumpSite: Location;

  @Column()
  material: string;

  @Column()
  directions: string;

  @Column({ nullable: true })
  onSite: boolean;

  @OneToMany(
    type => TruckCategoryRequestTruck,
    truckCat => truckCat.requestTruck,
    { eager: true, cascade: true },
  )
  truckCategories?: TruckCategoryRequestTruck[];

  @ManyToOne(
    type => GeneralJob,
    job => job.requestedTrucks,
    { nullable: true, eager: true },
  )
  @JoinColumn()
  generalJob: GeneralJob;
}
