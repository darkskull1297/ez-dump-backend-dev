import { Injectable } from '@nestjs/common';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { addHours, startOfISOWeek, subDays, subHours } from 'date-fns';
import { BaseRepository } from '../common/base.repository';
import { Job } from './job.model';
import { User } from '../user/user.model';
import { ScheduledJob } from './scheduled-job.model';
import { Truck } from '../trucks/truck.model';
import {
  getEndOfMonth,
  getStartOfMonth,
  getStartOfDay,
  getEndOfDay,
} from '../util/date-utils';
import { JobStatus } from './job-status';
import { Owner } from '../user/owner.model';
import { UserRepo } from '../user/user.repository';
import { Foreman } from '../user/foreman.model';
import { Dispatcher } from '../user/dispatcher.model';
import { Admin } from '../user/admin.model';
import { Loads } from '../geolocation/loads.model';

@Injectable()
export class ScheduledJobRepo extends BaseRepository<ScheduledJob>(
  ScheduledJob,
) {
  constructor(
    @InjectRepository(ScheduledJob)
    private readonly scheduledJobRepo: Repository<ScheduledJob>,
    private readonly userRepo: UserRepo,
  ) {
    super(scheduledJobRepo);
  }

  create(
    scheduledJob: Omit<ScheduledJob, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<ScheduledJob> {
    return super.create(scheduledJob);
  }

  async userHasJobScheduled(job: Job, driver: User): Promise<boolean> {
    const jobsMatching = await this.scheduledJobRepo
      .createQueryBuilder('schjob')
      .leftJoin('schjob.job', 'job')
      .leftJoin('schjob.assignations', 'jobas')
      .leftJoin('jobas.driver', 'driver')
      .where('driver.id = :id', { id: driver.id })
      .andWhere('schjob.isCanceled = :canceled', { canceled: false })
      .andWhere('job.status NOT IN (:...status)', {
        status: [
          JobStatus.CANCELED,
          JobStatus.DONE,
          JobStatus.INCOMPLETE,
          JobStatus.REQUESTED,
        ],
      })
      .andWhere('job.startDate < :end', {
        end: addHours(job.endDate, 1).toISOString(),
      })
      .andWhere('job.endDate > :start', {
        start: subHours(job.startDate, 1).toISOString(),
      })
      .andWhere('jobas.finishedAt IS NULL')
      .getCount();

    return jobsMatching > 0;
  }

  async truckHasJobScheduled(job: Job, truck: Truck): Promise<boolean> {
    const jobsMatching = await this.scheduledJobRepo
      .createQueryBuilder('schjob')
      .leftJoin('schjob.job', 'job')
      .leftJoin('schjob.assignations', 'jobas')
      .leftJoin('jobas.truck', 'truck')
      .where('truck.id = :id', { id: truck.id })
      .andWhere('schjob.isCanceled = :canceled', { canceled: false })
      .andWhere('job.status <> :status', { status: JobStatus.CANCELED })
      .andWhere('job.startDate < :end', {
        end: addHours(job.endDate, 1).toISOString(),
      })
      .andWhere('job.endDate > :start', {
        start: subHours(job.startDate, 1).toISOString(),
      })
      .andWhere('jobas.finishedAt IS NULL')
      .getCount();

    return jobsMatching > 0;
  }

  findStartedJobs({
    skip,
    count,
  }: {
    skip: number;
    count: number;
  }): Promise<ScheduledJob[]> {
    return this.getScheduledJobDataQuery()
      .leftJoin('schjob.company', 'company')
      .andWhere('assignations.finishedAt is NULL')
      .andWhere('job.status = :status', { status: JobStatus.STARTED })
      .andWhere('schjob.isCanceled = :canceled', { canceled: false })
      .orderBy('job.startDate', 'ASC')
      .skip(skip)
      .take(count)
      .getMany();
  }

  findNotStartedJobs(): Promise<ScheduledJob[]> {
    return this.getScheduledJobDataQuery()
      .leftJoinAndSelect('schjob.company', 'ownerCompany')
      .leftJoinAndSelect('ownerCompany.owner', 'owner')
      .where('job.startDate < :end', {
        end: new Date().toISOString(),
      })
      .andWhere('assignations.startedAt IS NULL')
      .andWhere('schjob.isCanceled = false')
      .andWhere('job.status <> :status', { status: JobStatus.CANCELED })
      .getMany();
  }

  findAdminShifts(
    user: Admin,
    status: JobStatus,
    { skip, count }: { skip: number; count: number },
    generalJobId?: string,
  ): Promise<ScheduledJob[]> {
    const query = this.getScheduledJobDataQuery()
      .leftJoin('schjob.company', 'company')
      .leftJoinAndSelect(
        'truck.reviews',
        'reviews',
        'reviews.scheduledJob = schjob.id',
      );
    query
      .where('job.status = :status', { status })
      .andWhere('schjob.isCanceled = :canceled', { canceled: false });
    if (status === JobStatus.STARTED) {
      query.andWhere('assignations.finishedAt is NULL');
    }
    if (generalJobId) {
      query.andWhere('generalJob.id = :generalJobId', { generalJobId });
    }
    return query
      .orderBy('job.startDate', status === JobStatus.DONE ? 'DESC' : 'ASC')
      .skip(skip)
      .take(count)
      .getMany();
  }

  async findForemanJobs(
    user: Foreman | Dispatcher,
    status: JobStatus,
    { skip, count }: { skip: number; count: number },
    generalJobId?: string,
  ): Promise<ScheduledJob[]> {
    const query = this.getScheduledJobDataQuery()
      .leftJoin('schjob.company', 'company')
      .leftJoinAndSelect(
        'truck.reviews',
        'reviews',
        'reviews.scheduledJob = schjob.id',
      );
    query
      .where('contractor.id = :id', {
        id: (await user.contractorCompany.contractor).id,
      })
      .andWhere('job.status = :status', { status })
      .andWhere('schjob.isCanceled = :canceled', { canceled: false });
    if (status === JobStatus.STARTED) {
      query.andWhere('assignations.finishedAt is NULL');
    }
    if (generalJobId) {
      query.andWhere('generalJob.id = :generalJobId', { generalJobId });
    }
    return query
      .orderBy('job.startDate', status === JobStatus.DONE ? 'DESC' : 'ASC')
      .skip(skip)
      .take(count)
      .getMany();
  }

  findContractorJobs(
    user: User,
    status: JobStatus,
    { skip, count }: { skip: number; count: number },
    generalJobId?: string,
  ): Promise<ScheduledJob[]> {
    const query = this.getScheduledJobDataQuery()
      .leftJoinAndSelect('schjob.company', 'company')
      .leftJoinAndSelect('job.truckCategories', 'truckCategories')
      .leftJoinAndSelect('truckCategories.preferredTruck', 'preferredTrucks')
      .leftJoinAndSelect(
        'truck.reviews',
        'reviews',
        'reviews.scheduledJob = schjob.id',
      );

    query
      .where('contractor.id = :id', { id: user.id })
      .andWhere('schjob.isCanceled = :canceled', { canceled: false });
    if (status === JobStatus.STARTED) {
      query.andWhere('job.status = :status', { status });
      query.andWhere('assignations.finishedAt is NULL');
      query.andWhere('assignations.startedAt is not NULL');
      query.leftJoinAndMapMany(
        'job.loads',
        Loads,
        'loads',
        'loads.jobId = job.id',
      );
    } else if (status === JobStatus.PENDING) {
      query.andWhere('job.status NOT IN (:...status)', {
        status: [
          JobStatus.CANCELED,
          JobStatus.INCOMPLETE,
          JobStatus.REQUESTED,
          JobStatus.DONE,
        ],
      });
      query.andWhere('assignations.startedAt is NULL');
    } else {
      query.andWhere('job.status = :status', { status });
    }
    if (generalJobId) {
      query.andWhere('generalJob.id = :generalJobId', { generalJobId });
    }
    if (user.restrictedAt) {
      query.andWhere('job.startDate < :restrictDate', {
        restrictDate: user.restrictedAt.toISOString()
      });
    }

    return query
      .orderBy('job.startDate', status === JobStatus.DONE ? 'DESC' : 'ASC')
      .skip(skip)
      .take(count)
      .getMany();
  }

  findScheduledJobsActiveForOwner(
    owner: Owner,
    status: JobStatus,
    { skip, count },
  ): Promise<ScheduledJob[]> {
    const query = this.getScheduledJobDataQuery()
      .leftJoinAndSelect('schjob.company', 'ownerCompany')
      .leftJoinAndSelect('ownerCompany.owner', 'owner')
      .where('owner.id = :id', { id: owner.id })
      .andWhere('job.status = :status', { status })
      .andWhere('schjob.isCanceled = :canceled', { canceled: false });

    if (status === JobStatus.STARTED) {
      query.andWhere('assignations.finishedAt is NULL');
    }

    return query
      .orderBy('job.startDate', status === JobStatus.DONE ? 'DESC' : 'ASC')
      .skip(skip)
      .take(count)
      .getMany();
  }

  async findOwnerJobs(
    user: Owner,
    status: JobStatus,
    {
      skip,
      count,
      start,
      end,
    }: {
      skip: number;
      count: number;
      start?: string;
      end?: string;
    },
  ): Promise<ScheduledJob[]> {
    const company = await this.userRepo.getOwnerCompany(user);

    const query = this.getScheduledJobDataQuery()
      .leftJoinAndSelect('schjob.company', 'company')
      .leftJoinAndSelect(
        'truck.reviews',
        'reviews',
        'reviews.scheduledJob = schjob.id',
      )
      .where('company.id = :id', { id: company.id })
      .andWhere('schjob.isCanceled = false')
      .andWhere(
        !start || !end ? 'true' : 'job.startDate BETWEEN :start AND :end',
        {
          end: getEndOfMonth(end),
          start: getStartOfMonth(start),
        },
      );

    if (status === JobStatus.STARTED) {
      query.andWhere('job.status = :status', { status });
      query.andWhere('assignations.finishedAt is NULL');
      query.andWhere('assignations.startedAt is not NULL');
    } else if (status === JobStatus.PENDING) {
      query.andWhere('job.status NOT IN (:...status)', {
        status: [
          JobStatus.CANCELED,
          JobStatus.INCOMPLETE,
          JobStatus.DONE,
          JobStatus.REQUESTED,
        ],
      });
      query.andWhere('assignations.startedAt is NULL');
    } else {
      query.andWhere('job.status = :status', { status });
    }

    return query
      .orderBy('job.startDate', status === JobStatus.DONE ? 'DESC' : 'ASC')
      .skip(skip)
      .take(count)
      .getMany();
  }

  findDriverScheduledJobs(
    user: User,
    {
      skip,
      count,
      start,
      end,
    }: {
      skip: number;
      count: number;
      start: string;
      end: string;
    },
  ): Promise<ScheduledJob[]> {
    return this.getScheduledJobDataQuery()
      .leftJoinAndSelect('schjob.company', 'company')
      .where('driver.id = :id', { id: user.id })
      .andWhere('job.status <> :canceled', { canceled: JobStatus.CANCELED })
      .andWhere('schjob.isCanceled = false')
      .andWhere('job.startDate BETWEEN :start AND :end', {
        end: getEndOfMonth(end),
        start: getStartOfMonth(start),
      })
      .orderBy('job.startDate', 'ASC')
      .skip(skip)
      .take(count)
      .getMany();
  }

  findAllDriverScheduledJobs(
    user: User,
    {
      start,
    }: {
      start: string;
      end: string;
    },
  ): Promise<ScheduledJob[]> {
    const query = this.getScheduledJobDataQuery()
      .leftJoinAndSelect('schjob.company', 'company')
      .where('driver.id = :id', { id: user.id })
      .andWhere('job.status <> :canceled', { canceled: JobStatus.CANCELED })
      // .andWhere('job.status <> :done', { done: JobStatus.DONE })
      .andWhere('job.status <> :incomplete', {
        incomplete: JobStatus.INCOMPLETE,
      })
      // .andWhere('job.status <> :pending', { pending: JobStatus.PENDING })
      .andWhere('job.status <> :requested', { requested: JobStatus.REQUESTED })
      .andWhere('schjob.isCanceled = false')
      .andWhere('job.startDate BETWEEN :start AND :end', {
        start: getStartOfDay(new Date()),
        end: getEndOfDay(new Date()),
      })
      .orderBy('job.startDate', 'ASC');

    return query.getMany();
  }

  findAllScheduledDriverScheduledJobs(
    user: User,
    {
      start,
    }: {
      start: string;
      end: string;
    },
  ): Promise<ScheduledJob[]> {
    const query = this.getScheduledJobDataQuery()
      .leftJoinAndSelect('schjob.company', 'company')
      .where('driver.id = :id', { id: user.id })
      .andWhere('job.status NOT IN  (:...statuses)', {
        statuses: [
          JobStatus.DONE,
          JobStatus.CANCELED,
          JobStatus.REQUESTED,
          JobStatus.INCOMPLETE,
        ],
      })
      .andWhere('schjob.isCanceled = false')
      .andWhere('job.startDate BETWEEN :start AND :end', {
        start: getStartOfDay(new Date()),
        end: getEndOfDay(new Date()),
      })
      .orderBy('job.startDate', 'ASC');

    return query.getMany();
  }

  findActiveScheduledJob(user: User): Promise<ScheduledJob> {
    return this.getScheduledJobDataQuery()
      .leftJoinAndSelect('job.truckCategories', 'truckCategories')
      .leftJoinAndSelect('schjob.company', 'company')
      .andWhere('driver.id = :id', { id: user.id })
      .andWhere('assignations.startedAt IS NOT NULL')
      .andWhere('assignations.finishedAt IS NULL')
      .andWhere('schjob.isCanceled = false')
      .andWhere('truckCategories.isActive = true')
      .andWhere('job.status <> :status', { status: JobStatus.CANCELED })
      .getOne();
  }

  async findActiveOrScheduledJobByDriverOnly(
    user: User,
  ): Promise<ScheduledJob> {
    return this.getScheduledJobDataQuery()
      .leftJoinAndSelect('job.truckCategories', 'truckCategories')
      .leftJoinAndSelect('schjob.company', 'company')
      .andWhere('driver.id = :id', { id: user.id })
      .andWhere('assignations.finishedAt IS NULL')
      .andWhere('schjob.isCanceled = false')
      .andWhere('job.status NOT IN  (:...canceled)', {
        canceled: [
          JobStatus.CANCELED,
          JobStatus.DONE,
          JobStatus.INCOMPLETE,
          JobStatus.REQUESTED,
        ],
      })
      .getOne();
  }

  findActiveOrScheduledJobByTruck(truck: Truck): Promise<ScheduledJob> {
    return this.getScheduledJobDataQuery()
      .leftJoinAndSelect('job.truckCategories', 'truckCategories')
      .leftJoinAndSelect('schjob.company', 'company')
      .andWhere('truck.id = :id', { id: truck.id })
      .andWhere('assignations.finishedAt IS NULL')
      .andWhere('schjob.isCanceled = false')
      .andWhere('job.status NOT IN  (:...canceled)', {
        canceled: [
          JobStatus.CANCELED,
          JobStatus.DONE,
          JobStatus.INCOMPLETE,
          JobStatus.REQUESTED,
        ],
      })
      .getOne();
  }

  findScheduledJobByDriver(user: User, jobId: string): Promise<ScheduledJob> {
    return this.getScheduledJobDataQuery()
      .leftJoinAndSelect('job.truckCategories', 'truckCategories')
      .leftJoinAndSelect('schjob.company', 'company')
      .where('driver.id = :userId', { userId: user.id })
      .andWhere('job.id = :id', { id: jobId })
      .andWhere('job.status <> :status', { status: JobStatus.CANCELED })
      .getOne();
  }

  findNextScheduledJob(user: User): Promise<ScheduledJob> {
    return this.getScheduledJobDataQuery()
      .leftJoinAndSelect('job.truckCategories', 'truckCategories')
      .where('driver.id = :id', { id: user.id })
      .andWhere('assignations.startedAt IS NULL')
      .andWhere('job.status NOT IN  (:...canceled)', {
        canceled: [
          JobStatus.CANCELED,
          JobStatus.DONE,
          JobStatus.INCOMPLETE,
          JobStatus.REQUESTED,
        ],
      })
      .andWhere('schjob.isCanceled = false')
      .andWhere('job.startDate < :end', {
        end: getEndOfDay(new Date()),
      })
      .andWhere('job.endDate > :date', {
        date: new Date().toISOString(),
      })
      .andWhere('truckCategories.isScheduled = true')
      .andWhere('truckCategories.isActive = false')
      .orderBy('job.startDate', 'ASC')
      .getOne();
  }

  findJobNotFinished(user: User): Promise<ScheduledJob> {
    return this.getScheduledJobDataQuery()
      .leftJoinAndSelect('job.truckCategories', 'truckCategories')
      .leftJoinAndSelect('schjob.company', 'company')
      .andWhere('job.status = :status', { status: JobStatus.DONE })
      .andWhere('driver.id = :id', { id: user.id })
      .andWhere('assignations.startedAt IS NOT NULL')
      .andWhere('assignations.finishedAt IS NOT NULL')
      .andWhere('assignations.finishByUser = :finish', { finish: false })
      .andWhere('schjob.isCanceled = false')
      .getOne();
  }

  findJobsWithNoEvidence(user: User): Promise<ScheduledJob[]> {
    return this.getScheduledJobDataQuery()
      .leftJoinAndSelect('job.truckCategories', 'truckCategories')
      .leftJoinAndSelect('schjob.company', 'company')
      .andWhere('job.status = :status', { status: JobStatus.DONE })
      .andWhere('contractor.id = :id', { id: user.id })
      .andWhere('assignations.startedAt IS NOT NULL')
      .andWhere('assignations.finishedAt IS NOT NULL')
      .andWhere('assignations.finishByUser = :finish', { finish: false })
      .andWhere('schjob.isCanceled = false')
      .getMany();
  }

  findActualWeekWork(user: User): Promise<ScheduledJob[]> {
    return this.getScheduledJobDataQuery()
      .where('driver.id = :id', { id: user.id })
      .andWhere('assignations.startedAt IS NOT NULL')
      .andWhere('assignations.finishedAt IS NOT NULL')
      .andWhere('schjob.isCanceled = false')
      .andWhere('job.status <> :canceled', { canceled: JobStatus.CANCELED })
      .andWhere('job.startDate BETWEEN :start AND :end', {
        end: new Date().toISOString(),
        start: startOfISOWeek(new Date()).toISOString(),
      })
      .getMany();
  }

  findActualWeekWorkByDriverId(
    driverId: string,
    firstWeek: string,
    lastWeek: string,
  ): Promise<ScheduledJob[]> {
    return this.getScheduledJobDataQuery()
      .where('driver.id = :id', { id: driverId })
      .andWhere('assignations.startedAt IS NOT NULL')
      .andWhere('assignations.finishedAt IS NOT NULL')
      .andWhere('schjob.isCanceled = false')
      .andWhere('job.status <> :canceled', { canceled: JobStatus.CANCELED })
      .andWhere('job.startDate BETWEEN :start AND :end', {
        end: lastWeek,
        start: firstWeek,
      })
      .getMany();
  }

  findScheduleJob(id: string): Promise<ScheduledJob> {
    return this.getScheduledJobDataQuery()
      .leftJoinAndSelect('schjob.company', 'company')
      .where('schjob.id = :id', { id })
      .getOne();
  }

  findAdminJobs({
    skip,
    count,
  }: {
    skip: number;
    count: number;
  }): Promise<ScheduledJob[]> {
    return this.getScheduledJobDataQuery()
      .where('job.status <> :done', { done: JobStatus.DONE })
      .andWhere('job.status <> :canceled', { canceled: JobStatus.CANCELED })
      .andWhere('schjob.isCanceled = false')
      .orderBy('job.startDate', 'ASC')
      .skip(skip)
      .take(count)
      .getMany();
  }

  findAdminJobsDone({
    skip,
    count,
  }: {
    skip: number;
    count: number;
  }): Promise<ScheduledJob[]> {
    return this.getScheduledJobDataQuery()
      .leftJoinAndSelect('schjob.company', 'company')
      .where('job.status = :done', { done: JobStatus.DONE })
      .orderBy('job.startDate', 'ASC')
      .skip(skip)
      .take(count)
      .getMany();
  }

  findAllScheduledJobsCanceled({
    skip,
    count,
    generalJobId,
  }: {
    skip: number;
    count: number;
    generalJobId?: string;
  }): Promise<ScheduledJob[]> {
    const query = this.getScheduledJobDataQuery();

    return query
      .leftJoinAndSelect('job.truckCategories', 'truckCategories')
      .where('generalJob.id = :generalJobId', { generalJobId })
      .andWhere('job.status = :status', { status: JobStatus.CANCELED })
      .andWhere('schjob.isCanceled = true')
      .orderBy('job.startDate', 'ASC')
      .skip(skip)
      .take(count)
      .getMany();
  }

  findJobScheduledJobs(job: Job): Promise<ScheduledJob[]> {
    return this.scheduledJobRepo.find({
      where: {
        isCanceled: false,
        job: { id: job.id },
      },
      relations: ['company'],
    });
  }

  findJobFinishedScheduledJobs(job: Job): Promise<ScheduledJob[]> {
    return this.scheduledJobRepo.find({
      where: {
        isCanceled: false,
        job: { id: job.id },
        disputeConfirmed: false,
      },
      relations: ['company'],
    });
  }

  findMissedJobs(): Promise<ScheduledJob[]> {
    return this.scheduledJobRepo
      .createQueryBuilder('schjob')
      .leftJoinAndSelect('schjob.job', 'job')
      .leftJoinAndSelect('schjob.company', 'company')
      .where('job.status = :done', { done: JobStatus.STARTED })
      .andWhere('schjob.isCanceled = false')
      .andWhere('job.endDate < :date', {
        date: new Date().toISOString(),
      })
      .andWhere('job.endDate > :yesterday', {
        yesterday: subDays(new Date(), 1).toISOString(),
      })
      .getMany();
  }

  getScheduleJobWithCompany(id: string): Promise<ScheduledJob> {
    return this.scheduledJobRepo
      .createQueryBuilder('schjob')
      .leftJoinAndSelect('schjob.company', 'company')
      .leftJoinAndSelect('company.owner', 'owner')
      .where('schjob.id = :id', { id })
      .getOne();
  }

  private getScheduledJobDataQuery(): SelectQueryBuilder<ScheduledJob> {
    return this.scheduledJobRepo
      .createQueryBuilder('schjob')
      .leftJoinAndSelect('schjob.job', 'job')
      .leftJoinAndSelect('job.user', 'contractor')
      .leftJoinAndSelect('contractor.company', 'contractorCompany')
      .leftJoinAndSelect('job.generalJob', 'generalJob')
      .leftJoinAndSelect('schjob.assignations', 'assignations')
      .leftJoinAndSelect('assignations.driver', 'driver')
      .leftJoinAndSelect('assignations.truck', 'truck')
      .leftJoinAndSelect('assignations.category', 'category');
  }

  countAdminJobs(
    user: Admin,
    status: JobStatus,
    generalJobId?: string,
  ): Promise<number> {
    const query = this.getScheduledJobDataQuery().leftJoin(
      'schjob.company',
      'company',
    );

    query
      .where('job.status = :status', { status })
      .andWhere('schjob.isCanceled = :canceled', { canceled: false });
    if (generalJobId) {
      query.andWhere('generalJob.id = :generalJobId', { generalJobId });
    }
    if (status === JobStatus.STARTED) {
      query.andWhere('assignations.finishedAt is NULL');
    }
    return query.getCount();
  }

  async countCanceledJobs(generalJobId: string): Promise<number> {
    const query = await this.scheduledJobRepo.query(
      `SELECT count(*) FROM job WHERE "generalJobId" = '${generalJobId}' AND status = 'CANCELED' `,
    );

    return query[0].count;
  }

  async countScheduledCanceledJobs(generalJobId: string): Promise<number> {
    const query = this.getScheduledJobDataQuery()
      .leftJoin('schjob.company', 'company')
      .leftJoin('schjob.job', 'job');

    query
      .where('job.status = :status', { status: JobStatus.CANCELED })
      .andWhere('generalJob.id = :generalJobId', { generalJobId });

    return query.getCount();
  }

  countScheduledJobsCancelled(
    user: Admin,
    status: JobStatus,
    generalJobId?: string,
  ): Promise<number> {
    const query = this.getScheduledJobDataQuery().leftJoin(
      'schjob.company',
      'company',
    );

    query
      .where('job.status = :status', { status })
      .andWhere('schjob.isCanceled = :canceled', { canceled: true })
      .andWhere('generalJob.id = :generalJobId', { generalJobId });

    return query.getCount();
  }

  async countForemanJobs(
    user: Foreman | Dispatcher,
    status: JobStatus,
    generalJobId?: string,
  ): Promise<number> {
    const query = this.getScheduledJobDataQuery().leftJoin(
      'schjob.company',
      'company',
    );

    query
      .where('contractor.id = :id', {
        id: (await user.contractorCompany.contractor).id,
      })
      .andWhere('job.status = :status', { status })
      .andWhere('schjob.isCanceled = :canceled', { canceled: false });
    if (generalJobId) {
      query.andWhere('generalJob.id = :generalJobId', { generalJobId });
    }
    if (status === JobStatus.STARTED) {
      query.andWhere('assignations.finishedAt is NULL');
      query.andWhere('category.isActive = true');
      query.andWhere('category.isScheduled = true');
    } else if (status === JobStatus.PENDING) {
      query.andWhere('category.isActive = false');
      query.andWhere('category.isScheduled = true');
    } else if (status === JobStatus.DONE) {
      query.andWhere('assignations.finishedAt IS NOT NULL');
    } else {
      query.andWhere('category.isActive = false');
      query.andWhere('category.isScheduled = false');
    }
    return query.getCount();
  }

  countContractorJobs(
    user: User,
    status: JobStatus,
    generalJobId?: string,
  ): Promise<number> {
    const query = this.getScheduledJobDataQuery().leftJoin(
      'schjob.company',
      'company',
    );

    query
      .where('contractor.id = :id', { id: user.id })
      .andWhere('job.status = :status', { status })
      .andWhere('schjob.isCanceled = :canceled', { canceled: false });
    if (generalJobId) {
      query.andWhere('generalJob.id = :generalJobId', { generalJobId });
    }
    if (status === JobStatus.STARTED) {
      query.andWhere('assignations.finishedAt is NULL');
    }
    if (user.restrictedAt) {
      query.andWhere('job.startDate < :restrictDate', {
        restrictDate: user.restrictedAt.toISOString()
      });
    }

    return query.getCount();
  }

  async countOwnerJobs(user: Owner, status: JobStatus): Promise<number> {
    const company = await this.userRepo.getOwnerCompany(user);

    const query = this.getScheduledJobDataQuery()
      .leftJoin('schjob.company', 'company')
      .leftJoin('job.truckCategories', 'truckCategories')
      .where('company.id = :id', { id: company.id })
      .andWhere('schjob.isCanceled = false');

    if (status === JobStatus.PENDING) {
      query.andWhere('assignations.startedAt is NULL');
      query.andWhere('job.status NOT IN (:...status)', {
        status: [JobStatus.INCOMPLETE, JobStatus.CANCELED, JobStatus.DONE],
      });
      query.andWhere('truckCategories.isScheduled = true');
      query.andWhere('truckCategories.isActive = false');
      query.andWhere('category.isScheduled = true');
      query.andWhere('category.isActive = false');
    } else {
      if (status === JobStatus.STARTED) {
        query.andWhere('assignations.startedAt is not NULL');
        query.andWhere('truckCategories.isActive = true');
        query.andWhere('truckCategories.isScheduled = true');
        query.andWhere('category.isScheduled = true');
        query.andWhere('category.isActive = true');
      }

      query.andWhere('job.status = :status', { status });
    }

    return query.getCount();
  }

  getScheduledJobsFromJob(id: string): Promise<ScheduledJob[]> {
    return this.getScheduledJobDataQuery()
      .where('job.id = :id', { id })
      .getMany();
  }

  async findScheduledJobdWithReviews(id: string): Promise<any> {
    const data = this.getScheduledJobDataQuery()
      .leftJoinAndSelect(
        'truck.reviews',
        'reviews',
        'reviews.scheduledJob = schjob.id',
      )
      .where('schjob.id = :id', { id });

    return data.getOne();
  }

  async findScheduledJobdWithAssignation(id: string): Promise<any> {
    const data = await this.getScheduledJobDataQuery()
      .where('assignations.id = :id', { id })
      .getOne();

    return data;
  }

  async findScheduledJobByJobID(jobId: string): Promise<ScheduledJob[]> {
    const data = await this.scheduledJobRepo
      .createQueryBuilder('scheduledJob')
      .leftJoinAndSelect('scheduledJob.job', 'job')
      .leftJoinAndSelect('scheduledJob.assignations', 'assignations')
      .leftJoinAndSelect('assignations.truck', 'truck')
      .leftJoinAndSelect('assignations.driver', 'driver')
      .where('job.id = :jobId', { jobId })
      .getMany();

    return data;
  }

  async findScheduledJobForDispute(
    ownerInvoiceId: string,
    driverId: string,
    truckId: string,
  ): Promise<ScheduledJob> {
    const data = await this.scheduledJobRepo
      .createQueryBuilder('scheduledJob')
      .leftJoinAndSelect('scheduledJob.ownerJobInvoice', 'ownerInvoice')
      .leftJoinAndSelect('scheduledJob.assignations', 'assignations')
      .leftJoinAndSelect('scheduledJob.job', 'job')
      .leftJoinAndSelect('assignations.driver', 'driver')
      .leftJoinAndSelect('assignations.truck', 'truck')
      .leftJoinAndSelect('assignations.category', 'category')
      .leftJoinAndSelect('assignations.loads', 'loads')
      .where('ownerInvoice.id = :ownerInvoiceId', { ownerInvoiceId })
      .andWhere('driver.id = :driverId', { driverId })
      .andWhere('truck.id = :truckId', { truckId })
      .getOne();

    return data;
  }
}
