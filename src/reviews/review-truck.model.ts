import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from '../common/base.model';
import { Job } from '../jobs/job.model';
import { ScheduledJob } from '../jobs/scheduled-job.model';
import { Truck } from '../trucks/truck.model';
import { User } from '../user/user.model';

@Entity()
export class ReviewTruck extends BaseModel {
  @Column({ type: 'real' })
  stars: number;

  @Column('text')
  comment: string;

  @ManyToOne(type => User, { onDelete: 'CASCADE' })
  @JoinColumn()
  user: User;

  @ManyToOne(type => Truck, { onDelete: 'CASCADE' })
  @JoinColumn()
  truck: Truck;

  @ManyToOne(type => ScheduledJob, { onDelete: 'CASCADE' })
  @JoinColumn()
  scheduledJob: ScheduledJob;
}
