import { Injectable } from '@nestjs/common';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';

import { startOfISOWeek } from 'date-fns';
import { BaseRepository } from '../common/base.repository';
import { DriverWeeklyInvoice } from './driver-weekly-invoice.model';
import { TimeEntryRepo } from '../timer/time-entry.repository';
import { Driver } from '../user/driver.model';
import { Owner } from '../user/owner.model';

@Injectable()
export class DriverWeeklyInvoiceRepo extends BaseRepository<
DriverWeeklyInvoice
>(DriverWeeklyInvoice) {
  constructor(
    @InjectRepository(DriverWeeklyInvoice)
    private readonly driverWeeklyInvoiceRepo: Repository<DriverWeeklyInvoice>,
    private readonly timeEntryRepo: TimeEntryRepo,
  ) {
    super(driverWeeklyInvoiceRepo);
  }

  async saveAll(
    invoices: DriverWeeklyInvoice[],
  ): Promise<DriverWeeklyInvoice[]> {
    const invoicesToSave = invoices.map(
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      ({ timeEntries, ...invoice }) => invoice,
    );
    const saved = await this.driverWeeklyInvoiceRepo.save(invoicesToSave);
    const timeEntries = invoices.reduce((acc, invoice, index) => {
      const selectedInvoice = saved[index];
      const invoiceTimeEntries = invoice.timeEntries.map(timeEntry => ({
        ...timeEntry,
        weeklyInvoice: selectedInvoice,
      }));
      return [...acc, ...invoiceTimeEntries];
    }, []);
    await this.timeEntryRepo.saveAll(timeEntries);
    return saved;
  }

  findOwnerInvoiceById(
    owner: Owner,
    weeklyInvoiceId,
  ): Promise<DriverWeeklyInvoice> {
    return this.findInvoicesQuery()
      .leftJoinAndSelect('timeEntry.driverJobInvoice', 'driverJobInvoice')
      .leftJoinAndSelect('timeEntry.job', 'entryJob')
      .leftJoinAndSelect('job.truckCategories', 'categories')
      .leftJoinAndSelect('entryJob.truckCategories', 'entryCat')
      .leftJoin('driver.drivingFor', 'drivingFor')
      .leftJoin('drivingFor.owner', 'owner')
      .where('owner.id = :id', { id: owner.id })
      .andWhere('invoice.id = :weeklyInvoiceId', { weeklyInvoiceId })
      .orderBy('invoice.createdAt', 'ASC')
      .getOne();
  }

  findDriverInvoices(
    driver: Driver,
    { skip, count },
  ): Promise<DriverWeeklyInvoice[]> {
    return this.findInvoicesQuery()
      .leftJoinAndSelect('timeEntry.driverJobInvoice', 'driverJobInvoice')
      .leftJoinAndSelect('timeEntry.job', 'entryJob')
      .leftJoinAndSelect('entryJob.user', 'user')
      .leftJoinAndSelect('timeEntry.truck', 'entryTruck')
      .where('driver.id = :id', { id: driver.id })
      .skip(skip)
      .take(count)
      .orderBy('invoice.createdAt', 'ASC')
      .getMany();
  }

  findDriverInvoicesFromOwner(
    driverId: string,
    { skip, count },
  ): Promise<DriverWeeklyInvoice[]> {
    return this.findInvoicesQuery()
      .leftJoinAndSelect('timeEntry.driverJobInvoice', 'driverJobInvoice')
      .leftJoinAndSelect('timeEntry.job', 'entryJob')
      .leftJoinAndSelect('entryJob.user', 'user')
      .leftJoinAndSelect('timeEntry.truck', 'entryTruck')
      .where('driver.id = :id', { id: driverId })
      .skip(skip)
      .take(count)
      .orderBy('invoice.createdAt', 'ASC')
      .getMany();
  }

  findDriverInvoiceFromOwner(invoiceId: string): Promise<DriverWeeklyInvoice> {
    return this.findInvoicesQuery()
      .leftJoinAndSelect('timeEntry.driverJobInvoice', 'driverJobInvoice')
      .leftJoinAndSelect('timeEntry.job', 'entryJob')
      .leftJoinAndSelect('entryJob.user', 'user')
      .leftJoinAndSelect('timeEntry.truck', 'entryTruck')
      .where('invoice.id = :id', { id: invoiceId })
      .getOne();
  }

  findAllDriverInvoicesFromOwner(
    driverId: string,
  ): Promise<DriverWeeklyInvoice[]> {
    return this.findInvoicesQuery()
      .leftJoinAndSelect('timeEntry.driverJobInvoice', 'driverJobInvoice')
      .leftJoinAndSelect('timeEntry.job', 'entryJob')
      .leftJoinAndSelect('entryJob.scheduledJobs', 'scheduledJobs')
      .leftJoinAndSelect('scheduledJobs.assignations', 'assignations')
      .leftJoinAndSelect('entryJob.user', 'user')
      .leftJoinAndSelect('timeEntry.truck', 'entryTruck')
      .where('driver.id = :id', { id: driverId })
      .andWhere('assignations.driver.id = :driverId', { driverId })
      .getMany();
  }

  findAllCurrentDriverInvoicesFromOwner(
    driverId: string,
  ): Promise<DriverWeeklyInvoice[]> {
    return this.findInvoicesQuery()
      .leftJoinAndSelect('timeEntry.driverJobInvoice', 'driverJobInvoice')
      .leftJoinAndSelect('timeEntry.job', 'entryJob')
      .leftJoinAndSelect('entryJob.user', 'user')
      .leftJoinAndSelect('timeEntry.truck', 'entryTruck')
      .where('driver.id = :id', { id: driverId })
      .andWhere('job.startDate BETWEEN :start AND :end', {
        end: new Date().toISOString(),
        start: startOfISOWeek(new Date()).toISOString(),
      })
      .getMany();
  }

  findOwnerInvoices(
    owner: Owner,
    { skip, count },
  ): Promise<DriverWeeklyInvoice[]> {
    return this.findInvoicesQuery()
      .leftJoin('driver.drivingFor', 'drivingFor')
      .leftJoin('drivingFor.owner', 'owner')
      .leftJoinAndSelect('timeEntry.driverJobInvoice', 'driverJobInvoice')
      .leftJoinAndSelect('timeEntry.job', 'entryJob')
      .leftJoinAndSelect('timeEntry.truck', 'truck')
      .where('owner.id = :id', { id: owner.id })
      .andWhere('driver.isDisable = false')
      .skip(skip)
      .take(count)
      .orderBy('invoice.createdAt', 'ASC')
      .getMany();
  }

  findAdminInvoices({ skip, count }): Promise<DriverWeeklyInvoice[]> {
    return this.findInvoicesQuery()
      .skip(skip)
      .take(count)
      .orderBy('invoice.createdAt', 'ASC')
      .getMany();
  }

  private findInvoicesQuery(): SelectQueryBuilder<DriverWeeklyInvoice> {
    return this.driverWeeklyInvoiceRepo
      .createQueryBuilder('invoice')
      .leftJoinAndSelect('invoice.driver', 'driver')
      .leftJoinAndSelect('invoice.jobs', 'job')
      .leftJoinAndSelect('invoice.timeEntries', 'timeEntry')
      .leftJoinAndSelect('invoice.truckPunchs', 'truckPunchs');
  }

  async findAllOwnerDriversInvoices(
    owner: Owner,
    isPaid: boolean,
  ): Promise<number> {
    const query = this.driverWeeklyInvoiceRepo
      .createQueryBuilder('invoice')
      .select('SUM(invoice.amount)', 'sum')
      .leftJoin('invoice.driver', 'driver')
      .leftJoin('invoice.jobs', 'job')
      .leftJoin('invoice.timeEntries', 'timeEntry')
      .leftJoin('driver.drivingFor', 'drivingFor')
      .leftJoin('drivingFor.owner', 'owner')
      .where('owner.id = :id', { id: owner.id })
      .andWhere('invoice.isPaid = :isPaid', { isPaid });
    const { sum } = await query.getRawOne();
    if (sum) return sum;
    return 0;
  }
}
