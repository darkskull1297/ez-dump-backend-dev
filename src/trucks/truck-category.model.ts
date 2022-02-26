import {
  Entity,
  Column,
  ManyToOne,
  JoinColumn,
  OneToOne,
  OneToMany,
} from 'typeorm';

import { BaseModel } from '../common/base.model';
import { TruckType } from './truck-type';
import { TruckSubType } from './truck-subtype';
import { Job } from '../jobs/job.model';
import { Truck } from './truck.model';
import { JobAssignation } from '../jobs/job-assignation.model';
import { DriverJobInvoice } from '../invoices/driver-job-invoice.model';
import { RequestTruck } from '../jobs/request-truck.model';
import { JobCommodity } from '../jobs/job-commodity';

@Entity()
export class TruckCategory extends BaseModel {
  @ManyToOne(type => Job, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn()
  job: Job;

  @ManyToOne(type => RequestTruck, { nullable: true, onDelete: 'CASCADE' })
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

  @Column({ type: 'real', array: true })
  price: number[];

  @Column({ type: 'real', array: true })
  customerRate: number[];

  @Column({ type: 'real', array: true })
  partnerRate: number[];

  @ManyToOne(
    type => Truck,
    truck => truck.truckCategories,
    { onDelete: 'CASCADE', nullable: true, eager: true },
  )
  @JoinColumn()
  preferredTruck: Truck;

  @OneToMany(
    () => DriverJobInvoice,
    driverInvoice => driverInvoice.category,
    { onDelete: 'CASCADE', nullable: true },
  )
  driverInvoice?: DriverJobInvoice;

  @Column('boolean', { default: false })
  isScheduled? = false;

  @Column('boolean', { default: false })
  isActive? = false;

  @OneToOne(
    type => JobAssignation,
    assignation => assignation.category,
    { onDelete: 'CASCADE', nullable: true },
  )
  assignation?: JobAssignation;

  @Column({ type: 'enum', enum: JobCommodity, array: true })
  payBy: JobCommodity[];

  checkSubType(truckSubtype: TruckSubType[]): boolean {
    let contains = false;
    this.truckSubtypes.forEach(type => {
      truckSubtype.forEach(types => {
        if (type === types) contains = true;
      });
    });

    return contains;
  }

  isAssignableToTruck?(truck: Truck): boolean {
    return (
      this.truckTypes.find(val => val === truck.type) &&
      this.checkSubType(truck.subtype)
    );
  }
}
