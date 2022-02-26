import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';

import { BaseModel } from '../common/base.model';
import { Driver } from '../user/driver.model';
import { Owner } from '../user/owner.model';
import { Truck } from './truck.model';
import { TruckInspectionType } from './truck-inspection-type';
import { Job } from '../jobs/job.model';

@Entity()
export class TruckInspection extends BaseModel {
  @PrimaryGeneratedColumn('increment')
  inspectionNumber: number;

  @ManyToOne(type => Truck, { nullable: false })
  @JoinColumn()
  truck: Truck;

  @ManyToOne(type => Owner, { nullable: false })
  @JoinColumn()
  owner: Owner;

  @ManyToOne(type => Driver, { nullable: false })
  @JoinColumn()
  driver: Driver;

  @Column({
    type: 'enum',
    enum: TruckInspectionType,
    nullable: true,
  })
  type: TruckInspectionType;

  @Column('integer', { nullable: true })
  defects: number;

  @ManyToOne(
    type => Job,
    job => job.id,
  )
  @JoinColumn()
  job: Job;

  @Column()
  duration: string;

  @Column('real')
  locationLat: string;

  @Column('real')
  locationLong: string;
}
