import { Injectable } from '@nestjs/common';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { BaseRepository } from '../common/base.repository';
import { DisputeInvoice } from './dispute-invoice.model';
import { Contractor } from '../user/contractor.model';
import { Owner } from '../user/owner.model';

@Injectable()
export class DisputeInvoiceRepo extends BaseRepository<DisputeInvoice>(
  DisputeInvoice,
) {
  constructor(
    @InjectRepository(DisputeInvoice)
    private readonly disputeInvoiceRepo: Repository<DisputeInvoice>,
  ) {
    super(disputeInvoiceRepo);
  }

  findDisputesDriverInvoiceAdmin({ skip, count }): Promise<DisputeInvoice[]> {
    return this.findDisputeInvoiceQuery()
      .where('disputeInvoice.driverJobInvoice is not NULL')
      .skip(skip)
      .take(count)
      .getMany();
  }

  findDisputesAdmin({ skip, count }): Promise<DisputeInvoice[]> {
    return this.findDisputeInvoiceQuery()
      .innerJoinAndSelect(
        'disputeInvoice.previousDriverInvoice',
        'previousDriverInvoice',
      )
      .innerJoinAndSelect('previousDriverInvoice.job', 'job')
      .skip(skip)
      .take(count)
      .getMany();
  }

  findDisputesOwnerInvoiceAdmin({ skip, count }): Promise<DisputeInvoice[]> {
    return this.findDisputeInvoiceQuery()
      .where('disputeInvoice.ownerJobInvoice is not NULL')
      .skip(skip)
      .take(count)
      .getMany();
  }

  private findDisputeInvoiceQuery(): SelectQueryBuilder<DisputeInvoice> {
    return this.disputeInvoiceRepo
      .createQueryBuilder('disputeInvoice')
      .leftJoinAndSelect('disputeInvoice.driverJobInvoice', 'driverJobInvoice')
      .leftJoinAndSelect('disputeInvoice.ownerJobInvoice', 'ownerJobInvoice')
      .leftJoinAndSelect('ownerJobInvoice.job', 'driverJob')
      .leftJoinAndSelect('driverJobInvoice.job', 'ownerJob')
      .leftJoinAndSelect('disputeInvoice.requestBy', 'requestBy');
  }

  findDisputeInvoiceForContractor(
    contractor: Contractor,
    disputeInvoiceId: string,
  ): Promise<DisputeInvoice> {
    return this.findDisputeInvoiceQuery()
      .leftJoinAndSelect('driverJobInvoice.driver', 'driver')
      .leftJoinAndSelect('driverJobInvoice.timeEntries', 'timeEntries')
      .leftJoinAndSelect('driverJobInvoice.truck', 'truck')
      .leftJoinAndSelect('driverJobInvoice.category', 'category')
      .leftJoinAndSelect('driverJobInvoice.ownerInvoice', 'ownerInvoice')
      .where('disputeInvoice.id = :disputeInvoiceId', { disputeInvoiceId })
      .getOne();
  }

  findDisputeInvoiceForAdmin(
    disputeInvoiceId: string,
  ): Promise<DisputeInvoice> {
    return this.findDisputeInvoiceQuery()
      .leftJoinAndSelect('driverJobInvoice.driver', 'driver')
      .leftJoinAndSelect('driverJobInvoice.timeEntries', 'timeEntries')
      .leftJoinAndSelect('driverJobInvoice.truck', 'truck')
      .leftJoinAndSelect('driverJobInvoice.category', 'category')
      .leftJoinAndSelect('driverJobInvoice.ownerInvoice', 'ownerInvoice')
      .leftJoinAndSelect('disputeInvoice.disputeLoads', 'loads')
      .leftJoinAndSelect('loads.truck', 'loadTruck')
      .leftJoinAndSelect('loads.assignation', 'assignation')
      .leftJoinAndSelect('loads.job', 'job')
      .leftJoinAndSelect(
        'disputeInvoice.resultDriverJobInvoice',
        'resultDriverJobInvoice',
      )
      .leftJoinAndSelect(
        'resultDriverJobInvoice.ownerInvoice',
        'resultOwnerInvoice',
      )
      .leftJoinAndSelect(
        'disputeInvoice.previousDriverInvoice',
        'previousDriverInvoice',
      )
      .leftJoinAndSelect('previousDriverInvoice.truck', 'previousTruck')
      .leftJoinAndSelect('previousDriverInvoice.driver', 'previousDriver')
      .leftJoinAndSelect(
        'previousDriverInvoice.ownerInvoice',
        'previousOwnerInvoice',
      )
      .leftJoinAndSelect('previousDriverInvoice.job', 'driverInvoiceJob')
      .leftJoinAndSelect('previousDriverInvoice.category', 'previousCategory')
      .leftJoinAndSelect('previousCategory.assignation', 'previousAssignation')
      .where('disputeInvoice.id = :disputeInvoiceId', { disputeInvoiceId })
      .getOne();
  }

  findDisputeInvoiceForOwner(
    owner: Owner,
    disputeInvoiceId: string,
  ): Promise<DisputeInvoice> {
    return this.findDisputeInvoiceQuery()
      .leftJoinAndSelect('ownerJobInvoice.owner', 'owner')
      .leftJoinAndSelect('ownerJobInvoice.scheduledJob', 'scheduledJob')
      .where('disputeInvoice.id = :disputeInvoiceId', { disputeInvoiceId })
      .getOne();
  }

  findDisputeByTicket(ticketId: string): Promise<DisputeInvoice> {
    return this.disputeInvoiceRepo
      .createQueryBuilder()
      .where(
        '"driverJobInvoiceId" = :ticketId OR "previousDriverInvoiceId" = :ticketId',
        { ticketId },
      )
      .getOne();
  }
}
