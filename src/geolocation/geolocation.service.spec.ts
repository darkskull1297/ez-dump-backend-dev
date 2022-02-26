import { Test, TestingModule } from '@nestjs/testing';
import { EVENT_EMITTER_TOKEN } from 'nest-emitter';
import { JobAssignation } from '../jobs/job-assignation.model';
import { Job } from '../jobs/job.model';
import { ScheduledJob } from '../jobs/scheduled-job.model';
import { ScheduledJobRepo } from '../jobs/scheduled-job.repository';
import { NoActiveJobException } from '../timer/exceptions/no-active-job.exception';
import { NotClockedInException } from '../timer/exceptions/not-clocked-in.exception';
import { TimeEntryRepo } from '../timer/time-entry.repository';
import { Truck } from '../trucks/truck.model';
import { User } from '../user/user.model';
import { GeolocationEventEmitter } from './geolocation.events';
import { GeolocationRepo } from './geolocation.repository';
import { GeolocationService } from './geolocation.service';

describe('GeolocationService', () => {
  let service: GeolocationService;
  let repo: GeolocationRepo;
  let timeEntryRepo: TimeEntryRepo;
  let scheduledJobRepo: ScheduledJobRepo;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GeolocationService,
        {
          provide: GeolocationRepo,
          useValue: {
            create: jest.fn(x => x),
          },
        },
        {
          provide: ScheduledJobRepo,
          useValue: {
            findActiveScheduledJob: jest.fn(),
          },
        },
        {
          provide: TimeEntryRepo,
          useValue: {
            findActive: jest.fn(),
          },
        },
        {
          provide: EVENT_EMITTER_TOKEN,
          useValue: {
            emit: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<GeolocationService>(GeolocationService);
    repo = module.get<GeolocationRepo>(GeolocationRepo);
    timeEntryRepo = module.get<TimeEntryRepo>(TimeEntryRepo);
    scheduledJobRepo = module.get<ScheduledJobRepo>(ScheduledJobRepo);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should update location successfully', async () => {
    const geolocation = { date: new Date(), lat: '12.12345', long: '-120.111' };
    const user = new User();
    const job = new Job();
    const assignations = [
      { driver: user, truck: new Truck() },
    ] as JobAssignation[];
    const scheduledJob = { job, assignations } as ScheduledJob;

    (scheduledJobRepo.findActiveScheduledJob as jest.Mock).mockReturnValue(
      scheduledJob,
    );
    (timeEntryRepo.findActive as jest.Mock).mockReturnValue({});

    const newGeoloc = await service.create(geolocation, user);

    expect(scheduledJobRepo.findActiveScheduledJob).toBeCalled();
    expect(timeEntryRepo.findActive).toBeCalled();
    expect(repo.create).toBeCalled();

    expect(newGeoloc.date).toBe(geolocation.date);
    expect(newGeoloc.lat).toBe(geolocation.lat);
    expect(newGeoloc.long).toBe(geolocation.long);
    expect(newGeoloc.driver).toBe(user);
    expect(newGeoloc.job).toBe(job);
  });

  it('should throw no active job', async () => {
    const geolocation = { date: new Date(), lat: '12.12345', long: '-120.111' };
    const user = new User();

    (timeEntryRepo.findActive as jest.Mock).mockReturnValue({});

    expect(service.create(geolocation, user)).rejects.toThrowError(
      NoActiveJobException,
    );
  });

  it('should throw not clocked in', async () => {
    const geolocation = { date: new Date(), lat: '12.12345', long: '-120.111' };
    const user = new User();
    const job = new Job();
    const scheduledJob = { job } as ScheduledJob;

    (scheduledJobRepo.findActiveScheduledJob as jest.Mock).mockReturnValue(
      scheduledJob,
    );

    expect(service.create(geolocation, user)).rejects.toThrowError(
      NotClockedInException,
    );
  });
});
