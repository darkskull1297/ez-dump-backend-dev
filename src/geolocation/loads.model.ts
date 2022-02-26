import { Entity, Column, Unique, ManyToOne, JoinColumn } from 'typeorm';
import { BaseModel } from '../common/base.model';
import { Truck } from '../trucks/truck.model';
import { JobAssignation } from '../jobs/job-assignation.model';
import { Job } from '../jobs/job.model';
import { DriverJobInvoice } from '../invoices/driver-job-invoice.model';

// If is in load_site create a new row with the information.
// If is in dump_site, update the previous row with additional information.

// Repeat the process.

@Unique(['job', 'truck', 'assignation', 'loadNumber', 'driverInvoice'])
@Entity()
export class Loads extends BaseModel {
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
    (truck) => truck.loads,
    { cascade: true, eager: true },
  )
  @JoinColumn()
  truck: Truck;

  @ManyToOne(
    () => JobAssignation,
    (jobAss) => jobAss.loads,
    { cascade: true, eager: true },
  )
  @JoinColumn()
  assignation: JobAssignation;

  @ManyToOne(
    () => Job,
    (job) => job.loads,
    { cascade: true },
  )
  @JoinColumn()
  job: Job;

  @ManyToOne(
    () => DriverJobInvoice,
    (driverInvoice) => driverInvoice.loads,
    { nullable: true }
  )
  @JoinColumn()
  driverInvoice?: DriverJobInvoice;
}
