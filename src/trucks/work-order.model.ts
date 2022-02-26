import { Entity, Column, ManyToOne, JoinColumn, Generated, OneToMany } from 'typeorm';

import { BaseModel } from '../common/base.model';
import { Assets } from './assets.model';
import { TaskOrder } from './task-order.model';
import { Truck } from './truck.model';
import { User } from '../user/user.model';
import { WorkOrderItems } from './work-order-items.model';

@Entity()
export class WorkOrder extends BaseModel {
  @Column({ unique: true })
  @Generated('increment')
  orderNumber?: number;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt?: Date;

  @Column({ type: 'timestamptz' })
  dueDate: Date;

  @Column()
  status: string;

  @Column()
  mechanic: string;

  @Column({ nullable: true })
  miles?: number;

  @ManyToOne(type => Assets, { nullable: true })
  @JoinColumn()
  assets?: Assets;

  @ManyToOne(type => TaskOrder, { nullable: true })
  @JoinColumn()
  taskOrder?: TaskOrder;

  @ManyToOne(type => Truck, { nullable: false })
  @JoinColumn()
  truck: Truck;

  @ManyToOne(type => User, { nullable: false })
  @JoinColumn()
  user: User;

  @OneToMany(
    type => WorkOrderItems,
    workOrderItems => workOrderItems.workOrder,
    { nullable: false }
  )
  @JoinColumn()
  workOrderItems?: WorkOrderItems[];
}
