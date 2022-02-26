import { forwardRef, Module } from '@nestjs/common';
import { AdminNotificationsController } from './admin.controller';
import { NotificationModule } from '../../notification.module';
import { Notification } from '../../notification.model';
import { NotificationRepo } from '../../notification.repository';

@Module({
  imports: [forwardRef(() => NotificationModule)],
  controllers: [AdminNotificationsController],
})
export class AdminNotificationsModule {}
