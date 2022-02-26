import { Entity, Column } from 'typeorm';
import { BaseModel } from '../common/base.model';

@Entity()
export class SwitchJob extends BaseModel {
  @Column({ nullable: true })
  finalJobId: string;

  @Column()
  initialScheduledJobId: string;

  @Column({ nullable: true })
  finalScheduleJobId: string;

  @Column()
  assignationId: string;

  @Column()
  status: string;
}
