import { Entity, Column } from 'typeorm';

import { BaseModel } from '../common/base.model';
import { TruckType } from './truck-type';
import { TruckSubType } from './truck-subtype';

@Entity()
export class TruckLog extends BaseModel {
  @Column('text')
  number: string;

  @Column('boolean', { default: true })
  isActive = true;

  @Column()
  company: string;

  @Column({ precision: 0, type: 'timestamptz', nullable: true })
  deletedAt: Date;

  @Column({
    type: 'enum',
    enum: TruckType,
  })
  type: TruckType;

  @Column({
    type: 'enum',
    enum: TruckSubType,
    array: true,
    nullable: true,
  })
  subtype: TruckSubType[];

  @Column({ type: 'real' })
  grossTons: number;

  @Column({ type: 'real' })
  tareWeight: number;

  @Column({ type: 'real' })
  netTons: number;

  @Column()
  VINNumber: string;

  @Column()
  plateNumber: string;

  @Column()
  truckMakeAndModel: string;

  @Column()
  truckYear: string;

  @Column('real', { nullable: true, default: 0 })
  miles?: number;

  @Column({ nullable: true })
  registrationCard?: string;
}
