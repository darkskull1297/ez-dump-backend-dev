/* eslint-disable prefer-destructuring */
/* eslint-disable no-unused-expressions */
/* eslint-disable guard-for-in */
import { forwardRef, Inject, Injectable } from '@nestjs/common';
import {
  addDays,
  compareAsc,
  isAfter,
  subDays,
  format,
  differenceInMinutes,
  getWeeksInMonth,
} from 'date-fns';

import puppeteer from 'puppeteer';

import { InjectEventEmitter } from 'nest-emitter';
import _ from 'lodash';
import moment from 'moment';
import xlsx from 'xlsx';
import path from 'path';
import {
  JobFulfilledContractor,
  NewJobAvailable,
  NewJobFromAreaOwner,
  NewPreferredTruckAssigned,
  CancelActiveJob,
  JobFulfilledDispatcher,
  JobFulfilledForeman,
  JobNeverStartedOwner,
  NotClockIn,
  EditScheduleDriver,
  RemovedJobAssignationOwner,
  RemovedJobAssignationDriver,
  RequestedTruck,
  JobHoldedDriver,
  JobHoldedOwner,
  JobResumedDriver,
  JobResumedOwner,
  CanceledPreferredTruck,
} from '../notification/notifications/notifications';
import { UserRole, User } from '../user/user.model';
import { NotificationEventEmitter } from '../notification/notification.events';
import { Job } from './job.model';
import { JobRepo } from './job.repository';
import { ScheduledJob } from './scheduled-job.model';
import { UserRepo } from '../user/user.repository';
import { TruckRepo } from '../trucks/truck.repository';
import { JobScheduledException } from './exceptions/job-scheduled.exception';
import { UserScheduledException } from './exceptions/user-scheduled.exception';
import { ScheduledJobRepo } from './scheduled-job.repository';
import { TruckScheduledException } from './exceptions/truck-scheduled.exception';
import { UnverifiedOwnerException } from './exceptions/unverified-owner.exception';
import { DocumentNotFoundException } from '../common/exceptions/document-not-found.exception';
import { TruckCategory } from '../trucks/truck-category.model';
import { JobAssignation } from './job-assignation.model';
import { Truck } from '../trucks/truck.model';
import { TrucksUnassignableException } from './exceptions/trucks-unassignable.exception';
import { getKeyMap } from '../util/list-utils';
import { NoAssignationsException } from './exceptions/no-assignations.exception';
import { JobStatus } from './job-status';
import { Owner } from '../user/owner.model';
import { Driver } from '../user/driver.model';
import { InactiveTruckException } from './exceptions/inactive-truck.exception';
import { LocationService } from '../location/location.service';
import { Location } from '../location/location.model';
import { NoFinishedAssignationsException } from './exceptions/no-finished-assignations.exception';
import { JobNotFinishedException } from './exceptions/job-not-finished.exception';
import { DisputeTimePassedException } from './exceptions/dispute-time-passed.exception';
import { NoDisputeRequestedException } from './exceptions/no-dispute-requested.exception';
import { EmailService } from '../email/email.service';
import { Contractor } from '../user/contractor.model';
import { UnverifiedContractorException } from './exceptions/unverified-contractor.exception';
import { ContractorCompany } from '../company/contractor-company.model';
import { JobAssignationRepo } from './job-assignation.repository';
import { DeleteOrClockOutJobAssignationsDTO } from './dto/delete-or-clock-out-job-assignation.dto';
import { JobInvoiceService } from '../invoices/job-invoice.service';
import { TimeEntryRepo } from '../timer/time-entry.repository';
import { TimeEntry } from '../timer/time-entry.model';
import { getRoundedHours } from '../util/date-utils';
import { ReviewTruck } from '../reviews/review-truck.model';
import { ReviewTruckRepo } from '../reviews/review-truck.repository';
import { JobTruckAlreadyReviewedException } from './exceptions/job-truck-already-reviewed';
import { OwnerPriority } from '../user/owner-priority';
import { TimerService } from '../timer/timer.service';
import { JobsTotalContractorDTO } from './dto/jobs-total-contractor.dto';
import { UserService } from '../user/user.service';
import { DriverDTO } from '../user/dto/driver-dto';
import { TruckService } from '../trucks/truck.service';
import { GeneralJobNotExistException } from './exceptions/general-job-not-exist.exception';
import { GeneralJobRepo } from '../general-jobs/general-job.repository';
import { NotificationService } from '../notification/notification.service';
import { RequestTruckDTO } from './dto/request-truck.dto';
import {
  NewJobAsignedDriver,
  NewJobAvailableAdmin,
  NewJobNearAreaOwner,
  PreferredTruckAssigned,
} from '../notification/notifications/messages';
import { SwitchJobDTO } from './dto/switch-job-dto';
import { SwitchStatus, SwitchRequestDTO } from './dto/switch-request-dto';
import { SwitchJobRepo } from '../switch-job/switch-job.repository';
import { GeolocationService } from '../geolocation/geolocation.service';
import { DriverRepo } from '../user/driver.repository';
import { DriverJobInvoiceRepo } from '../invoices/driver-job-invoice.repository';
import { TruckCategoryRepo } from '../trucks/truck-category.repository';
import { GeneralJob } from '../general-jobs/general-job.model';
import { RequestTruckRepo } from './request-truck.repository';
import { RequestTruck } from './request-truck.model';
import { Foreman } from '../user/foreman.model';
import { TruckCategoryDTO } from './dto/truck-category.dto';
import { OwnerCompany } from '../company/owner-company.model';
import { OwnerCompanyRepo } from '../company/owner-company.repository';
import { JobNotificationRepo } from './job-notification.repository';
import { JobStartedException } from './exceptions/job-started.exception';
import { MaterialRepo } from '../general-jobs/material.repository';
import { Material } from '../general-jobs/material.model';
import { JobCommodity } from './job-commodity';
import { Dispatcher } from '../user/dispatcher.model';
import { JobHasActiveTrucksException } from './exceptions/job-has-active-trucks.exception';
import { PaymentMethod } from '../invoices/payment-method';

interface ScheduledJobResources {
  job?: Job;
  trucks: Truck[];
  drivers: Driver[];
}

interface WeeklyWork {
  from: string;
  to: string;
  weekWork: WeekActualWork[];
}

interface WeekActualWork {
  driver: User;
  assignation: JobAssignation;
  workedHours: string;
  amount: number;
  job: Job;
  entries: TimeEntry[];
  comment: string;
  isPaid: boolean;
  ticketId: string;
  ticketNumber?: string;
  travelTime?: string;
  travelTimeSupervisor?: number;
  paidWith: string;
  paidAt: string;
  orderNumber?: string;
  accountNumber?: string;
}
interface TruckWithReview {
  truck: Truck;
  reviewed: boolean;
}

const MAXIMUM_PRIORITY_MINUTES = 0;
const HIGH_PRIORITY_MINUTES = 10;
const MEDIUM_PRIORITY_MINUTES = 25;
const LOW_PRIORITY_MINUTES = 40;

@Injectable()
export class JobsService {
  constructor(
    private readonly jobRepo: JobRepo,
    private readonly requestTruckRepo: RequestTruckRepo,
    private readonly scheduledJobRepo: ScheduledJobRepo,
    private readonly jobAssignationRepo: JobAssignationRepo,
    private readonly userRepo: UserRepo,
    private readonly truckRepo: TruckRepo,
    private readonly locationService: LocationService,
    private readonly driverJobInvoiceRepo: DriverJobInvoiceRepo,
    private readonly ownerCompanyRepo: OwnerCompanyRepo,
    @InjectEventEmitter()
    private readonly eventEmitter: NotificationEventEmitter,
    private readonly emailService: EmailService,
    private readonly invoiceService: JobInvoiceService,
    private readonly notificationService: NotificationService,
    private readonly timeEntryRepo: TimeEntryRepo,
    private readonly reviewTruckRepo: ReviewTruckRepo,
    private readonly timerService: TimerService,
    @Inject(forwardRef(() => UserService))
    private readonly userService: UserService,
    private readonly truckService: TruckService,
    private readonly generalJobRepository: GeneralJobRepo,
    private readonly switchJobRepository: SwitchJobRepo,
    @Inject(forwardRef(() => GeolocationService))
    private readonly geolocationService: GeolocationService,
    private readonly driverRepo: DriverRepo,
    private readonly truckCategoryRepo: TruckCategoryRepo,
    private readonly jobNotificationRepo: JobNotificationRepo,
    private readonly materialRepo: MaterialRepo,
  ) {}

  async printWeekly(url: string, orientation: boolean): Promise<any> {
    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto(url, {
      waitUntil: 'networkidle0',
      timeout: 0,
    });

    const pdf = await page.pdf({
      format: 'a4',
      path: `Weekly.pdf`,
      landscape: orientation,
    });

    await browser.close();
    return pdf;
  }

  async create(
    job: Omit<Job, 'id' | 'createdAt' | 'updatedAt' | 'truckCategories'>,
    truckCategories: Omit<
    TruckCategory,
    'id' | 'createdAt' | 'updatedAt' | 'job'
    >[],
    user: User,
    generalJobId?: string,
    requestedTruckId?: string,
    preferredTrucks?: TruckCategoryDTO[],
  ): Promise<Job> {
    if (!(user as Contractor).verifiedByAdmin)
      throw new UnverifiedContractorException();
    let generalJob: GeneralJob;
    let { name } = job;
    try {
      if (generalJobId) {
        generalJob = await this.generalJobRepository.findOne({
          id: generalJobId,
        });

        name = generalJob.name;
      }
      if (requestedTruckId) {
        const requestedTruck = await this.requestTruckRepo.findById(
          requestedTruckId,
        );
        requestedTruck.status = JobStatus.DONE;
        await this.requestTruckRepo.save(requestedTruck);
      }
    } catch (e) {
      console.error(e);
      throw new GeneralJobNotExistException();
    }

    const exportExcel = (
      data: any,
      workSheetColumnNames: any,
      workSheetName: any,
      filePath: any,
    ): any => {
      const workBook = xlsx.utils.book_new();
      const workSheetData = [workSheetColumnNames, ...data];
      const workSheet = xlsx.utils.aoa_to_sheet(workSheetData);
      xlsx.utils.book_append_sheet(workBook, workSheet, workSheetName);
      xlsx.writeFile(workBook, path.resolve(filePath));
    };

    // const exportUsersToExcel = (
    //   users: any,
    //   workSheetColumnNames: any,
    //   workSheetName: any,
    //   filePath: any,
    // ): void => {
    //   const data = users.map((userData: any) => {
    //     return [userData.id, userData.name, userData.age];
    //   });
    //   exportExcel(data, workSheetColumnNames, workSheetName, filePath);
    // };

    const preferred = await Promise.all(
      preferredTrucks.map(async cat => {
        const category = new TruckCategory();
        const preferredTruck = await this.truckRepo.findById(
          cat.preferredTruck,
        );
        const owner = await preferredTruck.company.owner;

        category.truckTypes = cat.truckTypes;
        category.truckSubtypes = cat.truckSubtypes;
        category.price = cat.price;
        category.preferredTruck = preferredTruck;
        category.partnerRate = cat.partnerRate;
        category.payBy = cat.payBy;
        category.customerRate = cat.customerRate;

        const notification = await this.notificationService.createNotification({
          ...NewPreferredTruckAssigned(preferredTruck.number),
          userId: owner.id,
        });

        this.eventEmitter.emit(
          'sendSocketNotification',
          notification,
          owner.id,
        );

        this.eventEmitter.emit('sendTextMessage', {
          to: owner.phoneNumber,
          ...PreferredTruckAssigned(preferredTruck.number),
        });

        return category;
      }),
    );
    const categories = await Promise.all(
      truckCategories.map(cat => {
        const category = new TruckCategory();
        category.truckTypes = cat.truckTypes;
        category.truckSubtypes = cat.truckSubtypes;
        category.price = cat.price;
        category.customerRate = cat.customerRate;
        category.partnerRate = cat.partnerRate;
        category.payBy = cat.payBy;
        return category;
      }),
    );

    const newJob = await this.jobRepo.create({
      ...job,
      name,
      user,
      generalJob,
      truckCategories: [...categories, ...preferred],
    });

    await this.sendNotificationAndEmailToOwnersInArea(newJob);
    return newJob;
  }

  incomingCategoryExists(arr, catId: string) {
    const found = arr.some(index => index.categoryId === catId);

    if (!found) {
      arr.push({ categoryId: catId });
      return false;
    }

    return true;
  }

  async update(
    job: Partial<Job>,
    truckCategories: Omit<TruckCategory, 'createdAt' | 'updatedAt' | 'job'>[],
    user: User,
    jobId: string,
    generalJobId?: string,
    preferredTrucks?: TruckCategoryDTO[],
  ): Promise<Job> {
    try {
      if (generalJobId) {
        await this.generalJobRepository.findOne({
          id: generalJobId,
        });
      }
    } catch (e) {
      throw new GeneralJobNotExistException();
    }

    if (!jobId) throw new Error('Shift id expected');

    const categoriesIdArray = [];
    const prevJob = await this.jobRepo.findJobById(jobId);

    const categories = await Promise.all(
      truckCategories.map(cat => {
        const category = new TruckCategory();
        if (cat.id && !this.incomingCategoryExists(categoriesIdArray, cat.id))
          category.id = cat.id;
        category.truckTypes = cat.truckTypes;
        category.truckSubtypes = cat.truckSubtypes;
        category.price = cat.price;
        category.partnerRate = cat.partnerRate;
        category.payBy = cat.payBy;
        category.customerRate = cat.customerRate;
        category.isActive = cat.isActive;
        category.isScheduled = cat.isScheduled;
        return category;
      }),
    );

    const filteredCategories = await this.returnJobCategories(
      prevJob,
      false,
      categories,
      false,
    );

    const preferred = await Promise.all(
      preferredTrucks.map(async cat => {
        const category = new TruckCategory();
        const preferredTruck = await this.truckRepo.findById(
          cat.preferredTruck,
        );
        const owner = await preferredTruck.company.owner;

        category.truckTypes = cat.truckTypes;
        category.truckSubtypes = cat.truckSubtypes;
        category.price = cat.price;
        category.preferredTruck = preferredTruck;
        category.partnerRate = cat.partnerRate;
        category.payBy = cat.payBy;
        category.customerRate = cat.customerRate;
        category.isActive = cat.isActive;
        category.isScheduled = cat.isScheduled;

        const notification = await this.notificationService.createNotification({
          ...NewPreferredTruckAssigned(preferredTruck.number),
          userId: owner.id,
        });

        this.eventEmitter.emit(
          'sendSocketNotification',
          notification,
          owner.id,
        );

        this.eventEmitter.emit('sendTextMessage', {
          to: owner.phoneNumber,
          ...PreferredTruckAssigned(preferredTruck.number),
        });

        return category;
      }),
    );

    await this.jobRepo.update(jobId, { ...job });

    const jobUpdated = await this.jobRepo.findOne({ id: jobId });

    jobUpdated.truckCategories = [...filteredCategories, ...preferred];

    await this.jobRepo.save(jobUpdated);

    const jobUpdated2 = await this.jobRepo.findOne({ id: jobId });

    await this.emailService.sendUpdatedShiftEmailNotification();

    return jobUpdated2;
  }

  async updateScheduledJob(
    job: Partial<Job>,
    truckCategories: Omit<TruckCategory, 'createdAt' | 'updatedAt' | 'job'>[],
    user: User,
    jobId: string,
    preferredTrucks?: TruckCategoryDTO[],
    active = false,
  ): Promise<Job> {
    const prevJob = await this.jobRepo.findJobById(jobId);

    let updated = false;
    let updateDriver = false;
    const updatedValues = {};

    if (job.loadSite.address !== prevJob.loadSite.address) {
      updatedValues['Load Site'] = job.loadSite.address;
      updated = true;
      updateDriver = true;
    }

    if (job.dumpSite.address !== prevJob.dumpSite.address) {
      updatedValues['Dump Site'] = job.dumpSite.address;
      updated = true;
      updateDriver = true;
    }

    if (moment(job.startDate).diff(prevJob.startDate, 'm', true) > 1) {
      updatedValues['Start Date'] = moment(job.startDate).format(
        'YYYY-MM-DD hh:mm',
      );
      updated = true;
      updateDriver = true;
    }

    if (moment(job.endDate).diff(prevJob.endDate, 'm', true) > 1) {
      updatedValues['End Date'] = moment(job.endDate).format(
        'YYYY-MM-DD hh:mm',
      );
      updated = true;
      updateDriver = true;
    }

    if (job.onSite !== prevJob.onSite) {
      updatedValues['On Site'] = job.onSite;
      updated = true;
      updateDriver = true;
    }

    if (job.directions !== prevJob.directions) {
      // eslint-disable-next-line dot-notation
      updatedValues['Directions'] = job.directions;
      updated = true;
      updateDriver = true;
    }

    if (moment(job.paymentDue).diff(prevJob.paymentDue, 'm', true) > 1) {
      updatedValues['Payment Due'] = moment(job.paymentDue).format(
        'YYYY-MM-DD hh:mm',
      );
      updated = true;
    }

    console.info('Updated: ', updated);

    const categories = await Promise.all(
      truckCategories.map(cat => {
        const category = new TruckCategory();
        category.truckTypes = cat.truckTypes;
        category.truckSubtypes = cat.truckSubtypes;
        category.price = cat.price;
        category.payBy = cat.payBy;
        category.customerRate = cat.customerRate;
        category.partnerRate = cat.partnerRate;
        category.isActive = cat.isActive;
        category.isScheduled = cat.isScheduled;
        if (cat.id) category.id = cat.id;
        return category;
      }),
    );

    const filteredCategories = await this.returnJobCategories(
      prevJob,
      true,
      categories,
      active,
    );

    if (truckCategories.length > prevJob.truckCategories.length) {
      const ownerId = (await prevJob.scheduledJobs[0].company.owner).id;

      const notification = await this.notificationService.createNotification({
        ...NewJobAvailable(
          prevJob.name,
          (prevJob.user as Contractor).company.companyCommon.name,
        ),
        userId: ownerId,
      });

      this.eventEmitter.emit('sendSocketNotification', notification, ownerId);
    }

    const preferred = await Promise.all(
      preferredTrucks.map(async cat => {
        const category = new TruckCategory();
        const preferredTruck = await this.truckRepo.findById(
          cat.preferredTruck,
        );
        const owner = await preferredTruck.company.owner;

        if (cat.id) category.id = cat.id;
        category.truckTypes = cat.truckTypes;
        category.truckSubtypes = cat.truckSubtypes;
        category.price = cat.price;
        category.preferredTruck = preferredTruck;
        category.payBy = cat.payBy;
        category.customerRate = cat.customerRate;
        category.partnerRate = cat.partnerRate;
        category.isScheduled = cat.isScheduled;
        category.isActive = cat.isActive;

        const notification = await this.notificationService.createNotification({
          ...NewPreferredTruckAssigned(preferredTruck.number),
          userId: owner.id,
        });

        this.eventEmitter.emit(
          'sendSocketNotification',
          notification,
          owner.id,
        );

        this.eventEmitter.emit('sendTextMessage', {
          to: owner.phoneNumber,
          ...PreferredTruckAssigned(preferredTruck.number),
        });

        return category;
      }),
    );

    const prevPreferredTrucks = prevJob.truckCategories.filter(
      cat =>
        cat.preferredTruck !== null &&
        !preferred
          .map(p => p.preferredTruck.id)
          .includes(cat.preferredTruck.id),
    );

    await this.jobRepo.update(jobId, { ...job, name: prevJob.name });

    const jobUpdated = await this.jobRepo.findJobById(jobId);

    jobUpdated.truckCategories = [
      ...filteredCategories,
      ...preferred,
      ...prevPreferredTrucks,
    ];

    await this.jobRepo.save(jobUpdated);

    const jobUpdated2 = await this.jobRepo.findOne({ id: jobId });

    jobUpdated2.scheduledJobs = [...prevJob.scheduledJobs];
    let hasScheduledJobs = false;

    if (jobUpdated2.scheduledJobs) {
      jobUpdated2.scheduledJobs.forEach(async (sj, index) => {
        if (sj.assignations) {
          sj.assignations.forEach((assign, index2) => {
            if (!assign.category.isActive) hasScheduledJobs = true;

            if (updateDriver) {
              const message = this.editedDriverJobContent(
                jobUpdated2,
                assign.driver,
                updatedValues,
              );

              if (assign.driver.deviceID) {
                this.eventEmitter.emit('sendNotification', {
                  to: assign.driver.deviceID,
                  title: 'Job edited!',
                  body: message,
                });
              }

              this.notificationService
                .createNotification({
                  title: `Job: ${job.name}`,
                  content: message,
                  submitted: new Date(),
                  isChecked: false,
                  priority: 1,
                  userId: assign.driver.id,
                })
                .then(notification => {
                  this.eventEmitter.emit(
                    'sendSocketNotification',
                    notification,
                    assign.driver.id,
                  );
                });
            }

            const category = jobUpdated2.truckCategories.find(
              cat =>
                cat.preferredTruck !== null &&
                cat.preferredTruck.id === assign.category.preferredTruck?.id,
            );
            if (category) {
              jobUpdated2.scheduledJobs[index].assignations[
                index2
              ].category = category;

              jobUpdated2.truckCategories[
                jobUpdated2.truckCategories.indexOf(category)
              ].isScheduled = true;

              jobUpdated2.truckCategories[
                jobUpdated2.truckCategories.indexOf(category)
              ].isActive = assign.startedAt !== null;
            }
          });
        }
      });
    }

    if (hasScheduledJobs && updated) {
      jobUpdated2.scheduledJobs.forEach(async schJob => {
        const owner = await schJob.company.owner;
        const message = this.editedOwnerJobContent(
          jobUpdated2,
          owner,
          updatedValues,
        );

        if (owner.deviceID) {
          this.eventEmitter.emit('sendNotification', {
            to: owner.deviceID,
            title: 'Job edited!',
            body: message,
          });
        }
        this.notificationService
          .createNotification({
            title: `Job: ${job.name}`,
            content: message,
            submitted: new Date(),
            isChecked: false,
            priority: 2,
            userId: owner.id,
            link: `/jobs/detail/${jobUpdated2.id}?isSchedule=true&type=scheduled`,
          })
          .then(notification => {
            this.eventEmitter.emit(
              'sendSocketNotification',
              notification,
              owner.id,
            );
          });
      });
    }

    await this.jobRepo.save(jobUpdated2);

    jobUpdated2.scheduledJobs.forEach(async scheduleJob => {
      await this.scheduledJobRepo.save(scheduleJob);
    });

    const jobUpdated3 = await this.jobRepo.findOne({ id: jobId });

    await this.emailService.sendUpdatedShiftEmailNotification();

    this.eventEmitter.emit('updateJob', jobId);

    return jobUpdated3;
  }

  async sendNotificationAndEmailToOwnersInArea(job: Job): Promise<void> {
    const owners = await this.userRepo.getAllOwners();
    let todeviceID = '';

    owners.forEach(async owner => {
      const { radius, address } = await this.getLocationInfo(owner);
      const location = this.locationService.locationToLatLong(job.loadSite);
      const center = this.locationService.locationToLatLong(address);
      const company = await this.userRepo.getContractorCompany(job.user);

      const driverList = (await this.userService.getOwnerDrivers(owner, {
        skip: 0,
        count: 20,
      })) as Driver[];

      const drivers = driverList.map(driver =>
        DriverDTO.fromModel(driver as Driver),
      );
      const trucks = await this.truckService.getOwnerTrucks(owner);

      let matchCategorie = false;
      let matchSubCategorie = false;

      trucks.forEach(truck => {
        matchCategorie = job.truckCategories?.some(
          categorie => categorie.truckTypes[0] === truck.type,
        );
      });

      trucks.forEach(truck => {
        matchSubCategorie = job.truckCategories?.some(categorie =>
          categorie.truckSubtypes.some(subCategorie =>
            truck.subtype.some(subtype => subCategorie === subtype),
          ),
        );
      });

      const isAnyDriverActive = drivers?.some(driver => driver.isActive);
      const isAnyTruckActive = trucks?.some(truck => truck.isActive);
      const isTruckNotClockedIn = trucks?.some(
        truck => truck.status === 'NOT_CLOCKED_IN',
      );

      if (isAnyDriverActive) {
        if (isAnyTruckActive) {
          if (isTruckNotClockedIn) {
            if (matchCategorie && matchSubCategorie) {
              if (
                this.locationService.isInsideRadius(location, center, radius)
              ) {
                if (owner.deviceID && owner.deviceID.length > 0) {
                  todeviceID = owner.deviceID;
                }

                const admin = await this.userRepo.find({
                  role: UserRole.ADMIN,
                });

                // eslint-disable-next-line guard-for-in
                for (const key in admin) {
                  const element = admin[key];

                  const notification = await this.notificationService.createNotification(
                    {
                      ...NewJobAvailable(job.name, company.companyCommon.name),
                      userId: element.id,
                    },
                  );

                  this.eventEmitter.emit('sendTextMessage', {
                    to: element.phoneNumber,
                    ...NewJobAvailableAdmin(
                      job.name,
                      company.companyCommon.name,
                    ),
                  });

                  this.eventEmitter.emit(
                    'sendSocketNotification',
                    notification,
                    element.id,
                  );
                }

                const notification = await this.notificationService.createNotification(
                  {
                    ...NewJobFromAreaOwner(
                      company.companyCommon.name,
                      'Link Job',
                    ),
                    userId: owner.id,
                  },
                );

                this.eventEmitter.emit(
                  'sendSocketNotification',
                  notification,
                  owner.id,
                );

                this.eventEmitter.emit('sendTextMessage', {
                  to: owner.phoneNumber,
                  ...NewJobNearAreaOwner(
                    'https://admin.ezdumptruck.com/jobs/filter/available',
                  ),
                });

                if (todeviceID && todeviceID.length > 0) {
                  this.eventEmitter.emit('sendNotification', {
                    to: todeviceID,
                    title: 'There is a new job near you!',
                    body: `There is a new job from ${company.companyCommon.name} near your area.`,
                  });
                }
              }
            }
          }
        }
      }
      todeviceID = '';
    });
  }

  async assignPreferredTruckByAdmin({
    jobId,
    truckId,
  }: {
    jobId: string;
    truckId: string;
  }): Promise<boolean> {
    const job = await this.jobRepo.findById(jobId);
    const truck = await this.truckRepo.findById(truckId);
    const owner = await truck.company.owner;

    const truckCategories = job.truckCategories.filter(
      cat => cat.preferredTruck === null && !cat.isScheduled,
    );

    const category = truckCategories.find(cat =>
      cat.isAssignableToTruck(truck),
    );
    if (!category) throw new TrucksUnassignableException();

    const notification = await this.notificationService.createNotification({
      ...NewPreferredTruckAssigned(truck.number),
      userId: owner.id,
    });

    this.eventEmitter.emit('sendTextMessage', {
      to: owner.phoneNumber,
      ...PreferredTruckAssigned(truck.number),
    });

    this.eventEmitter.emit('sendSocketNotification', notification, owner.id);
    category.preferredTruck = truck;

    await this.truckCategoryRepo.save(category);

    return true;
  }

  private ownerHasTruckForTheJob(
    truckCategories: TruckCategory[],
    trucks: Truck[],
    ownerCompany: OwnerCompany,
  ): boolean {
    const categories = [
      ...truckCategories.filter(cat => cat.preferredTruck === null),
    ];
    const preferred = [
      ...truckCategories.filter(cat => cat.preferredTruck !== null),
    ];

    const availableCategories = [
      ...categories,
      ...preferred.filter(
        cat => cat.preferredTruck.company.id === ownerCompany.id,
      ),
    ];

    if (availableCategories.length === 0) return false;

    return trucks.some(truck => {
      return availableCategories.some(category => {
        if (category.preferredTruck)
          return (
            category.isAssignableToTruck(truck) &&
            category.preferredTruck.company.id === ownerCompany.id
          );

        return category.isAssignableToTruck(truck);
      });
    });
  }

  async calculateEarnings(scheduledJob: ScheduledJob): Promise<number> {
    const job = await this.jobRepo.findById(scheduledJob.job.id);
    const ownerInvoice = await this.invoiceService.generateOwnerInvoice(
      scheduledJob,
      job,
    );
    return ownerInvoice.amount;
  }

  async getJobs(user: Owner, skip: number, count: number): Promise<Job[]> {
    const { radius, address } = await this.getLocationInfo(user);
    const jobs = await this.jobRepo.findOwnerJobs(user.restrictedAt, { skip, count });

    const minutes = await this.getAmountAfterMinutesToShowTrucks(user);
    const ownerTrucks = await this.truckRepo.getOwnerActiveTrucks(user);
    const response = [];

    await Promise.all(
      jobs.map(async job => {
        const location = this.locationService.locationToLatLong(job.loadSite);
        const center = this.locationService.locationToLatLong(address);
        const isInsideRadius = this.locationService.isInsideRadius(
          location,
          center,
          radius,
        );

        const truckCategories = await this.truckCategoryRepo.find({
          job,
          isActive: false,
          isScheduled: false,
        });

        const ownerCompany = await this.ownerCompanyRepo.findOwnerCompany(
          user.id,
        );

        const hasOwnerTruck = this.ownerHasTruckForTheJob(
          truckCategories,
          ownerTrucks,
          ownerCompany,
        );

        if (truckCategories && truckCategories.length > 0) {
          if (minutes > 0) {
            const difference = differenceInMinutes(
              new Date(),
              new Date(job.createdAt),
            );

            if (difference >= minutes && isInsideRadius && hasOwnerTruck)
              response.push(job);

            // return difference >= minutes && isInsideRadius && hasOwnerTruck;
          } else if (isInsideRadius && hasOwnerTruck) {
            response.push(job);
          }
        }
        // return isInsideRadius && hasOwnerTruck;
      }),
    );

    return Promise.all(
      response.map(async job => {
        const truckCategories = await this.truckCategoryRepo.find({
          job,
          isActive: false,
          isScheduled: false,
        });
        const categories = [
          ...truckCategories.filter(cat => cat.preferredTruck === null),
        ];
        const preferred = [
          ...truckCategories.filter(cat => cat.preferredTruck !== null),
        ];
        const ownerCompany = await this.ownerCompanyRepo.findOwnerCompany(
          user.id,
        );
        const availableCategories = [
          ...categories,
          ...preferred.filter(
            cat => cat.preferredTruck.company.id === ownerCompany.id,
          ),
        ];
        job.truckCategories = availableCategories;
        return job;
      }),
    );
  }

  async getAdminJobs(
    generalJobId: string,
    skip: number,
    count: number,
  ): Promise<Job[]> {
    const jobs = await this.jobRepo.findAdminAvailableJobs({
      skip,
      count,
      generalJobId,
    });

    return jobs;
  }

  private async getAmountAfterMinutesToShowTrucks(
    user: Owner,
  ): Promise<number> {
    const numHighPriorityOwners = await this.userRepo.countOwnersByPriority(
      OwnerPriority.HIGH,
    );
    const numMediumPriorityOwners = await this.userRepo.countOwnersByPriority(
      OwnerPriority.MEDIUM,
    );
    let minutes = 0;
    if (user.priority === OwnerPriority.MAXIMUM) {
      return MAXIMUM_PRIORITY_MINUTES;
    }
    if (numHighPriorityOwners > 0) {
      if (user.priority === OwnerPriority.HIGH) {
        minutes = HIGH_PRIORITY_MINUTES;
      }
      if (user.priority === OwnerPriority.MEDIUM) {
        minutes = MEDIUM_PRIORITY_MINUTES;
      }
      if (user.priority === OwnerPriority.LOW) {
        minutes = LOW_PRIORITY_MINUTES;
      }
    } else if (numMediumPriorityOwners > 0) {
      if (user.priority === OwnerPriority.MEDIUM) {
        minutes = HIGH_PRIORITY_MINUTES;
      }
      if (user.priority === OwnerPriority.LOW) {
        minutes = MEDIUM_PRIORITY_MINUTES;
      }
    } else {
      minutes = HIGH_PRIORITY_MINUTES;
    }
    return minutes;
  }

  async getLocationInfo(
    user: Owner,
  ): Promise<{ radius: number; address: Location }> {
    const company = await this.userRepo.getOwnerCompany(user);
    const radius = company.jobRadius;
    const address = company.parkingLotAddress.lat
      ? company.parkingLotAddress
      : company.companyCommon.address;

    return { radius, address };
  }

  getJob(
    id: string,
    active: boolean,
    pending?: boolean,
    done?: boolean,
  ): Promise<Job> {
    return this.jobRepo.findByIdWithCategories(id, active, pending, done);
  }

  getJobSchedule(id: string): Promise<Job> {
    return this.jobRepo.findJob(id);
  }

  getScheduledJob(id: string): Promise<ScheduledJob> {
    return this.scheduledJobRepo.findScheduledJobdWithReviews(id);
  }

  async disputeScheduledJob(
    id: string,
    user: User,
    message?: string,
  ): Promise<void> {
    await this.validateDispute(id);
    const scheduledJob = await this.scheduledJobRepo.findScheduleJob(id);
    const owner = await scheduledJob.company.owner;
    await this.scheduledJobRepo.update(id, {
      disputeRequest: true,
      disputeMessage: message,
    });
    await this.emailService.sendNewDisputeOwnerEmail(
      scheduledJob.job.name,
      owner.email,
      message,
      user.name,
      owner.id,
    );
    await this.emailService.sendNewDisputeContractorEmail(
      scheduledJob.job.name,
      user.email,
      message,
      user.name,
      owner.id,
    );
  }

  getJobWithAllCategories(id: string): Promise<Job> {
    return this.jobRepo.findByIdWithAllCategories(id);
  }

  async validateDispute(id: string): Promise<void> {
    const scheduledJob = await this.scheduledJobRepo.findById(id);
    const finishedAssignations = scheduledJob.assignations.filter(
      assignation => !!assignation.finishedAt,
    );

    if (!finishedAssignations) throw new NoFinishedAssignationsException();

    const [finishedDate] = finishedAssignations
      .map(assignation => assignation.finishedAt)
      .sort(compareAsc);

    if (!scheduledJob.isFinished()) throw new JobNotFinishedException();
    if (isAfter(finishedDate, subDays(new Date(), 1)))
      throw new DisputeTimePassedException();
  }

  async reviewDispute(id: string, confirm: boolean): Promise<void> {
    const scheduledJob = await this.scheduledJobRepo.findById(id);
    if (!scheduledJob.disputeRequest) throw new NoDisputeRequestedException();
    if (scheduledJob.disputeReviewed) throw new DisputeTimePassedException();

    await this.scheduledJobRepo.update(id, {
      disputeConfirmed: confirm,
      disputeReviewed: true,
    });
    const owner = await scheduledJob.company.owner;
    await this.emailService.sendDisputeResolvedConEmail(
      scheduledJob.job.name,
      owner.email,
      confirm,
    );
    await this.emailService.sendDisputeResolvedConEmail(
      scheduledJob.job.name,
      scheduledJob.job.user.email,
      confirm,
    );
  }

  async getOwnerScheduledJobs(
    user: User,
    {
      skip,
      count,
    }: {
      skip: number;
      count: number;
    },
  ): Promise<Job[]> {
    return this.jobRepo.findJobsForOwner(user, JobStatus.PENDING, {
      skip,
      count,
    });
  }

  async getOwnerActiveJobs(user: User): Promise<any[]> {
    return this.jobRepo.findJobsForOwner(user, JobStatus.STARTED, {
      skip: null,
      count: null,
    });
  }

  async removeFavoriteTruckFromCategory(
    favoriteTruckId: string,
  ): Promise<boolean> {
    const truckCategory = await this.truckCategoryRepo.findWithJob(
      favoriteTruckId,
    );

    const job = truckCategory.job;

    const foremans = await this.userService.getContractorForemans(job.user, {
      count: null,
      skip: null,
    });

    const dispatchers = await this.userService.getContractorDispatchers(
      job.user,
      { count: null, skip: null },
    );

    const contractor = truckCategory.job.user;
    const truckNumber = truckCategory.preferredTruck.number;

    const notification = await this.notificationService.createNotification({
      ...CanceledPreferredTruck(contractor.name, truckNumber, job),
      userId: contractor.id,
    });

    this.eventEmitter.emit(
      'sendSocketNotification',
      notification,
      contractor.id,
    );

    foremans.forEach(foreman => {
      this.notificationService
        .createNotification({
          ...CanceledPreferredTruck(foreman.name, truckNumber, job),
          userId: foreman.id,
        })
        .then(not => {
          this.eventEmitter.emit('sendSocketNotification', not, foreman.id);
        });
    });

    dispatchers.forEach(dispatcher => {
      this.notificationService
        .createNotification({
          ...CanceledPreferredTruck(dispatcher.name, truckNumber, job),
          userId: dispatcher.id,
        })
        .then(not => {
          this.eventEmitter.emit('sendSocketNotification', not, dispatcher.id);
        });
    });
    truckCategory.preferredTruck = null;
    await this.truckCategoryRepo.save(truckCategory);

    return true;
  }

  async getOwnerIncompletedJobs(user: Owner): Promise<Job[]> {
    const jobs = await this.jobRepo.findOwnerIncompleteJobs(user.restrictedAt);
    const { radius, address } = await this.getLocationInfo(user);
    const minutes = await this.getAmountAfterMinutesToShowTrucks(user);
    const ownerTrucks = await this.truckRepo.getOwnerActiveTrucks(user);

    const response = [];

    await Promise.all(
      jobs.map(async job => {
        const location = this.locationService.locationToLatLong(job.loadSite);
        const center = this.locationService.locationToLatLong(address);
        const truckCategories = await this.truckCategoryRepo.find({ job });
        const ownerCompany = await this.ownerCompanyRepo.findOwnerCompany(
          user.id,
        );
        if (minutes > 0) {
          if (
            differenceInMinutes(new Date(), new Date(job.createdAt)) >=
              minutes &&
            this.locationService.isInsideRadius(location, center, radius) &&
            this.ownerHasTruckForTheJob(
              truckCategories,
              ownerTrucks,
              ownerCompany,
            )
          )
            response.push(job);
        } else if (
          this.locationService.isInsideRadius(location, center, radius) &&
          this.ownerHasTruckForTheJob(
            truckCategories,
            ownerTrucks,
            ownerCompany,
          )
        ) {
          response.push(job);
        }
      }),
    );

    return response;
  }

  async getDriverScheduledJobs(
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
    return this.scheduledJobRepo.findDriverScheduledJobs(user, {
      skip,
      count,
      start,
      end,
    });
  }

  async getResources(
    user: User,
    jobId: string,
  ): Promise<ScheduledJobResources> {
    const job = await this.jobRepo.findById(jobId);
    const [drivers, trucks] = await Promise.all([
      this.userRepo.getAvailableUsersForJob(job, user),
      this.truckRepo.getAvailableTrucksForJob(job, user),
    ]);

    const matchingTrucks = trucks.filter(truck => {
      console.log(truck.type);
      return job.truckCategories.find(category =>
        category.isAssignableToTruck(truck),
      );
    });

    return { drivers, trucks: matchingTrucks };
  }

  async getResourcesFromScheduledJob(
    user: User,
    jobId: string,
  ): Promise<ScheduledJobResources> {
    const scheduledJob = await this.scheduledJobRepo.findById(jobId);
    const job = await this.jobRepo.findById(scheduledJob.job.id);
    const [drivers, trucks] = await Promise.all([
      this.userRepo.getAvailableUsersForJob(job, user),
      this.truckRepo.getAvailableTrucksForJob(job, user),
    ]);
    const matchingTrucks = trucks.filter(truck => {
      console.log(truck.type);
      return job.truckCategories.find(category =>
        category.isAssignableToTruck(truck),
      );
    });

    return { drivers, trucks: matchingTrucks };
  }

  async scheduleJob(
    user: Owner,
    jobId: string,
    jobAssignations: { driverId: string; truckId: string }[],
  ): Promise<ScheduledJob> {
    if (!user.verifiedByAdmin) throw new UnverifiedOwnerException();
    const { job, trucks, drivers } = await this.getScheduleJobResources(
      jobId,
      jobAssignations,
    );

    await this.validateScheduledJob({ job, trucks, drivers }, user);
    const assignations = await this.generateJobAssignations(
      jobAssignations,
      drivers,
      trucks,
      job.truckCategories,
    );
    const scheduledJob = await this.createScheduledJob(user, job, assignations);

    await this.updateJob(job, assignations);
    let todeviceID = '';

    const startTime = moment(job.startDate).utcOffset('-0500').format('MMMM Do YYYY, h:mm:ss a');
    const finalTime = moment(job.endDate).utcOffset('-0500').format('MMMM Do YYYY, h:mm:ss a');

    assignations.forEach(async assignation => {
      this.eventEmitter.emit('sendTextMessage', {
        to: assignation.driver.phoneNumber,
        ...NewJobAsignedDriver(
          startTime,
          job.loadSite.address,
          finalTime,
          assignation.truck.number,
          job.material,
          assignation.payBy,
          job.dumpSite.address,
          job.name,
          assignation.driver.name,
        ),
      });

      if (assignation.driver.deviceID) {
        todeviceID = assignation.driver.deviceID;
      }

      const messageContent = this.assignDriverJobContent(
        job,
        assignation.driver,
        assignation.payBy,
      );

      if (todeviceID.length > 0) {
        this.eventEmitter.emit('sendNotification', {
          to: todeviceID,
          title: 'New job assigned!',
          body: messageContent,
        });
      }

      const notification = await this.notificationService.createNotification({
        title: `Job: ${job.name}`,
        content: messageContent,
        submitted: new Date(),
        isChecked: false,
        priority: 1,
        userId: assignation.driver.id,
      });

      this.eventEmitter.emit(
        'sendSocketNotification',
        notification,
        assignation.driver.id,
      );

      todeviceID = '';
    });

    if (job.isScheduled()) {
      const Dispatchers = await this.userRepo.findDispatchers(job.user);
      const Foremans = await this.userRepo.findForemans(job.user);

      // eslint-disable-next-line guard-for-in
      for (const key in Dispatchers) {
        const element = Dispatchers[key];

        const notification = await this.notificationService.createNotification({
          ...JobFulfilledDispatcher(job.name),
          userId: element.id,
        });

        this.eventEmitter.emit(
          'sendSocketNotification',
          notification,
          element.id,
        );
      }
      // eslint-disable-next-line guard-for-in
      for (const key in Foremans) {
        const element = Foremans[key];

        const notification = await this.notificationService.createNotification({
          ...JobFulfilledForeman(job.name),
          userId: element.id,
        });

        this.eventEmitter.emit(
          'sendSocketNotification',
          notification,
          element.id,
        );
      }

      const notification = await this.notificationService.createNotification({
        ...JobFulfilledContractor(job.name),
        userId: job.user.id,
      });

      this.eventEmitter.emit(
        'sendSocketNotification',
        notification,
        job.user.id,
      );
    }

    return scheduledJob;
  }

  async createScheduledJob(
    user: Owner,
    job: Job,
    assignations: JobAssignation[],
  ): Promise<ScheduledJob> {
    const company = await this.userRepo.getOwnerCompany(user);
    return this.scheduledJobRepo.create({
      job,
      company,
      assignations,
      paymentDue: addDays(job.paymentDue, 1),
    });
  }

  private async updateJob(
    job: Job,
    assignations: JobAssignation[],
  ): Promise<void> {
    if (!job.truckCategories) {
      job.truckCategories = [];
    }
    job.truckCategories = job.truckCategories.concat(
      assignations.map(assignation => assignation.category),
    );
    delete job.scheduledJobs;
    await this.jobRepo.save(job);
  }

  private async getScheduleJobResources(
    jobId: string,
    jobAssignations: { driverId: string; truckId: string }[],
  ): Promise<ScheduledJobResources> {
    const [job, trucks, drivers] = await Promise.all([
      this.jobRepo.findById(jobId),
      this.truckRepo.findByIds(jobAssignations.map(({ truckId }) => truckId)),
      this.userRepo.findDriversByIds(
        jobAssignations.map(({ driverId }) => driverId),
      ),
    ]);
    return { job, trucks, drivers: drivers as Driver[] };
  }

  private async validateScheduledJob(
    { job, trucks, drivers }: ScheduledJobResources,
    user: User,
  ): Promise<void> {
    if (!trucks.length || !drivers.length) throw new NoAssignationsException();
    await this.validateJobAssignation(user, job, drivers, trucks);
    this.validateTrucks(job, trucks);
  }

  private validateTrucks(job: Job, trucks: Truck[]): void {
    let availableCategories = [...job.truckCategories];
    trucks.forEach(truck => {
      const categoryFound = availableCategories.find(category =>
        category.isAssignableToTruck(truck),
      );
      if (!categoryFound) throw new TrucksUnassignableException();

      availableCategories = availableCategories.filter(
        category => categoryFound.id !== category.id,
      );
    });
  }

  private async validateJobAssignation(
    user: Owner,
    job: Job,
    drivers: Driver[],
    trucks: Truck[],
  ): Promise<void> {
    if (job.isScheduled()) throw new JobScheduledException();

    const company = await this.userRepo.getOwnerCompany(user);

    const usersScheduled = await Promise.all(
      drivers.map(driver => {
        if (driver.drivingFor.id !== company.id)
          throw new DocumentNotFoundException('User');
        return this.scheduledJobRepo.userHasJobScheduled(job, driver);
      }),
    );

    if (usersScheduled.find(scheduled => scheduled)) {
      throw new UserScheduledException();
    }

    const trucksScheduled = await Promise.all(
      trucks.map(truck => {
        if (truck.company.id !== company.id)
          throw new DocumentNotFoundException('Truck');
        if (!truck.isActive) throw new InactiveTruckException();
        return this.scheduledJobRepo.truckHasJobScheduled(job, truck);
      }),
    );

    if (trucksScheduled.find(scheduled => scheduled)) {
      throw new TruckScheduledException();
    }
  }

  private async generateJobAssignations(
    jobAssignations: { driverId: string; truckId: string }[],
    drivers: User[],
    trucks: Truck[],
    truckCategories: TruckCategory[],
  ): Promise<JobAssignation[]> {
    const trucksMap = getKeyMap(trucks);
    const driversMap = getKeyMap(drivers);
    let availableCategories = [...truckCategories];
    availableCategories.sort((a, b) => {
      if (a.preferredTruck) {
        return -1;
      }
      if (b.preferredTruck) {
        return 1;
      }
      return 0;
    });

    const assignations = [];

    console.info('Job assignations: ', jobAssignations);

    await Promise.all(
      jobAssignations.map(async ({ driverId, truckId }) => {
        const truckEntity = await this.truckRepo.findById(truckId);
        const driver = driversMap[driverId];
        const truck = trucksMap[truckId];

        const category = availableCategories.find(cat => {
          if (!cat.isScheduled && !cat.isActive) {
            if (cat.preferredTruck && cat.preferredTruck.id === truck.id) {
              return true;
            }

            return (
              cat.isAssignableToTruck(truck) && cat.preferredTruck === null
            );
          }
          return false;
        });

        let truckIndex = -1;

        category.truckTypes.forEach((val, index) => {
          if (val === truckEntity.type) {
            truckIndex = index;
          }
        });

        category.isScheduled = true;

        availableCategories = availableCategories.filter(
          cat => category.id !== cat.id,
        );
        assignations.push({
          driver,
          truck,
          category,
          price: category.price[truckIndex],
          customerRate: category.customerRate[truckIndex],
          partnerRate: category.partnerRate[truckIndex],
          payBy: category.payBy[truckIndex],
        } as JobAssignation);
        return [];
      }),
    );

    assignations.forEach(assignation => {
      const { category } = assignation;
      category.assignation = assignation;
      category.isScheduled = true;
    });

    return assignations;
  }

  getActiveScheduledJob(user: User): Promise<ScheduledJob> {
    return this.scheduledJobRepo.findActiveScheduledJob(user);
  }

  getNextScheduledJob(user: User): Promise<ScheduledJob> {
    return this.scheduledJobRepo.findNextScheduledJob(user);
  }

  async getJobNotFinished(user: User): Promise<ScheduledJob> {
    const data = await this.scheduledJobRepo.findJobNotFinished(user);
    let isCompleted = false;

    if (data) {
      if (data.assignations) {
        data.assignations.forEach(assignation => {
          if (assignation.driver.id === user.id) {
            if (
              assignation.comment &&
              assignation.signatureImg &&
              assignation.evidenceImgs &&
              assignation.evidenceImgs.length > 0 &&
              assignation.tons
            ) {
              isCompleted = true;
            }
          }
        });
      }
    }

    return isCompleted ? null : data;
  }

  public getJobsWithNoEvidence(user: User): Promise<ScheduledJob[]> {
    return this.scheduledJobRepo.findJobsWithNoEvidence(user);
  }

  public async getJobsWithNoEvidenceForUser(
    user: User,
  ): Promise<ScheduledJob[]> {
    const contractor =
      user.role === UserRole.FOREMAN
        ? await this.userRepo.findContractorByForeman(user as Foreman)
        : await this.userRepo.findContractorByDispatcher(user as Dispatcher);

    return this.scheduledJobRepo.findJobsWithNoEvidence(contractor);
  }

  async updateDriverLocation(
    assignationId: string,
    inside: boolean,
  ): Promise<JobAssignation> {
    const assignation = await this.jobAssignationRepo.findById(assignationId);

    assignation.isInSite = inside;

    await this.jobAssignationRepo.save(assignation);

    return assignation;
  }

  getDriverWeekWork(user: User): Promise<ScheduledJob[]> {
    return this.scheduledJobRepo.findActualWeekWork(user);
  }

  getDriverWeekWorkById(
    driverId: string,
    firstWeekday: string,
    lastWeekday: string,
  ): Promise<ScheduledJob[]> {
    return this.scheduledJobRepo.findActualWeekWorkByDriverId(
      driverId,
      firstWeekday,
      lastWeekday,
    );
  }

  async getTimeEntries(jobId: string, user: User): Promise<TimeEntry[]> {
    if (user) {
      const job = await this.jobRepo.findJobById(jobId);

      const assignation = this.timerService.getAssignation(
        user,
        job.scheduledJobs,
      );

      return this.timeEntryRepo.findTimeEntriesForUserAndJob(
        user,
        jobId,
        assignation,
      );
    }

    return [];
  }

  getOwnerJobsDone(
    user: User,
    { skip, count }: { skip: number; count: number },
  ): Promise<Job[]> {
    return this.jobRepo.findJobsForOwner(user, JobStatus.DONE, {
      skip,
      count,
    });
  }

  getContractorScheduledJobs(
    user: User,
    { skip, count, active }: { skip: number; count: number; active: boolean },
  ): Promise<Job[]> {
    const status = active ? JobStatus.STARTED : JobStatus.PENDING;
    return this.jobRepo.findContractorScheduledJobs(user, status, {
      skip,
      count,
    });
  }

  getRequestedTrucks(
    user: User,
    {
      skip,
      count,
      generalJobId,
    }: { skip: number; count: number; generalJobId: string },
  ): Promise<RequestTruck[]> {
    return this.requestTruckRepo.findContractorRequestedTrucks(
      user,
      { skip, count },
      generalJobId,
    );
  }

  getRequestedTrucksForeman(
    user: Foreman,
    {
      skip,
      count,
      generalJobId,
    }: { skip: number; count: number; generalJobId: string },
  ): Promise<RequestTruck[]> {
    return this.requestTruckRepo.findContractorRequestedTrucksForeman(
      user,
      { skip, count },
      generalJobId,
    );
  }

  deleteRequestedTruck(requestedTruckId: string): Promise<boolean> {
    return this.requestTruckRepo.deleteRequestedTruck(requestedTruckId);
  }

  getContractorJobsDone(
    user: User,
    { skip, count }: { skip: number; count: number },
  ): Promise<ScheduledJob[]> {
    return this.scheduledJobRepo.findContractorJobs(user, JobStatus.DONE, {
      skip,
      count,
    });
  }

  getContractorUnassignedJobs(
    user: User,
    { skip, count }: { skip: number; count: number },
  ): Promise<Job[]> {
    return this.jobRepo.findContractorPedningJobs(user, { skip, count });
  }

  getContractorIncompleteJobs(
    user: User,
    { skip, count }: { skip: number; count: number },
  ): Promise<Job[]> {
    return this.jobRepo.findContractorIncompleteJobs(user, { skip, count });
  }

  getAdminAvailableJobs({
    skip,
    count,
  }: {
    skip: number;
    count: number;
  }): Promise<Job[]> {
    return this.jobRepo.findAdminJobs({ skip, count });
  }

  getAdminScheduledJobs({
    skip,
    count,
  }: {
    skip: number;
    count: number;
  }): Promise<ScheduledJob[]> {
    return this.scheduledJobRepo.findAdminJobs({ skip, count });
  }

  getAdminJobsDone({
    skip,
    count,
  }: {
    skip: number;
    count: number;
  }): Promise<ScheduledJob[]> {
    return this.scheduledJobRepo.findAdminJobsDone({ skip, count });
  }

  getAdminPendingJobs({
    skip,
    count,
  }: {
    skip: number;
    count: number;
  }): Promise<Job[]> {
    return this.jobRepo.findAdminPedningJobs({ skip, count });
  }

  getAdminIncompleteJobs({
    skip,
    count,
  }: {
    skip: number;
    count: number;
  }): Promise<Job[]> {
    return this.jobRepo.findAdminIncompleteJobs({ skip, count });
  }

  getAdminCanceledJobsByContractors({
    skip,
    count,
    generalJobId,
  }: {
    skip: number;
    count: number;
    generalJobId?: string;
  }): Promise<Job[]> {
    return this.jobRepo.findAllJobsCanceledByContractors({
      skip,
      count,
      generalJobId,
    });
  }

  getAdminCanceledScheduledJobs({
    skip,
    count,
    generalJobId,
  }: {
    skip: number;
    count: number;
    generalJobId?: string;
  }): Promise<Job[]> {
    return this.jobRepo.findAllScheduledJobsCanceled({
      skip,
      count,
      generalJobId,
    });
  }

  async cancelContractorScheduleJob(jobId: string): Promise<boolean> {
    let canCancel = true;
    const job = await this.jobRepo.findJobById(jobId);
    const resultingCategories = [];

    job.truckCategories.forEach(category => {
      if (category.isActive || (!category.isScheduled && !category.isActive)) {
        canCancel = false;
        resultingCategories.push(category);
      }
    });

    const company = this.getJobContractorCompany(job);

    await Promise.all(
      job.scheduledJobs.map(async scheduledJob => {
        let canCancelSchJob = true;

        scheduledJob.assignations.forEach(async assignation => {
          if (
            assignation.category?.isActive ||
            (!assignation.category?.isScheduled &&
              !assignation.category?.isActive)
          ) {
            canCancelSchJob = false;
          } else {
            if (assignation.category) {
              assignation.category.isScheduled = false;
              assignation.category.assignation = null;
            }
            assignation.finishedAt = new Date();
            const driver = assignation.driver as Driver;
            assignation.driver = null;
            if (driver.deviceID) {
              const newNotification = await this.notificationService.createNotification(
                {
                  title: `Job was canceled by ${job.user.name}`,
                  content: `We are sorry to inform that job ${job.name} was cancelled by ${job.user.name}`,
                  submitted: new Date(),
                  isChecked: false,
                  priority: 1,
                  userId: driver.id,
                },
              );

              this.eventEmitter.emit(
                'sendSocketNotification',
                newNotification,
                driver.id,
              );
            }
            this.eventEmitter.emit('sendTextMessage', {
              to: driver.phoneNumber,
              body: `Contractor ${
                (await company).companyCommon.name
              } just canceled the job ${
                job.name
              }, please check your board for more jobs available!!!`,
            });
          }
        });

        if (canCancelSchJob) {
          scheduledJob.isCanceled = true;
          scheduledJob.canceledByOwner = false;
          scheduledJob.canceledAt = new Date();
        } else {
          const schedule = await this.scheduledJobRepo.getScheduleJobWithCompany(
            scheduledJob.id,
          );

          const owner = await schedule.company.owner;

          this.eventEmitter.emit('sendTextMessage', {
            to: owner.phoneNumber,
            body: `Contractor ${
              (await company).companyCommon.name
            } just canceled the job ${
              job.name
            }, please check your board for more jobs available!!!`,
          });

          const notification = await this.notificationService.createNotification(
            {
              title: `Job was canceled by ${
                (await company).companyCommon.name
              }`,
              content: `We are sorry to inform that job ${job.name} was cancelled by ${job.user.name}`,
              submitted: new Date(),
              isChecked: false,
              priority: 1,
              userId: owner.id,
            },
          );

          this.eventEmitter.emit(
            'sendSocketNotification',
            notification,
            owner.id,
          );

          if (owner.deviceID?.length > 0) {
            this.eventEmitter.emit('sendNotification', {
              to: owner.deviceID,
              title: 'Job canceled by contractor!',
              body: `contractor ${
                (await company).companyCommon.name
              } just canceled the job ${
                job.name
              }, please check your board for more jobs available!!!`,
            });
          }

          await this.emailService.sendJobCanceledEmail(
            job.name,
            owner.email,
            job.user.name,
          );
        }

        await this.scheduledJobRepo.save(scheduledJob);
      }),
    );

    if (canCancel) {
      job.status = JobStatus.CANCELED;
      job.canceledAt = new Date();

      await this.jobRepo.save(job);
    }

    return true;
  }

  async cancelContractorPendingJob(jobId: string): Promise<boolean> {
    const job = await this.jobRepo.findJobById(jobId);

    let canCancelJob = true;
    let canFinishJob = true;
    const resultingCategories = [];

    if (!job.scheduledJobs || job.scheduledJobs.length === 0)
      canFinishJob = false;

    job.scheduledJobs.forEach(schJob => {
      canCancelJob = false;
      if (!schJob.isFinished()) {
        canFinishJob = false;
      }
    });

    job.truckCategories.forEach(category => {
      if (category.isActive || category.isScheduled) {
        resultingCategories.push(category);
      }
    });

    job.truckCategories = resultingCategories;

    if (canCancelJob && !canFinishJob) {
      job.status = JobStatus.CANCELED;
      job.canceledAt = new Date();
      await this.jobRepo.save(job);
    } else if (canFinishJob && !canCancelJob) {
      this.timerService.completeJob(job);
    } else {
      await this.jobRepo.save(job);
    }

    return true;
  }

  async cancelOwnerScheduledJob(jobId: string, owner: Owner): Promise<boolean> {
    const scheduledJob = await this.scheduledJobRepo.findById(jobId);
    const { assignations } = scheduledJob;
    if (scheduledJob.isStarted()) {
      assignations.forEach(assignation => {
        if (!assignation.startedAt) {
          assignation.category.isScheduled = false;
          assignation.category.assignation = null;
          assignation.scheduledJob = null;
          assignation.finishedAt = new Date();
          this.scheduledJobRepo.save(scheduledJob);
        }
      });
      return;
    }

    assignations.forEach(assignation => {
      assignation.category.isScheduled = false;
      assignation.category.assignation = null;
    });
    const { job } = scheduledJob;
    // const allScheduledJobs = await this.scheduledJobRepo.findJobScheduledJobs(
    //   job,
    // );
    // const isJobStarted = allScheduledJobs.reduce((acc, schJob) => {
    //   return acc && schJob.isStarted();
    // }, true);
    // if (!isJobStarted) {
    //   job.status = JobStatus.PENDING;
    // } else {
    //   job.status = JobStatus.STARTED;
    // }

    scheduledJob.isCanceled = true;
    scheduledJob.canceledAt = new Date();
    scheduledJob.canceledByOwner = true;

    // await this.jobRepo.save(job);
    await this.scheduledJobRepo.save(scheduledJob);
    let todeviceID = '';
    scheduledJob.assignations.forEach(async assignation => {
      const driver = assignation.driver as Driver;
      if (driver.deviceID) {
        todeviceID = driver.deviceID;

        const notification = await this.notificationService.createNotification({
          title: `Job was canceled by ${owner.name}`,
          content: `We are sorry to inform that job ${job.name} was cancelled by ${owner.name}`,
          submitted: new Date(),
          isChecked: false,
          priority: 1,
          userId: driver.id,
        });

        this.eventEmitter.emit(
          'sendSocketNotification',
          notification,
          driver.id,
        );
      }
      this.eventEmitter.emit('sendTextMessage', {
        to: driver.phoneNumber,
        body: `We are sorry to inform that job ${job.name} was cancelled by ${owner.name}`,
      });
    });
    if (todeviceID.length > 0) {
      this.eventEmitter.emit('sendNotification', {
        to: todeviceID,
        title: 'Job canceled by owner!',
        body: `We are sorry to inform that job ${job.name} was cancelled by ${owner.name} `,
      });
    }
    // await this.emailService.sendJobCanceledEmail(
    //   job.name,
    //   job.user.email,
    //   owner.name,
    // );
    // assignations.forEach(async assignation => {
    //   await this.emailService.sendJobCanceledEmail(
    //     job.name,
    //     assignation.driver.email,
    //     owner.name,
    //   );
    // });
  }

  async getJobContractorCompany(job: Job): Promise<ContractorCompany> {
    return this.userRepo.getContractorCompany(job.user);
  }

  async editJobAssignationByOwner(
    assignationId: string,
    truckId: string,
    driverId: string,
  ): Promise<JobAssignation> {
    const assignation = await this.jobAssignationRepo.findById(assignationId);
    const truck = await this.truckRepo.findById(truckId);
    const driver = await this.driverRepo.findById(driverId);
    let todeviceID = '';

    if (assignation.driver.deviceID) {
      todeviceID = assignation.driver.deviceID;

      this.eventEmitter.emit('sendNotification', {
        to: todeviceID,
        title: `Hey ${assignation.driver.name} The job has been removed`,
        body: `The work has been assigned to ${driver.name}`,
      });

      const notification = await this.notificationService.createNotification({
        ...EditScheduleDriver(driver.name, assignation.driver.name, 'editJob'),
        userId: assignation.driver.id,
      });

      this.eventEmitter.emit(
        'sendSocketNotification',
        notification,
        assignation.driver.id,
      );
    }

    assignation.truck = truck;
    assignation.driver = driver;

    await this.jobAssignationRepo.save(assignation);
    return this.jobAssignationRepo.findById(assignationId);
  }

  async removeJobAssignationsByOwner(
    jobId: string,
    assignationsDTO: DeleteOrClockOutJobAssignationsDTO,
  ): Promise<any> {
    const job = await this.jobRepo.findJobById(jobId);
    const owner = await job.scheduledJobs[0].company.owner;
    const { assignations } = assignationsDTO;

    await Promise.all(
      assignations.map(async assig => {
        const assignation = await this.jobAssignationRepo.findById(
          assig.assignationId,
        );

        if (owner.deviceID) {
          this.eventEmitter.emit('sendNotification', {
            to: owner.deviceID,
            title: `Hey ${owner.name}, one of your jobs assignations has been cancelled`,
            body: `We're sorry to inform you that your truck: ${assig.truckId} has been removed from job: 
            ${job.name} - #${job.orderNumber}, 
            please check for more available jobs or contact EZ DUMP TRUCK Inc., for any inconvenience. 
            Thanks!`,
          });

          const notification = await this.notificationService.createNotification(
            {
              ...RemovedJobAssignationOwner(
                owner.name,
                assig.truckId,
                job.name,
                job.orderNumber,
              ),
              userId: owner.id,
            },
          );

          this.eventEmitter.emit(
            'sendSocketNotification',
            notification,
            owner.id,
          );
        }

        if (assignation.driver.deviceID) {
          this.eventEmitter.emit('sendNotification', {
            to: assignation.driver.deviceID,
            title: `Hey ${assignation.driver.name}, one of your jobs has been cancelled`,
            body: `We're sorry to inform you that job: ${job.name} 
            - #${job.orderNumber} has been cancelled, 
            please contact your boss for more info. Thanks!`,
          });

          const notification = await this.notificationService.createNotification(
            {
              ...RemovedJobAssignationDriver(
                assignation.driver.name,
                job.name,
                job.orderNumber,
                'editJob',
              ),
              userId: assignation.driver.id,
            },
          );

          this.eventEmitter.emit(
            'sendSocketNotification',
            notification,
            assignation.driver.id,
          );
        }

        this.truckCategoryRepo.remove(assig.categoryId);
        this.jobAssignationRepo.remove(assig.assignationId);
      }),
    );
  }

  async clockoutJobAssignationsByOwner(
    jobId: string,
    assignationsDTO: DeleteOrClockOutJobAssignationsDTO,
    user: User,
  ): Promise<any> {
    const { assignations } = assignationsDTO;

    await Promise.all(
      assignations.map(async assig => {
        await this.cancelTruckScheduleJob(jobId, assig.truckId, user);
      }),
    );
  }

  async handleNotStartedJobs(): Promise<void> {
    const notStartedAssignations = await this.jobAssignationRepo.findNotStartedAssignations();
    notStartedAssignations.forEach(async assignation => {
      const owner = await assignation.scheduledJob.company.owner;
      let todeviceID = '';
      this.eventEmitter.emit('sendTextMessage', {
        to: owner.phoneNumber,
        body: `Driver ${assignation.driver.name} never started job ${assignation.scheduledJob.job.name}`,
      });
      if (owner.deviceID) {
        todeviceID = owner.deviceID;
      }
      if (todeviceID.length > 0) {
        this.eventEmitter.emit('sendNotification', {
          to: todeviceID,
          title: 'Driver never started job!',
          body: `Driver ${assignation.driver.name} never started ${assignation.scheduledJob.job.name}`,
        });

        const notification = await this.notificationService.createNotification({
          ...JobNeverStartedOwner(
            assignation.driver.name,
            assignation.scheduledJob.job.name,
          ),
          userId: owner.id,
        });

        this.eventEmitter.emit(
          'sendSocketNotification',
          notification,
          owner.id,
        );
      }
      // await this.emailService.sendOwnerNotStartedJobByDriver(
      //   owner.email,
      //   assignation.scheduledJob.job.name,
      //   assignation.driver.name,
      // );
      assignation.sentNeverStartedJobEmail = true;
      await this.jobAssignationRepo.save(assignation);
    });
  }

  async handleJobsStartedLimitTime(): Promise<void> {
    const startedAssignations = await this.jobAssignationRepo.findStartedAssignationsBeforeFinish();
    startedAssignations.map(async assignation => {
      const { driver } = assignation;
      let toDriverdeviceID = '';
      const owner = await assignation.scheduledJob.company.owner;
      let toOwnerdeviceID = '';
      this.eventEmitter.emit('sendTextMessage', {
        to: owner.phoneNumber,
        body: `Driver ${assignation.driver.name} will finish ${assignation.scheduledJob.job.name} in 15 minutes`,
      });
      if (owner.deviceID) {
        toOwnerdeviceID = owner.deviceID;
      }
      if (toOwnerdeviceID.length > 0) {
        this.eventEmitter.emit('sendNotification', {
          to: toOwnerdeviceID,
          title: 'Job is almost finished!',
          body: `Driver ${assignation.driver.name} will finish ${assignation.scheduledJob.job.name} in 15 minutes`,
        });

        const notification = await this.notificationService.createNotification({
          title: `Job is almost finished!`,
          content: `Driver ${assignation.driver.name} will finish ${assignation.scheduledJob.job.name} in 15 minutes`,
          submitted: new Date(),
          isChecked: false,
          priority: 1,
          userId: owner.id,
        });

        this.eventEmitter.emit(
          'sendSocketNotification',
          notification,
          owner.id,
        );
      }
      if (driver.deviceID) {
        toDriverdeviceID = driver.deviceID;
      }
      this.eventEmitter.emit('sendTextMessage', {
        to: owner.phoneNumber,
        body: `Driver ${assignation.driver.name}, job is almost finished, job ${assignation.scheduledJob.job.name} will finish in 15 minutes.`,
      });
      if (toDriverdeviceID.length > 0) {
        this.eventEmitter.emit('sendNotification', {
          to: toDriverdeviceID,
          title: 'Job is almost finished!',
          body: `Driver ${assignation.driver.name}, job is almost finished, job ${assignation.scheduledJob.job.name} will finish in 15 minutes.`,
        });

        const notification = await this.notificationService.createNotification({
          title: `Job is almost finished!`,
          content: `Driver ${assignation.driver.name}, job is almost finished, job ${assignation.scheduledJob.job.name} will finish in 15 minutes.`,
          submitted: new Date(),
          isChecked: false,
          priority: 1,
          userId: assignation.driver.id,
        });

        this.eventEmitter.emit(
          'sendSocketNotification',
          notification,
          assignation.driver.id,
        );
      }
    });
  }

  async handleStartedJobsNotFinished(): Promise<void> {
    const notFinishedJobs = await this.jobRepo.findStartedJobsNotFinished();
    // const today = new Date();
    await Promise.all(
      notFinishedJobs.map(async job => {
        const endDate = new Date(job.endDate);
        const { scheduledJobs } = job;
        await Promise.all(
          scheduledJobs.map(async scheduledJob => {
            const { assignations } = scheduledJob;
            await Promise.all(
              assignations.map(async assignation => {
                const { driver } = assignation;
                if (!assignation.finishedAt) {
                  const totalTravels = await this.geolocationService.getTotalTravels(
                    driver,
                    job.id,
                  );

                  const finishedAt = endDate;

                  assignation.load = totalTravels;
                  assignation.totalTravels = totalTravels;
                  assignation.finishedAt = finishedAt;
                  assignation.finishByUser = false;

                  await this.jobAssignationRepo.save(assignation);
                }

                const timeEntries = await this.getTimeEntries(job.id, driver);
                await Promise.all(
                  timeEntries.map(async timeEntry => {
                    if (timeEntry.endDate === null) {
                      // const addHour = new Date(
                      // endDate.setHours(endDate.getHours() + 1),
                      // );
                      timeEntry.endDate = endDate;
                      await this.timeEntryRepo.save(timeEntry);
                    }
                  }),
                );
              }),
            );
          }),
        );
      }),
    );

    await Promise.all(
      notFinishedJobs.map(async job => {
        await this.timerService.completeJob(job);
      }),
    );

    await Promise.all(
      notFinishedJobs.map(async job => {
        const { scheduledJobs } = job;
        // const contractorEmail = job.user.email;
        await Promise.all(
          scheduledJobs.map(async scheduledJob => {
            const { assignations } = scheduledJob;
            const owner = await scheduledJob.company.owner;
            const completeScheduledJob = await this.scheduledJobRepo.findScheduleJob(
              scheduledJob.id,
            );
            await Promise.all(
              assignations.map(async assignation => {
                if (!assignation.finishedAt) {
                  const { driver } = assignation;
                  await this.sendDriverAutomaticallyClockedOutNotification(
                    driver,
                  );
                  await this.sendOwnerAutomaticallyClockedOutNotification(
                    owner,
                    driver,
                  );
                  await this.sendFinishedJobNotifications(
                    job,
                    completeScheduledJob,
                    owner,
                    driver,
                  );
                }
              }),
            );
          }),
        );
      }),
    );
  }

  async handlePendingJobsNotFinished(): Promise<void> {
    const notFinishedJobs = await this.jobRepo.findPendingJobsNotFinished();
    const today = new Date();
    await Promise.all(
      notFinishedJobs.map(async job => {
        const { scheduledJobs } = job;
        await Promise.all(
          scheduledJobs.map(async scheduledJob => {
            const { assignations } = scheduledJob;
            await Promise.all(
              assignations.map(async assignation => {
                if (!assignation.finishedAt) {
                  assignation.finishedAt = today;
                  assignation.finishByUser = false;

                  await this.jobAssignationRepo.save(assignation);
                }
                const { driver } = assignation;
                const timeEntries = await this.getTimeEntries(job.id, driver);
                await Promise.all(
                  timeEntries.map(async timeEntry => {
                    if (timeEntry.endDate === null) {
                      timeEntry.endDate = today;
                      await this.timeEntryRepo.save(timeEntry);
                    }
                  }),
                );
              }),
            );
          }),
        );
      }),
    );

    await Promise.all(
      notFinishedJobs.map(async job => {
        await this.timerService.finishIncompletedJob(job);
      }),
    );

    await Promise.all(
      notFinishedJobs.map(async job => {
        const { scheduledJobs } = job;
        // const contractorEmail = job.user.email;
        await Promise.all(
          scheduledJobs.map(async scheduledJob => {
            const { assignations } = scheduledJob;
            const owner = await scheduledJob.company.owner;
            const completeScheduledJob = await this.scheduledJobRepo.findScheduleJob(
              scheduledJob.id,
            );
            await Promise.all(
              assignations.map(async assignation => {
                if (!assignation.finishedAt) {
                  const { driver } = assignation;
                  await this.sendDriverAutomaticallyClockedOutNotification(
                    driver,
                  );
                  await this.sendOwnerAutomaticallyClockedOutNotification(
                    owner,
                    driver,
                  );
                  await this.sendFinishedJobNotifications(
                    job,
                    completeScheduledJob,
                    owner,
                    driver,
                  );
                }
              }),
            );
          }),
        );
      }),
    );
  }

  private async sendDriverAutomaticallyClockedOutNotification(
    driver: Driver,
  ): Promise<void> {
    let toDriverdeviceID = '';
    if (driver.deviceID) {
      toDriverdeviceID = driver.deviceID;
    }
    if (toDriverdeviceID.length > 0) {
      this.eventEmitter.emit('sendNotification', {
        to: toDriverdeviceID,
        title: 'Automatically clock out.',
        body: `You were automatically clock out, you need to provide the evidence neccesary`,
      });

      const notification = await this.notificationService.createNotification({
        title: `Automatically clock out.`,
        content: `You were automatically clock out, you need to provide the evidence neccesary`,
        submitted: new Date(),
        isChecked: false,
        priority: 1,
        userId: driver.id,
      });

      this.eventEmitter.emit('sendSocketNotification', notification, driver.id);
    }
  }

  private async sendOwnerAutomaticallyClockedOutNotification(
    owner: Owner,
    driver: Driver,
  ): Promise<void> {
    let toOwnerdeviceID = '';
    if (owner.deviceID) {
      toOwnerdeviceID = owner.deviceID;
    }
    if (toOwnerdeviceID.length > 0) {
      this.eventEmitter.emit('sendNotification', {
        to: toOwnerdeviceID,
        title: 'Automatically clock out.',
        body: `Your driver ${driver.name} was automatically clock out, you need to provide the evidence necessary.`,
      });

      const notification = await this.notificationService.createNotification({
        title: `Automatically clock out.`,
        content: `Your driver ${driver.name} was automatically clock out, you need to provide the evidence necessary.`,
        submitted: new Date(),
        isChecked: false,
        priority: 1,
        userId: owner.id,
      });

      this.eventEmitter.emit('sendSocketNotification', notification, owner.id);
    }
  }

  private async sendFinishedJobNotifications(
    job: Job,
    activeScheduledJob: ScheduledJob,
    owner: Owner,
    driver: Driver,
  ): Promise<void> {
    let toOwnerdeviceID = '';
    if (owner.deviceID) {
      toOwnerdeviceID = owner.deviceID;
    }
    if (toOwnerdeviceID.length > 0) {
      this.eventEmitter.emit('sendNotification', {
        to: toOwnerdeviceID,
        title: 'Finished',
        body: `Work completed by ${driver.name}`,
      });
    }
  }

  async handleJobsNotFilledOut(): Promise<void> {
    const jobs = await this.jobRepo.findAllContractorsIncompleteJobs();
    await Promise.all(
      jobs.map(async job => {
        const allScheduledJobs = await this.scheduledJobRepo.findJobScheduledJobs(
          job,
        );
        if (job.truckCategories.length > allScheduledJobs.length) {
          await this.emailService.sendJobNotFilledOut(job.user.email, job.name);
          const dispatchers = await this.userRepo.findDispatchers(job.user);
          await Promise.all(
            dispatchers.map(async dispatcher => {
              await this.emailService.sendJobNotFilledOut(
                dispatcher.email,
                job.name,
              );
            }),
          );
        }
        job.sentNotFilledEmail = true;
        await this.jobRepo.save(job);
      }),
    );
  }

  async getDispatcherTotalJobs(user: User): Promise<JobsTotalContractorDTO> {
    const contractor = await this.userRepo.findContractorByDispatcher(user);
    return this.getContractorTotalJobs(contractor);
  }

  async getForemanTotalJobs(user: User): Promise<JobsTotalContractorDTO> {
    const contractor = await this.userRepo.findContractorByDispatcher(user);
    return this.getContractorTotalJobs(contractor);
  }

  async getContractorTotalJobs(user: User): Promise<JobsTotalContractorDTO> {
    const [
      totalScheduledJobs,
      totalPendingJobs,
      totalActiveJobs,
      totalJobsDone,
      totalOrderIcomplete,
    ] = await Promise.all([
      this.getContractorTotalScheduledJobs(user),
      this.getContractorTotalPendingJobs(user),
      this.getContractorTotalActiveJobs(user),
      this.getContractorTotalJobsDone(user),
      this.getContractorTotalOrderIncomplete(user),
    ]);

    return {
      scheduled: totalScheduledJobs,
      pending: totalPendingJobs,
      active: totalActiveJobs,
      done: totalJobsDone,
      incomplete: totalOrderIcomplete,
    };
  }

  async getContractorTotalScheduledJobs(user: User): Promise<number> {
    return this.jobRepo.countContractorScheduledJobs(user, JobStatus.PENDING);
  }

  async getContractorTotalActiveJobs(user: User): Promise<number> {
    return this.jobRepo.countContractorScheduledJobs(user, JobStatus.STARTED);
  }

  async getContractorTotalPendingJobs(user: User): Promise<number> {
    return this.jobRepo.countContractorJobs(user, '', JobStatus.PENDING);
  }

  async getContractorTotalJobsDone(user: User): Promise<number> {
    return this.scheduledJobRepo.countContractorJobs(user, JobStatus.DONE);
  }

  async getContractorTotalOrderIncomplete(user: User): Promise<number> {
    return this.jobRepo.countContractorIncompleteJobs(user);
  }

  async getOwnerTotalAvailableJobs(user: Owner): Promise<number> {
    const { radius, address } = await this.getLocationInfo(user);
    const jobs = await this.jobRepo.findAllOwnerJobs(user.restrictedAt);

    const ownerTrucks = await this.truckRepo.getOwnerActiveTrucks(user);
    const filteredJobs = [];

    await Promise.all(
      jobs.map(async job => {
        const location = this.locationService.locationToLatLong(job.loadSite);
        const center = this.locationService.locationToLatLong(address);
        const truckCategories = await this.truckCategoryRepo.find({
          job,
          isActive: false,
          isScheduled: false,
        });
        const ownerCompany = await this.ownerCompanyRepo.findOwnerCompany(
          user.id,
        );
        if (
          this.locationService.isInsideRadius(location, center, radius) &&
          this.ownerHasTruckForTheJob(
            truckCategories,
            ownerTrucks,
            ownerCompany,
          )
        )
          filteredJobs.push(job);
      }),
    );

    return filteredJobs.length;
  }

  async countOwnerScheduledJobs(user: Owner): Promise<number> {
    return this.jobRepo.countOwnerJobs(user, JobStatus.PENDING);
  }

  async countOwnerActiveJobs(user: Owner): Promise<number> {
    return this.jobRepo.countOwnerJobs(user, JobStatus.STARTED);
  }

  async countOwnerJobsDone(user: Owner): Promise<number> {
    return this.jobRepo.countOwnerJobs(user, JobStatus.DONE);
  }

  async countOwnerIncompletedJobs(user: Owner): Promise<number> {
    return this.jobRepo.countOwnerJobs(user, JobStatus.INCOMPLETE);
  }

  getWeeklyPeriods(date: string): Omit<WeeklyWork, 'weekWork'>[] {
    const dateParsed = moment(date);
    const weeks = getWeeksInMonth(new Date(date));
    const firstDay = dateParsed.clone().startOf('month');
    const lastDay = dateParsed.clone().endOf('month');
    const periods = [];

    for (let i = 0; i < weeks; i += 1) {
      if (i === weeks - 1) {
        periods.push({
          from: periods[periods.length - 1].to,
          to: lastDay.format('YYYY-MM-DD'),
        });
      } else {
        periods.push({
          from: firstDay
            .clone()
            .add(7 * i, 'days')
            .format('YYYY-MM-DD'),
          to: firstDay
            .clone()
            .add(7 * (i + 1), 'days')
            .format('YYYY-MM-DD'),
        });
      }
    }

    return periods;
  }

  async makeActualWeekList(
    user: User,
    scheduledJobs: ScheduledJob[],
    date: string,
  ): Promise<WeeklyWork[]> {
    const actualWork: WeekActualWork[] = [];
    const weeklyWorkMap = new Map<string, WeekActualWork[]>();
    const resultData: WeeklyWork[] = [];

    const periods = this.getWeeklyPeriods(date);

    await Promise.all(
      scheduledJobs.map(async schjob => {
        const assignation = schjob.assignations.find(
          assig => assig.driver.id === user.id,
        );

        const getDriverInvoice = await this.driverJobInvoiceRepo.findDriverJobInvoiceForDriver(
          schjob.job.id,
          user.id,
        );

        const entries = await this.getTimeEntries(
          schjob.job.id,
          assignation.driver,
        );
        const entriesToRoundHours = _.cloneDeep(entries);
        const hours = getRoundedHours(entriesToRoundHours);
        const amount = (user as Driver).pricePerHour * hours;
        const { comment } = assignation;
        const jobWork: WeekActualWork = {
          assignation,
          entries,
          workedHours: `${hours}`,
          amount,
          job: schjob.job,
          driver: user,
          comment,
          ticketNumber: `${String(schjob.job.orderNumber).padStart(
            3,
            '0',
          )}-${String(getDriverInvoice?.ticketNumber).padStart(3, '0')}`,
          travelTime: getDriverInvoice?.travelTime,
          travelTimeSupervisor: getDriverInvoice?.travelTimeSupervisor,
          isPaid: getDriverInvoice?.isPaid,
          ticketId: getDriverInvoice?.id,
          paidWith: getDriverInvoice?.paidWith,
          orderNumber: getDriverInvoice?.orderNumber,
          accountNumber: getDriverInvoice?.accountNumber,
          paidAt: getDriverInvoice?.paidAt,
        };
        return actualWork.push(jobWork);
      }),
    );

    periods.forEach(period => {
      actualWork.forEach(data => {
        if (
          new Date(period.from) <= new Date(data.assignation.startedAt) &&
          new Date(`${period.to}T23:59:59.999Z`) >=
            new Date(data.assignation.finishedAt)
        ) {
          const json = JSON.stringify({ from: period.from, to: period.to });

          if (weeklyWorkMap.has(json)) {
            const prevValue = weeklyWorkMap.get(json);
            prevValue.push(data);
            weeklyWorkMap.set(json, prevValue);
          } else {
            weeklyWorkMap.set(json, [data]);
          }
        }
      });
    });

    weeklyWorkMap.forEach((value, key) => {
      const parsedKey = JSON.parse(key);
      resultData.push({
        from: parsedKey.from,
        to: parsedKey.to,
        weekWork: value,
      });
    });

    return resultData;
  }

  async reviewScheduledJobTruck(
    review: Omit<
    ReviewTruck,
    'id' | 'updatedAt' | 'createdAt' | 'scheduledJob' | 'user' | 'truck'
    >,
    user: User,
    scheduledJobId: string,
    truckId: string,
  ): Promise<ReviewTruck> {
    const scheduledJob = await this.getScheduledJob(scheduledJobId);
    const truck = await this.truckRepo.findById(truckId);
    const isAlreadyReviewed = await this.truckForJobIsAlreadyReviewed(
      scheduledJob.id,
      truck.id,
    );
    if (isAlreadyReviewed) {
      throw new JobTruckAlreadyReviewedException();
    }
    const newReview = await this.reviewTruckRepo.create({
      ...review,
      truck,
      user,
      scheduledJob,
    });
    const owner = await truck.company.owner;
    // await this.emailService.sendOwnerNewTruckReviewEmail(
    //   owner.email,
    //   scheduledJob.job.name,
    //   truck.number,
    //   newReview.stars,
    //   newReview.comment,
    // );

    if (owner.deviceID && owner.deviceID.length > 0) {
      this.eventEmitter.emit('sendNotification', {
        to: owner.deviceID,
        title: 'Truck review',
        body: `Truck number ${truck.number} received ${newReview} starts and comments for the ${scheduledJob.job.name}`,
      });

      const notification = await this.notificationService.createNotification({
        title: `Job is almost finished!`,
        content: `Truck number ${truck.number} received ${newReview} starts and comments for the ${scheduledJob.job.name}`,
        submitted: new Date(),
        isChecked: false,
        priority: 1,
        userId: owner.id,
      });

      this.eventEmitter.emit('sendSocketNotification', notification, owner.id);
    }
    return newReview;
  }

  async truckForJobIsAlreadyReviewed(
    scheduledJobId: string,
    truckId: string,
  ): Promise<boolean> {
    return this.reviewTruckRepo.truckForJobIsAlreadyReviewed(
      scheduledJobId,
      truckId,
    );
  }

  async getScheduledJobTrucks(
    scheduledJobId: string,
  ): Promise<TruckWithReview[]> {
    const trucks = await this.truckRepo.getScheduledJobTrucks(scheduledJobId);
    return Promise.all(
      trucks.map(async truck => {
        const isAlreadyReviewed = await this.truckForJobIsAlreadyReviewed(
          scheduledJobId,
          truck.id,
        );
        return {
          truck,
          reviewed: isAlreadyReviewed,
        };
      }),
    );
  }

  async getLastWeekJobsForTruck(truck: Truck): Promise<JobAssignation[]> {
    return this.jobAssignationRepo.findLastWeekAssignationsForTruck(truck);
  }

  async getTwoWeeksAgoJosForTruck(truck: Truck): Promise<JobAssignation[]> {
    return this.jobAssignationRepo.findTwoWeeksAgoAssignationsForTruck(truck);
  }

  private getJobCommodity(commodity: string): string {
    if (commodity === 'BY_HOUR') {
      return 'By hour';
    }
    if (commodity === 'BY_LOAD') {
      return 'By load';
    }
    if (commodity === 'BY_TON') {
      return 'By tons';
    }

    return 'Empty';
  }

  private assignDriverJobContent(
    job: Job,
    driver: Driver,
    category: JobCommodity,
  ): string {
    return `hey ${driver.name} You have been assigned to the job ${
      job.name
    }. Please attend to: \nLoad site: ${job.loadSite.address} \nDump site: ${
      job.dumpSite.address
    } \nStart time: ${format(
      new Date(job.startDate),
      'yyyy-MM-dd HH:mm a',
    )} \nFinish time: ${format(
      new Date(job.endDate),
      'yyyy-MM-dd HH:mm a',
    )} \nJob commodity: ${this.getJobCommodity(category)}`;
  }

  private editedDriverJobContent(
    job: Job,
    driver: Driver,
    editedValues: any,
  ): string {
    let string = `Hey ${driver.name} the job ${job.name} has been edited. These are the new details:
    `;

    for (const key in editedValues) {
      if (key !== 'Payment Due') {
        string += `\n${key}: ${editedValues[key]}`;
      }
    }

    return string;
  }

  private editedOwnerJobContent(
    job: Job,
    owner: Owner,
    editedValues: any,
  ): string {
    let string = `Hey ${owner.name} the job ${job.name} has been edited. These are the new details:
    `;

    for (const key in editedValues) {
      string += `\n${key}: ${editedValues[key]}`;
    }

    return string;
  }

  async sendForemanRequestTruck(
    job: RequestTruckDTO,
    user: Foreman,
  ): Promise<any> {
    const contractor = await this.userRepo.findContractorByForeman(user);
    const dispatchers = await this.userRepo.findDispatchers(contractor);
    const generalJob = await this.generalJobRepository.findById(job.generalJob);

    await this.emailService.sendContractorAndDispatchersRequestTruck(
      user?.name,
      contractor.email,
      job?.startDate,
      job?.endDate,
      job.loadSite?.address,
      job.dumpSite?.address,
      job.material,
      job.directions,
      job.truckCategories,
    );

    const notification = await this.notificationService.createNotification({
      ...RequestedTruck(generalJob.id, generalJob.name),
      userId: contractor.id,
    });

    this.eventEmitter.emit(
      'sendSocketNotification',
      notification,
      contractor.id,
    );

    await this.requestTruckRepo.requestTruck(job, user);

    // eslint-disable-next-line no-unused-expressions
    dispatchers?.forEach(async dispatcher => {
      const dispatcherNotification = await this.notificationService.createNotification(
        {
          ...RequestedTruck(generalJob.id, generalJob.name),
          userId: dispatcher.id,
        },
      );

      this.eventEmitter.emit(
        'sendSocketNotification',
        dispatcherNotification,
        dispatcher.id,
      );

      await this.emailService.sendContractorAndDispatchersRequestTruck(
        user?.name,
        dispatcher.email,
        job?.startDate,
        job?.endDate,
        job.loadSite?.address,
        job.dumpSite?.address,
        job.material,
        job.directions,
        job.truckCategories,
      );
    });
  }

  async finishActiveJob(jobId: string, user: User): Promise<boolean> {
    const job = await this.jobRepo.findJobById(jobId);

    await Promise.all(
      job.scheduledJobs.map(async scheduledJob => {
        await Promise.all(
          scheduledJob.assignations.map(async assignation => {
            await this.cancelTruckScheduleJob(
              job.id,
              assignation.truck.id,
              user,
            );
          }),
        );
      }),
    );

    await this.timerService.completeJob(job);

    return true;
  }

  async cancelTruckScheduleJob(
    jobId: string,
    truckId: string,
    user: User,
    switching = false,
  ): Promise<boolean> {
    let assignationsCount = 0;
    let hasMoreTrucks = false;
    const job = await this.jobRepo.findJobById(jobId);

    const truckCategories = job.truckCategories;
    const categories = [];

    const scheduledJob = job.scheduledJobs.find(scheduled => {
      const { assignations } = scheduled;

      const assignation = assignations.find(
        aux => aux.truck.id === truckId && !aux.finishedAt,
      );

      assignations.forEach(val => {
        if (!val.finishedAt) {
          assignationsCount += 1;
        }
      });

      if (assignation) {
        categories.push(assignation.category.id);
      }

      return !!assignation;
    });

    truckCategories.forEach(category => {
      if (
        !categories.find(cat => cat === category.id) &&
        !category.isActive &&
        !category.isScheduled
      ) {
        hasMoreTrucks = true;
      }
    });

    const assignation = scheduledJob.assignations.find(asign => {
      return asign.truck.id === truckId && !asign.finishedAt;
    });

    let response = false;

    const { driver } = assignation;
    const timeEntries = await this.getTimeEntries(job.id, driver);
    const totalTravels = await this.geolocationService.getTotalTravels(
      driver,
      job.id,
    );
    const hours = getRoundedHours(timeEntries);

    await Promise.all(
      timeEntries.map(async timeEntry => {
        if (timeEntry.endDate === null) {
          timeEntry.endDate = new Date();
          timeEntry.startDate = timeEntry.createdAt;
          await this.timeEntryRepo.save(timeEntry);
        }
      }),
    );

    if (!assignation.finishedAt) {
      assignation.load = totalTravels;
      assignation.totalTravels = totalTravels;
      assignation.finishedAt = new Date();
      assignation.finishByUser = false;
      assignation.finishedBy = user;
      assignation.hours = hours;

      await this.jobAssignationRepo.save(assignation);

      const notification = await this.notificationService.createNotification({
        ...CancelActiveJob(job?.generalJob.name, job?.orderNumber, user.name),
        userId: driver.id,
      });

      if (driver.deviceID && driver.deviceID.length && !switching) {
        this.eventEmitter.emit('sendNotification', {
          to: driver.deviceID,
          title: 'Clock Out',
          body: `Job: ${job?.generalJob.name} - Order Number: ${job?.orderNumber}`,
        });
      }

      if (!switching) {
        this.eventEmitter.emit(
          'sendSocketNotification',
          notification,
          driver.id,
        );

        const jobNotification = {
          cancelJob: true,
          isAutomaticallyFinished: true,
          message: `Clocked out. Job ${job?.name} - Order number ${job?.orderNumber} has been finished.`,
        };

        await this.jobNotificationRepo.saveNotification({
          ...jobNotification,
          job,
          user: driver,
        });

        console.info('Sending cancel active job notification!! ');

        this.eventEmitter.emit('cancelActiveJob', {
          cancelJob: true,
          currentJobId: job.id,
          message: `Hey ${driver.name}, you have been clocked out by ${user.role} ${user.name} from the job ${job.name} - Order number ${job.orderNumber}. Would you please add all evidence and any comment about this job?`,
          driverId: assignation.driver.id,
          isAutomaticallyFinished: false,
        });
      }

      response = true;
    }

    const remainingHours = moment(job.endDate).diff(new Date(), 'hours', true);
    const dateHasPassed = remainingHours <= 1;

    if (dateHasPassed) {
      await this.timerService.completeJob(job, false, dateHasPassed);
    } else if (assignationsCount === 1 && !hasMoreTrucks) {
      await this.timerService.completeJob(job);
    }
    return response;
  }

  async requestJobSwitch(switchJob: SwitchJobDTO): Promise<boolean> {
    await Promise.all(
      switchJob.assignationId.map(async assignationId => {
        const assignationToMove = await this.jobAssignationRepo.findById(
          assignationId,
        );

        if (assignationToMove.switchStatus === SwitchStatus.NOT_REQUESTED) {
          const { category, driver, truck } = assignationToMove;

          const initialScheduledJob = await this.scheduledJobRepo.findScheduledJobdWithAssignation(
            assignationId,
          );

          const switchData = {
            initialScheduledJobId: initialScheduledJob.id,
            finalScheduleJobId: null,
            status: SwitchStatus.REQUESTED,
            assignationId,
            finalJobId: switchJob.finalJobId,
          };

          // add truck type to final job
          const finalJob = await this.jobRepo.findById(switchJob.finalJobId);

          const truckType = new TruckCategory();
          truckType.truckTypes = category.truckTypes;
          truckType.truckSubtypes = category.truckSubtypes;
          truckType.price = category.price;
          truckType.job = finalJob;
          truckType.isScheduled = true;
          truckType.partnerRate = category.partnerRate;
          truckType.payBy = category.payBy;
          truckType.customerRate = category.customerRate;

          await this.truckCategoryRepo.save(truckType);

          // assign driver and truck to finalJob
          const { scheduledJobs } = finalJob;

          let hasOwnerScheduledJob = false;

          const newAssignation = new JobAssignation();
          newAssignation.driver = driver;
          newAssignation.truck = truck;
          newAssignation.category = truckType;
          newAssignation.price = assignationToMove.price;
          newAssignation.payBy = assignationToMove.payBy;
          newAssignation.partnerRate = assignationToMove.partnerRate;
          newAssignation.customerRate = assignationToMove.customerRate;

          truckType.assignation = newAssignation;

          if (scheduledJobs) {
            const ownerShceduledJob = scheduledJobs.find(
              schjob => schjob.company.id === driver.drivingFor.id,
            );

            if (ownerShceduledJob) {
              newAssignation.scheduledJob = ownerShceduledJob;
              hasOwnerScheduledJob = true;

              await this.jobAssignationRepo.save(newAssignation);

              switchData.finalScheduleJobId = ownerShceduledJob.id;
            }
          }

          if (!hasOwnerScheduledJob) {
            const newScheduledJob = await this.scheduledJobRepo.create({
              job: finalJob,
              company: driver.drivingFor,
              assignations: [newAssignation],
              paymentDue: finalJob.paymentDue,
            });

            switchData.finalScheduleJobId = newScheduledJob.id;
          }

          const switchRequested = await this.switchJobRepository.create(
            switchData,
          );

          const notification = {
            title: 'Switch job request',
            content:
              'There is a request for switching a job that has more priority to be finished',
            submitted: new Date(),
            isChecked: false,
            priority: 1,
            userId: driver.id,
            link: JSON.stringify({
              switchId: switchRequested.id,
            }),
          };

          this.eventEmitter.emit('sendNotification', {
            to: driver.deviceID,
            title: 'There is a switch job request for you',
            body:
              'request for switching a job that has more priority to be finished',
          });

          const newNotification = await this.notificationService.createNotification(
            notification,
          );

          this.eventEmitter.emit(
            'sendSocketNotification',
            newNotification,
            driver.id,
          );

          assignationToMove.switchStatus = SwitchStatus.REQUESTED;
          await this.jobAssignationRepo.save(assignationToMove);
        }
      }),
    );

    return true;
  }

  async acceptOrDenyJobSwitch(
    switchRequest: SwitchRequestDTO,
  ): Promise<{
      status: number;
      message: string;
    }> {
    const response = {
      status: 500,
      message: 'Internal Error',
    };
    if (switchRequest.desition === SwitchStatus.ACCEPTED) {
      const currSwitch = await this.switchJobRepository.findById(
        switchRequest.switchId,
      );

      const assignationToMove = await this.jobAssignationRepo.findById(
        currSwitch.assignationId,
      );

      // const { driver, truck } = assignationToMove;

      currSwitch.status = SwitchStatus.ACCEPTED;

      assignationToMove.switchStatus = SwitchStatus.ACCEPTED;
      await this.jobAssignationRepo.save(assignationToMove);

      // await this.cancelTruckScheduleJob(
      //   currSwitch.initialScheduledJobId,
      //   truck.id,
      //   true,
      // );

      // await this.timerService.clockIn(
      //   driver,
      //   currSwitch.finalJobId,
      //   switchRequest.location,
      //   true,
      // );

      await this.switchJobRepository.save(currSwitch);

      response.status = 200;
      response.message = 'Switch accepted successfully';
    } else if (switchRequest.desition === SwitchStatus.DENIED) {
      const currSwitch = await this.switchJobRepository.findById(
        switchRequest.switchId,
      );

      const assignationToMove = await this.jobAssignationRepo.findById(
        currSwitch.assignationId,
      );

      const finalScheduledJob = await this.scheduledJobRepo.findById(
        currSwitch.finalScheduleJobId,
      );

      const { assignations } = finalScheduledJob;

      const finalAssignation = assignations.find(
        assignation =>
          assignation.driver.id === assignationToMove.driver.id &&
          assignation.truck.id === assignationToMove.truck.id,
      );

      if (finalAssignation) {
        const { category } = finalAssignation;

        category.isScheduled = false;
        category.assignation = null;

        await this.truckCategoryRepo.save(category);

        if (assignations.length === 1) {
          await this.jobAssignationRepo.remove(finalAssignation.id);
          await this.scheduledJobRepo.remove(finalScheduledJob.id);
        } else {
          await this.jobAssignationRepo.remove(finalAssignation.id);
        }
      }

      currSwitch.status = SwitchStatus.DENIED;
      await this.switchJobRepository.save(currSwitch);

      assignationToMove.switchStatus = SwitchStatus.DENIED;
      await this.jobAssignationRepo.save(assignationToMove);

      response.status = 200;
      response.message = 'Switch denied successfully';
    }

    return response;
  }

  async notifyDriverClockIn(): Promise<void> {
    const assignations = await this.jobAssignationRepo.findAssignationsInsideLocation();
    assignations.forEach(async assignation => {
      const timeEntries = await this.getTimeEntries(
        assignation.scheduledJob.job.id,
        assignation.driver,
      );

      const isAssignationFinished =
        assignation.scheduledJob.job.status !== JobStatus.STARTED &&
        assignation.scheduledJob.job.status !== JobStatus.PENDING;

      if (
        timeEntries.length === 0 &&
        !isAssignationFinished &&
        assignation.notifications < 6 &&
        !assignation.scheduledJob.job.onHold
      ) {
        if (assignation.driver.deviceID?.length) {
          this.eventEmitter.emit('sendNotification', {
            to: assignation.driver.deviceID,
            title: 'WARNING!!!',
            body: `Dear ${assignation.driver.name} now you are able to do clock in, don't forget it. BE SAFE.`,
          });
        }
        const notification = await this.notificationService.createNotification({
          ...NotClockIn(assignation.driver.name),
          userId: assignation.driver.id,
        });

        this.eventEmitter.emit(
          'sendSocketNotification',
          notification,
          assignation.driver.id,
        );

        assignation.notifications += 1;

        this.jobAssignationRepo.save(assignation);
      }
    });
  }

  async checkSwitch(switchData: {
    switchId: string;
    actualJobId: string;
  }): Promise<{
      switch: boolean;
      job: Job;
    }> {
    const currentSwitch = await this.switchJobRepository.findById(
      switchData.switchId,
    );

    const finalJob = await this.jobRepo.findById(currentSwitch.finalJobId);
    const initialScheduledJob = await this.scheduledJobRepo.findById(
      currentSwitch.initialScheduledJobId,
    );

    const { job } = initialScheduledJob;

    if (
      currentSwitch.status === SwitchStatus.REQUESTED &&
      switchData.actualJobId === job.id
    )
      return {
        switch: true,
        job: finalJob,
      };

    return {
      switch: false,
      job: null,
    };
  }

  async extendFinishTime(id: string, finishDate: Date): Promise<string> {
    try {
      const job = await this.jobRepo.findById(id);
      job.endDate = finishDate;
      await this.jobRepo.save(job);
      return 'Finish time extended successfully';
    } catch (e) {
      throw new Error(`Something went wrong updating finish time: ${e}`);
    }
  }

  async getContractorWeeklyReport(
    contractorId: string,
    firstDay: string,
    lastDay: string,
  ): Promise<any> {
    try {
      const {
        jobTable,
        jobGraphic,
      } = await this.jobRepo.getContractorWeeklyData(
        contractorId,
        firstDay,
        lastDay,
      );

      const generalTable = [];
      let generalIndex = -1;
      let lastID = '';
      jobTable.forEach((job, index, jobArray) => {
        if (job.commodity === 'BY_LOAD')
          jobArray[index].price = job.loads && job.price * job.loads;
        else if (job.commodity === 'BY_HOUR')
          jobArray[index].price = job.time && job.price * job.time;
        else if (job.commodity === 'BY_TON')
          jobArray[index].price = job.tons && job.price * job.tons;

        if (lastID !== job.id) {
          lastID = job.id;
          generalIndex += 1;
          generalTable.push(jobArray[index]);
        } else {
          generalTable[generalIndex].loads += job.loads;
          generalTable[generalIndex].tons += job.tons;
          generalTable[generalIndex].price += job.price;
          generalTable[generalIndex].time += job.time;
        }
      });

      const contractor = await this.userRepo.findById(contractorId);
      const invoices = await this.invoiceService.getContractorInvoices(
        contractor,
        { skip: 0, count: 100, isPaid: undefined },
      );

      const invoiceTable = [];

      invoices.forEach(invoice => {
        const dueDate = new Date(invoice.dueDate);
        const disputesAmount = invoice.ownerInvoices.filter(
          ownerInvoice => ownerInvoice.disputeInvoice,
        ).length;
        if (dueDate > new Date(firstDay) && dueDate < new Date(lastDay)) {
          const itemToAdd = {
            invoiceNumber: `${String(invoice.contractorOrderNumber).padStart(
              3,
              '0',
            )}-${String(invoice.orderNumber).padStart(3, '0')}`,
            pastDue: 0,
            currentDue: 0,
            dueNextWeek: 0,
            paid: 0,
            disputes: disputesAmount,
          };

          if (dueDate < new Date() && !invoice.isPaid)
            invoiceTable.push({ ...itemToAdd, pastDue: invoice.amount || 0 });
          else if (invoice.isPaid)
            invoiceTable.push({ ...itemToAdd, paid: invoice.amount || 0 });
          else if (dueDate.getDay() < new Date().getDay() && !invoice.isPaid)
            invoiceTable.push({
              ...itemToAdd,
              dueNextWeek: invoice.amount || 0,
            });
          else
            invoiceTable.push({
              ...itemToAdd,
              currentDue: invoice.amount || 0,
            });
        }
      });

      return { generalTable, generalGraphic: jobGraphic, invoiceTable };
    } catch (e) {
      throw new Error(`Something went wrong: ${e}`);
    }
  }

  async getOwnerWeeklyReport(
    ownerId: string,
    firstDay: string,
    lastDay: string,
    firstWeek: string,
    lastWeek: string,
  ): Promise<any> {
    const owner = await this.userRepo.findById(ownerId);
    const ownerCompany = await this.ownerCompanyRepo.findOwnerCompany(ownerId);

    const ownerDrivers = await this.driverRepo.getAllOwnerDrivers(ownerCompany);
    const ownerTrucks = await this.truckRepo.getAllOwnerTrucks(ownerCompany.id);

    const invoices = await this.invoiceService.getOwnerInvoices(owner, {
      skip: 0,
      count: 100,
      isPaid: undefined,
    });

    const firstWeekday = new Date(firstWeek);
    const lastWeekday = new Date(lastWeek);

    const invoiceTable = [];
    invoices.forEach(invoice => {
      const dueDate = new Date(invoice.dueDate);
      const disputesAmount = invoice.disputeInvoice ? 1 : 0;
      if (dueDate > new Date(firstDay) && dueDate < new Date(lastDay)) {
        const itemToAdd = {
          invoiceNumber: `${String(invoice.invoiceNumber).padStart(
            3,
            '0',
          )}-${String(invoice.jobOrderNumber).padStart(3, '0')}`,
          unpaidWeek: 0,
          sales: 0,
          paid: 0,
          disputes: disputesAmount,
        };

        if (dueDate < new Date() && !invoice.isPaid)
          invoiceTable.push({ ...itemToAdd, unpaidWeek: invoice.amount || 0 });
        else if (invoice.isPaid)
          invoiceTable.push({ ...itemToAdd, paid: invoice.amount });
        else if (dueDate > new Date() && !invoice.isPaid)
          invoiceTable.push({
            ...itemToAdd,
            invoiceNumber: `${String(invoice.ownerOrderNumber).padStart(
              3,
              '0',
            )}-${String(invoice.jobOrderNumber).padStart(3, '0')}`,
            sales: invoice.amount,
          });
      }
    });

    const {
      driverTable,
      truckTable,
      driverPerformanceGraphic,
      companyPerformanceGraphic,
      trucksPerformanceGraphic,
    } = await this.jobRepo.getOwnerWeeklyData(
      ownerId,
      firstDay,
      lastDay,
      firstWeekday,
      lastWeekday,
    );

    const driverArray = this.getCompleteOwnerPeriods(
      driverPerformanceGraphic,
      ownerDrivers,
    );

    const trucksArray = this.getCompleteOwnerPeriods(
      trucksPerformanceGraphic,
      ownerTrucks,
    );

    return {
      incomeTable: invoiceTable,
      driverTable,
      truckTable,
      driverPerformanceGraphic: [
        ...driverArray,
        {
          name: '',
          time: undefined,
          week: (driverPerformanceGraphic.pop()?.week || -1) + 1,
        },
        {
          name: '',
          time: undefined,
          week: (driverPerformanceGraphic.pop()?.week || -1) + 3,
        },
      ],
      trucksPerformanceGraphic: [
        ...trucksArray,
        {
          name: '',
          time: undefined,
          week: (driverPerformanceGraphic.pop()?.week || -1) + 1,
        },
        {
          name: '',
          time: undefined,
          week: (driverPerformanceGraphic.pop()?.week || -1) + 3,
        },
      ],
      companyPerformanceGraphic: [
        ...companyPerformanceGraphic,
        {
          sales: undefined,
          week: (companyPerformanceGraphic.pop()?.week || -1) + 1,
        },
        {
          sales: undefined,
          week: (companyPerformanceGraphic.pop()?.week || -2) + 3,
        },
      ],
    };
  }

  async getAdminWeeklyReport(
    firstDay: string,
    lastDay: string,
    firstWeek: string,
    lastWeek: string,
  ): Promise<any> {
    const contractorInvoices = await this.invoiceService.getContractorInvoicesForAdmin(
      { skip: 0, count: 100, isPaid: undefined },
    );

    const allOwners = await this.userService.getAllOwners();
    const allContractors = await this.userRepo.getAllContractors();

    const firstWeekday = new Date(firstWeek);
    const lastWeekday = new Date(lastWeek);

    const {
      contractorTable,
      ownerTable,
      ownerGraphic,
      contractorGraphic,
      newCustomerGraphic,
    } = await this.jobRepo.getAdminWeeklyData(
      firstDay,
      lastDay,
      firstWeekday,
      lastWeekday,
    );
    contractorInvoices.forEach(invoice => {
      const { id } = invoice.job.generalJob;
      if (
        invoice.dueDate <= new Date(lastDay) &&
        invoice.dueDate >= new Date(firstDay)
      ) {
        contractorTable.forEach((table, index: number, tableArray) => {
          if (table.id === id) {
            tableArray[index].invoices += invoice.amount || 0;
          }
        });
      }
    });

    const ownerInvoicesTable = [];
    let hours = 0;
    let tons = 0;
    let loads = 0;
    let totalInvoices = 0;

    ownerTable.forEach(invoice => {
      hours += invoice.hours || 0;
      tons += invoice.tons || 0;
      loads += invoice.loads || 0;
      totalInvoices += invoice.amount || 0;
    });

    ownerInvoicesTable.push({
      owner: ownerTable[0]?.name || '',
      hours,
      tons,
      loads,
      totalInvoices: +totalInvoices.toFixed(2),
    });

    const newCustomerArray = this.getAdminCustomerGraphicData(
      newCustomerGraphic,
      firstWeekday,
      lastWeekday,
    );

    const resultingOwnerGraphic = this.getAdminCompletePeriods(
      ownerGraphic,
      allOwners,
    );
    const resultingContractorGraphic = this.getAdminCompletePeriods(
      contractorGraphic,
      allContractors,
    );

    return {
      contractorTable,
      ownerInvoicesTable,
      ownerGraphic: resultingOwnerGraphic,
      contractorGraphic: resultingContractorGraphic,
      newCustomerGraphic: newCustomerArray,
    };
  }

  async getMaterials(generalJobId: string): Promise<Material[]> {
    try {
      const generalJob = await this.generalJobRepository.findById(generalJobId);

      return this.materialRepo.find({ generalJob });
    } catch (err) {
      throw new Error(err);
    }
  }

  async getReportSelects(ID: string): Promise<any> {
    const response = await this.jobRepo.reportSelects(ID);

    const companySet = new Set<string>();
    const companyArray = [];
    const jobNameSet = new Set<string>();
    const jobArray = [];
    const materialsSet = new Set<string>();
    const materialsArray = [];
    const truckNumberSet = new Set<string>();
    const truckArray = [];

    response.forEach(res => {
      companySet.add(res.companyData);
      jobNameSet.add(res.name);
      materialsSet.add(res.material);
      truckNumberSet.add(res.number);
    });

    companySet.forEach(val => {
      const data = val.split('|');
      const ownerId = data[0];
      const companyName = data[1];
      companyArray.push({ ownerId, companyName });
    });

    jobNameSet.forEach(val => jobArray.push(val));
    materialsSet.forEach(val => materialsArray.push(val));
    truckNumberSet.forEach(val => truckArray.push(val));

    return {
      companies: companyArray,
      jobNames: jobArray,
      materials: materialsArray,
      trucks: truckArray,
    };
  }

  async getSettlementData(
    data: {
      owner?: string;
      jobs?: string[];
      trucks?: string[];
      materials?: string[];
    },
    startDate: string,
    endDate: string,
    contractor: string,
  ): Promise<any> {
    const settlementData = await this.jobRepo.getSettlementData(
      data,
      startDate,
      endDate,
      contractor,
    );

    return settlementData;
  }

  async getDataReport(ID: string): Promise<any> {
    const reponse = await this.jobRepo.DataTicketsReport(ID);
    return reponse;
  }

  async getInspectionReportData(inspectionNumber: number): Promise<any> {
    return this.truckService.getInspectionReportData(inspectionNumber);
  }

  exportExcel(data, workSheetColumnNames, workSheetName, filePath) {
    const workBook = xlsx.utils.book_new();
    const workSheetData = [workSheetColumnNames, ...data];
    const workSheet = xlsx.utils.aoa_to_sheet(workSheetData);
    xlsx.utils.book_append_sheet(workBook, workSheet, workSheetName);
    xlsx.writeFile(workBook, path.resolve(filePath));
  }

  exportUsersToExcel(users, workSheetColumnNames, workSheetName, filePath) {
    const data = users.map(item => {
      return [
        item.createdAt,
        item.number,
        item.ticket,
        0,
        item.orderNumber,
        item.commodity,
        item.material,
        item.rate,
        item.gross,
        0,
        item.net,
      ];
    });
    this.exportExcel(data, workSheetColumnNames, workSheetName, filePath);
  }

  exportExcelService = async (
    body: any,
    start: any,
    end: any,
    contractor: any,
  ): Promise<any> => {
    const response = await this.getSettlementData(body, start, end, contractor);
    const users = response;

    const workSheetColumnName = [
      'Date',
      'Truck',
      'Ticket',
      'QTY',
      'Job Number',
      'Commodity/Services',
      'Material',
      'Rate',
      'Gross',
      'App Fees',
      'Net',
    ];

    const workSheetName = 'Users';
    const filePath = './excel-from-js.xlsx';

    this.exportUsersToExcel(
      users,
      workSheetColumnName,
      workSheetName,
      filePath,
    );
  };

  async holdOrContinueJob(
    jobId: string,
    hold: boolean,
    type: string,
  ): Promise<boolean> {
    const drivers = [];
    const owners = [];
    let jobName = '';
    let jobOrderNumber: number;
    let ownerUser: Owner;
    const job = await this.jobRepo.findJobById(jobId);
    console.log();
    if (job.status === JobStatus.STARTED) {
      throw new JobHasActiveTrucksException();
    }
    try {
      if (type === 'scheduled') {
        await Promise.all(
          job.scheduledJobs.map(async scheduledJob => {
            const owner = scheduledJob.company.companyCommon.name;
            ownerUser = await scheduledJob.company.owner;
            owners.push(owner);

            scheduledJob.assignations.forEach(val => {
              drivers.push(val.driver);
            });
          }),
        );

        jobName = job.name;
        jobOrderNumber = job.orderNumber;
        job.onHold = hold;
        await this.jobRepo.save(job);
      }
      drivers.forEach(async driver => {
        const message = hold
          ? JobHoldedDriver(driver.name, jobName, jobOrderNumber)
          : JobResumedDriver(driver.name, jobName, jobOrderNumber);

        const notification = await this.notificationService.createNotification({
          ...message,
          userId: driver.id,
        });

        this.eventEmitter.emit(
          'sendSocketNotification',
          notification,
          driver.id,
        );

        this.eventEmitter.emit('sendNotification', {
          to: driver.deviceID,
          title: `Job has been ${hold ? 'put on hold' : 'resumed'}`,
          body: `Dear ${
            driver.name
          }, the job ${jobName} - ${jobOrderNumber} has been ${
            hold ? 'put on hold' : 'resumed'
          }`,
        });
      });
      owners.forEach(async owner => {
        const message = hold
          ? JobHoldedOwner(owner, jobName)
          : JobResumedOwner(owner, jobName);

        const notification = await this.notificationService.createNotification({
          ...message,
          userId: ownerUser.id,
        });

        this.eventEmitter.emit(
          'sendSocketNotification',
          notification,
          ownerUser.id,
        );

        if (ownerUser.deviceID) {
          this.eventEmitter.emit('sendNotification', {
            to: ownerUser.deviceID,
            title: `Job has been ${hold ? 'put on hold' : 'resumed'}`,
            body: `Dear ${owner}, the job ${jobName} has been ${
              hold
                ? 'put on hold, please pay attention for new instructions. Thanks for your patience.'
                : 'resumed'
            }`,
          });
        }
      });

      return true;
    } catch (err) {
      throw new Error(err);
    }
  }

  async duplicateJobOrder(jobId: string): Promise<void> {
    try {
      const job = await this.jobRepo.findJobById(jobId);

      const newJob = new Job();

      newJob.createdAt = new Date();
      newJob.generalJob = job.generalJob;
      newJob.dumpSite = job.dumpSite;
      newJob.loadSite = job.loadSite;
      newJob.directions = job.directions;
      newJob.endDate = new Date(
        moment()
          .add('2', 'hours')
          .toISOString(),
      );
      newJob.material = job.material;
      newJob.name = job.name;
      newJob.onSite = job.onSite;
      newJob.onHold = false;
      newJob.paymentDue = new Date();
      newJob.startDate = new Date();
      newJob.status = JobStatus.PENDING;

      const categories = job.truckCategories.map(cat => {
        const category = new TruckCategory();
        category.truckTypes = cat.truckTypes;
        category.truckSubtypes = cat.truckSubtypes;
        category.price = cat.price;
        category.customerRate = cat.customerRate;
        category.partnerRate = cat.partnerRate;
        category.payBy = cat.payBy;
        return category;
      });

      newJob.truckCategories = categories;
      newJob.user = job.user;

      await this.jobRepo.create(newJob);
    } catch (err) {
      throw new Error(err);
    }
  }

  private async returnJobCategories(
    job: Job,
    scheduled: boolean,
    newCategories: TruckCategory[],
    active: boolean,
  ): Promise<TruckCategory[]> {
    const categories = job.truckCategories;
    const truckCategories = {};

    if (scheduled) {
      if (active) {
        categories.forEach(cat => {
          if (
            (!cat.isActive && cat.isScheduled) ||
            (!cat.isActive && !cat.isScheduled)
          ) {
            truckCategories[cat.id] = cat;
          }
        });
      } else {
        categories.forEach(cat => {
          if (cat.isActive || !cat.isScheduled) {
            truckCategories[cat.id] = cat;
          }
        });
      }
    } else {
      categories.forEach(cat => {
        if (cat.isActive || cat.isScheduled) {
          truckCategories[cat.id] = cat;
        }
      });
    }

    const filteredCategories = Object.values(truckCategories) as any;

    return [...filteredCategories, ...newCategories];
  }

  async countTrucksActive(generalJobId: string): Promise<number> {
    return this.jobAssignationRepo.findTrucksActive(generalJobId);
  }

  async switchJobByMaterial(job: any, user: User): Promise<boolean> {
    try {
      const prevJobId = job.shiftId;
      const truckCategories = job.truckCategories as TruckCategory[];
      const preferredTrucks = job.preferredTrucks as TruckCategoryDTO[];
      const assignations = job.jobAssignations as JobAssignation[];

      const prevJob = await this.jobRepo.findJobById(prevJobId);
      delete prevJob.id;

      const newJob = await this.jobRepo.create({
        directions: prevJob.directions,
        dumpSite: prevJob.dumpSite,
        loadSite: prevJob.loadSite,
        material: job.material,
        endDate: job.endDate,
        paymentDue: job.paymentDue,
        onSite: prevJob.onSite,
        user: prevJob.user,
        startDate: job.startDate,
        name: prevJob.name,
        generalJob: prevJob.generalJob,
        status: prevJob.status,
      });

      const filteredCategories = truckCategories?.filter(category => {
        return !assignations.find(
          assignation => assignation.category.id === category.id,
        );
      });

      const filteredPreffered = preferredTrucks?.filter(category => {
        return !assignations.find(
          assignation => assignation.category.id === category.id,
        );
      });

      filteredPreffered?.forEach(async cat => {
        const category = new TruckCategory();
        category.truckTypes = cat.truckTypes;
        category.truckSubtypes = cat.truckSubtypes;
        category.price = cat.price;
        category.customerRate = cat.customerRate;
        category.partnerRate = cat.partnerRate;
        category.payBy = cat.payBy;
        category.isActive = cat.isActive;
        category.isScheduled = cat.isScheduled;
        category.job = newJob;
        await this.truckCategoryRepo.save(category);
      });

      filteredCategories?.forEach(async cat => {
        const category = new TruckCategory();
        category.truckTypes = cat.truckTypes;
        category.truckSubtypes = cat.truckSubtypes;
        category.price = cat.price;
        category.customerRate = cat.customerRate;
        category.partnerRate = cat.partnerRate;
        category.payBy = cat.payBy;
        category.isActive = cat.isActive;
        category.isScheduled = cat.isScheduled;
        category.job = newJob;
        await this.truckCategoryRepo.save(category);
      });

      const scheduledJobs = prevJob.scheduledJobs;

      await Promise.all(
        assignations.map(async assignation => {
          if (assignation.category.isActive) {
            this.requestJobSwitch({
              assignationId: [assignation.id],
              finalJobId: newJob.id,
            });
          } else {
            await this.finishTruck(prevJobId, assignation.truck.id, user);

            const newAssignation = assignation;
            delete newAssignation.id;
            const category = assignation.category;
            category.job = newJob;
            delete category.id;

            const scheduledJob = scheduledJobs.find(async schJob => {
              const driver = await this.driverRepo.findById(
                newAssignation.driver.id,
              );
              schJob.company.id === driver.drivingFor.id;
            });

            if (scheduledJob) {
              const newCategory = new TruckCategory();
              newCategory.truckTypes = category.truckTypes;
              newCategory.truckSubtypes = category.truckSubtypes;
              newCategory.price = [parseInt(assignation.price.toString(), 10)];
              newCategory.customerRate = [
                parseInt(assignation.customerRate.toString(), 10),
              ];
              newCategory.partnerRate = [
                parseInt(assignation.partnerRate.toString(), 10),
              ];
              newCategory.payBy = [assignation.payBy];
              newCategory.isActive = category.isActive;
              newCategory.isScheduled = category.isScheduled;
              newCategory.job = category.job;
              await this.truckCategoryRepo.save(category);

              delete scheduledJob.id;
              delete scheduledJob.assignations;

              scheduledJob.job = newJob;

              newAssignation.category = newCategory;
              scheduledJob.assignations = [newAssignation];

              await this.scheduledJobRepo.save(scheduledJob);

              // await this.jobAssignationRepo.save(newAssignation);

              this.eventEmitter.emit('updateJob', prevJobId);
            }
          }
        }),
      );
    } catch (err) {
      return true;
    }
    return true;
  }

  async finishTruck(
    jobId: string,
    truckId: string,
    user: User,
  ): Promise<boolean> {
    try {
      let assignationsCount = 0;
      let hasMoreTrucks = false;
      const job = await this.jobRepo.findJobById(jobId);

      const truckCategories = job.truckCategories;

      const categories = [];

      const scheduledJob = job.scheduledJobs.find(scheduled => {
        const { assignations } = scheduled;
        const assignation = assignations.find(
          aux => aux.truck.id === truckId && !aux.finishedAt,
        );

        assignations.forEach(val => {
          if (!val.finishedAt) {
            assignationsCount += 1;
          }
        });

        if (assignation) {
          categories.push(assignation.category.id);
        }

        return assignation;
      });

      truckCategories.forEach(category => {
        hasMoreTrucks = true;
        categories.forEach(cat => {
          if (cat === category.id) {
            hasMoreTrucks = false;
          }
        });
      });

      if (scheduledJob) {
        const assignation = scheduledJob.assignations.find(
          asign => asign.truck.id === truckId,
        );

        let response = false;

        if (!assignation.finishedAt) {
          assignation.load = 0;
          assignation.totalTravels = 0;
          assignation.finishedAt = new Date();
          assignation.finishByUser = true;
          assignation.finishedBy = user;
          assignation.hours = 0;

          if (!assignation.startedAt) assignation.startedAt = new Date();

          await this.jobAssignationRepo.save(assignation);
          response = true;
        }

        if (assignationsCount === 1 && !hasMoreTrucks) {
          await this.timerService.completeJob(job);
        }

        return response;
      }
      return false;
    } catch (err) {
      console.error(err);
      return false;
    }
  }

  private getCompleteOwnerPeriods(
    graphic: any[],
    allValues: Driver[] | Truck[],
  ): any[] {
    const graphicResultMap = new Map<
    string,
    { week: number; time: number }[]
    >();
    const resultingArray = [];
    let maxWeekNumber = 0;
    let maxAmount = 0;
    let prevWeekNumber = 0;

    graphic.forEach((value: any) => {
      if (graphicResultMap.has(value.name)) {
        const prevVal = graphicResultMap.get(value.name);
        graphicResultMap.set(value.name, [
          ...prevVal,
          { week: value.week, time: value.time },
        ]);
      } else {
        graphicResultMap.set(value.name, [
          { week: value.week, time: value.time },
        ]);
      }

      if (value.week !== prevWeekNumber) {
        prevWeekNumber = value.week;
        maxAmount += 1;
      }

      if (maxWeekNumber < value.week) maxWeekNumber = value.week;
    });

    allValues.forEach((value: any) => {
      if (!graphicResultMap.has(value.name || value.number)) {
        graphicResultMap.set(value.name || value.number, []);
      }
    });

    graphicResultMap.forEach((val, key, map) => {
      const arr = new Array(maxAmount);
      for (let i = 0; i < maxAmount; i += 1) arr[i] = 0;

      val.forEach((value: any) => {
        arr[maxWeekNumber - value.week] = { ...value };
      });

      map.set(key, arr);
    });

    graphicResultMap.forEach((val, key) => {
      val.forEach((value: any, index: number) => {
        if (value === 0) {
          resultingArray.push({
            name: key,
            time: 0,
            week: maxWeekNumber - index,
          });
        } else {
          resultingArray.push({
            name: key,
            time: value.time,
            week: value.week,
          });
        }
      });
    });

    resultingArray.sort((a, b) => {
      if (a.week < b.week) return -1;
      if (b.week < a.week) return 1;
      return 0;
    });

    return resultingArray;
  }

  private getAdminCompletePeriods(graphic: any[], allValues: any): any[] {
    const graphicResultMap = new Map<string, number>();

    const resultAuxMap = new Map<string, { week: number; amount: number }[]>();

    const resultingArray = [];
    let maxWeekNumber = 0;
    let maxAmount = 0;
    let prevWeekNumber = 0;

    graphic.forEach((value: any) => {
      const key = JSON.stringify({ name: value.name, week: value.week });
      if (graphicResultMap.has(key)) {
        const prevVal = graphicResultMap.get(key);
        graphicResultMap.set(key, prevVal + value.amount);
      } else {
        graphicResultMap.set(key, value.amount);
      }

      if (value.week !== prevWeekNumber) {
        prevWeekNumber = value.week;
        maxAmount += 1;
      }

      if (maxWeekNumber < value.week) maxWeekNumber = value.week;
    });

    graphicResultMap.forEach((value, key) => {
      const keyParsed = JSON.parse(key);
      if (!resultAuxMap.has(keyParsed.name)) {
        resultAuxMap.set(keyParsed.name, [
          { week: keyParsed.week, amount: value },
        ]);
      } else {
        const prevVal = resultAuxMap.get(keyParsed.name);
        resultAuxMap.set(keyParsed.name, [
          ...prevVal,
          { week: keyParsed.week, amount: value },
        ]);
      }
    });

    allValues.forEach((value: any) => {
      if (value.role === UserRole.CONTRACTOR) {
        if (!resultAuxMap.has(value.company.companyCommon.name)) {
          resultAuxMap.set(value.company.companyCommon.name, []);
        }
      } else if (!resultAuxMap.has(value.companyCommonName)) {
        resultAuxMap.set(value.companyCommonName, []);
      }
    });

    resultAuxMap.forEach((val, key, map) => {
      const arr = new Array(maxAmount);
      for (let i = 0; i < maxAmount; i += 1) arr[i] = 0;

      val.forEach((value: any) => {
        arr[maxWeekNumber - value.week] = { ...value };
      });

      map.set(key, arr);
    });

    resultAuxMap.forEach((val, key) => {
      val.forEach((value: any, index: number) => {
        if (value === 0) {
          resultingArray.push({
            name: key,
            amount: 0,
            week: maxWeekNumber - index,
          });
        } else {
          resultingArray.push({
            name: key,
            amount: value.amount,
            week: value.week,
          });
        }
      });
    });

    resultingArray.sort((a, b) => {
      if (a.week < b.week) return -1;
      if (b.week < a.week) return 1;
      return 0;
    });

    [1, 2].forEach(value => {
      resultingArray.push({
        name: '',
        amount: null,
        week: maxWeekNumber + value,
      });
    });

    return resultingArray;
  }

  private getAdminCustomerGraphicData(
    newCustomerGraphic: any[],
    firstWeekday: Date,
    lastWeekday: Date,
  ): any[] {
    const newCustomerGraphicMap = new Map<string, number>();
    const lastUsersMap = new Map<string, number>();
    const neededWeeks = [];

    const firstWeek = moment(firstWeekday).isoWeek();
    const lastWeek = moment(lastWeekday).isoWeek();

    for (let i = firstWeek; i < lastWeek + 1; i += 1) {
      neededWeeks.push(i);
    }

    const usersBeforeDates = [];
    const usersAfterDates = [];

    newCustomerGraphic.length > 0 &&
      newCustomerGraphic[0].forEach((customer: any) => {
        if (customer.createdWeek <= firstWeek) {
          usersBeforeDates.push(customer);
        } else {
          usersAfterDates.push(customer);
        }
      });
    newCustomerGraphic.length > 1 &&
      newCustomerGraphic[1].forEach((customer: any) => {
        if (customer.createdWeek <= firstWeek) {
          usersBeforeDates.push(customer);
        } else {
          usersAfterDates.push(customer);
        }
      });

    usersBeforeDates.forEach(user => {
      if (lastUsersMap.has(user.role)) {
        const prevValue = lastUsersMap.get(user.role);

        lastUsersMap.set(user.role, prevValue + 1);
      } else {
        lastUsersMap.set(user.role, 1);
      }
    });

    const newCustomerArray = [];

    lastUsersMap.forEach((value, key) => {
      newCustomerArray.push({
        role: key,
        week: firstWeek,
        amount: value,
      });
    });

    usersAfterDates.forEach(user => {
      const modUser = {
        ...user,
        week: user.createdWeek,
        deletedAtWeek: user.deletedWeek,
      };
      delete modUser.createdAt;

      const isDeletion = modUser.deletedAtWeek;
      const value = isDeletion ? -1 : 1;

      const key = JSON.stringify(modUser);
      if (newCustomerGraphicMap.has(key)) {
        const prevValue = newCustomerGraphicMap.get(key);

        if (isDeletion) {
          const previous = lastUsersMap.get(modUser.role);
          lastUsersMap.set(modUser.role, previous - 1);
        } else if (value + prevValue > lastUsersMap.get(modUser.role)) {
          const previous = lastUsersMap.get(modUser.role);
          lastUsersMap.set(modUser.role, previous + 1);
        }

        newCustomerGraphicMap.set(key, value + prevValue);
      } else {
        const lastValue = lastUsersMap.get(modUser.role);

        if (isDeletion) {
          const previous = lastUsersMap.get(modUser.role);
          lastUsersMap.set(modUser.role, previous - 1);
        } else if (value + lastValue > lastUsersMap.get(modUser.role)) {
          const previous = lastUsersMap.get(modUser.role);
          lastUsersMap.set(modUser.role, previous + value);
        }

        newCustomerGraphicMap.set(key, value + lastValue);
      }
    });

    newCustomerGraphicMap.forEach((value, key) => {
      const val = JSON.parse(key);
      newCustomerArray.push({
        role: val.role,
        week: val.week,
        amount: value,
      });
    });

    for (let i = firstWeek; i < lastWeek + 1; i += 1) {
      let hasOwnerForThisWeek = false;
      let hasContractorForThisWeek = false;
      let hasDriverForThisWeek = false;
      let hasTruckForThisWeek = false;
      let hasForemanForThisWeek = false;
      let hasDispatcherForThisWeek = false;

      newCustomerArray.forEach(value => {
        if (value.week === i) {
          if (value.role === 'DRIVER') hasDriverForThisWeek = true;
          else if (value.role === 'OWNER') hasOwnerForThisWeek = true;
          else if (value.role === 'DISPATCHER') hasDispatcherForThisWeek = true;
          else if (value.role === 'FOREMAN') hasForemanForThisWeek = true;
          else if (value.role === 'CONTRACTOR') hasContractorForThisWeek = true;
          else if (value.role === 'TRUCK') hasTruckForThisWeek = true;
        }
      });

      const maxWeek = i < 48 ? i - 1 : 48;

      newCustomerArray
        .sort((a, b) => {
          if (a.week < b.week) return -1;
          if (b.week < a.week) return 1;
          return 0;
        })
        .reverse();

      if (!hasOwnerForThisWeek) {
        const ownerMaxValue = newCustomerArray.find(
          value => value.week <= maxWeek && value.role === 'OWNER',
        );
        newCustomerArray.push({
          role: 'OWNER',
          week: i,
          amount: ownerMaxValue.amount,
        });
      }
      if (!hasContractorForThisWeek) {
        const contractorMaxValue = newCustomerArray.find(
          value => value.week <= maxWeek && value.role === 'CONTRACTOR',
        );
        newCustomerArray.push({
          role: 'CONTRACTOR',
          week: i,
          amount: contractorMaxValue.amount,
        });
      }
      if (!hasForemanForThisWeek) {
        const foremanMaxValue = newCustomerArray.find(
          value => value.week <= maxWeek && value.role === 'FOREMAN',
        );
        newCustomerArray.push({
          role: 'FOREMAN',
          week: i,
          amount: foremanMaxValue.amount,
        });
      }
      if (!hasDispatcherForThisWeek) {
        const dispatcherMaxValue = newCustomerArray.find(
          value => value.week <= maxWeek && value.role === 'DISPATCHER',
        );
        newCustomerArray.push({
          role: 'DISPATCHER',
          week: i,
          amount: dispatcherMaxValue.amount,
        });
      }
      if (!hasDriverForThisWeek) {
        const driverMaxValue = newCustomerArray.find(
          value => value.week <= maxWeek && value.role === 'DRIVER',
        );
        newCustomerArray.push({
          role: 'DRIVER',
          week: i,
          amount: driverMaxValue.amount,
        });
      }
      if (!hasTruckForThisWeek) {
        const truckMaxValue = newCustomerArray.find(
          value => value.week <= maxWeek && value.role === 'TRUCK',
        );
        newCustomerArray.push({
          role: 'TRUCK',
          week: i,
          amount: truckMaxValue.amount,
        });
      }
    }

    newCustomerArray.sort((a, b) => {
      if (a.week < b.week) return -1;
      if (b.week < a.week) return 1;
      return 0;
    });

    [1, 2].forEach(value => {
      newCustomerArray.push({
        role: '',
        week: value + lastWeek,
        amount: null,
      });
    });

    return newCustomerArray;
  }

  async changeDriverTravelTime(id: string, travelTime: string): Promise<void> {
    const driverInvoice = await this.driverJobInvoiceRepo.findOne({ id });

    driverInvoice.travelTime = travelTime;

    await this.driverJobInvoiceRepo.save(driverInvoice);
  }
}
