import { Injectable } from '@nestjs/common';
import { subDays, subWeeks } from 'date-fns';
import _ from 'lodash';
import { EmailService } from '../email/email.service';
import { JobAssignation } from '../jobs/job-assignation.model';
import { Job } from '../jobs/job.model';
import { JobsService } from '../jobs/jobs.service';
import { ScheduledJob } from '../jobs/scheduled-job.model';
import { ScheduledJobRepo } from '../jobs/scheduled-job.repository';
import { TimeEntry } from '../timer/time-entry.model';

import { TimeEntryRepo } from '../timer/time-entry.repository';
import { Driver } from '../user/driver.model';
import { Owner } from '../user/owner.model';
import { User, UserRole } from '../user/user.model';
import { UserRepo } from '../user/user.repository';
import {
  getNotRoundedHours,
  getRoundedHours,
  getRoundedHoursFromPunchs,
} from '../util/date-utils';
import { DriverWeeklyInvoice } from './driver-weekly-invoice.model';
import { DriverWeeklyInvoiceRepo } from './driver-weekly-invoice.repository';
import { Contractor } from '../user/contractor.model';
import { DriverJobInvoiceRepo } from './driver-job-invoice.repository';
import { DriverJobInvoice } from './driver-job-invoice.model';
import { OwnerJobInvoiceRepo } from './owner-job-invoice.repository';
import { DriverPaymentMethods } from '../user/driverPaymentMethods';
import { TruckPunchRepo } from '../trucks/truck-punch.repository';
import { CustomerRepo } from '../customer/customer.repository';
import { GeneralJobRepo } from '../general-jobs/general-job.repository';
import { JobAssignationRepo } from '../jobs/job-assignation.repository';
import { BillsTicketsFiltered } from './dto/bills-tickets-filtered.dto';
import { DriverWeeklyInvoicesDTO } from './dto/driver-weekly-invoice.dto';
import { PaymentMethod } from './payment-method';

export interface WeekActualWork {
  driver: User;
  assignation: JobAssignation;
  totalHours: number;
  amount: number;
  job: Job;
  entries: TimeEntry[];
  hours: number;
  minutes: number;
  seconds: number;
}

interface WeeklyWork {
  from: string;
  to: string;
  weekWork: WeeklyActualWork[];
}

interface WeeklyActualWork {
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

@Injectable()
export class DriverJobInvoiceService {
  constructor(
    private readonly timeEntryRepository: TimeEntryRepo,
    private readonly userRepository: UserRepo,
    private readonly driverWeeklyInvoiceRepo: DriverWeeklyInvoiceRepo,
    private readonly emailService: EmailService,
    private readonly scheduledJobRepo: ScheduledJobRepo,
    private readonly jobService: JobsService,
    private readonly driverJobInvoiceRepo: DriverJobInvoiceRepo,
    private readonly ownerJobInvoiceRepo: OwnerJobInvoiceRepo,
    private readonly truckPunchRepo: TruckPunchRepo,
    private readonly customerRepo: CustomerRepo,
    private readonly generalJobRepo: GeneralJobRepo,
    private readonly jobAssignationRepo: JobAssignationRepo,
  ) {}

  async getDriverInvoicesForContractor(
    user: Contractor,
    { skip, count, from, to, projectId, customerId, truckId },
  ): Promise<DriverJobInvoice[]> {
    return this.driverJobInvoiceRepo.findDriverInvoicesForContractor(user, {
      skip,
      count,
      from,
      to,
      projectId,
      customerId,
      truckId,
    });
  }

  async getDriverInvoiceForAdmin(
    driverJobInvoiceId: string,
  ): Promise<DriverJobInvoice> {
    const invoice = await this.driverJobInvoiceRepo.findDriverJobInvoiceForAdmin(
      driverJobInvoiceId,
    );

    const ownerCompany = await this.userRepository.getOwnerCompany(
      invoice.ownerInvoice.owner,
    );

    invoice.ownerInvoice.owner.company = (ownerCompany as unknown) as Promise<
      any
    >;

    return invoice;
  }

  async createWeeklyInvoices(): Promise<void> {
    const drivers = await this.userRepository.find({ role: UserRole.DRIVER });
    const driverInvoices = [];
    for (const driver of drivers) {
      const timeEntries = await this.timeEntryRepository.findWeeklyTimeEntriesForUser(
        driver.id,
      );
      if (timeEntries.length > 0)
        driverInvoices.push(this.createInvoice(driver as Driver, timeEntries));
    }
    const invoices = await Promise.all(driverInvoices);

    await this.driverWeeklyInvoiceRepo.saveAll(invoices);
    await this.sendWeeklyInvoicesEmails(invoices);
  }

  async sendWeeklyInvoicesEmails(
    invoices: DriverWeeklyInvoice[],
  ): Promise<void> {
    await Promise.all(
      invoices.map(async invoice => {
        const scheduledJobs: ScheduledJob[] = [];
        await Promise.all(
          invoice.jobs.map(async job => {
            const scheduledJobsForJob = await this.scheduledJobRepo.getScheduledJobsFromJob(
              job.id,
            );
            if (scheduledJobsForJob.length > 0) {
              return scheduledJobs.push(...scheduledJobsForJob);
            }
            return scheduledJobs;
          }),
        );
        const actualWorkList = await this.makeActualWeekList(
          invoice.driver,
          scheduledJobs,
        );
        return this.emailService.sendDriverWeeklySummaryEmail(
          invoice.driver.email,
          invoice.hours,
          invoice.amount,
          actualWorkList,
          invoice.driver.pricePerHour,
          invoice,
        );
      }),
    );
  }

  private async makeActualWeekList(
    user: User,
    scheduledJobs: ScheduledJob[],
  ): Promise<WeekActualWork[]> {
    const actualWork: WeekActualWork[] = [];
    await Promise.all(
      scheduledJobs.map(async schjob => {
        const assignation = schjob.assignations.find(
          assig => assig.driver.id === user.id,
        );
        const entries = await this.jobService.getTimeEntries(
          schjob.job.id,
          assignation.driver,
        );
        const entriesToRoundHours = _.cloneDeep(entries);
        const entriesToNotRoundedHours = _.cloneDeep(entries);
        const hours = getRoundedHours(entriesToRoundHours);
        const toatalHoursNotRounded = getNotRoundedHours(
          entriesToNotRoundedHours,
        );
        const amount = (user as Driver).pricePerHour * hours;
        const jobWork: WeekActualWork = {
          assignation,
          entries,
          hours: toatalHoursNotRounded.hours,
          minutes: toatalHoursNotRounded.minutes,
          seconds: toatalHoursNotRounded.seconds,
          totalHours: hours,
          amount,
          job: schjob.job,
          driver: user,
        };
        return actualWork.push(jobWork);
      }),
    );
    return actualWork;
  }

  private async createPayrollInvoice(
    driver: Driver,
    timeEntries: TimeEntry[],
  ): Promise<any> {
    const jobs = await Promise.all(timeEntries.map(timeEntry => timeEntry.job));
    const entriesCopy = _.cloneDeep(timeEntries);
    const entriesGroupByJob = Object.values(
      _.groupBy(entriesCopy, entry => entry.job.id),
    );
    const driverJobInvoices = {};
    const punchs = await this.truckPunchRepo.findThisWeekPunchs(driver.id);
    const endDate = subDays(new Date(), 1);
    const startDate = subWeeks(new Date(), 1);

    timeEntries.forEach(timeEntry => {
      if (!driverJobInvoices[timeEntry?.driverJobInvoice?.id]) {
        driverJobInvoices[timeEntry?.driverJobInvoice?.id] =
          timeEntry.driverJobInvoice;
      }
    });

    // console.log('HERE entriesCopy', entriesGroupByJob, driverJobInvoices);

    const data = {
      amount: 0,
      hours: 0,
    };

    if (driver.paymentMethod === DriverPaymentMethods.BY_PERCENT) {
      const driverPercent = driver.percent / 100;

      Object.values(driverJobInvoices).forEach(
        (driverInvoice: DriverJobInvoice) => {
          data.amount += driverInvoice.amount * driverPercent;
        },
      );

      entriesGroupByJob.forEach((entries: TimeEntry[]) => {
        const hours = getRoundedHours(entries);
        data.hours += hours;
      });
    } else if (
      driver.paymentMethod === DriverPaymentMethods.BY_HOUR &&
      driver.paymentSubMethod === DriverPaymentMethods.BY_HOUR_TICKET
    ) {
      entriesGroupByJob.forEach((entries: TimeEntry[]) => {
        const hours = getRoundedHours(entries);
        data.hours += hours;
      });

      data.amount = driver.pricePerHour * data.hours;
    } else if (
      driver.paymentMethod === DriverPaymentMethods.BY_HOUR &&
      driver.paymentSubMethod === DriverPaymentMethods.BY_HOUR_GATE_TO_GATE
    ) {
      const punchHours = getRoundedHoursFromPunchs(punchs);

      data.hours = punchHours;
      data.amount = driver.pricePerHour * punchHours;
    }

    return {
      jobs,
      driver,
      timeEntries,
      endDate,
      startDate,
      hours: data.hours,
      amount: data.amount,
      truckPunchs: punchs,
    };
  }

  private async createInvoice(
    driver: Driver,
    timeEntries: TimeEntry[],
  ): Promise<DriverWeeklyInvoice> {
    const jobs = await Promise.all(timeEntries.map(timeEntry => timeEntry.job));
    const entriesCopy = _.cloneDeep(timeEntries);
    const entriesGroupByJob = Object.values(
      _.groupBy(entriesCopy, entry => entry.job.id),
    );
    const driverJobInvoices = {};
    const punchs = await this.truckPunchRepo.findThisWeekPunchs(driver.id);
    const endDate = subDays(new Date(), 1);
    const startDate = subWeeks(new Date(), 1);

    timeEntries.forEach(timeEntry => {
      if (!driverJobInvoices[timeEntry?.driverJobInvoice?.id]) {
        driverJobInvoices[timeEntry?.driverJobInvoice?.id] =
          timeEntry.driverJobInvoice;
      }
    });

    // console.log('HERE entriesCopy', entriesGroupByJob, driverJobInvoices);

    const data = {
      amount: 0,
      hours: 0,
    };

    if (driver.paymentMethod === DriverPaymentMethods.BY_PERCENT) {
      const driverPercent = driver.percent / 100;

      Object.values(driverJobInvoices).forEach(
        (driverInvoice: DriverJobInvoice) => {
          data.amount += driverInvoice.amount * driverPercent;
        },
      );

      entriesGroupByJob.forEach((entries: TimeEntry[]) => {
        const hours = getRoundedHours(entries);
        data.hours += hours;
      });
    } else if (
      driver.paymentMethod === DriverPaymentMethods.BY_HOUR &&
      driver.paymentSubMethod === DriverPaymentMethods.BY_HOUR_TICKET
    ) {
      entriesGroupByJob.forEach((entries: TimeEntry[]) => {
        const hours = getRoundedHours(entries);
        data.hours += hours;
      });

      data.amount = driver.pricePerHour * data.hours;
    } else if (
      driver.paymentMethod === DriverPaymentMethods.BY_HOUR &&
      driver.paymentSubMethod === DriverPaymentMethods.BY_HOUR_GATE_TO_GATE
    ) {
      const punchHours = getRoundedHoursFromPunchs(punchs);

      data.hours = punchHours;
      data.amount = driver.pricePerHour * punchHours;
    }

    return {
      jobs,
      driver,
      timeEntries,
      endDate,
      startDate,
      hours: data.hours,
      amount: data.amount,
      truckPunchs: punchs,
    } as DriverWeeklyInvoice;
  }

  getWeeklyInvoicesForDriver(
    driver: Driver,
    { skip, count },
  ): Promise<DriverWeeklyInvoice[]> {
    return this.driverWeeklyInvoiceRepo.findDriverInvoices(driver, {
      skip,
      count,
    });
  }

  getWeeklyInvoicesForDriverFromOwner(
    driverId: string,
    { skip, count },
  ): Promise<DriverWeeklyInvoice[]> {
    return this.driverWeeklyInvoiceRepo.findDriverInvoicesFromOwner(driverId, {
      skip,
      count,
    });
  }

  getWeeklyInvoiceForDriverFromOwner(
    invoiceId: string,
  ): Promise<DriverWeeklyInvoice> {
    return this.driverWeeklyInvoiceRepo.findDriverInvoiceFromOwner(invoiceId);
  }

  getAllWeeklyInvoiceForDriverFromOwner(
    driverId: string,
  ): Promise<DriverWeeklyInvoice[]> {
    return this.driverWeeklyInvoiceRepo.findAllDriverInvoicesFromOwner(
      driverId,
    );
  }

  getAllActualWeeklyInvoiceForDriverFromOwner(
    driverId: string,
  ): Promise<DriverWeeklyInvoice[]> {
    return this.driverWeeklyInvoiceRepo.findAllCurrentDriverInvoicesFromOwner(
      driverId,
    );
  }

  async getContractorBillsFilters({
    user,
    customerId,
    projectId,
    material,
    startDate,
    endDate,
  }: {
    user: User;
    customerId?: string;
    projectId?: string;
    material?: string[];
    truckId?: string[];
    startDate?: string;
    endDate?: string;
  }): Promise<BillsTicketsFiltered> {
    const customers = await this.driverJobInvoiceRepo.findCustomers(
      user.id,
      startDate,
      endDate,
    );

    const finalCustomers = {};

    customers.forEach(ticket => {
      if (!finalCustomers[ticket.job.generalJob.customer.id])
        finalCustomers[ticket.job.generalJob.customer.id] =
          ticket.job.generalJob.customer;
    });

    let projects = [];
    const materials = [];
    let trucks = [];

    if (customerId) {
      projects = await this.generalJobRepo.findByCustomer(
        customerId,
        startDate,
        endDate,
      );
    }

    if (projectId) {
      const tickets = await this.driverJobInvoiceRepo.findProjectTickets(
        projectId,
        material,
        startDate,
        endDate,
      );

      const trucksObject = {};

      tickets.forEach(ticket => {
        if (!materials.includes(ticket.job.material)) {
          materials.push(ticket.job.material);
        }
        if (!trucksObject[ticket.truck.id]) {
          trucksObject[ticket.truck.id] = ticket.truck;
        }
      });

      trucks = Object.values(trucksObject);
    }

    return {
      customers: Object.values(finalCustomers),
      projects,
      materials,
      trucks,
    };
  }

  async getInvoicesForBills({
    customerId,
    projectId,
    material,
    truckId,
    startDate,
    endDate,
  }: {
    customerId?: string;
    projectId?: string;
    material?: string[];
    truckId?: string[];
    startDate?: string;
    endDate?: string;
  }): Promise<DriverJobInvoice[]> {
    const invoices = await this.driverJobInvoiceRepo.getBillsTicketsFiltered({
      customerId,
      projectId,
      material,
      truckId,
      startDate,
      endDate,
    });

    return invoices;
  }

  async getPayrollForOwner(owner: Owner, { skip, count }): Promise<any[]> {
    const invoices = await this.driverJobInvoiceRepo.findDriverJobInvoicesForOwnerPayroll(
      owner,
      {
        skip,
        count,
      },
    );
    return this.processPayrollInvoices(invoices, this.timeEntryRepository);
  }

  async getWeeklyInvoicesForOwner(
    owner: Owner,
    { skip, count },
  ): Promise<DriverWeeklyInvoicesDTO[]> {
    const invoices = await this.driverWeeklyInvoiceRepo.findOwnerInvoices(
      owner,
      {
        skip,
        count,
      },
    );
    return this.processWeeklyInvoices(invoices, this.timeEntryRepository);
  }

  async processPayrollInvoices(
    driverInvoices: any[],
    timeRepository: TimeEntryRepo,
  ): Promise<any[]> {
    const driversWithInvoices = driverInvoices.reduce((acc, invoice) => {
      const driverId = invoice.driver.id;
      acc[driverId] = acc[driverId] || { ...invoice.driver, invoices: [] };
      acc[driverId].invoices.push(invoice);
      return acc;
    }, {});

    return Promise.all(
      Object.values(driversWithInvoices).map(
        async (driver: any): Promise<any> => {
          let currentInvoice;
          const lastInvoice = driver.invoices[driver.invoices.length - 1];
          const jobAssignation = await this.jobAssignationRepo.findOne({
            scheduledJob: lastInvoice.ownerInvoice.scheduledJob,
            driver,
          });

          const timeEntries = await timeRepository.findWeeklyTimeEntriesFromDate(
            driver.id,
            jobAssignation.finishedAt.toISOString(),
          );

          if (timeEntries.length > 0) {
            currentInvoice = await this.createPayrollInvoice(
              driver,
              timeEntries,
            );
          }

          return {
            id: driver.id,
            name: driver.name,
            lastInvoice,
            currentInvoice,
          };
        },
      ),
    );
  }

  async processWeeklyInvoices(
    driverWeeklyInvoices: DriverWeeklyInvoice[],
    timeRepository: TimeEntryRepo,
  ): Promise<DriverWeeklyInvoicesDTO[]> {
    const driversWithInvoices = driverWeeklyInvoices.reduce((acc, invoice) => {
      const driverId = invoice.driver.id;
      acc[driverId] = acc[driverId] || { ...invoice.driver, invoices: [] };
      acc[driverId].invoices.push(invoice);
      return acc;
    }, {});

    return Promise.all(
      Object.values(driversWithInvoices).map(
        async (driver: any): Promise<DriverWeeklyInvoicesDTO> => {
          let currentInvoice;
          const lastInvoice = driver.invoices[driver.invoices.length - 1];

          const timeEntries = await timeRepository.findWeeklyTimeEntriesFromDate(
            driver.id,
            lastInvoice.endDate.toISOString(),
          );

          if (timeEntries.length > 0) {
            currentInvoice = await this.createInvoice(driver, timeEntries);
          }

          return {
            id: driver.id,
            name: driver.name,
            lastInvoice,
            currentInvoice,
          };
        },
      ),
    );
  }

  getWeeklyInvoicesForOwnerById(
    owner: Owner,
    weeklyInvoiceId: string,
  ): Promise<DriverWeeklyInvoice> {
    return this.driverWeeklyInvoiceRepo.findOwnerInvoiceById(
      owner,
      weeklyInvoiceId,
    );
  }

  getWeeklyInvoicesForAdmin({ skip, count }): Promise<DriverWeeklyInvoice[]> {
    return this.driverWeeklyInvoiceRepo.findAdminInvoices({ skip, count });
  }

  async markInvoicePaid(invoiceId: string): Promise<void> {
    await this.driverWeeklyInvoiceRepo.update(invoiceId, { isPaid: true });
  }

  async getOwnerMoneyPaidToDrivers(owner: Owner): Promise<number> {
    const total = await this.driverWeeklyInvoiceRepo.findAllOwnerDriversInvoices(
      owner,
      true,
    );
    return total;
  }

  async getOwnerMoneyUnpaidToDrivers(owner: Owner): Promise<number> {
    const total = await this.driverWeeklyInvoiceRepo.findAllOwnerDriversInvoices(
      owner,
      false,
    );
    return total;
  }

  async acceptDriverInvoiceForContractor(
    contractor: Contractor,
    invoiceId: string,
  ): Promise<DriverJobInvoice> {
    const jobInvoiceContractor = await this.driverJobInvoiceRepo.findDriverJobInvoiceForContractor(
      contractor,
      invoiceId,
    );
    jobInvoiceContractor.isAcceptedByContractor = true;

    const ownerInvoice = await this.ownerJobInvoiceRepo.findOwnerInvoiceById(
      jobInvoiceContractor.ownerInvoice.id,
    );

    if (ownerInvoice) {
      const driverInvoices = await this.driverJobInvoiceRepo.getDriverInvoicesFromOwnerInvoice(
        ownerInvoice.id,
      );

      const result = driverInvoices.find(
        invoice =>
          invoice.isAcceptedByContractor === false &&
          invoice.id !== jobInvoiceContractor.id,
      );

      if (!result) {
        ownerInvoice.isAcceptedByContractor = true;

        await this.ownerJobInvoiceRepo.save(ownerInvoice);
      }
    }

    return this.driverJobInvoiceRepo.save(jobInvoiceContractor);
  }

  async acceptDriverInvoiceForOwner(
    owner: Owner,
    invoiceId: string,
  ): Promise<DriverJobInvoice> {
    // Get driver invoice
    const jobInvoiceOwner = await this.driverJobInvoiceRepo.findDriverJobInvoiceForOwner(
      owner,
      invoiceId,
    );

    // Get owner invoice
    const ownerInvoice = await this.ownerJobInvoiceRepo.findOwnerInvoiceById(
      jobInvoiceOwner.ownerInvoice.id,
    );

    // Add new event to owner invoice
    let eventsHistory = [];
    if (ownerInvoice?.eventsHistory?.length) {
      eventsHistory = ownerInvoice.eventsHistory;
    }
    ownerInvoice.eventsHistory = [
      ...eventsHistory,
      {
        type: 'ACCEPTED',
        date: new Date(),
        by: 'Owner',
      },
    ];

    // Save owner invoice
    await this.ownerJobInvoiceRepo.save(ownerInvoice);

    // Mark driver invoice as accepted and save
    jobInvoiceOwner.isAcceptedByOwner = true;
    return this.driverJobInvoiceRepo.save(jobInvoiceOwner);
  }

  async createDriverInvoice(
    invoice: Omit<
      DriverJobInvoice,
      'timeEntries' | 'hours' | 'amount' | 'id' | 'createdAt' | 'updatedAt'
    >,
    timeEntry: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>,
    price: number,
  ): Promise<DriverJobInvoice> {
    const newTimeEntry = await this.timeEntryRepository.create(timeEntry);
    const timeEntries = [newTimeEntry];
    const hours = getRoundedHours(timeEntries);
    const amount = price * hours;
    const driverJobInvoice = await this.driverJobInvoiceRepo.create({
      ...invoice,
      timeEntries: [newTimeEntry],
      hours,
      amount,
    });
    await this.timeEntryRepository.update(newTimeEntry.id, {
      driverJobInvoice,
    });
    return driverJobInvoice;
  }

  async updateDriverInvoice(
    invoice: Partial<DriverJobInvoice>,
    timeEntry: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt'>,
    price: number,
  ): Promise<DriverJobInvoice> {
    const currentTimeEntries = await this.timeEntryRepository.findTimeEntriesForUserAndJob(
      invoice.driver,
      invoice.job.id,
    );
    await Promise.all(
      currentTimeEntries.map(async currentTimeEntry => {
        await this.timeEntryRepository.remove(currentTimeEntry.id);
      }),
    );
    const newTimeEntry = await this.timeEntryRepository.create({
      ...timeEntry,
    });
    const timeEntries = [newTimeEntry];
    const hours = getRoundedHours(timeEntries);
    const amount = price * hours;
    const driverJobInvoice = await this.driverJobInvoiceRepo.update(
      invoice.id,
      {
        sumLoad: invoice.sumLoad,
        sumTons: invoice.sumTons,
        hours,
        amount,
      },
    );
    await this.timeEntryRepository.update(newTimeEntry.id, {
      driverJobInvoice,
    });
    return driverJobInvoice;
  }

  async payDriverTicket(
    tickets: string[],
    accountNumber: string,
    orderNumber: string,
    paidWith: PaymentMethod,
  ): Promise<void> {
    try {
      await this.driverJobInvoiceRepo.payDriverTickets(
        tickets,
        paidWith,
        orderNumber,
        accountNumber,
      );
    } catch (err) {
      throw new Error(err);
    }
  }

  async editPaidTicket(
    tickets: string[],
    accountNumber: string,
    orderNumber: string,
  ): Promise<void> {
    try {
      await this.driverJobInvoiceRepo.editPaidTickets(
        tickets,
        orderNumber,
        accountNumber,
      );
    } catch (err) {
      throw new Error(err);
    }
  }

  async getDriverWeekWorkById(
    id: string,
    firstWeekday: string,
    lastWeekday: string,
  ): Promise<ScheduledJob[]> {
    return this.jobService.getDriverWeekWorkById(id, firstWeekday, lastWeekday);
  }

  async makeActualWeekListForDriver(
    driver: Driver,
    scheduledJobs: ScheduledJob[],
    date: string,
  ): Promise<WeeklyWork[]> {
    return this.jobService.makeActualWeekList(driver, scheduledJobs, date);
  }
}
