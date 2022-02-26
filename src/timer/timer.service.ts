import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectEventEmitter } from 'nest-emitter';
import { intervalToDuration } from 'date-fns';
import moment from 'moment';
import {
  ClockOutOwner,
  ClockOutContractor,
  ClockInContractor,
  ClockInOwner,
  ClockInForeman,
  ClockInDispatcher,
  ClockOutForeman,
  ClockOutDispatcher,
  EnteredJobRadius,
  LeavedJobRadius,
  DriverLeavedJobRadius,
  DriverLeavedRadiusContractor,
} from '../notification/notifications/notifications';

import { NotificationEventEmitter } from '../notification/notification.events';
import { TimeEntryRepo } from './time-entry.repository';
import { User } from '../user/user.model';
import { JobRepo } from '../jobs/job.repository';
import { Job } from '../jobs/job.model';
import { ScheduledJobRepo } from '../jobs/scheduled-job.repository';
import { StartFutureJobException } from './exceptions/start-future-job.exception';
import { ClockedInException } from './exceptions/clocked-in.exception';
import { ScheduledJob } from '../jobs/scheduled-job.model';
import { JobAssignation } from '../jobs/job-assignation.model';
import { JobAssignationRepo } from '../jobs/job-assignation.repository';
import { NotClockedInException } from './exceptions/not-clocked-in.exception';
import { NoActiveJobException } from './exceptions/no-active-job.exception';
import { JobStatus } from '../jobs/job-status';
import { FinishedJobException } from './exceptions/finished-job.exception';
import { TimeEntry } from './time-entry.model';
import { Driver } from '../user/driver.model';
import { S3Service } from '../s3/s3.service';
import { InvoicesEventEmitter } from '../invoices/invoices.events';
import { Location } from '../location/location.model';
import { LocationService } from '../location/location.service';
import { OutsideMinimalDistanceException } from './exceptions/outside-minimal-distance.exception';
import { JobInvoiceService } from '../invoices/job-invoice.service';
import { NotificationService } from '../notification/notification.service';
import { DriverJobInvoice } from '../invoices/driver-job-invoice.model';
import { UserRepo } from '../user/user.repository';
import { JobNotificationRepo } from '../jobs/job-notification.repository';
import { JobOnHoldException } from './exceptions/job-hold.exception';
import { getRoundedHours } from '../util/date-utils';
import { FinishJobDTO } from './dto/finish-job.dto';

@Injectable()
export class TimerService {
  private readonly MINIMAL_DISTANCE_IN_MILES = 1.24274;
  constructor(
    private readonly timeEntryRepo: TimeEntryRepo,
    private readonly jobRepo: JobRepo,
    private readonly userRepo: UserRepo,
    private readonly scheduledJobRepo: ScheduledJobRepo,
    private readonly jobAssignationRepo: JobAssignationRepo,
    private readonly notificationService: NotificationService,
    private readonly locationService: LocationService,
    private s3Service: S3Service,
    private readonly invoiceService: JobInvoiceService,
    @InjectEventEmitter()
    private readonly invoicesEventEmitter: InvoicesEventEmitter,
    @InjectEventEmitter()
    private readonly notificationEventEmitter: NotificationEventEmitter,
    private readonly jobNotificationRepo: JobNotificationRepo,
  ) {}

  async getTimeEntries(user: User, jobId: string): Promise<TimeEntry[]> {
    const job = await this.jobRepo.findJobById(jobId);

    const assignation = this.getAssignationForTimeEntries(
      user,
      job.scheduledJobs,
    );

    return this.timeEntryRepo.findTimeEntriesForUserAndJob(
      user,
      jobId,
      assignation,
    );
  }

  async createTimeEntry(
    timeEntry: Omit<TimeEntry, 'createdAt' | 'updatedAt' | 'id'>,
  ): Promise<TimeEntry> {
    return this.timeEntryRepo.create(timeEntry);
  }

  async clockIn(
    user: Driver,
    jobId: string,
    location: Location,
    switching = false,
  ): Promise<void> {
    const job = await this.jobRepo.findById(jobId);
    const scheduledJobs = await this.scheduledJobRepo.find({
      job,
      company: user.drivingFor,
    });
    const contractor = job.user;

    if (job.onHold) {
      throw new JobOnHoldException();
    }

    await this.validateJobClockIn(
      user,
      job,
      scheduledJobs,
      location,
      switching,
    );

    const assignation = this.getAssignationForClockIn(user, scheduledJobs);
    const startDate = new Date();
    const timeEntry = {
      startDate,
      user,
      job,
      truck: assignation.truck,
      driverAssignation: assignation,
    };

    await this.timeEntryRepo.create(timeEntry);

    await this.startJob(user, scheduledJobs);

    let todeviceID = '';
    const owner = await user.drivingFor.owner;

    const Dispatchers = await this.userRepo.findDispatchers(job.user);
    const Foremans = await this.userRepo.findForemans(job.user);

    // eslint-disable-next-line guard-for-in
    for (const key in Dispatchers) {
      const element = Dispatchers[key];

      const notification = await this.notificationService.createNotification({
        ...ClockInDispatcher(job.name, 'truck#'),
        userId: element.id,
      });

      this.notificationEventEmitter.emit(
        'sendSocketNotification',
        notification,
        element.id,
      );
    }

    // eslint-disable-next-line guard-for-in
    for (const key in Foremans) {
      const element = Foremans[key];

      const notification = await this.notificationService.createNotification({
        ...ClockInForeman(job.name, 'truck#'),
        userId: element.id,
      });

      this.notificationEventEmitter.emit(
        'sendSocketNotification',
        notification,
        element.id,
      );
    }

    const notification = await this.notificationService.createNotification({
      ...ClockInOwner(job.name, user.name),
      userId: owner.id,
    });

    this.notificationEventEmitter.emit(
      'sendSocketNotification',
      notification,
      owner.id,
    );

    const newNotification = await this.notificationService.createNotification({
      ...ClockInContractor(job.name, assignation.truck.number),
      userId: contractor.id,
    });

    this.notificationEventEmitter.emit(
      'sendSocketNotification',
      newNotification,
      contractor.id,
    );

    if (owner.deviceID) {
      todeviceID = owner.deviceID;
    }
    if (todeviceID.length > 0) {
      this.notificationEventEmitter.emit('sendNotification', {
        to: todeviceID,
        title: 'Clock in',
        body: `Driver ${user.name} is starting job ${job.name}`,
      });
    }
    // await this.emailService.sendToOwnerJobStarted(
    //   job.name,
    //   owner.email,
    //   user.name,
    // );
  }

  async checkIsInsideArea(
    user: Driver,
    jobId: string,
    location: Location,
  ): Promise<void> {
    const job = await this.jobRepo.findById(jobId);

    const scheduledJobs = await this.scheduledJobRepo.find({
      job,
      company: user.drivingFor,
    });
    const assignation = this.getAssignation(user, scheduledJobs);
    const driverLocation = this.locationService.locationToLatLong(location);
    const center = this.locationService.locationToLatLong(job.loadSite);

    const activeTimeEntry = await this.timeEntryRepo.findActive(user);
    console.log(driverLocation, center);
    console.log(
      this.locationService.isInsideRadius(
        driverLocation,
        center,
        this.MINIMAL_DISTANCE_IN_MILES,
      ),
    );
    if (assignation) {
      if (
        this.locationService.isInsideRadius(
          driverLocation,
          center,
          this.MINIMAL_DISTANCE_IN_MILES,
        ) &&
        assignation.isInSite === false
      ) {
        assignation.isInSite = true;

        this.jobAssignationRepo.save(assignation);

        if (!activeTimeEntry) {
          if (
            assignation.driver.deviceID &&
            assignation.driver.deviceID.length > 0
          ) {
            this.notificationEventEmitter.emit('sendNotification', {
              to: assignation.driver.deviceID,
              title: 'WARNING!!!',
              body: `Hey ${assignation.driver.name}, you just entered clock in radius. Start clocking in! let us know if something is wrong at 919 946-8860 EZ DUMP TRUCK INC`,
            });
          }
          const notification = await this.notificationService.createNotification(
            {
              ...EnteredJobRadius(assignation.driver.name),
              userId: assignation.driver.id,
            },
          );

          this.notificationEventEmitter.emit(
            'sendSocketNotification',
            notification,
            assignation.driver.id,
          );
        }
      } else if (
        !this.locationService.isInsideRadius(
          driverLocation,
          center,
          this.MINIMAL_DISTANCE_IN_MILES,
        ) &&
        assignation.isInSite === true
      ) {
        assignation.isInSite = false;
        const owner = await scheduledJobs[0].company.owner;
        this.jobAssignationRepo.save(assignation);
        if (!activeTimeEntry) {
          if (owner.deviceID && owner.deviceID.length > 0) {
            this.notificationEventEmitter.emit('sendNotification', {
              to: owner.deviceID,
              title: 'WARNING!!!',
              body: `Hey ${owner.name}, your driver ${assignation.driver.name} forgot to clock in!! Please try to contact him to find out what is going on and let us know if you need some help, we are here for you. EZ DUMP TRUCK INC 919 946-8860`,
            });
          }
          const notification = await this.notificationService.createNotification(
            {
              ...DriverLeavedJobRadius(assignation.driver.name, owner.name),
              userId: owner.id,
            },
          );

          this.notificationEventEmitter.emit(
            'sendSocketNotification',
            notification,
            owner.id,
          );

          if (
            assignation.driver.deviceID &&
            assignation.driver.deviceID.length > 0
          ) {
            this.notificationEventEmitter.emit('sendNotification', {
              to: assignation.driver.deviceID,
              title: 'WARNING!!!',
              body: `Hey ${assignation.driver.name}, you forgot to clock in, please come back to the load site to clock in, or let us know if something is wrong. Please contact us at 919 946-8860 EZ DUMP TRUCK INC`,
            });
          }
          const newNotification = await this.notificationService.createNotification(
            {
              ...LeavedJobRadius(assignation.driver.name),
              userId: assignation.driver.id,
            },
          );

          this.notificationEventEmitter.emit(
            'sendSocketNotification',
            newNotification,
            assignation.driver.id,
          );

          await this.notificationService.createNotification({
            ...DriverLeavedRadiusContractor(
              assignation.driver.name,
              owner.name,
              scheduledJobs[0].job.user.name,
            ),
            userId: scheduledJobs[0].job.user.id,
          });

          this.notificationEventEmitter.emit('sendTextMessage', {
            body: `Hey ${owner.name}, your driver ${assignation.driver.name} forgot to clock in!! Please try to contact him to find out what is going on and let us know if you need some help, we are here for you. EZ DUMP TRUCK INC 919 946-8860`,
            to: owner.phoneNumber,
          });
          this.notificationEventEmitter.emit('sendTextMessage', {
            body: `Hey ${assignation.driver.name}, you forgot to clock in, please come back to the load site to clock in, or let us know if something is wrong.
              please contact us at 919 946-8860 EZ DUMP TRUCK INC`,
            to: assignation.driver.phoneNumber,
          });
        }
      }
    }
  }

  public async validateJobClockIn(
    user: User,
    job: Job,
    scheduledJobs: ScheduledJob[],
    location: Location,
    switching = false,
  ): Promise<void> {
    const assignation = this.getAssignationForClockIn(user, scheduledJobs);

    if (moment(job.startDate) > moment(new Date()).add(1, 'hours')) {
      throw new StartFutureJobException();
    }
    if (!this.hasJobScheduled(assignation, scheduledJobs)) {
      throw new NotFoundException('Scheduled Job');
    }

    if (
      ((!!assignation.startedAt && !assignation.finishedAt) ||
        (await this.isClockedIn(user))) &&
      !switching
    ) {
      throw new ClockedInException();
    }

    const driverLocation = this.locationService.locationToLatLong(location);
    const center = this.locationService.locationToLatLong(job.loadSite);
    console.info('Locations: ', driverLocation, center);
    if (
      !this.locationService.isInsideRadius(
        driverLocation,
        center,
        this.MINIMAL_DISTANCE_IN_MILES,
      ) && // &&
      !switching
    )
      throw new OutsideMinimalDistanceException();
    if (assignation.finishedAt && job.status === JobStatus.DONE)
      throw new FinishedJobException();
  }

  private hasJobScheduled(
    assignation: JobAssignation,
    scheduledJobs: ScheduledJob[],
  ): boolean {
    return !!assignation && !!scheduledJobs.length;
  }

  public getAssignation(
    user: User,
    scheduledJobs: ScheduledJob[],
  ): JobAssignation {
    const data = scheduledJobs.reduce((acc, scheduledJob) => {
      const driverAssignation = scheduledJob.assignations.find(
        assignation => assignation.driver?.id === user.id,
      );
      return driverAssignation || acc;
    }, null as JobAssignation);

    return data;
  }

  private getAssignationForClockIn(
    user: User,
    scheduledJobs: ScheduledJob[],
  ): JobAssignation {
    const data = scheduledJobs.reduce((acc, scheduledJob) => {
      const driverAssignation = scheduledJob.assignations.find(
        assignation =>
          assignation.driver?.id === user.id &&
          !assignation.finishedAt &&
          !assignation.startedAt &&
          assignation.category,
      );
      return driverAssignation || acc;
    }, null as JobAssignation);

    return data;
  }

  private getAssignationForTimeEntries(
    user: User,
    scheduledJobs: ScheduledJob[],
  ): JobAssignation {
    const data = scheduledJobs.reduce((acc, scheduledJob) => {
      const driverAssignation = scheduledJob.assignations.find(
        assignation =>
          assignation.driver?.id === user.id && !assignation.finishedAt,
      );
      return driverAssignation || acc;
    }, null as JobAssignation);

    return data;
  }

  private getAssignationForFinishJob(
    user: User,
    scheduledJobs: ScheduledJob[],
    truckId: string,
  ): JobAssignation {
    console.info('Truck id: ', truckId);
    console.info('User id: ', user.id);
    const data = scheduledJobs.reduce((acc, scheduledJob) => {
      const driverAssignation = scheduledJob.assignations.find(
        assignation =>
          assignation.driver?.id === user.id &&
          assignation.truck.id === truckId,
      );
      return driverAssignation || acc;
    }, null as JobAssignation);

    return data;
  }

  private async isClockedIn(user: User): Promise<boolean> {
    return !!(await this.scheduledJobRepo.findActiveScheduledJob(user));
  }

  async break(user: User): Promise<void> {
    const activeTimeEntry = await this.timeEntryRepo.findActive(user);
    console.log('Active time entry when breaking', activeTimeEntry);
    if (!activeTimeEntry) throw new NotClockedInException();
    activeTimeEntry.endDate = new Date();
    await this.timeEntryRepo.save(activeTimeEntry);
  }

  async breakJobById(user: User, jobId: string): Promise<void> {
    const activeTimeEntry = await this.timeEntryRepo.findActiveByJobId(
      user,
      jobId,
    );
    console.log('Active Time Entry when finishing', activeTimeEntry);
    if (!activeTimeEntry) throw new NotClockedInException();
    activeTimeEntry.endDate = new Date();
    await this.timeEntryRepo.save(activeTimeEntry);
  }

  async resume(user: User, truckId: string): Promise<void> {
    const activeScheduledJob = await this.scheduledJobRepo.findActiveScheduledJob(
      user,
    );

    if (!activeScheduledJob) throw new NoActiveJobException();

    const activeTimeEntry = await this.timeEntryRepo.findActive(user);

    if (activeTimeEntry) throw new ClockedInException();

    const assignation = this.getAssignationForFinishJob(
      user,
      [activeScheduledJob],
      truckId,
    );
    const startDate = new Date();
    const timeEntry = {
      startDate,
      user,
      truck: assignation.truck,
      job: activeScheduledJob.job,
      driverAssignation: assignation,
    };
    await this.timeEntryRepo.create(timeEntry);
  }

  async updateDriverInvoiceOwner(id: string, body: FinishJobDTO): Promise<any> {
    return this.invoiceService.updateDriverInvoiceOwner(id, body);
  }

  async finishJob(
    user: Driver,
    signature: string,
    tons: number,
    load: number,
    evidenceImgs: string[],
    totalTravels: number,
    comment: string,
    jobId?: string,
    supervisorComment?: string,
    supervisorName?: string,
    timeSupervisor?: number,
  ): Promise<void> {
    let activeScheduledJob: ScheduledJob = null;
    let driverInvoice: DriverJobInvoice = null;

    if (jobId) {
      activeScheduledJob = await this.scheduledJobRepo.findScheduledJobByDriver(
        user,
        jobId,
      );
    } else {
      activeScheduledJob = await this.scheduledJobRepo.findActiveScheduledJob(
        user,
      );
    }

    const currJob = await this.jobRepo.findJobById(activeScheduledJob.job.id);

    if (!activeScheduledJob) throw new NoActiveJobException();

    await this.breakJobById(user, activeScheduledJob.job.id);

    const { assignations } = activeScheduledJob;
    const { truck } = assignations.find(assig => assig.driver.id === user.id);

    let supervisorTimeSeconds: number;

    if (timeSupervisor) {
      let supervisorHours = 0;
      let supervisorMinutes = 0;

      const travelDate = intervalToDuration({
        start: 0,
        end: timeSupervisor * 1000,
      });

      if (travelDate.minutes >= 53) {
        supervisorHours = travelDate.hours + 1;
      } else {
        supervisorHours = travelDate.hours;
        supervisorMinutes = Math.round(travelDate.minutes / 15) * 15;
      }

      supervisorTimeSeconds =
        supervisorHours * 60 * 60 + supervisorMinutes * 60;
    }
    await this.updateFinishedAssignation(
      user,
      [activeScheduledJob],
      signature,
      tons,
      load,
      evidenceImgs,
      totalTravels,
      comment,
      supervisorComment,
      supervisorName,
      supervisorTimeSeconds,
      jobId || activeScheduledJob.job.id,
    );

    const contractor = activeScheduledJob.job.user;
    const owner = await user.drivingFor.owner;
    let todeviceID = '';
    if (owner.deviceID) {
      todeviceID = owner.deviceID;
    }

    if (todeviceID.length > 0) {
      this.notificationEventEmitter.emit('sendNotification', {
        to: todeviceID,
        title: 'Clock out',
        body: `Driver ${user.name} finished the job ${activeScheduledJob.job.name}.`,
      });
    }
    const job = this.getJobOutOfScheduledJobs([activeScheduledJob]);
    await this.timeEntryRepo.updateLoadTimeWhenFinishing(job.id, truck.id);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    await this.invoiceService.generateOwnerInvoice(activeScheduledJob, job);

    const assignation = this.getAssignationForFinishJob(
      user,
      [activeScheduledJob],
      truck.id,
    );

    if (jobId && assignation.finishByUser) {
      driverInvoice = await this.invoiceService.updateDriverInvoice(
        assignation,
        job,
      );
    } else {
      driverInvoice = await this.invoiceService.generateDriverInvoice(
        assignation,
        job,
        0,
      );
    }

    const Dispatchers = await this.userRepo.findDispatchers(job.user);
    const Foremans = await this.userRepo.findForemans(job.user);

    // eslint-disable-next-line guard-for-in
    for (const key in Dispatchers) {
      const element = Dispatchers[key];

      const notification = await this.notificationService.createNotification({
        ...ClockOutDispatcher(
          activeScheduledJob.job.name,
          'TruckNumber',
          driverInvoice?.amount || 0,
        ),
        userId: element.id,
      });

      this.notificationEventEmitter.emit(
        'sendSocketNotification',
        notification,
        element.id,
      );
    }
    // eslint-disable-next-line guard-for-in
    for (const key in Foremans) {
      const element = Foremans[key];

      const notification = await this.notificationService.createNotification({
        ...ClockOutForeman(
          activeScheduledJob.job.name,
          'TruckNumber',
          driverInvoice?.amount || 0,
        ),
        userId: element.id,
      });

      this.notificationEventEmitter.emit(
        'sendSocketNotification',
        notification,
        element.id,
      );
    }

    const notification = await this.notificationService.createNotification({
      ...ClockOutOwner(
        activeScheduledJob.job.name,
        driverInvoice?.amount || 0,
        user.name,
      ),
      userId: owner.id,
    });

    this.notificationEventEmitter.emit(
      'sendSocketNotification',
      notification,
      owner.id,
    );

    const newNotification = await this.notificationService.createNotification({
      ...ClockOutContractor(
        activeScheduledJob.job.name,
        driverInvoice?.amount.toFixed(2) || 0,
        truck.number,
      ),
      userId: contractor.id,
    });

    this.notificationEventEmitter.emit(
      'sendSocketNotification',
      newNotification,
      contractor.id,
    );

    let hasMoreTrucks = false;

    const { truckCategories } = currJob;

    truckCategories.forEach(truckCategory => {
      if (!truckCategory.isActive && !truckCategory.isScheduled)
        hasMoreTrucks = true;
    });

    const remainingHours = moment(job.endDate).diff(new Date(), 'hours', true);

    console.info('Remaining hours: ', remainingHours);

    const dateHasPassed = remainingHours <= 1;

    if (!hasMoreTrucks || dateHasPassed) {
      await this.completeJob(activeScheduledJob.job, true, dateHasPassed);
    }
  }

  async addEvidenceToFinishedJob(
    user: Driver,
    signature: string,
    tons: number,
    load: number,
    evidenceImgs: string[],
    totalTravels: number,
    comment: string,
    jobId?: string,
    supervisorComment?: string,
    supervisorName?: string,
    timeSupervisor?: number,
  ): Promise<void> {
    let activeScheduledJob: ScheduledJob = null;

    if (jobId) {
      activeScheduledJob = await this.scheduledJobRepo.findScheduledJobByDriver(
        user,
        jobId,
      );
    } else {
      activeScheduledJob = await this.scheduledJobRepo.findActiveScheduledJob(
        user,
      );
    }

    if (!activeScheduledJob) throw new NoActiveJobException();

    const beforeUpdateAssignation = this.getAssignation(user, [
      activeScheduledJob,
    ]);

    const assignation = await this.updateFinishedAssignation(
      user,
      [activeScheduledJob],
      signature,
      tons,
      load,
      evidenceImgs,
      beforeUpdateAssignation.totalTravels,
      comment,
      beforeUpdateAssignation.supervisorComment,
      beforeUpdateAssignation.supervisorName,
      beforeUpdateAssignation.travelTimeSupervisor,
      activeScheduledJob.job.id,
    );

    await this.invoiceService.updateDriverInvoiceEvidence(
      assignation,
      activeScheduledJob.job,
    );
  }

  private async startJob(
    user: User,
    scheduledJobs: ScheduledJob[],
  ): Promise<void> {
    const [scheduledJob] = scheduledJobs;
    const { job } = scheduledJob;

    if (job.status === JobStatus.PENDING) {
      job.status = JobStatus.STARTED;

      await this.jobRepo.save(job);
    }

    const assignation = this.getAssignationForClockIn(user, scheduledJobs);

    assignation.startedAt = new Date();
    assignation.category.isActive = true;

    await this.jobAssignationRepo.save(assignation);
  }

  async finishIncompletedJob(job: Job): Promise<void> {
    job.status = JobStatus.INCOMPLETE;
    await this.jobRepo.save(job);
  }

  async completeJob(
    job: Job,
    finishedByUser = false,
    dateHasPassed = false,
  ): Promise<void> {
    const allScheduledJobs = await this.scheduledJobRepo.findJobScheduledJobs(
      job,
    );

    const activeAssignations = [];
    let notFinishedAssignations = 0;

    if (dateHasPassed) {
      allScheduledJobs.forEach(schJob => {
        schJob.assignations.forEach(assign => {
          if (assign.category.isActive) activeAssignations.push(assign);
        });
      });

      activeAssignations.forEach(assign => {
        if (!assign.finishedAt) notFinishedAssignations += 1;
      });
    }

    const isJobFinished = allScheduledJobs.reduce((acc, schJob) => {
      return acc && schJob.isFinished();
    }, true);
    if (isJobFinished || (dateHasPassed && notFinishedAssignations === 0)) {
      job.status = JobStatus.DONE;

      job.finishedAt = new Date();
      await this.jobRepo.save(job);
      this.invoicesEventEmitter.emit('jobFinished', job.id);

      const jobNotification = {
        cancelJob: true,
        isAutomaticallyFinished: true,
        message: `Clocked out. Job ${job.name} - Order number ${job.orderNumber} has been finished.`,
      };

      if (!finishedByUser) {
        await Promise.all(
          allScheduledJobs.map(val => {
            return val.assignations.map(async assign => {
              await this.jobNotificationRepo.saveNotification({
                ...jobNotification,
                job,
                user: assign.driver,
              });
              return [];
            });
          }),
        );
      }

      this.notificationEventEmitter.emit('cancelActiveJob', {
        ...jobNotification,
        currentJobId: job.id,
        driverId: 'all',
      });
    }
  }

  private async updateFinishedAssignation(
    user: User,
    scheduledJobs: ScheduledJob[],
    signature: string,
    tons: number,
    load: number,
    evidenceImgs: string[],
    totalTravels: number,
    comment: string,
    supervisorComment: string,
    supervisorName: string,
    timeSupervisor: number,
    jobId: string,
  ): Promise<JobAssignation> {
    const assignation = this.getAssignation(user, scheduledJobs);

    const timeEntries = await this.timeEntryRepo.findTimeEntriesForUserAndJob(
      assignation.driver,
      jobId,
      assignation,
    );

    const hours = getRoundedHours(timeEntries);

    console.info('Got hours rounded: ', hours);
    console.info('Got tons: ', tons);
    console.info('Got loads: ', load);

    if (!assignation.finishedAt) {
      assignation.finishedAt = new Date();
    }
    assignation.signatureImg = signature;
    assignation.evidenceImgs = evidenceImgs;
    assignation.totalTravels = totalTravels;
    assignation.comment = comment;
    assignation.finishByUser = true;
    assignation.finishedBy = user;
    assignation.supervisorComment = supervisorComment;
    assignation.supervisorName = supervisorName;
    assignation.travelTimeSupervisor = timeSupervisor;
    assignation.tons = tons || 0;
    assignation.load = load || 0;
    assignation.hours = hours || 0;
    return this.jobAssignationRepo.save(assignation);
  }

  private getJobOutOfScheduledJobs(scheduledJobs: ScheduledJob[]): Job {
    const [scheduledJob] = scheduledJobs;
    const { job } = scheduledJob;
    return job;
  }

  async getUploadImageLink(user: User, jobId?: string): Promise<string> {
    let activeScheduledJob: ScheduledJob = null;

    if (jobId) {
      activeScheduledJob = await this.scheduledJobRepo.findScheduledJobByDriver(
        user,
        jobId,
      );
    } else {
      activeScheduledJob = await this.scheduledJobRepo.findActiveScheduledJob(
        user,
      );
    }
    const assignation = this.getAssignation(user, [activeScheduledJob]);

    return this.s3Service.getUploadImageImageUrl(
      activeScheduledJob.job.id,
      assignation.id,
    );
  }
}
