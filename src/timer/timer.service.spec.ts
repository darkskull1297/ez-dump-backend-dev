import { Test, TestingModule } from '@nestjs/testing';
import { addDays, subDays } from 'date-fns';
import { v4 as uuid } from 'uuid';

import { NotFoundException } from '@nestjs/common';
import { User } from '../user/user.model';
import { TimerService } from './timer.service';
import { TimeEntryRepo } from './time-entry.repository';
import { JobRepo } from '../jobs/job.repository';
import { JobAssignationRepo } from '../jobs/job-assignation.repository';
import { ScheduledJobRepo } from '../jobs/scheduled-job.repository';
import { Job } from '../jobs/job.model';
import { Company } from '../company/company.model';
import { ScheduledJob } from '../jobs/scheduled-job.model';
import { JobAssignation } from '../jobs/job-assignation.model';
import { JobStatus } from '../jobs/job-status';
import { StartFutureJobException } from './exceptions/start-future-job.exception';
import { ClockedInException } from './exceptions/clocked-in.exception';
import { FinishedJobException } from './exceptions/finished-job.exception';
import { TimeEntry } from './time-entry.model';
import { NotClockedInException } from './exceptions/not-clocked-in.exception';
import { NoActiveJobException } from './exceptions/no-active-job.exception';

describe('Timer Service', () => {
  let service: TimerService;
  let repo: TimeEntryRepo;
  let scheduledJobRepo: ScheduledJobRepo;
  let jobRepo: JobRepo;
  let jobAssignationRepo: JobAssignationRepo;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TimerService,
        {
          provide: TimeEntryRepo,
          useValue: {
            findActive: jest.fn(),
            create: jest.fn(x => x),
            save: jest.fn(x => x),
          },
        },
        {
          provide: JobRepo,
          useValue: {
            save: jest.fn(x => x),
            findById: jest.fn(() => null),
          },
        },
        {
          provide: ScheduledJobRepo,
          useValue: {
            findActiveScheduledJob: jest.fn(),
            findJobScheduledJobs: jest.fn(() => []),
            find: jest.fn(() => []),
          },
        },
        {
          provide: JobAssignationRepo,
          useValue: {
            save: jest.fn(x => x),
            getAvailableUsersForJob: jest.fn(() => []),
          },
        },
      ],
    }).compile();

    service = module.get<TimerService>(TimerService);
    repo = module.get<TimeEntryRepo>(TimeEntryRepo);
    scheduledJobRepo = module.get<ScheduledJobRepo>(ScheduledJobRepo);
    jobRepo = module.get<JobRepo>(JobRepo);
    jobAssignationRepo = module.get<JobAssignationRepo>(JobAssignationRepo);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should clock in successfully', async () => {
    const user = new User();
    user.drivingFor = new Company();
    user.id = uuid();
    const job = new Job();
    job.id = uuid();

    const assignation = { driver: user } as JobAssignation;

    const schJob1 = new ScheduledJob();
    schJob1.job = job;
    schJob1.assignations = [assignation];
    const schJob2 = new ScheduledJob();
    schJob2.job = job;
    schJob2.assignations = [
      { driver: new User() } as JobAssignation,
      { driver: new User() } as JobAssignation,
    ];
    const scheduledJobs = [schJob1, schJob2];

    (jobRepo.findById as jest.Mock).mockReturnValue(job);
    (scheduledJobRepo.find as jest.Mock).mockReturnValue(scheduledJobs);
    (scheduledJobRepo.findActiveScheduledJob as jest.Mock).mockReturnValue(
      null,
    );

    await service.clockIn(user, job.id);

    expect(job.status).toBe(JobStatus.STARTED);
    expect(repo.create).toBeCalled();
    expect(jobAssignationRepo.save).toBeCalled();
  });

  it('should throw future job on clock in', () => {
    const user = new User();
    user.drivingFor = new Company();
    user.id = uuid();
    const job = new Job();
    job.id = uuid();
    job.startDate = addDays(new Date(), 2);

    const assignation = { driver: user } as JobAssignation;

    const schJob1 = new ScheduledJob();
    schJob1.job = job;
    schJob1.assignations = [assignation];
    const schJob2 = new ScheduledJob();
    schJob2.job = job;
    schJob2.assignations = [
      { driver: new User() } as JobAssignation,
      { driver: new User() } as JobAssignation,
    ];
    const scheduledJobs = [schJob1, schJob2];

    (jobRepo.findById as jest.Mock).mockReturnValue(job);
    (scheduledJobRepo.find as jest.Mock).mockReturnValue(scheduledJobs);
    (scheduledJobRepo.findActiveScheduledJob as jest.Mock).mockReturnValue(
      null,
    );

    expect(service.clockIn(user, job.id)).rejects.toThrowError(
      StartFutureJobException,
    );
  });

  it('should throw not found on clock in', () => {
    const user = new User();
    user.drivingFor = new Company();
    user.id = uuid();
    const job = new Job();
    job.id = uuid();

    const schJob1 = new ScheduledJob();
    schJob1.job = job;
    schJob1.assignations = [{ driver: new User() } as JobAssignation];
    const schJob2 = new ScheduledJob();
    schJob2.job = job;
    schJob2.assignations = [
      { driver: new User() } as JobAssignation,
      { driver: new User() } as JobAssignation,
    ];
    const scheduledJobs = [schJob1, schJob2];

    (jobRepo.findById as jest.Mock).mockReturnValue(job);
    (scheduledJobRepo.find as jest.Mock).mockReturnValue(scheduledJobs);
    (scheduledJobRepo.findActiveScheduledJob as jest.Mock).mockReturnValue(
      null,
    );

    expect(service.clockIn(user, job.id)).rejects.toThrowError(
      NotFoundException,
    );
  });

  it('should throw already clocked in if assignation is started', () => {
    const user = new User();
    user.drivingFor = new Company();
    user.id = uuid();
    const job = new Job();
    job.id = uuid();

    const assignation = {
      driver: user,
      startedAt: subDays(new Date(), 1),
    } as JobAssignation;

    const schJob1 = new ScheduledJob();
    schJob1.job = job;
    schJob1.assignations = [assignation];
    const schJob2 = new ScheduledJob();
    schJob2.job = job;
    schJob2.assignations = [
      { driver: new User() } as JobAssignation,
      { driver: new User() } as JobAssignation,
    ];
    const scheduledJobs = [schJob1, schJob2];

    (jobRepo.findById as jest.Mock).mockReturnValue(job);
    (scheduledJobRepo.find as jest.Mock).mockReturnValue(scheduledJobs);
    (scheduledJobRepo.findActiveScheduledJob as jest.Mock).mockReturnValue(
      null,
    );

    expect(service.clockIn(user, job.id)).rejects.toThrowError(
      ClockedInException,
    );
  });

  it('should throw already clocked in if user has an active job', () => {
    const user = new User();
    user.drivingFor = new Company();
    user.id = uuid();
    const job = new Job();
    job.id = uuid();

    const assignation = { driver: user } as JobAssignation;

    const schJob1 = new ScheduledJob();
    schJob1.job = job;
    schJob1.assignations = [assignation];
    const schJob2 = new ScheduledJob();
    schJob2.job = job;
    schJob2.assignations = [
      { driver: new User() } as JobAssignation,
      { driver: new User() } as JobAssignation,
    ];
    const scheduledJobs = [schJob1, schJob2];

    (jobRepo.findById as jest.Mock).mockReturnValue(job);
    (scheduledJobRepo.find as jest.Mock).mockReturnValue(scheduledJobs);
    (scheduledJobRepo.findActiveScheduledJob as jest.Mock).mockReturnValue(
      new Job(),
    );

    expect(service.clockIn(user, job.id)).rejects.toThrowError(
      ClockedInException,
    );
  });

  it('should throw finished job on clock in if job has been finished', () => {
    const user = new User();
    user.drivingFor = new Company();
    user.id = uuid();
    const job = new Job();
    job.id = uuid();

    const assignation = {
      driver: user,
      finishedAt: subDays(new Date(), 1),
    } as JobAssignation;

    const schJob1 = new ScheduledJob();
    schJob1.job = job;
    schJob1.assignations = [assignation];
    const schJob2 = new ScheduledJob();
    schJob2.job = job;
    schJob2.assignations = [
      { driver: new User() } as JobAssignation,
      { driver: new User() } as JobAssignation,
    ];
    const scheduledJobs = [schJob1, schJob2];

    (jobRepo.findById as jest.Mock).mockReturnValue(job);
    (scheduledJobRepo.find as jest.Mock).mockReturnValue(scheduledJobs);
    (scheduledJobRepo.findActiveScheduledJob as jest.Mock).mockReturnValue(
      null,
    );

    expect(service.clockIn(user, job.id)).rejects.toThrowError(
      FinishedJobException,
    );
  });

  it('should throw finished job on clock in if job status is done', () => {
    const user = new User();
    user.drivingFor = new Company();
    user.id = uuid();
    const job = new Job();
    job.id = uuid();
    job.status = JobStatus.DONE;

    const assignation = { driver: user } as JobAssignation;

    const schJob1 = new ScheduledJob();
    schJob1.job = job;
    schJob1.assignations = [assignation];
    const schJob2 = new ScheduledJob();
    schJob2.job = job;
    schJob2.assignations = [
      { driver: new User() } as JobAssignation,
      { driver: new User() } as JobAssignation,
    ];
    const scheduledJobs = [schJob1, schJob2];

    (jobRepo.findById as jest.Mock).mockReturnValue(job);
    (scheduledJobRepo.find as jest.Mock).mockReturnValue(scheduledJobs);
    (scheduledJobRepo.findActiveScheduledJob as jest.Mock).mockReturnValue(
      null,
    );

    expect(service.clockIn(user, job.id)).rejects.toThrowError(
      FinishedJobException,
    );
  });

  it('should start job on clock in', async () => {
    const user = new User();
    user.drivingFor = new Company();
    user.id = uuid();
    const job = new Job();
    job.id = uuid();
    job.status = JobStatus.PENDING;

    const assignation = { driver: user } as JobAssignation;

    const schJob1 = new ScheduledJob();
    schJob1.job = job;
    schJob1.assignations = [assignation];
    const schJob2 = new ScheduledJob();
    schJob2.job = job;
    schJob2.assignations = [
      { driver: new User() } as JobAssignation,
      { driver: new User() } as JobAssignation,
    ];
    const scheduledJobs = [schJob1, schJob2];

    (jobRepo.findById as jest.Mock).mockReturnValue(job);
    (scheduledJobRepo.find as jest.Mock).mockReturnValue(scheduledJobs);
    (scheduledJobRepo.findActiveScheduledJob as jest.Mock).mockReturnValue(
      null,
    );

    await service.clockIn(user, job.id);

    expect(job.status).toBe(JobStatus.STARTED);
    expect(jobRepo.save).toBeCalled();
  });

  it('should break job successfully', async () => {
    const user = new User();
    const timeEntry = { user, job: new Job() } as TimeEntry;

    (repo.findActive as jest.Mock).mockReturnValue(timeEntry);

    await service.break(user);

    expect(repo.findActive).toBeCalled();
    expect(repo.save).toBeCalled();
    expect(timeEntry.endDate).toBeTruthy();
  });

  it('should throw not clocked in on break job', () => {
    const user = new User();
    (repo.findActive as jest.Mock).mockReturnValue(null);

    expect(service.break(user)).rejects.toThrowError(NotClockedInException);
  });

  it('should resume job successfully', async () => {
    const user = new User();
    const job = new Job();
    const scheduledJob = new ScheduledJob();
    scheduledJob.job = job;

    (scheduledJobRepo.findActiveScheduledJob as jest.Mock).mockReturnValue(
      scheduledJob,
    );
    (repo.findActive as jest.Mock).mockReturnValue(null);

    await service.resume(user);

    expect(scheduledJobRepo.findActiveScheduledJob).toBeCalled();
    expect(repo.findActive).toBeCalled();
    expect(repo.create).toBeCalled();
  });

  it('should throw no active job on resume job', () => {
    const user = new User();
    (scheduledJobRepo.findActiveScheduledJob as jest.Mock).mockReturnValue(
      null,
    );

    expect(service.resume(user)).rejects.toThrowError(NoActiveJobException);
  });

  it('should throw already clocked in on resume job', () => {
    const user = new User();
    const job = new Job();
    const scheduledJob = new ScheduledJob();
    scheduledJob.job = job;

    (scheduledJobRepo.findActiveScheduledJob as jest.Mock).mockReturnValue(
      scheduledJob,
    );
    (repo.findActive as jest.Mock).mockReturnValue(new TimeEntry());

    expect(service.resume(user)).rejects.toThrowError(ClockedInException);
  });

  it('should finish job successfully', async () => {
    const user = new User();
    const job = new Job();
    const timeEntry = { user, job: new Job() } as TimeEntry;
    const assignation = { driver: user } as JobAssignation;
    const scheduledJob = new ScheduledJob();
    scheduledJob.job = job;
    scheduledJob.assignations = [assignation];

    (scheduledJobRepo.findActiveScheduledJob as jest.Mock).mockReturnValue(
      scheduledJob,
    );
    (scheduledJobRepo.findJobScheduledJobs as jest.Mock).mockReturnValue([
      scheduledJob,
    ]);
    (repo.findActive as jest.Mock).mockReturnValue(timeEntry);

    await service.finishJob(user);

    expect(scheduledJobRepo.findActiveScheduledJob).toBeCalled();
    expect(scheduledJobRepo.findJobScheduledJobs).toBeCalled();
    expect(repo.findActive).toBeCalled();
    expect(repo.save).toBeCalled();
    expect(timeEntry.endDate).toBeTruthy();
    expect(jobAssignationRepo.save).toBeCalled();
  });

  it('should throw no active job on finish job', () => {
    const user = new User();
    (scheduledJobRepo.findActiveScheduledJob as jest.Mock).mockReturnValue(
      null,
    );

    expect(service.finishJob(user)).rejects.toThrowError(NoActiveJobException);
  });

  it('should throw not clocked in on finish job', () => {
    const user = new User();
    (repo.findActive as jest.Mock).mockReturnValue(null);
    (scheduledJobRepo.findActiveScheduledJob as jest.Mock).mockReturnValue(
      new ScheduledJob(),
    );

    expect(service.finishJob(user)).rejects.toThrowError(NotClockedInException);
  });

  it('should complete job', async () => {
    const user = new User();
    const job = new Job();
    const timeEntry = { user, job: new Job() } as TimeEntry;
    const assignation = { driver: user } as JobAssignation;
    const completeAssignation = {
      driver: new User(),
      finishedAt: new Date(),
    } as JobAssignation;
    const scheduledJob = new ScheduledJob();
    scheduledJob.job = job;
    scheduledJob.assignations = [assignation];
    const scheduledJob2 = new ScheduledJob();
    scheduledJob2.job = job;
    scheduledJob2.assignations = [completeAssignation, completeAssignation];
    const scheduledJob3 = new ScheduledJob();
    scheduledJob3.job = job;
    scheduledJob3.assignations = [completeAssignation];

    (scheduledJobRepo.findActiveScheduledJob as jest.Mock).mockReturnValue(
      scheduledJob,
    );
    (scheduledJobRepo.findJobScheduledJobs as jest.Mock).mockReturnValue([
      scheduledJob,
      scheduledJob2,
      scheduledJob3,
    ]);
    (repo.findActive as jest.Mock).mockReturnValue(timeEntry);

    await service.finishJob(user);

    expect(job.status).toBe(JobStatus.DONE);
    expect(jobRepo.save).toBeCalled();
  });
});
