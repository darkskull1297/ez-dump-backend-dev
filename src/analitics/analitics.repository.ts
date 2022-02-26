import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job } from '../jobs/job.model';
import { BaseRepository } from '../common/base.repository';
import { OwnerJobInvoiceRepo } from '../invoices/owner-job-invoice.repository';
import { JobInvoiceRepo } from '../invoices/job-invoice.repository';

@Injectable()
export class AnaliticsOwnerRepository extends BaseRepository<Job>(Job) {
  constructor(
    @InjectRepository(Job)
    private readonly jobRepository: Repository<Job>,
    private readonly ownerJobInvoiceRepo: OwnerJobInvoiceRepo,
    private readonly jobInvoiceRepo: JobInvoiceRepo,
  ) {
    super(jobRepository);
  }

  async getOwnerAnalitics(owner): Promise<any> {
    const jobDetails = await this.ownerJobInvoiceRepo
      .getRepository()
      .createQueryBuilder('ownerInvoice')
      .leftJoinAndSelect('ownerInvoice.owner', 'owner')
      .leftJoinAndSelect('ownerInvoice.job', 'job')
      .leftJoinAndSelect('job.generalJob', 'generalJob')
      .leftJoinAndSelect('ownerInvoice.driverInvoices', 'driverInvoice')
      .select('SUM(driverInvoice.sumTons)', 'totalTons')
      .addSelect('sum(driverInvoice.sumLoad)', 'totalLoads')
      .addSelect('SUM(driverInvoice.hours)', 'totalHours')
      .addSelect('generalJob.id', 'jobId')
      .addSelect('generalJob.name', 'jobName')
      .groupBy('generalJob.id')
      .where('owner.id = :id', { id: owner.id })
      .andWhere('driverInvoice.hours != :val', { val: NaN })
      .getRawMany();

    const driversDetails = await this.ownerJobInvoiceRepo
      .getRepository()
      .createQueryBuilder('ownerInvoice')
      .leftJoinAndSelect('ownerInvoice.owner', 'owner')
      .leftJoinAndSelect('ownerInvoice.driverInvoices', 'driverInvoice')
      .leftJoinAndSelect('driverInvoice.driver', 'driver')
      .select('SUM(driverInvoice.sumTons)', 'totalTons')
      .addSelect('sum(driverInvoice.sumLoad)', 'totalLoads')
      .addSelect('SUM(driverInvoice.hours)', 'totalHours')
      .addSelect('driver.id', 'driverId')
      .addSelect('driver.name', 'driverName')
      .groupBy('driver.id')
      .where('owner.id = :id', { id: owner.id })
      .andWhere('driverInvoice.hours != :val', { val: NaN })
      .getRawMany();

    const truckDetails = await this.ownerJobInvoiceRepo
      .getRepository()
      .createQueryBuilder('ownerInvoice')
      .leftJoinAndSelect('ownerInvoice.owner', 'owner')
      .leftJoinAndSelect('ownerInvoice.driverInvoices', 'driverInvoice')
      .leftJoinAndSelect('driverInvoice.truck', 'truck')
      .select('SUM(driverInvoice.sumTons)', 'totalTons')
      .addSelect('sum(driverInvoice.sumLoad)', 'totalLoads')
      .addSelect('SUM(driverInvoice.hours)', 'totalHours')
      .addSelect('truck.id', 'truckId')
      .addSelect('truck.number', 'truckNumber')
      .groupBy('truck.id')
      .where('owner.id = :id', { id: owner.id })
      .andWhere('driverInvoice.hours != :val', { val: NaN })
      .getRawMany();

    const ownerInvoicesPaid = await this.ownerJobInvoiceRepo
      .getRepository()
      .createQueryBuilder('ownerInvoice')
      .leftJoinAndSelect('ownerInvoice.owner', 'owner')
      .select('SUM(ownerInvoice.amount)', 'totalPaid')
      .addSelect('count(ownerInvoice.id)', 'count')
      .where('owner.id = :id', { id: owner.id })
      .andWhere('ownerInvoice.isPaid = :isPaid', { isPaid: true })
      .getRawOne();

    const ownerInvoicesUnPaid = await this.ownerJobInvoiceRepo
      .getRepository()
      .createQueryBuilder('ownerInvoice')
      .leftJoinAndSelect('ownerInvoice.owner', 'owner')
      .select('SUM(ownerInvoice.amount)', 'totalPaid')
      .addSelect('count(ownerInvoice.id)', 'count')
      .where('owner.id = :id', { id: owner.id })
      .andWhere('ownerInvoice.isPaid = :isPaid', { isPaid: false })
      .getRawOne();

    return {
      jobDetails,
      driversDetails,
      truckDetails,
      ownerInvoicesPaid,
      ownerInvoicesUnPaid,
    };
  }

  async getContractorAnalitics(contractor): Promise<any> {
    const jobDetails = await this.jobInvoiceRepo
      .getRepository()
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.contractor', 'contractor')
      .leftJoinAndSelect('invoice.job', 'job')
      .leftJoinAndSelect('job.generalJob', 'generalJob')
      .leftJoinAndSelect('invoice.ownerInvoices', 'ownerInvoice')
      .leftJoinAndSelect('ownerInvoice.driverInvoices', 'driverInvoice')
      .select('SUM(driverInvoice.sumTons)', 'totalTons')
      .addSelect('sum(driverInvoice.sumLoad)', 'totalLoads')
      .addSelect('SUM(driverInvoice.hours)', 'totalHours')
      .addSelect('generalJob.id', 'generalJobId')
      .addSelect('generalJob.name', 'jobName')
      .groupBy('generalJob.id')
      .where('contractor.id = :id', { id: contractor.id })
      .andWhere('driverInvoice.hours != :val', { val: NaN })
      .getRawMany();

    const generalJobs = await this.jobRepository
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.user', 'contractor')
      .leftJoinAndSelect('job.generalJob', 'generalJob')
      .select('generalJob.id', 'generalJobId')
      .addSelect('generalJob.name', 'jobName')
      .where('contractor.id = :id', { id: contractor.id })
      .groupBy('generalJob.id')
      .getRawMany();

    const materialDetails = (
      await Promise.all(
        generalJobs.map(async job => {
          if (job.generalJobId && job.jobName) {
            const data = await this.jobInvoiceRepo
              .getRepository()
              .createQueryBuilder('invoice')
              .leftJoinAndSelect('invoice.contractor', 'contractor')
              .leftJoinAndSelect('invoice.job', 'job')
              .leftJoinAndSelect('job.generalJob', 'generalJob')
              .leftJoinAndSelect('invoice.ownerInvoices', 'ownerInvoice')
              .leftJoinAndSelect('ownerInvoice.driverInvoices', 'driverInvoice')
              .select('SUM(driverInvoice.sumTons)', 'totalTons')
              .addSelect('sum(driverInvoice.sumLoad)', 'totalLoads')
              .addSelect('SUM(driverInvoice.hours)', 'totalHours')
              .addSelect('job.material', 'material')
              .groupBy('job.material')
              .where('generalJob.id = :id', { id: job.generalJobId })
              .andWhere('driverInvoice.hours != :val', { val: NaN })
              .getRawMany();

            return {
              ...job,
              materials: data,
            };
          }
          return null;
        }),
      )
    ).filter(result => result !== null);

    const jobsStatus = (
      await Promise.all(
        generalJobs.map(async job => {
          if (job.generalJobId && job.jobName) {
            const data = await this.jobRepository
              .createQueryBuilder('job')
              .leftJoinAndSelect('job.user', 'contractor')
              .leftJoinAndSelect('job.generalJob', 'generalJob')
              .select('count(job.id)', 'count')
              .addSelect('job.status', 'status')
              .where('generalJob.id = :id', { id: job.generalJobId })
              .groupBy('job.status')
              .getRawMany();

            return {
              ...job,
              shiftsStatus: data,
            };
          }
          return null;
        }),
      )
    ).filter(result => result !== null);

    return {
      jobDetails,
      jobsStatus,
      materialDetails,
    };
  }
}
