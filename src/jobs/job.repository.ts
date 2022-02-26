import { Injectable } from '@nestjs/common';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from '../common/base.repository';
import { Job } from './job.model';
import { TruckCategoryRepo } from '../trucks/truck-category.repository';
import { User } from '../user/user.model';
import { JobStatus } from './job-status';
import { Foreman } from '../user/foreman.model';
import { Dispatcher } from '../user/dispatcher.model';
import { Admin } from '../user/admin.model';
import { Loads } from '../geolocation/loads.model';
import { UserRepo } from '../user/user.repository';
import { Owner } from '../user/owner.model';
import { getEndOfMonth, getStartOfMonth } from '../util/date-utils';

@Injectable()
export class JobRepo extends BaseRepository<Job>(Job) {
  constructor(
    @InjectRepository(Job) private readonly jobRepo: Repository<Job>,
    private readonly truckCategoryRepo: TruckCategoryRepo,
    private readonly userRepo: UserRepo,
  ) {
    super(jobRepo);
  }

  async save(job: Job): Promise<Job> {
    const savedJob = await super.save(job);
    if (job.truckCategories) {
      await Promise.all(
        job.truckCategories.map(cat => this.truckCategoryRepo.save(cat)),
      );
    }
    return savedJob;
  }

  findByIdWithCategories(
    id: string,
    active: boolean,
    pending?: boolean,
    done?: boolean,
  ): Promise<Job> {
    const query = this.jobRepo
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.user', 'user')
      .leftJoinAndSelect('job.scheduledJobs', 'scheduledJobs')
      .leftJoinAndSelect('job.truckCategories', 'truckCategory')
      .leftJoinAndSelect('truckCategory.preferredTruck', 'preferredTruck')
      .leftJoinAndSelect('preferredTruck.company', 'company')
      .leftJoinAndSelect('scheduledJobs.assignations', 'assignations')
      .leftJoinAndSelect('assignations.category', 'category')
      .leftJoinAndSelect('assignations.driver', 'driver')
      .leftJoinAndSelect('assignations.truck', 'truck')
      .leftJoinAndSelect('truck.reviews', 'reviews')
      .where('job.id = :id', { id });

    if (pending) {
      query
        .andWhere('truckCategory.isScheduled = false')
        .andWhere('truckCategory.isActive = false');
    } else if (active) {
      query
        .andWhere('truckCategory.isScheduled = true')
        .andWhere('truckCategory.isActive = true')
        .andWhere('assignations.startedAt is not NULL')
        .andWhere('category.isScheduled = true')
        .andWhere('category.isActive = true');
    } else if (done) {
      query.andWhere('job.status = :status', { status: JobStatus.DONE });
    } else {
      query
        .andWhere('truckCategory.isScheduled = true')
        .andWhere('truckCategory.isActive = false')
        .andWhere('assignations.startedAt is NULL')
        .andWhere('category.isScheduled = true')
        .andWhere('category.isActive = false');
    }

    return query.getOne();
  }

  findJob(id: string): Promise<Job> {
    return this.jobRepo
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.truckCategories', 'truckCategory')
      .leftJoinAndSelect('truckCategory.preferredTruck', 'preferredTruck')
      .where('job.id = :id', { id })
      .getOne();
  }

  findOwnerJobs(
    restrictedAt: Date,
    {
      skip,
      count,
    }: {
      skip: number;
      count: number;
    }
  ): Promise<Job[]> {
    const query = this.getJobDataQuery()
      .where('job.endDate > :date', {
        date: new Date().toISOString(),
      })
      .andWhere('truckCategory.isScheduled = false')
      .andWhere('job.status IN (:...status)', {
        status: [JobStatus.PENDING, JobStatus.STARTED],
      })
    if (restrictedAt) {
      query.andWhere('job.startDate < :restrictDate', {
        restrictDate: restrictedAt.toISOString()
      });
    }

    return query
      .orderBy('job.startDate', 'ASC')
      .skip(skip)
      .take(count)
      .getMany();
  }

  async findJobsForOwner(
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
    }): Promise<Job[]> {
    const company = await this.userRepo.getOwnerCompany(user);

    const query = this.jobRepo
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.scheduledJobs', 'schjob')
      .leftJoinAndSelect('job.user', 'contractor')
      .leftJoinAndSelect('contractor.company', 'contractorCompany')
      .leftJoinAndSelect('job.generalJob', 'generalJob')
      .leftJoinAndSelect('schjob.assignations', 'assignations')
      .leftJoinAndSelect('assignations.driver', 'driver')
      .leftJoinAndSelect('assignations.truck', 'truck')
      .leftJoinAndSelect('assignations.category', 'category')
      .leftJoinAndSelect('category.driverInvoice', 'driverInvoice')
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
      )
      .andWhere('category.isScheduled = true');

    if (status === JobStatus.STARTED) {
      query.andWhere('job.status = :status', { status });
      query.andWhere('assignations.finishedAt is NULL');
      query.andWhere('assignations.startedAt is not NULL');
      query.andWhere('category.isActive = true');
      query.leftJoinAndMapMany(
        'job.loads',
        Loads,
        'loads',
        'loads.jobId = job.id',
      );
      query.leftJoinAndSelect('loads.truck', 'loadTruck');
      query.leftJoinAndSelect('loads.assignation', 'loadAssignation');
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
      query.andWhere('category.isActive = false');
    } else {
      query.andWhere('job.status = :status', { status });
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

  async countOwnerJobs(user: Owner, status: JobStatus): Promise<number> {
    const company = await this.userRepo.getOwnerCompany(user);

    const query = this.jobRepo
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.scheduledJobs', 'schjob')
      .leftJoinAndSelect('job.user', 'contractor')
      .leftJoinAndSelect('contractor.company', 'contractorCompany')
      .leftJoinAndSelect('job.generalJob', 'generalJob')
      .leftJoinAndSelect('schjob.assignations', 'assignations')
      .leftJoinAndSelect('assignations.driver', 'driver')
      .leftJoinAndSelect('assignations.truck', 'truck')
      .leftJoinAndSelect('assignations.category', 'category')
      .leftJoinAndSelect('schjob.company', 'company')
      .leftJoinAndSelect(
        'truck.reviews',
        'reviews',
        'reviews.scheduledJob = schjob.id',
      )
      .where('company.id = :id', { id: company.id })
      .andWhere('schjob.isCanceled = false')
      .andWhere('category.isScheduled = true');

    if (status === JobStatus.STARTED) {
      query.andWhere('job.status = :status', { status });
      query.andWhere('assignations.finishedAt is NULL');
      query.andWhere('assignations.startedAt is not NULL');
      query.andWhere('category.isActive = true');
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
      query.andWhere('category.isActive = false');
    } else {
      query.andWhere('job.status = :status', { status });
    }
    if (user.restrictedAt) {
      query.andWhere('job.startDate < :restrictDate', {
        restrictDate: user.restrictedAt.toISOString()
      });
    }

    return query.getCount();
  }

  findAdminAvailableJobs({
    skip,
    count,
    generalJobId,
  }: {
    skip: number;
    count: number;
    generalJobId: string;
  }): Promise<Job[]> {
    return this.getJobDataQuery()
      .where('job.endDate > :date', {
        date: new Date().toISOString(),
      })
      .andWhere('generalJob.id = :generalJobId', { generalJobId })
      .andWhere('truckCategory.isScheduled = false')
      .andWhere('job.status = :status', { status: JobStatus.PENDING })
      .orderBy('job.startDate', 'ASC')
      .skip(skip)
      .take(count)
      .getMany();
  }

  findAllAdminAvailableJobs(): Promise<Job[]> {
    return this.getJobDataQuery()
      .where('job.endDate > :date', {
        date: new Date().toISOString(),
      })
      .andWhere('truckCategory.isScheduled = false')
      .andWhere('job.status = :status', { status: JobStatus.STARTED })
      .getMany();
  }

  countAdminAvailableJobs({
    generalJobId,
  }: {
    generalJobId: string;
  }): Promise<number> {
    return this.getJobDataQuery()
      .where('job.endDate > :date', {
        date: new Date().toISOString(),
      })
      .andWhere('generalJob.id = :generalJobId', { generalJobId })
      .andWhere('truckCategory.isScheduled = false')
      .andWhere('job.status = :status', { status: JobStatus.PENDING })
      .getCount();
  }

  findOwnerIncompleteJobs(restrictedAt: Date): Promise<Job[]> {
    const query = this.getJobDataQuery()
      .where('truckCategory.isScheduled = false')
      .andWhere('job.status = :status', { status: JobStatus.INCOMPLETE })
    if (restrictedAt) {
      query.andWhere('job.startDate < :restrictDate', {
        restrictDate: restrictedAt.toISOString()
      });
    }

    return query
      .orderBy('job.startDate', 'ASC')
      .getMany();
  }

  findByIdWithAllCategories(id: string): Promise<Job> {
    return this.jobRepo
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.user', 'contractor')
      .leftJoinAndSelect('job.scheduledJobs', 'scheduledJobs')
      .leftJoinAndSelect('job.truckCategories', 'truckCategory')
      .leftJoinAndSelect('truckCategory.preferredTruck', 'preferredTruck')
      .where('job.id = :id', { id })
      .getOne();
  }

  findAdminShifts(
    user: Admin,
    status: JobStatus,
    { skip, count }: { skip: number; count: number },
    generalJobId?: string,
  ): Promise<Job[]> {
    const query = this.jobRepo
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.scheduledJobs', 'schjob')
      .leftJoinAndSelect('job.user', 'contractor')
      .leftJoinAndSelect('contractor.company', 'contractorCompany')
      .leftJoinAndSelect('job.generalJob', 'generalJob')
      .leftJoinAndSelect('schjob.assignations', 'assignations')
      .leftJoinAndSelect('assignations.driver', 'driver')
      .leftJoinAndSelect('assignations.truck', 'truck')
      .leftJoinAndSelect('assignations.category', 'category')
      .leftJoinAndSelect('category.driverInvoice', 'driverInvoice')
      .leftJoinAndSelect('schjob.company', 'company')
      .leftJoinAndSelect('job.truckCategories', 'truckCategories')
      .leftJoinAndSelect('truckCategories.preferredTruck', 'preferredTrucks')
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

  findAdminScheduledJobs(
    user: User,
    status: JobStatus,
    { skip, count }: { skip: number; count: number },
    generalJobId?: string,
  ): Promise<Job[]> {
    const query = this.jobRepo
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.scheduledJobs', 'schjob')
      .leftJoinAndSelect('job.user', 'contractor')
      .leftJoinAndSelect('contractor.company', 'contractorCompany')
      .leftJoinAndSelect('job.generalJob', 'generalJob')
      .leftJoinAndSelect('schjob.assignations', 'assignations')
      .leftJoinAndSelect('assignations.driver', 'driver')
      .leftJoinAndSelect('assignations.truck', 'truck')
      .leftJoinAndSelect('assignations.category', 'category')
      .leftJoinAndSelect('schjob.company', 'company')
      .leftJoinAndSelect('job.truckCategories', 'truckCategories')
      .leftJoinAndSelect('truckCategories.preferredTruck', 'preferredTrucks')
      .leftJoinAndSelect(
        'truck.reviews',
        'reviews',
        'reviews.scheduledJob = schjob.id',
      )
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

  countAdminScheduledJobs(
    user: User,
    status: JobStatus,
    generalJobId?: string,
  ): Promise<number> {
    const query = this.jobRepo
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.scheduledJobs', 'schjob')
      .leftJoinAndSelect('job.user', 'contractor')
      .leftJoinAndSelect('contractor.company', 'contractorCompany')
      .leftJoinAndSelect('job.generalJob', 'generalJob')
      .leftJoinAndSelect('schjob.assignations', 'assignations')
      .leftJoinAndSelect('assignations.driver', 'driver')
      .leftJoinAndSelect('assignations.truck', 'truck')
      .leftJoinAndSelect('assignations.category', 'category')
      .leftJoinAndSelect('schjob.company', 'company')
      .leftJoinAndSelect('job.truckCategories', 'truckCategories')
      .leftJoinAndSelect('truckCategories.preferredTruck', 'preferredTrucks')
      .leftJoinAndSelect(
        'truck.reviews',
        'reviews',
        'reviews.scheduledJob = schjob.id',
      )
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
      .getCount();
  }

  async findContractorScheduledJobs(
    user: User,
    status: JobStatus,
    { skip, count }: { skip: number; count: number },
    generalJobId?: string,
  ): Promise<Job[]> {
    const query = this.jobRepo
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.scheduledJobs', 'schjob')
      .leftJoinAndSelect('job.user', 'contractor')
      .leftJoinAndSelect('contractor.company', 'contractorCompany')
      .leftJoinAndSelect('job.generalJob', 'generalJob')
      .leftJoinAndSelect('schjob.assignations', 'assignations')
      .leftJoinAndSelect('assignations.driver', 'driver')
      .leftJoinAndSelect('assignations.truck', 'truck')
      .leftJoinAndSelect('assignations.category', 'category')
      .leftJoinAndSelect('category.driverInvoice', 'driverInvoice')
      .leftJoinAndSelect('schjob.company', 'company')
      .leftJoinAndSelect('job.truckCategories', 'truckCategories')
      .leftJoinAndSelect('truckCategories.preferredTruck', 'preferredTrucks')
      .leftJoinAndSelect(
        'truck.reviews',
        'reviews',
        'reviews.scheduledJob = schjob.id',
      )
      .where('contractor.id = :id', { id: user.id })
      .andWhere('schjob.isCanceled = :canceled', { canceled: false });

    if (status === JobStatus.STARTED) {
      query.andWhere('job.status = :status', { status });
      query.leftJoinAndMapMany(
        'job.loads',
        Loads,
        'loads',
        'loads.jobId = job.id',
      );
      query.leftJoinAndSelect('loads.truck', 'loadTruck');
      query.leftJoinAndSelect('loads.assignation', 'loadAssignation');
      query.andWhere('assignations.finishedAt IS NULL');
    } else if (status === JobStatus.PENDING) {
      query.andWhere('job.status NOT IN (:...status)', {
        status: [
          JobStatus.CANCELED,
          JobStatus.INCOMPLETE,
          JobStatus.REQUESTED,
          JobStatus.DONE,
        ],
      });
      query.andWhere('assignations.finishedAt IS NULL');
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

    const data = await query
      .orderBy('job.startDate', status === JobStatus.DONE ? 'DESC' : 'ASC')
      .skip(skip)
      .take(count)
      .getMany();

    return data;
  }

  async findForemanScheduledJobs(
    user: Foreman | Dispatcher,
    status: JobStatus,
    { skip, count }: { skip: number; count: number },
    generalJobId?: string,
  ): Promise<Job[]> {
    const contractor = await user.contractorCompany.contractor;
    const query = this.jobRepo
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.scheduledJobs', 'schjob')
      .leftJoinAndSelect('job.user', 'contractor')
      .leftJoinAndSelect('contractor.company', 'contractorCompany')
      .leftJoinAndSelect('job.generalJob', 'generalJob')
      .leftJoinAndSelect('schjob.assignations', 'assignations')
      .leftJoinAndSelect('assignations.driver', 'driver')
      .leftJoinAndSelect('assignations.truck', 'truck')
      .leftJoinAndSelect('assignations.category', 'category')
      .leftJoinAndSelect('category.driverInvoice', 'driverInvoice')
      .leftJoinAndSelect('schjob.company', 'company')
      .leftJoinAndSelect('job.truckCategories', 'truckCategories')
      .leftJoinAndSelect('truckCategories.preferredTruck', 'preferredTrucks')
      .leftJoinAndSelect(
        'truck.reviews',
        'reviews',
        'reviews.scheduledJob = schjob.id',
      )
      .where('contractor.id = :id', { id: contractor.id })
      .andWhere('job.status = :status', { status })
      .andWhere('schjob.isCanceled = :canceled', { canceled: false });

    if (status === JobStatus.STARTED) {
      query.leftJoinAndMapMany(
        'job.loads',
        Loads,
        'loads',
        'loads.jobId = job.id',
      );
      query.leftJoinAndSelect('loads.truck', 'loadTruck');
      query.leftJoinAndSelect('loads.assignation', 'loadAssignation');
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

  countContractorScheduledJobs(
    user: User,
    status: JobStatus,
    generalJobId?: string,
  ): Promise<number> {
    const query = this.jobRepo
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.scheduledJobs', 'schjob')
      .leftJoinAndSelect('job.user', 'contractor')
      .leftJoinAndSelect('contractor.company', 'contractorCompany')
      .leftJoinAndSelect('job.generalJob', 'generalJob')
      .leftJoinAndSelect('schjob.assignations', 'assignations')
      .leftJoinAndSelect('assignations.driver', 'driver')
      .leftJoinAndSelect('assignations.truck', 'truck')
      .leftJoinAndSelect('assignations.category', 'category')
      .leftJoinAndSelect('schjob.company', 'company')
      .leftJoinAndSelect('job.truckCategories', 'truckCategories')
      .leftJoinAndSelect('truckCategories.preferredTruck', 'preferredTrucks')
      .leftJoinAndSelect(
        'truck.reviews',
        'reviews',
        'reviews.scheduledJob = schjob.id',
      )
      .where('contractor.id = :id', { id: user.id })
      .andWhere('schjob.isCanceled = :canceled', { canceled: false })
      .andWhere('truckCategories.isScheduled = true')
      .andWhere('category.isScheduled = true');

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
      query.leftJoinAndSelect('loads.truck', 'loadTruck');
      query.leftJoinAndSelect('loads.assignation', 'loadAssignation');
      query.andWhere('truckCategories.isActive = true');
      query.andWhere('category.isActive = true');
    } else if (status === JobStatus.PENDING) {
      query.andWhere('job.status NOT IN (:...status)', {
        status: [
          JobStatus.CANCELED,
          JobStatus.INCOMPLETE,
          JobStatus.REQUESTED,
          JobStatus.DONE,
        ],
      });
      query.andWhere('truckCategories.isActive = false');
      query.andWhere('category.isActive = false');
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
      .getCount();
  }

  findJobById(jobId: string): Promise<Job> {
    const query = this.jobRepo
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.scheduledJobs', 'schjob')
      .leftJoinAndSelect('job.user', 'contractor')
      .leftJoinAndSelect('contractor.company', 'contractorCompany')
      .leftJoinAndSelect('job.generalJob', 'generalJob')
      .leftJoinAndSelect('schjob.assignations', 'assignations')
      .leftJoinAndSelect('assignations.driver', 'driver')
      .leftJoinAndSelect('assignations.truck', 'truck')
      .leftJoinAndSelect('assignations.category', 'category')
      .leftJoinAndSelect('category.preferredTruck', 'categoryPreferredTruck')
      .leftJoinAndSelect('schjob.company', 'company')
      .leftJoinAndSelect('job.truckCategories', 'truckCategories')
      .leftJoinAndSelect('truckCategories.preferredTruck', 'preferredTrucks')
      .where('job.id = :id', { id: jobId });
    return query.getOne();
  }

  findContractorJobs(
    user: User,
    {
      skip,
      count,
    }: {
      skip: number;
      count: number;
    },
  ): Promise<Job[]> {
    return this.findFutureJobsQuery()
      .andWhere('contractor.id = :id', { id: user.id })
      .orderBy('job.startDate', 'ASC')
      .skip(skip)
      .take(count)
      .getMany();
  }

  findForemanPedningJobs(
    user: Foreman | Dispatcher,
    {
      skip,
      count,
    }: {
      skip: number;
      count: number;
    },
    generalJobId?: string,
  ): Promise<Job[]> {
    const query = this.getJobDataQuery()
      .where('job.endDate > :date', {
        date: new Date().toISOString(),
      })
      .andWhere('job.status <> :status', { status: JobStatus.CANCELED })
      .andWhere('company.id = :id', { id: user.contractorCompany.id });
    if (generalJobId) {
      query.andWhere('generalJob.id = :generalJobId', { generalJobId });
    }

    return query
      .andWhere(
        qb =>
          `EXISTS ${qb
            .subQuery()
            .select('1')
            .from('job', 'j')
            .leftJoinAndSelect('j.truckCategories', 'truckCategory')
            .where('truckCategory.isScheduled = false')
            .andWhere('j.id = job.id')
            .getQuery()}`,
      )
      .orderBy('job.startDate', 'ASC')
      .skip(skip)
      .take(count)
      .getMany();
  }

  findAdminPedningShifts(
    user: User,
    {
      skip,
      count,
    }: {
      skip: number;
      count: number;
    },
    generalJobId?: string,
  ): Promise<Job[]> {
    const query = this.getJobDataQuery()
      .where('job.endDate > :date', {
        date: new Date().toISOString(),
      })
      .andWhere('job.status <> :status', { status: JobStatus.CANCELED });
    if (generalJobId) {
      query.andWhere('generalJob.id = :generalJobId', { generalJobId });
    }

    return query
      .andWhere(
        qb =>
          `EXISTS ${qb
            .subQuery()
            .select('1')
            .from('job', 'j')
            .leftJoinAndSelect('j.truckCategories', 'truckCategory')
            .where('truckCategory.isScheduled = false')
            .andWhere('j.id = job.id')
            .getQuery()}`,
      )
      .orderBy('job.startDate', 'ASC')
      .skip(skip)
      .take(count)
      .getMany();
  }

  findContractorPedningJobs(
    user: User,
    {
      skip,
      count,
    }: {
      skip: number;
      count: number;
    },
    generalJobId?: string,
  ): Promise<Job[]> {
    const query = this.getJobDataQuery()
      .where('job.endDate > :date', {
        date: new Date().toISOString(),
      })
      .andWhere('contractor.id = :id', { id: user.id })
      .andWhere('truckCategory.isScheduled = false')
      .andWhere('job.status NOT IN (:...status)', {
        status: [JobStatus.DONE, JobStatus.CANCELED],
      });

    if (generalJobId) {
      query.andWhere('generalJob.id = :generalJobId', { generalJobId });
    }
    if (user.restrictedAt) {
      query.andWhere('job.startDate < :restrictDate', {
        restrictDate: user.restrictedAt.toISOString()
      });
    }

    return query
      .orderBy('job.startDate', 'ASC')
      .skip(skip)
      .take(count)
      .getMany();
  }

  findAdminIncompleteShifts(
    user: Admin,
    { skip, count }: { skip: number; count: number },
    generalJobId?: string,
  ): Promise<Job[]> {
    const query = this.getJobDataQuery()
      .where('job.endDate < :date', {
        date: new Date().toISOString(),
      })
      .andWhere('job.status <> :status', { status: JobStatus.CANCELED })
      .andWhere('job.status <> :status2', { status2: JobStatus.STARTED });

    if (generalJobId) {
      query.andWhere('generalJob.id = :generalJobId', { generalJobId });
    }

    return query
      .andWhere(
        qb =>
          `EXISTS ${qb
            .subQuery()
            .select('1')
            .from('job', 'j')
            .leftJoin('j.truckCategories', 'truckCategory')
            .where('j.id = job.id')
            .andWhere('j.status <> :status3', { status3: JobStatus.CANCELED })
            .andWhere('truckCategory.isScheduled = false')
            .andWhere('j.status <> :status4', { status4: JobStatus.STARTED })
            .getQuery()}`,
      )
      .orderBy('job.startDate', 'DESC')
      .skip(skip)
      .take(count)
      .getMany();
  }

  findForemanIncompleteJobs(
    user: Foreman | Dispatcher,
    { skip, count }: { skip: number; count: number },
    generalJobId?: string,
  ): Promise<Job[]> {
    const query = this.getJobDataQuery()
      .where('job.endDate < :date', {
        date: new Date().toISOString(),
      })
      .andWhere('company.id = :id', { id: user.contractorCompany.id })
      .andWhere('job.status <> :status', { status: JobStatus.CANCELED })
      .andWhere('job.status <> :status2', { status2: JobStatus.STARTED });

    if (generalJobId) {
      query.andWhere('generalJob.id = :generalJobId', { generalJobId });
    }

    return query
      .andWhere(
        qb =>
          `EXISTS ${qb
            .subQuery()
            .select('1')
            .from('job', 'j')
            .leftJoin('j.truckCategories', 'truckCategory')
            .where('j.id = job.id')
            .andWhere('j.status <> :status3', { status3: JobStatus.CANCELED })
            .andWhere('truckCategory.isScheduled = false')
            .andWhere('j.status <> :status4', { status4: JobStatus.STARTED })
            .getQuery()}`,
      )
      .orderBy('job.startDate', 'DESC')
      .skip(skip)
      .take(count)
      .getMany();
  }

  findContractorIncompleteJobs(
    user: User,
    { skip, count }: { skip: number; count: number },
    generalJobId?: string,
  ): Promise<Job[]> {
    const query = this.getJobDataQuery();
    query
      .where('job.endDate < :date', {
        date: new Date().toISOString(),
      })
      .andWhere('contractor.id = :id', { id: user.id })
      .andWhere('job.status <> :status', { status: JobStatus.CANCELED })
      .andWhere('job.status <> :status2', { status2: JobStatus.STARTED })
      .andWhere('job.status <> :status5', { status5: JobStatus.DONE })
      .andWhere(
        qb =>
          `EXISTS ${qb
            .subQuery()
            .select('1')
            .from('job', 'j')
            .leftJoin('j.truckCategories', 'truckCategory')
            .where('j.id = job.id')
            .andWhere('j.status <> :status3', { status3: JobStatus.CANCELED })
            .andWhere('truckCategory.isScheduled = false')
            .andWhere('j.status <> :status4', { status4: JobStatus.STARTED })
            .andWhere('j.status <> :status6', { status6: JobStatus.DONE })
            .getQuery()}`,
      );

    if (generalJobId) {
      query.andWhere('generalJob.id = :generalJobId', { generalJobId });
    }
    if (user.restrictedAt) {
      query.andWhere('j.startDate < :restrictDate', {
        restrictDate: user.restrictedAt.toISOString()
      });
    }

    return (
      query
        .orderBy('job.startDate', 'DESC')
        // .skip(skip)
        // .take(count)
        .getMany()
    );
  }

  findAdminJobs({
    skip,
    count,
  }: {
    skip: number;
    count: number;
  }): Promise<Job[]> {
    return this.findFutureJobsQuery()
      .orderBy('job.startDate', 'ASC')
      .skip(skip)
      .take(count)
      .getMany();
  }

  findAdminPedningJobs({
    skip,
    count,
  }: {
    skip: number;
    count: number;
  }): Promise<Job[]> {
    return this.getJobDataQuery()
      .where('job.endDate > :date', {
        date: new Date().toISOString(),
      })
      .andWhere('job.status <> :status', { status: JobStatus.CANCELED })
      .andWhere(
        qb =>
          `EXISTS ${qb
            .subQuery()
            .select('1')
            .from('job', 'j')
            .leftJoinAndSelect('j.truckCategories', 'truckCategory')
            .where('truckCategory.isScheduled = false')
            .andWhere('j.id = job.id')
            .getQuery()}`,
      )
      .orderBy('job.startDate', 'ASC')
      .skip(skip)
      .take(count)
      .getMany();
  }

  findAdminIncompleteJobs({
    skip,
    count,
  }: {
    skip: number;
    count: number;
  }): Promise<Job[]> {
    return this.findPastJobsQuery()
      .orderBy('job.startDate', 'ASC')
      .skip(skip)
      .take(count)
      .getMany();
  }

  findAllJobsCanceledByContractors({
    skip,
    count,
    generalJobId,
  }: {
    skip: number;
    count: number;
    generalJobId?: string;
  }): Promise<Job[]> {
    const query = this.getJobDataQuery();

    return query
      .where('generalJob.id = :generalJobId', { generalJobId })
      .andWhere('job.status = :canceled', { canceled: JobStatus.CANCELED })
      .orderBy('job.startDate', 'ASC')
      .skip(skip)
      .take(count)
      .getMany();
  }

  countAdminIncompleteJobs(
    user: Admin,
    generalJobId?: string,
  ): Promise<number> {
    const query = this.getJobDataQuery();

    query
      .where('job.endDate < :date', {
        date: new Date().toISOString(),
      })
      .andWhere('job.status <> :status', { status: JobStatus.CANCELED })
      .andWhere('job.status <> :status2', { status2: JobStatus.STARTED })
      .andWhere(
        qb =>
          `EXISTS ${qb
            .subQuery()
            .select('1')
            .from('job', 'j')
            .leftJoin('j.truckCategories', 'truckCategory')
            .where('j.id = job.id')
            .andWhere('j.status <> :status3', { status3: JobStatus.CANCELED })
            .andWhere('truckCategory.isScheduled = false')
            .andWhere('j.status <> :status4', { status4: JobStatus.STARTED })
            .getQuery()}`,
      );
    if (generalJobId) {
      query.andWhere('generalJob.id = :generalJobId', { generalJobId });
    }
    return query.getCount();
  }

  async countForemanIncompleteJobs(
    user: Foreman | Dispatcher,
    generalJobId?: string,
  ): Promise<number> {
    const query = this.getJobDataQuery();

    query
      .where('job.endDate < :date', {
        date: new Date().toISOString(),
      })
      .andWhere('contractor.id = :id', {
        id: (await user.contractorCompany.contractor).id,
      })
      .andWhere('job.status <> :status', { status: JobStatus.CANCELED })
      .andWhere('job.status <> :status2', { status2: JobStatus.STARTED })
      .andWhere(
        qb =>
          `EXISTS ${qb
            .subQuery()
            .select('1')
            .from('job', 'j')
            .leftJoin('j.truckCategories', 'truckCategory')
            .where('j.id = job.id')
            .andWhere('j.status <> :status3', { status3: JobStatus.CANCELED })
            .andWhere('truckCategory.isScheduled = false')
            .andWhere('j.status <> :status4', { status4: JobStatus.STARTED })
            .getQuery()}`,
      );
    if (generalJobId) {
      query.andWhere('generalJob.id = :generalJobId', { generalJobId });
    }
    return query.getCount();
  }

  countContractorIncompleteJobs(
    user: User,
    generalJobId?: string,
  ): Promise<number> {
    const query = this.getJobDataQuery();

    query
      .where('job.endDate < :date', {
        date: new Date().toISOString(),
      })
      .andWhere('contractor.id = :id', { id: user.id })
      .andWhere('job.status <> :status', { status: JobStatus.CANCELED })
      .andWhere('job.status <> :status2', { status2: JobStatus.STARTED })
      .andWhere('job.status <> :status5', { status5: JobStatus.DONE })
      .andWhere(
        qb =>
          `EXISTS ${qb
            .subQuery()
            .select('1')
            .from('job', 'j')
            .leftJoin('j.truckCategories', 'truckCategory')
            .where('j.id = job.id')
            .andWhere('j.status <> :status3', { status3: JobStatus.CANCELED })
            .andWhere('truckCategory.isScheduled = false')
            .andWhere('j.status <> :status4', { status4: JobStatus.STARTED })
            .andWhere('j.status <> :status6', { status6: JobStatus.DONE })
            .getQuery()}`,
      );
    if (generalJobId) {
      query.andWhere('generalJob.id = :generalJobId', { generalJobId });
    }
    if (user.restrictedAt) {
      query.andWhere('j.startDate < :restrictDate', {
        restrictDate: user.restrictedAt.toISOString()
      });
    }

    return query.getCount();
  }

  countAdminJobs(user: Admin, generalJobId?: string): Promise<number> {
    const query = this.findFutureJobsQuery();
    if (generalJobId) {
      query.andWhere('generalJob.id = :generalJobId', { generalJobId });
    }

    return query.getCount();
  }

  async countForemanJobs(
    user: Foreman | Dispatcher,
    generalJobId?: string,
  ): Promise<number> {
    const query = this.findFutureJobsQuery();
    if (generalJobId) {
      query.andWhere('generalJob.id = :generalJobId', { generalJobId });
    }

    return query
      .andWhere('contractor.id = :id', {
        id: (await user.contractorCompany.contractor).id,
      })
      .getCount();
  }

  countContractorJobs(
    user: User,
    generalJobId?: string,
    status?: JobStatus,
  ): Promise<number> {
    const query = this.findFutureJobsQuery();
    if (generalJobId) {
      query.andWhere('generalJob.id = :generalJobId', { generalJobId });
    }

    if (status === JobStatus.PENDING) {
      query.andWhere('truckCategory.isScheduled = false');
    } else {
      query.andWhere('truckCategory.isScheduled = true');
    }

    query.andWhere('truckCategory.isActive = false');

    if (user.restrictedAt) {
      query.andWhere('job.startDate < :restrictDate', {
        restrictDate: user.restrictedAt.toISOString()
      });
    }

    return query.andWhere('contractor.id = :id', { id: user.id }).getCount();
  }

  countContractorJobsDone(
    user: User,
    status: JobStatus,
    generalJobId?: string,
  ): Promise<number> {
    const query = this.getJobDataQuery();
    query.andWhere('job.status = :status', { status });
    if (generalJobId) {
      query.andWhere('generalJob.id = :generalJobId', { generalJobId });
    }

    return query.andWhere('contractor.id = :id', { id: user.id }).getCount();
  }

  findAllOwnerJobs(restrictedAt: Date): Promise<Job[]> {
    const query = this.findFutureJobsQuery()
    if (restrictedAt) {
      query.andWhere('job.startDate < :restrictDate', {
        restrictDate: restrictedAt.toISOString()
      });
    }

    return query
      .getMany();
  }

  private findFutureJobsQuery(): SelectQueryBuilder<Job> {
    return this.getJobDataQuery()
      .where('job.endDate > :date', {
        date: new Date().toISOString(),
      })
      .andWhere('truckCategory.isScheduled = false')
      .andWhere('job.status NOT IN (:...status)', {
        status: [JobStatus.CANCELED, JobStatus.DONE],
      });
  }

  private findPastJobsQuery(): SelectQueryBuilder<Job> {
    return this.getJobDataQuery()
      .where('job.endDate < :date', {
        date: new Date().toISOString(),
      })
      .andWhere('job.status <> :status', { status: JobStatus.CANCELED })
      .andWhere('truckCategory.isScheduled = false');
  }

  private getJobDataQuery(): SelectQueryBuilder<Job> {
    return this.jobRepo
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.user', 'contractor')
      .leftJoinAndSelect('contractor.company', 'company')
      .leftJoinAndSelect('job.truckCategories', 'truckCategory')
      .leftJoinAndSelect('truckCategory.preferredTruck', 'preferredTruck')
      .leftJoinAndSelect('job.scheduledJobs', 'schjob')
      .leftJoinAndSelect('schjob.assignations', 'jobass')
      .leftJoinAndSelect('jobass.category', 'category')
      .leftJoinAndSelect('job.generalJob', 'generalJob')
      .leftJoinAndSelect('jobass.driver', 'driver')
      .leftJoinAndSelect('jobass.truck', 'truck');
  }

  findAllContractorsIncompleteJobs(): Promise<Job[]> {
    return this.getJobDataQuery()
      .where('job.endDate < :date', {
        date: new Date().toISOString(),
      })
      .andWhere('job.sentNotFilledEmail = false')
      .andWhere('job.status <> :status', { status: JobStatus.CANCELED })
      .andWhere('job.status <> :statusDone', { statusDone: JobStatus.DONE })
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
  }): Promise<Job[]> {
    const query = this.jobRepo
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.generalJob', 'generalJob')
      .leftJoinAndSelect('job.scheduledJobs', 'schjob')
      .leftJoinAndSelect('schjob.assignations', 'jobass')
      .leftJoinAndSelect('job.user', 'user')
      .leftJoinAndSelect('user.company', 'company')
      .leftJoinAndSelect('jobass.driver', 'driver')
      .leftJoinAndSelect('jobass.truck', 'truck')
      .leftJoinAndSelect('schjob.company', 'ownerCompany')
      .leftJoinAndSelect('ownerCompany.owner', 'owner')
      .leftJoinAndSelect('job.truckCategories', 'truckCategory')
      .leftJoinAndSelect('truckCategory.preferredTruck', 'preferredTruck');

    return query
      .where('generalJob.id = :generalJobId', { generalJobId })
      .andWhere('job.status = :status', { status: JobStatus.CANCELED })
      .andWhere('schjob.isCanceled = true')
      .orderBy('job.startDate', 'ASC')
      .skip(skip)
      .take(count)
      .getMany();
  }

  findStartedJobsNotFinished(): Promise<Job[]> {
    const HOURS_ADD = 1;
    const today = new Date();
    const prevHour = new Date();
    prevHour.setHours(today.getHours() - HOURS_ADD);
    return this.jobRepo
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.scheduledJobs', 'schjob')
      .leftJoinAndSelect('schjob.assignations', 'jobass')
      .leftJoinAndSelect('job.user', 'user')
      .leftJoinAndSelect('jobass.driver', 'driver')
      .leftJoinAndSelect('jobass.truck', 'truck')
      .leftJoinAndSelect('schjob.company', 'ownerCompany')
      .leftJoinAndSelect('ownerCompany.owner', 'owner')
      .leftJoinAndSelect('job.truckCategories', 'truckCategory')
      .leftJoinAndSelect('truckCategory.preferredTruck', 'preferredTruck')
      .andWhere('job.endDate < :prevHour', {
        prevHour: prevHour.toISOString(),
      })
      .andWhere('job.finishedAt is NULL')
      .andWhere('job.status = :status', { status: JobStatus.STARTED })
      .getMany();
  }

  findPendingJobsNotFinished(): Promise<Job[]> {
    const HOURS_ADD = 1;
    const today = new Date();
    const prevHour = new Date();
    prevHour.setHours(today.getHours() - HOURS_ADD);
    return this.jobRepo
      .createQueryBuilder('job')
      .leftJoinAndSelect('job.scheduledJobs', 'schjob')
      .leftJoinAndSelect('schjob.assignations', 'jobass')
      .leftJoinAndSelect('job.user', 'user')
      .leftJoinAndSelect('jobass.driver', 'driver')
      .leftJoinAndSelect('jobass.truck', 'truck')
      .leftJoinAndSelect('schjob.company', 'ownerCompany')
      .leftJoinAndSelect('ownerCompany.owner', 'owner')
      .leftJoinAndSelect('job.truckCategories', 'truckCategory')
      .leftJoinAndSelect('truckCategory.preferredTruck', 'preferredTruck')
      .andWhere('job.endDate < :prevHour', {
        prevHour: prevHour.toISOString(),
      })
      .andWhere('job.finishedAt is NULL')
      .andWhere('job.status = :status', { status: JobStatus.PENDING })
      .getMany();
  }

  async getContractorWeeklyData(
    contractorId: string,
    first: string,
    last: string,
  ): Promise<any> {
    try {
      const firstDay = new Date(first);
      const lastDay = new Date(last);
      const jobTable = await this.jobRepo.query(
        `
      SELECT
        gjob.id,
        gjob.name,
        COALESCE(sum(jobass.tons), 0) tons,
        COALESCE(sum(jobass.load), 0) loads,
        COALESCE(DATE_PART('day', job."endDate" - job."startDate") * 24 + DATE_PART('hour', job."endDate" - job."startDate"), 0) as time,
        jobass.price as price
      FROM job_assignation jobass
      INNER JOIN scheduled_job schjob ON jobass."scheduledJobId" = schjob.id
      INNER JOIN job ON schjob."jobId" = job.id AND job."userId" = $1
      INNER JOIN general_job gjob ON job."generalJobId" = gjob.id
      INNER JOIN truck_category as truck ON truck."jobId" = job.id AND job."startDate" >= $2 AND job."endDate" <= $3
      GROUP BY gjob.id, gjob.name, job.id, jobass.price
      ORDER BY gjob.id
    `,
        [contractorId, firstDay, lastDay],
      );

      const jobGraphic = await this.jobRepo.query(
        `SELECT
          gjob.id,
          gjob.name,
          gjob.budget,
          COALESCE(sum(invoice.amount), 0) as spend
        FROM job
        INNER JOIN job_invoice invoice ON invoice."jobId" = job.id
        INNER JOIN general_job gjob ON job."generalJobId" = gjob.id
        WHERE job."userId" = $1 AND invoice.amount != 'NaN'
        GROUP BY gjob.id
        ORDER BY gjob.id
      `,
        [contractorId],
      );

      return { jobTable, jobGraphic };
    } catch (error) {
      return { jobTable: [], jobGraphic: [] };
    }
  }

  async getOwnerWeeklyData(
    ownerId: string,
    firstDay: string,
    lastDay: string,
    firstWeekday: Date,
    lastWeekday: Date,
  ): Promise<any> {
    try {
      const driverTable = await this.jobRepo.query(
        `
        SELECT 
          distinct driver.name,
          COALESCE(sum(jobass.tons), 0) as tons,
          COALESCE(sum(jobass.load), 0) as loads,
          COALESCE(review.stars, 0),
          COALESCE(sum(DATE_PART('day', job."endDate" - job."startDate") * 24 + DATE_PART('hour', job."endDate" - job."startDate")), 0) as time
        FROM public.user driver
        INNER JOIN job_assignation jobass ON jobass."driverId" = driver.id AND driver.role = 'DRIVER'
        INNER JOIN scheduled_job schjob ON schjob."companyId" IN (SELECT id FROM owner_company WHERE "ownerId" = $1) AND jobass."scheduledJobId" = schjob.id
        INNER JOIN job ON schjob."jobId" = job.id AND job."startDate" >= $2 AND job."endDate" <= $3
        LEFT JOIN review ON review."userId" = driver.id
        GROUP BY driver.name, review.stars
      `,
        [ownerId, firstDay, lastDay],
      );

      const truckTable = await this.jobRepo.query(
        `
        SELECT 
          distinct truck.number,
          COALESCE(sum(jobass.tons), 0) as tons, COALESCE(sum(jobass.load), 0) as loads,
          COALESCE(sum(DATE_PART('day', job."endDate" - job."startDate") * 24 + DATE_PART('hour', job."endDate" - job."startDate")), 0) as time
        FROM truck INNER JOIN job_assignation jobass ON jobass."truckId" = truck.id
        INNER JOIN scheduled_job schjob ON schjob."companyId" IN (SELECT id FROM owner_company WHERE "ownerId" = $1) AND jobass."scheduledJobId" = schjob.id
        INNER JOIN job ON schjob."jobId" = job.id AND job."startDate" >= $2 AND job."endDate" <= $3
        GROUP BY truck.number
      `,
        [ownerId, firstDay, lastDay],
      );

      const driverPerformanceGraphic = await this.jobRepo.query(
        `
        SELECT 
          driver.name,
          COALESCE(sum(DATE_PART('day', job."endDate" - job."startDate") * 24 + DATE_PART('hour', job."endDate" - job."startDate")), 0) as time,
          DATE_PART('week', job."startDate") week
        FROM public.user driver
        INNER JOIN job_assignation jobass ON jobass."driverId" = driver.id AND driver.role = 'DRIVER'
        INNER JOIN scheduled_job schjob ON schjob."companyId" IN (SELECT id FROM owner_company WHERE "ownerId" = $1) AND jobass."scheduledJobId" = schjob.id 
        INNER JOIN job ON schjob."jobId" = job.id AND job."startDate" >= $2 AND job."endDate" <= $3
        GROUP BY week, driver.name
      `,
        [ownerId, firstWeekday, lastWeekday],
      );

      const trucksPerformanceGraphic = await this.jobRepo.query(
        `
        SELECT 
          truck.number as name,
          COALESCE(sum(DATE_PART('day', job."endDate" - job."startDate") * 24 + DATE_PART('hour', job."endDate" - job."startDate")), 0) as time,
          DATE_PART('week', job."startDate") week
        FROM truck truck
        INNER JOIN job_assignation jobass ON jobass."truckId" = truck.id
        INNER JOIN scheduled_job schjob ON schjob."companyId" IN (SELECT id FROM owner_company WHERE "ownerId" = $1) AND jobass."scheduledJobId" = schjob.id 
        INNER JOIN job ON schjob."jobId" = job.id AND job."startDate" >= $2 AND job."endDate" <= $3
        GROUP BY week, truck.number 
      `,
        [ownerId, firstWeekday, lastWeekday],
      );

      const [ownerJobInvoiceStartDate] = await this.jobRepo.query(`
      SELECT 
        "createdAt"
      FROM owner_job_invoice
      ORDER BY "createdAt"
      LIMIT 1
      `);
      const companyPerformanceGraphic = await this.jobRepo.query(
        `
      SELECT 
        COALESCE(sum(amount), 0) sales,
        DATE_PART('week', "dueDate") week
      FROM owner_job_invoice
      WHERE "dueDate" BETWEEN $1 AND $2 AND "ownerId" = $3
      GROUP BY week
      ORDER BY week
      `,
        [ownerJobInvoiceStartDate.createdAt, lastWeekday, ownerId],
      );

      return {
        driverTable,
        truckTable,
        driverPerformanceGraphic,
        companyPerformanceGraphic,
        trucksPerformanceGraphic,
      };
    } catch (error) {
      return {
        driverTable: [],
        truckTable: [],
        driverPerformanceGraphic: [],
        companyPerformanceGraphic: [],
        trucksPerformanceGraphic: [],
      };
    }
  }

  async reportSelects(ID: string): Promise<any> {
    const reponse = await this.jobRepo.query(
      `
      SELECT STRING_AGG((company."ownerId" || ' | ' || company."companyCommonName"), ', ') as "companyData", job.name, job.material, job.id, truck.number
      FROM owner_company company
      INNER JOIN owner_job_invoice owninvoice ON company."ownerId" = owninvoice."ownerId"
      INNER JOIN job_invoice ON owninvoice."jobInvoiceId" = job_invoice.id
      AND job_invoice."contractorId" = $1
      INNER JOIN job ON job.id = job_invoice."jobId"
      INNER JOIN scheduled_job schjob ON schjob."jobId" = job.id
      INNER JOIN job_assignation jobass ON jobass."scheduledJobId" = schjob.id
      INNER JOIN truck ON truck.id = jobass."truckId"
      GROUP BY company.id, company."ownerId", company."companyCommonName", 
      company."ownerId", job.name, job.id, job.material, truck.number
      `,
      [ID],
    );
    return reponse;
  }

  async getSettlementData(
    data: {
      owner?: string;
      jobs?: string[];
      trucks?: string[];
      materials?: string[];
    },
    start: string,
    end: string,
    contractor: string,
  ): Promise<any> {
    const startDate = new Date(start);
    const endDate = new Date(end);
    const response = await this.jobRepo.query(
      `
      SELECT job."orderNumber", job.material, truck.number, ticket."createdAt", ticket.ticket,
      category.price rate, owninvoice."ownerId", owninvoice.amount net, owninvoice."netAmount" gross, SUM(driverinvoice.hours) hours, SUM(driverinvoice."sumTons") tons, SUM(driverinvoice."sumLoad") loads
      FROM job
      LEFT JOIN owner_job_invoice owninvoice ON (owninvoice."ownerId" = $1 OR $1 IS NULL)
      LEFT JOIN job_invoice jobinvoice ON jobinvoice.id = owninvoice."jobInvoiceId"
      INNER JOIN driver_job_invoice driverinvoice ON driverinvoice."ownerInvoiceId" = owninvoice.id
      INNER JOIN loads ticket ON ticket."jobId"::uuid = job.id AND ticket.ticket IS NOT NULL
      INNER JOIN truck ON truck.id = ticket."truckId"::uuid AND (truck.number = ANY($2::text[]) OR $2 IS NULL)
      INNER JOIN truck_category category ON category."jobId" = job.id
      WHERE (job.name = ANY($3::text[]) OR $3 IS NULL)
      AND (job.material = ANY($4::text[]) OR $4 IS NULL)
      AND owninvoice."jobId" = ticket."jobId"::uuid
      AND job."startDate" >= $5
      AND job."endDate" <= $6
      AND job."userId" = $7
      GROUP BY job."orderNumber", job.material, truck.number, ticket."createdAt", ticket.ticket,
      category.price, owninvoice."ownerId", owninvoice.amount, owninvoice."netAmount"
    `,
      [
        data.owner,
        data.trucks,
        data.jobs,
        data.materials,
        startDate,
        endDate,
        contractor,
      ],
    );

    return response;
  }

  async DataTicketsReport(ID: string): Promise<any> {
    const reponse = await this.jobRepo.query(
      `
      SELECT
        job."orderNumber",
        job.material,
        truck.number,
        ticket."createdAt",
        ticket.ticket,
        category.price
      FROM job
      LEFT JOIN owner_job_invoice owninvoice ON (owninvoice."ownerId" = $1 OR $1 IS NULL)
      LEFT JOIN job_invoice jobinvoice ON jobinvoice.id = owninvoice."jobInvoiceId"
      INNER JOIN loads ticket ON ticket."jobId"::uuid = job.id AND ticket.ticket IS NOT NULL
      INNER JOIN truck ON truck.id = ticket."truckId"::uuid AND (truck.number IN ($2) OR $2 IS NULL)
      INNER JOIN truck_category category ON category."jobId" = job.id
      WHERE (job.name IN ($3) OR $3 IS NULL) AND (job.material IN ($4) OR $4 IS NULL)
      GROUP BY job."orderNumber", job.material, truck.number, ticket."createdAt", ticket.ticket, category.price
      `,
      [ID],
    );
    console.log('DataTicketsReport__reponse', reponse);
  }

  async getAdminWeeklyData(
    firstDay: string,
    lastDay: string,
    firstWeekday: Date,
    lastWeekday: Date,
  ): Promise<any> {
    const contractorTable = await this.jobRepo.query(
      `
      SELECT
        gjob.id,
        contractor_company."companyCommonName" as "companyName",
        gjob.name as "jobName",
        COALESCE(sum(DATE_PART('day', job."endDate" - job."startDate") * 24 + DATE_PART('hour', job."endDate" - job."startDate")), 0) as hours,
        COALESCE(sum(jobass.tons), 0) tons,
        COALESCE(sum(jobass.load), 0) loads,
        0 as invoices
      FROM job_assignation jobass
      INNER JOIN scheduled_job schjob ON jobass."scheduledJobId" = schjob.id
      INNER JOIN job ON schjob."jobId" = job.id
      INNER JOIN general_job gjob ON job."generalJobId" = gjob.id AND job."startDate" >= $1 AND job."endDate" <= $2
      LEFT JOIN public.user contractor ON contractor.id = job."userId"
      INNER JOIN contractor_company ON contractor_company."contractorId" = contractor.id 
      GROUP BY gjob.id, gjob.name,contractor_company."companyCommonName"
    `,
      [firstDay, lastDay],
    );

    const ownerTable = await this.jobRepo.query(
      `
      SELECT 
        company."companyCommonName" as name,
        invoice."ownerOrderNumber",
        invoice."jobOrderNumber",
        invoice.amount,
        sum(jobass.tons) as tons,
        sum(jobass.load) as loads,
        sum(DATE_PART('day', job."endDate" - job."startDate") * 24 + DATE_PART('hour', job."endDate" - job."startDate")) as hours
      FROM owner_job_invoice invoice
      INNER JOIN job ON invoice."jobId" = job.id
      INNER JOIN scheduled_job schjob ON schjob."jobId" = job.id
      INNER JOIN job_assignation jobass ON jobass."scheduledJobId" = schjob.id
      INNER JOIN public.user owner ON owner.id = invoice."ownerId"
      INNER JOIN owner_company company ON company.id = schjob."companyId"
      WHERE invoice."dueDate" BETWEEN $1 AND $2
      GROUP BY invoice.id, company."companyCommonName", invoice."invoiceNumber", invoice."jobOrderNumber"
    `,
      [firstDay, lastDay],
    );

    const ownerGraphic = await this.jobRepo.query(
      `
      SELECT
        company."companyCommonName" as name,
        sum(invoice.amount) as amount,
        DATE_PART('week', invoice."dueDate") week
      FROM owner_job_invoice invoice
      INNER JOIN job ON invoice."jobId" = job.id
      INNER JOIN scheduled_job schjob ON schjob."jobId" = job.id
      INNER JOIN job_assignation jobass ON jobass."scheduledJobId" = schjob.id
      INNER JOIN owner_company company ON company.id = schjob."companyId"
      INNER JOIN public.user owner ON owner.id = invoice."ownerId"
      WHERE invoice."dueDate" BETWEEN $1 AND $2 AND invoice.amount != 'NaN'
      GROUP BY company."companyCommonName", invoice."dueDate"
      ORDER BY week
    `,
      [firstWeekday, lastWeekday],
    );

    const contractorGraphic = await this.jobRepo.query(
      `
      SELECT
      contractor_company."companyCommonName" as "name",
        sum(invoice.amount) as amount,
        DATE_PART('week', invoice."dueDate") week 
      FROM job_invoice invoice 
      INNER JOIN public.user contractor ON invoice."contractorId" = contractor.id
      INNER JOIN contractor_company ON contractor_company."contractorId" = contractor.id 
      WHERE invoice."dueDate" BETWEEN $1 AND $2 AND invoice.amount != 'NaN'
      GROUP BY contractor_company."companyCommonName", invoice."dueDate"
      ORDER BY week
    `,
      [firstWeekday, lastWeekday],
    );

    const trucks = await this.jobRepo.query(
      `
      SELECT
        'TRUCK' as role,
        DATE_PART('week', "createdAt") "createdWeek",
        DATE_PART('week', "deletedAt") "deletedWeek"
      FROM truck_log 
      ORDER BY "createdWeek"
    `,
    );

    const users = await this.jobRepo.query(
      `
      SELECT
        role,
        DATE_PART('week' ,"createdAt") "createdWeek",
        DATE_PART('week', "deletedAt") "deletedWeek"
      FROM user_log 
      ORDER BY "createdWeek"
    `,
    );

    const newCustomerGraphic = [trucks, users];

    return {
      contractorTable,
      ownerTable,
      ownerGraphic,
      contractorGraphic,
      newCustomerGraphic,
    };
  }
}
