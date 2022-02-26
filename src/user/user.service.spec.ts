import { Test, TestingModule } from '@nestjs/testing';
import { UserService } from './user.service';
import { UserRepo } from './user.repository';
import { S3Service } from '../s3/s3.service';
import { User, UserRole } from './user.model';
import { Company } from '../company/company.model';

describe('UserService', () => {
  let service: UserService;
  let repo: UserRepo;
  let s3: S3Service;
  const company = new Company();

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: UserRepo,
          useValue: {
            find: jest.fn(() => [
              { drivingFor: company, role: UserRole.DRIVER },
              { drivingFor: company, role: UserRole.DRIVER },
            ]),
          },
        },
        {
          provide: S3Service,
          useValue: {
            getUploadProfileImageUrl: jest.fn(id => `amazon.com/${id}`),
          },
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
    repo = module.get<UserRepo>(UserRepo);
    s3 = module.get<S3Service>(S3Service);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it("should return owner's drivers", async () => {
    const owner = {
      name: 'Luke Skywalker',
      role: UserRole.OWNER,
      company,
    } as User;
    const drivers = await service.getOwnerDrivers(owner, { skip: 0, count: 2 });
    expect(repo.find).toHaveBeenCalled();
    expect(drivers.length).toEqual(2);
    drivers.forEach(driver => {
      expect(driver.role).toEqual(UserRole.DRIVER);
      expect(driver.drivingFor).toEqual(company);
    });
  });

  it('should return all drivers', async () => {
    const drivers = await service.getAllDrivers();
    expect(repo.find).toHaveBeenCalled();
    expect(drivers.length).toEqual(2);
    drivers.forEach(driver => {
      expect(driver.role).toEqual(UserRole.DRIVER);
    });
  });

  it('should get a link to update the profile picture', async () => {
    const id = 'myId';
    const url = await service.getUpdateProfileImageLink(id);
    expect(s3.getUploadProfileImageUrl).toHaveBeenCalled();
    expect(url).toContain(id);
  });
});
