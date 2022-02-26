import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from '../common/base.repository';
import { GeneralJob } from './general-job.model';
import { User } from '../user/user.model';
import { Foreman } from '../user/foreman.model';
import { Dispatcher } from '../user/dispatcher.model';
import { Admin } from '../user/admin.model';

@Injectable()
export class GeneralJobRepo extends BaseRepository<GeneralJob>(GeneralJob) {
  constructor(
    @InjectRepository(GeneralJob)
    private readonly generalJobRepository: Repository<GeneralJob>,
  ) {
    super(generalJobRepository);
  }

  findGeneralJob(generalJobId: string, user: User): Promise<GeneralJob> {
    return this.generalJobRepository
      .createQueryBuilder('generalJob')
      .leftJoinAndSelect('generalJob.user', 'user')
      .leftJoinAndSelect('generalJob.foremans', 'foremans')
      .leftJoinAndSelect('generalJob.customer', 'customer')
      .leftJoinAndSelect('generalJob.materials', 'materials')
      .where('generalJob.id = :generalJobId', { generalJobId })
      .andWhere('user.id = :id', { id: user.id })
      .getOne();
  }

  findGeneralJobs(
    user: User,
    {
      skip,
      count,
      customerId,
    }: { skip: number; count: number; customerId?: string },
  ): Promise<GeneralJob[]> {
    const query = this.generalJobRepository
      .createQueryBuilder('generalJob')
      .leftJoinAndSelect('generalJob.user', 'user')
      .leftJoinAndSelect('generalJob.customer', 'customer')
      .leftJoinAndSelect('generalJob.foremans', 'foremans')
      .leftJoinAndSelect('generalJob.materials', 'materials');

    if (customerId) {
      query.andWhere('customer.id = :customerId', { customerId });
    }
    return query
      .where('user.id = :id', { id: user.id })
      .orderBy('generalJob.createdAt', 'ASC')
      .skip(skip)
      .take(count)
      .getMany();
  }

  findAdminGeneralJobs(
    user: Admin,
    { skip, count }: { skip: number; count: number },
  ): Promise<GeneralJob[]> {
    return this.generalJobRepository
      .createQueryBuilder('generalJob')
      .leftJoinAndSelect('generalJob.user', 'contractor')
      .leftJoinAndSelect('contractor.company', 'company')
      .orderBy('generalJob.createdAt', 'ASC')
      .skip(skip)
      .take(count)
      .getMany();
  }

  findForemanGeneralJobs(
    user: Foreman | Dispatcher,
    { skip, count }: { skip: number; count: number },
  ): Promise<GeneralJob[]> {
    return this.generalJobRepository
      .createQueryBuilder('generalJob')
      .leftJoinAndSelect('generalJob.user', 'contractor')
      .leftJoinAndSelect('contractor.company', 'company')
      .where('company.id = :id', { id: user.contractorCompany.id })
      .orderBy('generalJob.createdAt', 'ASC')
      .skip(skip)
      .take(count)
      .getMany();
  }

  findForemanGeneralJob(
    generalJobId: string,
    user: Foreman,
  ): Promise<GeneralJob> {
    return this.generalJobRepository
      .createQueryBuilder('generalJob')
      .leftJoinAndSelect('generalJob.user', 'contractor')
      .leftJoinAndSelect('contractor.company', 'company')
      .where('generalJob.id = :generalJobId', { generalJobId })
      .andWhere('company.id = :id', { id: user.contractorCompany.id })
      .getOne();
  }

  findAdminGeneralJob(generalJobId: string): Promise<GeneralJob> {
    return this.generalJobRepository
      .createQueryBuilder('generalJob')
      .leftJoinAndSelect('generalJob.user', 'contractor')
      .leftJoinAndSelect('contractor.company', 'company')
      .where('generalJob.id = :generalJobId', { generalJobId })
      .getOne();
  }

  findByCustomer(
    customerId: string,
    startDate: string,
    endDate: string,
  ): Promise<GeneralJob[]> {
    return this.generalJobRepository
      .createQueryBuilder('generalJob')
      .leftJoinAndSelect('generalJob.customer', 'customer')
      .leftJoinAndSelect('generalJob.jobs', 'job')
      .leftJoinAndSelect('job.driverInvoices', 'driverInvoices')
      .where('customer.id = :customerId', { customerId })
      .andWhere('driverInvoices.createdAt BETWEEN :start AND :end', {
        start: new Date(startDate),
        end: new Date(endDate),
      })
      .getMany();
  }
}
