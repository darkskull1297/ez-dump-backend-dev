import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { BaseRepository } from '../common/base.repository';
import { DocumentNotFoundException } from '../common/exceptions/document-not-found.exception';
import { User } from '../user/user.model';

import { Notification } from './notification.model';

@Injectable()
export class NotificationRepo extends BaseRepository<Notification>(
  Notification,
) {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
  ) {
    super(notificationRepo);
  }

  async saveNotification(
    notification: Omit<Notification, 'id' | 'createdAt' | 'updatedAt'>,
  ): Promise<Notification> {
    const savedNofitication = await this.notificationRepo.save(notification);

    return savedNofitication;
  }

  async checkNotification(id: string): Promise<boolean> {
    const notification = await this.notificationRepo.findOne({ id });

    if (!notification) {
      throw new DocumentNotFoundException('Not found');
    }

    notification.isChecked = true;
    this.notificationRepo.save(notification);

    return true;
  }

  async deleteNotification(id: string): Promise<object> {
    const deleteMotification = await this.notificationRepo.delete(id);

    return deleteMotification;
  }

  async getNotifications(user: User): Promise<Notification[]> {
    const notifications = this.findNotifications()
      .where('user.id = :id', { id: user.id })
      .orderBy('submitted', 'DESC')
      .getMany();

    return notifications;
  }

  private findNotifications(): SelectQueryBuilder<Notification> {
    return this.notificationRepo
      .createQueryBuilder('notification')
      .leftJoinAndSelect('notification.user', 'user');
  }

  async deleteJobNotification(id: string, userID: string): Promise<void> {
    await this.notificationRepo.query(
      `DELETE FROM job_notification WHERE "jobId" = '${id}' AND "userId" = '${userID}'`,
    );
  }

  async getJobNotification(jobID: string): Promise<void> {
    return this.notificationRepo.query(
      `SELECT message, "cancelJob", "isAutomaticallyFinished", "jobId" FROM job_notification WHERE "jobId" = '${jobID}'`,
    );
  }
}
