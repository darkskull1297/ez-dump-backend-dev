import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseRepository } from '../common/base.repository';
import { JobNotification } from './job-notification.model';

@Injectable()
export class JobNotificationRepo extends BaseRepository<JobNotification>(
  JobNotification,
) {
  constructor(
    @InjectRepository(JobNotification)
    private readonly jobNotificationRepo: Repository<JobNotification>,
  ) {
    super(jobNotificationRepo);
  }

  async saveNotification(
    notification: Omit<JobNotification, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<JobNotification> {
    const savedNofitication = await this.jobNotificationRepo.save(notification);

    return savedNofitication;
  }
}
