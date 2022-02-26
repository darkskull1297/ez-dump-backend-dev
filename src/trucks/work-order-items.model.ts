import { Entity, Column, ManyToOne, JoinColumn, Generated } from 'typeorm';

import { BaseModel } from '../common/base.model';
import { WorkOrder } from './work-order.model';
import { Truck } from './truck.model';
import { User } from '../user/user.model';

@Entity()
export class WorkOrderItems extends BaseModel {
  @Column({ unique: true })
  @Generated('increment')
  number?: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  comments?: string;

  @Column('decimal', { scale: 2 })
  labor: number;

  @Column('decimal', { scale: 2 })
  parts: number;

  @ManyToOne(type => WorkOrder, { nullable: false })
  @JoinColumn()
  workOrder: WorkOrder;

  @ManyToOne(type => Truck, { nullable: false })
  @JoinColumn()
  truck: Truck;

  @ManyToOne(type => User, { nullable: false })
  @JoinColumn()
  user: User;
}
