import { Controller, Delete, Param, Post } from '@nestjs/common';
import { NotificationService } from '../../notification.service';

@Controller('dispatcher/notifications')
export class DispatcherNotificationsController {
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
