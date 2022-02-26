/* eslint-disable prefer-const */
/* eslint-disable no-unused-expressions */
import { Injectable } from '@nestjs/common';
import { addDays, differenceInCalendarDays, format } from 'date-fns';
import { InjectEventEmitter } from 'nest-emitter';
import moment from 'moment';

import Stripe from 'stripe';
import { EmailService } from '../email/email.service';

import { JobAssignation } from '../jobs/job-assignation.model';
import { Job } from '../jobs/job.model';
import { JobRepo } from '../jobs/job.repository';
import { ScheduledJob } from '../jobs/scheduled-job.model';
import { ScheduledJobRepo } from '../jobs/scheduled-job.repository';
import { StripePaymentsService } from '../stripe/stripe-payments.service';
import { StripeInvoicingService } from '../stripe/stripe-invoing.service';
import { TimeEntryRepo } from '../timer/time-entry.repository';
import { Contractor } from '../user/contractor.model';
import { Owner } from '../user/owner.model';
import { UserRole } from '../user/user.model';
import { UserRepo } from '../user/user.repository';
import { getRoundedHours } from '../util/date-utils';
import { DriverJobInvoice } from './driver-job-invoice.model';
import { AlreadyAppliedForCashAdavanceException } from './exceptions/already-applied-cash-advance-exception';
import { StripeBalanceInsufficientException } from './exceptions/stripe-balance-insufficient-exception';
import { CashAdvanceAlreadyRejectedException } from './exceptions/cash-advance-already-rejected-exception';
import { StripeErrorException } from './exceptions/stripe-error-exception';
import { LateFeeInvoiceRepo } from './late-fee-invoice.repository';
import { JobInvoiceCalculator } from './job-invoice.calculator';
import { JobInvoice } from './job-invoice.model';
import { JobInvoiceRepo } from './job-invoice.repository';
import { OwnerJobInvoice } from './owner-job-invoice.model';
import { PaymentMethod } from './payment-method';
import { NoCashAdvanceRequestedException } from './exceptions/no-cash-advance-requested-exception';
import { NotificationEventEmitter } from '../notification/notification.events';
import { DriverJobInvoiceRepo } from './driver-job-invoice.repository';
import { OwnerJobInvoiceRepo } from './owner-job-invoice.repository';
import { JobInvoiceStatus } from './job-invoice-status';
import { UnverifiedBankAccountException } from '../stripe/exceptions/unverified-bank-account';
import { NotificationService } from '../notification/notification.service';
import {
  PaymentReceivedOwner,
  RechargedContractor,
  NewContractorManualPayment,
  NewAdminManualPayment,
} from '../notification/notifications/notifications';
import { GeolocationService } from '../geolocation/geolocation.service';
import { OwnerRepo } from '../user/owner.repository';
import { ManualPaymentRepo } from './manual-payment.repository';
import { TimeEntry } from '../timer/time-entry.model';
import {
  NewContractorManualPayment as NewContractorManualPaymentSMS,
  NewAdminManualPayment as NewAdminManualPaymentSMS,
} from '../notification/notifications/messages';
import { JobAssignationRepo } from '../jobs/job-assignation.repository';
import { LoadsRepo } from '../geolocation/loads.repository';
import { FinishJobDTO } from '../timer/dto/finish-job.dto';
import { JobInvoiceDTO } from './dto/job-invoice.dto';
import { DisputeInvoice } from './dispute-invoice.model';
import { Loads } from '../geolocation/loads.model';
import { DisputeLoads } from './dispute-loads.model';

@Injectable()
export class JobInvoiceService {
  private readonly CHARGE_PERCENTAGE = 0.04;
  private readonly OWNER_FEES_PERCENTAGE = 0.06;
  private readonly CASH_ADVANCE_FEE = 0.04;

  constructor(
    private readonly jobInvoiceCalculator: JobInvoiceCalculator,
    private readonly ownerInvoiceRepo: OwnerJobInvoiceRepo,
    private readonly jobInvoiceRepository: JobInvoiceRepo,
    private readonly manualPaymentRepository: ManualPaymentRepo,
    private readonly notificationService: NotificationService,
    private readonly jobRepository: JobRepo,
    private readonly scheduledJobRepository: ScheduledJobRepo,
    private readonly timeEntryRepository: TimeEntryRepo,
    private readonly lateFeeInvoiceRepo: LateFeeInvoiceRepo,
    private readonly userRepository: UserRepo,
    private readonly driverJobInvoiceRepo: DriverJobInvoiceRepo,
    private readonly paymentsService: StripePaymentsService,
    private readonly stripeInvoicingService: StripeInvoicingService,
    private readonly emailService: EmailService,
    private readonly geolocationService: GeolocationService,
    private readonly ownerRepo: OwnerRepo,
    private readonly jobAssignationRepo: JobAssignationRepo,
    private readonly loadsRepo: LoadsRepo,
    @InjectEventEmitter()
    private readonly eventEmitter: NotificationEventEmitter,
  ) {}

  async getOwnerInvoiceForAdmin(invoiceId: string): Promise<any> {
    const data = await this.jobInvoiceRepository.findAdminOwnerInvoiceById(
      invoiceId,
    );

    const company = await this.jobInvoiceRepository.findContractorCompanyForOwner(
      invoiceId,
    );

    const invoice = {
      ...data,
      contractorCompanyName: company && company.companyCommonName,
    };

    return this.getOwnerInvoiceTimeEntries(invoice);
  }

  async updateDriverInvoiceOwner(id: string, body: FinishJobDTO): Promise<any> {
    const { tons, loadsId, load, comment, signature, evidenceImgs } = body;

    let loads: Loads;
    const driverInvoice = await this.driverJobInvoiceRepo.getDriverInvoiceById(
      id,
    );

    tons === 0 ? null : (driverInvoice.sumTons = tons);
    !comment || comment === '' ? null : (driverInvoice.comment = comment);
    !signature || signature === ''
      ? null
      : (driverInvoice.signatureImg = signature);
    !evidenceImgs
      ? evidenceImgs === null
      : (driverInvoice.evidenceImgs = evidenceImgs);
    await this.driverJobInvoiceRepo.save(driverInvoice);

    if (load !== null) {
      loads = await this.loadsRepo.findById(loadsId);
      load === 0 ? null : (loads.ticket = load.toString());
      tons === 0 ? null : (loads.tons = tons);
      await this.loadsRepo.save(loads);
    }

    const findAssig = await this.jobAssignationRepo.find({
      scheduledJob: driverInvoice.ownerInvoice.scheduledJob,
      driver: driverInvoice.driver,
    });
    tons === 0 ? null : (findAssig[0].tons = tons);
    !comment || comment === '' ? null : (findAssig[0].comment = comment);
    !signature || signature === ''
      ? null
      : (findAssig[0].signatureImg = signature);
    !evidenceImgs || evidenceImgs === null
      ? null
      : (findAssig[0].evidenceImgs = evidenceImgs);
    await this.jobAssignationRepo.save(findAssig[0]);
    return {
      driverInvoice,
      assignation: findAssig,
      loads,
    };
  }

  async getInvoiceForOwner(owner: Owner, invoiceId: string): Promise<any> {
    const data = await this.jobInvoiceRepository.findInvoiceForOwner(
      owner,
      invoiceId,
    );
    const companyContractor = await this.jobInvoiceRepository.findContractorCompanyForOwner(
      invoiceId,
    );
    const companyOwner = await this.jobInvoiceRepository.getCompanyNameAndPhoneNumberForOwner(
      data.owner.id,
    );

    const invoice = {
      ...data,
      contractorCompanyName:
        companyContractor && companyContractor.companyCommonName,
      ownerCompanyName: companyOwner && companyOwner.companyCommonName,
      ownerCompanyPhoneNumber:
        companyOwner && companyOwner.companyCommonOfficephonenumber,
    };

    return this.getOwnerInvoiceTimeEntries(invoice);
  }

  async getOwnerInvoiceTimeEntries(
    data: OwnerJobInvoice,
  ): Promise<OwnerJobInvoice> {
    const truckIDs: string[] = [];
    const driverInvoicesIDs: string[] = [];

    data.driverInvoices.forEach(driverInvoice => {
      truckIDs.push(driverInvoice.truck.id);
      driverInvoicesIDs.push(driverInvoice.id);
    });

    const tickets = await this.geolocationService.getLoadTracks(
      data.job.id,
      truckIDs,
      driverInvoicesIDs,
    );

    data.driverInvoices.forEach((driverInvoice, index, driverInvoicesArray) => {
      tickets.forEach(ticketEntry => {
        if (driverInvoice.truck.id === ticketEntry.truck.id) {
          if (!driverInvoicesArray[index].ticketEntries) {
            driverInvoicesArray[index].ticketEntries = new Array(ticketEntry);
          } else {
            driverInvoicesArray[index].ticketEntries.push(ticketEntry);
          }
        }
      });
    });

    return data;
  }

  async getContractorInvoiceTimeEntries(data: JobInvoice): Promise<JobInvoice> {
    const truckIDs: string[] = [];
    const driverInvoicesIDs: string[] = [];

    data.ownerInvoices.forEach(ownerInvoice => {
      ownerInvoice.driverInvoices.forEach(driverInvoice => {
        truckIDs.push(driverInvoice.truck.id);
        driverInvoicesIDs.push(driverInvoice.id);
      });
    });

    const tickets = await this.geolocationService.getLoadTracks(
      data.job.id,
      truckIDs,
      driverInvoicesIDs,
    );

    data.ownerInvoices.forEach(ownerInvoice => {
      ownerInvoice.driverInvoices.forEach(
        (driverInvoice, index, driverInvoicesArray) => {
          tickets.forEach(ticketEntry => {
            if (driverInvoice.truck.id === ticketEntry.truck.id) {
              if (!driverInvoicesArray[index].ticketEntries) {
                driverInvoicesArray[index].ticketEntries = new Array(
                  ticketEntry,
                );
              } else {
                driverInvoicesArray[index].ticketEntries.push(ticketEntry);
              }
            }
          });
        },
      );
    });

    return data;
  }

  async getContractorInvoiceForAdmin(invoiceId: string): Promise<any> {
    const data = await this.jobInvoiceRepository.findAdminContractorInvoiceById(
      invoiceId,
    );

    data.ownerInvoices = await Promise.all(
      data.ownerInvoices.map(async ownerInvoice => {
        const company = await this.ownerRepo.getOwnerCompany(
          ownerInvoice.owner.id,
        );
        return {
          ...ownerInvoice,
          ownerCompany: company[0]?.companyCommonName,
        };
      }),
    );

    const company = await this.jobInvoiceRepository.findOwnerCompanyForContractor(
      invoiceId,
    );

    const invoice = {
      ...data,
      ownerCompany: company && company.companyCommonName,
    };

    return this.getContractorInvoiceTimeEntries(invoice);
  }

  async getInvoiceForContractor(
    contractor: Contractor,
    invoiceId: string,
  ): Promise<any> {
    const data = await this.jobInvoiceRepository.findInvoiceForContractor(
      contractor,
      invoiceId,
    );

    data.ownerInvoices = await Promise.all(
      data.ownerInvoices.map(async ownerInvoice => {
        const company = await this.ownerRepo.getOwnerCompany(
          ownerInvoice.owner.id,
        );
        return {
          ...ownerInvoice,
          ownerCompany: company[0]?.companyCommonName,
        };
      }),
    );

    const company = await this.jobInvoiceRepository.findOwnerCompanyForContractor(
      invoiceId,
    );

    const invoice = {
      ...data,
      ownerCompany: company && company.companyCommonName,
    };

    return this.getContractorInvoiceTimeEntries(invoice);
  }

  async getFinsihedByAssignation(
    driverId: string,
    jobId: string,
  ): Promise<any> {
    return this.jobInvoiceRepository.getFinishedByJob(driverId, jobId);
  }

  async acceptInvoiceForContractor(
    contractor: Contractor,
    invoiceId: string,
  ): Promise<JobInvoice> {
    const jobInvoiceContractor = await this.jobInvoiceRepository.findInvoiceForContractor(
      contractor,
      invoiceId,
    );
    jobInvoiceContractor.isAccepted = true;
    return this.jobInvoiceRepository.save(jobInvoiceContractor);
  }

  async updateInvoice(jobId: string, ownerInvoiceId: string): Promise<void> {
    const job = await this.jobRepository.findById(jobId);
    const jobInvoice = await this.jobInvoiceRepository.findInvoiceByJobId(
      job.id,
    );
    let jobInvoiceAmount = 0;
    await Promise.all(
      jobInvoice.ownerInvoices.map(async ownerInvoice => {
        if (ownerInvoice.id === ownerInvoiceId) {
          let amount = 0;
          await Promise.all(
            // ownerInvoice.driverInvoices.map(async driverInvoice => {

            // eslint-disable-next-line array-callback-return
            ownerInvoice.scheduledJob.assignations.map(assignation => {
              const ownerAmount = this.jobInvoiceCalculator.calculateAmount(
                assignation.price,
                assignation.payBy,
                {
                  tons: assignation.tons,
                  load: assignation.load,
                },
                assignation.hours,
              );

              amount += ownerAmount;
              return [];
            }),

            // }),
          );
          await this.ownerInvoiceRepo.save({
            ...ownerInvoice,
            netAmount: amount,
            amount: amount * (1 - this.OWNER_FEES_PERCENTAGE),
          });
          jobInvoiceAmount += amount;
        } else {
          jobInvoiceAmount += ownerInvoice.netAmount;
        }
      }),
    );
    const invoice = await this.jobInvoiceRepository.update(jobInvoice.id, {
      amount: jobInvoiceAmount,
    });
    // const intentId = await this.createPaymentIntent(invoice);
    // await this.paymentsService.updateIntentAmount(
    // jobInvoiceAmount,
    // invoice.id,
    // intentId,
    // );
  }

  async createInvoice(jobId: string): Promise<void> {
    const job = await this.jobRepository.findById(jobId);
    const scheduledJobs = await this.scheduledJobRepository.findJobFinishedScheduledJobs(
      job,
    );
    const ownerInvoices = await Promise.all(
      scheduledJobs.map(
        async (scheduledJob, indexScheduleJob) =>
          // eslint-disable-next-line no-return-await
          await this.generateOwnerInvoice(
            scheduledJob,
            job,
            indexScheduleJob + 1,
          ),
      ),
    );
    const amount = ownerInvoices.reduce(
      (acc, invoice) => acc + invoice.netAmount,
      0,
    );

    const invoice = await this.jobInvoiceRepository.create({
      contractor: job.user,
      dueDate: job.paymentDue,
      job,
      hasDiscount: null,
      ownerInvoices: this.generateTicketDriverInvoice(ownerInvoices),
      amount,
      orderNumber: job.orderNumber,
      contractorOrderNumber: job.user.shortid,
    });

    await this.createStripeInvoice(invoice);

    // email to contractor and admins job finished
    let sumTons = 0;
    let sumLoads = 0;
    ownerInvoices.forEach(ownerInv => {
      const invTons = ownerInv.driverInvoices.reduce(
        (acc, driverInvoice) => acc + driverInvoice.sumTons,
        0,
      );
      const loads = ownerInv.driverInvoices.reduce(
        (acc, driverInvoice) => acc + driverInvoice.sumLoad,
        0,
      );
      sumTons += invTons;
      sumLoads += loads;
    });
    const admins = await this.userRepository.find({ role: UserRole.ADMIN });
    const formattedDueDate = format(invoice.dueDate, 'MM-dd-yyyy');
    const formattedJobPaymentDue = format(job.paymentDue, 'MM-dd-yyyy');
    await Promise.all(
      admins.map(admin =>
        this.emailService.sendContractorFinishedJobEmail(
          admin.email,
          formattedDueDate,
          invoice.amount,
          job.orderNumber,
          sumTons,
          sumLoads,
          job.name,
          formattedJobPaymentDue,
        ),
      ),
    );
  }

  generateTicketDriverInvoice(
    ownerInvoices: OwnerJobInvoice[],
  ): OwnerJobInvoice[] {
    let ticket = 0;
    return ownerInvoices.map(ownerInvoice => {
      return {
        ...ownerInvoice,
        driverInvoices: ownerInvoice.driverInvoices.map(driverInvoice => {
          ticket += 1;
          return { ...driverInvoice, ticketNumber: ticket };
        }),
      };
    });
  }

  async generateOwnerInvoice(
    scheduledJob: ScheduledJob,
    job: Job,
    invoiceNumber = 1,
  ): Promise<OwnerJobInvoice> {
    let amount = 0;
    const driverInvoices = await Promise.all(
      scheduledJob.assignations.map(async assignation => {
        const ownerAmount = await this.getAmount(
          assignation,
          scheduledJob.job,
          { tons: assignation.tons, load: assignation.load },
        );
        amount += ownerAmount;
        return this.generateDriverInvoice(
          assignation,
          scheduledJob.job,
          invoiceNumber,
        );
      }),
    );
    const owner = await scheduledJob.company.owner;
    const contractor = job.user;

    const netAmount = amount;

    if (
      !(
        owner.id === contractor.associatedUserId &&
        contractor.id === owner.associatedUserId
      )
    ) {
      amount *= 1 - this.OWNER_FEES_PERCENTAGE;
    }

    return {
      netAmount,
      amount,
      dueDate: addDays(job.paymentDue, 5),
      driverInvoices: driverInvoices.filter(Boolean),
      scheduledJob,
      job: scheduledJob.job,
      owner,
      jobOrderNumber: scheduledJob.job.orderNumber,
      ownerOrderNumber: owner.shortid || invoiceNumber,
      isAssociatedInvoice:
        owner.id === contractor.associatedUserId &&
        contractor.id === owner.associatedUserId,
    } as OwnerJobInvoice;
  }

  async generateDriverInvoice(
    assignation: JobAssignation,
    job: Job,
    ticketNumber = 1,
  ): Promise<DriverJobInvoice> {
    const {
      tons: sumTons,
      load: sumLoad,
      driver,
      truck,
      category,
      evidenceImgs,
      comment,
      totalTravels,
      signatureImg,
      supervisorComment,
      supervisorName,
      travelTimeSupervisor,
    } = assignation;

    const timeEntries = await this.timeEntryRepository.findTimeEntriesForUserAndJob(
      assignation.driver,
      job.id,
      assignation,
    );

    const loads = await this.loadsRepo.getLoadsByAssignation(assignation.id);

    if (timeEntries.length === 0) {
      return null;
    }
    const hours = getRoundedHours(timeEntries);
    const amount = await this.getAmount(assignation, job, {
      tons: assignation.tons,
      load: assignation.load,
    });
    return {
      timeEntries,
      hours,
      sumTons,
      sumLoad,
      driver,
      job,
      amount,
      truck,
      category,
      ticketNumber,
      evidenceImgs,
      comment,
      totalTravels,
      signatureImg,
      jobOrderNumber: job.orderNumber,
      supervisorComment,
      supervisorName,
      travelTimeSupervisor,
      loads,
    } as DriverJobInvoice;
  }

  async updateDriverInvoice(
    assignation: JobAssignation,
    job: Job,
  ): Promise<DriverJobInvoice> {
    const {
      tons: sumTons,
      load: sumLoad,
      evidenceImgs,
      comment,
      totalTravels,
      signatureImg,
      // category,
    } = assignation;

    const driverInvoice = await this.driverJobInvoiceRepo.findDriverJobInvoice(
      job.id,
    );

    const timeEntries = await this.timeEntryRepository.findTimeEntriesForUserAndJob(
      assignation.driver,
      job.id,
      assignation,
    );
    if (timeEntries.length === 0) {
      return null;
    }

    const hours = getRoundedHours(timeEntries);
    const amount = await this.getAmount(assignation, job, {
      tons: assignation.tons,
      load: assignation.load,
    });

    if (driverInvoice) {
      driverInvoice.hours = hours;
      driverInvoice.amount = amount;
      driverInvoice.sumTons = sumTons;
      driverInvoice.sumLoad = sumLoad;
      driverInvoice.signatureImg = signatureImg;
      driverInvoice.totalTravels = totalTravels;
      driverInvoice.comment = comment;
      driverInvoice.evidenceImgs = evidenceImgs;

      await this.driverJobInvoiceRepo.save(driverInvoice);
    }

    return driverInvoice;
  }

  async updateDriverInvoiceEvidence(
    assignation: JobAssignation,
    job: Job,
  ): Promise<DriverJobInvoice> {
    const {
      tons: sumTons,
      load: sumLoad,
      evidenceImgs,
      comment,
      totalTravels,
      signatureImg,
    } = assignation;

    const driverInvoice = await this.driverJobInvoiceRepo.findDriverJobInvoice(
      job.id,
    );

    if (driverInvoice) {
      driverInvoice.sumTons = sumTons;
      driverInvoice.sumLoad = sumLoad;
      driverInvoice.signatureImg = signatureImg;
      driverInvoice.totalTravels = totalTravels;
      driverInvoice.comment = comment;
      driverInvoice.evidenceImgs = evidenceImgs;

      await this.driverJobInvoiceRepo.save(driverInvoice);
    }

    return driverInvoice;
  }

  getContractorInvoices(
    contractor: Contractor,
    { skip, count, isPaid },
  ): Promise<JobInvoice[]> {
    return this.jobInvoiceRepository.findContractorInvoices(contractor, {
      skip,
      count,
      isPaid,
    });
  }

  async getContractorInvoicesbyGeneralJobId(
    contractor: Contractor,
    { skip, count, generalJobId },
  ): Promise<JobInvoice[]> {
    const invoices = await this.jobInvoiceRepository.findContractorInvoicesByGeneralJobId(
      contractor,
      {
        skip,
        count,
        generalJobId,
      },
    );
    return invoices;
  }

  getContractorInvoicesByGeneralJobId({
    skip,
    count,
    generalJobId,
  }): Promise<JobInvoice[]> {
    return this.jobInvoiceRepository.findContractorInvoicesAdminByGeneralJobId({
      skip,
      count,
      generalJobId,
    });
  }

  getContractorInvoicesForAdmin({
    skip,
    count,
    isPaid,
  }): Promise<JobInvoice[]> {
    return this.jobInvoiceRepository.findContractorInvoicesAdmin({
      skip,
      count,
      isPaid,
    });
  }

  getOwnerInvoices(
    owner: Owner,
    { skip, count, isPaid },
  ): Promise<OwnerJobInvoice[]> {
    return this.jobInvoiceRepository.findOwnerInvoices(owner, {
      skip,
      count,
      isPaid,
    });
  }

  setContractorInvoiceDiscount({ invoiceId, discountValue }): Promise<boolean> {
    return this.jobInvoiceRepository.setContractorInvoiceDiscount(
      invoiceId,
      discountValue,
    );
  }

  setOwnerInvoiceDiscount({ invoiceId, discountValue }): Promise<boolean> {
    return this.ownerInvoiceRepo.setOwnerInvoiceDiscount(
      invoiceId,
      discountValue,
    );
  }

  getOwnerInvoicesForAdmin({
    skip,
    count,
    isPaid,
  }): Promise<OwnerJobInvoice[]> {
    return this.jobInvoiceRepository.findOwnerInvoicesAdmin({
      skip,
      count,
      isPaid,
    });
  }

  async getOwnerInvoiceForAdminById(invoiceId: string): Promise<any> {
    const data = await this.jobInvoiceRepository.findOwnerInvoiceById(
      invoiceId,
    );
    const companyContractor = await this.jobInvoiceRepository.findContractorCompanyForOwner(
      invoiceId,
    );
    const companyOwner = await this.jobInvoiceRepository.getCompanyNameAndPhoneNumberForOwner(
      data.owner.id,
    );

    const invoice = {
      ...data,
      contractorCompanyName:
        companyContractor && companyContractor.companyCommonName,
      ownerCompanyName: companyOwner && companyOwner.companyCommonName,
      ownerCompanyPhoneNumber:
        companyOwner && companyOwner.getCompanyNameAndPhoneNumberForOwner,
    };

    return this.getOwnerInvoiceTimeEntries(invoice);
  }

  async getCompanyNameForOwner(ownerId: string): Promise<any> {
    return this.jobInvoiceRepository.getCompanyNameForOwner(ownerId);
  }

  getOwnerInvoicesByJobId(jobId: string): Promise<OwnerJobInvoice> {
    return this.jobInvoiceRepository.findOwnerInvoiceByJobId(jobId);
  }

  async handleUnpaidInvoices(): Promise<void> {
    const unpaidInvoices = await this.jobInvoiceRepository.findUnpaidInvoices();
    const overdueInvoices = unpaidInvoices.filter(
      invoice => invoice.getCurrentDueDate() < new Date() && !invoice.isPaid,
    );

    await Promise.all(
      overdueInvoices.map(invoice => this.createLateFeeInvoice(invoice)),
    );
  }

  async notifyFutureSurcharge(): Promise<void> {
    const unpaidInvoices = await this.jobInvoiceRepository.findAllUnpaidInvoices();
    const invoicesWithDueDateTwoDaysFromNow = unpaidInvoices.filter(invoice => {
      const invoiceCurrentDueDate = invoice.getCurrentDueDate();
      const today = new Date();
      return differenceInCalendarDays(invoiceCurrentDueDate, today) === 2;
    });

    const now = moment();
    const nowStart = moment({ hours: 8, minutes: 0, seconds: 0 });
    const nowEnd = moment({ hours: 16, minutes: 0, seconds: 0 });

    await Promise.all(
      invoicesWithDueDateTwoDaysFromNow.map(invoice => {
        const formattedDueDate = format(
          invoice.getCurrentDueDate(),
          'MM-dd-yyyy',
        );

        if (now >= nowStart && now <= nowEnd) {
          this.eventEmitter.emit('sendTextMessage', {
            to: invoice.contractor.phoneNumber,
            body: `Remember that you have to pay invoice number ${invoice.orderNumber} for the job ${invoice.job.name}`,
          });
        }

        return this.emailService.sendPaymentReminderEmail(
          invoice.contractor.email,
          formattedDueDate,
          invoice.orderNumber,
          invoice.job.name,
        );
      }),
    );
  }

  async createLateFeeInvoice(invoice: JobInvoice): Promise<void> {
    const currentInvoice = await JobInvoiceDTO.fromModel(invoice);

    let invoiceAmount = 0;

    await Promise.all(
      invoice.ownerInvoices.map(async ownerInvoice => {
        const driverInvoices = await this.driverJobInvoiceRepo.getDriverInvoicesFromOwnerInvoice(
          ownerInvoice.id,
        );
        const totalTickets = driverInvoices?.length;
        driverInvoices.forEach(driverInvoice => {
          if (
            (driverInvoice.previousDisputeInvoice && totalTickets === 1) ||
            (driverInvoice.disputeInvoice &&
              !driverInvoice.previousDisputeInvoice &&
              totalTickets === 1) ||
            (!driverInvoice.disputeInvoice &&
              !driverInvoice.previousDisputeInvoice)
          ) {
            invoiceAmount += driverInvoice.amount;
          }
        });
      }),
    );

    // Count how many late fee invoices were created from this original invoice
    const lateFeesCount = await this.lateFeeInvoiceRepo.countLateFeeInvoicesByJobInvoiceId(
      invoice.id,
    );

    let isAfterTimePeriod;

    if (lateFeesCount) {
      // Compute if a week has passed since the last late fee invoice was generated
      const lastDate = await this.lateFeeInvoiceRepo.getLastDateByJobInvoiceId(
        invoice.id,
      );
      isAfterTimePeriod = moment()
        .utc()
        .isAfter(
          moment(lastDate)
            .utc()
            .add(1, 'day'),
        );
    } else {
      isAfterTimePeriod = true;
    }

    if (isAfterTimePeriod && lateFeesCount < 26 && invoiceAmount > 0) {
      // Create late fee invoice

      const orderNumber = `${currentInvoice.orderNumber.toString()}-${String.fromCharCode(
        lateFeesCount + 65,
      )}`;

      this.lateFeeInvoiceRepo.create({
        orderNumber,
        amount: invoiceAmount * this.CHARGE_PERCENTAGE,
        jobInvoice: invoice,
        contractor: invoice.contractor,
        status: JobInvoiceStatus.CREATED,
        dueDate: moment()
          .utc()
          .add(1, 'week')
          .toDate(),
        hasDiscount: 0,
      });

      // Send notifications
      const notification = await this.notificationService.createNotification({
        ...RechargedContractor(invoice.amount, invoice.orderNumber),
        userId: invoice.contractor.id,
      });

      this.eventEmitter.emit(
        'sendSocketNotification',
        notification,
        invoice.contractor.id,
      );

      const newAmount =
        invoice.amount + invoice.amount * this.CHARGE_PERCENTAGE;

      this.eventEmitter.emit('sendTextMessage', {
        to: invoice.contractor.phoneNumber,
        body: `Interests were added to the invoice ${invoice.orderNumber}. Please remember to pay on time}`,
      });

      this.emailService.sendAddedInterestsEmail(
        invoice.job.name,
        invoice.contractor.email,
        newAmount,
        invoice.orderNumber,
      );
    }
  }

  async createStripeInvoice(invoice: JobInvoice): Promise<void> {
    const items = await Promise.all(
      invoice.ownerInvoices.map(async ownerInvoice => {
        const ownerCompanyName = (
          await this.ownerRepo.getOwnerCompany(ownerInvoice.owner.id)
        )[0];
        return {
          name: `${ownerCompanyName?.companyCommonName} #${ownerInvoice.jobOrderNumber}`,
          quantity: 1,
          amount: ownerInvoice.netAmount,
        };
      }),
    );

    const {
      customerId,
      stripeInvoiceId,
    } = await this.stripeInvoicingService.createInvoice(
      items,
      `${String(invoice.contractorOrderNumber).padStart(3, '0')}-${String(
        invoice.orderNumber,
      ).padStart(3, '0')}`,
      invoice.contractor,
      invoice.dueDate,
      invoice.contractor.stripeCustomerId,
    );

    this.jobInvoiceRepository.update(invoice.id, {
      stripeInvoiceId,
    });

    if (!invoice.contractor.stripeCustomerId) {
      await this.userRepository.updateCustomerId(
        invoice.contractor,
        customerId,
      );
    }
  }

  async createPaymentIntent(invoice: JobInvoice): Promise<string> {
    const {
      customerId,
      intentId,
    } = await this.paymentsService.createPaymentIntent(
      invoice.getCurrentAmount(),
      invoice.id,
      invoice.contractor,
      invoice.contractor.stripeCustomerId,
    );
    await this.jobInvoiceRepository.update(invoice.id, {
      paymentIntentId: intentId,
    });
    if (!invoice.contractor.stripeCustomerId) {
      await this.userRepository.updateCustomerId(
        invoice.contractor,
        customerId,
      );
    }
    return intentId;
  }

  async getPaymentIntentSecret(invoiceId: string): Promise<string> {
    const invoice = await this.jobInvoiceRepository.findById(invoiceId);
    return this.paymentsService.getIntentsClientSecret(invoice.paymentIntentId);
  }

  async payByBankAccount(
    contractor: Contractor,
    invoiceId: string,
  ): Promise<void> {
    const invoice = await this.jobInvoiceRepository.findById(invoiceId);
    try {
      const charge = await this.paymentsService.createCharge(
        invoice.amount,
        contractor.stripeCustomerId,
        invoice.id,
      );

      let eventsHistory = [];

      if (invoice?.eventsHistory?.length) {
        eventsHistory = invoice.eventsHistory;
      }

      await this.jobInvoiceRepository.update(invoice.id, {
        chargePaymentId: charge.id,
        paidAt: new Date(),
        eventsHistory: [
          ...eventsHistory,
          {
            type: 'PAID',
            date: new Date(),
            by: 'Contractor',
            method: 'Bank Account',
            amount: invoice.amount,
          },
        ],
      });
    } catch (error) {
      if (error.code === 'bank_account_unverified') {
        throw new UnverifiedBankAccountException();
      }
      throw error;
    }
  }

  async payByCard(
    contractor: Contractor,
    invoiceId: string,
    cardToken: string,
  ): Promise<void> {
    const invoice = await this.jobInvoiceRepository.findById(invoiceId);
    try {
      const response: Stripe.Invoice = await this.stripeInvoicingService.payInvoiceByCard(
        cardToken,
        invoice.stripeInvoiceId,
        contractor.stripeCustomerId,
      );

      if (response.paid) {
        await this.markContractorInvoicePaid(invoice.stripeInvoiceId);
      }
    } catch (error) {
      console.error('Error: ', error);
    }
  }

  async payByBank(invoiceId: string, bankId: string): Promise<void> {
    const invoice = await this.jobInvoiceRepository.findById(invoiceId);
    try {
      const response: Stripe.Invoice = await this.stripeInvoicingService.payInvoiceByBank(
        bankId,
        invoice.stripeInvoiceId,
      );

      if (response.paid) {
        await this.markContractorInvoicePaid(invoice.stripeInvoiceId);
      }
    } catch (error) {
      console.error('Error: ', error);
    }
  }

  async markInvoiceProcessingFromCharge(chargeId: string): Promise<void> {
    const invoice = await this.jobInvoiceRepository.findOne({
      chargePaymentId: chargeId,
    });
    await this.jobInvoiceRepository.update(invoice.id, {
      status: JobInvoiceStatus.PROCESSING,
    });
  }

  async markInvoicePaidFromCharge(chargeId: string): Promise<void> {
    const invoice = await this.jobInvoiceRepository.findOne({
      chargePaymentId: chargeId,
    });

    let eventsHistory = [];

    if (invoice?.eventsHistory?.length) {
      eventsHistory = invoice.eventsHistory;
    }

    await this.jobInvoiceRepository.update(invoice.id, {
      isPaid: true,
      paidWith: PaymentMethod.BANK,
      status: JobInvoiceStatus.PAID,
      paidAt: new Date(),
      eventsHistory: [
        ...eventsHistory,
        {
          type: 'PAID',
          date: new Date(),
          by: 'Contractor',
          method: 'Bank Account',
          amount: invoice.amount,
        },
      ],
    });
    await this.jobRepository.update(invoice.job.id, { paidAt: new Date() });
  }

  async markInvoicePaidFromIntent(intentId: string): Promise<void> {
    const invoice = await this.jobInvoiceRepository.findOne({
      paymentIntentId: intentId,
    });
    let eventsHistory = [];

    if (invoice?.eventsHistory?.length) {
      eventsHistory = invoice.eventsHistory;
    }
    await this.jobInvoiceRepository.update(invoice.id, {
      isPaid: true,
      paidWith: PaymentMethod.STRIPE,
      status: JobInvoiceStatus.PAID,
      paidAt: new Date(),
      eventsHistory: [
        ...eventsHistory,
        {
          type: 'PAID',
          date: new Date(),
          by: 'Contractor',
          method: 'Stripe',
          amount: invoice.amount,
        },
      ],
    });
    await this.jobRepository.update(invoice.job.id, { paidAt: new Date() });
  }

  async markContractorInvoicePaid(invoiceId: string): Promise<void> {
    const invoice = await this.jobInvoiceRepository.findOne({
      stripeInvoiceId: invoiceId,
    });
    let eventsHistory = [];

    if (invoice?.eventsHistory?.length) {
      eventsHistory = invoice.eventsHistory;
    }
    await this.jobInvoiceRepository.update(invoice.id, {
      isPaid: true,
      paidWith: PaymentMethod.STRIPE,
      status: JobInvoiceStatus.PAID,
      paidAt: new Date(),
      eventsHistory: [
        ...eventsHistory,
        {
          type: 'PAID',
          date: new Date(),
          by: 'Contractor',
          method: 'Stripe',
          amount: invoice.amount,
        },
      ],
    });
    await this.jobRepository.update(invoice.job.id, { paidAt: new Date() });

    await this.generateOwnerInvociesPayout(invoice.id);
  }

  async markContractorInvoicePaidManually(
    invoiceId: string,
    paymentMethod: string,
    orderNumber: string,
    accountNumber: string,
  ): Promise<void> {
    const invoice = await this.jobInvoiceRepository.findInvoiceById(invoiceId);
    await this.manualPaymentRepository.create({
      jobInvoice: invoice,
      orderNumber,
      accountNumber,
    });
    let eventsHistory = [];

    if (invoice?.eventsHistory?.length) {
      eventsHistory = invoice.eventsHistory;
    }
    await this.jobInvoiceRepository.update(invoice.id, {
      paidWith: paymentMethod as PaymentMethod,
      status: JobInvoiceStatus.PENDING,
      paidAt: new Date(),
      eventsHistory: [
        ...eventsHistory,
        {
          type: 'PAID',
          date: new Date(),
          by: 'Contractor',
          method: paymentMethod,
          amount: invoice.amount,
          data: {
            orderNumber,
          },
        },
      ],
    });

    const admins = await this.userRepository.find({ role: UserRole.ADMIN });
    for (const admin of admins) {
      const notification = await this.notificationService.createNotification({
        ...NewContractorManualPayment(
          invoice.orderNumber,
          invoice.contractor.name,
        ),
        userId: admin.id,
      });

      this.eventEmitter.emit('sendSocketNotification', notification, admin.id);

      this.eventEmitter.emit('sendTextMessage', {
        to: admin.phoneNumber,
        ...NewContractorManualPaymentSMS(
          invoice.orderNumber,
          invoice.contractor.name,
        ),
      });
    }
  }

  async markAdminToOwnerInvoicePaidManually(
    invoiceId: string,
    paymentMethod: string,
    orderNumber: number,
    accountNumber: number,
  ): Promise<void> {
    const actualDate = new Date();
    const invoice = await this.ownerInvoiceRepo.findOwnerInvoiceById(invoiceId);
    invoice.paidWith = paymentMethod as PaymentMethod;
    invoice.status = JobInvoiceStatus.PAID;
    invoice.orderNumber = orderNumber;
    invoice.accountNumber = accountNumber;
    invoice.approvedAt = actualDate;
    invoice.paidAt = actualDate;
    invoice.isPaid = true;
    let eventsHistory = [];

    if (invoice?.eventsHistory?.length) {
      eventsHistory = invoice.eventsHistory;
    }
    invoice.eventsHistory = [
      ...eventsHistory,
      {
        type: 'ACCEPTED',
        date: actualDate,
        by: 'Admin',
        method: paymentMethod,
        amount: invoice.amount,
        data: {
          orderNumber,
        },
      },
    ];
    await this.ownerInvoiceRepo.save(invoice);

    const notification = await this.notificationService.createNotification({
      ...NewAdminManualPayment(invoice.orderNumber),
      userId: invoice.owner.id,
    });

    this.eventEmitter.emit(
      'sendSocketNotification',
      notification,
      invoice.owner.id,
    );

    this.eventEmitter.emit('sendTextMessage', {
      to: invoice.owner.phoneNumber,
      ...NewAdminManualPaymentSMS(invoice.orderNumber),
    });
  }

  async generateOwnerInvociesPayout(invoiceId: string): Promise<void> {
    const invoice = await this.jobInvoiceRepository.findInvoiceById(invoiceId);
    invoice.ownerInvoices.forEach(async ownerInvoice => {
      if (!ownerInvoice.isPaid) {
        await this.transferOwnerInvoice(ownerInvoice);
      }
    });
  }

  async markJobPaid(invoiceId: string): Promise<void> {
    const invoice = await this.jobInvoiceRepository.findById(invoiceId);
    let eventsHistory = [];

    if (invoice?.eventsHistory?.length) {
      eventsHistory = invoice.eventsHistory;
    }
    await this.jobInvoiceRepository.update(invoiceId, {
      isPaid: true,
      paidWith: PaymentMethod.BANK,
      paidAt: new Date(),
      eventsHistory: [
        ...eventsHistory,
        {
          type: 'PAID',
          date: new Date(),
          by: 'Contractor',
          method: 'Bank',
          amount: invoice.amount,
        },
      ],
    });
    await this.jobRepository.update(invoice.job.id, { paidAt: new Date() });
  }

  async markOwnerPaid(invoiceId: string): Promise<void> {
    const invoice = await this.jobInvoiceRepository.findOwnerInvoiceById(
      invoiceId,
    );
    let eventsHistory = [];

    if (invoice?.eventsHistory?.length) {
      eventsHistory = invoice.eventsHistory;
    }
    await this.jobInvoiceRepository.updateOwnerInvoice(invoiceId, {
      isPaid: true,
      paidAt: new Date(),
      eventsHistory: [
        ...eventsHistory,
        {
          type: 'PAID',
          date: new Date(),
          by: 'Contractor',
          method: 'Bank',
          amount: invoice.amount,
        },
      ],
    });
    await this.scheduledJobRepository.update(invoice.scheduledJob.id, {
      paidAt: new Date(),
    });
    const notification = await this.notificationService.createNotification({
      ...PaymentReceivedOwner(invoice.invoiceNumber, invoice.amount),
      userId: invoice.owner.id,
    });

    this.eventEmitter.emit(
      'sendSocketNotification',
      notification,
      invoice.owner.id,
    );

    await this.emailService.sendPaymentEmail(
      invoice.job.name,
      invoice.owner.email,
      invoice.amount,
    );
  }

  async markOwnerPaidFromTransfer(transferId: string): Promise<void> {
    const invoice = await this.jobInvoiceRepository.findOwnerInvoice({
      transferId,
    });
    let eventsHistory = [];

    if (invoice?.eventsHistory?.length) {
      eventsHistory = invoice.eventsHistory;
    }
    await this.jobInvoiceRepository.updateOwnerInvoice(invoice.id, {
      isPaid: true,
      paidAt: new Date(),
      eventsHistory: [
        ...eventsHistory,
        {
          type: 'PAID',
          date: new Date(),
          by: 'Contractor',
          method: 'Bank',
          amount: invoice.amount,
        },
      ],
    });
    await this.scheduledJobRepository.update(invoice.scheduledJob.id, {
      paidAt: new Date(),
    });
    const notification = await this.notificationService.createNotification({
      ...PaymentReceivedOwner(invoice.invoiceNumber, invoice.amount),
      userId: invoice.owner.id,
    });

    this.eventEmitter.emit(
      'sendSocketNotification',
      notification,
      invoice.owner.id,
    );
    await this.emailService.sendPaymentEmail(
      invoice.job.name,
      invoice.owner.email,
      invoice.amount,
    );
  }

  async transferPendingInvoices(): Promise<void> {
    const invoicesToPay = await this.jobInvoiceRepository.findOwnerInvoicesToPay();
    await Promise.all(
      invoicesToPay.map(async invoice => {
        if (!invoice.isPaid) {
          await this.transferOwnerInvoice(invoice);
        }
      }),
    );
  }

  async payOwnerInvoice(invoiceId: string): Promise<void> {
    const invoice = await this.jobInvoiceRepository.findOwnerInvoiceById(
      invoiceId,
    );
    // if (!invoice.owner.completedStripeAccount)
    //   throw new StripeAccountNotCompletedException();

    await this.transferOwnerInvoice(invoice);
    await this.scheduledJobRepository.update(invoice.scheduledJob.id, {
      paidAt: new Date(),
    });
  }

  private async transferOwnerInvoice(invoice: OwnerJobInvoice): Promise<void> {
    try {
      const transferId = await this.paymentsService.createTransfer(
        invoice.amount,
        invoice.owner.stripeAccountId,
      );

      invoice.transferId = transferId;
      invoice.isPaid = true;
      invoice.paidAt = new Date();
      let eventsHistory = [];

      if (invoice?.eventsHistory?.length) {
        eventsHistory = invoice.eventsHistory;
      }
      invoice.eventsHistory = [
        ...eventsHistory,
        {
          type: 'PAID',
          date: new Date(),
          by: 'Contractor',
          method: 'Bank',
          amount: invoice.amount,
        },
      ];

      const { scheduledJob } = invoice;

      await this.scheduledJobRepository.update(scheduledJob.id, {
        paidAt: new Date(),
      });

      await this.jobInvoiceRepository.saveOwnerInvoice(invoice);

      const notification = await this.notificationService.createNotification({
        ...PaymentReceivedOwner(invoice.invoiceNumber, invoice.amount),
        userId: invoice.owner.id,
      });

      this.eventEmitter.emit(
        'sendSocketNotification',
        notification,
        invoice.owner.id,
      );

      await this.emailService.sendPaymentEmail(
        invoice.job.name,
        invoice.owner.email,
        invoice.amount,
      );
    } catch (error) {
      if (error.code === 'balance_insufficient')
        throw new StripeBalanceInsufficientException();
      throw new StripeErrorException();
    }
  }

  async getOwnerProfits(owner: Owner): Promise<number> {
    const ownerPaidInvoices = await this.jobInvoiceRepository.findAllOwnerInvoices(
      owner,
      true,
    );
    return ownerPaidInvoices;
  }

  async getOwnerUnpaidProfits(owner: Owner): Promise<number> {
    const ownerUnpaidInvoices = await this.jobInvoiceRepository.findAllOwnerInvoices(
      owner,
      false,
    );
    return ownerUnpaidInvoices;
  }

  async getTotalAmountPaidContractorInvoices(
    contractor: Contractor,
  ): Promise<number> {
    const totalAmount = await this.jobInvoiceRepository.getTotalAmountContractorInvoices(
      contractor,
      true,
    );
    return totalAmount;
  }

  async getTotalAmountUnPaidContractorInvoices(
    contractor: Contractor,
  ): Promise<number> {
    const totalAmount = await this.jobInvoiceRepository.getTotalAmountContractorInvoices(
      contractor,
      false,
    );
    return totalAmount;
  }

  private async getAmount(
    assignation: JobAssignation,
    job: Job,
    { tons, load }: { tons: number; load: number },
  ): Promise<number> {
    const timeEntries = await this.timeEntryRepository.findTimeEntriesForUserAndJob(
      assignation.driver,
      job.id,
      assignation,
    );
    if (timeEntries.length === 0) {
      return 0;
    }
    let hours = getRoundedHours(timeEntries);

    if (
      assignation.travelTimeSupervisor &&
      assignation.travelTimeSupervisor > 0
    )
      hours += assignation.travelTimeSupervisor / 3600;
    const amount = this.jobInvoiceCalculator.calculateAmount(
      assignation.price,
      assignation.payBy,
      { tons, load },
      hours,
    );

    return amount;
  }

  async requestCashAdvance(owner: Owner, invoiceId: string): Promise<void> {
    const invoice = await this.getInvoiceForOwner(owner, invoiceId);
    if (invoice.cashAdvanceRequest)
      throw new AlreadyAppliedForCashAdavanceException();
    if (
      invoice.cashAdvanceRequest &&
      invoice.cashAdvanceConfirmed &&
      !invoice.cashAdvanceAccepted
    )
      throw new CashAdvanceAlreadyRejectedException();
    invoice.cashAdvanceRequest = true;
    await this.jobInvoiceRepository.saveOwnerInvoice(invoice);
  }

  async acceptInvoicesAutomatically(): Promise<void> {
    const ownerInvoices = await this.ownerInvoiceRepo.findAll();

    const now = moment(new Date());

    await Promise.all(
      ownerInvoices.map(async ownerInvoice => {
        if (
          !ownerInvoice.isAcceptedByContractor &&
          !ownerInvoice.isAcceptedByOwner &&
          !ownerInvoice.disputeInvoice
        ) {
          const dueDate = moment(ownerInvoice.dueDate);
          const createdAt = moment(ownerInvoice.createdAt).add(48, 'hours');

          if (now > dueDate || now > createdAt) {
            ownerInvoice.isAcceptedByContractor = true;
            ownerInvoice.isAcceptedByOwner = true;
            let eventsHistory = [];

            if (ownerInvoice?.eventsHistory?.length) {
              eventsHistory = ownerInvoice.eventsHistory;
            }
            ownerInvoice.eventsHistory = [
              ...eventsHistory,
              {
                type: 'ACCEPTED',
                amount: ownerInvoice.amount,
                date: new Date(),
                by: 'Contractor',
              },
            ];
            await this.ownerInvoiceRepo.save(ownerInvoice);

            const { driverInvoices } = ownerInvoice;

            await Promise.all(
              driverInvoices.map(async driverInvoice => {
                driverInvoice.isAcceptedByOwner = true;
                driverInvoice.isAcceptedByContractor = true;

                await this.driverJobInvoiceRepo.save(driverInvoice);
              }),
            );
          }
        }
      }),
    );
  }

  async reviewCashAdvance(invoiceId: string, confirm: boolean): Promise<void> {
    const invoice = await this.jobInvoiceRepository.findOwnerInvoiceById(
      invoiceId,
    );
    if (!invoice.cashAdvanceRequest)
      throw new NoCashAdvanceRequestedException();
    if (confirm) {
      const ownerFeePercentageMoney =
        invoice.netAmount * this.OWNER_FEES_PERCENTAGE;
      const cashAdvancePercentageMoney =
        invoice.netAmount * this.CASH_ADVANCE_FEE;
      const finalAmount =
        invoice.netAmount -
        (ownerFeePercentageMoney + cashAdvancePercentageMoney);
      await this.jobInvoiceRepository.updateOwnerInvoice(invoice.id, {
        cashAdvanceConfirmed: true,
        cashAdvanceAccepted: confirm,
        amount: finalAmount,
      });

      const ownerInvoice = await this.jobInvoiceRepository.findOwnerInvoiceById(
        invoiceId,
      );

      await this.transferOwnerInvoice(ownerInvoice);
    } else {
      await this.jobInvoiceRepository.updateOwnerInvoice(invoice.id, {
        cashAdvanceConfirmed: true,
        cashAdvanceAccepted: confirm,
      });
    }
    const confirmToString = confirm ? 'accepted' : 'rejected';
    this.eventEmitter.emit('sendTextMessage', {
      to: invoice.owner.phoneNumber,
      body: `Your cash advance request has been ${confirmToString} `,
    });

    const notification = await this.notificationService.createNotification({
      title: `Cash advance ${confirmToString}`,
      content: `Your cash advance request has been ${confirmToString}`,
      submitted: new Date(),
      isChecked: false,
      priority: 1,
      userId: invoice.owner.id,
    });

    this.eventEmitter.emit(
      'sendSocketNotification',
      notification,
      invoice.owner.id,
    );

    await this.emailService.sendCashAdvanceReviewed(
      invoice.owner.email,
      invoice.jobOrderNumber,
      confirm,
    );
  }

  async createInvoiceForDispute(
    jobInvoiceId: string,
    driverInvoiceId: string,
    disputeLoads: DisputeLoads[],
    disputeInvoice: DisputeInvoice,
  ): Promise<{
      ownerInvoice: OwnerJobInvoice;
      driverInvoice: DriverJobInvoice;
      prevDriverInvoice: DriverJobInvoice;
    }> {
    const jobInvoice = await this.jobInvoiceRepository.findById(jobInvoiceId);
    const lastInvoice = await this.jobInvoiceRepository.findInvoiceByOrderNumber(
      jobInvoice.orderNumber,
    );
    const driverInvoice = await this.driverJobInvoiceRepo.getDriverInvoiceById(
      driverInvoiceId,
    );

    const { ownerInvoice } = driverInvoice;
    const { contractor } = jobInvoice;
    const { owner } = ownerInvoice;
    const isAssociatedUser =
      contractor.associatedUserId === owner.id &&
      owner.associatedUserId === contractor.id;

    let newDueDate = moment(jobInvoice.dueDate).utc();
    newDueDate.add(
      moment()
        .utc()
        .diff(moment(disputeInvoice.createdAt), 'days'),
      'days',
    );

    const newJobInvoice = new JobInvoice();
    const newOwnerInvoice = new OwnerJobInvoice();
    const newDriverInvoice = new DriverJobInvoice();

    newJobInvoice.amount = driverInvoice.amount;
    newJobInvoice.job = jobInvoice.job;
    newJobInvoice.dueDate = newDueDate.toDate(); // ....
    newJobInvoice.status = JobInvoiceStatus.CREATED;
    newJobInvoice.isPaid = false;
    newJobInvoice.contractor = jobInvoice.contractor;
    newJobInvoice.isAccepted = false;
    newJobInvoice.orderNumber = jobInvoice.orderNumber;
    newJobInvoice.contractorOrderNumber = jobInvoice.contractorOrderNumber;
    newJobInvoice.currDispute = lastInvoice.currDispute + 1;
    newJobInvoice.hasDiscount = jobInvoice.hasDiscount;

    let eventsHistory = [];

    if (jobInvoice?.eventsHistory?.length) {
      eventsHistory = jobInvoice.eventsHistory;
    }

    newJobInvoice.eventsHistory = [
      ...eventsHistory,
      {
        type: 'DISPUTE',
        amount: driverInvoice.amount,
        date: new Date(),
        by: 'Contractor',
      },
    ];

    newOwnerInvoice.hasDiscount = ownerInvoice.hasDiscount;
    newOwnerInvoice.job = driverInvoice.job;
    newOwnerInvoice.jobOrderNumber = ownerInvoice.jobOrderNumber;
    newOwnerInvoice.ownerOrderNumber = ownerInvoice.ownerOrderNumber;
    newOwnerInvoice.netAmount = driverInvoice.amount;
    newOwnerInvoice.owner = ownerInvoice.owner;
    newOwnerInvoice.isPaid = false;
    newOwnerInvoice.dueDate = newDueDate.toDate(); // ...
    newOwnerInvoice.currDispute = ownerInvoice.currDispute + 1;
    newOwnerInvoice.scheduledJob = ownerInvoice.scheduledJob;
    newOwnerInvoice.invoiceNumber = ownerInvoice.invoiceNumber;
    newOwnerInvoice.isAssociatedInvoice = ownerInvoice.isAssociatedInvoice;
    newOwnerInvoice.amount = !isAssociatedUser
      ? driverInvoice.amount * (1 - this.OWNER_FEES_PERCENTAGE)
      : driverInvoice.amount;

    let ownerEventsHistory = [];

    if (ownerInvoice?.eventsHistory?.length) {
      ownerEventsHistory = ownerInvoice.eventsHistory;
    }
    newOwnerInvoice.eventsHistory = [
      ...ownerEventsHistory,
      {
        type: 'DISPUTE',
        amount: newOwnerInvoice.amount,
        date: new Date(),
        by: 'Contractor',
      },
    ];

    newDriverInvoice.jobOrderNumber = driverInvoice.jobOrderNumber;
    newDriverInvoice.amount = driverInvoice.amount;
    newDriverInvoice.job = driverInvoice.job;
    newDriverInvoice.hours = driverInvoice.hours;
    newDriverInvoice.truck = driverInvoice.truck;
    newDriverInvoice.driver = driverInvoice.driver;
    newDriverInvoice.sumLoad = driverInvoice.sumLoad;
    newDriverInvoice.sumTons = driverInvoice.sumTons;
    newDriverInvoice.comment = driverInvoice.comment;
    newDriverInvoice.category = driverInvoice.category;
    newDriverInvoice.timeEntries = await Promise.all(
      driverInvoice.timeEntries.map(async entry => {
        const timeEntry = new TimeEntry();
        timeEntry.startDate = entry.startDate;
        timeEntry.truck = driverInvoice.truck;
        timeEntry.user = driverInvoice.driver;
        timeEntry.job = driverInvoice.job;
        timeEntry.endDate = entry.endDate;
        timeEntry.driverAssignation = entry.driverAssignation;

        const newTimeEntry = await this.timeEntryRepository.create(timeEntry);

        return newTimeEntry;
      }),
    );
    newDriverInvoice.evidenceImgs = driverInvoice.evidenceImgs;
    newDriverInvoice.ticketNumber = driverInvoice.ticketNumber;
    newDriverInvoice.ticketEntries = driverInvoice.ticketEntries;
    newDriverInvoice.totalTravels = driverInvoice.totalTravels;
    newDriverInvoice.signatureImg = driverInvoice.signatureImg;
    newDriverInvoice.supervisorComment = driverInvoice.supervisorComment;
    newDriverInvoice.supervisorName = driverInvoice.supervisorName;
    newDriverInvoice.travelTime = driverInvoice.travelTime;
    newDriverInvoice.loads = disputeLoads;

    newJobInvoice.ownerInvoices = [newOwnerInvoice];
    newOwnerInvoice.driverInvoices = [newDriverInvoice];

    const invoice = await this.jobInvoiceRepository.save(newJobInvoice);

    return {
      driverInvoice: invoice.ownerInvoices[0].driverInvoices[0],
      ownerInvoice: invoice.ownerInvoices[0],
      prevDriverInvoice: driverInvoice,
    };
  }
}
