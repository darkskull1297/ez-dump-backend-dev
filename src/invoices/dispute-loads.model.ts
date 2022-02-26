import { Entity, ManyToOne, JoinColumn, Column } from 'typeorm';
import {BaseModel} from '../common/base.model';
import {Job} from '../jobs/job.model';
import {JobAssignation} from '../jobs/job-assignation.model';
import {Truck} from '../trucks/truck.model';
import {DisputeInvoice} from './dispute-invoice.model';

@Entity()
export class DisputeLoads extends BaseModel {
  @Column('boolean')
  load: boolean;

  @Column({ type: 'boolean', default: false })
  dump: boolean;

  @Column('timestamptz')
  loadArrival: Date;

  @Column({ type: 'timestamptz', nullable: true })
  loadLeave: Date;

  @Column({ type: 'timestamptz', nullable: true })
  dumpArrival: Date;

  @Column({ type: 'timestamptz', nullable: true })
  dumpLeave: Date;

  @Column('integer')
  loadNumber: number;

  @Column({ nullable: true })
  ticket: string;

  @Column({ type: 'real', nullable: true, scale: 2 })
  tons: number;

  @ManyToOne(
    () => Truck,
    truck => truck.loads,
    { cascade: true, eager: true },
  )
  @JoinColumn()
  truck: Truck;

  @ManyToOne(
    () => JobAssignation,
    jobAss => jobAss.loads,
    { cascade: true, eager: true },
  )
  @JoinColumn()
  assignation: JobAssignation;

  @ManyToOne(
    () => Job,
    job => job.loads,
    { cascade: true },
  )
  @JoinColumn()
  job: Job;

  @ManyToOne(
    () => DisputeInvoice,
    disputeInvoice => disputeInvoice.disputeLoads,
  )
  @JoinColumn()
  disputeInvoice?: DisputeInvoice;

}
