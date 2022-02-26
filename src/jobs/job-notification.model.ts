import { Entity, Column, JoinColumn, ManyToOne } from 'typeorm';

import { BaseModel } from '../common/base.model';
import { User } from '../user/user.model';
import { Job } from './job.model';

@Entity()
export class JobNotification extends BaseModel {
  @Column()
  message: string;

  @ManyToOne(type => Job)
  @JoinColumn()
  job: Job;

  @ManyToOne(() => User)
  @JoinColumn()
  user: User;

  @Column('boolean')
  cancelJob: boolean;

  @Column('boolean')
  isAutomaticallyFinished: boolean;
}
