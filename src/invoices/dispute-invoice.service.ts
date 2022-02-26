import { Injectable } from '@nestjs/common';
import moment from 'moment';
import { InjectEventEmitter } from 'nest-emitter';
import { ContractorCompany } from '../company/contractor-company.model';
import { OwnerCompany } from '../company/owner-company.model';
import { EmailService } from '../email/email.service';
import { Loads } from '../geolocation/loads.model';
import { JobInvoiceRepo } from '../invoices/job-invoice.repository';
import { JobAssignationRepo } from '../jobs/job-assignation.repository';
import { Job } from '../jobs/job.model';
import { ScheduledJobRepo } from '../jobs/scheduled-job.repository';
import { NotificationEventEmitter } from '../notification/notification.events';
import { NotificationService } from '../notification/notification.service';
import {
  DisputeAccepted,
  DisputeStarted,
  NewdisputesMessage,
} from '../notification/notifications/messages';
import {
  DisputedAcceptedNotification,
  DisputeStartedNotification,
  NewDispute,
  NewDisputeOwner,
} from '../notification/notifications/notifications';
import { S3Service } from '../s3/s3.service';
import { Contractor } from '../user/contractor.model';
import { Owner } from '../user/owner.model';
import { User, UserRole } from '../user/user.model';
import { UserRepo } from '../user/user.repository';
import { DisputeInvoiceStatus } from './dispute-invoice-status';
import { DisputeInvoice } from './dispute-invoice.model';
import { DisputeInvoiceRepo } from './dispute-invoice.repository';
import { DisputeLoads } from './dispute-loads.model';
import { DisputeLoadsRepo } from './dispute-loads.repository';
import { DriverJobInvoice } from './driver-job-invoice.model';
import { DriverJobInvoiceRepo } from './driver-job-invoice.repository';
import { DriverJobInvoiceService } from './driver-job-invoice.service';
import { DisputeInvoiceSolvedDTO } from './dto/dispute-invoice-solved.dto';
import { JobInvoiceService } from './job-invoice.service';
import { OwnerJobInvoice } from './owner-job-invoice.model';
import { OwnerJobInvoiceRepo } from './owner-job-invoice.repository';

@Injectable()
export class DisputeInvoiceService {
  constructor(
    private readonly notificationService: NotificationService,
    private readonly ownerInvoiceRepo: OwnerJobInvoiceRepo,
    private readonly contractorInvoiceRepo: JobInvoiceRepo,
    private readonly disputeInvoiceRepo: DisputeInvoiceRepo,
    private readonly jobAssignationRepo: JobAssignationRepo,
    private readonly userRepo: UserRepo,
    private readonly driverJobInvoiceRepo: DriverJobInvoiceRepo,
    private readonly emailService: EmailService,
    private readonly jobInvoiceService: JobInvoiceService,
    private readonly scheduledJobRepo: ScheduledJobRepo,
    private readonly driverJobInvoiceService: DriverJobInvoiceService,
    @InjectEventEmitter()
    private readonly eventEmitter: NotificationEventEmitter,
    private readonly s3service: S3Service,
    private readonly disputeLoadsRepo: DisputeLoadsRepo,
  ) {}

  async getDisputeByTicket(ticketId: string): Promise<DisputeInvoice> {
    return this.disputeInvoiceRepo.findDisputeByTicket(ticketId);
  }

  async getDisputesDriverInvoiceForAdmin({
    skip,
    count,
  }): Promise<DisputeInvoice[]> {
    return this.disputeInvoiceRepo.findDisputesDriverInvoiceAdmin({
      skip,
      count,
    });
  }

  async getDisputesForAdmin({ skip, count }): Promise<DisputeInvoice[]> {
    return this.disputeInvoiceRepo.findDisputesAdmin({
      skip,
      count,
    });
  }

  async getDisputesOwnerInvoiceForAdmin({
    skip,
    count,
  }): Promise<DisputeInvoice[]> {
    return this.disputeInvoiceRepo.findDisputesOwnerInvoiceAdmin({
      skip,
      count,
    });
  }

  async getDisputeInvoiceForContractor(
    contractor: Contractor,
    disputeInvoiceId: string,
  ): Promise<DisputeInvoice> {
    return this.disputeInvoiceRepo.findDisputeInvoiceForContractor(
      contractor,
      disputeInvoiceId,
    );
  }

  async getDisputeInvoiceForAdmin(
    disputeInvoiceId: string,
  ): Promise<DisputeInvoice> {
    return this.disputeInvoiceRepo.findDisputeInvoiceForAdmin(disputeInvoiceId);
  }

  async getDisputeInvoiceForOwner(
    owner: Owner,
    disputeInvoiceId: string,
  ): Promise<DisputeInvoice> {
    return this.disputeInvoiceRepo.findDisputeInvoiceForOwner(
      owner,
      disputeInvoiceId,
    );
  }

  async createDisputeOwner(
    user: User,
    dispute: Omit<
      DisputeInvoice,
      | 'createdAt'
      | 'updatedAt'
      | 'id'
      | 'driverJobInvoice'
      | 'requestBy'
      | 'ownerJobInvoice'
    >,
    ownerJobInvoice: OwnerJobInvoice,
  ): Promise<DisputeInvoice> {
    const disputeCreated = await this.disputeInvoiceRepo.create({
      ...dispute,
      requestBy: user,
      requestByRole: user.role,
      ownerJobInvoice,
    });
    await this.emailService.sendNewDisputeOwnerEmail(
      ownerJobInvoice.job.name,
      ownerJobInvoice.owner.email,
      disputeCreated.reasons,
      user.name,
      disputeCreated.id,
    );

    const notification = await this.notificationService.createNotification({
      ...NewDisputeOwner(ownerJobInvoice.invoiceNumber, user.name),
      userId: ownerJobInvoice.owner.id,
    });

    this.eventEmitter.emit(
      'sendSocketNotification',
      notification,
      ownerJobInvoice.owner.id,
    );

    const admin = await this.userRepo.find({
      role: UserRole.ADMIN,
    });
    const startDispute = moment(
      ownerJobInvoice.disputeInvoice.createdAt,
    ).format('MMMM Do YYYY, h:mm:ss a');
    // eslint-disable-next-line guard-for-in
    for (const key in admin) {
      const element = admin[key];

      const newNotification = await this.notificationService.createNotification(
        {
          ...NewDispute(
            ownerJobInvoice.disputeInvoice.disputeNumber,
            startDispute,
          ),
          userId: element.id,
        },
      );

      this.eventEmitter.emit(
        'sendSocketNotification',
        newNotification,
        element.id,
      );
      this.eventEmitter.emit('sendTextMessage', {
        to: element.phoneNumber,
        ...NewdisputesMessage(
          ownerJobInvoice.disputeInvoice.disputeNumber,
          startDispute,
        ),
      });
    }

    await this.emailService.sendNewDisputeContractorEmail(
      ownerJobInvoice.job.name,
      ownerJobInvoice.job.user.email,
      disputeCreated.reasons,
      user.name,
      disputeCreated.id,
    );

    return disputeCreated;
  }

  async markDisputeSolved(
    disputeInvoiceId: string,
    disputeInvoiceSolved: DisputeInvoiceSolvedDTO,
  ): Promise<void> {
    const disputeInvoice = await this.disputeInvoiceRepo.findDisputeInvoiceForAdmin(
      disputeInvoiceId,
    );

    const driverInvoice =
      disputeInvoice.driverJobInvoice || disputeInvoice.previousDriverInvoice;

    const ownerInvoiceId: string = driverInvoice.ownerInvoice.id;

    let resultDriverJobInvoice: DriverJobInvoice;
    const jobId = driverInvoice.job?.id;

    if (!disputeInvoice) {
      throw new Error('dispute not exist');
    }

    const ownerInvoice = await this.ownerInvoiceRepo.findOwnerJobInvoiceForAdmin(
      ownerInvoiceId,
    );

    // Add new event to history
    let ownerEventsHistory = [];
    if (ownerInvoice?.eventsHistory?.length) {
      ownerEventsHistory = ownerInvoice.eventsHistory;
    }
    ownerInvoice.eventsHistory = [
      ...ownerEventsHistory,
      {
        type: 'END_DISPUTE',
        date: new Date(),
        by: 'Admin',
        data: {
          result: disputeInvoiceSolved.result,
          resolution: disputeInvoiceSolved.resolution,
          ticketNumber: driverInvoice.ticketNumber,
        },
      },
    ];

    await this.ownerInvoiceRepo.save(ownerInvoice);

    const schjob = await this.scheduledJobRepo.findScheduleJob(
      ownerInvoice.scheduledJob.id,
    );

    const assignation = schjob.assignations.find(
      assig => assig.driver.id === driverInvoice.driver.id,
    );

    const driverInvoiceId = driverInvoice.id;
    const jobInvoiceId = ownerInvoice.jobInvoice.id;

    const jobInvoice = await this.contractorInvoiceRepo.findInvoiceByJobId(
      jobInvoiceId,
    );

    // Add new event to history
    let jobInvoiceEventsHistory = [];
    if (jobInvoice?.eventsHistory?.length) {
      jobInvoiceEventsHistory = jobInvoice.eventsHistory;
    }
    jobInvoice.eventsHistory = [
      ...jobInvoiceEventsHistory,
      {
        type: 'END_DISPUTE',
        date: new Date(),
        by: 'Admin',
        data: {
          result: disputeInvoiceSolved.result,
          resolution: disputeInvoiceSolved.resolution,
          ticketNumber: driverInvoice.ticketNumber,
        },
      },
    ];

    await this.contractorInvoiceRepo.save(jobInvoice);

    const {
      driverInvoice: createdDriverInvoice,
    } = await this.jobInvoiceService.createInvoiceForDispute(
      jobInvoiceId,
      driverInvoiceId,
      disputeInvoice.disputeLoads,
      disputeInvoice,
    );

    if (disputeInvoice.status === DisputeInvoiceStatus.DONE) {
      const timeEntry = {
        startDate: disputeInvoiceSolved.startDate || assignation.startedAt,
        endDate: disputeInvoiceSolved.endDate || assignation.finishedAt,
        user: driverInvoice.driver,
        truck: driverInvoice.truck,
        job: driverInvoice.job,
        driverAssignation: assignation,
      };
      resultDriverJobInvoice = await this.driverJobInvoiceService.updateDriverInvoice(
        {
          id: createdDriverInvoice.id,
          sumTons: disputeInvoiceSolved.tons || assignation.tons,
          sumLoad: disputeInvoiceSolved.load || assignation.load,
          driver: driverInvoice.driver,
          job: {
            id: jobId,
          } as Job,
        },
        timeEntry,
        assignation.price,
      );
    } else {
      const timeEntry = {
        startDate: disputeInvoiceSolved.startDate || assignation.startedAt,
        endDate: disputeInvoiceSolved.endDate || assignation.finishedAt,
        user: driverInvoice.driver,
        truck: driverInvoice.truck,
        job: driverInvoice.job,
        driverAssignation: assignation,
      };
      resultDriverJobInvoice = await this.driverJobInvoiceService.createDriverInvoice(
        {
          ...createdDriverInvoice,
          sumTons: disputeInvoiceSolved.tons || assignation.tons,
          sumLoad: disputeInvoiceSolved.load || assignation.load,
        },
        timeEntry,
        assignation.price,
      );
    }

    const { owner } = ownerInvoice;

    const contractor = ownerInvoice.jobInvoice.job.user;
    const contractorCompany = await this.userRepo.getContractorCompany(
      contractor,
    );

    const ownerCompany = await this.userRepo.getOwnerCompany(owner);
    const jobInvoiceNumber = `${String(
      ownerInvoice.jobInvoice.contractorOrderNumber,
    ).padStart(3, '0')}-${String(ownerInvoice.jobInvoice.orderNumber).padStart(
      0,
      '3',
    )}`;
    const ownerInvoiceNumber = `${String(
      ownerInvoice.ownerOrderNumber,
    ).padStart(3, '0')}-${String(ownerInvoice.jobOrderNumber).padStart(
      3,
      '0',
    )}`;

    const ownerNotification = await this.notificationService.createNotification(
      {
        ...DisputedAcceptedNotification(
          owner.role,
          ownerCompany.companyCommon.name,
          ownerInvoiceNumber,
        ),
        userId: owner.id,
      },
    );

    const contractorNotification = await this.notificationService.createNotification(
      {
        ...DisputedAcceptedNotification(
          contractor.role,
          contractorCompany.companyCommon.name,
          jobInvoiceNumber,
        ),
        userId: contractor.id,
      },
    );

    this.eventEmitter.emit(
      'sendSocketNotification',
      ownerNotification,
      owner.id,
    );
    this.eventEmitter.emit(
      'sendSocketNotification',
      contractorNotification,
      contractor.id,
    );

    this.eventEmitter.emit('sendTextMessage', {
      to: owner.phoneNumber,
      ...DisputeAccepted(
        owner.role,
        ownerCompany.companyCommon.name,
        ownerInvoiceNumber,
      ),
    });

    this.eventEmitter.emit('sendTextMessage', {
      to: contractor.phoneNumber,
      ...DisputeAccepted(
        contractor.role,
        contractorCompany.companyCommon.name,
        jobInvoiceNumber,
      ),
    });

    await this.jobAssignationRepo.update(assignation.id, {
      tons: disputeInvoiceSolved.tons || assignation.tons,
      load: disputeInvoiceSolved.load || assignation.load,
      startedAt: disputeInvoiceSolved.startDate || assignation.startedAt,
      finishedAt: disputeInvoiceSolved.endDate || assignation.finishedAt,
    });
    // await this.jobInvoiceService.updateInvoice(jobId, ownerInvoiceId);
    await this.disputeInvoiceRepo.save({
      ...disputeInvoice,
      status: DisputeInvoiceStatus.DONE,
      result: disputeInvoiceSolved.result,
      resolution: disputeInvoiceSolved.resolution,
      resultDriverJobInvoice,
      driverJobInvoice: createdDriverInvoice,
      evidences: disputeInvoiceSolved.evidences,
      resultResume: disputeInvoiceSolved.resultResume,
    });
  }

  async createDisputeOwnerForContractor(
    dispute: Omit<
      DisputeInvoice,
      | 'createdAt'
      | 'updatedAt'
      | 'id'
      | 'driverJobInvoice'
      | 'requestBy'
      | 'ownerJobInvoice'
    >,
    contractor: Contractor,
    invoiceId: string,
  ): Promise<DisputeInvoice> {
    const ownerJobInvoice = await this.ownerInvoiceRepo.findOwnerJobInvoiceForContractor(
      contractor,
      invoiceId,
    );

    return this.createDisputeOwner(contractor, dispute, ownerJobInvoice);
  }

  async createDisputeOwnerForOwner(
    dispute: Omit<
      DisputeInvoice,
      | 'createdAt'
      | 'updatedAt'
      | 'id'
      | 'driverJobInvoice'
      | 'requestBy'
      | 'ownerJobInvoice'
    >,
    owner: Owner,
    invoiceId: string,
  ): Promise<DisputeInvoice> {
    const ownerJobInvoice = await this.ownerInvoiceRepo.findOwnerJobInvoiceForOwner(
      owner,
      invoiceId,
    );

    return this.createDisputeOwner(owner, dispute, ownerJobInvoice);
  }

  async createDisputeDriver(
    user: User,
    dispute: Omit<
      DisputeInvoice,
      | 'createdAt'
      | 'updatedAt'
      | 'id'
      | 'driverJobInvoice'
      | 'requestBy'
      | 'ownerJobInvoice'
    >,
    driverJobInvoice: DriverJobInvoice,
  ): Promise<DisputeInvoice> {
    const truck = driverJobInvoice.truck;
    const driver = driverJobInvoice.driver;
    const ownerInvoice = driverJobInvoice.ownerInvoice;
    const category = driverJobInvoice.category;

    const scheduledJob = await this.scheduledJobRepo.findScheduledJobForDispute(
      ownerInvoice.id,
      driver.id,
      truck.id,
    );

    const driverAssignation = scheduledJob.assignations.find(
      assignation =>
        assignation.driver.id === driver.id &&
        assignation.truck.id === truck.id &&
        assignation.category.id === category.id,
    );

    const newDispute = new DisputeInvoice();

    for (const key in dispute) {
      newDispute[key] = dispute[key];
    }

    newDispute.requestBy = user;
    newDispute.requestByRole = user.role;
    newDispute.previousDriverInvoice = driverJobInvoice;
    newDispute.disputeLoads = driverAssignation.loads.map(load => {
      const newLoad = new Loads();

      for (const key in load) {
        newLoad[key] = load[key];
      }

      delete newLoad.id;

      newLoad.assignation = driverAssignation;
      newLoad.truck = truck;
      newLoad.job = scheduledJob.job;

      return newLoad;
    });

    const disputeCreated = await this.disputeInvoiceRepo.save(newDispute);

    let company: OwnerCompany | ContractorCompany;
    let invoiceNumber = '';

    if (user.role === UserRole.OWNER) {
      company = await this.userRepo.getOwnerCompany(user);
      invoiceNumber = `${String(
        driverJobInvoice.ownerInvoice.ownerOrderNumber,
      ).padStart(3, '0')}-${String(
        driverJobInvoice.ownerInvoice.jobOrderNumber,
      ).padStart(3, '0')}`;
    } else if (user.role === UserRole.CONTRACTOR) {
      company = await this.userRepo.getContractorCompany(user);
      invoiceNumber = `${String(
        driverJobInvoice.ownerInvoice.jobInvoice.contractorOrderNumber,
      ).padStart(3, '0')}-${String(
        driverJobInvoice.ownerInvoice.jobInvoice.orderNumber,
      ).padStart(3, '0')}`;
    }

    const admins = await this.userRepo.getAdmins();

    admins.forEach(async admin => {
      const message = DisputeStarted(
        user.role,
        company.companyCommon.name,
        invoiceNumber,
      );

      const notification = await this.notificationService.createNotification({
        ...DisputeStartedNotification(
          user.role,
          company.companyCommon.name,
          invoiceNumber,
        ),
        userId: admin.id,
      });

      this.eventEmitter.emit('sendTextMessage', {
        to: admin.phoneNumber,
        ...message,
      });

      this.eventEmitter.emit('sendSocketNotification', notification, admin.id);
    });

    await this.emailService.sendNewDisputeOwnerEmail(
      driverJobInvoice.job.name,
      driverJobInvoice.ownerInvoice.owner.email,
      disputeCreated.reasons,
      user.name,
      driverJobInvoice.id,
    );
    await this.emailService.sendNewDisputeContractorEmail(
      driverJobInvoice.job.name,
      user.email,
      disputeCreated.reasons,
      user.name,
      driverJobInvoice.id,
    );
    return disputeCreated;
  }

  async createDisputeDriverForContractor(
    dispute: Omit<
      DisputeInvoice,
      | 'createdAt'
      | 'updatedAt'
      | 'id'
      | 'driverJobInvoice'
      | 'requestBy'
      | 'ownerJobInvoice'
    >,
    contractor: Contractor,
    invoiceId: string,
  ): Promise<DisputeInvoice> {
    const driverJobInvoice = await this.driverJobInvoiceRepo.findDriverJobInvoiceForContractor(
      contractor,
      invoiceId,
    );

    // Get owner invoice
    const ownerInvoice = await this.ownerInvoiceRepo.findOwnerInvoiceById(
      driverJobInvoice.ownerInvoice.id,
    );

    // Add new event to history
    let ownerEventsHistory = [];
    if (ownerInvoice?.eventsHistory?.length) {
      ownerEventsHistory = ownerInvoice.eventsHistory;
    }
    ownerInvoice.eventsHistory = [
      ...ownerEventsHistory,
      {
        type: 'START_DISPUTE',
        date: new Date(),
        by: 'Contractor',
        data: {
          reasons: dispute.reasons,
          requirements: dispute.requirements,
          ticketNumber: driverJobInvoice.ticketNumber,
        },
      },
    ];

    const jobInvoice = await this.contractorInvoiceRepo.findInvoiceByJobId(
      driverJobInvoice.job.id,
    );

    // Add new event to history
    let jobInvoiceEventsHistory = [];
    if (jobInvoice?.eventsHistory?.length) {
      jobInvoiceEventsHistory = jobInvoice.eventsHistory;
    }
    jobInvoice.eventsHistory = [
      ...jobInvoiceEventsHistory,
      {
        type: 'START_DISPUTE',
        date: new Date(),
        by: 'Contractor',
        data: {
          reasons: dispute.reasons,
          requirements: dispute.requirements,
          ticketNumber: driverJobInvoice.ticketNumber,
        },
      },
    ];

    await this.contractorInvoiceRepo.save(jobInvoice);

    return this.createDisputeDriver(contractor, dispute, driverJobInvoice);
  }

  async createDisputeDriverForOwner(
    dispute: Omit<
      DisputeInvoice,
      | 'createdAt'
      | 'updatedAt'
      | 'id'
      | 'driverJobInvoice'
      | 'requestBy'
      | 'ownerJobInvoice'
    >,
    owner: Owner,
    invoiceId: string,
  ): Promise<DisputeInvoice> {
    const driverJobInvoice = await this.driverJobInvoiceRepo.findDriverJobInvoiceForOwner(
      owner,
      invoiceId,
    );

    // Get owner invoice
    const ownerInvoice = await this.ownerInvoiceRepo.findOwnerInvoiceById(
      driverJobInvoice.ownerInvoice.id,
    );

    // Add new event to history
    let ownerEventsHistory = [];
    if (ownerInvoice?.eventsHistory?.length) {
      ownerEventsHistory = ownerInvoice.eventsHistory;
    }
    ownerInvoice.eventsHistory = [
      ...ownerEventsHistory,
      {
        type: 'START_DISPUTE',
        date: new Date(),
        by: 'Owner',
        data: {
          reasons: dispute.reasons,
          requirements: dispute.requirements,
          ticketNumber: driverJobInvoice.ticketNumber,
        },
      },
    ];

    // Save owner invoice
    await this.ownerInvoiceRepo.save(ownerInvoice);

    // Get contractor invoice
    const contractorInvoice = await this.contractorInvoiceRepo.findInvoiceByJobId(
      driverJobInvoice.job.id,
    );

    // Add new event to history}
    let contractorEventsHistory = [];
    if (contractorInvoice?.eventsHistory?.length) {
      contractorEventsHistory = contractorInvoice.eventsHistory;
    }
    contractorInvoice.eventsHistory = [
      ...contractorEventsHistory,
      {
        type: 'START_DISPUTE',
        date: new Date(),
        by: 'Owner',
        data: {
          reasons: dispute.reasons,
          requirements: dispute.requirements,
          ticketNumber: driverJobInvoice.ticketNumber,
        },
      },
    ];

    return this.createDisputeDriver(owner, dispute, driverJobInvoice);
  }

  async getUploadImageUrl(): Promise<string> {
    return this.s3service.getImageUrlForDisputes();
  }

  async getLoadsForDispute(
    truckId: string,
    jobId: string,
    driverId: string,
    categoryId: string,
  ): Promise<DisputeLoads[]> {
    const assignation = await this.jobAssignationRepo.findAssignationForDisputeLoads(
      categoryId,
      driverId,
      truckId,
    );

    const loads = await this.disputeLoadsRepo.getLoadsForDispute(
      assignation.id,
      jobId,
      truckId,
    );

    return loads;
  }
}
