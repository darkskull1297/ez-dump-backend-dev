import { Controller, Delete, Param, Post } from '@nestjs/common';
import { NotificationService } from '../../notification.service';

@Controller('foreman/notifications')
export class ForemanNotificationsController {
  constructor(private readonly notificationService: NotificationService) {}
  @Delete('delete/:id')
  async deleteNotifications(@Param('id') id: string): Promise<boolean> {
    try {
      return await this.notificationService.remove(id);
    } catch (error) {
      return error;
    }
  }

  @Post('check/:id')
  async checkNotification(@Param('id') id: string): Promise<boolean> {
    try {
      return await this.notificationService.markAsChecked(id);
    } catch (error) {
      return error;
    }
  }
}
