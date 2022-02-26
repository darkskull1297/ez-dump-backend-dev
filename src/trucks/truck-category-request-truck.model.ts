import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';

import { BaseModel } from '../common/base.model';
import { TruckType } from './truck-type';
import { TruckSubType } from './truck-subtype';
import { RequestTruck } from '../jobs/request-truck.model';
import { JobCommodity } from '../jobs/job-commodity';

@Entity()
export class TruckCategoryRequestTruck extends BaseModel {
  @Column({
    type: 'integer',
  })
  amount: number;

  @ManyToOne(type => RequestTruck, { onDelete: 'CASCADE' })
  @JoinColumn()
  requestTruck: RequestTruck;

  @Column({
    type: 'enum',
    enum: TruckType,
    array: true,
  })
  truckTypes: TruckType[];

  @Column({
    type: 'enum',
    enum: TruckSubType,
    array: true,
  })
  truckSubtypes: TruckSubType[];

  @Column({
    type: 'enum',
    enum: JobCommodity,
    array: true,
  })
  payBy: JobCommodity[];

  @Column({ type: 'real', array: true })
  price: number[];

  @Column({ type: 'real', array: true })
  customerRate: number[];

  @Column({ type: 'real', array: true })
  partnerRate: number[];
}
