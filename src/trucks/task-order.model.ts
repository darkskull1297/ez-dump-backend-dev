import {
  Entity,
  Column,
  OneToMany,
  ManyToOne,
  JoinColumn,
  Generated,
} from 'typeorm';

import { BaseModel } from '../common/base.model';
import { WorkOrder } from './work-order.model';
import { Truck } from './truck.model';
import { User } from '../user/user.model';

@Entity()
export class TaskOrder extends BaseModel {
  @Column({ unique: true })
  @Generated('increment')
  orderNumber?: number;

  @Column('boolean', { default: false })
  isDeleted? = false;

  @Column({ type: 'timestamptz', nullable: true })
  doneAt?: Date;

  @Column()
  status: string;

  @Column()
  title: string;

  @Column({ nullable: true })
  description?: string;

  @Column()
  interval: number;

  @Column()
  milesToTask: number;

  @Column()
  currentMiles: number;

  @Column({ nullable: true })
  lastTaskDoneOrderNumber?: number;

  @Column({ type: 'timestamptz', nullable: true })
  lastTaskDoneAt?: Date;

  @Column({ nullable: true })
  lastTaskMiles?: number;

  @OneToMany(
    type => WorkOrder,
    workOrder => workOrder.taskOrder,
    { nullable: true },
  )
  @JoinColumn()
  workOrder?: WorkOrder[];

  @ManyToOne(type => Truck, { nullable: false })
  @JoinColumn()
  truck: Truck;

  @ManyToOne(type => User, { nullable: false })
  @JoinColumn()
  user: User;
}
