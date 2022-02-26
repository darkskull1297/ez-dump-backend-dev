import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseModel } from '../common/base.model';
import { GeneralJob } from './general-job.model';
import { JobCommodity } from '../jobs/job-commodity';
import { TruckType } from '../trucks/truck-type';

@Entity()
export class Material extends BaseModel {
  @Column()
  name: string;

  @Column({ nullable: true })
  billCustomer: string;

  @Column({ nullable: true })
  partnerRate: string;

  @Column({ nullable: true })
  subcontractorRate: string;

  @ManyToOne(type => GeneralJob, { onDelete: 'CASCADE' })
  @JoinColumn()
  generalJob: GeneralJob;

  @Column({
    type: 'enum',
    enum: TruckType,
    nullable: true,
  })
  truckType: TruckType;

  @Column({
    type: 'enum',
    enum: JobCommodity,
    nullable: true,
  })
  payBy: JobCommodity;
}
