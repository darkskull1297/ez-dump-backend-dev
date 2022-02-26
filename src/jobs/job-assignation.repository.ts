import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { endOfWeek, startOfWeek, subWeeks } from 'date-fns';
import { BaseRepository } from '../common/base.repository';
import { JobAssignation } from './job-assignation.model';
import { JobStatus } from './job-status';
import { Truck } from '../trucks/truck.model';

@Injectable()
export class JobAssignationRepo extends BaseRepository<JobAssignation>(
  JobAssignation,
) {
  constructor(
    @InjectRepository(JobAssignation)
    private readonly jobAssignationRepo: Repository<JobAssignation>,
  ) {
    super(jobAssignationRepo);
  }

  findAssignationsInsideLocation(): Promise<JobAssignation[]> {
    return this.jobAssignationRepo
      .createQueryBuilder('jobass')
      .leftJoinAndSelect('jobass.scheduledJob', 'schjob')
      .leftJoinAndSelect('schjob.job', 'job')
      .leftJoinAndSelect('jobass.driver', 'driver')
      .leftJoinAndSelect('schjob.company', 'ownerCompany')
      .where('jobass.isInSite = true')
      .getMany();
  }

  findNotStartedAssignations(): Promise<JobAssignation[]> {
    return this.jobAssignationRepo
      .createQueryBuilder('jobass')
      .leftJoinAndSelect('jobass.scheduledJob', 'schjob')
      .leftJoinAndSelect('schjob.job', 'job')
      .leftJoinAndSelect('jobass.driver', 'driver')
      .leftJoinAndSelect('schjob.company', 'ownerCompany')
      .where('jobass.startedAt IS NULL')
      .andWhere('jobass.sentNeverStartedJobEmail = false')
      .andWhere('job.startDate < :date', {
        date: new Date().toISOString(),
      })
      .andWhere('job.endDate < :date', {
        date: new Date().toISOString(),
      })
      .andWhere('schjob.isCanceled = false')
      .andWhere('job.status <> :status', { status: JobStatus.CANCELED })
      .getMany();
  }

  async findLastWeekAssignationsForTruck(
    truck: Truck,
  ): Promise<JobAssignation[]> {
    return this.jobAssignationRepo
      .createQueryBuilder('jobass')
      .leftJoinAndSelect('jobass.scheduledJob', 'schjob')
      .leftJoinAndSelect('schjob.job', 'job')
      .leftJoinAndSelect('jobass.truck', 'truck')
      .where('truck.id = :id', { id: truck.id })
      .andWhere('jobass.startedAt IS NOT NULL')
      .andWhere('jobass.finishedAt IS NOT NULL')
      .andWhere('jobass.finishedAt BETWEEN :start AND :end', {
        start: subWeeks(startOfWeek(new Date()), 1).toISOString(),
        end: endOfWeek(subWeeks(startOfWeek(new Date()), 1)).toISOString(),
      })
      .andWhere('schjob.isCanceled = false')
      .andWhere('job.status <> :status', { status: JobStatus.CANCELED })
      .getMany();
  }

  async findTwoWeeksAgoAssignationsForTruck(
    truck: Truck,
  ): Promise<JobAssignation[]> {
    return this.jobAssignationRepo
      .createQueryBuilder('jobass')
      .leftJoinAndSelect('jobass.scheduledJob', 'schjob')
      .leftJoinAndSelect('schjob.job', 'job')
      .leftJoinAndSelect('jobass.truck', 'truck')
      .where('truck.id = :id', { id: truck.id })
      .andWhere('jobass.startedAt IS NOT NULL')
      .andWhere('jobass.finishedAt IS NOT NULL')
      .andWhere('jobass.finishedAt BETWEEN :start AND :end', {
        start: subWeeks(startOfWeek(new Date()), 2).toISOString(),
        end: endOfWeek(subWeeks(startOfWeek(new Date()), 2)).toISOString(),
      })
      .andWhere('schjob.isCanceled = false')
      .andWhere('job.status <> :status', { status: JobStatus.CANCELED })
      .getMany();
  }

  findStartedAssignationsNotFinished(): Promise<JobAssignation[]> {
    const HOURS_ADD = 1;
    const today = new Date();
    const prevHour = new Date();
    prevHour.setHours(today.getHours() - HOURS_ADD);
    return this.jobAssignationRepo
      .createQueryBuilder('jobass')
      .leftJoinAndSelect('jobass.scheduledJob', 'schjob')
      .leftJoinAndSelect('schjob.company', 'company')
      .leftJoinAndSelect('schjob.job', 'job')
      .leftJoinAndSelect('jobass.driver', 'driver')
      .leftJoinAndSelect('jobass.truck', 'truck')
      .leftJoinAndSelect('job.user', 'user')
      .leftJoinAndSelect('job.truckCategories', 'truckCategory')
      .andWhere('job.endDate < :prevHour', {
        prevHour: prevHour.toISOString(),
      })
      .andWhere('job.finishedAt is NULL')
      .andWhere('schjob.isCanceled = false')
      .andWhere('job.status = :status', { status: JobStatus.STARTED })
      .getMany();
  }

  findStartedAssignationsBeforeFinish(): Promise<JobAssignation[]> {
    const MINUTES_RANGE_MAX = 30;
    const MINUTES_RANGE_MIN = 15;
    const today = new Date();
    const fifteenMinutes = new Date();
    fifteenMinutes.setMinutes(today.getMinutes() + MINUTES_RANGE_MIN);
    const thirtyMinutes = new Date();
    thirtyMinutes.setMinutes(today.getMinutes() + MINUTES_RANGE_MAX);
    return this.jobAssignationRepo
      .createQueryBuilder('jobass')
      .leftJoinAndSelect('jobass.scheduledJob', 'schjob')
      .leftJoinAndSelect('schjob.job', 'job')
      .leftJoinAndSelect('schjob.company', 'ownerCompany')
      .leftJoinAndSelect('jobass.driver', 'driver')
      .leftJoinAndSelect('ownerCompany.owner', 'owner')
      .andWhere('job.endDate > :fifteenMinutes', {
        fifteenMinutes: fifteenMinutes.toISOString(),
      })
      .andWhere('job.endDate < :thirtyMinutes', {
        thirtyMinutes: thirtyMinutes.toISOString(),
      })
      .andWhere('jobass.finishedAt is NULL')
      .andWhere('schjob.isCanceled = false')
      .andWhere('job.status = :status', { status: JobStatus.STARTED })
      .getMany();
  }

  findTrucksActive(generalJobId: string): Promise<number> {
    return this.jobAssignationRepo
      .createQueryBuilder('jobass')
      .leftJoinAndSelect('jobass.scheduledJob', 'schJob')
      .leftJoinAndSelect('jobass.category', 'category')
      .leftJoinAndSelect('schJob.job', 'job')
      .leftJoinAndSelect('job.generalJob', 'generalJob')
      .where('generalJob.id = :id', { id: generalJobId })
      .andWhere('jobass.startedAt IS NOT NULL')
      .andWhere('jobass.finishedAt IS NULL')
      .andWhere('category.isActive = true')
      .andWhere('job.status = :status', { status: JobStatus.STARTED })
      .andWhere('schJob.job = job.id')
      .andWhere('jobass.scheduledJob = schJob.id')
      .andWhere('job.generalJob = generalJob.id')
      .getCount();
  }

  async findAssignationForDisputeLoads(
    categoryId: string,
    driverId: string,
    truckId: string,
  ): Promise<JobAssignation> {
    const data = await this.jobAssignationRepo
      .createQueryBuilder('jobAssignation')
      .innerJoin('jobAssignation.driver', 'driver')
      .innerJoin('jobAssignation.truck', 'truck')
      .innerJoin('jobAssignation.category', 'category')
      .where('driver.id = :driverId', { driverId })
      .andWhere('truck.id = :truckId', { truckId })
      .andWhere('category.id = :categoryId', { categoryId })
      .getOne();

    return data;
  }
}
