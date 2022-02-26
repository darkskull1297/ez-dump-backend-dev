import { Injectable } from '@nestjs/common';
import { Notification } from './notification.model';
import { UserRepo } from '../user/user.repository';
import { NotificationDTO } from './notification.dto';
import { NotificationRepo } from './notification.repository';
import { User } from '../user/user.model';

@Injectable()
export class NotificationService {
  constructor(
    private readonly notificationRepo: NotificationRepo,
    private readonly userRepo: UserRepo,
  ) {}

  async createNotification({
    title,
    content,
    submitted,
    isChecked,
    priority,
    userId,
    link,
  }: NotificationDTO): Promise<Notification> {
    const user = await this.userRepo.findOne({ id: userId });
    const notification = await this.notificationRepo.saveNotification({
      title,
      content,
      submitted,
      isChecked,
      priority,
      user,
      link,
    });

    return notification;
  }

  async getNotifications(user: User): Promise<Notification[]> {
    const notifications = await this.notificationRepo.getNotifications(user);

    return notifications;
  }

  async deleteNotifications(id: string): Promise<object> {
    const notifications = await this.notificationRepo.deleteNotification(id);

    return notifications;
  }

  async markAsChecked(id: string): Promise<boolean> {
    const notification = await this.notificationRepo.checkNotification(id);

    return notification;
  }

  async remove(id: string): Promise<boolean> {
    const notification = await this.notificationRepo.remove(id);
    return !!notification;
  }
}
