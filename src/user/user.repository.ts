import { Injectable } from '@nestjs/common';
import bcrypt from 'bcrypt';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { BaseRepository } from '../common/base.repository';
import { User, UserRole } from './user.model';
import { TypeOrmException } from '../common/exceptions/type-orm.exception';
import { DocumentNotFoundException } from '../common/exceptions/document-not-found.exception';
import { Job } from '../jobs/job.model';
import { Driver } from './driver.model';
import { Owner } from './owner.model';
import { parseDateToTimestamp } from '../util/date-utils';
import { OwnerCompany } from '../company/owner-company.model';
import { ContractorCompany } from '../company/contractor-company.model';
import { OwnerRepo } from './owner.repository';
import { ContractorRepo } from './contractor.repository';
import { AdminRepo } from './admin.repository';
import { DriverRepo } from './driver.repository';
import { OwnerCompanyRepo } from '../company/owner-company.repository';
import { JobStatus } from '../jobs/job-status';
import { Contractor } from './contractor.model';
import { Dispatcher } from './dispatcher.model';
import { Foreman } from './foreman.model';
import { DispatcherRepo } from './dispatcher.repository';
import { ForemanRepo } from './foreman.repository';
import { ContractorCompanyRepo } from '../company/contractor-company.repository';
import { OwnerPriority } from './owner-priority';
import { id } from 'date-fns/locale';

type CreateUser = Pick<User, 'name' | 'email' | 'password' | 'phoneNumber'>;

type UpdateUser = Partial<CreateUser> &
Pick<Contractor, 'stripeCustomerId'> &
Pick<Owner, 'stripeAccountId'>;

@Injectable()
export class UserRepo extends BaseRepository<User, CreateUser, UpdateUser>(
  User,
) {
  constructor(
    @InjectRepository(User) private readonly userRepo: Repository<User>,
    private readonly contractorRepo: ContractorRepo,
    private readonly adminRepo: AdminRepo,
    private readonly ownerRepo: OwnerRepo,
    private readonly driverRepo: DriverRepo,
    private readonly ownerCompanyRepo: OwnerCompanyRepo,
    private readonly dispatcherRepo: DispatcherRepo,
    private readonly foremanRepo: ForemanRepo,
    private readonly contractorCompanyRepo: ContractorCompanyRepo,
  ) {
    super(userRepo);
  }

  async loginByDisabledUser(access: string, userRole: string): Promise<User> {
    return this.userRepo
      .createQueryBuilder('user')
      .where('user.isDisable = true')
      .andWhere('user.email = :data or user.phoneNumber = :data', {
        data: access,
      })
      .andWhere('user.role = :isRole', { isRole: userRole })
      .getOne();
  }

  async loginByEmailOrPassword(access: string, userRole: string): Promise<User> {
    return this.userRepo
      .createQueryBuilder('user')
      .where('user.isDisable = false')
      .andWhere('user.email = :data or user.phoneNumber = :data', {
        data: access,
      })
      .andWhere('user.role = :isRole', { isRole: userRole })
      .getOne();
  }

  async findActiveUser(id: string, access: string): Promise<User> {
    return this.userRepo
      .createQueryBuilder('user')
      .where('user.id != :userId', {
        userId: id,
      })
      .andWhere('user.email = :data or user.phoneNumber = :data', {
        data: access,
      })
      .andWhere('user.isDisable = false')
      .getOne();
  }

  async findDriversByIds(ids: string[]): Promise<User[]> {
    try {
      const users = await this.userRepo.findByIds(ids, {
        role: UserRole.DRIVER,
      });
      if (users.length !== ids.length)
        throw new DocumentNotFoundException('User');

      return users;
    } catch (e) {
      if (e instanceof DocumentNotFoundException) throw e;
      throw new TypeOrmException(e);
    }
  }

  async findDriverById(id: string): Promise<User> {
    try {
      const user = await this.userRepo.findOne({ id });
      if (user === null) throw new DocumentNotFoundException('User');

      return user;
    } catch (e) {
      if (e instanceof DocumentNotFoundException) throw e;
      throw new TypeOrmException(e);
    }
  }

  async createAdmin({
    name,
    email,
    phoneNumber,
    password,
  }: CreateUser): Promise<User> {
    try {
      const hashedPass = await bcrypt.hash(password, 12);
      return await this.adminRepo.create({
        name,
        email,
        phoneNumber,
        password: hashedPass,
      });
    } catch (e) {
      throw new TypeOrmException(e);
    }
  }

  async createContractor(
    { name, email, phoneNumber, password }: CreateUser,
    company: ContractorCompany,
  ): Promise<User> {
    try {
      const hashedPass = await bcrypt.hash(password, 12);
      return await this.contractorRepo.create({
        name,
        email,
        phoneNumber,
        company,
        password: hashedPass,
      });
    } catch (e) {
      throw new TypeOrmException(e);
    }
  }

  async createOwner(
    { name, email, phoneNumber, password }: CreateUser,
    company: OwnerCompany,
  ): Promise<Owner> {
    try {
      const hashedPass = await bcrypt.hash(password, 12);
      return await this.ownerRepo.create({
        name,
        email,
        phoneNumber,
        company,
        password: hashedPass,
      });
    } catch (e) {
      throw new TypeOrmException(e);
    }
  }

  async createDriver(
    driver: Omit<Driver, 'id' | 'updatedAt' | 'createdAt'>,
    ownerId: string,
  ): Promise<User> {
    try {
      const hashedPass = await bcrypt.hash(driver.password, 12);
      const drivingFor = await this.ownerCompanyRepo.findOwnerCompany(ownerId);
      return await this.driverRepo.create({
        ...driver,
        drivingFor,
        password: hashedPass,
      });
    } catch (e) {
      throw new TypeOrmException(e);
    }
  }

  async createDispatcher(
    dispatcher: Omit<Dispatcher, 'id' | 'updatedAt' | 'createdAt'>,
    contractorId: string,
  ): Promise<User> {
    try {
      const hashedPass = await bcrypt.hash(dispatcher.password, 12);
      const contractorCompany = await this.contractorCompanyRepo.findContractorCompany(
        contractorId,
      );
      return await this.dispatcherRepo.create({
        ...dispatcher,
        contractorCompany,
        password: hashedPass,
      });
    } catch (e) {
      throw new TypeOrmException(e);
    }
  }

  async createForeman(
    foreman: Omit<Foreman, 'id' | 'updatedAt' | 'createdAt'>,
    contractorId: string,
  ): Promise<User> {
    try {
      const hashedPass = await bcrypt.hash(foreman.password, 12);
      const contractorCompany = await this.contractorCompanyRepo.findContractorCompany(
        contractorId,
      );
      return await this.foremanRepo.create({
        ...foreman,
        contractorCompany,
        password: hashedPass,
      });
    } catch (e) {
      throw new TypeOrmException(e);
    }
  }

  async comparePassword(user: User, password: string): Promise<boolean> {
    try {
      return bcrypt.compare(password, user.password);
    } catch (err) {
      return false;
    }
  }

  async getAvailableUsersForJob(job: Job, owner: Owner): Promise<Driver[]> {
    const company = await this.ownerCompanyRepo.findOwnerCompany(owner.id);
    return this.userRepo
      .createQueryBuilder('user')
      .where('user.role = :role', { role: UserRole.DRIVER })
      .andWhere('user.isActive = true')
      .andWhere('user.drivingFor.id = :id', { id: company.id })
      .andWhere(
        qb =>
          `NOT EXISTS ${qb
            .subQuery()
            .select('1')
            .from('user', 'u')
            .leftJoin('u.assignations', 'assignation')
            .leftJoin('assignation.scheduledJob', 'scheduledJob')
            .leftJoin('scheduledJob.job', 'job')
            .where('u.id = user.id')
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
      .getMany() as Promise<Driver[]>;
  }

  async getAvailableUsersForJobScheduled(
    job: Job,
    owner: Owner,
  ): Promise<Driver[]> {
    const company = await this.ownerCompanyRepo.findOwnerCompany(owner.id);
    return this.userRepo
      .createQueryBuilder('user')
      .where('user.role = :role', { role: UserRole.DRIVER })
      .andWhere('user.isActive = true')
      .andWhere('user.drivingFor.id = :id', { id: company.id })
      .andWhere(
        qb =>
          `NOT EXISTS ${qb
            .subQuery()
            .select('1')
            .from('user', 'u')
            .leftJoin('u.assignations', 'assignation')
            .leftJoin('assignation.scheduledJob', 'scheduledJob')
            .leftJoin('scheduledJob.job', 'job')
            .where('u.id = user.id')
            .andWhere('scheduledJob.isCanceled = false')
            .andWhere('assignation.finishedAt IS NOT NULL')
            .getQuery()}`,
      )
      .getMany() as Promise<Driver[]>;
  }

  async findOwnerDrivers(owner: Owner, { skip, count }): Promise<User[]> {
    const company = await this.ownerCompanyRepo.findOwnerCompany(owner.id);
    return this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.drivingFor', 'drivingFor')
      .leftJoinAndSelect('drivingFor.contacts', 'contacts')
      .where('user.role = :role', { role: UserRole.DRIVER })
      .andWhere('user.drivingFor.id = :id', { id: company.id })
      .andWhere('user.isDisable = false')
      .skip(skip)
      .take(count)
      .getMany();
  }

  async findDrivers(id: string): Promise<User[]> {
    const company = await this.ownerCompanyRepo.findOwnerCompany(id);
    return this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.drivingFor', 'drivingFor')
      .leftJoinAndSelect('drivingFor.contacts', 'contacts')
      .where('user.role = :role', { role: UserRole.DRIVER })
      .andWhere('user.drivingFor.id = :id', { id: company.id })
      .getMany();
  }

  async findContractorByDispatcher(
    dispatcher: Dispatcher,
  ): Promise<Contractor> {
    const companyContractor = await this.contractorCompanyRepo.getCompany(
      dispatcher.contractorCompany.id,
    );
    return companyContractor.contractor;
  }

  async findContractorByForeman(foreman: Foreman): Promise<Contractor> {
    const companyContractor = await this.contractorCompanyRepo.getCompany(
      foreman.contractorCompany.id,
    );
    return companyContractor.contractor;
  }

  async findContractorDispatchers(
    contractor: Contractor,
    { skip, count },
  ): Promise<Dispatcher[]> {
    const company = await this.contractorCompanyRepo.findContractorCompany(
      contractor.id,
    );
    return this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.contractorCompany', 'contractorComp')
      .leftJoinAndSelect('contractorComp.contacts', 'contacts')
      .where('user.role = :role', { role: UserRole.DISPATCHER })
      .andWhere('user.contractorCompany.id = :id', { id: company.id })
      .skip(skip)
      .take(count)
      .getMany() as Promise<Dispatcher[]>;
  }

  async findContractorDispatchersFromDriver(
    contractorId: string,
  ): Promise<Dispatcher[]> {
    const company = await this.contractorCompanyRepo.findContractorCompany(
      contractorId,
    );
    return this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.contractorCompany', 'contractorComp')
      .leftJoinAndSelect('contractorComp.contacts', 'contacts')
      .where('user.role = :role', { role: UserRole.DISPATCHER })
      .andWhere('user.contractorCompany.id = :id', { id: company.id })
      .getMany() as Promise<Dispatcher[]>;
  }

  async findAdminsFromDriver(): Promise<User[]> {
    return this.userRepo
      .createQueryBuilder('user')
      .where('user.role = :role', { role: UserRole.ADMIN })
      .getMany() as Promise<User[]>;
  }

  async findContractorForemans(
    contractor: Contractor,
    { skip, count },
  ): Promise<Foreman[]> {
    const company = await this.contractorCompanyRepo.findContractorCompany(
      contractor.id,
    );
    return this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.contractorCompany', 'contractorComp')
      .leftJoinAndSelect('contractorComp.contacts', 'contacts')
      .where('user.role = :role', { role: UserRole.FOREMAN })
      .andWhere('user.contractorCompany.id = :id', { id: company.id })
      .skip(skip)
      .take(count)
      .getMany() as Promise<Foreman[]>;
  }

  async contractorForemans(contractor: Contractor): Promise<Foreman[]> {
    const company = await this.contractorCompanyRepo.findContractorCompany(
      contractor.id,
    );
    return this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.contractorCompany', 'contractorComp')
      .leftJoinAndSelect('contractorComp.contacts', 'contacts')
      .where('user.role = :role', { role: UserRole.FOREMAN })
      .andWhere('user.contractorCompany.id = :id', { id: company.id })
      .getMany() as Promise<Foreman[]>;
  }

  async findContractorForemansFromDriver(
    contractorId: string,
  ): Promise<Foreman[]> {
    const company = await this.contractorCompanyRepo.findContractorCompany(
      contractorId,
    );
    return this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.contractorCompany', 'contractorComp')
      .leftJoinAndSelect('contractorComp.contacts', 'contacts')
      .where('user.role = :role', { role: UserRole.FOREMAN })
      .andWhere('user.contractorCompany.id = :id', { id: company.id })
      .getMany() as Promise<Foreman[]>;
  }

  getOwnerCompany(owner: Owner): Promise<OwnerCompany> {
    return this.ownerCompanyRepo.findOwnerCompany(owner.id);
  }

  async updateUserCompany(
    company: OwnerCompany,
    update: OwnerCompany,
  ): Promise<OwnerCompany> {
    await this.ownerCompanyRepo.updateCompany(company, update);
    return this.ownerCompanyRepo.getCompany(company.id);
  }

  async updateContractorCompany(
    company: ContractorCompany,
    update: ContractorCompany,
  ): Promise<ContractorCompany> {
    await this.contractorCompanyRepo.updateCompany(company, update);
    return this.contractorCompanyRepo.getCompany(company.id);
  }

  updateCustomerId(user: User, customerId: string): Promise<User> {
    return this.update(user.id, { stripeCustomerId: customerId });
  }

  getContractorCompany(contractor: Contractor): Promise<ContractorCompany> {
    return this.contractorCompanyRepo.findContractorCompany(contractor.id);
  }

  async getAllOwners(): Promise<Owner[]> {
    return (await this.userRepo.find({ role: UserRole.OWNER })) as Owner[];
  }

  async getAllContractors(): Promise<Contractor[]> {
    return (await this.userRepo.find({
      role: UserRole.CONTRACTOR,
    })) as Contractor[];
  }

  async verifyOwner(id: string): Promise<void> {
    const owner = await this.ownerRepo.getOwnerById(id);
    owner.verifiedByAdmin = true;
    await this.ownerRepo.save(owner);
  }

  async unVerifyOwner(id: string): Promise<void> {
    const owner = await this.ownerRepo.getOwnerById(id);
    owner.verifiedByAdmin = false;
    await this.ownerRepo.save(owner);
  }

  async verifyContractor(id: string): Promise<void> {
    const contractor = await this.contractorRepo.findById(id);
    contractor.verifiedByAdmin = true;
    await this.contractorRepo.save(contractor);
  }

  async unVerifyContractor(id: string): Promise<void> {
    const contractor = await this.contractorRepo.findById(id);
    contractor.verifiedByAdmin = false;
    await this.contractorRepo.save(contractor);
  }

  async findAllDriversWithCompany(): Promise<Driver[]> {
    return this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.drivingFor', 'drivingFor')
      .leftJoinAndSelect('drivingFor.contacts', 'contacts')
      .leftJoinAndSelect('drivingFor.owner', 'owner')
      .where('user.role = :role', { role: UserRole.DRIVER })
      .getMany() as Promise<Driver[]>;
  }

  async findDispatchers(contractor: Contractor): Promise<Dispatcher[]> {
    const company = await this.contractorCompanyRepo.findContractorCompany(
      contractor.id,
    );
    return this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.contractorCompany', 'contractorComp')
      .where('user.role = :role', { role: UserRole.DISPATCHER })
      .andWhere('user.contractorCompany.id = :id', { id: company.id })
      .getMany() as Promise<Dispatcher[]>;
  }

  async findForemans(contractor: Contractor): Promise<Dispatcher[]> {
    const company = await this.contractorCompanyRepo.findContractorCompany(
      contractor.id,
    );
    return this.userRepo
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.contractorCompany', 'contractorComp')
      .where('user.role = :role', { role: UserRole.FOREMAN })
      .andWhere('user.contractorCompany.id = :id', { id: company.id })
      .getMany() as Promise<Dispatcher[]>;
  }

  async findAllOwnersWithCompany(): Promise<Owner[]> {
    return this.ownerRepo.getOwnersWithCompany();
  }

  async findAllOwnersWithCompanyForAdmin(): Promise<any[]> {
    return this.ownerRepo.getOwnersWithCompanyForAdmin();
  }

  async countOwnerDrivers(owner: Owner, isActive: boolean): Promise<number> {
    const company = await this.ownerCompanyRepo.findOwnerCompany(owner.id);
    return this.userRepo
      .createQueryBuilder('user')
      .leftJoin('user.drivingFor', 'drivingFor')
      .where('user.role = :role', { role: UserRole.DRIVER })
      .andWhere('user.drivingFor.id = :id', { id: company.id })
      .andWhere('user.isDisable = false')
      .andWhere('user.isActive = :isActive', { isActive })
      .getCount();
  }

  async changeOwnerPriority(
    id: string,
    priority: OwnerPriority,
  ): Promise<Owner> {
    const owner = await this.ownerRepo.getOwnerById(id);
    owner.priority = priority;
    return this.ownerRepo.save(owner);
  }

  // async changeOwnerDiscount(id: string): Promise<Owner> {
  //   const owner = await this.ownerRepo.findById(id);
  //   owner.hasDiscount = !owner.hasDiscount;
  //   await this.ownerRepo.save(owner);
  //   return this.ownerRepo.findById(id);
  // }

  // async changeContractorDiscount(id: string): Promise<Contractor> {
  //   const contractor = await this.contractorRepo.findById(id);
  //   contractor.hasDiscount = !contractor.;
  //   await this.contractorRepo.save(contractor);
  //   return this.contractorRepo.findById(id);
  // }

  async countOwnersByPriority(ownerPriority: OwnerPriority): Promise<number> {
    return this.userRepo
      .createQueryBuilder('user')
      .where('user.role = :role', { role: UserRole.OWNER })
      .andWhere('user.priority = :priority', { priority: ownerPriority })
      .getCount();
  }

  async getAdmins(): Promise<User[]> {
    return this.userRepo.find({ role: UserRole.ADMIN });
  }

  async updateUserLoggedIn(
    userID: string,
    token: string,
    userAgent: string,
  ): Promise<boolean> {
    try {
      this.userRepo.query(
        `UPDATE public.user SET "loggedToken" = '${token}', "loggedDevice" = '${userAgent}' where id::text = '${userID}' `,
      );

      return true;
    } catch (err) {
      return false;
    }
  }

  async logoutUser(id: string): Promise<string> {
    return this.userRepo
      .query(
        `UPDATE public.user SET "loggedToken" = null, "loggedDevice" = null, "deviceID" = null where id::text = '${id}'`,
      )
      .then(() => {
        return 'Successfully logged out device';
      })
      .catch(err => {
        return err;
      });
  }

  async disableDriver(id: string): Promise<any> {
    return this.userRepo.query(
      `
      UPDATE
        public.user
      SET
        "isActive" = false, "isDisable" = true
      WHERE
        id = $1;
    `,
      [id],
    );
  }
}
