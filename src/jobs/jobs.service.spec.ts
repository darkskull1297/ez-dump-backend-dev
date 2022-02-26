import { Test, TestingModule } from '@nestjs/testing';
import { v4 as uuid } from 'uuid';

import { JobsService } from './jobs.service';
import { JobRepo } from './job.repository';
import { ScheduledJobRepo } from './scheduled-job.repository';
import { UserRepo } from '../user/user.repository';
import { TruckRepo } from '../trucks/truck.repository';
import { Job } from './job.model';
import { TruckType } from '../trucks/truck-type';
import { TruckSubType } from '../trucks/truck-subtype';
import { User } from '../user/user.model';
import { TruckCategory } from '../trucks/truck-category.model';
import { Company } from '../company/company.model';
import { TrucksUnassignableException } from './exceptions/trucks-unassignable.exception';
import { DocumentNotFoundException } from '../common/exceptions/document-not-found.exception';
import { JobScheduledException } from './exceptions/job-scheduled.exception';
import { UserScheduledException } from './exceptions/user-scheduled.exception';
import { TruckScheduledException } from './exceptions/truck-scheduled.exception';
import { NoAssignationsException } from './exceptions/no-assignations.exception';
import { Truck } from '../trucks/truck.model';
import { ScheduledJob } from './scheduled-job.model';

describe('Jobs Service', () => {
  let service: JobsService;
  let repo: JobRepo;
  let scheduledJobRepo: ScheduledJobRepo;
  let userRepo: UserRepo;
  let truckRepo: TruckRepo;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JobsService,
        {
          provide: JobRepo,
          useValue: {
            create: jest.fn(x => x),
            find: jest.fn(() => []),
            findOwnerJobs: jest.fn(() => []),
            findContractorJobs: jest.fn(() => []),
            findAdminJobs: jest.fn(() => []),
            findAdminIncompleteJobs: jest.fn(() => []),
            findContractorIncompleteJobs: jest.fn(() => []),
            save: jest.fn(),
            findById: jest.fn(() => null),
          },
        },
        {
          provide: ScheduledJobRepo,
          useValue: {
            findOwnerScheduledJobs: jest.fn(() => []),
            findDriverScheduledJobs: jest.fn(() => []),
            findActiveScheduledJob: jest.fn(() => []),
            findOwnerJobs: jest.fn(() => []),
            findOwnerDoneJobs: jest.fn(() => []),
            findContractorJobs: jest.fn(() => []),
            findAdminJobsDone: jest.fn(() => []),
            findAdminJobs: jest.fn(() => []),
            create: jest.fn(x => x),
            userHasJobScheduled: jest.fn(() => false),
            truckHasJobScheduled: jest.fn(() => false),
          },
        },
        {
          provide: UserRepo,
          useValue: {
            findDriversByIds: jest.fn(() => []),
            getAvailableUsersForJob: jest.fn(() => []),
          },
        },
        {
          provide: TruckRepo,
          useValue: {
            findByIds: jest.fn(() => []),
            getAvailableTrucksForJob: jest.fn(() => []),
          },
        },
      ],
    }).compile();

    service = module.get<JobsService>(JobsService);
    repo = module.get<JobRepo>(JobRepo);
    scheduledJobRepo = module.get<ScheduledJobRepo>(ScheduledJobRepo);
    truckRepo = module.get<TruckRepo>(TruckRepo);
    userRepo = module.get<UserRepo>(UserRepo);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create a job successfully', async () => {
    const job = { name: 'job name' } as Job;
    const categories = [
      {
        truckType: TruckType.DUMP_TRAILER,
        truckSubtype: TruckSubType.ALUMINUM_BED,
        id: uuid(),
      },
      {
        truckType: TruckType.QUAD,
        truckSubtype: TruckSubType.BED_WITH_VIBRATOR,
        id: uuid(),
      },
    ];
    const user = { name: 'Han Solo' } as User;

    const newJob = await service.create(job, categories, user);
    expect(repo.create).toBeCalled();
    expect(newJob).toBeDefined();
    expect(newJob.name).toBe(job.name);
    expect(newJob.user.name).toBe(user.name);
    expect(newJob.truckCategories).toHaveLength(2);
  });

  it('should get jobs successfully', async () => {
    const user = { name: 'Han Solo' } as User;

    const jobs = await service.getJobs(user, 0, 1);
    expect(repo.findOwnerJobs).toBeCalled();
    expect(jobs).toBeDefined();
  });

  it('should get owner scheduled jobs successfully', async () => {
    const user = { name: 'Han Solo' } as User;

    const scheduledJobs = await service.getOwnerScheduledJobs(user, {
      skip: 0,
      count: 3,
      start: new Date().toISOString(),
      end: new Date().toISOString(),
      active: true,
    });
    expect(scheduledJobRepo.findOwnerJobs).toBeCalled();
    expect(scheduledJobs).toBeDefined();
  });

  it('should get driver scheduled jobs successfully', async () => {
    const user = { name: 'Han Solo' } as User;

    const scheduledJobs = await service.getDriverScheduledJobs(user, {
      skip: 0,
      count: 3,
      start: new Date().toISOString(),
      end: new Date().toISOString(),
    });
    expect(scheduledJobRepo.findDriverScheduledJobs).toBeCalled();
    expect(scheduledJobs).toBeDefined();
  });

  it('should get owner done jobs successfully', async () => {
    const user = { name: 'Han Solo', company: { id: uuid() } } as User;

    const scheduledJobs = await service.getOwnerJobsDone(user, {
      skip: 0,
      count: 3,
    });
    expect(scheduledJobRepo.findOwnerJobs).toBeCalled();
    expect(scheduledJobs).toBeDefined();
  });

  it('should schedule a job successfully', async () => {
    const user = { name: 'Han Solo', company: new Company() } as User;
    const driver = { id: uuid(), drivingFor: user.company };
    const truck = {
      id: uuid(),
      type: TruckType.QUAD,
      subtype: TruckSubType.ALUMINUM_BED,
      company: user.company,
    };
    const category = new TruckCategory();
    category.truckType = truck.type;
    category.truckSubtype = truck.subtype;
    category.id = uuid();

    const job = new Job();
    job.id = uuid();
    job.truckCategories = [category];

    const jobId = job.id;
    const jobAssignations = [{ driverId: driver.id, truckId: truck.id }];

    (repo.findById as jest.Mock).mockReturnValue(job);
    (truckRepo.findByIds as jest.Mock).mockReturnValue([truck]);
    (userRepo.findDriversByIds as jest.Mock).mockReturnValue([driver]);

    const scheduledJob = await service.scheduleJob(
      user,
      jobId,
      jobAssignations,
    );
    expect(scheduledJobRepo.userHasJobScheduled).toBeCalled();
    expect(scheduledJobRepo.truckHasJobScheduled).toBeCalled();
    expect(scheduledJobRepo.create).toBeCalled();
    expect(repo.save).toBeCalled();
    expect(scheduledJob).toBeDefined();
  });

  it('should throw trucks unassignable with different types', async () => {
    const user = { name: 'Han Solo', company: new Company() } as User;
    const driver = { id: uuid(), drivingFor: user.company };
    const truck = {
      id: uuid(),
      type: TruckType.QUAD,
      subtype: TruckSubType.ALUMINUM_BED,
      company: user.company,
    };
    const category = new TruckCategory();
    category.truckType = TruckType.DUMP_TRAILER;
    category.truckSubtype = truck.subtype;
    category.id = uuid();

    const job = new Job();
    job.id = uuid();
    job.truckCategories = [category];

    const jobId = job.id;
    const jobAssignations = [{ driverId: driver.id, truckId: truck.id }];

    (repo.findById as jest.Mock).mockReturnValue(job);
    (truckRepo.findByIds as jest.Mock).mockReturnValue([truck]);
    (userRepo.findDriversByIds as jest.Mock).mockReturnValue([driver]);

    expect(
      service.scheduleJob(user, jobId, jobAssignations),
    ).rejects.toThrowError(TrucksUnassignableException);
  });

  it('should throw no assignations', async () => {
    const user = { name: 'Han Solo', company: new Company() } as User;
    const category = new TruckCategory();
    category.truckType = TruckType.DUMP_TRAILER;
    category.truckSubtype = TruckSubType.ALUMINUM_BED;
    category.id = uuid();

    const job = new Job();
    job.id = uuid();
    job.truckCategories = [category];

    const jobId = job.id;
    const jobAssignations = [];

    (repo.findById as jest.Mock).mockReturnValue(job);
    (truckRepo.findByIds as jest.Mock).mockReturnValue([]);
    (userRepo.findDriversByIds as jest.Mock).mockReturnValue([]);

    expect(
      service.scheduleJob(user, jobId, jobAssignations),
    ).rejects.toThrowError(NoAssignationsException);
  });

  it('should throw job scheduled', async () => {
    const user = { name: 'Han Solo', company: new Company() } as User;
    const driver = { id: uuid(), drivingFor: user.company };
    const truck = {
      id: uuid(),
      type: TruckType.QUAD,
      subtype: TruckSubType.ALUMINUM_BED,
      company: user.company,
    };
    const category = new TruckCategory();
    category.truckType = truck.type;
    category.truckSubtype = truck.subtype;
    category.isScheduled = true;
    category.id = uuid();

    const job = new Job();
    job.id = uuid();
    job.truckCategories = [category];

    const jobId = job.id;
    const jobAssignations = [{ driverId: driver.id, truckId: truck.id }];

    (repo.findById as jest.Mock).mockReturnValue(job);
    (truckRepo.findByIds as jest.Mock).mockReturnValue([truck]);
    (userRepo.findDriversByIds as jest.Mock).mockReturnValue([driver]);

    expect(
      service.scheduleJob(user, jobId, jobAssignations),
    ).rejects.toThrowError(JobScheduledException);
  });

  it('should throw user not found with different companies', async () => {
    const user = { name: 'Han Solo', company: { id: uuid() } } as User;
    const driver = { id: uuid(), drivingFor: { id: uuid() } };
    const truck = {
      id: uuid(),
      type: TruckType.QUAD,
      subtype: TruckSubType.ALUMINUM_BED,
      company: user.company,
    };
    const category = new TruckCategory();
    category.truckType = truck.type;
    category.truckSubtype = truck.subtype;
    category.id = uuid();

    const job = new Job();
    job.id = uuid();
    job.truckCategories = [category];

    const jobId = job.id;
    const jobAssignations = [{ driverId: driver.id, truckId: truck.id }];

    (repo.findById as jest.Mock).mockReturnValue(job);
    (truckRepo.findByIds as jest.Mock).mockReturnValue([truck]);
    (userRepo.findDriversByIds as jest.Mock).mockReturnValue([driver]);

    expect(
      service.scheduleJob(user, jobId, jobAssignations),
    ).rejects.toThrowError(DocumentNotFoundException);
  });

  it('should throw truck not found with different companies', async () => {
    const user = { name: 'Han Solo', company: { id: uuid() } } as User;
    const driver = { id: uuid(), drivingFor: user.company };
    const truck = {
      id: uuid(),
      type: TruckType.QUAD,
      subtype: TruckSubType.ALUMINUM_BED,
      company: { id: uuid() },
    };
    const category = new TruckCategory();
    category.truckType = truck.type;
    category.truckSubtype = truck.subtype;
    category.id = uuid();

    const job = new Job();
    job.id = uuid();
    job.truckCategories = [category];

    const jobId = job.id;
    const jobAssignations = [{ driverId: driver.id, truckId: truck.id }];

    (repo.findById as jest.Mock).mockReturnValue(job);
    (truckRepo.findByIds as jest.Mock).mockReturnValue([truck]);
    (userRepo.findDriversByIds as jest.Mock).mockReturnValue([driver]);

    expect(
      service.scheduleJob(user, jobId, jobAssignations),
    ).rejects.toThrowError(DocumentNotFoundException);
  });

  it('should throw user scheduled', async () => {
    const user = { name: 'Han Solo', company: new Company() } as User;
    const driver = { id: uuid(), drivingFor: user.company };
    const truck = {
      id: uuid(),
      type: TruckType.QUAD,
      subtype: TruckSubType.ALUMINUM_BED,
      company: user.company,
    };
    const category = new TruckCategory();
    category.truckType = truck.type;
    category.truckSubtype = truck.subtype;
    category.id = uuid();

    const job = new Job();
    job.id = uuid();
    job.truckCategories = [category];

    const jobId = job.id;
    const jobAssignations = [{ driverId: driver.id, truckId: truck.id }];

    (repo.findById as jest.Mock).mockReturnValue(job);
    (truckRepo.findByIds as jest.Mock).mockReturnValue([truck]);
    (userRepo.findDriversByIds as jest.Mock).mockReturnValue([driver]);
    (scheduledJobRepo.userHasJobScheduled as jest.Mock).mockReturnValue(true);

    expect(
      service.scheduleJob(user, jobId, jobAssignations),
    ).rejects.toThrowError(UserScheduledException);
  });

  it('should throw truck scheduled', async () => {
    const user = { name: 'Han Solo', company: new Company() } as User;
    const driver = { id: uuid(), drivingFor: user.company };
    const truck = {
      id: uuid(),
      type: TruckType.QUAD,
      subtype: TruckSubType.ALUMINUM_BED,
      company: user.company,
    };
    const category = new TruckCategory();
    category.truckType = truck.type;
    category.truckSubtype = truck.subtype;
    category.id = uuid();

    const job = new Job();
    job.id = uuid();
    job.truckCategories = [category];

    const jobId = job.id;
    const jobAssignations = [{ driverId: driver.id, truckId: truck.id }];

    (repo.findById as jest.Mock).mockReturnValue(job);
    (truckRepo.findByIds as jest.Mock).mockReturnValue([truck]);
    (userRepo.findDriversByIds as jest.Mock).mockReturnValue([driver]);
    (scheduledJobRepo.truckHasJobScheduled as jest.Mock).mockReturnValue(true);

    expect(
      service.scheduleJob(user, jobId, jobAssignations),
    ).rejects.toThrowError(TruckScheduledException);
  });

  it('should return resources', async () => {
    const user = new User();
    const job = new Job();

    const category = new TruckCategory();
    category.truckType = TruckType.DUMP_TRAILER;
    category.truckSubtype = TruckSubType.ALUMINUM_BED;
    job.truckCategories = [category];

    const truck = new Truck();
    truck.type = category.truckType;
    truck.subtype = category.truckSubtype;

    const trucks = [truck];
    const drivers = [new User(), new User()];

    (repo.findById as jest.Mock).mockReturnValue(job);
    (truckRepo.getAvailableTrucksForJob as jest.Mock).mockReturnValue(trucks);
    (userRepo.getAvailableUsersForJob as jest.Mock).mockReturnValue(drivers);

    const resources = await service.getResources(user, job.id);
    expect(resources.trucks).toHaveLength(1);
    expect(resources.drivers).toHaveLength(2);
  });

  it('should return no resources (filtered)', async () => {
    const user = new User();
    const job = new Job();

    const category = new TruckCategory();
    category.truckType = TruckType.DUMP_TRAILER;
    category.truckSubtype = TruckSubType.ALUMINUM_BED;
    job.truckCategories = [category];

    const truck = new Truck();
    truck.type = category.truckType;
    truck.subtype = TruckSubType.BED_WITH_VIBRATOR;

    const trucks = [truck];
    const drivers = [new User(), new User()];

    (repo.findById as jest.Mock).mockReturnValue(job);
    (truckRepo.getAvailableTrucksForJob as jest.Mock).mockReturnValue(trucks);
    (userRepo.getAvailableUsersForJob as jest.Mock).mockReturnValue(drivers);

    const resources = await service.getResources(user, job.id);
    expect(resources.trucks).toHaveLength(0);
    expect(resources.drivers).toHaveLength(2);
  });

  it('should return the active scheduled job', async () => {
    const user = new User();
    const scheduledJob = new ScheduledJob();
    scheduledJob.job = new Job();

    (scheduledJobRepo.findActiveScheduledJob as jest.Mock).mockReturnValue(
      scheduledJob,
    );

    const schJob = await service.getActiveScheduledJob(user);

    expect(schJob).toBeDefined();
    expect(schJob.job).toEqual(scheduledJob.job);
  });

  it('should return contractor scheduled jobs successfully', async () => {
    const user = { name: 'Han Solo', id: uuid() } as User;

    const scheduledJobs = await service.getContractorScheduledJobs(user, {
      skip: 0,
      count: 3,
      active: true,
    });
    expect(scheduledJobRepo.findContractorJobs).toBeCalled();
    expect(scheduledJobs).toBeDefined();
  });

  it('should return contractor done jobs successfully', async () => {
    const user = { name: 'Han Solo', id: uuid() } as User;

    const scheduledJobs = await service.getContractorJobsDone(user, {
      skip: 0,
      count: 3,
    });
    expect(scheduledJobRepo.findContractorJobs).toBeCalled();
    expect(scheduledJobs).toBeDefined();
  });

  it('should return contractor unassigned jobs successfully', async () => {
    const user = { name: 'Han Solo', id: uuid() } as User;

    const jobs = await service.getContractorUnassignedJobs(user, {
      skip: 0,
      count: 3,
    });
    expect(repo.findContractorJobs).toBeCalled();
    expect(jobs).toBeDefined();
  });

  it('should return contractor incomplete jobs successfully', async () => {
    const user = { name: 'Han Solo', id: uuid() } as User;

    const jobs = await service.getContractorIncompleteJobs(user, {
      skip: 0,
      count: 3,
    });
    expect(repo.findContractorIncompleteJobs).toBeCalled();
    expect(jobs).toBeDefined();
  });

  it('should return admin available jobs successfully', async () => {
    const jobs = await service.getAdminAvailableJobs({
      skip: 0,
      count: 3,
    });
    expect(repo.findAdminJobs).toBeCalled();
    expect(jobs).toBeDefined();
  });

  it('should return admin scheduled jobs successfully', async () => {
    const scheduledJobs = await service.getAdminScheduledJobs({
      skip: 0,
      count: 3,
    });
    expect(scheduledJobRepo.findAdminJobs).toBeCalled();
    expect(scheduledJobs).toBeDefined();
  });

  it('should return admin jobs done successfully', async () => {
    const scheduledJobs = await service.getAdminJobsDone({
      skip: 0,
      count: 3,
    });
    expect(scheduledJobRepo.findAdminJobsDone).toBeCalled();
    expect(scheduledJobs).toBeDefined();
  });

  it('should return admin incomplete jobs successfully', async () => {
    const jobs = await service.getAdminIncompleteJobs({
      skip: 0,
      count: 3,
    });
    expect(repo.findAdminIncompleteJobs).toBeCalled();
    expect(jobs).toBeDefined();
  });
});
