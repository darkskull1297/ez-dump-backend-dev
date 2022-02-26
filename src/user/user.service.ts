/* eslint-disable array-callback-return */
/* eslint-disable no-console */
import { Injectable } from '@nestjs/common';
import _ from 'lodash';
import Stripe from 'stripe';
import { differenceInCalendarDays, differenceInSeconds } from 'date-fns';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import bcrypt from 'bcrypt';
import moment from 'moment';
import { InjectEventEmitter } from 'nest-emitter';
import { Owner } from './owner.model';
import { Driver } from './driver.model';
import { UserRepo } from './user.repository';
import { User, UserRole } from './user.model';
import { S3Service } from '../s3/s3.service';
import { StripeAccountsService } from '../stripe/stripe-accounts.service';
import { OwnerCompany } from '../company/owner-company.model';
import { EmailService } from '../email/email.service';
import { Contractor } from './contractor.model';
import { ContractorCompany } from '../company/contractor-company.model';
import { TimeEntryRepo } from '../timer/time-entry.repository';
import { TimeEntry } from '../timer/time-entry.model';
import { DriverStatus } from './driver-status';
import { DriverRepo } from './driver.repository';
import { ScheduledJobRepo } from '../jobs/scheduled-job.repository';
import { Dispatcher } from './dispatcher.model';
import { Foreman } from './foreman.model';
import { OwnerPriority } from './owner-priority';
import { TruckService } from '../trucks/truck.service';
import { JobsService } from '../jobs/jobs.service';
import { ReviewsService } from '../reviews/reviews.service';
import { JobAssignation } from '../jobs/job-assignation.model';
import { OwnerRepo } from './owner.repository';
import { StripeBankAccountDTO } from '../stripe/dto/stripe-bank-account.dto';
import { StripeBankAccountService } from '../stripe/stripe-bank-account.service';
import { OwnerCompanyRepo } from '../company/owner-company.repository';
import { NotificationService } from '../notification/notification.service';
import { NotificationEventEmitter } from '../notification/notification.events';
import {
  OwnerAsseguranza,
  AdminAsseguranza,
} from '../notification/notifications/notifications';
import { JobRepo } from '../jobs/job.repository';
import { ContractorRepo } from './contractor.repository';

import { AlreadyExistsException } from '../common/exceptions/already-exists.exception';
import { PhoneNumberInUseException } from '../auth/exceptions/phone-number-in-use.exception';
import { DocumentNotFoundException } from '../common/exceptions/document-not-found.exception';
import { DriverJobAssigException } from './exceptions/driver-job-assig.exception';
import { OwnerActiveUserCredentials } from './exceptions/owner-active-user-credentials.exception';
import { ContractorActiveUserCredentials } from './exceptions/contractor-active-user-credentials.exception';

@Injectable()
export class UserService {
  constructor(
    private userRepo: UserRepo,
    private s3Service: S3Service,
    private stripeAccountsService: StripeAccountsService,
    private stripeBankAccount: StripeBankAccountService,
    private readonly emailService: EmailService,
    private readonly timeEntryRepo: TimeEntryRepo,
    private readonly driverRepo: DriverRepo,
    private readonly scheduledJobRepo: ScheduledJobRepo,
    private readonly truckService: TruckService,
    private readonly jobService: JobsService,
    private readonly reviewsService: ReviewsService,
    private readonly ownerRepo: OwnerRepo,
    private readonly jobRepo: JobRepo,
    private readonly contractorRepo: ContractorRepo,
    private readonly ownerCompanyRepo: OwnerCompanyRepo,
    @InjectEventEmitter()
    private readonly eventEmitter: NotificationEventEmitter,
    private readonly notificationService: NotificationService,
    @InjectRepository(Foreman)
    private readonly foremanRepo: Repository<Foreman>,
  ) {}

  async sendNotificationOnwer(days, type, id, title): Promise<void> {
    const notification = await this.notificationService.createNotification({
      ...OwnerAsseguranza(days, type, title),
      userId: id,
    });

    this.eventEmitter.emit('sendSocketNotification', notification, id);
  }

  async sendNotificationAdmin(owner, days, type, id, title): Promise<void> {
    const notification = await this.notificationService.createNotification({
      ...AdminAsseguranza(owner, days, type, title),
      userId: id,
    });

    this.eventEmitter.emit('sendSocketNotification', notification, id);
  }

  async reviewAssegunranza(): Promise<void> {
    const owners = await this.ownerRepo.getOwnersWithCompany();
    const admin = await this.getAdminsFromDriver();
    const dateNow = moment();

    await Promise.all(
      owners.map(async owner => {
        const company = await this.ownerCompanyRepo.findOwnerCompany(owner.id);

        const generalLiability = new Date(
          company.generalLiabilityInsurance.expirationDate,
        );
        const autoLiability = new Date(
          company.autoLiabilityInsurance.expirationDate,
        );
        const workersCompensations = new Date(
          company.workersCompensationsInsurance.expirationDate,
        );

        const generalDays = dateNow.diff(generalLiability, 'days');
        const autoDays = dateNow.diff(autoLiability, 'days');
        const workersDays = dateNow.diff(workersCompensations, 'days');
        const companyName = company.companyCommon.name;
        const ownerId = owner.id;

        let type = 0; // type 1 vencidas type 2 proxima a vencer

        if (generalDays >= -30) {
          type = generalDays >= 0 ? 1 : 2;
          await this.sendNotificationOnwer(
            generalDays,
            type,
            ownerId,
            'General Liability',
          );
          await Promise.all(
            admin.map(async ({ id }) => {
              await this.sendNotificationAdmin(
                companyName,
                generalDays,
                type,
                id,
                'Auto Liability',
              );
            }),
          );
        }
        if (autoDays >= -30) {
          type = autoDays >= 0 ? 1 : 2;
          await this.sendNotificationOnwer(
            autoDays,
            type,
            ownerId,
            'Auto Liability',
          );
          await Promise.all(
            admin.map(async ({ id }) => {
              await this.sendNotificationAdmin(
                companyName,
                autoDays,
                type,
                id,
                'Auto Liability',
              );
            }),
          );
        }
        if (workersDays >= -30) {
          type = workersDays >= 0 ? 1 : 2;
          await this.sendNotificationOnwer(
            workersDays,
            type,
            ownerId,
            'Workers Compensations',
          );
          await Promise.all(
            admin.map(async ({ id }) => {
              await this.sendNotificationAdmin(
                companyName,
                workersDays,
                type,
                id,
                'Workers Compensations',
              );
            }),
          );
        }
      }),
    );
  }

  getUser(id: string): Promise<User> {
    return this.userRepo.findById(id);
  }

  async getIsUserDisabled(id: string): Promise<boolean> {
    const user = await this.userRepo.findById(id);
    return user.isDisable;
  }

  async getIsUserRestricted(id: string): Promise<boolean> {
    const user = await this.userRepo.findById(id);
    return user.isRestricted;
  }

  async getAssociateUsers(): Promise<
  { contractor: Contractor; owner: Owner }[]
  > {
    const contractors = await this.contractorRepo.getAllWithAssociatedOwner();

    const response = await Promise.all(
      contractors.map(async contractor => {
        const owner = await this.ownerRepo.getOwnerWithCompany(
          contractor.associatedUserId,
        );
        return { contractor, owner: owner[0] };
      }),
    );

    return response;
  }

  async associateUsers(
    contractorId: string,
    ownerId: string,
  ): Promise<boolean> {
    const contractor = await this.contractorRepo.findById(contractorId);
    const owner = await this.userRepo.findById(ownerId);

    if (
      contractor.associatedUserId !== null ||
      owner.associatedUserId !== null
    ) {
      return false;
    }

    contractor.associatedUserId = owner.id;
    owner.associatedUserId = contractor.id;

    await this.userRepo.save(owner);
    await this.contractorRepo.save(contractor);

    return true;
  }

  async removeAssociateUsers(
    contractorId: string,
    ownerId: string,
  ): Promise<boolean> {
    const contractor = await this.contractorRepo.findById(contractorId);
    const owner = await this.userRepo.findById(ownerId);

    contractor.associatedUserId = null;
    owner.associatedUserId = null;

    await this.userRepo.save(owner);
    await this.contractorRepo.save(contractor);

    return true;
  }

  async updateUser(
    id: string,
    update: Partial<
    Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'role'> & {
      deviceID: string;
    }
    >,
    deviceID?: string,
  ): Promise<User> {
    const { email, phoneNumber } = update;
    const updatingUser = await this.userRepo.findById(id);
    try {
      if (email) {
        const existingUser = await this.userRepo.findOne({
          email,
          isDisable: false,
        });
        if (
          updatingUser.role === UserRole.CONTRACTOR &&
          existingUser.id !== id
        ) {
          throw new AlreadyExistsException('User', 'email', email);
        }
      }
    } catch (e) {
      if (!(e instanceof DocumentNotFoundException)) {
        throw e;
      }
    }
    try {
      if (email) {
        const existingUser = await this.userRepo.findOne({
          email,
          role: updatingUser.role,
          isDisable: false,
        });
        if (
          updatingUser.role !== UserRole.CONTRACTOR &&
          existingUser.id !== id
        ) {
          throw new AlreadyExistsException('User', 'email', email);
        }
      }
    } catch (e) {
      if (!(e instanceof DocumentNotFoundException)) {
        throw e;
      }
    }
    try {
      const existingUser = await this.userRepo.findOne({
        phoneNumber,
        role: updatingUser.role,
        isDisable: false,
      });
      if (!existingUser.isDisable && existingUser.id !== id) {
        throw new PhoneNumberInUseException();
      }
    } catch (e) {
      if (!(e instanceof DocumentNotFoundException)) {
        throw e;
      }
    }

    const userToUpdate = (await this.userRepo.findById(id)) as
      | Driver
      | Owner
      | Contractor;

    const hashedPass = update.password
      ? await bcrypt.hash(update.password, 12)
      : null;

    if (update.password && userToUpdate.role === UserRole.DRIVER) {
      this.eventEmitter.emit('sendTextMessage', {
        body: `Dear driver ${userToUpdate.name}, a new temporaly password has been created for you. Now you can login using the following credentials: \n Email: ${userToUpdate.email}, Temporaly password: ${update.password}`,
        to: userToUpdate.phoneNumber,
      });

      this.emailService.sendNewPasswordEmail(
        userToUpdate.email,
        userToUpdate.name,
        update.password,
      );
    }

    const updatedUser = hashedPass
      ? { ...update, password: hashedPass }
      : { ...update, password: userToUpdate.password };
    if (deviceID) {
      updatedUser.deviceID = deviceID;
    }

    const keys = Object.keys(updatedUser);
    keys.map(x => {
      userToUpdate[x] = updatedUser[x];
    });

    return this.userRepo.save(userToUpdate);
  }

  async updateUserForeman(
    id: string,
    update: Partial<
    Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'role' | 'password'> & {
      deviceID: string;
    }
    >,
  ): Promise<User> {
    const { phoneNumber } = update;
    try {
      const updatedUser = await this.userRepo.findById(id);
      const existingUser = await this.userRepo.findOne({
        phoneNumber,
        role: updatedUser.role,
        isDisable: false,
      });
      if (existingUser.id !== id) {
        throw new PhoneNumberInUseException();
      }
    } catch (e) {
      if (!(e instanceof DocumentNotFoundException)) {
        throw e;
      }
    }

    return this.userRepo.update(id, update);
  }

  async updateUserDispatcher(
    id: string,
    update: Partial<
    Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'role' | 'password'> & {
      deviceID: string;
    }
    >,
  ): Promise<User> {
    return this.userRepo.update(id, update);
  }

  async updateDisptacher(
    id: string,
    update: Partial<
    Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'role' | 'password'>
    >,
  ): Promise<User> {
    const { phoneNumber } = update;
    try {
      const updatedUser = await this.userRepo.findById(id);
      const existingUser = await this.userRepo.findOne({
        phoneNumber,
        role: updatedUser.role,
        isDisable: false,
      });
      if (existingUser.id !== id) {
        throw new PhoneNumberInUseException();
      }
    } catch (e) {
      if (!(e instanceof DocumentNotFoundException)) {
        throw e;
      }
    }

    return this.userRepo.update(id, update);
  }

  async updateAccount(
    id: string,
    update: Partial<
    Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'role' | 'password'>
    >,
  ): Promise<User> {
    const { phoneNumber } = update;
    try {
      const updatedUser = await this.userRepo.findById(id);
      const existingUser = await this.userRepo.findOne({
        phoneNumber,
        role: updatedUser.role,
        isDisable: false,
      });
      if (existingUser.id !== id) {
        throw new PhoneNumberInUseException();
      } else {
        return this.userRepo.save({ ...updatedUser, ...update });
      }
    } catch (e) {
      if (!(e instanceof DocumentNotFoundException)) {
        throw e;
      }
    }
    return undefined;
  }

  async removeUser(id: string): Promise<boolean> {
    const user = await this.userRepo.remove(id);
    return !!user;
  }

  async getOwnerStripeAccountLink(id: string): Promise<string> {
    const owner = (await this.userRepo.findById(id)) as Owner;
    return this.stripeAccountsService.createAccountLink(owner.stripeAccountId);
  }

  async getContractorBankAccounts(id: string): Promise<Stripe.BankAccount[]> {
    const contractor = (await this.userRepo.findById(id)) as Contractor;
    if (!contractor.stripeCustomerId) {
      return [];
    }
    return this.stripeBankAccount.listBankAccountCustomer(
      contractor.stripeCustomerId,
    );
  }

  async createContractorBankAccountToken(
    id: string,
    bank: StripeBankAccountDTO,
  ): Promise<void> {
    const contractor = (await this.userRepo.findById(id)) as Contractor;
    const { customerId } = await this.stripeBankAccount.createBankAccountToken(
      bank,
      contractor.stripeCustomerId,
      contractor,
    );
    if (!contractor.stripeCustomerId) {
      await this.userRepo.update(contractor.id, {
        stripeCustomerId: customerId,
      });
    }
  }

  async verifyContractorBankAccount(
    contractorId: string,
    bankAccountId: string,
    amounts: [number, number],
  ): Promise<void> {
    const contractor = (await this.userRepo.findById(
      contractorId,
    )) as Contractor;
    await this.stripeBankAccount.verifyBankAccount(
      contractor.stripeCustomerId,
      bankAccountId,
      amounts,
    );
  }

  async retrieveStripeAccount(
    id: string,
  ): Promise<Stripe.Response<Stripe.Account>> {
    const owner = (await this.userRepo.findById(id)) as Owner;
    const stripeAccount = await this.stripeAccountsService.stripeAccountCompleted(
      owner.stripeAccountId,
    );
    return stripeAccount;
  }

  async checkStripeAccount(id: string): Promise<boolean> {
    const owner = (await this.userRepo.findById(id)) as Owner;
    const stripeAccount = await this.stripeAccountsService.stripeAccountCompleted(
      owner.stripeAccountId,
    );
    if (stripeAccount.details_submitted) {
      owner.completedStripeAccount = true;
      await this.userRepo.save(owner);
    }
    return stripeAccount.details_submitted;
  }

  async getOwnerDrivers(user: User, { skip, count }): Promise<Driver[]> {
    const drivers = (await this.userRepo.findOwnerDrivers(user, {
      skip,
      count,
    })) as Driver[];
    const activeTimeEntries = await this.timeEntryRepo.findOwnerActive(user);
    const activeDrivers = await this.driverRepo.getActiveDrivers(user);
    return Promise.all(
      drivers.map(async driver => {
        return {
          ...driver,
          status: await this.getDriverStatus(
            user,
            driver,
            activeDrivers,
            activeTimeEntries,
          ),
        } as Driver;
      }),
    );
  }

  private async getDriverStatus(
    owner: User,
    driver: Driver,
    activeDrivers: Driver[],
    activeTimeEntries: TimeEntry[],
  ): Promise<DriverStatus> {
    if (driver.isRestricted) return DriverStatus.IS_RESTRICTED;
    if (driver.isDisable) return DriverStatus.IS_DISABLE;
    if (!driver.isActive) return DriverStatus.INACTIVE;
    if (this.hasDriverActiveTimeEntry(driver, activeTimeEntries))
      return DriverStatus.CLOCKED_IN;
    if (this.isDriverActive(driver, activeDrivers)) return DriverStatus.BREAK;
    const hasNextSchedule = await this.hasNextScheduleJob(driver);
    if (hasNextSchedule) return DriverStatus.NOT_CLOCKED_IN;
    return DriverStatus.ACTIVE;
  }

  private isDriverActive(driver: Driver, activeDrivers: Driver[]): boolean {
    return !!activeDrivers.find(active => active.id === driver.id);
  }

  private async hasNextScheduleJob(user: User): Promise<boolean> {
    const schedule = await this.scheduledJobRepo.findNextScheduledJob(user);
    return !!schedule;
  }

  private hasDriverActiveTimeEntry(
    driver: Driver,
    activeTimeEntries: TimeEntry[],
  ): boolean {
    return !!activeTimeEntries.find(active => active.user.id === driver.id);
  }

  getContractorDispatchers(user: User, { skip, count }): Promise<Dispatcher[]> {
    return this.userRepo.findContractorDispatchers(user as Contractor, {
      skip,
      count,
    });
  }

  getContractorDispatchersFromDriver(
    contractorId: string,
  ): Promise<Dispatcher[]> {
    return this.userRepo.findContractorDispatchersFromDriver(contractorId);
  }

  getAdminsFromDriver(): Promise<User[]> {
    return this.userRepo.findAdminsFromDriver();
  }

  getContractorForemans(user: User, { skip, count }): Promise<Foreman[]> {
    return this.userRepo.findContractorForemans(user as Contractor, {
      skip,
      count,
    });
  }

  getContractorForemansFromDriver(contractorId: string): Promise<Foreman[]> {
    return this.userRepo.findContractorForemansFromDriver(contractorId);
  }

  getAll(query: Record<string, any>, { skip, count }): Promise<User[]> {
    return this.userRepo.find(query, skip, count);
  }

  getAllDrivers(): Promise<User[]> {
    return this.userRepo.find({ role: UserRole.DRIVER });
  }

  getUpdateProfileImageLink(id: string): Promise<string> {
    return this.s3Service.getUploadProfileImageUrl(id);
  }

  getUpdateSignutareDriverImageLink(id: string): Promise<string> {
    return this.s3Service.getUploadSignatureDriverImageUrl(id);
  }

  getUserCompanyDetails(user: Owner): Promise<OwnerCompany> {
    return this.userRepo.getOwnerCompany(user);
  }

  async getOwnerFromDriver(driverId: string): Promise<Owner> {
    const driver = await this.driverRepo.findById(driverId);
    const owner = await driver.drivingFor.owner;
    const ownerWithCompany = await this.ownerRepo.getOwnerWithCompany(owner.id);
    return ownerWithCompany;
  }

  async getContractorFromDriver(jobId: string): Promise<Contractor> {
    const job = await this.jobRepo.findById(jobId);
    const contractor = await this.contractorRepo.findById(job.user.id);
    return contractor;
  }

  async updateUserCompany(user: Owner, update): Promise<OwnerCompany> {
    const company = await this.userRepo.getOwnerCompany(user);
    return this.userRepo.updateUserCompany(company, update);
  }

  async updateContractorCompany(
    user: Contractor,
    update,
  ): Promise<ContractorCompany> {
    const company = await this.userRepo.getContractorCompany(user);
    return this.userRepo.updateContractorCompany(company, update);
  }

  async getMessagesWithUsers(messages: any): Promise<any> {
    // const company = await this.userRepo.getContractorCompany(user);
    const response = await Promise.all(
      messages.map(async message => {
        const user = await this.userRepo.findById(message.user);
        const to = await this.userRepo.findById(message.to);
        const driver = await this.userRepo.findById(message.driver);
        const from = await this.userRepo.findById(message.from);

        return {
          ...message,
          user,
          to,
          driver,
          from,
        };
      }),
    );

    const orderChats = {};

    response.forEach((message: any) => {
      if (message.from.role === 'DRIVER') {
        if (!orderChats[message.to.role]) {
          orderChats[message.to.role] = [];
        }

        orderChats[message.to.role].push(message);
      } else {
        if (!orderChats[message.from.role]) {
          orderChats[message.from.role] = [];
        }

        orderChats[message.from.role].push(message);
      }
    });

    return orderChats;
  }

  getContractorCompanyDetails(user: Contractor): Promise<ContractorCompany> {
    return this.userRepo.getContractorCompany(user);
  }

  getAllOwners(): Promise<any> {
    return this.userRepo.findAllOwnersWithCompany();
  }

  getAllOwnersForAdmin(): Promise<any> {
    return this.userRepo.findAllOwnersWithCompanyForAdmin();
  }

  getAllContractors(): Promise<User[]> {
    return this.userRepo.find({ role: UserRole.CONTRACTOR });
  }

  getAllDispatchers(): Promise<User[]> {
    return this.userRepo.find({ role: UserRole.DISPATCHER });
  }

  async getAllDriversWithCompany(): Promise<Driver[]> {
    const drivers = await this.userRepo.findAllDriversWithCompany();
    return Promise.all(
      drivers.map(async driver => {
        const owner = await driver.drivingFor.owner;
        const activeTimeEntries = await this.timeEntryRepo.findOwnerActive(
          owner,
        );
        const activeDrivers = await this.driverRepo.getActiveDrivers(owner);
        return {
          ...driver,
          status: await this.getDriverStatus(
            owner,
            driver,
            activeDrivers,
            activeTimeEntries,
          ),
        } as Driver;
      }),
    );
  }

  async countActiveOwnerDrivers(user: User): Promise<number> {
    return this.userRepo.countOwnerDrivers(user, true);
  }

  async countInactiveOwnerDrivers(user: User): Promise<number> {
    return this.userRepo.countOwnerDrivers(user, false);
  }

  async verifyOwner(id: string): Promise<void> {
    await this.userRepo.verifyOwner(id);
  }

  async unVerifyOwner(id: string): Promise<void> {
    await this.userRepo.unVerifyOwner(id);
  }

  async verifyContractor(id: string): Promise<void> {
    const contractor = await this.userRepo.findById(id);
    await this.userRepo.verifyContractor(id);
    this.emailService.sendContractorAcceptedByAdminEmail(
      contractor.name,
      contractor.email,
    );
  }

  async unVerifyContractor(id: string): Promise<void> {
    await this.userRepo.unVerifyContractor(id);
  }

  async updateDriver(
    id: string,
    update: Partial<
    Omit<User, 'id' | 'createdAt' | 'updatedAt' | 'role' | 'password'> & {
      deviceID: string;
    }
    >,
  ): Promise<User> {
    const { email, phoneNumber } = update;
    const updatedUser = await this.userRepo.findById(id);
    try {
      if (email) {
        const existingUser = await this.userRepo.findOne({
          email,
          role: updatedUser.role,
          isDisable: false,
        });
        if (existingUser.id !== id) {
          throw new AlreadyExistsException('User', 'email', email);
        }
      }
    } catch (e) {
      if (!(e instanceof DocumentNotFoundException)) {
        throw e;
      }
    }
    try {
      const existingUser = await this.userRepo.findOne({
        phoneNumber,
        role: updatedUser.role,
        isDisable: false,
      });
      if (existingUser.id !== id) {
        throw new PhoneNumberInUseException();
      }
    } catch (e) {
      if (!(e instanceof DocumentNotFoundException)) {
        throw e;
      }
    }

    const keys = Object.keys(update);
    keys.map(x => {
      updatedUser[x] = update[x];
    });
    return this.userRepo.save(updatedUser);
  }

  async disableDriver(id: string): Promise<any> {
    const foundDriver = await this.userRepo.findById(id);
    const activeJob = await this.scheduledJobRepo.findActiveOrScheduledJobByDriverOnly(
      foundDriver,
    );
    if (activeJob) {
      throw new DriverJobAssigException();
    }

    return this.userRepo.disableDriver(id);
  }

  async getDriver(id: string, user: User): Promise<Driver> {
    const driver = (await this.userRepo.findDriverById(id)) as Driver;

    const activeTimeEntries = await this.timeEntryRepo.findOwnerActive(user);
    const activeDrivers = await this.driverRepo.getActiveDrivers(user);

    driver.status = await this.getDriverStatus(
      user,
      driver,
      activeDrivers,
      activeTimeEntries,
    );

    return driver;
  }

  async changeOwnerPriority(
    id: string,
    priority: OwnerPriority,
  ): Promise<Owner> {
    return this.userRepo.changeOwnerPriority(id, priority);
  }

  // async changeOwnerDiscount(id: string): Promise<Owner> {
  //   return (id);
  // }

  // async changeContractorDiscount(id: string): Promise<Contractor> {
  //   return this.userRepo.changeContractorDiscount(id);
  // }

  async updateOwnersPriority(): Promise<void> {
    const owners = await this.ownerRepo.getOwnersWithPriorityNotMaximum();
    owners.forEach(async owner => {
      if (differenceInCalendarDays(new Date(), owner.createdAt) <= 15) {
        owner.priority = OwnerPriority.HIGH;
        await this.userRepo.save(owner);
      } else {
        const trucks = await this.truckService.getOwnerActiveTrucks(owner);
        if (trucks.length === 0) {
          owner.priority = OwnerPriority.LOW;
          await this.userRepo.save(owner);
        } else {
          let totalHoursLastWeek = 0;
          let totalHoursTwoWeeksAgo = 0;
          let sumAvgAllTrucks = 0;
          trucks.forEach(async truck => {
            const truckReviews = await this.reviewsService.getTruckReviews(
              truck,
            );
            let avg = 0;
            if (truckReviews.length > 0) {
              avg = _.sumBy(truckReviews, 'stars') / truckReviews.length;
            }
            sumAvgAllTrucks += avg;
            const [
              lastWeekAssignations,
              twoWeeksAgoAssignations,
            ] = await Promise.all([
              this.jobService.getLastWeekJobsForTruck(truck),
              this.jobService.getTwoWeeksAgoJosForTruck(truck),
            ]);
            const hoursLastWeek = this.getTotalHours(lastWeekAssignations);
            const hoursTwoWeeksAgo = this.getTotalHours(
              twoWeeksAgoAssignations,
            );

            totalHoursLastWeek += hoursLastWeek;
            totalHoursTwoWeeksAgo += hoursTwoWeeksAgo;
          });
          const ownerStars = sumAvgAllTrucks / trucks.length;
          const ownerTotalHoursLastWeek = totalHoursLastWeek / trucks.length;
          const ownerTotalHoursTwoWeeksAgo =
            totalHoursTwoWeeksAgo / trucks.length;
          const betterHours = Math.max(
            ownerTotalHoursLastWeek,
            ownerTotalHoursTwoWeeksAgo,
          );
          await this.setOwnerPriority(owner, ownerStars, betterHours);
        }
      }
    });
  }

  private getTotalHours(assignations: JobAssignation[]): number {
    let totalHours = 0;
    assignations.forEach(assignation => {
      const seconds = differenceInSeconds(
        assignation.finishedAt,
        assignation.startedAt,
      );
      const hours = seconds / 3600;
      totalHours += hours;
    });
    return totalHours;
  }

  private async setOwnerPriority(
    owner: Owner,
    ownerStars: number,
    totalHours: number,
  ): Promise<void> {
    if (ownerStars >= 4 && totalHours >= 30) {
      owner.priority = OwnerPriority.HIGH;
    } else {
      if (ownerStars >= 2 && totalHours >= 20) {
        owner.priority = OwnerPriority.MEDIUM;
      }
      owner.priority = OwnerPriority.LOW;
    }
    await this.userRepo.save(owner);
  }

  public async logoutUser(id: string): Promise<string> {
    return this.userRepo.logoutUser(id);
  }

  generatePassword() {
    const length = 8;
    const charset =
      'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let retVal = '';
    // eslint-disable-next-line no-plusplus
    for (let i = 0, n = charset.length; i < length; i++) {
      retVal += charset.charAt(Math.floor(Math.random() * n));
    }
    return retVal;
  }

  public async isDisableOwner(
    id: string,
    isDisable: boolean,
    user: User,
  ): Promise<string> {
    try {
      const owner = await this.userRepo.findById(id);
      const drivers = await this.userRepo.findDrivers(id);

      if (!isDisable) {
        const hasActiveEmailUser = await this.userRepo.findActiveUser(
          owner.id,
          owner.email,
        );
        const hasActivePhoneNumberUser = await this.userRepo.findActiveUser(
          owner.id,
          owner.phoneNumber,
        );

        if (hasActiveEmailUser?.role === owner.role && !hasActiveEmailUser?.isDisable
          || hasActivePhoneNumberUser?.role === owner.role && !hasActiveEmailUser?.isDisable) {
          throw new OwnerActiveUserCredentials();
        }
      }

      owner.isDisable = isDisable;
      if (isDisable) {
        this.unVerifyOwner(owner.id);
        owner.password = this.generatePassword();
      }
      await this.userRepo.save(owner);

      await Promise.all(
        drivers.map(async item => {
          if (isDisable) {
            const scheduledJob = await this.scheduledJobRepo.findActiveOrScheduledJobByDriverOnly(
              item,
            );

            if (scheduledJob) {
              const { assignations } = scheduledJob;
              let scheduledJobHasStarted = false;
              if (scheduledJob.isStarted()) scheduledJobHasStarted = true;

              assignations.forEach(async assignation => {
                if (!scheduledJobHasStarted && item.id === assignation.driver.id) {
                  assignation.category.isScheduled = false;
                  assignation.category.assignation = null;
                  await this.scheduledJobRepo.save(scheduledJob);
                } else if (scheduledJobHasStarted && item.id === assignation.driver.id
                  && !assignation.startedAt) {
                  assignation.category.isScheduled = false;
                  assignation.category.assignation = null;
                  assignation.scheduledJob = null;
                  assignation.finishedAt = new Date();
                  await this.scheduledJobRepo.save(scheduledJob);
                } else if (scheduledJobHasStarted && item.id === assignation.driver.id
                  && assignation.startedAt) {
                  await this.jobService.cancelTruckScheduleJob(
                    scheduledJob.job.id,
                    assignation.truck.id,
                    user,
                  );
                }
              });
            }
          }

          if (!isDisable) {
            const hasActiveEmailUser = await this.userRepo.findActiveUser(
              item.id,
              item.email,
            );
            const hasActivePhoneNumberUser = await this.userRepo.findActiveUser(
              item.id,
              item.phoneNumber,
            );
  
            if (hasActiveEmailUser?.role === item.role && !hasActiveEmailUser?.isDisable
              || hasActivePhoneNumberUser?.role === item.role && !hasActiveEmailUser?.isDisable) {
              return;
            }
          }

          item.isDisable = isDisable;
          if (isDisable) item.password = this.generatePassword();
          return await this.userRepo.save(item);
        }),
      );

      return 'Success';
    } catch (err) {
      throw err;
    }
  }

  public async isRestrictOwner(
    id: string,
    isRestricted: boolean,
    user: User,
  ): Promise<string> {
    try {
      const owner = await this.userRepo.findById(id);
      const drivers = await this.userRepo.findDrivers(id);
      const restrictedDate = new Date();
      owner.isRestricted = isRestricted;
      owner.restrictedAt = isRestricted ? restrictedDate : null;
      await this.userRepo.save(owner);

      await Promise.all(
        drivers.map(async item => {
          item.isRestricted = isRestricted;
          item.restrictedAt = isRestricted ? restrictedDate : null;

          if (isRestricted) {
            const scheduledJob = await this.scheduledJobRepo.findActiveOrScheduledJobByDriverOnly(
              item,
            );

            if (scheduledJob) {
              const { assignations } = scheduledJob;
              let scheduledJobHasStarted = false;
              if (scheduledJob.isStarted()) scheduledJobHasStarted = true;

              assignations.forEach(async assignation => {
                if (!scheduledJobHasStarted && item.id === assignation.driver.id) {
                  assignation.category.isScheduled = false;
                  assignation.category.assignation = null;
                  await this.scheduledJobRepo.save(scheduledJob);
                } else if (scheduledJobHasStarted && item.id === assignation.driver.id
                  && !assignation.startedAt) {
                  assignation.category.isScheduled = false;
                  assignation.category.assignation = null;
                  assignation.scheduledJob = null;
                  assignation.finishedAt = new Date();
                  await this.scheduledJobRepo.save(scheduledJob);
                } else if (scheduledJobHasStarted && item.id === assignation.driver.id
                  && assignation.startedAt) {
                  await this.jobService.cancelTruckScheduleJob(
                    scheduledJob.job.id,
                    assignation.truck.id,
                    user,
                  );
                }
              });
            }
          }

          return this.userRepo.save(item);
        }),
      );

      return 'Success';
    } catch (err) {
      console.log('err', err);
      return 'error';
    }
  }

  public async isDisableContractor(
    id: string,
    isDisable: boolean,
  ): Promise<string> {
    try {
      const contractor = await this.userRepo.findById(id);
      const foremans = await this.userRepo.contractorForemans(contractor);
      const dispatchers = await this.userRepo.findDispatchers(contractor);

      if (!isDisable) {
        const hasActiveEmailUser = await this.userRepo.findActiveUser(
          contractor.id,
          contractor.email,
        );
        const hasActivePhoneNumberUser = await this.userRepo.findActiveUser(
          contractor.id,
          contractor.phoneNumber,
        );

        if (hasActiveEmailUser?.role === contractor.role && !hasActiveEmailUser?.isDisable
          || hasActivePhoneNumberUser?.role === contractor.role && !hasActiveEmailUser?.isDisable) {
          throw new ContractorActiveUserCredentials();
        }
      }

      contractor.isDisable = isDisable;
      if (isDisable) {
        this.unVerifyContractor(contractor.id);
        contractor.password = this.generatePassword();
      }
      await this.userRepo.save(contractor);

      await Promise.all(
        foremans.map(async item => {
          if (!isDisable) {
            const hasActiveEmailUser = await this.userRepo.findActiveUser(
              item.id,
              item.email,
            );
            const hasActivePhoneNumberUser = await this.userRepo.findActiveUser(
              item.id,
              item.phoneNumber,
            );

            if (hasActiveEmailUser?.role === item.role && !hasActiveEmailUser?.isDisable
              || hasActivePhoneNumberUser?.role === item.role && !hasActiveEmailUser?.isDisable) {
              return;
            }
          }
          
          item.isDisable = isDisable;
          if (isDisable) item.password = this.generatePassword();
          return this.userRepo.save(item);
        }),
      );
      await Promise.all(
        dispatchers.map(async item => {
          if (!isDisable) {
            const hasActiveEmailUser = await this.userRepo.findActiveUser(
              item.id,
              item.email,
            );
            const hasActivePhoneNumberUser = await this.userRepo.findActiveUser(
              item.id,
              item.phoneNumber,
            );

            if (hasActiveEmailUser?.role === item.role && !hasActiveEmailUser?.isDisable
              || hasActivePhoneNumberUser?.role === item.role && !hasActiveEmailUser?.isDisable) {
              return;
            }
          }

          item.isDisable = isDisable;
          if (isDisable) item.password = this.generatePassword();
          return this.userRepo.save(item);
        }),
      );

      return 'Success';
    } catch (err) {
      throw err;
    }
  }

  public async isRestrictContractor(
    id: string,
    isRestricted: boolean,
  ): Promise<string> {
    try {
      const contractor = await this.userRepo.findById(id);
      const foremans = await this.userRepo.contractorForemans(contractor);
      const dispatchers = await this.userRepo.findDispatchers(contractor);
      const restrictedDate = new Date();
      contractor.isRestricted = isRestricted;
      contractor.restrictedAt = isRestricted ? restrictedDate : null;
      this.userRepo.save(contractor);

      await Promise.all(
        foremans.map(item => {
          item.isRestricted = isRestricted;
          item.restrictedAt = isRestricted ? restrictedDate : null;
          return this.userRepo.save(item);
        }),
      );
      await Promise.all(
        dispatchers.map(item => {
          item.isRestricted = isRestricted;
          item.restrictedAt = isRestricted ? restrictedDate : null;
          return this.userRepo.save(item);
        }),
      );

      return 'Success';
    } catch (err) {
      console.log('err', err);
      return 'error';
    }
  }

  async getAllForemans(): Promise<any[]> {
    return this.foremanRepo
      .createQueryBuilder('foreman')
      .leftJoinAndSelect('foreman.contractorCompany', 'contractorCompany')
      .leftJoinAndSelect('contractorCompany.contractor', 'contractor')
      .getMany();
  }

  async getContractorByDispatcher(user: User): Promise<Contractor> {
    const contractor = await this.userRepo.findContractorByDispatcher(user);
    return contractor;
  }

  async getContractorByForeman(user: User): Promise<Contractor> {
    const contractor = await this.userRepo.findContractorByForeman(user);
    return contractor;
  }

  async getAllActiveDrivers(): Promise<Driver[]> {
    return this.driverRepo.getAllActiveDriversForMessaging();
  }

  async getAllDriversForContractorCompany(user: User): Promise<Driver[]> {
    let drivers = [];
    if (user.role === UserRole.CONTRACTOR) {
      drivers = await this.driverRepo.getAllDriversForContractorCompany(user);
    } else if (user.role === UserRole.FOREMAN) {
      const contractor = await this.userRepo.findContractorByForeman(user);
      drivers = await this.driverRepo.getAllDriversForContractorCompany(
        contractor,
      );
    } else if (user.role === UserRole.DISPATCHER) {
      const contractor = await this.userRepo.findContractorByDispatcher(user);
      drivers = await this.driverRepo.getAllDriversForContractorCompany(
        contractor,
      );
    }

    return drivers;
  }

  async getAllActiveDriversForOwnerCompany(user: User): Promise<Driver[]> {
    const ownerCompany = await this.ownerCompanyRepo.findOwnerCompany(user.id);

    return this.driverRepo.getAllDriversForOwner(ownerCompany);
  }

  async getDriverInfoForOfflineProfile(email: string): Promise<User> {
    const user = await this.userRepo.findOne({ email });

    return user;
  }
}
