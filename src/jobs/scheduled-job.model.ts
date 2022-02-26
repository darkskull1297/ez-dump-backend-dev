import { Entity, JoinColumn, OneToMany, ManyToOne, Column } from 'typeorm';

import { Job } from './job.model';
import { JobAssignation } from './job-assignation.model';
import { BaseModel } from '../common/base.model';
import { OwnerCompany } from '../company/owner-company.model';
import { OwnerJobInvoice } from '../invoices/owner-job-invoice.model';

@Entity()
export class ScheduledJob extends BaseModel {
  @ManyToOne(type => Job, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn()
  job: Job;

  @ManyToOne(type => OwnerCompany, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn()
  company: OwnerCompany;

  @OneToMany(
    type => JobAssignation,
    assignation => assignation.scheduledJob,
    { eager: true, cascade: true },
  )
  assignations?: JobAssignation[];

  @Column({ type: 'timestamptz' })
  paymentDue: Date;

  @Column({ type: 'timestamptz', nullable: true })
  canceledAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt?: Date;

  @Column({ default: false })
  isCanceled?: boolean = false;

  @OneToMany(
    () => OwnerJobInvoice,
    invoice => invoice.scheduledJob,
  )
  ownerJobInvoice?: OwnerJobInvoice;

  @Column({ default: false })
  canceledByOwner?: boolean = false;

  @Column({ default: false })
  disputeRequest?: boolean = false;

  @Column({ nullable: true })
  disputeMessage?: string;

  @Column({ default: false })
  disputeReviewed?: boolean = false;

  @Column({ default: false })
  disputeConfirmed?: boolean = false;

  isStarted?(): boolean {
    return this.assignations.reduce((acc, assignation) => {
      return acc || !!assignation.startedAt;
    }, false);
  }

  isFinished?(): boolean {
    return this.assignations.reduce((acc, assignation) => {
      return acc && !!assignation.finishedAt;
    }, true);
  }
}
