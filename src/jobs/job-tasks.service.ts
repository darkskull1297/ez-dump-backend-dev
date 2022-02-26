/* eslint-disable no-console */
import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { JobsService } from './jobs.service';
import { TruckService } from '../trucks/truck.service';

@Injectable()
export class JobsTasksService {
  constructor(
    private readonly jobService: JobsService,
    private readonly truckService: TruckService,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  handleNotStartedJobs(): void {
    this.jobService.handleNotStartedJobs();
  }

  @Cron(CronExpression.EVERY_6_HOURS)
  handleJobsNotFilledOut(): void {
    this.jobService.handleJobsNotFilledOut();
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  handleJobsLimitTime(): void {
    this.jobService.handleJobsStartedLimitTime();
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  handleJobsStartedNotFinished(): void {
    this.jobService.handlePendingJobsNotFinished();
    this.jobService.handleStartedJobsNotFinished();
  }

  @Cron(CronExpression.EVERY_5_MINUTES)
  handleDriverNotificationClockIn(): void {
    console.log('Notifying driver clock in CRON');
    this.jobService.notifyDriverClockIn();
  }

  @Cron(CronExpression.EVERY_HOUR)
  handleAutoPunchOut(): void {
    console.log('Auto punching out');
    this.truckService.handleAutoPunchOutTrucks();
  }
}
