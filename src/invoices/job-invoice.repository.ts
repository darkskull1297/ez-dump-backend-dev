import { Injectable } from '@nestjs/common';
import { FindConditions, Repository, SelectQueryBuilder } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { endOfDay, startOfDay } from 'date-fns';
import { BaseRepository } from '../common/base.repository';
import { JobInvoice } from './job-invoice.model';
import { Contractor } from '../user/contractor.model';
import { OwnerJobInvoice } from './owner-job-invoice.model';
import { Owner } from '../user/owner.model';
import { PaymentMethod } from './payment-method';

@Injectable()
export class JobInvoiceRepo extends BaseRepository<JobInvoice>(JobInvoice) {
  constructor(
    @InjectRepository(JobInvoice)
    private readonly jobInvoiceRepo: Repository<JobInvoice>,
    @InjectRepository(OwnerJobInvoice)
    private readonly ownerJobInvoiceRepo: Repository<OwnerJobInvoice>,
  ) {
    super(jobInvoiceRepo);
  }

  getRepository(): Repository<JobInvoice> {
    return this.jobInvoiceRepo;
  }

  findAdminOwnerInvoiceById(invoiceId: string): Promise<OwnerJobInvoice> {
    return this.findOwnerInvoicesQuery()
      .leftJoinAndSelect(
        'driverInvoice.previousDisputeInvoice',
        'prevDisputeInvoice',
      )
      .andWhere('ownerInvoice.id = :invoiceId', { invoiceId })
      .getOne();
  }

  findInvoiceByJobId(jobId: string): Promise<JobInvoice> {
    return this.findContractorInvoicesQuery()
      .leftJoinAndSelect('contractor.company', 'companyContractor')
      .leftJoinAndSelect('ownerInvoice.scheduledJob', 'scheduledJob')
      .leftJoinAndSelect('scheduledJob.assignations', 'assignations')
      .andWhere('job.id = :jobId', { jobId })
      .getOne();
  }

  findInvoiceById(invoiceId: string): Promise<JobInvoice> {
    return this.findContractorInvoicesQuery()
      .leftJoinAndSelect('contractor.company', 'companyContractor')
      .where('invoice.id = :invoiceId', { invoiceId })
      .getOne();
  }

  findAdminContractorInvoiceById(invoiceId: string): Promise<JobInvoice> {
    return this.findContractorInvoicesQuery()
      .leftJoinAndSelect('category.assignation', 'assignation')
      .leftJoinAndSelect(
        'driverInvoice.previousDisputeInvoice',
        'prevDisputeInvoice',
      )
      .leftJoinAndSelect('contractor.company', 'companyContractor')
      .andWhere('invoice.id = :invoiceId', { invoiceId })
      .getOne();
  }

  findContractorInvoices(
    contractor: Contractor,
    { skip, count, isPaid },
  ): Promise<JobInvoice[]> {
    let query = this.findContractorInvoicesQuery()
      .leftJoinAndSelect(
        'driverInvoice.previousDisputeInvoice',
        'previousDisputeInvoice',
      )
      .where('contractor.id = :id', { id: contractor.id });
    if (isPaid) {
      query = query.andWhere('invoice.isPaid = :isPaid', { isPaid });
    }
    return query
      .skip(skip)
      .take(count)
      .orderBy('invoice.isPaid', 'DESC')
      .orderBy('invoice.dueDate', 'ASC')
      .getMany();
  }

  async findContractorInvoicesByGeneralJobId(
    contractor: Contractor,
    { skip, count, generalJobId },
  ): Promise<JobInvoice[]> {
    const query = this.findContractorInvoicesQuery().where(
      'contractor.id = :id',
      { id: contractor.id },
    );
    return query
      .where('generalJob.id = :id', { id: generalJobId })
      .skip(skip)
      .take(count)
      .orderBy('invoice.isPaid', 'DESC')
      .orderBy('invoice.dueDate', 'ASC')
      .getMany();
  }

  findContractorInvoicesAdminByGeneralJobId({
    skip,
    count,
    generalJobId,
  }): Promise<JobInvoice[]> {
    const query = this.findContractorInvoicesQuery();

    return query
      .where('generalJob.id = :id', { id: generalJobId })
      .skip(skip)
      .take(count)
      .orderBy('invoice.isPaid', 'DESC')
      .addOrderBy('invoice.dueDate', 'ASC')
      .getMany();
  }

  findContractorInvoicesAdmin({ skip, count, isPaid }): Promise<JobInvoice[]> {
    let query = this.findContractorInvoicesQuery();
    if (isPaid) {
      query = query.andWhere('invoice.isPaid = :isPaid', { isPaid });
    }
    return query
      .leftJoinAndSelect('contractor.company', 'companyContractor')
      .leftJoinAndSelect(
        'driverInvoice.previousDisputeInvoice',
        'prevDisputeInvoice',
      )
      .skip(skip)
      .take(count)
      .orderBy('invoice.isPaid', 'DESC')
      .addOrderBy('invoice.dueDate', 'ASC')
      .getMany();
  }

  async findInvoiceForContractor(
    contractor: Contractor,
    invoiceId: string,
  ): Promise<JobInvoice> {
    const data = await this.findContractorInvoicesQuery()
      .leftJoinAndSelect('category.assignation', 'assignation')
      .leftJoinAndSelect('contractor.company', 'companyContractor')
      .leftJoinAndSelect('disputeInvoice.requestBy', 'requestBy')
      .leftJoinAndSelect(
        'driverInvoice.previousDisputeInvoice',
        'previousDisputeInvoice',
      )
      .where('contractor.id = :id', { id: contractor.id })
      .andWhere('invoice.id = :invoiceId', { invoiceId })
      .getOne();

    return data;
  }

  async findOwnerCompanyForContractor(invoiceId: string): Promise<any> {
    const data = await this.jobInvoiceRepo.query(
      `
        SELECT owner."companyCommonName" from owner_job_invoice invoice 
        LEFT JOIN job_invoice jobinvoice ON invoice."jobInvoiceId" = jobinvoice.id
        INNER JOIN owner_company owner
        ON invoice."ownerId" = owner."ownerId"
        WHERE jobinvoice.id = $1
    `,
      [invoiceId],
    );
    return data[0];
  }

  async findContractorCompanyForOwner(invoiceId: string): Promise<any> {
    const data = await this.jobInvoiceRepo.query(
      `
      SELECT "companyCommonName" FROM contractor_company company
      LEFT JOIN job_invoice invoice ON company."contractorId" = invoice."contractorId"
      LEFT JOIN owner_job_invoice ON owner_job_invoice."jobInvoiceId" = invoice.id
      WHERE owner_job_invoice.id = $1
    `,
      [invoiceId],
    );

    return data[0];
  }

  findInvoiceForOwner(
    owner: Owner,
    invoiceId: string,
  ): Promise<OwnerJobInvoice> {
    console.log('ownerINVOICE', owner);
    console.log('invoiceIdINVOICE', invoiceId);

    return this.findOwnerInvoicesQuery()
      .leftJoinAndSelect('category.assignation', 'assignation')
      .leftJoinAndSelect('disputeInvoice.requestBy', 'requestBy')
      .leftJoinAndSelect(
        'driverInvoice.previousDisputeInvoice',
        'prevDisputeInvoice',
      )
      .where('owner.id = :id', { id: owner.id })
      .andWhere('ownerInvoice.id = :invoiceId', { invoiceId })
      .getOne();
  }

  findOwnerInvoices(
    owner: Owner,
    { skip, count, isPaid },
  ): Promise<OwnerJobInvoice[]> {
    let query = this.findOwnerInvoicesQuery()
      .leftJoinAndSelect(
        'driverInvoice.previousDisputeInvoice',
        'previousDisputeInvoice',
      )
      .where('owner.id = :id', {
        id: owner.id,
      });
    if (isPaid) {
      query = query.andWhere('ownerInvoice.isPaid = :isPaid', { isPaid });
    }
    return query
      .skip(skip)
      .take(count)
      .orderBy('ownerInvoice.isPaid', 'DESC')
      .orderBy('ownerInvoice.dueDate', 'ASC')
      .getMany();
  }

  async setContractorInvoiceDiscount(
    invoiceId,
    discountValue,
  ): Promise<boolean> {
    const invoice = await this.jobInvoiceRepo.findOne({ id: invoiceId });
    invoice.hasDiscount = invoice.hasDiscount === null ? discountValue : null;
    await this.jobInvoiceRepo.save(invoice);
    return true;
  }

  findOwnerInvoicesAdmin({ skip, count, isPaid }): Promise<OwnerJobInvoice[]> {
    let query = this.findOwnerInvoicesQuery().leftJoinAndSelect(
      'driverInvoice.previousDisputeInvoice',
      'prevDisputeInvoice',
    );
    if (isPaid) {
      query = query.andWhere('ownerInvoice.isPaid = :isPaid', { isPaid });
    }
    return query
      .skip(skip)
      .take(count)
      .orderBy('ownerInvoice.isPaid', 'DESC')
      .orderBy('ownerInvoice.createdAt', 'ASC')
      .getMany();
  }

  findOwnerInvoiceAdminById(invoiceId: string): Promise<OwnerJobInvoice> {
    return this.findOwnerInvoicesQuery()
      .where('invoice.id = :invoiceId', { invoiceId })
      .getOne();
  }

  private findContractorInvoicesQuery(): SelectQueryBuilder<JobInvoice> {
    return this.jobInvoiceRepo
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.contractor', 'contractor')
      .leftJoinAndSelect('invoice.job', 'job')
      .leftJoinAndSelect('job.generalJob', 'generalJob')
      .leftJoinAndSelect('invoice.ownerInvoices', 'ownerInvoice')
      .leftJoinAndSelect('ownerInvoice.owner', 'owner')
      .leftJoinAndSelect('ownerInvoice.driverInvoices', 'driverInvoice')
      .leftJoinAndSelect('ownerInvoice.disputeInvoice', 'disputeInvoice')
      .leftJoinAndSelect('driverInvoice.driver', 'driver')
      .leftJoinAndSelect('driverInvoice.truck', 'truck')
      .leftJoinAndSelect('driverInvoice.timeEntries', 'timeEntry')
      .leftJoinAndSelect('driverInvoice.disputeInvoice', 'driverDisputeInvoice')
      .leftJoinAndSelect('driverInvoice.category', 'category');
  }

  private findOwnerInvoicesQuery(): SelectQueryBuilder<OwnerJobInvoice> {
    return this.ownerJobInvoiceRepo
      .createQueryBuilder('ownerInvoice')
      .leftJoinAndSelect('ownerInvoice.job', 'job')
      .leftJoinAndSelect('job.user', 'user')
      .leftJoinAndSelect('ownerInvoice.owner', 'owner')
      .leftJoinAndSelect('ownerInvoice.driverInvoices', 'driverInvoice')
      .leftJoinAndSelect('ownerInvoice.disputeInvoice', 'disputeInvoice')
      .leftJoinAndSelect('driverInvoice.driver', 'driver')
      .leftJoinAndSelect('driverInvoice.truck', 'truck')
      .leftJoinAndSelect('driverInvoice.disputeInvoice', 'driverDisputeInvoice')
      .leftJoinAndSelect('driverInvoice.category', 'category')
      .leftJoinAndSelect('driverInvoice.timeEntries', 'timeEntry');
  }

  findUnpaidInvoices(): Promise<JobInvoice[]> {
    return this.jobInvoiceRepo
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.contractor', 'contractor')
      .leftJoinAndSelect('invoice.job', 'job')
      .leftJoinAndSelect('invoice.ownerInvoices', 'ownerInvoices')
      .leftJoinAndSelect('ownerInvoices.owner', 'owner')
      .where('invoice.isPaid = false')
      .andWhere('invoice.dueDate < :end', {
        end: new Date().toISOString(),
      })
      .getMany();
  }

  findAllUnpaidInvoices(): Promise<JobInvoice[]> {
    return this.jobInvoiceRepo
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.contractor', 'contractor')
      .leftJoinAndSelect('invoice.job', 'job')
      .where('invoice.isPaid = false')
      .getMany();
  }

  findOwnerInvoiceById(invoiceId: string): Promise<OwnerJobInvoice> {
    return this.findOwnerInvoicesQuery()
      .leftJoinAndSelect('category.assignation', 'assignation')
      .leftJoinAndSelect('ownerInvoice.scheduledJob', 'scheduledJob')
      .leftJoinAndSelect(
        'driverInvoice.previousDisputeInvoice',
        'previousDisputeInvoice',
      )
      .where('ownerInvoice.id = :invoiceId', { invoiceId })
      .getOne();
  }

  findOwnerInvoiceByJobId(jobId: string): Promise<OwnerJobInvoice> {
    return this.findOwnerInvoicesQuery()
      .where('job.id = :jobId', { jobId })
      .getOne();
  }

  findOwnerInvoice(
    cond: FindConditions<OwnerJobInvoice>,
  ): Promise<OwnerJobInvoice> {
    return this.ownerJobInvoiceRepo.findOne(cond);
  }

  async updateOwnerInvoice(
    id: string,
    diff: Partial<OwnerJobInvoice>,
  ): Promise<void> {
    await this.ownerJobInvoiceRepo.update(id, diff);
  }

  // TODO change query remove between
  findOwnerInvoicesToPay(): Promise<OwnerJobInvoice[]> {
    return this.ownerJobInvoiceRepo
      .createQueryBuilder('ownerInvoice')
      .leftJoinAndSelect('ownerInvoice.owner', 'owner')
      .leftJoinAndSelect('ownerInvoice.scheduledJob', 'scheduledJob')
      .leftJoinAndSelect('ownerInvoice.jobInvoice', 'jobInvoice')
      .where('ownerInvoice.isPaid = false')
      .andWhere('ownerInvoice.transferId IS NULL')
      .andWhere('jobInvoice.paidWith = :paymentMethod', {
        paymentMethod: PaymentMethod.STRIPE,
      })
      .andWhere('ownerInvoice.dueDate BETWEEN :start AND :end', {
        start: startOfDay(new Date()).toISOString(),
        end: endOfDay(new Date()).toISOString(),
      })
      .getMany();
  }

  saveOwnerInvoice(invoice: OwnerJobInvoice): Promise<OwnerJobInvoice> {
    return this.ownerJobInvoiceRepo.save(invoice);
  }

  findInvoiceByOrderNumber(orderNumber: number): Promise<JobInvoice> {
    return this.jobInvoiceRepo
      .createQueryBuilder('jobInvoice')
      .leftJoinAndSelect('jobInvoice.job', 'job')
      .leftJoinAndSelect('jobInvoice.contractor', 'contractor')
      .where('jobInvoice.orderNumber = :orderNumber', { orderNumber })
      .orderBy('jobInvoice.currDispute', 'DESC')
      .getOne();
  }

  async findAllOwnerInvoices(owner: Owner, isPaid: boolean): Promise<number> {
    const query = this.ownerJobInvoiceRepo
      .createQueryBuilder('ownerInvoice')
      .select('SUM(ownerInvoice.amount)', 'sum')
      .leftJoin('ownerInvoice.job', 'job')
      .leftJoin('ownerInvoice.owner', 'owner')
      .leftJoin('ownerInvoice.driverInvoices', 'driverInvoice')
      .leftJoin('driverInvoice.driver', 'driver')
      .leftJoin('driverInvoice.truck', 'truck')
      .leftJoin('driverInvoice.timeEntries', 'timeEntry')
      .where('owner.id = :id', {
        id: owner.id,
      })
      .andWhere('ownerInvoice.isPaid = :isPaid', { isPaid });

    const { sum } = await query.getRawOne();
    if (sum) return sum;
    return 0;
  }

  async getTotalAmountContractorInvoices(
    contractor: Contractor,
    isPaid: boolean,
  ): Promise<number> {
    const query = this.jobInvoiceRepo
      .createQueryBuilder('invoice')
      .select('SUM(invoice.amount)', 'sum')
      .leftJoin('invoice.contractor', 'contractor')
      .leftJoin('invoice.job', 'job')
      .where('contractor.id = :id', { id: contractor.id })
      .andWhere('invoice.isPaid = :isPaid', { isPaid });

    const { sum } = await query.getRawOne();
    if (sum) return sum;
    return 0;
  }

  async getFinishedByJob(driverId: string, jobId: string): Promise<any> {
    return this.jobInvoiceRepo.query(
      `
      SELECT finisher.id, "finishByUser", jobass."finishedById", finisher.name, finisher.role
      FROM job_assignation jobass INNER JOIN public.user finisher
      ON finisher.id = jobass."finishedById"
	    INNER JOIN scheduled_job schjob ON jobass."scheduledJobId" = schjob.id
	    INNER JOIN Job ON  schjob."jobId" = job.id 
	    AND job.id = $2
      WHERE jobass."driverId" = $1
    `,
      [driverId, jobId],
    );
  }

  async getCompanyNameAndPhoneNumberForOwner(ownerId: string): Promise<any> {
    const data = await this.jobInvoiceRepo.query(
      `
        SELECT "companyCommonName", "companyCommonOfficephonenumber"
        from
          owner_company
        WHERE
          "ownerId" = $1
      `,
      [ownerId],
    );
    return data[0];
  }

  async getCompanyNameForOwner(ownerId: string): Promise<any> {
    const data = await this.jobInvoiceRepo.query(
      `SELECT "companyCommonName" from owner_company WHERE "ownerId" = $1`,
      [ownerId],
    );
    return data[0];
  }
}
