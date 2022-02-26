import { Inject, Injectable, Logger } from '@nestjs/common';

import { ConfigType } from '@nestjs/config';
import * as dateFns from 'date-fns';
import { format } from 'date-fns';
import { SenderService } from './sender.service';
import { TemplateService } from '../util/template/template.service';
import { Templates } from '../templates/templates.enum';
import baseConfig from '../config/base.config';
import { WeekActualWork } from '../invoices/driver-job-invoice.service';
import { TruckCategoryDTO } from '../jobs/dto/truck-category.dto';

export interface Email {
  to: string;
  subject: string;
  html: string;
}

export class WeeklySummary {
  date: string;
  hoursWorked: number;
  totalMoney: number;
}

const formatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
});
@Injectable()
export class EmailService {
  private readonly adminUrl = '';
  private readonly logger = new Logger('EmailService', true);
  constructor(
    private readonly templateService: TemplateService,
    private readonly senderService: SenderService,
    @Inject(baseConfig.KEY)
    private readonly baseConf: ConfigType<typeof baseConfig>,
  ) {}

  async sendEmailVerificationOwner(
    email: string,
    link: string,
    showAppButtons: boolean,
  ): Promise<boolean> {
    const adminUrl = this.baseConf.adminURL;
    return this.senderService.sendEmail({
      to: email,
      subject: 'Verify your Email',
      html: this.templateService.templateToHTML(Templates.VERIFY_EMAIL_OWNER, {
        link,
        adminUrl,
        showAppButtons,
      }),
    });
  }

  async sendEmailVerificationContractor(
    email: string,
    link: string,
    showAppButtons: boolean,
  ): Promise<boolean> {
    const adminUrl = this.baseConf.adminURL;
    return this.senderService.sendEmail({
      to: email,
      subject: 'Verify your Email',
      html: this.templateService.templateToHTML(
        Templates.VERIFY_EMAIL_CONTRACTOR,
        {
          link,
          adminUrl,
          showAppButtons,
        },
      ),
    });
  }

  async sendForgotPasswordEmail(email: string, link: string): Promise<boolean> {
    return this.senderService.sendEmail({
      to: email,
      subject: 'Reset your password',
      html: this.templateService.templateToHTML(Templates.FORGOT_PASSWORD, {
        link,
      }),
    });
  }

  async sendEmailWithNewPassword(
    email: string,
    name: string,
    newPassword: string,
  ): Promise<boolean> {
    return this.senderService.sendEmail({
      to: email,
      subject: 'Your password has been reset',
      html: this.templateService.templateToHTML(
        Templates.SEND_EMAIL_WITH_PASSWORD,
        {
          newPassword,
          name,
        },
      ),
    });
  }

  async sendNewPasswordEmail(
    email: string,
    name: string,
    newPassword: string,
  ): Promise<boolean> {
    return this.senderService.sendEmail({
      to: email,
      subject: 'Your password has been reset',
      html: this.templateService.templateToHTML(Templates.NEW_PASSWORD, {
        newPassword,
        name,
      }),
    });
  }

  async sendDriverCreds(
    name: string,
    email: string,
    password: string,
    ownerName: string,
    adminUrl: string,
  ): Promise<boolean> {
    return this.senderService.sendEmail({
      to: email,
      subject: `Your Driver Account`,
      html: this.templateService.templateToHTML(Templates.DRIVER_CREDS, {
        name,
        email,
        password,
        ownerName,
        adminUrl,
      }),
    });
  }

  async sendUpdatedShiftEmailNotification(): Promise<boolean> {
    return true;

    // this.senderService.sendEmail({
    //   to: email,
    //   subject: `New job assigned ${jobName}`,
    //   html: this.templateService.templateToHTML(Templates.NEW_JOB_DRIVER, {
    //     jobName,
    //     jobLoadSite,
    //     jobStartDate,
    //     plateNumber,
    //     time,
    //     truckType,
    //     truckSubtype,
    //     endTime,
    //   }),
    // });
  }

  async sendDriverNewJob(
    jobName: string,
    email: string,
    jobLoadSite: string,
    jobStartDate: string,
    plateNumber: string,
    truckType: string,
    truckSubtype: string,
    time: string,
    endTime: string,
  ): Promise<boolean> {
    return this.senderService.sendEmail({
      to: email,
      subject: `New job assigned ${jobName}`,
      html: this.templateService.templateToHTML(Templates.NEW_JOB_DRIVER, {
        jobName,
        jobLoadSite,
        jobStartDate,
        plateNumber,
        time,
        truckType,
        truckSubtype,
        endTime,
      }),
    });
  }

  async sendContractorNewJobAssignation(
    // deleted
    jobName: string,
    email: string,
    driverName: string,
    truckType: string,
    truckSubtype: string[],
  ): Promise<boolean> {
    return this.senderService.sendEmail({
      to: email,
      subject: `New driver assigned to ${jobName}`,
      html: this.templateService.templateToHTML(Templates.NEW_DRIVER_ASSIGNED, {
        jobName,
        driverName,
        truckType,
        truckSubtype,
      }),
    });
  }

  async sendContractorFulfilledJob(
    jobName: string,
    email: string,
  ): Promise<boolean> {
    return this.senderService.sendEmail({
      to: email,
      subject: `All the positions at job ${jobName} have been fulfilled`,
      html: this.templateService.templateToHTML(Templates.JOB_COMPLETE, {
        jobName,
      }),
    });
  }

  async sendOwnerNewJobInArea(
    jobName: string,
    email: string,
  ): Promise<boolean> {
    return this.senderService.sendEmail({
      to: email,
      subject: 'There is a new job in your area',
      html: this.templateService.templateToHTML(Templates.NEW_JOB_IN_THE_AREA, {
        jobName,
      }),
    });
  }

  async sendToOwnerJobStarted(
    // deleted
    jobName: string,
    email: string,
    driverName: string,
  ): Promise<boolean> {
    return this.senderService.sendEmail({
      to: email,
      subject: `Driver ${driverName} is starting job ${jobName}`,
      html: this.templateService.templateToHTML(Templates.DRIVER_STARTED_JOB, {
        jobName,
        driverName,
      }),
    });
  }

  async sendToOwnerProblemReported(
    jobName: string,
    email: string,
    driverName: string,
    problemSubject: string,
    problemDescription: string,
  ): Promise<boolean> {
    return this.senderService.sendEmail({
      to: email,
      subject: 'Problem reported',
      html: this.templateService.templateToHTML(Templates.PROBLEM_REPORTED, {
        jobName,
        driverName,
        problemSubject,
        problemDescription,
      }),
    });
  }

  async sendJobCanceledEmail(
    jobName: string,
    email: string,
    canceledBy: string,
  ): Promise<boolean> {
    return this.senderService.sendEmail({
      to: email,
      subject: 'Job canceled',
      html: this.templateService.templateToHTML(Templates.CANCELED_JOB, {
        jobName,
        canceledBy,
      }),
    });
  }

  async sendAddedInterestsEmail(
    jobName: string,
    email: string,
    amount: number,
    invoiceNumber: number,
  ): Promise<boolean> {
    const fomattedAmount = formatter.format(amount);
    return this.senderService.sendEmail({
      to: email,
      subject: 'Added interests',
      html: this.templateService.templateToHTML(Templates.ADDED_INTERESTS, {
        jobName,
        fomattedAmount,
        invoiceNumber,
      }),
    });
  }

  async sendPaymentEmail(
    jobName: string,
    email: string,
    amount: number,
  ): Promise<boolean> {
    const fomattedAmount = formatter.format(amount);
    return this.senderService.sendEmail({
      to: email,
      subject: 'Payment received',
      html: this.templateService.templateToHTML(Templates.PAYMENT_RECEIVED, {
        jobName,
        fomattedAmount,
      }),
    });
  }

  async sendNewDisputeOwnerEmail(
    jobName: string,
    email: string,
    message: string,
    reportBy: string,
    invoiceID: string,
  ): Promise<boolean> {
    return this.senderService.sendEmail({
      to: email,
      subject: 'New dispute',
      html: this.templateService.templateToHTML(Templates.NEW_DISPUTE, {
        jobName,
        message,
        invoiceID,
        reportBy,
      }),
    });
  }

  async sendNewDisputeContractorEmail(
    jobName: string,
    email: string,
    message: string,
    reportBy: string,
    invoiceID: string,
  ): Promise<boolean> {
    return this.senderService.sendEmail({
      to: email,
      subject: 'New dispute',
      html: this.templateService.templateToHTML(Templates.NEW_DISPUTE, {
        jobName,
        message,
        invoiceID,
        reportBy,
      }),
    });
  }

  async sendDisputeResolvedConEmail(
    jobName: string,
    email: string,
    disputeConfirmed: boolean,
  ): Promise<boolean> {
    return this.senderService.sendEmail({
      to: email,
      subject: 'Dispute resolved',
      html: this.templateService.templateToHTML(Templates.DISPUTE_RESOLVED, {
        jobName,
        disputeConfirmed,
      }),
    });
  }

  async disputesolved(
    InvoiceNumber: string,
    Resolution: string,
    email: string,
  ): Promise<boolean> {
    return this.senderService.sendEmail({
      to: email,
      subject: 'Dispute solved',
      html: this.templateService.templateToHTML(Templates.SOLVED_DISPUTE, {
        InvoiceNumber,
        Resolution,
      }),
    });
  }

  async sendAssignationFinishedEmail(
    email: string,
    driverName: string,
    imageUrl: string,
    amount: number,
    hours: number,
    sumLoad: number,
    sumTons: number,
    jobName: string,
  ): Promise<boolean> {
    const formattedAmount = formatter.format(amount);
    return this.senderService.sendEmail({
      to: email,
      subject: 'Job assignation finished',
      html: this.templateService.templateToHTML(
        Templates.ASSIGNATION_FINISHED_EMAIL,
        {
          driverName,
          imageUrl,
          formattedAmount,
          hours,
          sumLoad,
          sumTons,
          jobName,
        },
      ),
    });
  }

  async sendOwnerFinishedScheduleJobEmail(
    email: string,
    amount: number,
    dueDate: string,
    totalLoads: number,
    totalTons: number,
    orderNumber: number,
    jobName: string,
  ): Promise<boolean> {
    const formattedAmount = formatter.format(amount);
    return this.senderService.sendEmail({
      to: email,
      subject: 'Scheduled job finished',
      html: this.templateService.templateToHTML(
        Templates.SCHEDULED_JOB_FINISHED_OWNER,
        {
          formattedAmount,
          dueDate,
          totalLoads,
          totalTons,
          orderNumber,
          jobName,
        },
      ),
    });
  }

  async sendContractorFinishedScheduleJobEmail(
    email: string,
    amount: number,
    dueDate: string,
    totalLoads: number,
    totalTons: number,
    orderNumber: number,
    jobName: string,
  ): Promise<boolean> {
    const formattedAmount = formatter.format(amount);
    return this.senderService.sendEmail({
      to: email,
      subject: 'Scheduled job finished',
      html: this.templateService.templateToHTML(
        Templates.SCHEDULED_JOB_FINISHED_CONTRACTOR,
        {
          formattedAmount,
          dueDate,
          totalLoads,
          totalTons,
          orderNumber,
          jobName,
        },
      ),
    });
  }

  async sendContractorFinishedJobEmail(
    // deleted contractor
    email: string,
    paymentDue: string,
    amount: number,
    orderNumber: number,
    sumTons: number,
    sumLoads: number,
    jobName: string,
    jobPaymentDueDate: string,
  ): Promise<boolean> {
    const formattedAmount = formatter.format(amount);
    return this.senderService.sendEmail({
      to: email,
      subject: 'Job finished',
      html: this.templateService.templateToHTML(
        Templates.FINISHED_JOB_CONTRACTOR,
        {
          paymentDue,
          formattedAmount,
          orderNumber,
          sumTons,
          sumLoads,
          jobName,
          jobPaymentDueDate,
        },
      ),
    });
  }

  async sendOwnerDisableEmail(name: string, email: string): Promise<boolean> {
    return this.senderService.sendEmail({
      to: email,
      subject: `Please verify documents`,
      html: this.templateService.templateToHTML(Templates.DISABLE_OWNER, {
        name,
      }),
    });
  }

  async sendContractorDisableEmail(
    name: string,
    email: string,
  ): Promise<boolean> {
    return this.senderService.sendEmail({
      to: email,
      subject: `Please verify documents`,
      html: this.templateService.templateToHTML(Templates.DISABLE_CONTRACTOR, {
        name,
      }),
    });
  }

  async sendDispatcherCreds(
    name: string,
    email: string,
    password: string,
    ownerName: string,
    adminUrl: string,
  ): Promise<boolean> {
    return this.senderService.sendEmail({
      to: email,
      subject: `Your Dispatcher Account`,
      html: this.templateService.templateToHTML(Templates.DISPATCHER_CREDS, {
        name,
        email,
        password,
        ownerName,
        adminUrl,
      }),
    });
  }

  async sendForemanCreds(
    name: string,
    email: string,
    password: string,
    ownerName: string,
    adminUrl: string,
  ): Promise<boolean> {
    return this.senderService.sendEmail({
      to: email,
      subject: `Your Foreman Account`,
      html: this.templateService.templateToHTML(Templates.DISPATCHER_CREDS, {
        name,
        email,
        password,
        ownerName,
        adminUrl,
      }),
    });
  }

  async sendContractorAcceptedByAdminEmail(
    name: string,
    email: string,
  ): Promise<boolean> {
    return this.senderService.sendEmail({
      to: email,
      subject: `Account verified`,
      html: this.templateService.templateToHTML(
        Templates.CONTRACTOR_ACCOUNT_VERIFIFED_BY_ADMIN,
        {
          name,
        },
      ),
    });
  }

  async sendOwnerAcceptedByAdminEmail(
    name: string,
    email: string,
  ): Promise<boolean> {
    return this.senderService.sendEmail({
      to: email,
      subject: `Account verified`,
      html: this.templateService.templateToHTML(
        Templates.OWNER_ACCOUNT_VERIFIFED_BY_ADMIN,
        {
          name,
        },
      ),
    });
  }

  async sendNewProblemEmail(
    email: string,
    jobName: string,
    driverName: string,
    problemSubject: string,
    problemDescription: string,
  ): Promise<boolean> {
    return this.senderService.sendEmail({
      to: email,
      subject: `Problem reported at job ${jobName}`,
      html: this.templateService.templateToHTML(Templates.PROBLEM_REPORTED, {
        jobName,
        driverName,
        problemSubject,
        problemDescription,
      }),
    });
  }

  async sendDriverWeeklySummaryEmail(
    email: string,
    hours: number,
    amount: number,
    actualWorkList: WeekActualWork[],
    pricePerHour: number,
    invoices: any,
  ): Promise<boolean> {
    const fomattedAmount = formatter.format(amount);
    return this.senderService.sendEmail({
      to: email,
      subject: `Your weekly summary`,
      html: this.templateService.templateToHTML(
        Templates.DRIVER_WEEKLY_SUMMARY,
        {
          hours,
          amount: fomattedAmount,
          actualWorkList,
          dateFormatter: dateFns,
          pricePerHour,
          ownerCompanyname: 'Testing',
          ownerCompanyphone: '+142654254',
          name: invoices.driver.email,
          start: invoices.startDate,
          end: invoices.endDate,
        },
      ),
    });
  }

  async sendPaymentReminderEmail(
    email: string,
    dueDate: string,
    invoiceNumber: number,
    jobName: string,
  ): Promise<boolean> {
    return this.senderService.sendEmail({
      to: email,
      subject: `Payment reminder`,
      html: this.templateService.templateToHTML(Templates.FUTURE_SURCHARGE, {
        dueDate,
        invoiceNumber,
        jobName,
      }),
    });
  }

  async sendOwnerNotStartedJobByDriver(
    // deleted
    email: string,
    jobName: string,
    driverName: string,
  ): Promise<boolean> {
    return this.senderService.sendEmail({
      to: email,
      subject: `Your driver never started with ${jobName}`,
      html: this.templateService.templateToHTML(Templates.JOB_NOT_STARTED, {
        jobName,
        driverName,
      }),
    });
  }

  async sendJobNotFilledOut(email: string, jobName: string): Promise<boolean> {
    return this.senderService.sendEmail({
      to: email,
      subject: `Job ${jobName} has not been filled out`,
      html: this.templateService.templateToHTML(Templates.JOB_NOT_FILLED_OUT, {
        jobName,
      }),
    });
  }

  async sendCashAdvanceReviewed(
    email: string,
    invoiceNumber: number,
    confirm: boolean,
  ): Promise<boolean> {
    return this.senderService.sendEmail({
      to: email,
      subject: `Your cash advance request was ${
        confirm ? 'accepted' : 'rejected'
      } `,
      html: this.templateService.templateToHTML(Templates.CASH_ADVANCE_REVIEW, {
        invoiceNumber,
        confirm,
      }),
    });
  }

  async sendOwnerNewTruckReviewEmail(
    email: string,
    jobName: string,
    truckNumber: string,
    stars: number,
    comment: string,
  ): Promise<boolean> {
    return this.senderService.sendEmail({
      to: email,
      subject: 'New truck review',
      html: this.templateService.templateToHTML(Templates.NEW_TRUCK_REVIEW, {
        jobName,
        truckNumber,
        stars,
        comment,
      }),
    });
  }

  async sendAutomaticallyClockedOutToDriver(
    email: string,
    jobName: string,
  ): Promise<boolean> {
    return this.senderService.sendEmail({
      to: email,
      subject: `Automatically clocked out for job ${jobName}`,
      html: this.templateService.templateToHTML(
        Templates.AUTOMATICALLY_CLOKED_OUT,
        {
          jobName,
        },
      ),
    });
  }

  async sendAutomaticallyClockedOutToOwner(
    email: string,
    jobName: string,
    driverName: string,
  ): Promise<boolean> {
    return this.senderService.sendEmail({
      to: email,
      subject: `Your driver ${driverName} was automatically clocked out for job ${jobName}`,
      html: this.templateService.templateToHTML(
        Templates.AUTOMATICALLY_CLOKED_OUT_OWNER,
        {
          jobName,
          driverName,
        },
      ),
    });
  }

  async sendAssignationFinishedAutomaticallyEmail(
    email: string,
    driverName: string,
    amount: number,
    hours: number,
    sumLoad: number,
    sumTons: number,
    jobName: string,
  ): Promise<boolean> {
    const formattedAmount = formatter.format(amount);
    return this.senderService.sendEmail({
      to: email,
      subject: 'Job assignation finished',
      html: this.templateService.templateToHTML(
        Templates.ASSIGNATION_FINISHED_AUTOMATICALLY,
        {
          driverName,
          formattedAmount,
          hours,
          sumLoad,
          sumTons,
          jobName,
        },
      ),
    });
  }

  async sendContractorAndDispatchersRequestTruck(
    name: string,
    email: string,
    startDate: Date,
    endDate: Date,
    loadSite: string,
    dumpSite: string,
    material: string,
    direactions: string,
    truckCategories: TruckCategoryDTO[],
  ): Promise<any> {
    const parseStartDate = format(new Date(startDate), 'yyyy-MM-dd HH:mm a');
    const parseEndDate = format(new Date(endDate), 'yyyy-MM-dd HH:mm a');

    return this.senderService.sendEmail({
      to: email,
      subject: 'Send request truck',
      html: this.templateService.templateToHTML(Templates.REQUEST_TRUCK, {
        name,
        parseStartDate,
        parseEndDate,
        loadSite,
        dumpSite,
        material,
        direactions,
        truckCategories,
      }),
    });
  }
}
