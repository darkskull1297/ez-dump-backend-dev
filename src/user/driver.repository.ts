import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Injectable } from '@nestjs/common';
import { BaseRepository } from '../common/base.repository';
import { Driver } from './driver.model';
import { Owner } from './owner.model';
import { OwnerCompanyRepo } from '../company/owner-company.repository';
import { User } from './user.model';
import { OwnerCompany } from '../company/owner-company.model';

@Injectable()
export class DriverRepo extends BaseRepository<Driver>(Driver) {
  constructor(
    @InjectRepository(Driver)
    private readonly driverRepo: Repository<Driver>,
    private readonly ownerCompanyRepo: OwnerCompanyRepo,
  ) {
    super(driverRepo);
  }

  async getActiveDrivers(owner: Owner): Promise<Driver[]> {
    const company = await this.ownerCompanyRepo.findOwnerCompany(owner.id);
    return this.driverRepo
      .createQueryBuilder('driver')
      .leftJoin('driver.assignations', 'assignation')
      .where('driver.drivingFor.id = :id', { id: company.id })
      .andWhere('driver.isActive')
      .andWhere('assignation.startedAt IS NOT NULL')
      .andWhere('assignation.finishedAt IS NULL')
      .getMany();
  }

  async hasScheduleJob(owner: Owner, driver: Driver): Promise<number> {
    const company = await this.ownerCompanyRepo.findOwnerCompany(owner.id);
    return this.driverRepo
      .createQueryBuilder('driver')
      .leftJoin('driver.assignations', 'assignation')
      .where('driver.drivingFor.id = :id', { id: company.id })
      .andWhere('driver.isActive')
      .andWhere('assignation.startedAt IS NULL')
      .andWhere('assignation.finishedAt IS NULL')
      .andWhere('assignation.driver.id = :id', { id: driver.id })
      .getCount();
  }

  async getAllActiveDriversForMessaging(): Promise<Driver[]> {
    return this.driverRepo
      .createQueryBuilder('driver')
      .leftJoinAndSelect('driver.assignations', 'assignation')
      .leftJoinAndSelect('assignation.scheduledJob', 'scheduledJob')
      .leftJoinAndSelect('scheduledJob.job', 'job')
      .andWhere('driver.isActive')
      .andWhere('assignation.startedAt IS NOT NULL')
      .andWhere('assignation.finishedAt IS NULL')
      .getMany();
  }

  async getAllDriversForContractorCompany(contractor: User): Promise<Driver[]> {
    return this.driverRepo
      .createQueryBuilder('driver')
      .leftJoinAndSelect('driver.assignations', 'assignation')
      .leftJoinAndSelect('assignation.scheduledJob', 'scheduledJob')
      .leftJoinAndSelect('scheduledJob.job', 'job')
      .where('driver.isActive')
      .andWhere('assignation.startedAt IS NOT NULL')
      .andWhere('assignation.finishedAt IS NULL')
      .andWhere('job.user = :user', { user: contractor.id })
      .getMany();
  }

  async getAllDriversForOwner(company: OwnerCompany): Promise<Driver[]> {
    return this.driverRepo
      .createQueryBuilder('driver')
      .leftJoinAndSelect('driver.assignations', 'assignation')
      .leftJoinAndSelect('assignation.scheduledJob', 'scheduledJob')
      .leftJoinAndSelect('scheduledJob.job', 'job')
      .where('driver.isActive')
      .andWhere('assignation.startedAt IS NOT NULL')
      .andWhere('assignation.finishedAt IS NULL')
      .andWhere('driver.drivingFor = :user', { user: company.id })
      .getMany();
  }

  async getAllOwnerDrivers(company: OwnerCompany): Promise<Driver[]> {
    return this.driverRepo
      .createQueryBuilder('driver')
      .where('driver.isActive')
      .andWhere('driver.drivingFor = :user', { user: company.id })
      .getMany();
  }

  async countOwnerDrivers(owner: Owner, isActive: boolean): Promise<number> {
    const company = await this.ownerCompanyRepo.findOwnerCompany(owner.id);
    return this.driverRepo
      .createQueryBuilder('driver')
      .where('driver.drivingFor.id = :id', { id: company.id })
      .andWhere('driver.isActive = :isActive', { isActive })
      .getCount();
  }
}
