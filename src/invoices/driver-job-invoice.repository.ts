import { Injectable } from '@nestjs/common';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from '../common/base.repository';
import { DriverJobInvoice } from './driver-job-invoice.model';
import { Contractor } from '../user/contractor.model';
import { Owner } from '../user/owner.model';
import { PaymentMethod } from './payment-method';

@Injectable()
export class DriverJobInvoiceRepo extends BaseRepository<DriverJobInvoice>(
  DriverJobInvoice,
) {
  constructor(
    @InjectRepository(DriverJobInvoice)
    private readonly driverJobInvoiceRepo: Repository<DriverJobInvoice>,
  ) {
    super(driverJobInvoiceRepo);
  }

  findCustomers(
    contractorId: string,
    startDate: string,
    endDate: string,
  ): Promise<DriverJobInvoice[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const query = this.driverJobInvoiceRepo
      .createQueryBuilder('driverInvoice')
      .leftJoinAndSelect('driverInvoice.job', 'job')
      .leftJoinAndSelect('job.generalJob', 'generalJob')
      .leftJoinAndSelect('generalJob.customer', 'customer')
      .leftJoinAndSelect('driverInvoice.driver', 'driver')
      .leftJoinAndSelect('driverInvoice.timeEntries', 'timeEntries')
      .leftJoinAndSelect('driverInvoice.truck', 'truck')
      .leftJoinAndSelect('driverInvoice.category', 'category')
      .leftJoinAndSelect('driverInvoice.ownerInvoice', 'ownerInvoice')
      .leftJoinAndSelect('driverInvoice.disputeInvoice', 'disputeInvoice')
      .leftJoinAndSelect('job.user', 'user')
      .leftJoinAndSelect('ownerInvoice.owner', 'owner')
      .where('driverInvoice.createdAt BETWEEN :start AND :end', {
        start,
        end,
      })
      .andWhere('user.id = :contractorId', { contractorId });

    return query.getMany();
  }

  getBillsTicketsFiltered({
    customerId,
    projectId,
    material,
    truckId,
    startDate,
    endDate,
  }: {
    customerId: string;
    projectId: string;
    material: string[];
    truckId: string[];
    startDate: string;
    endDate: string;
  }): Promise<DriverJobInvoice[]> {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const query = this.driverJobInvoiceRepo
      .createQueryBuilder('driverInvoice')
      .leftJoinAndSelect('driverInvoice.job', 'job')
      .leftJoinAndSelect('job.generalJob', 'generalJob')
      .leftJoinAndSelect('driverInvoice.driver', 'driver')
      .leftJoinAndSelect('driverInvoice.timeEntries', 'timeEntries')
      .leftJoinAndSelect('driverInvoice.truck', 'truck')
      .leftJoinAndSelect('driverInvoice.category', 'category')
      .leftJoinAndSelect('driverInvoice.ownerInvoice', 'ownerInvoice')
      .leftJoinAndSelect('driverInvoice.disputeInvoice', 'disputeInvoice')
      .leftJoinAndSelect('job.user', 'user')
      .leftJoinAndSelect('ownerInvoice.owner', 'owner')
      .where('driverInvoice.createdAt BETWEEN :start AND :end', {
        start,
        end,
      });

    if (customerId) {
      query.andWhere('generalJob.customerId = :customerId', { customerId });
    }

    if (projectId) {
      query.andWhere('generalJob.id = :projectId', { projectId });
    }

    if (material && material.length > 0) {
      query.andWhere('job.material IN (:...material)', { material });
    }

    const trucks = truckId.map(val => val.toString());

    if (truckId && truckId.length > 0) {
      query.andWhere('truck.id IN (:...trucks)', { trucks });
    }

    return query.getMany();
  }

  findProjectTickets(
    projectId: string,
    materials: string[],
    startDate: string,
    endDate: string,
  ): Promise<DriverJobInvoice[]> {
    const query = this.driverJobInvoiceRepo
      .createQueryBuilder('driverInvoice')
      .leftJoinAndSelect('driverInvoice.job', 'job')
      .leftJoinAndSelect('job.generalJob', 'generalJob')
      .leftJoinAndSelect('driverInvoice.truck', 'truck')
      .where('generalJob.id = :projectId', { projectId })
      .andWhere('driverInvoice.createdAt BETWEEN :start AND :end', {
        start: new Date(startDate),
        end: new Date(endDate),
      });

    if (materials && materials.length > 0) {
      query.andWhere('job.material IN (:...materials)', { materials });
    }

    return query.getMany();
  }

  findMaterialTickets(material: string[]): Promise<DriverJobInvoice[]> {
    return this.driverJobInvoiceRepo
      .createQueryBuilder('driverInvoice')
      .leftJoinAndSelect('driverInvoice.job', 'job')
      .leftJoinAndSelect('driverInvoice.truck', 'truck')
      .where('job.material IN (:...material)', { material })
      .getMany();
  }

  getDriverInvoiceById(id: string): Promise<DriverJobInvoice> {
    return this.findDriverJobInvoiceQuery()
      .leftJoinAndSelect('ownerInvoice.scheduledJob', 'scheduledJob')
      .leftJoinAndSelect('timeEntries.driverAssignation', 'driverAssignation')
      .where('driverInvoice.id = :id', { id })
      .getOne();
  }

  findDriverJobInvoiceQuery(): SelectQueryBuilder<DriverJobInvoice> {
    return this.driverJobInvoiceRepo
      .createQueryBuilder('driverInvoice')
      .leftJoinAndSelect('driverInvoice.job', 'job')
      .leftJoinAndSelect('driverInvoice.driver', 'driver')
      .leftJoinAndSelect('driverInvoice.timeEntries', 'timeEntries')
      .leftJoinAndSelect('driverInvoice.truck', 'truck')
      .leftJoinAndSelect('driverInvoice.category', 'category')
      .leftJoinAndSelect('driverInvoice.ownerInvoice', 'ownerInvoice')
      .leftJoinAndSelect('driverInvoice.disputeInvoice', 'disputeInvoice')
      .leftJoinAndSelect('job.user', 'user')
      .leftJoinAndSelect('user.company', 'contractorCompany')
      .leftJoinAndSelect('ownerInvoice.owner', 'owner')
      .leftJoinAndSelect(
        'driverInvoice.previousDisputeInvoice',
        'previousDisputeInvoice',
      )
      .leftJoinAndSelect('ownerInvoice.jobInvoice', 'jobInvoice');
  }

  findDriverJobInvoicePayrollQuery(): SelectQueryBuilder<any> {
    return this.driverJobInvoiceRepo
      .createQueryBuilder('driverInvoice')
      .leftJoinAndSelect('driverInvoice.job', 'job')
      .leftJoinAndSelect('driverInvoice.driver', 'driver')
      .leftJoinAndSelect('driverInvoice.timeEntries', 'timeEntries')
      .leftJoinAndSelect('driverInvoice.truck', 'truck')
      .leftJoinAndSelect('driverInvoice.ownerInvoice', 'ownerInvoice')
      .leftJoinAndSelect('ownerInvoice.scheduledJob', 'scheduledJob')
      .leftJoinAndSelect('ownerInvoice.owner', 'owner');
  }

  getDriverInvoicesFromOwnerInvoice(
    ownerInvoiceId: string,
  ): Promise<DriverJobInvoice[]> {
    return this.findDriverJobInvoiceQuery()
      .where('ownerInvoice.id = :ownerInvoiceId', { ownerInvoiceId })
      .getMany();
  }

  findDriverJobInvoice(jobId: string): Promise<DriverJobInvoice> {
    return this.findDriverJobInvoiceQuery()
      .where('job.id = :id', { id: jobId })
      .getOne();
  }

  findDriverJobInvoiceForDriver(
    jobId: string,
    driverId: string,
  ): Promise<DriverJobInvoice> {
    return this.findDriverJobInvoiceQuery()
      .where('job.id = :jobId', { jobId })
      .andWhere('driver.id = :driverId', { driverId })
      .getOne();
  }

  findDriverJobInvoiceForOwner(
    owner: Owner,
    driverJobInvoiceId: string,
  ): Promise<DriverJobInvoice> {
    return this.findDriverJobInvoiceQuery()
      .where('driverInvoice.id = :driverJobInvoiceId', { driverJobInvoiceId })
      .andWhere('owner.id = :id', { id: owner.id })
      .getOne();
  }

  findDriverJobInvoicesForOwnerPayroll(
    owner: Owner,
    { skip, count },
  ): Promise<any> {
    return this.findDriverJobInvoicePayrollQuery()
      .where('owner.id = :id', { id: owner.id })
      .andWhere('driver.isDisable = false')
      .skip(skip)
      .take(count)
      .orderBy('driverInvoice.createdAt', 'ASC')
      .getMany();
  }

  async getTravelTimeDriverInvoice(
    owner: Owner,
    jobId: string,
    truckId: string,
  ): Promise<{ travelTimeInMinutes: string }> {
    const invoice = await this.findDriverJobInvoiceQuery()
      .where('job.id = :jobId', { jobId })
      .andWhere('owner.id = :id', { id: owner.id })
      .andWhere('truck.id = :truckId', { truckId })
      .getOne();

    return {
      travelTimeInMinutes: invoice?.travelTime ? invoice.travelTime : '00:00',
    };
  }

  findDriverJobInvoiceForContractor(
    contractor: Contractor,
    driverJobInvoiceId: string,
  ): Promise<DriverJobInvoice> {
    return this.findDriverJobInvoiceQuery()
      .where('driverInvoice.id = :driverJobInvoiceId', { driverJobInvoiceId })
      .andWhere('user.id = :id', { id: contractor.id })
      .getOne();
  }

  findDriverInvoicesForContractor(
    contractor: Contractor,
    { skip, count, from, to, projectId, customerId, truckId },
  ): Promise<DriverJobInvoice[]> {
    const query = this.findDriverJobInvoiceQuery().where('user.id = :id', {
      id: contractor.id,
    });

    if (from) {
      query.andWhere('timeEntries.startDate > :from', {
        from: new Date(from).toISOString(),
      });
    }

    if (to) {
      query.andWhere('timeEntries.endDate < :to', {
        to: new Date(to).toISOString(),
      });
    }

    if (projectId) {
      query
        .leftJoinAndSelect('job.generalJob', 'generalJob')
        .andWhere('generalJob.id = :projectId', { projectId });
    }

    if (customerId) {
      query
        .leftJoinAndSelect('job.generalJob', 'generalJob')
        .andWhere('generalJob.customerId = :customerId', { customerId });
    }

    if (truckId) {
      query.andWhere('driverInvoice.truckId = :truckId', { truckId });
    }

    return query
      .skip(skip)
      .take(count)
      .getMany();
  }

  findDriverJobInvoiceForAdmin(
    driverJobInvoiceId: string,
  ): Promise<DriverJobInvoice> {
    return this.findDriverJobInvoiceQuery()
      .where('driverInvoice.id = :driverJobInvoiceId', { driverJobInvoiceId })
      .getOne();
  }

  async payDriverTickets(
    tickets: string[],
    paidWith: PaymentMethod,
    orderNumber: string,
    accountNumber: string,
  ): Promise<void> {
    try {
      await this.driverJobInvoiceRepo
        .createQueryBuilder()
        .update(DriverJobInvoice)
        .set({
          isPaid: true,
          paidWith,
          orderNumber,
          accountNumber,
          paidAt: new Date().toISOString(),
        })
        .where('id IN (:...tickets)', { tickets })
        .execute();
    } catch (err) {
      throw new Error(err);
    }
  }

  async editPaidTickets(
    tickets: string[],
    orderNumber: string,
    accountNumber: string,
  ): Promise<void> {
    try {
      await this.driverJobInvoiceRepo
        .createQueryBuilder()
        .update(DriverJobInvoice)
        .set({
          isPaid: true,
          orderNumber,
          accountNumber,
        })
        .where('id IN (:...tickets)', { tickets })
        .execute();
    } catch (err) {
      throw new Error(err);
    }
  }
}
