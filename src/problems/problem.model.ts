import { Entity, Column, JoinColumn, ManyToOne } from 'typeorm';
import { BaseModel } from '../common/base.model';
import { Job } from '../jobs/job.model';
import { Location } from '../location/location.model';
import { User } from '../user/user.model';

@Entity()
export class Problem extends BaseModel {
  @Column()
  subject: string;

  @Column()
  description: string;

  @Column(type => Location)
  location: Location;

  @Column({ type: 'timestamptz' })
  date: Date;

  @ManyToOne(type => User, { eager: true, cascade: true })
  @JoinColumn()
  user: User;

  @ManyToOne(type => Job, { eager: true, cascade: true })
  @JoinColumn()
  job: Job;
}
