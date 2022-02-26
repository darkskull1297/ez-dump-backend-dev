import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { BaseRepository } from '../common/base.repository';
import { Truck } from './truck.model';
import { DocumentNotFoundException } from '../common/exceptions/document-not-found.exception';
import { TypeOrmException } from '../common/exceptions/type-orm.exception';
import { OwnerCompanyRepo } from '../company/owner-company.repository';
import { Job } from '../jobs/job.model';
import { JobStatus } from '../jobs/job-status';
import { parseDateToTimestamp } from '../util/date-utils';
import { Owner } from '../user/owner.model';
import { OwnerCompany } from '../company/owner-company.model';

export type TruckCreateType = Omit<
Truck,
'id' | 'createdAt' | 'updatedAt' | 'company'
> & {
  company?: OwnerCompany | string;
};

export type TruckUpdateType = Partial<TruckCreateType>;

@Injectable()
export class TruckRepo extends BaseRepository<Truck>(Truck) {
  constructor(
    @InjectRepository(Truck) private readonly truckRepo: Repository<Truck>,
    private readonly ownerCompanyRepo: OwnerCompanyRepo,
  ) {
    super(truckRepo);
  }

  async findByIds(ids: string[]): Promise<Truck[]> {
    try {
      const trucks = await this.truckRepo.findByIds(ids);
      if (trucks.length !== ids.length)
        throw new DocumentNotFoundException('Truck');

      return trucks;
    } catch (e) {
      if (e instanceof DocumentNotFoundException) throw e;
      throw new TypeOrmException(e);
    }
  }

  async create(truck: TruckCreateType): Promise<Truck> {
    if (typeof truck.company === 'string') {
      truck.company = await this.ownerCompanyRepo.findById(truck.company);
    }
    return super.create(truck as Truck);
  }

  async updateTruck(
    id: string,
    truck: Truck,
    update: TruckUpdateType,
  ): Promise<Truck> {
    if (update.company && typeof update.company === 'string') {
      truck.company = await this.ownerCompanyRepo.findById(update.company);
    }
    return super.save(truck);
  }

  async getAvailableTrucksForJob(job: Job, owner: Owner): Promise<Truck[]> {
    const company = await this.ownerCompanyRepo.findOwnerCompany(owner.id);
    return this.truckRepo
      .createQueryBuilder('truck')
      .where('truck.company.id = :id', { id: company.id })
      .andWhere('truck.isActive = true')
      .andWhere(
        qb =>
          `NOT EXISTS ${qb
            .subQuery()
            .select('1')
            .from('truck', 't')
            .leftJoin('t.assignations', 'assignation')
            .leftJoin('assignation.scheduledJob', 'scheduledJob')
            .leftJoin('scheduledJob.job', 'job')
            .where('t.id = truck.id')
            .andWhere('scheduledJob.isCanceled = false')
            .andWhere('job.status <> :canceled', {
              canceled: JobStatus.CANCELED,
            })
            .andWhere('job.status <> :incomplete', {
              incomplete: JobStatus.INCOMPLETE,
            })
            .andWhere('job.status <> :done', {
              done: JobStatus.DONE,
            })
            .andWhere('assignation.finishedAt IS NULL')
            .andWhere('NOT (job.endDate < :start)', {
              start: parseDateToTimestamp(job.startDate),
            })
            .getQuery()}`,
      )
      .getMany();
  }

  async getAllAvailableTrucksForJobs(): Promise<Truck[]> {
    return this.truckRepo
      .createQueryBuilder('truck')
      .andWhere('truck.isActive = true')
      .andWhere(
        qb =>
          `NOT EXISTS ${qb
            .subQuery()
            .select('1')
            .from('truck', 't')
            .leftJoin('t.assignations', 'assignation')
            .leftJoin('assignation.scheduledJob', 'scheduledJob')
            .leftJoin('scheduledJob.job', 'job')
            .where('t.id = truck.id')
            .andWhere('scheduledJob.isCanceled = false')
            .andWhere('job.status <> :canceled', {
              canceled: JobStatus.CANCELED,
            })
            .andWhere('job.status <> :incomplete', {
              incomplete: JobStatus.INCOMPLETE,
            })
            .andWhere('job.status <> :done', {
              done: JobStatus.DONE,
            })
            .andWhere('assignation.finishedAt IS NULL')
            .getQuery()}`,
      )
      .getMany();
  }

  async getAvailableTrucksForJobScheduled(
    job: Job,
    owner: Owner,
  ): Promise<Truck[]> {
    const company = await this.ownerCompanyRepo.findOwnerCompany(owner.id);
    return this.truckRepo
      .createQueryBuilder('truck')
      .where('truck.company.id = :id', { id: company.id })
      .andWhere('truck.isActive = true')
      .andWhere(
        qb =>
          `NOT EXISTS ${qb
            .subQuery()
            .select('1')
            .from('truck', 't')
            .leftJoin('t.assignations', 'assignation')
            .leftJoin('assignation.scheduledJob', 'scheduledJob')
            .where('t.id = truck.id')
            .andWhere('scheduledJob.isCanceled = false')
            .andWhere('assignation.finishedAt IS NOT NULL')
            .getQuery()}`,
      )
      .getMany();
  }

  async getActiveTrucks(owner: Owner): Promise<Truck[]> {
    const company = await this.ownerCompanyRepo.findOwnerCompany(owner.id);
    return this.truckRepo
      .createQueryBuilder('truck')
      .leftJoin('truck.assignations', 'assignation')
      .where('truck.company.id = :id', { id: company.id })
      .andWhere('truck.isActive = true')
      .andWhere('assignation.startedAt IS NOT NULL')
      .andWhere('assignation.finishedAt IS NULL')
      .getMany();
  }

  async getActiveTrucksModal(id: string): Promise<Truck[]> {
    return this.truckRepo
      .createQueryBuilder('truck')
      .leftJoin('truck.assignations', 'assignation')
      .where('truck.company.id = :id', { id })
      .andWhere('truck.isActive = true')
      .andWhere('assignation.startedAt IS NOT NULL')
      .andWhere('assignation.finishedAt IS NULL')
      .getMany();
  }

  async getAllActiveTrucks(): Promise<Truck[]> {
    return this.truckRepo
      .createQueryBuilder('truck')
      .leftJoin('truck.assignations', 'assignation')
      .andWhere('truck.isActive = true')
      .andWhere('assignation.startedAt IS NOT NULL')
      .andWhere('assignation.finishedAt IS NULL')
      .getMany();
  }

  async getOwnerActiveTrucks(owner: Owner): Promise<Truck[]> {
    const company = await this.ownerCompanyRepo.findOwnerCompany(owner.id);
    return this.truckRepo
      .createQueryBuilder('truck')
      .where('truck.company.id = :id', { id: company.id })
      .andWhere('truck.isActive = true')
      .getMany();
  }

  async countOwnerTrucks(owner: Owner, isActive: boolean): Promise<number> {
    const company = await this.ownerCompanyRepo.findOwnerCompany(owner.id);
    return this.truckRepo
      .createQueryBuilder('truck')
      .where('truck.company.id = :id', { id: company.id })
      .andWhere('truck.isDisable = false')
      .andWhere('truck.isActive = :isActive', { isActive })
      .getCount();
  }

  async getScheduledJobTrucks(scheduledJobId: string): Promise<Truck[]> {
    return this.truckRepo
      .createQueryBuilder('truck')
      .leftJoinAndSelect('truck.assignations', 'assignation')
      .leftJoinAndSelect('assignation.scheduledJob', 'scheduledJob')
      .where('scheduledJob.id = :id', { id: scheduledJobId })
      .andWhere('assignation.startedAt IS NOT NULL')
      .andWhere('assignation.finishedAt IS NOT NULL')
      .getMany();
  }

  async getAllOwnerActiveTrucks(owner: Owner): Promise<Truck[]> {
    const company = await this.ownerCompanyRepo.findOwnerCompany(owner.id);
    return this.truckRepo
      .createQueryBuilder('truck')
      .leftJoinAndSelect('truck.assignations', 'assignation')
      .leftJoinAndSelect('truck.company', 'company')
      .where('company.id = :id', { id: company.id })
      .andWhere('truck.isActive = true')
      .getMany();
  }

  async getOwnerCompanyActiveTrucks(companyId: string): Promise<Truck[]> {
    return this.truckRepo
      .createQueryBuilder('truck')
      .leftJoinAndSelect('truck.company', 'company')
      .where('company.id = :id', { id: companyId })
      .andWhere('truck.isActive = true')
      .getMany();
  }

  async getAllOwnerTrucks(companyId: string): Promise<Truck[]> {
    return this.truckRepo
      .createQueryBuilder('truck')
      .leftJoinAndSelect('truck.company', 'company')
      .where('company.id = :id', { id: companyId })
      .andWhere('truck.isDisable = false')
      .getMany();
  }
}
