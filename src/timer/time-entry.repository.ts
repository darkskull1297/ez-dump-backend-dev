import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { subWeeks, startOfToday } from 'date-fns';
import { TimeEntry } from './time-entry.model';
import { User } from '../user/user.model';
import { Owner } from '../user/owner.model';
import { BaseRepository } from '../common/base.repository';
import { JobAssignation } from '../jobs/job-assignation.model';

@Injectable()
export class TimeEntryRepo extends BaseRepository<TimeEntry>(TimeEntry) {
  constructor(
    @InjectRepository(TimeEntry)
    private readonly timeEntryRepo: Repository<TimeEntry>,
  ) {
    super(timeEntryRepo);
  }

  create(
    timeEntry: Omit<TimeEntry, 'id' | 'createdAt' | 'updatedAt' | 'startDate'>,
  ): Promise<TimeEntry> {
    this.timeEntryRepo.create(timeEntry);
    return this.timeEntryRepo.save(timeEntry);
  }

  save(timeEntry: TimeEntry): Promise<TimeEntry> {
    return this.timeEntryRepo.save(timeEntry);
  }

  saveAll(timeEntries: TimeEntry[]): Promise<TimeEntry[]> {
    return this.timeEntryRepo.save(timeEntries);
  }

  findActive(user: User): Promise<TimeEntry> {
    return this.timeEntryRepo.findOne({
      user: { id: user.id },
      endDate: null,
    });
  }

  findActiveByJobId(user: User, jobId: string): Promise<TimeEntry> {
    return this.timeEntryRepo.findOne({
      user: { id: user.id },
      job: { id: jobId },
      endDate: null,
    });
  }

  findOwnerActive(owner: Owner): Promise<TimeEntry[]> {
    return this.timeEntryRepo
      .createQueryBuilder('timeEntry')
      .leftJoinAndSelect('timeEntry.user', 'driver')
      .leftJoinAndSelect('timeEntry.truck', 'truck')
      .leftJoin('driver.drivingFor', 'company')
      .leftJoin('company.owner', 'owner')
      .where('owner.id = :id', { id: owner.id })
      .andWhere('timeEntry.endDate IS NULL')
      .getMany();
  }

  findAllActive(): Promise<TimeEntry[]> {
    return this.timeEntryRepo.find({
      where: { endDate: null },
      relations: ['user', 'truck'],
    });
  }

  async findTimeEntriesForUserAndJob(
    user: User,
    jobId: string,
    assignation?: JobAssignation,
  ): Promise<TimeEntry[]> {
    let query: any;

    if (assignation) {
      query = await this.timeEntryRepo.find({
        where: {
          user: { id: user?.id },
          job: { id: jobId },
          driverAssignation: { id: assignation.id },
        },
        relations: ['user'],
      });
    } else {
      query = await this.timeEntryRepo.find({
        where: {
          user: { id: user?.id },
          job: { id: jobId },
        },
        relations: ['user'],
      });
    }

    return query;
  }

  findWeeklyTimeEntriesForUser(userId: string): Promise<TimeEntry[]> {
    return this.timeEntryRepo
      .createQueryBuilder('timeEntry')
      .leftJoinAndSelect('timeEntry.user', 'driver')
      .leftJoinAndSelect('timeEntry.truck', 'truck')
      .leftJoinAndSelect('timeEntry.job', 'job')
      .leftJoinAndSelect('timeEntry.driverJobInvoice', 'driverInvoice')
      .where('driver.id = :id', { id: userId })
      .andWhere('timeEntry.endDate IS NOT NULL')
      .andWhere('timeEntry.endDate > :weekAgo', {
        weekAgo: subWeeks(new Date(), 1).toISOString(),
      })
      .andWhere('timeEntry.endDate < :day', {
        day: startOfToday().toISOString(),
      })
      .getMany();
  }

  findWeeklyTimeEntriesFromDate(
    userId: string,
    from: string,
  ): Promise<TimeEntry[]> {
    return this.timeEntryRepo
      .createQueryBuilder('timeEntry')
      .leftJoinAndSelect('timeEntry.user', 'driver')
      .leftJoinAndSelect('timeEntry.truck', 'truck')
      .leftJoinAndSelect('timeEntry.job', 'job')
      .leftJoinAndSelect('timeEntry.driverJobInvoice', 'driverInvoice')
      .where('driver.id = :id', { id: userId })
      .andWhere('timeEntry.endDate IS NOT NULL')
      .andWhere('timeEntry.endDate > :from', { from })
      .getMany();
  }

  updateLoadTimeWhenFinishing(jobId: string, truckId: string): Promise<any> {
    return this.timeEntryRepo.query(
      `
      UPDATE loads SET "dumpLeave" = $1 WHERE "jobId" = $2 AND "truckId" = $3 AND "dumpLeave" IS NULL
    `,
      [new Date(), jobId, truckId],
    );
  }
}
