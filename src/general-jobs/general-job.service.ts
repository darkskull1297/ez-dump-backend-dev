import { Injectable } from '@nestjs/common';
import { JobRepo } from '../jobs/job.repository';
import { UserRepo } from '../user/user.repository';
import { GeneralJob } from './general-job.model';
import { GeneralJobRepo } from './general-job.repository';
import { User } from '../user/user.model';
import { ScheduledJob } from '../jobs/scheduled-job.model';
import { JobStatus } from '../jobs/job-status';
import { ScheduledJobRepo } from '../jobs/scheduled-job.repository';
import { Job } from '../jobs/job.model';
import { PaginationDTO } from '../common/pagination.dto';
import { JobsTotalContractorDTO } from '../jobs/dto/jobs-total-contractor.dto';
import { Foreman } from '../user/foreman.model';
import { Dispatcher } from '../user/dispatcher.model';
import { Admin } from '../user/admin.model';
import { JobInvoiceService } from '../invoices/job-invoice.service';
import { DocumentNotFoundException } from '../common/exceptions/document-not-found.exception';
import { JobsTotalAdminDTO } from '../jobs/dto/jobs-total-admin.dto';
import { RequestTruckRepo } from '../jobs/request-truck.repository';
import { MaterialRepo } from './material.repository';
import { CustomerRepo } from '../customer/customer.repository';

@Injectable()
export class GeneralJobService {
  constructor(
    private readonly jobRepo: JobRepo,
    private readonly generalJobRepo: GeneralJobRepo,
    private readonly scheduledJobRepo: ScheduledJobRepo,
    private readonly jobInvoiceService: JobInvoiceService,
    private readonly requestTruckRepo: RequestTruckRepo,
    private readonly materialRepo: MaterialRepo,
    private readonly customerRepo: CustomerRepo,
  ) {}

  async findGeneralJobs(
    user: User,
    { skip, count, customerId },
  ): Promise<GeneralJob[]> {
    const generalJobs = await this.generalJobRepo.findGeneralJobs(user, {
      skip,
      count,
      customerId,
    });
    const generalJobsInvoices = await Promise.all(
      generalJobs.map(async generalJob => {
        const invoices = await this.jobInvoiceService.getContractorInvoicesbyGeneralJobId(
          user,
          { skip, count, generalJobId: generalJob.id },
        );
        const { customer } = generalJob;
        return {
          ...generalJob,
          invoices,
          customer,
        };
      }),
    );

    return generalJobsInvoices;
  }

  async findGeneralJob(generalJobId: string, user: User): Promise<GeneralJob> {
    return this.generalJobRepo.findGeneralJob(generalJobId, user);
  }

  async findForemanGeneralJob(
    generalJobId: string,
    user: Foreman,
  ): Promise<GeneralJob> {
    return this.generalJobRepo.findForemanGeneralJob(generalJobId, user);
  }

  async findAdminGeneralJob(
    generalJobId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    user: Admin,
  ): Promise<GeneralJob> {
    return this.generalJobRepo.findAdminGeneralJob(generalJobId);
  }

  async createGeneralJob(
    generalJob: Omit<GeneralJob, 'id' | 'createdAt' | 'updatedAt' | 'user'>,
    user: User,
    foremans: Foreman[],
  ): Promise<GeneralJob> {
    const createdGeneralJob = await this.generalJobRepo.create({
      ...generalJob,
      user,
      foremans,
    });

    await Promise.all(
      generalJob.materials.map(async material => {
        return this.materialRepo.create({
          ...material,
          generalJob: createdGeneralJob,
        });
      }),
    );

    return createdGeneralJob;
  }

  async editGeneralJob(
    generalJob,
    JobId: string,
    foremans: Foreman[],
  ): Promise<GeneralJob> {
    const job = await this.generalJobRepo.findOne({ id: JobId });

    if (!job) {
      throw new DocumentNotFoundException('Job not found');
    }

    job.name = generalJob.name;
    job.address = generalJob.address;
    job.budget = generalJob.budget;
    job.startDate = generalJob.startDate;
    job.materials = generalJob.materials;
    job.terms = generalJob.terms;
    job.status = generalJob.status;
    job.customer = generalJob.customer;
    job.foremans = foremans;

    const updatedGeneralJob = await this.generalJobRepo.save(job);

    await Promise.all(
      generalJob.materials.map(async material => {
        return this.materialRepo.create({
          ...material,
          generalJob: updatedGeneralJob,
        });
      }),
    );

    return updatedGeneralJob;
  }

  getAdminScheduledJobs(
    user: Foreman | Dispatcher,
    { skip, count, active }: { skip: number; count: number; active: boolean },
    generalJobId?: string,
  ): Promise<Job[]> {
    const status = active ? JobStatus.STARTED : JobStatus.PENDING;
    return this.jobRepo.findAdminScheduledJobs(
      user,
      status,
      {
        skip,
        count,
      },
      generalJobId,
    );
  }

  async getForemanScheduledJobs(
    user: Foreman | Dispatcher,
    { skip, count, active }: { skip: number; count: number; active: boolean },
    generalJobId: string,
  ): Promise<Job[]> {
    const status = active ? JobStatus.STARTED : JobStatus.PENDING;
    const contractor = await user.contractorCompany.contractor;
    return this.jobRepo.findContractorScheduledJobs(
      contractor,
      status,
      {
        skip,
        count,
      },
      generalJobId,
    );
  }

  getContractorScheduledJobs(
    user: User,
    { skip, count, active }: { skip: number; count: number; active: boolean },
    generalJobId: string,
  ): Promise<Job[]> {
    const status = active ? JobStatus.STARTED : JobStatus.PENDING;
    return this.jobRepo.findContractorScheduledJobs(
      user,
      status,
      {
        skip,
        count,
      },
      generalJobId,
    );
  }

  async getAdminTotalJobs(
    user: Admin,
    generalJobId: string,
  ): Promise<JobsTotalAdminDTO> {
    const [
      totalAvailableJobs,
      totalScheduledJobs,
      totalPendingJobs,
      totalActiveJobs,
      totalJobsDone,
      totalOrderIcomplete,
      totalScheduledJobsCancelled,
      totalCanceledJobs,
    ] = await Promise.all([
      this.getAdminTotalAvailableJobs(user, generalJobId),
      this.getAdminTotalScheduledJobs(user, generalJobId),
      this.getAdminTotalPendingJobs(user, generalJobId),
      this.getAdminTotalActiveJobs(user, generalJobId),
      this.getAdminTotalJobsDone(user, generalJobId),
      this.getAdminTotalOrderIncomplete(user, generalJobId),
      this.getAdminTotalScheduledJobsCancelled(user, generalJobId),
      this.getTotalCanceledJobs(generalJobId),
    ]);
    return {
      adminAvailable: totalAvailableJobs,
      adminScheduled: totalScheduledJobs,
      pending: totalPendingJobs,
      adminActive: totalActiveJobs,
      done: totalJobsDone,
      incomplete: totalOrderIcomplete,
      canceledScheduledJobs: totalScheduledJobsCancelled,
      canceled: totalCanceledJobs,
    };
  }

  async getDispatcherTotalJobs(
    user: Dispatcher,
    generalJobId: string,
  ): Promise<JobsTotalContractorDTO> {
    const [
      totalScheduledJobs,
      totalPendingJobs,
      totalActiveJobs,
      totalJobsDone,
      totalOrderIcomplete,
      requestedTrucks,
    ] = await Promise.all([
      this.getForemanTotalScheduledJobs(user, generalJobId),
      this.getForemanTotalPendingJobs(user, generalJobId),
      this.getForemanTotalActiveJobs(user, generalJobId),
      this.getForemanTotalJobsDone(user, generalJobId),
      this.getForemanTotalOrderIncomplete(user, generalJobId),
      this.getDispatcherRequestTrucksTotals(user, generalJobId),
    ]);
    return {
      scheduled: totalScheduledJobs,
      pending: totalPendingJobs,
      active: totalActiveJobs,
      done: totalJobsDone,
      incomplete: totalOrderIcomplete,
      requestedTrucks,
    };
  }

  async getForemanTotalJobs(
    user: Foreman,
    generalJobId: string,
  ): Promise<JobsTotalContractorDTO> {
    const [
      totalScheduledJobs,
      totalPendingJobs,
      totalActiveJobs,
      totalJobsDone,
      totalOrderIcomplete,
      requestedTrucks,
    ] = await Promise.all([
      this.getForemanTotalScheduledJobs(user, generalJobId),
      this.getForemanTotalPendingJobs(user, generalJobId),
      this.getForemanTotalActiveJobs(user, generalJobId),
      this.getForemanTotalJobsDone(user, generalJobId),
      this.getForemanTotalOrderIncomplete(user, generalJobId),
      this.getForemanRequestTrucksTotals(user, generalJobId),
    ]);
    console.info('Scheduled: ', totalScheduledJobs);
    console.info('Pending: ', totalPendingJobs);
    console.info('Active: ', totalActiveJobs);
    console.info('Done: ', totalJobsDone);
    console.info('Incomplete: ', totalOrderIcomplete);
    return {
      scheduled: totalScheduledJobs,
      pending: totalPendingJobs,
      active: totalActiveJobs,
      done: totalJobsDone,
      incomplete: totalOrderIcomplete,
      requestedTrucks,
    };
  }

  async getContractorTotalJobs(
    user: User,
    generalJobId: string,
  ): Promise<JobsTotalContractorDTO> {
    const [
      totalScheduledJobs,
      totalPendingJobs,
      totalActiveJobs,
      totalJobsDone,
      totalOrderIcomplete,
      requestedTrucks,
    ] = await Promise.all([
      this.getContractorTotalScheduledJobs(user, generalJobId),
      this.getContractorTotalPendingJobs(user, generalJobId),
      this.getContractorTotalActiveJobs(user, generalJobId),
      this.getContractorTotalJobsDone(user, generalJobId),
      this.getContractorTotalOrderIncomplete(user, generalJobId),
      this.getRequestTrucksTotals(user, generalJobId),
    ]);

    console.info('Scheduled: ', totalScheduledJobs);
    console.info('Pending: ', totalPendingJobs);
    console.info('Active: ', totalActiveJobs);
    console.info('Done: ', totalJobsDone);
    console.info('Incomplete: ', totalOrderIcomplete);

    return {
      scheduled: totalScheduledJobs,
      pending: totalPendingJobs,
      active: totalActiveJobs,
      done: totalJobsDone,
      incomplete: totalOrderIcomplete,
      requestedTrucks,
    };
  }

  async getDispatcherRequestTrucksTotals(
    user: Dispatcher,
    generalJobId: string,
  ): Promise<number> {
    return this.requestTruckRepo.getDispatcherTotals(user, generalJobId);
  }

  async getForemanRequestTrucksTotals(
    user: Foreman,
    generalJobId: string,
  ): Promise<number> {
    return this.requestTruckRepo.getForemanTotals(user, generalJobId);
  }

  async getRequestTrucksTotals(
    user: User,
    generalJobId: string,
  ): Promise<number> {
    return this.requestTruckRepo.getTotals(user, generalJobId);
  }

  async getAdminTotalScheduledJobs(
    user: User,
    generalJobId: string,
  ): Promise<number> {
    return this.jobRepo.countAdminScheduledJobs(
      user,
      JobStatus.PENDING,
      generalJobId,
    );
  }

  async getAdminTotalScheduledJobsCancelled(
    user: User,
    generalJobId: string,
  ): Promise<number> {
    return this.scheduledJobRepo.countScheduledJobsCancelled(
      user,
      JobStatus.CANCELED,
      generalJobId,
    );
  }

  async getAdminTotalAvailableJobs(
    user: User,
    generalJobId: string,
  ): Promise<number> {
    return this.jobRepo.countAdminAvailableJobs({ generalJobId });
  }

  async getForemanTotalScheduledJobs(
    user: User,
    generalJobId: string,
  ): Promise<number> {
    return this.scheduledJobRepo.countForemanJobs(
      user,
      JobStatus.PENDING,
      generalJobId,
    );
  }

  async getContractorTotalScheduledJobs(
    user: User,
    generalJobId: string,
  ): Promise<number> {
    return this.jobRepo.countContractorScheduledJobs(
      user,
      JobStatus.PENDING,
      generalJobId,
    );
  }

  async getAdminTotalActiveJobs(
    user: User,
    generalJobId: string,
  ): Promise<number> {
    return this.jobRepo.countAdminScheduledJobs(
      user,
      JobStatus.STARTED,
      generalJobId,
    );
  }

  async getForemanTotalActiveJobs(
    user: User,
    generalJobId: string,
  ): Promise<number> {
    return this.scheduledJobRepo.countForemanJobs(
      user,
      JobStatus.STARTED,
      generalJobId,
    );
  }

  async getContractorTotalActiveJobs(
    user: User,
    generalJobId: string,
  ): Promise<number> {
    return this.jobRepo.countContractorScheduledJobs(
      user,
      JobStatus.STARTED,
      generalJobId,
    );
  }

  async getAdminTotalPendingJobs(
    user: User,
    generalJobId: string,
  ): Promise<number> {
    return this.jobRepo.countAdminJobs(user, generalJobId);
  }

  async getForemanTotalPendingJobs(
    user: User,
    generalJobId: string,
  ): Promise<number> {
    return this.jobRepo.countForemanJobs(user, generalJobId);
  }

  async getContractorTotalPendingJobs(
    user: User,
    generalJobId: string,
  ): Promise<number> {
    return this.jobRepo.countContractorJobs(
      user,
      generalJobId,
      JobStatus.PENDING,
    );
  }

  async getAdminTotalJobsDone(
    user: User,
    generalJobId: string,
  ): Promise<number> {
    return this.scheduledJobRepo.countAdminJobs(
      user,
      JobStatus.DONE,
      generalJobId,
    );
  }

  async getForemanTotalJobsDone(
    user: User,
    generalJobId: string,
  ): Promise<number> {
    return this.scheduledJobRepo.countForemanJobs(
      user,
      JobStatus.DONE,
      generalJobId,
    );
  }

  async getContractorTotalJobsDone(
    user: User,
    generalJobId: string,
  ): Promise<number> {
    return this.jobRepo.countContractorJobsDone(
      user,
      JobStatus.DONE,
      generalJobId,
    );
  }

  async getAdminTotalOrderIncomplete(
    user: User,
    generalJobId: string,
  ): Promise<number> {
    return this.jobRepo.countAdminIncompleteJobs(user, generalJobId);
  }

  async getTotalCanceledJobs(generalJobId: string): Promise<number> {
    return this.scheduledJobRepo.countCanceledJobs(generalJobId);
  }

  async getTotalScheduledCanceledJobs(scheduledJobId: string): Promise<number> {
    return this.scheduledJobRepo.countScheduledCanceledJobs(scheduledJobId);
  }

  async getForemanTotalOrderIncomplete(
    user: User,
    generalJobId: string,
  ): Promise<number> {
    return this.jobRepo.countForemanIncompleteJobs(user, generalJobId);
  }

  async getContractorTotalOrderIncomplete(
    user: User,
    generalJobId: string,
  ): Promise<number> {
    return this.jobRepo.countContractorIncompleteJobs(user, generalJobId);
  }

  getForemanUnassignedJobs(
    user: Foreman | Dispatcher,
    { skip, count }: { skip: number; count: number },
    generalJobId: string,
  ): Promise<Job[]> {
    return this.jobRepo.findForemanPedningJobs(
      user,
      { skip, count },
      generalJobId,
    );
  }

  getAdminUnassignedJobs(
    user: User,
    { skip, count }: { skip: number; count: number },
    generalJobId: string,
  ): Promise<Job[]> {
    return this.jobRepo.findAdminPedningShifts(
      user,
      { skip, count },
      generalJobId,
    );
  }

  getContractorUnassignedJobs(
    user: User,
    { skip, count }: { skip: number; count: number },
    generalJobId: string,
  ): Promise<Job[]> {
    return this.jobRepo.findContractorPedningJobs(
      user,
      { skip, count },
      generalJobId,
    );
  }

  getAdminJobsDone(
    user: Foreman | Dispatcher,
    { skip, count }: { skip: number; count: number },
    generalJobId: string,
  ): Promise<Job[]> {
    return this.jobRepo.findAdminShifts(
      user,
      JobStatus.DONE,
      {
        skip,
        count,
      },
      generalJobId,
    );
  }

  getForemanJobsDone(
    user: Foreman | Dispatcher,
    { skip, count }: { skip: number; count: number },
    generalJobId: string,
  ): Promise<Job[]> {
    return this.jobRepo.findForemanScheduledJobs(
      user,
      JobStatus.DONE,
      {
        skip,
        count,
      },
      generalJobId,
    );
  }

  getContractorJobsDone(
    user: User,
    { skip, count }: { skip: number; count: number },
    generalJobId: string,
  ): Promise<Job[]> {
    return this.jobRepo.findContractorScheduledJobs(
      user,
      JobStatus.DONE,
      {
        skip,
        count,
      },
      generalJobId,
    );
  }

  getAdminIncompleteJobs(
    user: User,
    { skip, count }: { skip: number; count: number },
    generalJobId: string,
  ): Promise<Job[]> {
    return this.jobRepo.findAdminIncompleteShifts(
      user,
      { skip, count },
      generalJobId,
    );
  }

  getForemanIncompleteJobs(
    user: User,
    { skip, count }: { skip: number; count: number },
    generalJobId: string,
  ): Promise<Job[]> {
    return this.jobRepo.findForemanIncompleteJobs(
      user,
      { skip, count },
      generalJobId,
    );
  }

  getContractorIncompleteJobs(
    user: User,
    { skip, count }: { skip: number; count: number },
    generalJobId: string,
  ): Promise<Job[]> {
    return this.jobRepo.findContractorIncompleteJobs(
      user,
      { skip, count },
      generalJobId,
    );
  }

  async getForemanGeneralJobs(
    user: Foreman,
    { skip, count }: { skip: number; count: number },
  ): Promise<GeneralJob[]> {
    const foremanGeneralJobs = await user.generalJobs;

    if (foremanGeneralJobs && foremanGeneralJobs.length > 0) {
      let generalJobs = await this.generalJobRepo.findForemanGeneralJobs(user, {
        skip,
        count,
      });

      const accessToGeneralJobs = await Promise.all(
        foremanGeneralJobs.map(generalJob => generalJob.id),
      );
      generalJobs = await Promise.all(
        generalJobs.filter(generalJob =>
          accessToGeneralJobs.includes(generalJob.id),
        ),
      );

      const generalJobsInvoices = await Promise.all(
        generalJobs.map(async generalJob => {
          const invoices = await this.jobInvoiceService.getContractorInvoicesByGeneralJobId(
            { skip, count, generalJobId: generalJob.id },
          );

          return {
            ...generalJob,
            invoices,
          };
        }),
      );

      return generalJobsInvoices;
    }

    return [];
  }

  async getAdminGeneralJobs(
    user: Foreman | Dispatcher,
    { skip, count }: { skip: number; count: number },
  ): Promise<GeneralJob[]> {
    const generalJobs = await this.generalJobRepo.findAdminGeneralJobs(user, {
      skip,
      count,
    });

    const generalJobsInvoices = await Promise.all(
      generalJobs.map(async generalJob => {
        const invoices = await this.jobInvoiceService.getContractorInvoicesByGeneralJobId(
          { skip, count, generalJobId: generalJob.id },
        );

        return {
          ...generalJob,
          invoices,
        };
      }),
    );

    return generalJobsInvoices;
  }
}
